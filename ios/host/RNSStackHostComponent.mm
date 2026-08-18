#import "RNSStackHostComponent.h"
#import "RNSStackScreenComponent.h"

#import <Lynx/LynxComponentRegistry.h>
#import <Lynx/LynxLog.h>

#import "LynxScreens-Swift.h"

@LynxElement("ls-stack-host")
@implementation RNSStackHostComponent {
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
    _controller = [[RNSStackController alloc] initWithStackHostComponent:self];
    _hasModifiedSubviewsInCurrentTransaction = NO;
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
    [self lynxAddControllerToClosestParent:_controller];
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

#pragma mark - Getters

- (nonnull RNSStackController *)stackController
{
    NSAssert(_controller != nil, @"[RNScreens] Controller must not be nil");
    return _controller;
}

#pragma mark - Communication with StackScreen

- (void)stackScreenChangedActivityMode:(nonnull RNSStackScreenComponent *)stackScreen
{
    [self synchronizeStackScreenMountState:stackScreen];
}

- (void)synchronizeStackScreenMountState:(nonnull RNSStackScreenComponent *)stackScreen
{
    [_controller setNeedsUpdateOfChildViewControllers];
    [self updateChildMountingForStackScreen:stackScreen];
    
    if (!_isMountingTransactionPending) {
        _isMountingTransactionPending = YES;
        
        dispatch_async(dispatch_get_main_queue(), ^{
            self->_isMountingTransactionPending = NO;
            [self lynxMountingTransactionDidFinish];
        });
    }
}

#pragma mark - Mounting Transaction

- (void)lynxMountingTransactionDidFinish
{
    if (self.hasModifiedSubviewsInCurrentTransaction) {
        [_controller setNeedsUpdateOfChildViewControllers];
        self.hasModifiedSubviewsInCurrentTransaction = NO;
    }
    [_controller lynxMountingTransactionDidFinish];
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
    self.hasModifiedSubviewsInCurrentTransaction = YES;
    
    NSLog(
          @"StackHost [%ld] mount: StackScreen [%ld] (%@) at %ld",
          self.view.tag,
          stackScreen.view.tag,
          stackScreen.screenKey,
          index
          );
    
    [self synchronizeStackScreenMountState:stackScreen];
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
    // We're taking over the responsibility for managing indices, because of the symmetrical
    // responsibility for attaching children to handle the preload case
    NSUInteger stackScreenIndex = [self.children indexOfObject:stackScreen];
    
    if (stackScreenIndex == NSNotFound) {
        LLogWarn(@"[RNScreens] Attempted to remove a screen that is not attached to children.");
        return;
    }
    
    stackScreen.stackHost = nil;
    self.hasModifiedSubviewsInCurrentTransaction = YES;
    
    NSLog(
          @"StackHost [%ld] unmount: StackScreen [%ld] (%@) at %ld",
          self.view.tag,
          stackScreen.view.tag,
          stackScreen.screenKey,
          index
          );
    
    [super removeChild:stackScreen atIndex:stackScreenIndex];
}

- (void)updateChildMountingForStackScreen:(RNSStackScreenComponent *)stackScreen
{
    BOOL isMounted = [self.children containsObject:stackScreen];
    
    if (stackScreen.activityMode == RNSStackScreenActivityModeAttached && !isMounted) {
        [super insertChild:stackScreen atIndex:self.children.count];
    }
}

@end
