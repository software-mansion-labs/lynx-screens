#import "RNSScrollViewMarkerComponent.h"
#import "RNSScrollViewSeeking.h"

#import <Lynx/LynxComponentRegistry.h>
#import <Lynx/LynxLog.h>

@implementation RNSScrollViewMarkerView

- (void)willMoveToWindow:(UIWindow *)newWindow
{
    [super willMoveToWindow:newWindow];
    [self.component viewWillMoveToWindow:newWindow];
}

- (void)didMoveToWindow
{
    [super didMoveToWindow];
    [self.component viewDidMoveToWindow];
}

@end

@LynxElement("ls-scroll-view-marker")
@implementation RNSScrollViewMarkerComponent {
    BOOL _hasAttemptedRegistration;
}

- (instancetype)init
{
    if (self = [super init]) {
        _hasAttemptedRegistration = NO;
    }
    return self;
}

- (UIView *)createView
{
    RNSScrollViewMarkerView *markerView = [[RNSScrollViewMarkerView alloc] init];
    markerView.component = self;
    return markerView;
}

#pragma mark - Private

/**
 * This method asserts in debug mode in case it fails to find the ScrollView instance,
 * as it does not make sense to use this component if the ScrollView is not there.
 */
- (nullable UIScrollView *)findScrollView
{
    // It allows 0 for cases where the child is unmounted
    NSAssert(self.view.subviews.count <= 1,
             @"[RNScreens] ScrollViewMarker expects at most a single child. Subviews: %@",
             self.view.subviews);

    UIScrollView *_Nullable foundScrollView = [self resolveScrollViewFromChildView:self.view.subviews.firstObject];

    NSAssert(foundScrollView != nil, @"[RNScreens] Failed to find ScrollView"); // debug assertion only
    return foundScrollView;
}

- (nullable id<RNSScrollViewSeeking>)findFirstSeekingAncestor
{
    UIView *superview = self.view.superview;
    while (superview != nil) {
        if ([superview respondsToSelector:@selector(registerDescendantScrollView:fromMarker:)]) {
            return static_cast<id<RNSScrollViewSeeking>>(superview);
        }
        // Adaptation: plain superview walk - there is no reactSuperview on Lynx.
        superview = superview.superview;
    }
    return nil;
}

- (void)maybeRegisterWithSeekingAncestor
{
    if (_hasAttemptedRegistration) {
        return;
    }

    [self registerWithSeekingAncestor];
    _hasAttemptedRegistration = YES;
}

- (void)registerWithSeekingAncestor
{
    UIScrollView *scrollView = [self findScrollView];

    if (scrollView == nil) {
        return;
    }

    id<RNSScrollViewSeeking> seekingAncestor = [self findFirstSeekingAncestor];

    if (seekingAncestor == nil) {
        return;
    }

    [seekingAncestor registerDescendantScrollView:scrollView fromMarker:self];
}

/**
 * Tries to resolve UIScrollView from the passed childView.
 *
 * Adaptation: on Lynx the scroll element's painting view is a UIScrollView
 * subclass, so only the direct UIScrollView branch applies (RNS additionally
 * unwraps react-native's ScrollView component view).
 */
- (nullable UIScrollView *)resolveScrollViewFromChildView:(nullable UIView *)childView
{
    if (childView == nil) {
        return nil;
    }

    if ([childView isKindOfClass:UIScrollView.class]) {
        return static_cast<UIScrollView *>(childView);
    }

    return nil;
}

#pragma mark - Window moves

- (void)viewWillMoveToWindow:(nullable UIWindow *)newWindow
{
    if (newWindow != nil) {
        [self maybeRegisterWithSeekingAncestor];
    }
}

- (void)viewDidMoveToWindow
{
    if (self.view.window == nil) {
        _hasAttemptedRegistration = NO;
    }
}

@end
