#import "RNSFormSheetHostEventEmitter.h"
#import <Lynx/LynxLog.h>

@implementation RNSFormSheetHostEventEmitter {
  // Adaptation: Lynx owns the emitter; native events target the component sign.
  __weak LynxEventEmitter *_lynxEventEmitter;
  NSInteger _sign;
}

- (BOOL)emitOnDismiss
{
  if (_lynxEventEmitter != nil) {
    [_lynxEventEmitter
        dispatchCustomEvent:[[LynxDetailEvent alloc] initWithName:@"OnDismiss" targetSign:_sign detail:@{}]];
    return YES;
  } else {
    LLogWarn(@"[RNScreens] Skipped OnDismiss event emission due to nullish emitter");
    return NO;
  }
}

- (BOOL)emitOnNativeDismiss
{
  if (_lynxEventEmitter != nil) {
    [_lynxEventEmitter
        dispatchCustomEvent:[[LynxDetailEvent alloc] initWithName:@"OnNativeDismiss" targetSign:_sign detail:@{}]];
    return YES;
  } else {
    LLogWarn(@"[RNScreens] Skipped OnNativeDismiss event emission due to nullish emitter");
    return NO;
  }
}

- (BOOL)emitOnNativeDismissPrevented
{
  if (_lynxEventEmitter != nil) {
    [_lynxEventEmitter
        dispatchCustomEvent:[[LynxDetailEvent alloc] initWithName:@"OnNativeDismissPrevented" targetSign:_sign detail:@{}]];
    return YES;
  } else {
    LLogWarn(@"[RNScreens] Skipped OnNativeDismissPrevented event emission due to nullish emitter");
    return NO;
  }
}

#if !TARGET_OS_TV
- (BOOL)emitOnDetentChangedWithIndex:(NSInteger)index
{
  if (_lynxEventEmitter != nil) {
    [_lynxEventEmitter dispatchCustomEvent:[[LynxDetailEvent alloc] initWithName:@"OnDetentChanged"
                                                                  targetSign:_sign
                                                                      detail:@{ @"index" : @(index) }]];
    return YES;
  } else {
    LLogWarn(@"[RNScreens] Skipped OnDetentChanged event emission due to nullish emitter");
    return NO;
  }
}
#endif // !TARGET_OS_TV

#pragma mark - Lifecycle events

- (BOOL)emitOnWillAppear
{
  if (_lynxEventEmitter != nil) {
    [_lynxEventEmitter
        dispatchCustomEvent:[[LynxDetailEvent alloc] initWithName:@"OnWillAppear" targetSign:_sign detail:@{}]];
    return YES;
  } else {
    LLogWarn(@"[RNScreens] Skipped OnWillAppear event emission due to nullish emitter");
    return NO;
  }
}

- (BOOL)emitOnDidAppear
{
  if (_lynxEventEmitter != nil) {
    [_lynxEventEmitter
        dispatchCustomEvent:[[LynxDetailEvent alloc] initWithName:@"OnDidAppear" targetSign:_sign detail:@{}]];
    return YES;
  } else {
    LLogWarn(@"[RNScreens] Skipped OnDidAppear event emission due to nullish emitter");
    return NO;
  }
}

- (BOOL)emitOnWillDisappear
{
  if (_lynxEventEmitter != nil) {
    [_lynxEventEmitter
        dispatchCustomEvent:[[LynxDetailEvent alloc] initWithName:@"OnWillDisappear" targetSign:_sign detail:@{}]];
    return YES;
  } else {
    LLogWarn(@"[RNScreens] Skipped OnWillDisappear event emission due to nullish emitter");
    return NO;
  }
}

- (BOOL)emitOnDidDisappear
{
  if (_lynxEventEmitter != nil) {
    [_lynxEventEmitter
        dispatchCustomEvent:[[LynxDetailEvent alloc] initWithName:@"OnDidDisappear" targetSign:_sign detail:@{}]];
    return YES;
  } else {
    LLogWarn(@"[RNScreens] Skipped OnDidDisappear event emission due to nullish emitter");
    return NO;
  }
}

- (void)updateEventEmitter:(nullable LynxEventEmitter *)emitter targetSign:(NSInteger)sign
{
  _lynxEventEmitter = emitter;
  _sign = sign;
}

@end
