#import <UIKit/UIKit.h>
#import <Lynx/LynxUI.h>
#import "RNSStackHostView.h"

@class RNSStackScreenComponent;

NS_ASSUME_NONNULL_BEGIN

@interface RNSStackHostComponent : LynxUI <RNSStackHostView *>

- (void)viewDidMoveToWindow;

@end

#pragma mark - Communication with StackScreen

@interface RNSStackHostComponent ()

- (void)stackScreenChangedActivityMode:(nonnull RNSStackScreenComponent *)stackScreen;

@end

NS_ASSUME_NONNULL_END
