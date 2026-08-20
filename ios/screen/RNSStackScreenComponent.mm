#import "RNSStackScreenComponent.h"
#import "RNSStackHeaderConfigComponent.h"
#import "RNSStackHostComponent.h"
#import "RNSStackScreenController.h"
#import "RNSStackScreenEventEmitter.h"
#import "RNSStackScreenHeaderCoordinator.h"

#import <Lynx/LynxComponentRegistry.h>
#import <Lynx/LynxLog.h>
#import <Lynx/LynxPropsProcessor.h>

@LynxElement("ls-stack-screen")
@implementation RNSStackScreenComponent {
    UIScrollView *_Nullable _contentScrollView;
    RNSStackScreenController *_Nonnull _controller;
    RNSStackScreenEventEmitter *_eventEmitter;

    // Flags
    BOOL _hasUpdatedActivityMode;
}

- (instancetype)init
{
    self = [super init];
    if (self) {
        [self initState];
    }
    return self;
}

- (void)initState
{
    [self resetProps];
    [self setupController];

    _hasUpdatedActivityMode = NO;
    _isNativelyDismissed = NO;
}

- (void)resetProps
{
    // container state
    _screenKey = nil;
    _activityMode = RNSStackScreenActivityModeDetached;
}

- (void)setupController
{
    _controller = [[RNSStackScreenController alloc] initWithComponent:self];
    _controller.view = self.view;
}

- (UIView *)createView {
    RNSStackScreenView *stackScreenView = [[RNSStackScreenView alloc] init];
    stackScreenView.component = self;
    return stackScreenView;
}

#pragma mark - RNSScrollViewSeeking

- (void)registerDescendantScrollView:(UIScrollView *)scrollView fromMarker:(RNSScrollViewMarkerComponent *)marker
{
    // Native scroll-edge behavior (UINavigationBar scroll edge appearance, top-screen-tap scroll-to-top on iPad).
    [self.controller setContentScrollView:scrollView forEdge:NSDirectionalRectEdgeAll];
    // Cache used by the container-nesting content-scroll-view resolution.
    _contentScrollView = scrollView;
}

- (nullable UIScrollView *)cachedContentScrollView
{
    return _contentScrollView;
}

#pragma mark - Props

LYNX_PROP_SETTER("activityMode", setActivityMode, NSString *) {
    auto prevActivityMode = self.activityMode;
    
    if ([value isEqualToString:@"detached"]) {
        self.activityMode = RNSStackScreenActivityModeDetached;
    } else if ([value isEqualToString:@"attached"]) {
        self.activityMode = RNSStackScreenActivityModeAttached;
    } else {
        NSLog(@"[RNSStackScreen] Invalid activity mode string received: '%@'. Expected 'attached' or 'detached'.", value);
        return;
    }
    
    if(prevActivityMode != self.activityMode) {
        _hasUpdatedActivityMode = YES;
    }
}

LYNX_PROP_SETTER("screenKey", setScreenKey, NSString *) {
    if (self.screenKey != value) {
        self.screenKey = value;
    }
}

- (void)propsDidUpdate{
    [self finalizeUpdates];
}

#pragma mark - Children Lifecycle

- (void)removeChild:(id)child atIndex:(NSInteger)index
{
    if ([child isKindOfClass:RNSStackHeaderConfigComponent.class]) {
        [_controller.headerCoordinator clearHeaderConfiguration];
    }
    [super removeChild:child atIndex:index];
}

- (void)finalizeUpdates
{
    if (_hasUpdatedActivityMode) {
        _hasUpdatedActivityMode = NO;
        [self.stackHost stackScreenChangedActivityMode:self];
    }
}

#pragma mark - Events

- (RNSStackScreenEventEmitter *)getEventEmitter {
    if (!_eventEmitter && self.context) {
        _eventEmitter = [[RNSStackScreenEventEmitter alloc] initWithEventEmitter:self.context.eventEmitter
                                                                      targetSign:[self sign]];
    }
    return _eventEmitter;
}

- (void)notifyLifecycleChange:(RNSScreenLifecycleEvent)event {
    RNSStackScreenEventEmitter *eventEmitter = [self getEventEmitter];
    if (!eventEmitter) {
        LLogWarn(@"[RNScreens] Attempted to emit lifecycle event, but the emitter was null.");
        return;
    }
    
    switch (event) {
        case RNSScreenLifecycleEventWillAppear:
            [eventEmitter emitOnWillAppear];
            break;
        case RNSScreenLifecycleEventDidAppear:
            [eventEmitter emitOnDidAppear];
            break;
        case RNSScreenLifecycleEventWillDisappear:
            [eventEmitter emitOnWillDisappear];
            break;
        case RNSScreenLifecycleEventDidDisappear:
            [eventEmitter emitOnDidDisappear];
            break;
    }
}

- (void)emitOnDismiss {
    RNSStackScreenEventEmitter *eventEmitter = [self getEventEmitter];
    if (!eventEmitter) {
        LLogWarn(@"[RNScreens] Attempted to emit lifecycle event, but the emitter was null.");
        return;
    }
    
    [eventEmitter emitOnDismiss:NO];
}

- (void)emitOnNativeDismiss {
    RNSStackScreenEventEmitter *eventEmitter = [self getEventEmitter];
    if (!eventEmitter) {
        LLogWarn(@"[RNScreens] Attempted to emit lifecycle event, but the emitter was null.");
        return;
    }
    
    [eventEmitter emitOnDismiss:YES];
}

@end
