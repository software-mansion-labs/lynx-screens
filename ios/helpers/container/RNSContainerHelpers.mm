#import "RNSContainerHelpers.h"

@implementation RNSContainerHelpers

+ (BOOL)addChildViewController:(nullable UIViewController *)childViewController
      toViewControllerManaging:(nullable UIView *)startingView
             withContainerView:(nullable UIView *)containerView
{
    if (startingView == nil || childViewController == nil || containerView == nil) {
        return NO;
    }

    if (childViewController.parentViewController != nil) {
        return NO;
    }

    UIViewController *_Nullable parentViewController = [self findParentViewControllerCandidateFromView:startingView];

    if (parentViewController == nil) {
        return NO;
    }

    return [self addChildController:childViewController toParent:parentViewController containerView:containerView];
}

// Adaptation: RNS walks the reactSuperview chain querying reactViewController;
// on Lynx there is no shadow-parent bookkeeping on UIView, so the plain
// superview chain is walked and the managing controller is resolved through
// the responder chain (the same lookup RN's reactViewController performs).
+ (nullable UIViewController *)findParentViewControllerCandidateFromView:(nullable UIView *)view
{
    if (view == nil) {
        return nil;
    }

    UIView *currView = view;
    UIViewController *_Nullable maybeViewController;

    while (currView != nil) {
        maybeViewController = [self viewControllerManagingView:currView];

        if (maybeViewController != nil) {
            return maybeViewController;
        }

        currView = currView.superview;
    }

    return nil;
}

+ (nullable UIViewController *)viewControllerManagingView:(UIView *)view
{
    UIResponder *responder = [view nextResponder];
    while (responder) {
        if ([responder isKindOfClass:[UIViewController class]]) {
            return (UIViewController *)responder;
        }
        responder = [responder nextResponder];
    }
    return nil;
}

+ (BOOL)addChildController:(nullable UIViewController *)childViewController
                  toParent:(nullable UIViewController *)parentViewController
             containerView:(nullable UIView *)containerView
{
    if (!childViewController || !parentViewController || !containerView) {
        return NO;
    }

    [parentViewController addChildViewController:childViewController];
    [containerView addSubview:childViewController.view];
    // Adaptation: seed the initial frame so the controller's view has a valid
    // size before the first auto-layout pass (kept from the previous Lynx
    // mounting path).
    childViewController.view.frame = containerView.bounds;
    [childViewController didMoveToParentViewController:parentViewController];

    return YES;
}

@end
