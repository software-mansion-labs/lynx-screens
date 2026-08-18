#pragma once

#import "RNSStackScreenComponent.h"

NS_ASSUME_NONNULL_BEGIN

@interface RNSStackOperation : NSObject

@property (nonatomic, strong, readonly) RNSStackScreenComponent *stackScreen;

- (instancetype)initWithScreen:(nonnull RNSStackScreenComponent *)stackScreen;

@end

@interface RNSPushOperation : RNSStackOperation

@end

@interface RNSPopOperation : RNSStackOperation

@end

NS_ASSUME_NONNULL_END
