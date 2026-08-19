#import "BaseTransferShadowNode.h"

#import <Lynx/LynxComponentRegistry.h>

@interface RNSFormSheetShadowNode : BaseTransferShadowNode
@end

@implementation RNSFormSheetShadowNode

#if LYNX_LAZY_LOAD
LYNX_LAZY_REGISTER_SHADOW_NODE("form-sheet-native")
#else
LYNX_REGISTER_SHADOW_NODE("form-sheet-native")
#endif

@end
