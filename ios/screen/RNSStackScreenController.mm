#import "RNSStackScreenController.h"
#import "RNSContainer.h"
#import "RNSContainerItemSupport.h"
#import "RNSNavigationTrace.h"
#import "RNSStackScreenComponent.h"
#import "RNSStackScreenEventEmitter.h"
#import "RNSStackScreenHeaderCoordinator.h"
#import <Lynx/LynxLog.h>

@implementation RNSStackScreenController {
    RNSContainerItemSupport *_Nonnull _containerItemSupport;
    RNSStackScreenEventEmitter *_appearEmitter;
    RNSStackScreenEventEmitter *_disappearEmitter;
    RNSNavigationTraceOperation *_disappearanceOperation;
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
    _appearEmitter = [_screenComponent lifecycleTraceEventEmitter];
    [_appearEmitter emitOnWillAppear];
}

- (void)viewDidAppear:(BOOL)animated
{
    [super viewDidAppear:animated];
    [_appearEmitter emitOnDidAppear];
}

- (void)viewWillDisappear:(BOOL)animated
{
    [super viewWillDisappear:animated];
    _disappearanceOperation = _screenComponent.traceOperation.terminal ? nil : _screenComponent.traceOperation;
    _disappearEmitter = [_screenComponent lifecycleTraceEventEmitter];
    [_disappearEmitter emitOnWillDisappear];
}

- (void)viewDidDisappear:(BOOL)animated
{
    [super viewDidDisappear:animated];
    [_disappearEmitter emitOnDidDisappear];
}

- (void)didMoveToParentViewController:(UIViewController *)parent
{
    LLogInfo(
        @"[RNScreens] Screen view with tag=%ld didMoveToParentViewController %@",
        (long)_screenComponent.view.tag,
        parent);
    [super didMoveToParentViewController:parent];

    if (parent == nil) {
        [_disappearanceOperation mark:@"NativeDismissCommitted" fields:@{}];
        if (_screenComponent.activityMode == RNSStackScreenActivityModeDetached) {
            [(_disappearEmitter ?: [_screenComponent traceEventEmitter]) emitOnDismiss:NO];
        } else {
            _screenComponent.isNativelyDismissed = YES;
            [(_disappearEmitter ?: [_screenComponent traceEventEmitter]) emitOnDismiss:YES];
        }
    }
}

@end
