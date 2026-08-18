#pragma once

#import "RNSStackScreenComponent.h"

@interface RNSStackNavigationController : UINavigationController

- (void)enqueuePushOperation:(nonnull RNSStackScreenComponent *)stackScreen;

- (void)enqueuePopOperation:(nonnull RNSStackScreenComponent *)stackScreen;

- (void)performContainerUpdateIfNeeded;

@end
