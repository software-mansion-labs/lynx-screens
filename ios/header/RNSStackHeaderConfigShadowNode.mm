#import "RNSStackHeaderConfigShadowNode.h"

#import <Lynx/LynxComponentRegistry.h>
#import <Lynx/LynxCustomMeasureDelegate.h>
#import <Lynx/LynxLazyLoad.h>
#import <Lynx/LynxNativeLayoutNode.h>

#include <cmath>

@implementation RNSStackHeaderConfigShadowNode {
    CGFloat _frameWidth;
    CGFloat _frameHeight;
    CGFloat _contentOffsetX;
    CGFloat _contentOffsetY;
}

#if LYNX_LAZY_LOAD
LYNX_LAZY_REGISTER_SHADOW_NODE("ls-stack-header-config")
#else
LYNX_REGISTER_SHADOW_NODE("ls-stack-header-config")
#endif

- (instancetype)initWithSign:(NSInteger)sign tagName:(NSString *)tagName
{
    if (self = [super initWithSign:sign tagName:tagName]) {
        // Must be set before adoptNativeLayoutNode: - it installs the custom
        // measure delegate for this node.
        self.hasCustomLayout = YES;
        _frameWidth = 0;
        _frameHeight = 0;
        _contentOffsetX = 0;
        _contentOffsetY = 0;
    }
    return self;
}

#pragma mark - RNSShadowStateUpdating

- (void)updateStateWithContentOffsetX:(CGFloat)contentOffsetX
                       contentOffsetY:(CGFloat)contentOffsetY
                           frameWidth:(CGFloat)frameWidth
                          frameHeight:(CGFloat)frameHeight
{
    _contentOffsetX = contentOffsetX;
    _contentOffsetY = contentOffsetY;
    _frameWidth = frameWidth;
    _frameHeight = frameHeight;

    // The measurement constraints for the items depend on the header frame, so
    // their cached measurements must be invalidated along with ours.
    for (LynxShadowNode *child in self.children) {
        [child setNeedsLayout];
    }

    [self internalSetNeedsLayoutForce];
}

#pragma mark - Custom measure

- (MeasureResult)customMeasureLayoutNode:(nonnull MeasureParam *)param
                          measureContext:(nullable MeasureContext *)context
{
    CGFloat width = _frameWidth > 0 ? _frameWidth : (std::isfinite(param.width) ? param.width : 0);
    CGFloat height = _frameHeight > 0 ? _frameHeight : (std::isfinite(param.height) ? param.height : 0);

    // Items size themselves to their content within the header frame (AT_MOST).
    MeasureParam *childParam = [[MeasureParam alloc] initWithWidth:width
                                                         WidthMode:LynxMeasureModeAtMost
                                                            Height:height
                                                        HeightMode:LynxMeasureModeAtMost];
    for (LynxShadowNode *child in self.children) {
        if ([child isKindOfClass:LynxNativeLayoutNode.class]) {
            [(LynxNativeLayoutNode *)child measureWithMeasureParam:childParam MeasureContext:context];
        } else {
            [self.layoutNodeManager measureWithSign:child.sign MeasureParam:childParam MeasureContext:context];
        }
    }

    return (MeasureResult){CGSizeMake(width, height), 0};
}

- (void)customAlignLayoutNode:(nonnull AlignParam *)param alignContext:(nonnull AlignContext *)context
{
    for (LynxShadowNode *child in self.children) {
        AlignParam *childParam = [[AlignParam alloc] init];
        [childParam SetAlignOffsetWithLeft:0 Top:0];
        if ([child isKindOfClass:LynxNativeLayoutNode.class]) {
            [(LynxNativeLayoutNode *)child alignWithAlignParam:childParam AlignContext:context];
        } else {
            [self.layoutNodeManager alignWithSign:child.sign AlignParam:childParam AlignContext:context];
        }
    }
}

@end
