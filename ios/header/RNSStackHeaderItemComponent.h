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

@property (nonatomic, nullable) NSString *titleProp;
@property (nonatomic, nullable) RNSStackHeaderIconData *iconProp;
@property (nonatomic, nullable) RNSStackHeaderMenuData *menuProp;

@property (nonatomic, weak, nullable) id<RNSStackHeaderItemInvalidationDelegate> invalidationDelegate;

- (void)emitOnPress;

/**
 * Replaces a menu element in the item's menu tree with a new element constructed from command options.
 * If parentMenu is nil, the element is the root menu and is replaced directly.
 */
- (void)updateMenuElementWithId:(NSString *)elementId
                    withElement:(id<RNSStackHeaderMenuElement>)newElement
                     parentMenu:(nullable RNSStackHeaderMenuData *)parentMenu;

@end

NS_ASSUME_NONNULL_END
