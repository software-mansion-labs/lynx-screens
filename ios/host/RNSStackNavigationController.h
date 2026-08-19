#pragma once

#import "RNSStackNavigationBarCoordinator.h"
#import "RNSStackScreenComponent.h"

@protocol RNSViewFrameChangeDelegate;

@interface RNSStackNavigationController : UINavigationController

@property (nonatomic, weak, nullable) id<RNSViewFrameChangeDelegate> navigationBarFrameChangeDelegate;

@property (nonatomic, readonly, nonnull) RNSStackNavigationBarCoordinator *navigationBarCoordinator;

- (void)enqueuePushOperation:(nonnull RNSStackScreenComponent *)stackScreen;

- (void)enqueuePopOperation:(nonnull RNSStackScreenComponent *)stackScreen;

- (void)performContainerUpdateIfNeeded;

@end
