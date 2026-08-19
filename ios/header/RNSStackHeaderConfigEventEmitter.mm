#import "RNSStackHeaderConfigEventEmitter.h"
#import <Lynx/LynxLog.h>

@implementation RNSStackHeaderConfigEventEmitter {
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

- (BOOL)emitOnMenuItemPress:(NSString *)menuItemId
{
    LynxEventEmitter *eventEmitter = _eventEmitter;
    if (eventEmitter == nil) {
        LLogWarn(@"[RNScreens] Skipped OnMenuItemPress event emission due to nullish emitter");
        return NO;
    }

    LynxCustomEvent *event = [[LynxDetailEvent alloc] initWithName:@"OnMenuItemPress"
                                                        targetSign:_sign
                                                            detail:@{@"menuItemId" : menuItemId}];
    [eventEmitter dispatchCustomEvent:event];
    return YES;
}

@end
