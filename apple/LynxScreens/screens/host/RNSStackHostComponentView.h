#import <UIKit/UIKit.h>
#import <Lynx/LynxUI.h>
#import "RNSStackHostView.h"
#import "RNSStackHostComponentView.h"

@class RNSStackController;
@class RNSStackScreenComponentView;

NS_ASSUME_NONNULL_BEGIN

@interface RNSStackHostComponentView : LynxUI <RNSStackHostView *>

@property (nonatomic, nonnull, strong, readonly) RNSStackController *controller;
@property (nonatomic, readwrite) bool hasModifiedSubviewsInCurrentTransaction;

- (void)viewDidMoveToWindow;

@end

#pragma mark - Communication with StackScreen

@interface RNSStackHostComponentView ()

- (void)stackScreenChangedActivityMode:(nonnull RNSStackScreenComponentView *)stackScreen;

@end

NS_ASSUME_NONNULL_END
