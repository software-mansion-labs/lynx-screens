#pragma once

#import <Lynx/LynxCustomMeasureShadowNode.h>

#import "RNSShadowStateUpdating.h"

NS_ASSUME_NONNULL_BEGIN

/**
 * Counterpart of RNS RNSStackHeaderConfigShadowNode (+ State &
 * ComponentDescriptor) for iOS. The native side reports the UINavigationBar
 * frame via RNSShadowStateUpdating; the config subtree is then measured with
 * those dimensions so that item content sizes to the real header, not to the
 * constraints coming from the parent StackScreen.
 *
 * Children (header items) are measured AT_MOST so they size themselves to
 * their content.
 *
 * Divergence from RNS: the stored content offset is NOT applied to children -
 * item views are reparented into the navigation bar which positions them
 * itself, so offsetting the Lynx layout would double-shift them. RNS needs
 * the offset only to correct Fabric-mounted frames.
 */
@interface RNSStackHeaderConfigShadowNode : LynxCustomMeasureShadowNode <RNSShadowStateUpdating>

@end

NS_ASSUME_NONNULL_END
