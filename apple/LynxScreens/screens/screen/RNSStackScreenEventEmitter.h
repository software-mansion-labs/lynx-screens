#import <Foundation/Foundation.h>
#import <Lynx/LynxEventEmitter.h>

NS_ASSUME_NONNULL_BEGIN

@interface RNSStackScreenEventEmitter : NSObject

- (instancetype)initWithEventEmitter:(LynxEventEmitter *)eventEmitter 
                          targetSign:(NSInteger)sign;

- (void)emitWillAppear;
- (void)emitDidAppear;
- (void)emitWillDisappear;
- (void)emitDidDisappear;
- (void)emitOnDismiss:(BOOL)isNative;

@end

NS_ASSUME_NONNULL_END
