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
    BOOL hasPendingPushes = _pendingPushOperations.count > 0;

    NSUInteger popIndex = 0;
    for (RNSPopOperation *op in _pendingPopOperations) {
        UIViewController *controller = static_cast<UIViewController *>(op.stackScreen.controller);
        NSAssert([self.viewControllers count] > 1, @"[RNScreens] Attempt to pop last screen from the stack");
        NSAssert(self.topViewController == controller, @"[RNScreens] Attempt to pop non-top screen");
        BOOL isFinalOperation =
            !hasPendingPushes && popIndex == _pendingPopOperations.count - 1;
        [self popViewControllerAnimated:isFinalOperation];
        popIndex += 1;
    }

    NSUInteger pushIndex = 0;
    for (RNSPushOperation *op in _pendingPushOperations) {
        UIViewController *controller = static_cast<UIViewController *>(op.stackScreen.controller);
        BOOL isFinalOperation = pushIndex == _pendingPushOperations.count - 1;
        [self pushViewController:controller animated:isFinalOperation];
        pushIndex += 1;
    }

    NSAssert([self.viewControllers count] > 0, @"[RNScreens] Stack should never be empty after updates");

    [self dumpStackModel];

    [_pendingPopOperations removeAllObjects];
    [_pendingPushOperations removeAllObjects];
}

#pragma mark - Layout

- (void)viewDidLayoutSubviews
{
    [super viewDidLayoutSubviews];
    [_navigationBarFrameChangeDelegate viewFrameDidChange:self.navigationBar];
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
