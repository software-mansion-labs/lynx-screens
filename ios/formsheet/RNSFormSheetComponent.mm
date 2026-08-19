#import "RNSFormSheetComponent.h"
#import "RNSFormSheetController.h"
#import "RNSFormSheetEventEmitter.h"

#import <Lynx/LynxComponentRegistry.h>
#import <Lynx/LynxEventHandler.h>
#import <Lynx/LynxLog.h>
#import <Lynx/LynxPropsProcessor.h>
#import <Lynx/LynxTouchHandler.h>
#import <Lynx/LynxUI+Internal.h>

@interface RNSFormSheetContentView : BaseTransferReceiverView

@property (nonatomic, weak) LynxEventHandler *eventHandler;

@end


@implementation RNSFormSheetContentView

- (UIView *)hitTest:(CGPoint)point withEvent:(UIEvent *)event
{
    // Detached sheet content bypasses LynxView's hook, so record the Lynx target here.
    [self.eventHandler hitTest:point withEvent:event];
    return [super hitTest:point withEvent:event];
}

@end


@LynxElement("form-sheet-native")
@implementation RNSFormSheetComponent {
    RNSFormSheetContentView *_contentView;
    RNSFormSheetController *_controller;
    RNSFormSheetEventEmitter *_eventEmitter;
    LynxEventHandler *_sheetEventHandler;
    NSInteger _gestureArenaIndex;

    BOOL _isOpen;
    BOOL _previousRequestedOpen;
    BOOL _isPresented;
    BOOL _isTransitioning;
    BOOL _nativeDismissedForCurrentRequest;
    NSUInteger _transitionGeneration;
    NSString *_nativeContainerBackgroundColor;
}

LYNX_LAZY_REGISTER_UI("form-sheet-native")

- (instancetype)init
{
    if (self = [super init]) {
        _contentView = (RNSFormSheetContentView *)self.transferReceiver;
        // Transparent by default; nativeContainerStyle.backgroundColor can
        // provide the sheet surface color.
        _contentView.backgroundColor = UIColor.clearColor;
        _controller = [[RNSFormSheetController alloc] initWithComponent:self contentView:_contentView];
        _detents = @[];
        _preferredCornerRadius = -1;
        _largestUndimmedDetentIndex = -1;
        _initialDetentIndex = 0;
        _selectedDetentIndex = -2;
        _prefersScrollingExpandsWhenScrolledToEdge = YES;
        _gestureArenaIndex = -1;
    }
    return self;
}

- (BaseTransferReceiverView *)createTransferReceiver
{
    return [[RNSFormSheetContentView alloc] initWithTransfer:self];
}

- (UIView *)createView
{
    RNSFormSheetHostView *view = [[RNSFormSheetHostView alloc] init];
    view.component = self;
    return view;
}

LYNX_PROP_SETTER("isOpen", setIsOpen, BOOL) {
    _isOpen = requestReset ? NO : value;
}

LYNX_PROP_SETTER("detents", setDetents, NSArray *) {
    self.detents = requestReset ? @[] : (value ?: @[]);
}

LYNX_PROP_SETTER("prefersGrabberVisible", setPrefersGrabberVisible, BOOL) {
    self.prefersGrabberVisible = requestReset ? NO : value;
}

LYNX_PROP_SETTER("preferredCornerRadius", setPreferredCornerRadius, CGFloat) {
    self.preferredCornerRadius = requestReset ? -1 : value;
}

LYNX_PROP_SETTER("largestUndimmedDetentIndex", setLargestUndimmedDetentIndex, NSInteger) {
    self.largestUndimmedDetentIndex = requestReset ? -1 : value;
}

LYNX_PROP_SETTER("initialDetentIndex", setInitialDetentIndex, NSInteger) {
    self.initialDetentIndex = requestReset ? 0 : value;
}

LYNX_PROP_SETTER("selectedDetentIndex", setSelectedDetentIndex, NSInteger) {
    self.selectedDetentIndex = requestReset ? -2 : value;
}

LYNX_PROP_SETTER("prefersScrollingExpandsWhenScrolledToEdge", setPrefersScrollingExpandsWhenScrolledToEdge, BOOL) {
    self.prefersScrollingExpandsWhenScrolledToEdge = requestReset ? YES : value;
}

LYNX_PROP_SETTER("preventNativeDismiss", setPreventNativeDismiss, id) {
    NSArray *channels;
    if (requestReset) {
        channels = @[];
    } else if ([value isKindOfClass:NSArray.class]) {
        channels = value;
    } else if ([value isKindOfClass:NSNumber.class] && [value boolValue]) {
        // `true` blocks every native dismissal channel.
        channels = @[ @"back", @"drag", @"backdrop" ];
    } else {
        channels = @[];
    }
    self.preventNativeDismissChannels = channels;
}

LYNX_PROP_SETTER("preventNativeDismissDragFeedback", setPreventNativeDismissDragFeedback, BOOL) {
    self.preventNativeDismissDragFeedback = requestReset ? NO : value;
}

- (BOOL)isDismissPreventedForChannel:(NSString *)channel
{
    for (NSString *item in self.preventNativeDismissChannels) {
        if ([item isEqualToString:channel]) {
            return YES;
        }
    }
    return NO;
}

LYNX_PROP_SETTER("nativeContainerBackgroundColor", setNativeContainerBackgroundColor, NSString *) {
    _nativeContainerBackgroundColor = requestReset ? nil : value;
    UIColor *backgroundColor = [self colorFromString:_nativeContainerBackgroundColor];
    if (!backgroundColor) {
        backgroundColor = UIColor.clearColor;
    }
    _contentView.backgroundColor = backgroundColor;
}

- (void)propsDidUpdate
{
    [self reconcilePresentation];
}

- (void)layoutDidFinished
{
    [super layoutDidFinished];
    [_controller invalidateDetents];
}

- (void)hostViewDidMoveToWindow
{
    if (self.view.window) {
        [self attachSheetEventHandlerIfNeeded];
        [self reconcilePresentation];
        return;
    }

    if (_isPresented || _isTransitioning) {
        NSUInteger generation = ++_transitionGeneration;
        _isTransitioning = YES;
        [_controller dismissViewControllerAnimated:NO completion:^{
            if (generation != self->_transitionGeneration) {
                return;
            }
            self->_isTransitioning = NO;
            self->_isPresented = NO;
            [self reconcilePresentation];
        }];
    }
}

- (void)attachSheetEventHandlerIfNeeded
{
    if (_sheetEventHandler || !self.context.eventHandler) {
        return;
    }

    _sheetEventHandler = [[LynxEventHandler alloc] initWithRootView:_contentView withRootUI:self];
    _contentView.eventHandler = _sheetEventHandler;
    [_sheetEventHandler updateUiOwner:self.context.uiOwner eventEmitter:self.context.eventEmitter];
    _gestureArenaIndex = [_sheetEventHandler setGestureArenaManagerAndGetIndex:self.context.eventHandler.gestureArenaManager];
}

- (id<LynxEventTarget>)hitTest:(CGPoint)point withEvent:(UIEvent *)event
{
    for (LynxUI *child in self.children.reverseObjectEnumerator) {
        if (![child shouldHitTest:point withEvent:event]) {
            continue;
        }
        CGPoint childPoint = [_contentView.layer convertPoint:point toLayer:child.view.layer];
        CGPoint hitTestPoint = self.context.enableEventRefactor ? childPoint : point;
        if ([child containsPoint:hitTestPoint]) {
            return [child hitTest:childPoint withEvent:event];
        }
    }
    return self;
}

- (void)dealloc
{
    if (_gestureArenaIndex >= 0) {
        [_sheetEventHandler removeGestureArenaManager:_gestureArenaIndex];
    }
    [_contentView removeGestureRecognizer:_sheetEventHandler.touchRecognizer];
    [_contentView removeGestureRecognizer:_sheetEventHandler.tapRecognizer];
    [_contentView removeGestureRecognizer:_sheetEventHandler.longPressRecognizer];
}

- (void)reconcilePresentation
{
    if (_isOpen != _previousRequestedOpen) {
        _previousRequestedOpen = _isOpen;
        if (_isOpen) {
            _nativeDismissedForCurrentRequest = NO;
        }
    }
    if (!_isOpen) {
        _nativeDismissedForCurrentRequest = NO;
    }

    if (_isTransitioning) {
        return;
    }

    if (_isOpen && !_isPresented && !_nativeDismissedForCurrentRequest && self.view.window) {
        UIViewController *presenter = [self presentingViewController];
        if (!presenter) {
            return;
        }

        _isTransitioning = YES;
        _isPresented = YES;
        NSUInteger generation = ++_transitionGeneration;
        [_controller applyConfigurationApplyingInitialDetent:YES];
        [presenter presentViewController:_controller animated:YES completion:^{
            if (generation != self->_transitionGeneration) {
                return;
            }
            self->_isTransitioning = NO;
            [self reconcilePresentation];
        }];
    } else if (!_isOpen && _isPresented) {
        _isTransitioning = YES;
        NSUInteger generation = ++_transitionGeneration;
        [_controller dismissSheetWithCompletion:^{
            if (generation != self->_transitionGeneration) {
                return;
            }
            self->_isTransitioning = NO;
            self->_isPresented = NO;
            [[self eventEmitter] emitOnDismiss];
            [self reconcilePresentation];
        }];
    } else if (_isOpen && _isPresented) {
        [_controller applyConfigurationApplyingInitialDetent:NO];
    }
}

- (UIViewController *)presentingViewController
{
    UIResponder *responder = self.view.nextResponder;
    while (responder && ![responder isKindOfClass:UIViewController.class]) {
        responder = responder.nextResponder;
    }

    UIViewController *presenter = (UIViewController *)responder;
    while (presenter.presentedViewController && presenter.presentedViewController != _controller) {
        presenter = presenter.presentedViewController;
    }
    return presenter;
}

- (CGFloat)measuredContentHeight
{
    CGFloat height = self.view.bounds.size.height;
    for (UIView *subview in _contentView.subviews) {
        height = MAX(height, CGRectGetMaxY(subview.frame));
    }
    return height;
}

- (UIColor *)resolvedContainerBackgroundColor
{
    return _contentView.backgroundColor;
}

- (void)formSheetWasNativelyDismissed
{
    if (!_isPresented || _isTransitioning) {
        return;
    }
    _isPresented = NO;
    _nativeDismissedForCurrentRequest = YES;
    [[self eventEmitter] emitOnNativeDismiss];
}

- (void)formSheetDidDisappear
{
    if (_isPresented && !_isTransitioning && !_controller.presentingViewController) {
        [self formSheetWasNativelyDismissed];
    }
}

- (RNSFormSheetEventEmitter *)eventEmitter
{
    if (!_eventEmitter && self.context) {
        _eventEmitter = [[RNSFormSheetEventEmitter alloc] initWithEventEmitter:self.context.eventEmitter
                                                                    targetSign:self.sign];
    }
    return _eventEmitter;
}

- (void)emitOnWillAppear
{
    [[self eventEmitter] emitOnWillAppear];
}

- (void)emitOnDidAppear
{
    [[self eventEmitter] emitOnDidAppear];
}

- (void)emitOnWillDisappear
{
    [[self eventEmitter] emitOnWillDisappear];
}

- (void)emitOnDidDisappear
{
    [[self eventEmitter] emitOnDidDisappear];
}

- (void)emitOnNativeDismissPreventedWithChannel:(NSString *)channel
{
    [[self eventEmitter] emitOnNativeDismissPreventedWithChannel:channel];
}

- (void)emitOnDetentChanged:(NSInteger)index
{
    [[self eventEmitter] emitOnDetentChanged:index];
}

- (UIColor *)colorFromString:(NSString *)value
{
    if (!value) {
        return nil;
    }
    if ([value isEqualToString:@"transparent"]) {
        return UIColor.clearColor;
    }
    if (![value hasPrefix:@"#"]) {
        return nil;
    }

    NSString *hex = [value substringFromIndex:1];
    unsigned long long number = 0;
    if (![[NSScanner scannerWithString:hex] scanHexLongLong:&number]) {
        return nil;
    }

    if (hex.length == 6) {
        return [UIColor colorWithRed:((number >> 16) & 0xff) / 255.0
                               green:((number >> 8) & 0xff) / 255.0
                                blue:(number & 0xff) / 255.0
                               alpha:1];
    }
    if (hex.length == 8) {
        return [UIColor colorWithRed:((number >> 24) & 0xff) / 255.0
                               green:((number >> 16) & 0xff) / 255.0
                                blue:((number >> 8) & 0xff) / 255.0
                               alpha:(number & 0xff) / 255.0];
    }
    return nil;
}

@end
