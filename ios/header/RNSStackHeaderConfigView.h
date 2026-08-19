#pragma once

#import <UIKit/UIKit.h>

@class RNSStackHeaderConfigComponent;

NS_ASSUME_NONNULL_BEGIN

/**
 * Painting view of the `ls-stack-header-config` element. It is mounted into
 * the screen view (like RNS's config component view), but hosts no subviews
 * itself - children are converted to UIBarButtonItems / navigation item views
 * which UIKit owns.
 */
@interface RNSStackHeaderConfigView : UIView

@property (nonatomic, weak, nullable) RNSStackHeaderConfigComponent *component;

@end

NS_ASSUME_NONNULL_END
