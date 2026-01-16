#import "RNSStackScreenComponentView.h"

#import <Lynx/LynxComponentRegistry.h>
#import <Lynx/LynxPropsProcessor.h>

#import "LynxScreens-Swift.h"

@implementation RNSStackScreenComponentView {
    RNSStackScreenController *_Nonnull _controller;
    
    // Flags
    BOOL _hasUpdatedActivityMode;
}

LYNX_LAZY_REGISTER_UI("stack-screen-native")

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
}

- (void)resetProps
{
    // container state
    _screenKey = nil;
    _activityMode = RNSStackScreenActivityModeDetached;
}

- (void)setupController
{
    _controller = [[RNSStackScreenController alloc] initWithComponentView:self];
    _controller.view = self.view;
}

- (UIView *)createView {
    RNSStackScreenView *stackScreenView = [[RNSStackScreenView alloc] init];
    return stackScreenView;
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

- (void)finalizeUpdates
{
    if (_hasUpdatedActivityMode) {
        _hasUpdatedActivityMode = NO;
        [self.stackHost stackScreenChangedActivityMode:self];
    }
}

#pragma mark - Events

- (void)notifyLifecycleChange:(RNSScreenLifecycleEvent)event {
    switch (event) {
        case RNSScreenLifecycleEventWillAppear:
            [self emitOnWillAppear];
            break;
        case RNSScreenLifecycleEventDidAppear:
            [self emitOnDidAppear];
            break;
        case RNSScreenLifecycleEventWillDisappear:
            [self emitOnWillDisappear];
            break;
        case RNSScreenLifecycleEventDidDisappear:
            [self emitOnDidDisappear];
            break;
    }
}

- (void)emitOnWillAppear {
    [self emitEvent:@"OnWillAppear" detail:@{}];
}

- (void)emitOnDidAppear {
    [self emitEvent:@"OnDidAppear" detail:@{}];
}

- (void)emitOnWillDisappear {
    [self emitEvent:@"OnWillDisappear" detail:@{}];
}

- (void)emitOnDidDisappear {
    [self emitEvent:@"OnDidDisappear" detail:@{}];
}

- (void)emitOnDismiss {
    [self emitEvent:@"OnDismiss" detail:@{ @"isNativeDismiss": @(false) }];
}

- (void)emitOnNativeDismiss {
    [self emitEvent:@"OnDismiss" detail:@{ @"isNativeDismiss": @(true) }];
}

- (void)emitEvent:(NSString *)name detail:(NSDictionary *)detail {
    if (self.context.eventEmitter != nil) {
        LynxCustomEvent *eventInfo = [[LynxDetailEvent alloc] initWithName:name
                                                                targetSign:[self sign]
                                                                    detail:detail];
        [self.context.eventEmitter dispatchCustomEvent:eventInfo];
    }
}

@end
