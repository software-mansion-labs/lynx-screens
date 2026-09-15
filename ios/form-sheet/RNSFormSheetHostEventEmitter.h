#pragma once

#import <Foundation/Foundation.h>
#import <Lynx/LynxEventEmitter.h>

NS_ASSUME_NONNULL_BEGIN

// Adaptation: dispatches upstream FormSheet host events through LynxEventEmitter.
@interface RNSFormSheetHostEventEmitter : NSObject

- (BOOL)emitOnDismiss;
- (BOOL)emitOnNativeDismiss;
- (BOOL)emitOnNativeDismissPrevented;
#if !TARGET_OS_TV
- (BOOL)emitOnDetentChangedWithIndex:(NSInteger)index;
#endif // !TARGET_OS_TV
- (BOOL)emitOnWillAppear;
- (BOOL)emitOnDidAppear;
- (BOOL)emitOnWillDisappear;
- (BOOL)emitOnDidDisappear;

// Adaptation: Lynx dispatch requires the component sign in addition to the emitter.
- (void)updateEventEmitter:(nullable LynxEventEmitter *)emitter targetSign:(NSInteger)sign;

@end

NS_ASSUME_NONNULL_END
