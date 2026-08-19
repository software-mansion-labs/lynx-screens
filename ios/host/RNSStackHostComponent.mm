#import "RNSStackHostComponent.h"
#import "RNSStackScreenComponent.h"

#import <Lynx/LynxComponentRegistry.h>
#import <Lynx/LynxLog.h>

#import "RNSStackNavigationController.h"
#import "RNSStackOperationCoordinator.h"

@LynxElement("ls-stack-host")
@implementation RNSStackHostComponent {
    RNSStackNavigationController *_Nonnull _stackNavigationController;
    RNSStackOperationCoordinator *_Nonnull _stackOperationCoordinator;
    NSMutableArray<RNSStackScreenComponent *> *_Nonnull _renderedScreens;
    BOOL _isMountingTransactionPending;
}

#pragma mark - Init

- (instancetype)init
{
    if (self = [super init]) {
        [self initState];
    }
    return self;
}

- (void)initState
{
    _stackNavigationController = [RNSStackNavigationController new];
    _stackOperationCoordinator = [RNSStackOperationCoordinator new];
    _renderedScreens = [NSMutableArray new];
    _isMountingTransactionPending = NO;
}

#pragma mark - View Management

- (UIView *)createView {
    RNSStackHostView *stackHostView = [[RNSStackHostView alloc] init];
    stackHostView.component = self;
    return stackHostView;
}

- (void)viewDidMoveToWindow
{
    LLogInfo(@"[RNScreens] StackHost [%ld] attached to window", (long)self.view.tag);
    [self lynxAddControllerToClosestParent:_stackNavigationController];
    [self setupViewConstraintsForController:_stackNavigationController];
}

#pragma mark - Communication with StackScreen

- (void)stackScreenChangedActivityMode:(nonnull RNSStackScreenComponent *)stackScreen
{
    NSAssert(stackScreen != nil, @"[RNScreens] Expected non nill stackScreen");
    switch (stackScreen.activityMode) {
        case RNSStackScreenActivityModeAttached:
            // Lynx attaches children on insert by default. To support preloading,
            // we manually trigger the insert logic only when confirmed ATTACHED.
            [self insertChild:stackScreen atIndex:self.children.count];
            break;
        case RNSStackScreenActivityModeDetached:
            [_stackOperationCoordinator addPopOperation:stackScreen];
            [self scheduleMountingTransactionFinishIfNeeded];
            break;
        default:
            NSAssert(NO, @"[RNScreens] Unexpected value of activityMode: %d", stackScreen.activityMode);
            return;
    }
}

#pragma mark - Children Lifecycle

- (void)insertChild:(id)child atIndex:(NSInteger)index
{
    NSAssert(
             [child isKindOfClass:[RNSStackScreenComponent class]],
             @"[RNScreens] Attempt to mount child of unsupported type: %@, expected %@",
             [child class],
             RNSStackScreenComponent.class
             );
    RNSStackScreenComponent *stackScreen = (RNSStackScreenComponent *)child;
    stackScreen.stackHost = self;

    if (stackScreen.activityMode == RNSStackScreenActivityModeAttached) {
        [_renderedScreens addObject:stackScreen];
        [self addPushOperationIfNeeded:stackScreen];
        // Insert always at the last index
        [super insertChild:stackScreen atIndex:self.children.count];
        [self scheduleMountingTransactionFinishIfNeeded];
    }
}

- (void)removeChild:(id)child atIndex:(NSInteger)index
{
    NSAssert(
             [child isKindOfClass:[RNSStackScreenComponent class]],
             @"[RNScreens] Attempt to unmount child of unsupported type: %@, expected %@",
             [child class],
             RNSStackScreenComponent.class
             );
    RNSStackScreenComponent *stackScreen = (RNSStackScreenComponent *)child;

    [_renderedScreens removeObject:stackScreen];
    stackScreen.stackHost = nil;
    [self addPopOperationIfNeeded:stackScreen];

    // We're taking over the responsibility for managing indices, because of the symmetrical
    // responsibility for attaching children to handle the preload case
    NSUInteger stackScreenIndex = [self.children indexOfObject:stackScreen];
    if (stackScreenIndex != NSNotFound) {
        [super removeChild:stackScreen atIndex:stackScreenIndex];
    }

    [self scheduleMountingTransactionFinishIfNeeded];
}

#pragma mark - Utils

- (void)addPushOperationIfNeeded:(nonnull RNSStackScreenComponent *)stackScreen
{
    if (stackScreen.activityMode == RNSStackScreenActivityModeAttached) {
        [_stackOperationCoordinator addPushOperation:stackScreen];
    }
}

- (void)addPopOperationIfNeeded:(nonnull RNSStackScreenComponent *)stackScreen
{
    if (stackScreen.activityMode == RNSStackScreenActivityModeAttached && !stackScreen.isNativelyDismissed) {
        // This shouldn't happen in typical scenarios but it can happen with fast-refresh.
        [_stackOperationCoordinator addPopOperation:stackScreen];
    } else {
        LLogInfo(
            @"[RNScreens] ignoring pop operation of %@, already not attached or natively dismissed",
            stackScreen.screenKey);
    }
}

- (UIViewController *)lynxViewControllerForView:(UIView *)view
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

- (void)lynxAddControllerToClosestParent:(UIViewController *)controller
{
    NSAssert(controller != nil, @"[RNScreens] Attempt to move to a nullish controller");
    if (!controller.parentViewController) {
        UIView *parentView = self.view.superview;
        while (parentView) {
            UIViewController *vc = [self lynxViewControllerForView:parentView];
            if (vc) {
                [vc addChildViewController:controller];
                [self.view addSubview:controller.view];
                controller.view.frame = self.view.bounds;
                [controller didMoveToParentViewController:vc];
                break;
            }
            parentView = parentView.superview;
        }
        return;
    }
}

- (void)setupViewConstraintsForController:(nonnull UIViewController *)controller
{
    if (controller.view.superview != self.view) {
        // lynxAddControllerToClosestParent did not attach the controller yet -
        // constraints would have no common ancestor.
        return;
    }

    // Enable auto-layout to ensure valid size of stack controller view.
    controller.view.translatesAutoresizingMaskIntoConstraints = NO;
    [NSLayoutConstraint activateConstraints:@[
        [controller.view.topAnchor constraintEqualToAnchor:self.view.topAnchor],
        [controller.view.bottomAnchor constraintEqualToAnchor:self.view.bottomAnchor],
        [controller.view.leadingAnchor constraintEqualToAnchor:self.view.leadingAnchor],
        [controller.view.trailingAnchor constraintEqualToAnchor:self.view.trailingAnchor]
    ]];
}

#pragma mark - Mounting Transaction

/**
 * Lynx has no mounting-transaction observer on iOS, so we coalesce all updates scheduled
 * within a single runloop tick and treat the async hop as the transaction end - the
 * counterpart of RNS's RCTMountingTransactionObserving.
 */
- (void)scheduleMountingTransactionFinishIfNeeded
{
    if (_isMountingTransactionPending) {
        return;
    }
    _isMountingTransactionPending = YES;

    dispatch_async(dispatch_get_main_queue(), ^{
        self->_isMountingTransactionPending = NO;
        [self lynxMountingTransactionDidFinish];
    });
}

- (void)lynxMountingTransactionDidFinish
{
    [_stackOperationCoordinator executePendingOperationsIfNeeded:_stackNavigationController
                                             withRenderedScreens:_renderedScreens];
}

@end
