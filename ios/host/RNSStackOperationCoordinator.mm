#import "RNSStackOperationCoordinator.h"
#import "RNSStackNavigationController.h"
#import "RNSStackOperation.h"
#import "RNSStackScreenComponent.h"

@implementation RNSStackOperationCoordinator {
    NSMutableArray<RNSPushOperation *> *_Nonnull _pendingPushOperations;
    NSMutableArray<RNSPopOperation *> *_Nonnull _pendingPopOperations;
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
    _pendingPushOperations = [NSMutableArray array];
    _pendingPopOperations = [NSMutableArray array];
}

- (BOOL)hasPendingOperations
{
    return _pendingPushOperations.count > 0 || _pendingPopOperations.count > 0;
}

- (void)addPushOperation:(nonnull RNSStackScreenComponent *)stackScreen
{
    RNSPushOperation *operation = [[RNSPushOperation alloc] initWithScreen:stackScreen];
    [_pendingPushOperations addObject:operation];
}

- (void)addPopOperation:(nonnull RNSStackScreenComponent *)stackScreen
{
    RNSPopOperation *operation = [[RNSPopOperation alloc] initWithScreen:stackScreen];
    [_pendingPopOperations addObject:operation];
}

/**
 * Divergence from RNS: Lynx realizes keyed reorders of the host's children
 * (e.g. a preloaded route moving into the attached region of the stack state)
 * as remove + insert of the same screen within one transaction. Together with
 * the activity-mode change handler this enqueues spurious pop/push pairs and
 * duplicated pushes alongside the real operations - Fabric mounting does not
 * replay moves this way. Instead of executing the raw operation list, reduce
 * it to at most one net operation per screen, derived from the screen's final
 * activity mode and its current presence in the navigation controller.
 */
- (void)executePendingOperationsIfNeeded:(nonnull RNSStackNavigationController *)controller
                     withRenderedScreens:(nonnull NSMutableArray<RNSStackScreenComponent *> *)renderedScreens
{
    if (![self hasPendingOperations]) {
        return;
    }

    // Part of the same divergence: the net operations below are derived from
    // the controller's current viewControllers, and on iOS 26 UIKit applies
    // animated stack updates only once their transition runs. Waiting out an
    // active transition keeps the derivation - and the container's top-screen
    // checks - based on settled state. Pending operations are kept until
    // actually executed.
    if (controller.transitionCoordinator != nil) {
        __weak RNSStackOperationCoordinator *weakSelf = self;
        [controller.transitionCoordinator
            animateAlongsideTransition:nil
                            completion:^(id<UIViewControllerTransitionCoordinatorContext> _Nonnull context) {
                                [weakSelf executePendingOperationsIfNeeded:controller
                                                       withRenderedScreens:renderedScreens];
                            }];
        return;
    }

    NSMutableOrderedSet<RNSStackScreenComponent *> *screensWithOperations = [NSMutableOrderedSet new];
    for (RNSPopOperation *op in _pendingPopOperations) {
        [screensWithOperations addObject:op.stackScreen];
    }
    for (RNSPushOperation *op in _pendingPushOperations) {
        [screensWithOperations addObject:op.stackScreen];
    }

    NSArray<UIViewController *> *currentControllers = controller.viewControllers;

    NSMutableArray<RNSStackScreenComponent *> *screensToPop = [NSMutableArray new];
    NSMutableArray<RNSStackScreenComponent *> *screensToPush = [NSMutableArray new];

    for (RNSStackScreenComponent *screen in screensWithOperations) {
        BOOL isInController = [currentControllers containsObject:static_cast<UIViewController *>(screen.controller)];

        if (screen.activityMode == RNSStackScreenActivityModeDetached) {
            if (isInController) {
                [screensToPop addObject:screen];
            }
        } else if (!isInController && !screen.isNativelyDismissed) {
            [screensToPush addObject:screen];
        }
    }

    // Pops must be performed top-first for the container's top-screen checks
    // to hold.
    [screensToPop sortUsingComparator:^NSComparisonResult(RNSStackScreenComponent *lhs, RNSStackScreenComponent *rhs) {
        NSUInteger lhsIndex = [currentControllers indexOfObject:static_cast<UIViewController *>(lhs.controller)];
        NSUInteger rhsIndex = [currentControllers indexOfObject:static_cast<UIViewController *>(rhs.controller)];
        return [@(rhsIndex) compare:@(lhsIndex)];
    }];

    // Pushes follow the host's rendered-screens order (attach order), which
    // matches the order of the JS stack state for attached screens.
    [screensToPush sortUsingComparator:^NSComparisonResult(RNSStackScreenComponent *lhs, RNSStackScreenComponent *rhs) {
        return [@([renderedScreens indexOfObject:lhs]) compare:@([renderedScreens indexOfObject:rhs])];
    }];

    for (RNSStackScreenComponent *screen in screensToPop) {
        [controller enqueuePopOperation:screen];
    }

    for (RNSStackScreenComponent *screen in screensToPush) {
        [controller enqueuePushOperation:screen];
    }

    [controller performContainerUpdateIfNeeded];

    [_pendingPopOperations removeAllObjects];
    [_pendingPushOperations removeAllObjects];
}

@end
