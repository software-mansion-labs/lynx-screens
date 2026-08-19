#pragma once

#import "RNSStackNavigationController.h"
#import "RNSStackScreenComponent.h"

@interface RNSStackOperationCoordinator : NSObject

- (void)addPushOperation:(nonnull RNSStackScreenComponent *)screen;

- (void)addPopOperation:(nonnull RNSStackScreenComponent *)screen;

- (void)executePendingOperationsIfNeeded:(nonnull RNSStackNavigationController *)controller
                     withRenderedScreens:(nonnull NSMutableArray<RNSStackScreenComponent *> *)renderedScreens;

@end
