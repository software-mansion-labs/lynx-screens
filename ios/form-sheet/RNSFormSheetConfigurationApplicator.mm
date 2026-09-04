#import "RNSFormSheetConfigurationApplicator.h"

#import "RNSFormSheetContentController.h"
#import "RNSFormSheetDetentResolver.h"
#import "RNSFormSheetUpdateCoordinator.h"
#import "RNSFormSheetUpdateFlags.h"

@implementation RNSFormSheetConfigurationApplicator

+ (void)applyConfigurationIfNeededWithAppearanceProvider:(id<RNSFormSheetAppearanceProvider>)appearanceProvider
                                        behaviorProvider:(id<RNSFormSheetBehaviorProvider>)behaviorProvider
                                              controller:(RNSFormSheetContentController *)controller
                                             coordinator:(RNSFormSheetUpdateCoordinator *)coordinator
{
  RNSFormSheetUpdateFlags configFlags =
      RNSFormSheetUpdateFlagsAppearance | RNSFormSheetUpdateFlagsBehavior | RNSFormSheetUpdateFlagsInitialDetent;
  BOOL shouldSelectInitialDetent = [coordinator needsAny:RNSFormSheetUpdateFlagsInitialDetent];

  [coordinator updateIfAnyNeeded:configFlags
               performOperations:^{
                 [self applyConfigurationWithAppearanceProvider:appearanceProvider
                                               behaviorProvider:behaviorProvider
                                                     controller:controller
                                            selectInitialDetent:shouldSelectInitialDetent];
               }];
}

+ (void)applyConfigurationWithAppearanceProvider:(id<RNSFormSheetAppearanceProvider>)appearanceProvider
                                behaviorProvider:(id<RNSFormSheetBehaviorProvider>)behaviorProvider
                                      controller:(RNSFormSheetContentController *)controller
                             selectInitialDetent:(BOOL)selectInitialDetent
{
#if !TARGET_OS_TV
  UISheetPresentationController *sheet = controller.sheetPresentationController;
  // Adaptation: keep the UIKit core independent of React's RCTAssert.
  NSAssert(sheet != nil,
           @"[RNScreens] sheetPresentationController requires UIModalPresentationFormSheet.");

  NSArray<UISheetPresentationControllerDetent *> *nativeDetents =
      [RNSFormSheetDetentResolver buildSheetDetentsWithBehaviorProvider:behaviorProvider];
  UISheetPresentationControllerDetentIdentifier initialDetentIdentifier = nil;
  if (selectInitialDetent) {
    initialDetentIdentifier =
        [RNSFormSheetDetentResolver initialDetentIdentifierForDetents:nativeDetents
                                                     atRequestedIndex:behaviorProvider.initialDetentIndex];
  }
  UISheetPresentationControllerDetentIdentifier largestUndimmedDetentIdentifier =
      [RNSFormSheetDetentResolver largestUndimmedDetentIdentifierForDetents:nativeDetents
                                                          atRequestedIndex:appearanceProvider.largestUndimmedDetentIndex];

  [sheet animateChanges:^{
    sheet.detents = nativeDetents;
    sheet.prefersScrollingExpandsWhenScrolledToEdge = behaviorProvider.prefersScrollingExpandsWhenScrolledToEdge;
    if (initialDetentIdentifier != nil) {
      sheet.selectedDetentIdentifier = initialDetentIdentifier;
    }
    sheet.prefersGrabberVisible = appearanceProvider.prefersGrabberVisible;
    CGFloat cornerRadius = appearanceProvider.preferredCornerRadius;
    sheet.preferredCornerRadius =
        cornerRadius < 0 ? UISheetPresentationControllerAutomaticDimension : cornerRadius;
    sheet.largestUndimmedDetentIdentifier = largestUndimmedDetentIdentifier;
  }];
#endif

  controller.view.backgroundColor = appearanceProvider.nativeContainerBackgroundColor ?: UIColor.clearColor;
}

@end
