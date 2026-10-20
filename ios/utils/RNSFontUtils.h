#pragma once

#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

/**
 * Font resolution for header text attributes.
 *
 * Adaptation of React Native's `RCTFont updateFont:withFamily:size:weight:style:variant:scaleMultiplier:`
 * (without the font variants and the scale multiplier), which lynx-screens does not have:
 * the family falls back to the system font, unknown families log and fall back to the
 * system font, `weight` accepts the CSS keywords / numeric strings and `style` accepts
 * `normal` / `italic` / `oblique`.
 */
@interface RNSFontUtils : NSObject

+ (UIFont *)updateFont:(nullable UIFont *)font
            withFamily:(nullable NSString *)family
                  size:(nullable NSNumber *)size
                weight:(nullable NSString *)weight
                 style:(nullable NSString *)style;

@end

NS_ASSUME_NONNULL_END
