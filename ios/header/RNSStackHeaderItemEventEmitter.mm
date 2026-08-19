#import "RNSStackHeaderItemEventEmitter.h"
#import <Lynx/LynxLog.h>

@implementation RNSStackHeaderItemEventEmitter {
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

- (BOOL)emitOnPress
{
    LynxEventEmitter *eventEmitter = _eventEmitter;
    if (eventEmitter == nil) {
        LLogWarn(@"[RNScreens] Skipped OnHeaderItemPress event emission due to nullish emitter");
        return NO;
    }

    LynxCustomEvent *event = [[LynxDetailEvent alloc] initWithName:@"OnHeaderItemPress"
                                                        targetSign:_sign
                                                            detail:@{}];
    [eventEmitter dispatchCustomEvent:event];
    return YES;
}

@end
