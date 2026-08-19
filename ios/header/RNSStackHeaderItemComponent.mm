#import "RNSStackHeaderItemComponent.h"
#import "RNSDefines.h"
#import "RNSStackHeaderItemWrapperView.h"

#import <Lynx/LynxComponentRegistry.h>
#import <Lynx/LynxLog.h>
#import <Lynx/LynxPropsProcessor.h>

#include <cmath>

@LynxElement("ls-stack-header-item")
@implementation RNSStackHeaderItemComponent {
    RNSHeaderItemPlacement _placement;
    BOOL _didSetHeaderItemPlacement;
    NSString *_Nullable _label;
    BOOL _needsUpdate;
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
    _label = nil;
    _placement = RNSHeaderItemPlacementTrailing;
    _didSetHeaderItemPlacement = NO;
    _needsUpdate = NO;
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

- (BOOL)hasCustomView
{
    return self.children.count > 0;
}

#pragma mark - Bar Button Item

- (nonnull UIView *)makeWrappedViewWithFrameChangeDelegate:(id<RNSViewFrameChangeDelegate>)delegate
{
    // The wrapper view is delegating the state update outside the view
    // and we expect that delegate to call viewFrameDidChange from outside.
    // This is needed for iOS 18 where there is no other way to sync all child elements
    // when one updates its side in a way that impacts the layout of others
    // (on iOS 26, this would work with just attaching self here).
    RNSStackHeaderItemWrapperView *wrapperView = [[RNSStackHeaderItemWrapperView alloc] initWithDelegate:delegate];
    wrapperView.translatesAutoresizingMaskIntoConstraints = NO;
    [wrapperView addSubview:self.view];

    [NSLayoutConstraint activateConstraints:@[
        [self.view.leadingAnchor constraintEqualToAnchor:wrapperView.leadingAnchor],
        [self.view.trailingAnchor constraintEqualToAnchor:wrapperView.trailingAnchor],
        [self.view.topAnchor constraintEqualToAnchor:wrapperView.topAnchor],
        [self.view.bottomAnchor constraintEqualToAnchor:wrapperView.bottomAnchor],
    ]];

    return wrapperView;
}

#if RNS_IPHONE_OS_VERSION_AVAILABLE(26_0)
- (nonnull UIView *)makeWrappedInlineItemViewForIOS26WithFrameChangeDelegate:(id<RNSViewFrameChangeDelegate>)delegate
{
    // Starting from iOS 26, UIBarButtonItem's customView is stretched to have at least 36 width.
    // To mitigate this, we add a wrapper view that will center the item inside of itself.
    RNSStackHeaderItemWrapperView *wrapperView = [[RNSStackHeaderItemWrapperView alloc] initWithDelegate:delegate];
    wrapperView.translatesAutoresizingMaskIntoConstraints = NO;
    // self.view has already opted out of default constraints with `translatesAutoresizingMaskIntoConstraints = NO`
    [wrapperView addSubview:self.view];

    [self.view.centerXAnchor constraintEqualToAnchor:wrapperView.centerXAnchor].active = YES;
    [self.view.centerYAnchor constraintEqualToAnchor:wrapperView.centerYAnchor].active = YES;

    // To prevent UIKit from stretching subviews to all available width, we need to:
    // 1. Set width of wrapperView to match the header item BUT when
    //    the item's width is smaller than minimal required 36 width, it breaks
    //    UIKit's constraint. That's why we need to lower the priority of the constraint.
    NSLayoutConstraint *widthEqual = [wrapperView.widthAnchor constraintEqualToAnchor:self.view.widthAnchor];
    widthEqual.priority = UILayoutPriorityDefaultHigh;
    widthEqual.active = YES;

    NSLayoutConstraint *heightEqual = [wrapperView.heightAnchor constraintEqualToAnchor:self.view.heightAnchor];
    heightEqual.priority = UILayoutPriorityDefaultHigh;
    heightEqual.active = YES;

    // 2. Set content hugging priority for the header item
    [self.view setContentHuggingPriority:UILayoutPriorityRequired forAxis:UILayoutConstraintAxisHorizontal];
    [self.view setContentHuggingPriority:UILayoutPriorityRequired forAxis:UILayoutConstraintAxisVertical];

    // 3. Set compression resistance to prevent UIKit from shrinking the item below its intrinsic size.
    [self.view setContentCompressionResistancePriority:UILayoutPriorityRequired
                                               forAxis:UILayoutConstraintAxisVertical];
    [self.view setContentCompressionResistancePriority:UILayoutPriorityRequired
                                               forAxis:UILayoutConstraintAxisHorizontal];

    return wrapperView;
}
#endif // RNS_IPHONE_OS_VERSION_AVAILABLE(26_0)

- (nonnull UIBarButtonItem *)makeBarButtonItemWithFrameChangeDelegate:(id<RNSViewFrameChangeDelegate>)delegate
{
    // Similarly to makeWrappedViewWithFrameChangeDelegate, we're attaching outside delegate here.
    // See the reasoning in the aforementioned function.
    if (self.hasCustomView) {
#if RNS_IPHONE_OS_VERSION_AVAILABLE(26_0)
        if (@available(iOS 26.0, *)) {
            return [[UIBarButtonItem alloc]
                initWithCustomView:[self makeWrappedInlineItemViewForIOS26WithFrameChangeDelegate:delegate]];
        }
#endif // RNS_IPHONE_OS_VERSION_AVAILABLE(26_0)
        return [[UIBarButtonItem alloc] initWithCustomView:[self makeWrappedViewWithFrameChangeDelegate:delegate]];
    }

    return [[UIBarButtonItem alloc] initWithTitle:_label style:UIBarButtonItemStylePlain target:nil action:nil];
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

LYNX_PROP_SETTER("label", setLabel, NSString *) {
    if (requestReset) {
        value = nil;
    }
    if (_label != value && ![_label isEqualToString:value]) {
        _label = value;
        _needsUpdate = YES;
    }
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
