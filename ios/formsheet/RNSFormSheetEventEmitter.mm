#import "RNSFormSheetEventEmitter.h"

@implementation RNSFormSheetEventEmitter {
    __weak LynxEventEmitter *_eventEmitter;
    NSInteger _sign;
}

- (instancetype)initWithEventEmitter:(LynxEventEmitter *)eventEmitter
                           targetSign:(NSInteger)sign
{
    if (self = [super init]) {
        _eventEmitter = eventEmitter;
        _sign = sign;
    }
    return self;
}

- (void)emitOnWillAppear
{
    [self dispatch:@"OnWillAppear" detail:@{}];
}

- (void)emitOnDidAppear
{
    [self dispatch:@"OnDidAppear" detail:@{}];
}

- (void)emitOnWillDisappear
{
    [self dispatch:@"OnWillDisappear" detail:@{}];
}

- (void)emitOnDidDisappear
{
    [self dispatch:@"OnDidDisappear" detail:@{}];
}

- (void)emitOnDismiss
{
    [self dispatch:@"OnDismiss" detail:@{}];
}

- (void)emitOnNativeDismiss
{
    [self dispatch:@"OnNativeDismiss" detail:@{}];
}

- (void)emitOnNativeDismissPreventedWithChannel:(NSString *)channel
{
    [self dispatch:@"OnNativeDismissPrevented" detail:@{ @"channel": channel }];
}

- (void)emitOnDetentChanged:(NSInteger)index
{
    [self dispatch:@"OnDetentChanged" detail:@{ @"index": @(index) }];
}

- (void)dispatch:(NSString *)name detail:(NSDictionary *)detail
{
    if (_eventEmitter) {
        LynxCustomEvent *event = [[LynxDetailEvent alloc] initWithName:name
                                                            targetSign:_sign
                                                                detail:detail];
        [_eventEmitter dispatchCustomEvent:event];
    }
}

@end
