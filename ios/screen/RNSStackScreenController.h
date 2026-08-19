#pragma once

#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

@class RNSStackScreenComponent;
@class RNSStackScreenHeaderCoordinator;

@interface RNSStackScreenController : UIViewController

@property (nonatomic, strong, readonly, nonnull) RNSStackScreenHeaderCoordinator *headerCoordinator;

/**
 * Divergence from RNS (which keeps the component view private): exposed so that
 * RNSStackNavigationController can dump the stack model - on Lynx the screen key
 * lives on the component, not on the controller's view.
 */
@property (nonatomic, strong, readonly, nonnull) RNSStackScreenComponent *screenComponent;

- (instancetype)initWithComponent:(RNSStackScreenComponent *)component;

@end

NS_ASSUME_NONNULL_END
