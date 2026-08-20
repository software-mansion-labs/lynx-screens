#import "RNSStackHeaderConfigComponent.h"
#import "RNSImageLoadingHelper.h"
#import "RNSShadowStateProxy.h"
#import "RNSStackHeaderConfigEventEmitter.h"
#import "RNSStackHeaderItemComponent.h"
#import "RNSStackHeaderItemSpacerComponent.h"
#import "RNSStackHeaderConfigView.h"
#import "RNSStackNavigationController.h"
#import "RNSStackScreenComponent.h"
#import "RNSStackScreenController.h"
#import "RNSStackScreenHeaderCoordinator.h"

#import <Lynx/LynxComponentRegistry.h>
#import <Lynx/LynxLog.h>
#import <Lynx/LynxPropsProcessor.h>

static void RNSAssertIsValidHeaderChild(id child)
{
    NSCAssert([child isKindOfClass:RNSStackHeaderItemComponent.class] ||
                  [child isKindOfClass:RNSStackHeaderItemSpacerComponent.class],
              @"[RNScreens] Unexpected child of type: %@, expected %@ or %@",
              [child class],
              RNSStackHeaderItemComponent.class,
              RNSStackHeaderItemSpacerComponent.class);
}

@LynxElement("ls-stack-header-config")
@implementation RNSStackHeaderConfigComponent {
    RNSShadowStateProxy *_Nonnull _shadowStateProxy;
    RNSStackHeaderConfigEventEmitter *_Nullable _eventEmitter;
}

- (instancetype)init
{
    if (self = [super init]) {
        _shadowStateProxy = [[RNSShadowStateProxy alloc] initWithLynxUI:self];
        [self resetProps];
    }
    return self;
}

- (void)resetProps
{
    _title = nil;
    _subtitle = nil;
    _hidden = NO;
    _largeTitle = nil;
    _largeSubtitle = nil;
    _largeTitleEnabled = NO;
}

- (UIView *)createView
{
    RNSStackHeaderConfigView *configView = [[RNSStackHeaderConfigView alloc] init];
    configView.component = self;
    // The config view overlays the screen; it must not intercept touches meant
    // for the content beneath it (header items are hit-tested separately).
    configView.userInteractionEnabled = NO;
    return configView;
}

/**
 * The Lynx engine must not position the children views - they are reparented
 * into the navigation bar which UIKit lays out (counterpart of RNS's
 * updateLayoutMetrics override on the item view).
 */
- (BOOL)hasCustomLayout
{
    return YES;
}

#pragma mark - RNSImageLoading

// Adaptation: RNS resolves an RCTImageSource from the RN asset object and
// loads it through RCTImageLoader obtained from the shadow-node state; on
// Lynx the source is a plain { uri } dictionary loaded through the shared
// LynxImageLoader, so no loader instance is plumbed through state.
- (void)loadImageFromJsonSource:(NSDictionary *)jsonSource
                     asTemplate:(BOOL)isTemplate
         withCompletionCallback:(void (^)(UIImage *_Nullable image))completionBlock
{
    NSString *uri = jsonSource[@"uri"];
    if (![uri isKindOfClass:[NSString class]] || uri.length == 0) {
        LLogError(@"[RNScreens] Expected nonnil image source");
        completionBlock(nil);
        return;
    }

    [RNSImageLoadingHelper loadImageFromURI:uri asTemplate:isTemplate completionBlock:completionBlock];
}

#pragma mark - UIView lifecycle

- (void)viewDidMoveToWindow
{
    if (self.view.window != nil) {
        [[self requireNavigationController] setNavigationBarFrameChangeDelegate:self];
        RNSStackScreenHeaderCoordinator *coordinator = [self headerCoordinator];
        coordinator.configDataProvider = self;
        coordinator.frameChangeDelegate = self;
        coordinator.eventsDelegate = self;
        coordinator.imageLoader = self;
        [coordinator rebuild];
    } else {
        RNSStackScreenHeaderCoordinator *coordinator = [self headerCoordinator];
        coordinator.configDataProvider = nil;
        coordinator.frameChangeDelegate = nil;
        coordinator.eventsDelegate = nil;
        coordinator.imageLoader = nil;
    }
}

#pragma mark - Children Lifecycle

- (void)insertChild:(id)child atIndex:(NSInteger)index
{
    RNSAssertIsValidHeaderChild(child);

    // The view-level insertion is dropped by RNSStackHeaderConfigView - the
    // child is only registered in the Lynx component tree here and read by
    // the coordinator during rebuild.
    [super insertChild:child atIndex:index];

    if ([child isKindOfClass:RNSStackHeaderItemComponent.class]) {
        ((RNSStackHeaderItemComponent *)child).invalidationDelegate = self;
    } else if ([child isKindOfClass:RNSStackHeaderItemSpacerComponent.class]) {
        ((RNSStackHeaderItemSpacerComponent *)child).invalidationDelegate = self;
    }

    [[self headerCoordinator] rebuild];
}

- (void)removeChild:(id)child atIndex:(NSInteger)index
{
    RNSAssertIsValidHeaderChild(child);

    if ([child isKindOfClass:RNSStackHeaderItemComponent.class]) {
        ((RNSStackHeaderItemComponent *)child).invalidationDelegate = nil;
    } else if ([child isKindOfClass:RNSStackHeaderItemSpacerComponent.class]) {
        ((RNSStackHeaderItemSpacerComponent *)child).invalidationDelegate = nil;
    }

    [super removeChild:child atIndex:index];
    [[self headerCoordinator] rebuild];
}

#pragma mark - RNSStackHeaderItemInvalidationDelegate

- (void)headerItemDidInvalidateWithId:(NSString *)itemId
{
    if (itemId == nil) {
        LLogWarn(@"[RNScreens] headerItemDidInvalidateWithId called with nil id, will run full header rebuild");
        [[self headerCoordinator] rebuild];
        return;
    }
    [[self headerCoordinator] rebuildItemWithId:itemId];
}

- (void)headerItemMenuDidChangeWithId:(NSString *)itemId
{
    if (itemId == nil) {
        LLogWarn(@"[RNScreens] headerItemMenuDidChangeWithId called with nil id, will run full header rebuild");
        [[self headerCoordinator] rebuild];
        return;
    }
    RNSStackScreenHeaderCoordinator *coordinator = [self headerCoordinator];
    [coordinator resetTrackerForItemWithId:itemId];
    [coordinator reapplyMenuForItemWithId:itemId];
}

- (void)headerItemSpacerDidInvalidate
{
    [[self headerCoordinator] rebuild];
}

#pragma mark - RNSStackHeaderEventsDelegate

- (RNSStackHeaderConfigEventEmitter *)getEventEmitter
{
    if (!_eventEmitter && self.context) {
        _eventEmitter = [[RNSStackHeaderConfigEventEmitter alloc] initWithEventEmitter:self.context.eventEmitter
                                                                            targetSign:[self sign]];
    }
    return _eventEmitter;
}

- (void)didPressMenuItem:(NSString *)menuItemId
{
    [[self getEventEmitter] emitOnMenuItemPress:menuItemId];
}

- (void)didChangeSelectionForMenu:(NSString *)menuId selectedMenuItemIds:(NSArray<NSString *> *)selectedIds
{
    [[self getEventEmitter] emitOnMenuSelectionChange:menuId selectedMenuItemIds:selectedIds];
}

- (void)didPressHeaderItem:(NSString *)itemId
{
    for (LynxUI *child in self.children) {
        if ([child isKindOfClass:RNSStackHeaderItemComponent.class]) {
            RNSStackHeaderItemComponent *item = (RNSStackHeaderItemComponent *)child;
            if ([item.itemId isEqualToString:itemId]) {
                [item emitOnPress];
                return;
            }
        }
    }
}

#pragma mark - RNSViewFrameChangeDelegate

- (void)viewFrameDidChange:(nonnull UINavigationBar *)navigationBar
{
    RNSStackScreenComponent *screen = [self stackScreen];
    if (screen == nil) {
        return;
    }

    // Divergence from RNS: per-item shadow-state origin corrections are not
    // forwarded - item views are positioned natively by UIKit and the Lynx
    // layout offsets are never applied to them (see the shadow node docs).
    // Only the header frame is pushed so the config subtree is measured
    // against the real navigation bar size.
    CGRect navBarFrame = [navigationBar convertRect:navigationBar.bounds toView:screen.view];
    [_shadowStateProxy updateShadowStateWithFrame:navBarFrame];
}

#pragma mark - Props

// Unlike Fabric, Lynx invokes prop setters also for absent/reset props with
// requestReset set - fall back to the default instead of failing.

LYNX_PROP_SETTER("title", setTitle, NSString *) {
    if (requestReset || value.length == 0) {
        value = nil;
    }
    _title = value;
}

LYNX_PROP_SETTER("subtitle", setSubtitle, NSString *) {
    if (requestReset || value.length == 0) {
        value = nil;
    }
    _subtitle = value;
}

LYNX_PROP_SETTER("hidden", setHidden, BOOL) {
    if (requestReset) {
        value = NO;
    }
    _hidden = value;
}

LYNX_PROP_SETTER("largeTitle", setLargeTitle, NSString *) {
    if (requestReset || value.length == 0) {
        value = nil;
    }
    _largeTitle = value;
}

LYNX_PROP_SETTER("largeSubtitle", setLargeSubtitle, NSString *) {
    if (requestReset || value.length == 0) {
        value = nil;
    }
    _largeSubtitle = value;
}

LYNX_PROP_SETTER("largeTitleEnabled", setLargeTitleEnabled, BOOL) {
    if (requestReset) {
        value = NO;
    }
    _largeTitleEnabled = value;
}

// Base props consumed only by the Android implementation for now (RNS iOS
// also receives and ignores them in this commit).
LYNX_PROP_SETTER("transparent", setTransparent, BOOL) {}
LYNX_PROP_SETTER("backButtonHidden", setBackButtonHidden, BOOL) {}

- (void)propsDidUpdate
{
    [super propsDidUpdate];
    [[self headerCoordinator] applyConfigProperties];
}

#pragma mark - Hit testing

/**
 * Divergence from RNS: on Lynx the engine hit-tests its own component tree,
 * which does not know that item views were reparented into the navigation
 * bar. The item views are probed in their actual (window) positions instead -
 * the counterpart of `findUIWithCustomLayout` on the Android StackHost.
 */
- (BOOL)shouldHitTest:(CGPoint)point withEvent:(nullable UIEvent *)event
{
    // `point` is in the parent's (screen) coordinate space here.
    return [self findItemChildAtPoint:point inViewSpace:self.parent.view withEvent:event] != nil;
}

/**
 * The engine gates hitTest with containsPoint, checked against the config's
 * own bounds - which cover the Lynx-measured box at (0, 0), not the
 * navigation bar area where UIKit actually placed the items (the stored
 * content offset is deliberately not applied to the layout). Probe the
 * reparented item views instead, consistently with shouldHitTest / hitTest.
 */
- (BOOL)containsPoint:(CGPoint)point
{
    // `point` is in the config's own coordinate space here.
    return [self findItemChildAtPoint:point inViewSpace:self.view withEvent:nil] != nil;
}

- (id<LynxEventTarget>)hitTest:(CGPoint)point withEvent:(nullable UIEvent *)event
{
    // `point` is in the config's coordinate space here.
    RNSStackHeaderItemComponent *item = [self findItemChildAtPoint:point inViewSpace:self.view withEvent:event];
    if (item != nil) {
        CGPoint itemPoint = [self.view convertPoint:point toView:item.view];
        return [item hitTest:itemPoint withEvent:event];
    }
    return self;
}

- (nullable RNSStackHeaderItemComponent *)findItemChildAtPoint:(CGPoint)point
                                                   inViewSpace:(nullable UIView *)referenceView
                                                     withEvent:(nullable UIEvent *)event
{
    if (referenceView == nil || referenceView.window == nil) {
        return nil;
    }
    for (LynxUI *child in [self.children reverseObjectEnumerator]) {
        if (![child isKindOfClass:RNSStackHeaderItemComponent.class]) {
            continue;
        }
        RNSStackHeaderItemComponent *item = (RNSStackHeaderItemComponent *)child;
        if (item.view.window == nil || item.view.isHidden) {
            continue;
        }
        CGPoint itemPoint = [referenceView convertPoint:point toView:item.view];
        if ([item.view pointInside:itemPoint withEvent:event]) {
            return item;
        }
        // Counterpart of RNS's custom header hitTest that probes the item's
        // child views directly (in RNS the react subviews' hitTest honors
        // hitSlop): a point outside the item bounds may still fall within a
        // child's hit-slop, so probe the Lynx children with their
        // hit-slop-aware containsPoint.
        for (LynxUI *itemChild in [item.children reverseObjectEnumerator]) {
            CGPoint childPoint = [referenceView convertPoint:point toView:itemChild.view];
            if ([itemChild containsPoint:childPoint]) {
                return item;
            }
        }
    }
    return nil;
}

#pragma mark - Private

- (nullable RNSStackScreenHeaderCoordinator *)headerCoordinator
{
    if (self.parent == nil) {
        return nil;
    }
    NSAssert([self.parent isKindOfClass:RNSStackScreenComponent.class],
             @"[RNScreens] Header Config should be a direct child of RNSStackScreenComponent");
    RNSStackScreenComponent *screen = (RNSStackScreenComponent *)self.parent;
    return screen.controller.headerCoordinator;
}

- (nullable RNSStackScreenComponent *)stackScreen
{
    if ([self.parent isKindOfClass:RNSStackScreenComponent.class]) {
        return (RNSStackScreenComponent *)self.parent;
    }
    return nil;
}

- (RNSStackNavigationController *)requireNavigationController
{
    RNSStackScreenComponent *screen = [self stackScreen];
    NSAssert(screen != nil, @"[RNScreens] Header Config should be a direct child of RNSStackScreenComponent");
    UINavigationController *navController = screen.controller.navigationController;
    NSAssert(navController != nil, @"[RNScreens] NavigationController should be initialized at this point");
    NSAssert([navController isKindOfClass:RNSStackNavigationController.class],
             @"[RNScreens] NavigationController should be instance of RNSStackNavigationController");
    return (RNSStackNavigationController *)navController;
}

@end
