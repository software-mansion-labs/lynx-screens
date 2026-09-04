#import "RNSFormSheetComponent.h"

#import "RNSFormSheetContentController.h"
#import "RNSFormSheetContentView.h"
#import "RNSFormSheetContentWrapperComponent.h"
#import "RNSFormSheetContentWrapperDelegate.h"
#import "RNSFormSheetDetentResolver.h"
#import "RNSFormSheetEventEmitter.h"
#import "RNSFormSheetProviders.h"
#import "RNSShadowStateProxy.h"

#import <Lynx/LynxComponentRegistry.h>
#import <Lynx/LynxLog.h>
#import <Lynx/LynxPropsProcessor.h>

@class RNSFormSheetComponent;

@interface RNSFormSheetHostView : UIView
@property (nonatomic, weak) RNSFormSheetComponent *component;
@end

@interface RNSFormSheetComponent () <RNSFormSheetContentControllerDelegate,
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
  // The actual children live in the presented controller hierarchy, so this
  // placeholder must not intercept the screen underneath it.
  return nil;
}

@end

@LynxElement("ls-form-sheet")
@implementation RNSFormSheetComponent {
  RNSFormSheetContentController *_controller;
  RNSFormSheetEventEmitter *_eventEmitter;
  RNSShadowStateProxy *_shadowStateProxy;

  BOOL _isOpen;
  std::vector<double> _detents;
  BOOL _prefersGrabberVisible;
  CGFloat _preferredCornerRadius;
  NSInteger _largestUndimmedDetentIndex;
  NSInteger _initialDetentIndex;
  BOOL _prefersScrollingExpandsWhenScrolledToEdge;
  BOOL _preventNativeDismiss;
  UIColor *_Nullable _nativeContainerBackgroundColor;
  CGFloat _contentsHeight;
  BOOL _wasOpen;
}

- (instancetype)init
{
  if (self = [super init]) {
    [self resetProps];
    _controller = [RNSFormSheetContentController new];
    _controller.delegate = self;
    _controller.presentationProvider = self;
    _controller.appearanceProvider = self;
    _controller.behaviorProvider = self;
    _shadowStateProxy = [[RNSShadowStateProxy alloc] initWithLynxUI:self];
  }
  return self;
}

- (void)dealloc
{
  for (LynxUI *child in self.children) {
    if ([child isKindOfClass:RNSFormSheetContentWrapperComponent.class]) {
      ((RNSFormSheetContentWrapperComponent *)child).delegate = nil;
    }
  }
  [_shadowStateProxy invalidate];
  _controller.delegate = nil;
  if (_controller.presentingViewController != nil) {
    [_controller dismissViewControllerAnimated:NO completion:nil];
  }
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
  _contentsHeight = 0;
  _wasOpen = NO;
}

- (UIView *)createView
{
  RNSFormSheetHostView *view = [RNSFormSheetHostView new];
  view.component = self;
  return view;
}

- (BOOL)hasCustomLayout
{
  return YES;
}

- (void)viewDidMoveToWindow
{
  if (self.view.window != nil) {
    [_controller setNeedsPresentationUpdate];
    [_controller flushPendingUpdates];
  }
}

#pragma mark - Children lifecycle

- (void)insertChild:(id)child atIndex:(NSInteger)index
{
  NSAssert([child isKindOfClass:LynxUI.class], @"[RNScreens] FormSheet child must be a LynxUI.");

  // Adaptation: preserve the Lynx component tree through super, then teleport
  // the native view into the stable UIKit sheet content container.
  [super insertChild:child atIndex:index];
  LynxUI *childUI = (LynxUI *)child;
  [_controller.contentView insertContentSubview:childUI.view atIndex:index];

  if ([child isKindOfClass:RNSFormSheetContentWrapperComponent.class]) {
    ((RNSFormSheetContentWrapperComponent *)child).delegate = self;
  }
}

- (void)removeChild:(id)child atIndex:(NSInteger)index
{
  if ([child isKindOfClass:RNSFormSheetContentWrapperComponent.class]) {
    ((RNSFormSheetContentWrapperComponent *)child).delegate = nil;
  }
  if ([child isKindOfClass:LynxUI.class]) {
    [_controller.contentView removeContentSubview:((LynxUI *)child).view];
  }
  [super removeChild:child atIndex:index];
}

#pragma mark - Providers

- (nullable UIWindow *)hostWindow
{
  return self.view.window;
}

- (BOOL)isOpen
{
  return _isOpen;
}

- (const std::vector<double> &)detents
{
  return _detents;
}

- (BOOL)prefersGrabberVisible
{
  return _prefersGrabberVisible;
}

- (CGFloat)preferredCornerRadius
{
  return _preferredCornerRadius;
}

- (NSInteger)largestUndimmedDetentIndex
{
  return _largestUndimmedDetentIndex;
}

- (NSInteger)initialDetentIndex
{
  return _initialDetentIndex;
}

- (BOOL)prefersScrollingExpandsWhenScrolledToEdge
{
  return _prefersScrollingExpandsWhenScrolledToEdge;
}

- (BOOL)preventNativeDismiss
{
  return _preventNativeDismiss;
}

- (nullable UIColor *)nativeContainerBackgroundColor
{
  return _nativeContainerBackgroundColor;
}

- (CGFloat)contentsHeight
{
  return _contentsHeight;
}

#pragma mark - Content wrapper

- (void)contentWrapper:(RNSFormSheetContentWrapperComponent *)wrapper didChangeContentsHeight:(CGFloat)height
{
  if (_contentsHeight != height) {
    _contentsHeight = height;
    [_controller setNeedsBehaviorUpdate];
    [_controller flushPendingUpdates];
  }
}

#pragma mark - Props

LYNX_PROP_SETTER("isOpen", setIsOpen, BOOL) {
  _isOpen = requestReset ? NO : value;
}

LYNX_PROP_SETTER("detents", setDetents, NSArray *) {
  _detents.clear();
  if (requestReset || value == nil) {
    return;
  }
  for (id detent in value) {
    if (![detent isKindOfClass:NSNumber.class]) {
      LLogError(@"[RNScreens] FormSheet detents must contain only numbers.");
      _detents.clear();
      return;
    }
    _detents.push_back([detent doubleValue]);
  }
}

LYNX_PROP_SETTER("prefersGrabberVisible", setPrefersGrabberVisible, BOOL) {
  _prefersGrabberVisible = requestReset ? NO : value;
}

LYNX_PROP_SETTER("preferredCornerRadius", setPreferredCornerRadius, CGFloat) {
  _preferredCornerRadius = requestReset ? -1.0 : value;
}

LYNX_PROP_SETTER("largestUndimmedDetentIndex", setLargestUndimmedDetentIndex, NSInteger) {
  _largestUndimmedDetentIndex = requestReset ? kRNSFormSheetAlwaysDimmed : value;
}

LYNX_PROP_SETTER("initialDetentIndex", setInitialDetentIndex, NSInteger) {
  _initialDetentIndex = requestReset ? 0 : value;
}

LYNX_PROP_SETTER("prefersScrollingExpandsWhenScrolledToEdge", setPrefersScrollingExpands, BOOL) {
  _prefersScrollingExpandsWhenScrolledToEdge = requestReset ? YES : value;
}

LYNX_PROP_SETTER("preventNativeDismiss", setPreventNativeDismiss, BOOL) {
  _preventNativeDismiss = requestReset ? NO : value;
}

LYNX_PROP_SETTER("nativeContainerBackgroundColor", setNativeContainerBackgroundColor, UIColor *) {
  // Adaptation: Lynx's prop processor performs native color conversion; no
  // RCT SharedColor conversion is needed.
  _nativeContainerBackgroundColor = requestReset ? nil : value;
}

- (void)propsDidUpdate
{
  [super propsDidUpdate];
  [_controller setNeedsPresentationUpdate];
  [_controller setNeedsAppearanceUpdate];
  [_controller setNeedsBehaviorUpdate];
  if (_isOpen && !_wasOpen) {
    [_controller setNeedsInitialDetentUpdate];
  }
  _wasOpen = _isOpen;
  [_controller flushPendingUpdates];
}

#pragma mark - RNSFormSheetContentControllerDelegate

- (nullable RNSFormSheetEventEmitter *)getEventEmitter
{
  if (_eventEmitter == nil && self.context != nil) {
    _eventEmitter = [[RNSFormSheetEventEmitter alloc] initWithEventEmitter:self.context.eventEmitter
                                                               targetSign:self.sign];
  }
  return _eventEmitter;
}

- (void)sheetControllerDidDismiss:(RNSFormSheetContentController *)controller
{
  [[self getEventEmitter] emitOnDismiss:NO];
}

- (void)sheetControllerDidNativeDismiss:(RNSFormSheetContentController *)controller
{
  _isOpen = NO;
  [[self getEventEmitter] emitOnDismiss:YES];
}

- (void)sheetControllerDidPreventNativeDismiss:(RNSFormSheetContentController *)controller
{
  [[self getEventEmitter] emitOnNativeDismissPrevented];
}

- (void)sheetControllerViewDidLayoutSubviews:(RNSFormSheetContentController *)controller
{
  [_shadowStateProxy updateShadowStateWithFrame:_controller.contentView.bounds];
}

#if !TARGET_OS_TV
- (void)sheetController:(RNSFormSheetContentController *)controller
    didChangeDetentIdentifier:(nullable NSString *)identifier
{
  NSInteger index = [RNSFormSheetDetentResolver detentIndexFromDetentIdentifier:identifier forRawDetents:_detents];
  if (index >= 0) {
    [[self getEventEmitter] emitOnDetentChanged:index];
  }
}
#endif

- (void)sheetControllerWillAppear:(RNSFormSheetContentController *)controller
{
  [[self getEventEmitter] emitOnWillAppear];
}

- (void)sheetControllerDidAppear:(RNSFormSheetContentController *)controller
{
  [[self getEventEmitter] emitOnDidAppear];
}

- (void)sheetControllerWillDisappear:(RNSFormSheetContentController *)controller
{
  [[self getEventEmitter] emitOnWillDisappear];
}

- (void)sheetControllerDidDisappear:(RNSFormSheetContentController *)controller
{
  [[self getEventEmitter] emitOnDidDisappear];
}

@end
