#pragma once

#import <Lynx/LynxUI.h>
#import <UIKit/UIKit.h>

#import "RNSHeaderItemSpacerPlacement.h"
#import "RNSStackHeaderItemInvalidationDelegate.h"

NS_ASSUME_NONNULL_BEGIN

/**
 * Counterpart of RNS RNSStackHeaderItemSpacerComponentView. A
 * configuration-only element converted to a fixed/flexible space
 * UIBarButtonItem by the header config; its view is never mounted.
 */
@interface RNSStackHeaderItemSpacerComponent : LynxUI <UIView *>

@property (nonatomic, weak, nullable) id<RNSStackHeaderItemInvalidationDelegate> invalidationDelegate;

@property (nonatomic, readonly) RNSHeaderItemSpacerPlacement placement;

- (nonnull UIBarButtonItem *)makeBarButtonItem;

@end

NS_ASSUME_NONNULL_END
