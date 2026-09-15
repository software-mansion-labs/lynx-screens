#pragma once

#import "RNSContainer.h"
#import "RNSNavigationTrace.h"
#import "RNSStackNavigationBarCoordinator.h"
#import "RNSStackScreenComponent.h"

@protocol RNSViewFrameChangeDelegate;

@interface RNSStackNavigationController : UINavigationController <RNSContainer>

@property (nonatomic, weak, nullable) id<RNSViewFrameChangeDelegate> navigationBarFrameChangeDelegate;

@property (nonatomic, readonly, nonnull) RNSStackNavigationBarCoordinator *navigationBarCoordinator;

@property(nonatomic, copy, nullable) NSDictionary *traceSession;
@property(nonatomic, strong, nullable) RNSTraceBatch *traceBatch;

- (void)enqueuePushOperation:(nonnull RNSStackScreenComponent *)stackScreen;

- (void)enqueuePopOperation:(nonnull RNSStackScreenComponent *)stackScreen;

- (void)performContainerUpdateIfNeeded;

@end
