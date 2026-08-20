#pragma once

#import <Lynx/LynxUI.h>
#import <UIKit/UIKit.h>

#import "RNSStackHeaderConfigDataProviding.h"
#import "RNSStackHeaderConfigView.h"
#import "RNSStackHeaderEventsDelegate.h"
#import "RNSStackHeaderItemInvalidationDelegate.h"
#import "RNSViewFrameChangeDelegate.h"

NS_ASSUME_NONNULL_BEGIN

/**
 * Counterpart of RNS RNSStackHeaderConfigComponentView. Exposes the header
 * configuration (props + item children) to the screen controller's header
 * coordinator, which converts it to UINavigationItem / UINavigationBar
 * updates.
 *
 * Adaptation: the `children` requirement of RNSStackHeaderConfigDataProviding
 * is satisfied by the `children` property inherited from LynxComponent - on
 * Lynx the children are LynxUI components (RNS tracks the mounted views
 * itself).
 */
@interface RNSStackHeaderConfigComponent : LynxUI <RNSStackHeaderConfigView *> <RNSViewFrameChangeDelegate,
                                                                                RNSStackHeaderConfigDataProviding,
                                                                                RNSStackHeaderItemInvalidationDelegate,
                                                                                RNSStackHeaderEventsDelegate>

@property (nonatomic, readonly, nullable) NSString *title;
@property (nonatomic, readonly, nullable) NSString *subtitle;
@property (nonatomic, readonly) BOOL hidden;
@property (nonatomic, readonly, nullable) NSString *largeTitle;
@property (nonatomic, readonly, nullable) NSString *largeSubtitle;
@property (nonatomic, readonly) BOOL largeTitleEnabled;

- (void)viewDidMoveToWindow;

- (void)resetProps;

@end

NS_ASSUME_NONNULL_END
