#pragma once

#import <Lynx/LynxUI.h>
#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

/**
 * Counterpart of RNS RNSStackHeader*ShadowStateProxy (and of the Android
 * `ShadowStateProxy`): tracks native frame changes and forwards them to the
 * owning element's shadow node, which conforms to RNSShadowStateUpdating.
 *
 * Unlike on Android, no manual LynxView measure+layout kick is needed - the
 * shadow node's setNeedsLayout schedules a relayout through LynxUILayoutTick.
 */
@interface RNSShadowStateProxy : NSObject

- (instancetype)initWithLynxUI:(LynxUI *)ui;

/**
 * Pushes the frame to the shadow node if it differs from the previously sent
 * one. The frame origin is stored as the content offset, the size as the
 * frame size.
 */
- (void)updateShadowStateWithFrame:(CGRect)frame;

/**
 * Resets internal properties.
 */
- (void)invalidate;

@end

NS_ASSUME_NONNULL_END
