#import <Lynx/LynxCustomMeasureShadowNode.h>

NS_ASSUME_NONNULL_BEGIN

/** ShadowNode that lays out transferred Lynx children with native receiver constraints. */
@interface BaseTransferShadowNode : LynxCustomMeasureShadowNode

/** Updates the native receiver constraints used for the next Lynx child layout pass. */
- (void)updateHostConstraintsWithWidth:(CGFloat)width
                             widthMode:(LynxMeasureMode)widthMode
                                height:(CGFloat)height
                            heightMode:(LynxMeasureMode)heightMode;

@end

NS_ASSUME_NONNULL_END
