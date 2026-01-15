#import <Lynx/LynxCustomMeasureDelegate.h>
#import <Lynx/LynxShadowNode.h>

NS_ASSUME_NONNULL_BEGIN

@interface LynxColorBoxViewShadowNode :  LynxShadowNode <LynxCustomMeasureDelegate>

@property (atomic, assign) CGSize uiSize;

@end

NS_ASSUME_NONNULL_END
