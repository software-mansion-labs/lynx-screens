#import "RNSFormSheetHostShadowNode.h"

#import <Lynx/LynxComponentRegistry.h>
#import <Lynx/LynxCustomMeasureDelegate.h>
#import <Lynx/LynxLazyLoad.h>
#import <Lynx/LynxNativeLayoutNode.h>

#include <cmath>

@implementation RNSFormSheetHostShadowNode {
  CGFloat _frameWidth;
  CGFloat _frameHeight;
}

#if LYNX_LAZY_LOAD
LYNX_LAZY_REGISTER_SHADOW_NODE("ls-form-sheet")
#else
LYNX_REGISTER_SHADOW_NODE("ls-form-sheet")
#endif

- (instancetype)initWithSign:(NSInteger)sign tagName:(NSString *)tagName
{
  if (self = [super initWithSign:sign tagName:tagName]) {
    // Adaptation: the UIKit sheet owns the host dimensions. This is the Lynx
    // counterpart of the Fabric host state and component descriptor.
    self.hasCustomLayout = YES;
    _frameWidth = 0;
    _frameHeight = 0;
  }
  return self;
}

- (void)updateStateWithContentOffsetX:(CGFloat)contentOffsetX
                       contentOffsetY:(CGFloat)contentOffsetY
                           frameWidth:(CGFloat)frameWidth
                          frameHeight:(CGFloat)frameHeight
{
  _frameWidth = frameWidth;
  _frameHeight = frameHeight;
  for (LynxShadowNode *child in self.children) {
    [child setNeedsLayout];
  }
  [self internalSetNeedsLayoutForce];
}

- (MeasureResult)customMeasureLayoutNode:(MeasureParam *)param measureContext:(MeasureContext *)context
{
  CGFloat width = _frameWidth > 0 ? _frameWidth : (std::isfinite(param.width) ? param.width : 0);
  CGFloat height = _frameHeight > 0 ? _frameHeight : (std::isfinite(param.height) ? param.height : 0);

  MeasureParam *childParam = [[MeasureParam alloc] initWithWidth:width
                                                       WidthMode:LynxMeasureModeDefinite
                                                          Height:height
                                                      HeightMode:LynxMeasureModeAtMost];
  for (LynxShadowNode *child in self.children) {
    if ([child isKindOfClass:LynxNativeLayoutNode.class]) {
      [(LynxNativeLayoutNode *)child measureWithMeasureParam:childParam MeasureContext:context];
    } else {
      [self.layoutNodeManager measureWithSign:child.sign MeasureParam:childParam MeasureContext:context];
    }
  }
  return (MeasureResult){ CGSizeMake(width, height), 0 };
}

- (void)customAlignLayoutNode:(AlignParam *)param alignContext:(AlignContext *)context
{
  for (LynxShadowNode *child in self.children) {
    AlignParam *childParam = [AlignParam new];
    [childParam SetAlignOffsetWithLeft:0 Top:0];
    if ([child isKindOfClass:LynxNativeLayoutNode.class]) {
      [(LynxNativeLayoutNode *)child alignWithAlignParam:childParam AlignContext:context];
    } else {
      [self.layoutNodeManager alignWithSign:child.sign AlignParam:childParam AlignContext:context];
    }
  }
}

@end
