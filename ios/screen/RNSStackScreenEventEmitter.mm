#import "RNSStackScreenEventEmitter.h"
#import "RNSNavigationTrace.h"

@implementation RNSStackScreenEventEmitter {
    __weak LynxEventEmitter *_eventEmitter;
    NSInteger _sign;
    NSDictionary *_traceIdentity;
}

- (instancetype)initWithEventEmitter:(LynxEventEmitter *)eventEmitter
                          targetSign:(NSInteger)sign {
    if (self = [super init]) {
        _eventEmitter = eventEmitter;
        _sign = sign;
    }
    return self;
}

- (instancetype)withTraceIdentity:(NSDictionary *)identity
{
    RNSStackScreenEventEmitter *snapshot = [[[self class] alloc] initWithEventEmitter:_eventEmitter targetSign:_sign];
    snapshot->_traceIdentity = [identity copy];
    return snapshot;
}

- (void)emitOnWillAppear {
    [self dispatch:@"OnWillAppear" detail:@{}];
}

- (void)emitOnDidAppear {
    [self dispatch:@"OnDidAppear" detail:@{}];
}

- (void)emitOnWillDisappear {
    [self dispatch:@"OnWillDisappear" detail:@{}];
}

- (void)emitOnDidDisappear {
    [self dispatch:@"OnDidDisappear" detail:@{}];
}

- (void)emitOnDismiss:(BOOL)isNative {
    [self dispatch:@"OnDismiss" detail:@{ @"isNativeDismiss": @(isNative) }];
}

- (void)dispatch:(NSString *)name detail:(NSDictionary *)detail {
    if (_eventEmitter) {
        if (_traceIdentity) {
            NSMutableDictionary *enriched = [detail mutableCopy];
            enriched[@"traceIdentity"] = _traceIdentity;
            detail = enriched;
        }
        LynxCustomEvent *event = [[LynxDetailEvent alloc] initWithName:name
                                                            targetSign:_sign
                                                                detail:detail];
        [_eventEmitter dispatchCustomEvent:event];
        if (_traceIdentity) {
            NSMutableDictionary *fields = [RNSTraceFields(_traceIdentity) mutableCopy];
            fields[@"event_name"] = name;
            RNSTraceInstant([@"LynxScreens.Stack."
                                stringByAppendingString:([name containsString:@"Dismiss"] ? @"DismissEventEmitted"
                                                                                          : @"LifecycleEventEmitted")],
                            fields);
        }
    }
}

@end
