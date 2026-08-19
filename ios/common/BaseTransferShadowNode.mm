#import "BaseTransferShadowNode.h"

#import <Lynx/LynxCustomMeasureDelegate.h>
#import <Lynx/LynxNativeLayoutNode.h>

@implementation BaseTransferShadowNode {
    CGFloat _hostWidth;
    LynxMeasureMode _hostWidthMode;
    CGFloat _hostHeight;
    LynxMeasureMode _hostHeightMode;
}

- (instancetype)initWithSign:(NSInteger)sign tagName:(NSString *)tagName
{
    if (self = [super initWithSign:sign tagName:tagName]) {
        self.hasCustomLayout = YES;
        _hostWidthMode = LynxMeasureModeIndefinite;
        _hostHeightMode = LynxMeasureModeIndefinite;
    }
    return self;
}

- (void)updateHostConstraintsWithWidth:(CGFloat)width
                             widthMode:(LynxMeasureMode)widthMode
                                height:(CGFloat)height
                            heightMode:(LynxMeasureMode)heightMode
{
    if (fabs(_hostWidth - width) <= CGFLOAT_EPSILON &&
        _hostWidthMode == widthMode &&
        fabs(_hostHeight - height) <= CGFLOAT_EPSILON &&
        _hostHeightMode == heightMode) {
        return;
    }

    _hostWidth = width;
    _hostWidthMode = widthMode;
    _hostHeight = height;
    _hostHeightMode = heightMode;
    [self setNeedsLayout];
}

- (MeasureResult)customMeasureLayoutNode:(MeasureParam *)param
                          measureContext:(MeasureContext *)context
{
    MeasureParam *childParam =
        [[MeasureParam alloc] initWithWidth:_hostWidthMode == LynxMeasureModeIndefinite ? param.width : _hostWidth
                                 WidthMode:_hostWidthMode == LynxMeasureModeIndefinite ? param.widthMode : _hostWidthMode
                                    Height:_hostHeightMode == LynxMeasureModeIndefinite ? param.height : _hostHeight
                                HeightMode:_hostHeightMode == LynxMeasureModeIndefinite ? param.heightMode : _hostHeightMode];
    for (LynxShadowNode *child in self.children) {
        if ([child isKindOfClass:LynxNativeLayoutNode.class]) {
            [(LynxNativeLayoutNode *)child measureWithMeasureParam:childParam MeasureContext:context];
        } else if ([child isKindOfClass:LynxCustomMeasureShadowNode.class]) {
            [(id<LynxCustomMeasureDelegate>)child measureWithMeasureParam:childParam
                                                           MeasureContext:context];
        }
    }
    return (MeasureResult){CGSizeZero, 0.f};
}

- (void)customAlignLayoutNode:(AlignParam *)param alignContext:(AlignContext *)context
{
    AlignParam *childParam = [AlignParam new];
    [childParam SetAlignOffsetWithLeft:0.f Top:0.f];
    for (LynxShadowNode *child in self.children) {
        if ([child isKindOfClass:LynxNativeLayoutNode.class]) {
            [(LynxNativeLayoutNode *)child alignWithAlignParam:childParam AlignContext:context];
        } else if ([child isKindOfClass:LynxCustomMeasureShadowNode.class]) {
            [(id<LynxCustomMeasureDelegate>)child alignWithAlignParam:childParam AlignContext:context];
        }
    }
}

@end
