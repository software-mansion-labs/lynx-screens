#pragma once

#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

/**
 * Painting view of the `ls-stack-header-item-ios` element. UIKit positions it
 * inside the navigation bar; the Lynx engine only computes its size, exposed
 * through intrinsicContentSize (counterpart of RNS's intrinsicContentSize
 * backed by layoutMetrics).
 */
@interface RNSStackHeaderItemView : UIView

/// Returns the most recent size computed by the Lynx layout engine.
@property (nonatomic, copy, nullable) CGSize (^lynxSizeProvider)(void);

@end

NS_ASSUME_NONNULL_END
