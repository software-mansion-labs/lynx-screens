#import <UIKit/UIKit.h>
#import <Lynx/LynxUI.h>
#import "RNSStackHostView.h"
#import "RNSStackHostComponent.h"

@class RNSStackController;
@class RNSStackScreenComponent;

NS_ASSUME_NONNULL_BEGIN

@interface RNSStackHostComponent : LynxUI <RNSStackHostView *>

@property (nonatomic, nonnull, strong, readonly) RNSStackController *controller;
@property (nonatomic, readwrite) bool hasModifiedSubviewsInCurrentTransaction;

- (void)viewDidMoveToWindow;

@end

#pragma mark - Communication with StackScreen

@interface RNSStackHostComponent ()

- (void)stackScreenChangedActivityMode:(nonnull RNSStackScreenComponent *)stackScreen;

@end

NS_ASSUME_NONNULL_END
