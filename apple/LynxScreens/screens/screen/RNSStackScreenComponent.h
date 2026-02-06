#import <UIKit/UIKit.h>
#import <Lynx/LynxUI.h>
#import "RNSStackScreenView.h"

NS_ASSUME_NONNULL_BEGIN

@class RNSStackScreenController;
@class RNSStackHostComponent;

typedef NS_ENUM(int, RNSStackScreenActivityMode) {
    RNSStackScreenActivityModeDetached = 0,
    RNSStackScreenActivityModeAttached = 1,
};

typedef NS_ENUM(NSInteger, RNSScreenLifecycleEvent) {
    RNSScreenLifecycleEventWillAppear = 0,
    RNSScreenLifecycleEventDidAppear = 1,
    RNSScreenLifecycleEventWillDisappear = 2,
    RNSScreenLifecycleEventDidDisappear = 3
};

@interface RNSStackScreenComponent : LynxUI <RNSStackScreenView *>

@property (nonatomic, weak, readwrite, nullable) RNSStackHostComponent *stackHost;
@property (nonatomic, strong, readonly, nonnull) RNSStackScreenController *controller;

@end

#pragma mark - Props

@interface RNSStackScreenComponent ()

@property (nonatomic, strong, readwrite, nullable) NSString *screenKey;
@property (nonatomic, readwrite) RNSStackScreenActivityMode activityMode;

@end

#pragma mark - Events

@interface RNSStackScreenComponent ()

- (void)notifyLifecycleChange:(RNSScreenLifecycleEvent)event;

- (void)emitOnDismiss;
- (void)emitOnNativeDismiss;

@end

NS_ASSUME_NONNULL_END
