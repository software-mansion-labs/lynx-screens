#pragma once

#import <Lynx/LynxUI.h>
#import <UIKit/UIKit.h>

#import "RNSHeaderItemPlacement.h"
#import "RNSStackHeaderItemInvalidationDelegate.h"
#import "RNSStackHeaderItemView.h"
#import "RNSViewFrameChangeDelegate.h"

NS_ASSUME_NONNULL_BEGIN

/**
 * Counterpart of RNS RNSStackHeaderItemComponentView. A configuration-only
 * element: its view is never mounted into the config's view hierarchy -
 * the header config converts it to a UIBarButtonItem (or a wrapped
 * title/subtitle view) which UIKit places in the navigation bar.
 */
@interface RNSStackHeaderItemComponent : LynxUI <RNSStackHeaderItemView *>

@property (nonatomic, weak, nullable) id<RNSStackHeaderItemInvalidationDelegate> invalidationDelegate;

@property (nonatomic, readonly) RNSHeaderItemPlacement placement;
@property (nonatomic, readonly) BOOL hasCustomView;

- (nonnull UIBarButtonItem *)makeBarButtonItemWithFrameChangeDelegate:(id<RNSViewFrameChangeDelegate>)delegate;
- (nonnull UIView *)makeWrappedViewWithFrameChangeDelegate:(id<RNSViewFrameChangeDelegate>)delegate;

@end

NS_ASSUME_NONNULL_END
