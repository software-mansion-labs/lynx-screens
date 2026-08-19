#import <Foundation/Foundation.h>
#import <Lynx/LynxEventEmitter.h>

NS_ASSUME_NONNULL_BEGIN

/**
 * Counterpart of RNS RNSStackHeaderConfigEventEmitter. Wraps the codegen
 * event emitter on RNS; on Lynx it dispatches LynxDetailEvents against the
 * config's sign (payload available as `event.detail` in JS).
 */
@interface RNSStackHeaderConfigEventEmitter : NSObject

- (instancetype)initWithEventEmitter:(LynxEventEmitter *)eventEmitter
                          targetSign:(NSInteger)sign;

- (BOOL)emitOnMenuItemPress:(NSString *)menuItemId;

- (BOOL)emitOnMenuSelectionChange:(NSString *)menuId selectedMenuItemIds:(NSArray<NSString *> *)selectedIds;

@end

NS_ASSUME_NONNULL_END
