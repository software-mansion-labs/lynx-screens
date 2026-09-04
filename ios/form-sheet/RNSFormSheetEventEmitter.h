#pragma once

#import <Foundation/Foundation.h>
#import <Lynx/LynxEventEmitter.h>

NS_ASSUME_NONNULL_BEGIN

@interface RNSFormSheetEventEmitter : NSObject

- (instancetype)initWithEventEmitter:(LynxEventEmitter *)eventEmitter targetSign:(NSInteger)sign;
- (void)emitOnWillAppear;
- (void)emitOnDidAppear;
- (void)emitOnWillDisappear;
- (void)emitOnDidDisappear;
- (void)emitOnDismiss:(BOOL)isNativeDismiss;
- (void)emitOnNativeDismissPrevented;
- (void)emitOnDetentChanged:(NSInteger)index;

@end

NS_ASSUME_NONNULL_END
