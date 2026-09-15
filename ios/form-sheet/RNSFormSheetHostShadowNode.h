#pragma once

#import "RNSShadowStateUpdating.h"
#import <Lynx/LynxCustomMeasureShadowNode.h>

NS_ASSUME_NONNULL_BEGIN

// Adaptation: this custom-measure node is the Lynx counterpart of the upstream
// FormSheet host state and component descriptor measurement.
@interface RNSFormSheetHostShadowNode : LynxCustomMeasureShadowNode <RNSShadowStateUpdating>
@end

NS_ASSUME_NONNULL_END
