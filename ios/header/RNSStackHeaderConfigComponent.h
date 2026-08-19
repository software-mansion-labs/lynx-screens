#pragma once

#import <Lynx/LynxUI.h>
#import <UIKit/UIKit.h>

#import "RNSStackHeaderConfigView.h"
#import "RNSViewFrameChangeDelegate.h"

NS_ASSUME_NONNULL_BEGIN

/**
 * Counterpart of RNS RNSStackHeaderConfigComponentView. Collects header
 * configuration (props + item children) and submits it as RNSStackHeaderData
 * to the screen controller's header coordinator, which distributes it to the
 * UINavigationItem / UINavigationBar.
 */
@interface RNSStackHeaderConfigComponent : LynxUI <RNSStackHeaderConfigView *> <RNSViewFrameChangeDelegate>

- (void)viewDidMoveToWindow;

- (void)resetProps;

@end

NS_ASSUME_NONNULL_END
