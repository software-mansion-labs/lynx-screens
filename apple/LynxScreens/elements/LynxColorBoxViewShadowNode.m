#import "LynxColorBoxViewShadowNode.h"
#import <Lynx/LynxComponentRegistry.h>
#import <Lynx/LynxNativeLayoutNode.h>

@implementation LynxColorBoxViewShadowNode

// Registers this custom ShadowNode implementation for the "color-box-view" component
LYNX_LAZY_REGISTER_SHADOW_NODE("color-box-view")

- (instancetype)initWithSign:(NSInteger)sign tagName:(NSString *)tagName {
    if (self = [super initWithSign:sign tagName:tagName]) {
        // NO-OP
    }
    return self;
}

// Called when `LayoutContextDarwin::CreateLayoutNode` instantiates this component.
// At this point, the view hierarchy and frame are not yet defined.
// This method is typically used to set up callbacks or interfaces,
// such as assigning a `LynxCustomMeasureDelegate`, which enables
// communication of size or content offset information back to `Starlight` layout engine.
- (void)adoptNativeLayoutNode:(int64_t)ptr{
    [self setCustomMeasureDelegate:self];
    [super adoptNativeLayoutNode:ptr];
}

// Called during the layout pass when `LayoutObject::ReLayoutWithConstraints` triggers `UpdateMeasure`.
// Since we define a custom measurement method, we take full control over
// sizing for the entire layout subtree. This method calculates and returns
// the size of the native view and recursively measures child nodes.
- (MeasureResult)measureWithMeasureParam:(nonnull MeasureParam *)param MeasureContext:(nullable MeasureContext *)context {
    MeasureResult result;
    result.size = CGSizeMake(ceil(self.uiSize.width), ceil(self.uiSize.height));
    
    LynxNativeLayoutNode *child = (LynxNativeLayoutNode *)self.children.firstObject;
    [child measureWithMeasureParam:param MeasureContext:context];
    
    return result;
}

// Called during the layout pass when `LayoutObject::ReLayoutWithConstraints` triggers `UpdateAlignment`.
// By defining a custom alignment method, we take control over positioning
// for the current subtree. Here, we offset the content by a fixed amount.
- (void)alignWithAlignParam:(nonnull AlignParam *)param AlignContext:(nonnull AlignContext *)context {
    CGFloat leftOffset = 100;
    CGFloat topOffset = 100;
    
    [param SetAlignOffsetWithLeft:leftOffset Top:topOffset];
    
    LynxNativeLayoutNode *child = (LynxNativeLayoutNode *)self.children.firstObject;
    [child alignWithAlignParam:param AlignContext:context];
}

@end
