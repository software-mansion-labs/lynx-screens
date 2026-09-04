#import "RNSFormSheetContentController.h"
#import "RNSFormSheetConfigurationApplicator.h"
#import "RNSFormSheetContentView.h"
#import "RNSFormSheetPresentationManager.h"
#import "RNSFormSheetUpdateCoordinator.h"
#import "RNSFormSheetUpdateFlags.h"

@interface RNSFormSheetContentController () <UIAdaptivePresentationControllerDelegate,
                                              UIGestureRecognizerDelegate
#if !TARGET_OS_TV
                                              ,
                                              UISheetPresentationControllerDelegate
#endif
                                              >
@end

@implementation RNSFormSheetContentController {
  RNSFormSheetUpdateCoordinator *_Nonnull _updateCoordinator;
  RNSFormSheetPresentationManager *_Nonnull _presentationManager;
  UITapGestureRecognizer *_Nullable _backdropTapGestureRecognizer;
}

- (instancetype)init
{
  if (self = [super init]) {
    self.modalPresentationStyle = UIModalPresentationFormSheet;
    _updateCoordinator = [RNSFormSheetUpdateCoordinator new];
    _presentationManager = [RNSFormSheetPresentationManager new];
  }
  return self;
}

- (RNSFormSheetContentView *)contentView
{
  // Adaptation: keep the UIKit core independent of React's RCTAssert.
  NSAssert([self.view isKindOfClass:RNSFormSheetContentView.class],
           @"[RNScreens] ContentView must be RNSFormSheetContentView.");
  return static_cast<RNSFormSheetContentView *>(self.view);
}

- (void)loadView
{
  self.view = [RNSFormSheetContentView new];
}

- (void)viewDidLayoutSubviews
{
  [super viewDidLayoutSubviews];
  [self.delegate sheetControllerViewDidLayoutSubviews:self];
}

- (void)viewWillAppear:(BOOL)animated
{
  [super viewWillAppear:animated];
  [self attachBackdropTapGestureRecognizer];
  [self.delegate sheetControllerWillAppear:self];
}

- (void)viewDidAppear:(BOOL)animated
{
  [super viewDidAppear:animated];
  [self.delegate sheetControllerDidAppear:self];
}

- (void)viewWillDisappear:(BOOL)animated
{
  [super viewWillDisappear:animated];
  [self.delegate sheetControllerWillDisappear:self];
}

- (void)viewDidDisappear:(BOOL)animated
{
  [super viewDidDisappear:animated];
  [self detachBackdropTapGestureRecognizer];

  BOOL isStillInPresentationHierarchy = self.presentingViewController != nil;
  if (!isStillInPresentationHierarchy && [_presentationManager handleNativeDismiss]) {
    [self.delegate sheetControllerDidNativeDismiss:self];
  }
  [self.delegate sheetControllerDidDisappear:self];
}

- (void)updatePresentationIfNeeded
{
  [_updateCoordinator updateIfNeeded:RNSFormSheetUpdateFlagsPresentation
                   performOperations:^{
                     [self updatePresentationState];
                   }];
}

- (void)updatePresentationState
{
  id<RNSFormSheetPresentationProvider> provider = self.presentationProvider;
  NSAssert(provider != nil, @"[RNScreens] Presentation provider must be set before updating.");
  if (provider != nil) {
    [_presentationManager updatePresentationIfNeededWithProvider:provider controller:self];
  }
}

- (void)prepareForPresentation
{
  self.presentationController.delegate = self;
#if !TARGET_OS_TV
  self.sheetPresentationController.delegate = self;
#endif
  [self setNeedsAppearanceUpdate];
  [self setNeedsBehaviorUpdate];
  [self setNeedsInitialDetentUpdate];
  [self updateConfigurationIfNeeded];
}

- (void)updateConfigurationIfNeeded
{
  id<RNSFormSheetAppearanceProvider> appearanceProvider = self.appearanceProvider;
  id<RNSFormSheetBehaviorProvider> behaviorProvider = self.behaviorProvider;
  NSAssert(appearanceProvider != nil, @"[RNScreens] Appearance provider must be set before updating.");
  NSAssert(behaviorProvider != nil, @"[RNScreens] Behavior provider must be set before updating.");
  if (appearanceProvider != nil && behaviorProvider != nil) {
    [RNSFormSheetConfigurationApplicator applyConfigurationIfNeededWithAppearanceProvider:appearanceProvider
                                                                         behaviorProvider:behaviorProvider
                                                                               controller:self
                                                                              coordinator:_updateCoordinator];
  }
}

- (void)setNeedsPresentationUpdate
{
  [_updateCoordinator setNeeds:RNSFormSheetUpdateFlagsPresentation];
}

- (void)setNeedsAppearanceUpdate
{
  [_updateCoordinator setNeeds:RNSFormSheetUpdateFlagsAppearance];
}

- (void)setNeedsBehaviorUpdate
{
  [_updateCoordinator setNeeds:RNSFormSheetUpdateFlagsBehavior];
}

- (void)setNeedsInitialDetentUpdate
{
  [_updateCoordinator setNeeds:RNSFormSheetUpdateFlagsInitialDetent];
}

- (void)flushPendingUpdates
{
  [self updateConfigurationIfNeeded];
  [self updatePresentationIfNeeded];
}

- (BOOL)presentationControllerShouldDismiss:(UIPresentationController *)presentationController
{
  return !_behaviorProvider.preventNativeDismiss;
}

- (void)presentationControllerDidAttemptToDismiss:(UIPresentationController *)presentationController
{
  [self.delegate sheetControllerDidPreventNativeDismiss:self];
}

- (void)presentationControllerDidDismiss:(UIPresentationController *)presentationController
{
  if ([_presentationManager handleNativeDismiss]) {
    [self.delegate sheetControllerDidNativeDismiss:self];
  }
}

#if !TARGET_OS_TV
- (void)sheetPresentationControllerDidChangeSelectedDetentIdentifier:
    (UISheetPresentationController *)sheetPresentationController
{
  [self.delegate sheetController:self didChangeDetentIdentifier:sheetPresentationController.selectedDetentIdentifier];
}
#endif

- (void)attachBackdropTapGestureRecognizer
{
  UIPresentationController *presentationController = self.presentationController;
  if (presentationController.containerView != nil && _backdropTapGestureRecognizer == nil) {
    _backdropTapGestureRecognizer = [[UITapGestureRecognizer alloc] initWithTarget:self
                                                                            action:@selector(handleBackdropTap:)];
    _backdropTapGestureRecognizer.delegate = self;
    _backdropTapGestureRecognizer.cancelsTouchesInView = NO;
    [presentationController.containerView addGestureRecognizer:_backdropTapGestureRecognizer];
  }
}

- (void)detachBackdropTapGestureRecognizer
{
  [_backdropTapGestureRecognizer.view removeGestureRecognizer:_backdropTapGestureRecognizer];
  _backdropTapGestureRecognizer = nil;
}

- (void)handleBackdropTap:(UITapGestureRecognizer *)gesture
{
  if (gesture.state == UIGestureRecognizerStateRecognized && _behaviorProvider.preventNativeDismiss) {
    [self.delegate sheetControllerDidPreventNativeDismiss:self];
  }
}

- (BOOL)gestureRecognizer:(UIGestureRecognizer *)gestureRecognizer shouldReceiveTouch:(UITouch *)touch
{
  if (gestureRecognizer != _backdropTapGestureRecognizer) {
    return YES;
  }
  if (!_behaviorProvider.preventNativeDismiss) {
    return NO;
  }
  UIView *presentedView = self.presentationController.presentedView;
  return presentedView == nil || ![touch.view isDescendantOfView:presentedView];
}

- (BOOL)gestureRecognizer:(UIGestureRecognizer *)gestureRecognizer
    shouldRecognizeSimultaneouslyWithGestureRecognizer:(UIGestureRecognizer *)otherGestureRecognizer
{
  return gestureRecognizer == _backdropTapGestureRecognizer;
}

@end
