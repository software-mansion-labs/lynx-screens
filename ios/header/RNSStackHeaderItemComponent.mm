#import "RNSStackHeaderItemComponent.h"
#import "RNSStackHeaderItemEventEmitter.h"
#import "RNSStackHeaderMenuMapper.h"
#import "RNSStackHeaderMenuToggleStateTracker.h"

#import <Lynx/LynxComponentRegistry.h>
#import <Lynx/LynxLog.h>
#import <Lynx/LynxPropsProcessor.h>

#include <cmath>

@LynxElement("ls-stack-header-item")
@implementation RNSStackHeaderItemComponent {
    RNSHeaderItemPlacement _placement;
    BOOL _didSetHeaderItemPlacement;
    NSString *_Nullable _itemId;
    NSString *_Nullable _title;
    RNSStackHeaderMenuData *_Nullable _menu;
    RNSStackHeaderMenuToggleStateTracker *_Nullable _menuToggleStateTracker;
    BOOL _respondsToOnPress;
    BOOL _needsUpdate;
    RNSStackHeaderItemEventEmitter *_Nullable _eventEmitter;
}

- (instancetype)init
{
    if (self = [super init]) {
        [self resetProps];
    }
    return self;
}

- (void)resetProps
{
    _itemId = nil;
    _title = nil;
    _menu = nil;
    _menuToggleStateTracker = nil;
    _placement = RNSHeaderItemPlacementTrailing;
    _didSetHeaderItemPlacement = NO;
    _respondsToOnPress = NO;
    _needsUpdate = NO;
}

// Adaptation: RNS creates the codegen-backed emitter eagerly and refreshes it
// in updateEventEmitter; on Lynx the emitter is resolved lazily from the
// context (same pattern as the config component).
- (RNSStackHeaderItemEventEmitter *)getEventEmitter
{
    if (!_eventEmitter && self.context) {
        _eventEmitter = [[RNSStackHeaderItemEventEmitter alloc] initWithEventEmitter:self.context.eventEmitter
                                                                          targetSign:[self sign]];
    }
    return _eventEmitter;
}

- (void)emitOnPress
{
    [[self getEventEmitter] emitOnPress];
}

- (UIView *)createView
{
    RNSStackHeaderItemView *itemView = [[RNSStackHeaderItemView alloc] init];
    __weak __typeof(self) weakSelf = self;
    itemView.lynxSizeProvider = ^CGSize {
        return weakSelf.updatedFrame.size;
    };
    // For custom items, we rely on `intrinsicContentSize` which passes the
    // Lynx-computed view size to iOS. `intrinsicContentSize` is queried only
    // when opted out of default constraints.
    itemView.translatesAutoresizingMaskIntoConstraints = NO;
    return itemView;
}

- (RNSHeaderItemPlacement)placement
{
    return _placement;
}

#pragma mark - RNSStackHeaderItemDataProviding

- (nullable NSString *)itemId
{
    return _itemId;
}

- (nullable NSString *)title
{
    return _title;
}

- (nullable RNSStackHeaderMenuData *)menu
{
    return _menu;
}

- (nullable RNSStackHeaderMenuToggleStateTracker *)menuToggleStateTracker
{
    return _menuToggleStateTracker;
}

- (nullable UIView *)customView
{
    // Adaptation: on Lynx the item's painting view (not the component itself)
    // is what gets reparented into the navigation bar.
    return self.children.count > 0 ? self.view : nil;
}

- (BOOL)respondsToOnPress
{
    return _respondsToOnPress;
}

#pragma mark - Layout

// The parent header config opts into custom layout, so the Lynx engine does not
// position this view - UIKit does. We only propagate the Lynx-computed size to
// UIKit through the view bounds and intrinsicContentSize (counterpart of RNS's
// updateLayoutMetrics override which skips super to avoid fighting UIKit).
- (void)frameDidChange
{
    [super frameDidChange];

    CGSize size = self.updatedFrame.size;
    if (!std::isfinite(size.width) || !std::isfinite(size.height)) {
        return;
    }

    if (!CGSizeEqualToSize(self.view.bounds.size, size)) {
        // Update view bounds. Irrespective of intrinsic content size, this seems to be required
        // for largeTitle to be laid out correctly within its host view
        // and for UINavigationBar height to acknowledge the item.
        self.view.bounds = CGRectMake(0, 0, size.width, size.height);
        [self.view invalidateIntrinsicContentSize];
    }
}

#pragma mark - Children Lifecycle

- (void)insertChild:(id)child atIndex:(NSInteger)index
{
    [super insertChild:child atIndex:index];

    // An existing item may have transitioned from label-only to custom view,
    // and needs to be rebuilt.
    [_invalidationDelegate headerItemDidInvalidate];
}

- (void)removeChild:(id)child atIndex:(NSInteger)index
{
    [super removeChild:child atIndex:index];

    // An existing item may have transitioned from custom view to label-only,
    // and needs to be rebuilt.
    [_invalidationDelegate headerItemDidInvalidate];
}

#pragma mark - Props

// Unlike Fabric, Lynx invokes prop setters also for absent/reset props with
// requestReset set - fall back to the default instead of failing.

LYNX_PROP_SETTER("placement", setPlacement, NSString *) {
    if (_didSetHeaderItemPlacement) {
        LLogWarn(@"[RNScreens] Changing header item placement at runtime is not supported");
        return;
    }
    _didSetHeaderItemPlacement = YES;

    if (requestReset || value == nil || [value isEqualToString:@"trailing"]) {
        _placement = RNSHeaderItemPlacementTrailing;
    } else if ([value isEqualToString:@"leading"]) {
        _placement = RNSHeaderItemPlacementLeading;
    } else if ([value isEqualToString:@"title"]) {
        _placement = RNSHeaderItemPlacementTitle;
    } else if ([value isEqualToString:@"subtitle"]) {
        _placement = RNSHeaderItemPlacementSubtitle;
    } else if ([value isEqualToString:@"largeSubtitle"]) {
        _placement = RNSHeaderItemPlacementLargeSubtitle;
    } else {
        LLogError(@"[RNScreens] Invalid StackHeaderItem placement: %@", value);
        _placement = RNSHeaderItemPlacementTrailing;
    }
}

LYNX_PROP_SETTER("itemId", setItemId, NSString *) {
    if (requestReset || value.length == 0) {
        value = nil;
    }
    _itemId = value;
}

LYNX_PROP_SETTER("title", setTitle, NSString *) {
    if (requestReset) {
        value = nil;
    }
    if (_title != value && ![_title isEqualToString:value]) {
        _title = value;
        _needsUpdate = YES;
    }
}

LYNX_PROP_SETTER("respondsToOnPress", setRespondsToOnPress, BOOL) {
    if (requestReset) {
        value = NO;
    }
    if (_respondsToOnPress != value) {
        _respondsToOnPress = value;
        _needsUpdate = YES;
    }
}

LYNX_PROP_SETTER("menu", setMenu, NSDictionary *) {
    if (requestReset) {
        value = nil;
    }
    // Adaptation: Lynx delivers the prop as a plain NSDictionary - no
    // folly::dynamic conversion is needed.
    _menu = [RNSStackHeaderMenuMapper menuFromDictionary:value];
    _menuToggleStateTracker = _menu != nil ? [RNSStackHeaderMenuToggleStateTracker new] : nil;
    _needsUpdate = YES;
}

- (void)propsDidUpdate
{
    [super propsDidUpdate];

    if (_needsUpdate) {
        _needsUpdate = NO;
        [_invalidationDelegate headerItemDidInvalidate];
    }
}

@end
