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
 * Like updateShadowStateWithFrame:, but also runs the pending Lynx layout pass
 * before returning, so the resulting frames of the element's subtree are
 * applied inside the caller's UIKit layout pass. Counterpart of RNS's
 * `EventQueue::UpdateMode::unstable_Immediate`, which the FormSheet proxy uses.
 */
- (void)updateShadowStateImmediatelyWithFrame:(CGRect)frame;

/**
 * Resets internal properties.
 */
- (void)invalidate;

@end

NS_ASSUME_NONNULL_END
