#import "RNSStackScreenController.h"
#import <Lynx/LynxLog.h>
#import "RNSContainer.h"
#import "RNSContainerItemSupport.h"
#import "RNSStackScreenComponent.h"
#import "RNSStackScreenHeaderCoordinator.h"

@implementation RNSStackScreenController {
    RNSContainerItemSupport *_Nonnull _containerItemSupport;
}

- (instancetype)initWithComponent:(RNSStackScreenComponent *)component
{
    if (self = [super initWithNibName:nil bundle:nil]) {
        _screenComponent = component;
        _headerCoordinator = [[RNSStackScreenHeaderCoordinator alloc] initWithScreenController:self];
        _containerItemSupport = [RNSContainerItemSupport new];
    }
    return self;
}

#pragma mark - RNSContainerItem

- (void)registerNestedContainer:(id<RNSContainer>)container
{
    [_containerItemSupport registerNestedContainer:container];
}

- (void)unregisterNestedContainer:(id<RNSContainer>)container
{
    [_containerItemSupport unregisterNestedContainer:container];
}

- (nullable id<RNSContainer>)resolveNestedContainer
{
    return [_containerItemSupport resolveNestedContainer];
}

- (nullable UIScrollView *)findContentScrollView
{
    return [_containerItemSupport findContentScrollViewWithCachedScrollView:_screenComponent.cachedContentScrollView
                                                              heuristicRoot:_screenComponent.view];
}

#pragma mark - Lifecycle Events

- (void)viewWillAppear:(BOOL)animated
{
    [super viewWillAppear:animated];
    [_screenComponent notifyLifecycleChange:RNSScreenLifecycleEventWillAppear];
}

- (void)viewDidAppear:(BOOL)animated
{
    [super viewDidAppear:animated];
    [_screenComponent notifyLifecycleChange:RNSScreenLifecycleEventDidAppear];
}

- (void)viewWillDisappear:(BOOL)animated
{
    [super viewWillDisappear:animated];
    [_screenComponent notifyLifecycleChange:RNSScreenLifecycleEventWillDisappear];
}

- (void)viewDidDisappear:(BOOL)animated
{
    [super viewDidDisappear:animated];
    [_screenComponent notifyLifecycleChange:RNSScreenLifecycleEventDidDisappear];
}

- (void)didMoveToParentViewController:(UIViewController *)parent
{
    LLogInfo(
        @"[RNScreens] Screen view with tag=%ld didMoveToParentViewController %@",
        (long)_screenComponent.view.tag,
        parent);
    [super didMoveToParentViewController:parent];

    if (parent == nil) {
        if (_screenComponent.activityMode == RNSStackScreenActivityModeDetached) {
            [_screenComponent emitOnDismiss];
        } else {
            _screenComponent.isNativelyDismissed = YES;
            [_screenComponent emitOnNativeDismiss];
        }
    }
}

@end
