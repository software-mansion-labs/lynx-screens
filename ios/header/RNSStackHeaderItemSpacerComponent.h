#pragma once

#import <Lynx/LynxUI.h>
#import <UIKit/UIKit.h>

#import "RNSStackHeaderItemInvalidationDelegate.h"
#import "RNSStackHeaderItemSpacerDataProviding.h"

NS_ASSUME_NONNULL_BEGIN

/**
 * Counterpart of RNS RNSStackHeaderItemSpacerComponentView. A
 * configuration-only element converted (through RNSStackHeaderContentFactory)
 * to a fixed/flexible space UIBarButtonItem by the header config; its view is
 * never mounted.
 */
@interface RNSStackHeaderItemSpacerComponent : LynxUI <UIView *> <RNSStackHeaderItemSpacerDataProviding>

@property (nonatomic, readonly) RNSHeaderItemSpacerPlacement placement;
@property (nonatomic, readonly) BOOL isFlexible;
@property (nonatomic, readonly) CGFloat width;

@property (nonatomic, weak, nullable) id<RNSStackHeaderItemInvalidationDelegate> invalidationDelegate;

@end

NS_ASSUME_NONNULL_END
