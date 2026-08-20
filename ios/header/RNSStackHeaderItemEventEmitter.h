#pragma once

#import <Foundation/Foundation.h>
#import <Lynx/LynxEventEmitter.h>

NS_ASSUME_NONNULL_BEGIN

/**
 * Counterpart of RNS RNSStackHeaderItemEventEmitter. Wraps the codegen
 * event emitter on RNS; on Lynx it dispatches LynxDetailEvents against the
 * item's sign (payload available as `event.detail` in JS).
 */
@interface RNSStackHeaderItemEventEmitter : NSObject

- (instancetype)initWithEventEmitter:(LynxEventEmitter *)eventEmitter
                          targetSign:(NSInteger)sign;

- (BOOL)emitOnPress;

@end

NS_ASSUME_NONNULL_END
