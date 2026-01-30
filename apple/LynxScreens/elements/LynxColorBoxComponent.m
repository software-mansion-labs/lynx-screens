#import "LynxColorBoxComponent.h"
#import "LynxColorBoxShadowNode.h"

#import <Lynx/LynxComponentRegistry.h>
#import <Lynx/LynxPropsProcessor.h>
#import <Lynx/LynxShadowNodeOwner.h>

@implementation LynxColorBoxComponent

LYNX_LAZY_REGISTER_UI("color-box-view")

// Note: This doesn't seem to be good place to apply updates, but
// it's sufficient for basic testing and demonstration purposes.
- (void)layoutDidFinished {
    // Retrieve the corresponding ShadowNode from the Lynx context by node sign (unique ID)
    LynxColorBoxShadowNode *node = (LynxColorBoxShadowNode*)[self.context.nodeOwner nodeWithSign:self.sign];
    // Ensure that the retrieved node is an instance of our custom ShadowNode class
    if ([node isKindOfClass:LynxColorBoxShadowNode.class]) {
        // Store the previously set size
        CGSize preSize = node.uiSize;
        
        // Perform some calculations for updating the size
        CGSize updatedSize = [self adjustViewSize];
        
        // If the size has changed, update the ShadowNode and request a re-layout
        if (!CGSizeEqualToSize(preSize, updatedSize)) {
            node.uiSize = updatedSize;
            [node setNeedsLayout];
        }
    }
}

// Returns a hardcoded width and height for testing purposes
- (CGSize)adjustViewSize {
    return CGSizeMake(300, 300);
}

LYNX_PROP_SETTER("backgroundColorHex", setBackgroudColorHex, NSString *) {
    self.view.backgroundColorHex = value;
}

- (UIView *)createView {
    UIView *colorBoxView = [[LynxColorBoxView alloc] init];
    return colorBoxView;
}

@end
