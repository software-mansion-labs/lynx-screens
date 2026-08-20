#pragma once

#import <Lynx/LynxUI.h>
#import <UIKit/UIKit.h>

#import "RNSStackHeaderItemDataProviding.h"
#import "RNSStackHeaderItemInvalidationDelegate.h"
#import "RNSStackHeaderItemView.h"

NS_ASSUME_NONNULL_BEGIN

/**
 * Counterpart of RNS RNSStackHeaderItemComponentView. A configuration-only
 * element: its view is never mounted into the config's view hierarchy -
 * the header config converts it (through RNSStackHeaderContentFactory) to a
 * UIBarButtonItem or a wrapped title/subtitle view which UIKit places in the
 * navigation bar.
 */
@interface RNSStackHeaderItemComponent : LynxUI <RNSStackHeaderItemView *> <RNSStackHeaderItemDataProviding>

@property (nonatomic, readonly) RNSHeaderItemPlacement placement;
@property (nonatomic, readonly, nullable) NSString *itemId;
@property (nonatomic, readonly, nullable) NSString *title;
@property (nonatomic, readonly, nullable) RNSStackHeaderIconData *icon;
@property (nonatomic, readonly, nullable) RNSStackHeaderMenuData *menu;
@property (nonatomic, readonly, nullable) UIView *customView;
@property (nonatomic, readonly) BOOL respondsToOnPress;

@property (nonatomic, weak, nullable) id<RNSStackHeaderItemInvalidationDelegate> invalidationDelegate;

- (void)emitOnPress;

@end

NS_ASSUME_NONNULL_END
