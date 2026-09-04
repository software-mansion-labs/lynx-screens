#import "RNSFormSheetEventEmitter.h"

@implementation RNSFormSheetEventEmitter {
  __weak LynxEventEmitter *_eventEmitter;
  NSInteger _sign;
}

- (instancetype)initWithEventEmitter:(LynxEventEmitter *)eventEmitter targetSign:(NSInteger)sign
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

- (void)emitOnDismiss:(BOOL)isNativeDismiss
{
  [self dispatch:@"OnDismiss" detail:@{ @"isNativeDismiss" : @(isNativeDismiss) }];
}

- (void)emitOnNativeDismissPrevented
{
  [self dispatch:@"OnNativeDismissPrevented" detail:@{}];
}

- (void)emitOnDetentChanged:(NSInteger)index
{
  [self dispatch:@"OnDetentChanged" detail:@{ @"index" : @(index) }];
}

- (void)dispatch:(NSString *)name detail:(NSDictionary *)detail
{
  if (_eventEmitter != nil) {
    LynxCustomEvent *event = [[LynxDetailEvent alloc] initWithName:name targetSign:_sign detail:detail];
    [_eventEmitter dispatchCustomEvent:event];
  }
}

@end
