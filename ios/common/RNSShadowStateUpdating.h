#pragma once

#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

/**
 * Counterpart of the Fabric state round-trip from RNS: shadow nodes that
 * receive native frame updates (measured by UIKit, not by the Lynx engine)
 * conform to this protocol. Mirrors the Android `ShadowStateUpdating`
 * interface.
 *
 * Invoked on the Lynx layout thread.
 */
@protocol RNSShadowStateUpdating <NSObject>

- (void)updateStateWithContentOffsetX:(CGFloat)contentOffsetX
                       contentOffsetY:(CGFloat)contentOffsetY
                           frameWidth:(CGFloat)frameWidth
                          frameHeight:(CGFloat)frameHeight;

@end

NS_ASSUME_NONNULL_END
