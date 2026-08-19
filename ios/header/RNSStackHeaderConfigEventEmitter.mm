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

- (BOOL)emitOnMenuSelectionChange:(NSString *)menuId selectedMenuItemIds:(NSArray<NSString *> *)selectedIds
{
    LynxEventEmitter *eventEmitter = _eventEmitter;
    if (eventEmitter == nil) {
        LLogWarn(@"[RNScreens] Skipped OnMenuSelectionChange event emission due to nullish emitter");
        return NO;
    }

    // Adaptation: the payload crosses to JS as the event detail dictionary -
    // no std::string/std::vector conversion like in the RNS codegen emitter.
    LynxCustomEvent *event = [[LynxDetailEvent alloc] initWithName:@"OnMenuSelectionChange"
                                                        targetSign:_sign
                                                            detail:@{
                                                                @"menuId" : menuId,
                                                                @"selectedMenuItemIds" : selectedIds,
                                                            }];
    [eventEmitter dispatchCustomEvent:event];
    return YES;
}

@end
