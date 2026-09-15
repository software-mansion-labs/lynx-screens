#import "RNSStackNavigationController.h"
#import <Lynx/LynxLog.h>
#import "RNSContainer.h"
#import "RNSParentContainerItemRegistry.h"
#import "RNSStackOperation.h"
#import "RNSStackScreenController.h"
#import "RNSViewFrameChangeDelegate.h"

@implementation RNSStackNavigationController {
    NSMutableArray<RNSPushOperation *> *_Nonnull _pendingPushOperations;
    NSMutableArray<RNSPopOperation *> *_Nonnull _pendingPopOperations;
    RNSParentContainerItemRegistry *_Nonnull _parentContainerRegistry;
    NSString *_traceContainerId;
    RNSNavigationTraceOperation *_traceOperation;
    BOOL _applyingJSOperations;
}

- (instancetype)init
{
    if (self = [super init]) {
        _navigationBarCoordinator = [RNSStackNavigationBarCoordinator new];
        [_navigationBarCoordinator initializeNavigationBarOfNavigationController:self];
        [self initState];
    }
    return self;
}

- (void)initState
{
    _pendingPushOperations = [NSMutableArray array];
    _pendingPopOperations = [NSMutableArray array];
    _parentContainerRegistry = [RNSParentContainerItemRegistry new];
}

#pragma mark - RNSContainer

- (nullable UIScrollView *)resolveCurrentContentScrollView
{
    // We assume `topViewController` corresponds to the currently presented screen.
    UIViewController *topController = self.topViewController;
    if (![topController isKindOfClass:RNSStackScreenController.class]) {
        return nil;
    }
    return [static_cast<RNSStackScreenController *>(topController) findContentScrollView];
}

- (void)attachToParentContainerItem
{
    [_parentContainerRegistry attachContainer:self];
}

- (void)detachFromParentContainerItem
{
    [_parentContainerRegistry detachContainer:self];
}

#pragma mark - View controller containment

- (void)didMoveToParentViewController:(UIViewController *)parent
{
    [super didMoveToParentViewController:parent];

    if (parent != nil) {
        [self attachToParentContainerItem];
    } else {
        [self detachFromParentContainerItem];
    }
}

- (BOOL)hasPendingOperations
{
    return _pendingPushOperations.count > 0 || _pendingPopOperations.count > 0;
}

- (void)enqueuePushOperation:(nonnull RNSStackScreenComponent *)stackScreen
{
    RNSPushOperation *operation = [[RNSPushOperation alloc] initWithScreen:stackScreen];
    [_pendingPushOperations addObject:operation];
}

- (void)enqueuePopOperation:(nonnull RNSStackScreenComponent *)stackScreen
{
    RNSPopOperation *operation = [[RNSPopOperation alloc] initWithScreen:stackScreen];
    [_pendingPopOperations addObject:operation];
}

- (RNSNavigationTraceOperation *)prepareTraceFrom:(NSArray *)before to:(NSArray *)after native:(BOOL)native
{
    if (!self.traceSession)
        return nil;
    if (!_traceContainerId)
        _traceContainerId = [@"stack:" stringByAppendingString:NSUUID.UUID.UUIDString];
    NSMutableArray *beforeKeys = [NSMutableArray new], *afterKeys = [NSMutableArray new];
    NSMutableDictionary *contents = [NSMutableDictionary new];
    for (RNSStackScreenController *controller in [before arrayByAddingObjectsFromArray:after]) {
        RNSStackScreenComponent *screen = controller.screenComponent;
        if (screen.screenKey && screen.traceContent)
            contents[screen.screenKey] = screen.traceContent;
    }
    for (RNSStackScreenController *controller in before)
        if (controller.screenComponent.screenKey)
            [beforeKeys addObject:controller.screenComponent.screenKey];
    for (RNSStackScreenController *controller in after)
        if (controller.screenComponent.screenKey)
            [afterKeys addObject:controller.screenComponent.screenKey];
    NSDictionary *expected = @{@"kind" : @"stack", @"beforeScreenKeys" : beforeKeys, @"afterScreenKeys" : afterKeys};
    NSDictionary *binding = native ? nil : [self.traceBatch consumeForContainer:_traceContainerId expected:expected];
    [_traceOperation finish:@"cancelled" reason:@"superseded"];
    NSString *operation = after.count < before.count ? @"pop" : after.count > before.count ? @"push" : @"replace";
    _traceOperation = [[RNSNavigationTraceOperation alloc] initWithPrefix:@"LynxScreens.Stack"
                                                                container:_traceContainerId
                                                                  session:self.traceSession
                                                                operation:operation
                                                                   origin:native ? @"native_back" : @"lynx_patch"
                                                                  binding:binding
                                                                 contents:contents
                                                            nativeRequest:native];
    for (RNSStackScreenController *controller in [before arrayByAddingObjectsFromArray:after])
        controller.screenComponent.traceOperation = _traceOperation;
    [_traceOperation mark:native ? @"NativeBackRequested" : @"OperationBatchPrepared"
                   fields:binding || native ? @{} : @{@"unlinked_reason" : @"missing_context"}];
    return _traceOperation;
}

- (void)completeTrace:(RNSNavigationTraceOperation *)operation animated:(BOOL)animated
{
    if (!operation)
        return;
    [operation start:animated];
    id<UIViewControllerTransitionCoordinator> coordinator = self.transitionCoordinator;
    if (coordinator) {
        BOOL registered =
            [coordinator animateAlongsideTransition:nil
                                         completion:^(id<UIViewControllerTransitionCoordinatorContext> context) {
                                           [operation mark:@"TransitionCallbackReceived"
                                                    fields:@{@"phase" : context.isCancelled ? @"cancel" : @"end"}];
                                           [operation finish:context.isCancelled ? @"cancelled" : @"completed"
                                                      reason:context.isCancelled ? @"interactive_cancelled" : nil];
                                         }];
        if (!registered)
            [operation finish:@"cancelled" reason:@"completion_unavailable"];
    } else {
        [operation finish:@"completed" reason:nil];
    }
}

- (UIViewController *)popViewControllerAnimated:(BOOL)animated
{
    if (_applyingJSOperations || !self.traceSession || self.viewControllers.count < 2)
        return [super popViewControllerAnimated:animated];
    NSArray *before = self.viewControllers;
    RNSNavigationTraceOperation *operation =
        [self prepareTraceFrom:before to:[before subarrayWithRange:NSMakeRange(0, before.count - 1)] native:YES];
    [operation start:animated];
    UIViewController *result = [super popViewControllerAnimated:animated];
    if (result)
        [self completeTrace:operation animated:animated];
    else
        [operation finish:@"cancelled" reason:@"no_native_change"];
    return result;
}

- (void)performContainerUpdateIfNeeded
{
    // NOTE: We consider UINavigationController.viewControllers to be part of
    // the internal state of our stack implementation and expect it to be
    // *synchronously* updated by UIKit while we perform our pop and push operations
    //
    // The assertions below work under this assumption

    if (![self hasPendingOperations]) {
        return;
    }

    // Divergence from RNS: only the operation that establishes the final top
    // screen is animated; the preceding ones run with animated:NO so UIKit
    // applies them synchronously. In RNS the batched calls land inside the
    // Fabric mounting transaction, where UIKit coalesces them into a single
    // transition on its own; with our timing (iOS 26 starts the first
    // animated transition eagerly) every animated call would defer the
    // following ones, serializing one animation per operation and re-breaking
    // the synchronous update assumption.
    NSMutableArray *after = [self.viewControllers mutableCopy];
    for (RNSPopOperation *op in _pendingPopOperations)
        [after removeObject:op.stackScreen.controller];
    for (RNSPushOperation *op in _pendingPushOperations)
        [after addObject:op.stackScreen.controller];
    RNSNavigationTraceOperation *operation = [self prepareTraceFrom:self.viewControllers to:after native:NO];
    [operation start:YES];
    _applyingJSOperations = YES;
    void (^applyOperations)(void) = ^{
      BOOL hasPendingPushes = self->_pendingPushOperations.count > 0;

      NSUInteger popIndex = 0;
      for (RNSPopOperation *op in self->_pendingPopOperations) {
          UIViewController *controller = static_cast<UIViewController *>(op.stackScreen.controller);
          NSAssert([self.viewControllers count] > 1, @"[RNScreens] Attempt to pop last screen from the stack");
          NSAssert(self.topViewController == controller, @"[RNScreens] Attempt to pop non-top screen");
          BOOL isFinalOperation = !hasPendingPushes && popIndex == self->_pendingPopOperations.count - 1;
          [self popViewControllerAnimated:isFinalOperation];
          popIndex += 1;
      }

      NSUInteger pushIndex = 0;
      for (RNSPushOperation *op in self->_pendingPushOperations) {
          UIViewController *controller = static_cast<UIViewController *>(op.stackScreen.controller);
          BOOL isFinalOperation = pushIndex == self->_pendingPushOperations.count - 1;
          [self pushViewController:controller animated:isFinalOperation];
          pushIndex += 1;
      }

      NSAssert([self.viewControllers count] > 0, @"[RNScreens] Stack should never be empty after updates");

      [self dumpStackModel];
    };
    @try {
        if (operation)
            RNSTraceSection(@"LynxScreens.Stack.ApplyOperations", RNSTraceFields(operation.identity), applyOperations);
        else
            applyOperations();
    } @finally {
        _applyingJSOperations = NO;
    }
    [self completeTrace:operation animated:YES];

    [_pendingPopOperations removeAllObjects];
    [_pendingPushOperations removeAllObjects];
}

#pragma mark - Layout

- (void)viewDidLayoutSubviews
{
    [super viewDidLayoutSubviews];
    [_navigationBarFrameChangeDelegate viewFrameDidChange:self.navigationBar];
}

- (void)dealloc
{
    [_traceOperation finish:@"cancelled" reason:@"destroyed"];
}

#pragma mark - Debug

- (void)dumpStackModel
{
    LLogInfo(@"[RNScreens] StackContainer [%ld] MODEL BEGIN", (long)self.view.tag);
    for (UIViewController *viewController in self.viewControllers) {
        LLogInfo(@"[RNScreens] %@", static_cast<RNSStackScreenController *>(viewController).screenComponent.screenKey);
    }
}

@end
