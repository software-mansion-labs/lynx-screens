#import "RNSFormSheetHostComponent.h"
#import "RNSFormSheetContentController.h"
#import "RNSFormSheetContentView.h"
#import "RNSFormSheetContentWrapperComponent.h"
#import "RNSFormSheetContentWrapperDelegate.h"
#import "RNSFormSheetDetentResolver.h"
#import "RNSFormSheetHostEventEmitter.h"
#import "RNSFormSheetProviders.h"
#import "RNSShadowStateProxy.h"

#import <Lynx/LynxComponentRegistry.h>
#import <Lynx/LynxContext.h>
#import <Lynx/LynxEventHandler+Internal.h>
#import <Lynx/LynxLog.h>
#import <Lynx/LynxPropsProcessor.h>
#import <lynx/LynxTemplateRender+Internal.h>
#import <Lynx/LynxView+Internal.h>

@class RNSFormSheetHostComponent;

// Adaptation: Lynx's legacy hit-test conversion is implemented internally but
// is not exposed by the shipped headers.
@interface LynxUI (RNSFormSheetHitTest)
- (CGPoint)getHitTestPoint:(CGPoint)point;
@end

// Adaptation: LynxUI receives didMoveToWindow through its platform view rather
// than through the upstream component view callback.
@interface RNSFormSheetHostView : UIView
@property (nonatomic, weak) RNSFormSheetHostComponent *component;
@end

@interface RNSFormSheetHostComponent () <RNSFormSheetContentControllerDelegate,
                                          RNSFormSheetContentWrapperDelegate,
                                          RNSFormSheetPresentationProvider,
                                          RNSFormSheetAppearanceProvider,
                                          RNSFormSheetBehaviorProvider>
- (void)viewDidMoveToWindow;
@end

@implementation RNSFormSheetHostView

- (void)didMoveToWindow
{
  [super didMoveToWindow];
  [self.component viewDidMoveToWindow];
}

- (nullable UIView *)hitTest:(CGPoint)point withEvent:(nullable UIEvent *)event
{
  // The actual Lynx children are "teleported" into the separate sheet hierarchy.
  // Returning nil keeps this host from intercepting touches meant for the underlying screen.
  return nil;
}

@end

@LynxElement("ls-form-sheet")
@implementation RNSFormSheetHostComponent {
  RNSFormSheetHostEventEmitter *_Nonnull _lynxEventEmitter;
  RNSShadowStateProxy *_Nonnull _shadowStateProxy;
  LynxEventHandler *_Nullable _sheetEventHandler;
  NSInteger _sheetEventHandlerIndex;
  BOOL _platformEventRootActive;
  BOOL _hasPlatformEventRootOffset;
  CGPoint _platformEventRootOffset;

  RNSFormSheetContentController *_Nullable _controller;

  // Props
  BOOL _isOpen;
  std::vector<double> _detents;
  BOOL _prefersGrabberVisible;
  CGFloat _preferredCornerRadius;
  NSInteger _largestUndimmedDetentIndex;
  NSInteger _initialDetentIndex;
  BOOL _prefersScrollingExpandsWhenScrolledToEdge;
  BOOL _preventNativeDismiss;
  UIColor *_Nullable _nativeContainerBackgroundColor;

  CGFloat _reactContentsHeight;
}

- (instancetype)init
{
  if (self = [super init]) {
    [self initState];
  }
  return self;
}

- (void)initState
{
  [self resetProps];
  [self setupController];

  _lynxEventEmitter = [RNSFormSheetHostEventEmitter new];
  // Adaptation: Lynx updates custom-measure shadow nodes through the shared proxy.
  _shadowStateProxy = [[RNSShadowStateProxy alloc] initWithLynxUI:self];
  _sheetEventHandlerIndex = -1;
}

- (void)resetProps
{
  _isOpen = NO;
  _detents = {};
  _prefersGrabberVisible = NO;
  _preferredCornerRadius = -1.0;
  _largestUndimmedDetentIndex = kRNSFormSheetAlwaysDimmed;
  _initialDetentIndex = 0;
  _prefersScrollingExpandsWhenScrolledToEdge = YES;
  _preventNativeDismiss = NO;
  _nativeContainerBackgroundColor = nil;

  _reactContentsHeight = 0.0;
}

- (void)setupController
{
  _controller = [RNSFormSheetContentController new];
  _controller.delegate = self;

  _controller.presentationProvider = self;
  _controller.appearanceProvider = self;
  _controller.behaviorProvider = self;
}

- (UIView *)createView
{
  // Adaptation: the backing view only keeps the host in Lynx's component tree;
  // UIKit renders the actual children in the sheet controller's content view.
  RNSFormSheetHostView *view = [RNSFormSheetHostView new];
  view.component = self;
  return view;
}

- (BOOL)hasCustomLayout
{
  // Adaptation: children are laid out against dimensions reported by UIKit.
  return YES;
}

- (void)viewDidMoveToWindow
{
  if (self.view.window != nil) {
    // Adaptation: Lynx supplies context/sign after init, before the host can present.
    [_lynxEventEmitter updateEventEmitter:self.context.eventEmitter targetSign:self.sign];
    [_controller setNeedsPresentationUpdate];
    [_controller flushPendingUpdates];
  }
}

#pragma mark - RNSFormSheetPresentationProvider

- (nullable UIWindow *)hostWindow
{
  return self.view.window;
}

#pragma mark - RNSFormSheetBehaviorProvider

- (const std::vector<double> &)detents
{
  return _detents;
}

- (CGFloat)reactContentsHeight
{
  return _reactContentsHeight;
}

#pragma mark - RNSFormSheetContentWrapperDelegate

- (void)contentWrapper:(RNSFormSheetContentWrapperComponent *)wrapper
    didChangeReactContentsHeight:(CGFloat)reactContentsHeight
{
  if (_reactContentsHeight != reactContentsHeight) {
    _reactContentsHeight = reactContentsHeight;
    [_controller setNeedsBehaviorUpdate];
    // Adaptation: Lynx has no Fabric mounting-transaction observer, so layout-driven
    // fit-to-contents changes are flushed after Lynx reports its finished layout.
    [_controller flushPendingUpdates];
  }
}

#pragma mark - RNSFormSheetContentControllerDelegate

- (void)sheetControllerDidDismiss:(RNSFormSheetContentController *)controller
{
  [_lynxEventEmitter emitOnDismiss];
}

- (void)sheetControllerDidNativeDismiss:(RNSFormSheetContentController *)controller
{
  _isOpen = NO;
  [_lynxEventEmitter emitOnNativeDismiss];
}

- (void)sheetControllerDidPreventNativeDismiss:(RNSFormSheetContentController *)controller
{
  [_lynxEventEmitter emitOnNativeDismissPrevented];
}

- (void)sheetControllerViewDidLayoutSubviews:(RNSFormSheetContentController *)controller
{
  [self ensureTouchHandlerAttached];
  [self updatePlatformEventRootActiveForFragmentLayer:YES];
  [self syncShadowNodeState];
}

#if !TARGET_OS_TV
- (void)sheetController:(RNSFormSheetContentController *)controller
    didChangeDetentIdentifier:(nullable NSString *)identifier
{
  NSInteger index = [RNSFormSheetDetentResolver detentIndexFromDetentIdentifier:identifier forRawDetents:_detents];
  if (index >= 0) {
    [_lynxEventEmitter emitOnDetentChangedWithIndex:index];
  }
}
#endif // !TARGET_OS_TV

- (void)sheetControllerWillAppear:(RNSFormSheetContentController *)controller
{
  [self ensureTouchHandlerAttached];
  [self updatePlatformEventRootActiveForFragmentLayer:YES];
  [_lynxEventEmitter emitOnWillAppear];
}

- (void)sheetControllerDidAppear:(RNSFormSheetContentController *)controller
{
  [_lynxEventEmitter emitOnDidAppear];
}

- (void)sheetControllerWillDisappear:(RNSFormSheetContentController *)controller
{
  [_lynxEventEmitter emitOnWillDisappear];
}

- (void)sheetControllerDidDisappear:(RNSFormSheetContentController *)controller
{
  [self updatePlatformEventRootActiveForFragmentLayer:NO];
  if (_sheetEventHandlerIndex >= 0) {
    [_sheetEventHandler removeGestureArenaManager:_sheetEventHandlerIndex];
    _sheetEventHandlerIndex = -1;
  }
  [_lynxEventEmitter emitOnDidDisappear];
}

#pragma mark - Lynx children lifecycle

- (void)insertChild:(id)child atIndex:(NSInteger)index
{
  NSAssert([child isKindOfClass:LynxUI.class], @"[RNScreens] FormSheet child must be a LynxUI.");

  // Adaptation: preserve the Lynx component tree through super, then teleport
  // the native view into the stable UIKit sheet content container.
  [super insertChild:child atIndex:index];
  LynxUI *childUI = (LynxUI *)child;
  [_controller.contentView insertReactSubview:childUI.view atIndex:index];

  // Assuming that for `fitToContents` the RNSFormSheetContentWrapperComponent will be a direct child of
  // RNSFormSheetHostComponent.
  if ([child isKindOfClass:[RNSFormSheetContentWrapperComponent class]]) {
    ((RNSFormSheetContentWrapperComponent *)child).delegate = self;
  }
}

- (void)removeChild:(id)child atIndex:(NSInteger)index
{
  if ([child isKindOfClass:[RNSFormSheetContentWrapperComponent class]]) {
    ((RNSFormSheetContentWrapperComponent *)child).delegate = nil;
  }

  if ([child isKindOfClass:LynxUI.class]) {
    [_controller.contentView removeReactSubview:((LynxUI *)child).view];
  }
  [super removeChild:child atIndex:index];
}

#pragma mark - Props

// Adaptation: Lynx prop setters replace Fabric's updateProps and schedule the
// same granular controller updates before propsDidUpdate flushes the batch.
LYNX_PROP_SETTER("isOpen", setIsOpen, BOOL) {
  BOOL nextValue = requestReset ? NO : value;
  if (_isOpen != nextValue) {
    _isOpen = nextValue;
    [_controller setNeedsPresentationUpdate];

    if (_isOpen) {
      // ALWAYS refresh the sheet configuration when reopening,
      // because UIKit destroys the presentationController after the modal is dismissed.
      [_controller setNeedsAppearanceUpdate];
      [_controller setNeedsBehaviorUpdate];
      // Request the configured initialDetentIndex to be selected
      // again on the fresh presentation controller.
      [_controller setNeedsInitialDetentUpdate];
    }
  }
}

LYNX_PROP_SETTER("detents", setDetents, NSArray *) {
  std::vector<double> nextDetents;
  if (!requestReset && value != nil) {
    for (id detent in value) {
      if (![detent isKindOfClass:NSNumber.class]) {
        LLogError(@"[RNScreens] FormSheet detents must contain only numbers.");
        nextDetents.clear();
        break;
      }
      nextDetents.push_back([detent doubleValue]);
    }
  }
  if (_detents != nextDetents) {
    _detents = std::move(nextDetents);
    [_controller setNeedsBehaviorUpdate];
  }
}

LYNX_PROP_SETTER("prefersScrollingExpandsWhenScrolledToEdge", setPrefersScrollingExpands, BOOL) {
  BOOL nextValue = requestReset ? YES : value;
  if (_prefersScrollingExpandsWhenScrolledToEdge != nextValue) {
    _prefersScrollingExpandsWhenScrolledToEdge = nextValue;
    [_controller setNeedsBehaviorUpdate];
  }
}

LYNX_PROP_SETTER("preventNativeDismiss", setPreventNativeDismiss, BOOL) {
  BOOL nextValue = requestReset ? NO : value;
  if (_preventNativeDismiss != nextValue) {
    _preventNativeDismiss = nextValue;
    [_controller setNeedsBehaviorUpdate];
  }
}

LYNX_PROP_SETTER("prefersGrabberVisible", setPrefersGrabberVisible, BOOL) {
  BOOL nextValue = requestReset ? NO : value;
  if (_prefersGrabberVisible != nextValue) {
    _prefersGrabberVisible = nextValue;
    [_controller setNeedsAppearanceUpdate];
  }
}

LYNX_PROP_SETTER("preferredCornerRadius", setPreferredCornerRadius, CGFloat) {
  CGFloat nextValue = requestReset ? -1.0 : value;
  if (_preferredCornerRadius != nextValue) {
    _preferredCornerRadius = nextValue;
    [_controller setNeedsAppearanceUpdate];
  }
}

LYNX_PROP_SETTER("largestUndimmedDetentIndex", setLargestUndimmedDetentIndex, NSInteger) {
  NSInteger nextValue = requestReset ? kRNSFormSheetAlwaysDimmed : value;
  if (_largestUndimmedDetentIndex != nextValue) {
    _largestUndimmedDetentIndex = nextValue;
    [_controller setNeedsAppearanceUpdate];
  }
}

LYNX_PROP_SETTER("nativeContainerBackgroundColor", setNativeContainerBackgroundColor, UIColor *) {
  // Adaptation: Lynx's prop processor performs native color conversion; no
  // RCT SharedColor conversion is needed.
  UIColor *nextValue = requestReset ? nil : value;
  if (_nativeContainerBackgroundColor != nextValue && ![_nativeContainerBackgroundColor isEqual:nextValue]) {
    _nativeContainerBackgroundColor = nextValue;
    [_controller setNeedsAppearanceUpdate];
  }
}

LYNX_PROP_SETTER("initialDetentIndex", setInitialDetentIndex, NSInteger) {
  _initialDetentIndex = requestReset ? 0 : value;
}

- (void)propsDidUpdate
{
  [super propsDidUpdate];
  // Adaptation: Lynx has no Fabric updateEventEmitter callback. Bind the current
  // context/sign at the props boundary before flushing presentation updates.
  [_lynxEventEmitter updateEventEmitter:self.context.eventEmitter targetSign:self.sign];
  // Adaptation: flush prop-driven updates at Lynx's props boundary; layout-driven
  // updates are flushed by the content-wrapper delegate.
  [_controller flushPendingUpdates];
}

#pragma mark - Layout helpers

- (void)syncShadowNodeState
{
  if (_controller == nil || _controller.contentView == nil) {
    return;
  }

  // Adaptation: the shared Lynx proxy forwards dimensions to the custom shadow node.
  [_shadowStateProxy updateShadowStateWithFrame:_controller.contentView.bounds];
}

#pragma mark - Touch Handling overrides

- (BOOL)shouldHitTest:(CGPoint)point withEvent:(nullable UIEvent *)event
{
  // Adaptation: unlike UIKit, Lynx also hit-tests the logical tree. Exclude the
  // teleported subtree until the sheet is presented so it cannot cover the host screen.
  return _isOpen && _controller.contentView.window != nil;
}

#pragma mark - Touch Handling helpers

- (void)ensureTouchHandlerAttached
{
  if (self.context == nil) {
    return;
  }

  if (_sheetEventHandler == nil) {
    // Adaptation: the presented controller is outside the Lynx root view hierarchy,
    // so it needs the same secondary event-handler bridge used by Lynx overlays.
    _sheetEventHandler =
        [[LynxEventHandler alloc] initWithRootView:_controller.contentView
                                       withRootUI:self
                                          andFlag:self.context.lynxContext.isFragmentLayerRenderOn];
    [_sheetEventHandler updateUiOwner:self.context.uiOwner eventEmitter:self.context.eventEmitter];
    _controller.contentView.eventHandler = _sheetEventHandler;
    _controller.contentView.lynxRootUI = self;
  }
  if (_sheetEventHandlerIndex < 0) {
    _sheetEventHandlerIndex = [_sheetEventHandler
        setGestureArenaManagerAndGetIndex:self.context.eventHandler.gestureArenaManager];
  }
}

- (void)updatePlatformEventRootActiveForFragmentLayer:(BOOL)active
{
  LynxUIContext *uiContext = self.context.uiOwner.uiContext;
  if (!uiContext.lynxContext.isFragmentLayerRenderOn) {
    return;
  }
  UIView *rootView = uiContext.rootView;
  if (![rootView isKindOfClass:LynxView.class]) {
    return;
  }
  if (active && (_controller.contentView.window == nil || _controller.contentView.window != rootView.window)) {
    return;
  }
  LynxTemplateRender *templateRender = ((LynxView *)rootView).templateRender;
  if (active) {
    CGPoint offset = [_controller.contentView convertPoint:CGPointZero toView:rootView];
    if (!_hasPlatformEventRootOffset || !CGPointEqualToPoint(_platformEventRootOffset, offset)) {
      _platformEventRootOffset = offset;
      _hasPlatformEventRootOffset = YES;
      [templateRender SetPlatformEventRootOffset:self.sign offsetX:offset.x offsetY:offset.y];
    }
  } else {
    _hasPlatformEventRootOffset = NO;
  }
  if (_platformEventRootActive != active) {
    _platformEventRootActive = active;
    [templateRender SetPlatformEventRootActive:self.sign active:active];
  }
}

- (id<LynxEventTarget>)hitTest:(CGPoint)point withEvent:(nullable UIEvent *)event
{
  // Divergence from RNS: the secondary Lynx event handler starts hit-testing at
  // this logical host, while its children live under the UIKit sheet container.
  for (LynxUI *child in [self.children reverseObjectEnumerator]) {
    if (![child shouldHitTest:point withEvent:event]) {
      continue;
    }
    CALayer *parentLayer = _controller.contentView.layer.presentationLayer ?: _controller.contentView.layer.modelLayer;
    CALayer *childLayer = child.view.layer.presentationLayer ?: child.view.layer.modelLayer;
    CGPoint childPoint = [parentLayer convertPoint:point toLayer:childLayer];
    CGPoint containsPoint = self.context.enableEventRefactor ? childPoint : point;
    if ([child containsPoint:containsPoint]) {
      CGPoint hitTestPoint = self.context.enableEventRefactor ? childPoint : [child getHitTestPoint:point];
      return [child hitTest:hitTestPoint withEvent:event];
    }
  }
  return self;
}

- (void)dealloc
{
  // Adaptation: LynxUI has no Fabric-style invalidate callback.
  [self updatePlatformEventRootActiveForFragmentLayer:NO];
  for (LynxUI *child in self.children) {
    if ([child isKindOfClass:[RNSFormSheetContentWrapperComponent class]]) {
      ((RNSFormSheetContentWrapperComponent *)child).delegate = nil;
    }
  }
  if (_sheetEventHandlerIndex >= 0) {
    [_sheetEventHandler removeGestureArenaManager:_sheetEventHandlerIndex];
  }
  if (_controller.isViewLoaded) {
    _controller.contentView.eventHandler = nil;
    _controller.contentView.lynxRootUI = nil;
  }
  [_sheetEventHandler removeEventGestures];
  _sheetEventHandler = nil;
  [_shadowStateProxy invalidate];
  _controller.delegate = nil;
  if (_controller.presentingViewController != nil) {
    [_controller dismissViewControllerAnimated:NO completion:nil];
  }
}

@end
