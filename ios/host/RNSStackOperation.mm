#import "RNSStackOperation.h"

@implementation RNSStackOperation

- (instancetype)initWithScreen:(nonnull RNSStackScreenComponent *)stackScreen
{
    NSAssert(stackScreen != nil, @"[RNScreens] Expected nonnull stackScreen!");
    if (self = [super init]) {
        _stackScreen = stackScreen;
    }
    return self;
}

@end

@implementation RNSPushOperation
@end

@implementation RNSPopOperation
@end
