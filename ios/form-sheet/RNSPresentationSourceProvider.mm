#import "RNSPresentationSourceProvider.h"

@implementation RNSPresentationSourceProvider

+ (nullable UIViewController *)findViewControllerForPresentationInWindow:(nullable UIWindow *)window
{
  if (window == nil) {
    return nil;
  }

  UIViewController *presentationSourceViewController = window.rootViewController;

  // Adaptation: use Foundation's assertion because Lynx does not depend on React's RCTAssert.
  NSAssert(presentationSourceViewController != nil,
           @"[RNScreens] Root View Controller should not be nil when trying to present a modal.");

  if (presentationSourceViewController == nil) {
    return nil;
  }

  // We manually traverse the presentedViewController chain to its absolute end.
  // This guarantees we are always presenting on the top-most visible view controller in the window.
  while (presentationSourceViewController.presentedViewController != nil) {
    presentationSourceViewController = presentationSourceViewController.presentedViewController;
  }

  return presentationSourceViewController;
}

@end
