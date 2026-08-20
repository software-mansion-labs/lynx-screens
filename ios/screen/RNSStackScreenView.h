#import <UIKit/UIKit.h>

#import "RNSScrollViewSeeking.h"

NS_ASSUME_NONNULL_BEGIN

@class RNSStackScreenComponent;

// Adaptation: RNS adopts RNSScrollViewSeeking on the screen component view;
// on Lynx the marker's ancestor walk sees the native view hierarchy, so the
// conformance lives on the screen's painting view and forwards to the
// component.
@interface RNSStackScreenView : UIView <RNSScrollViewSeeking>

@property (nonatomic, weak, nullable) RNSStackScreenComponent *component;

@end

NS_ASSUME_NONNULL_END
