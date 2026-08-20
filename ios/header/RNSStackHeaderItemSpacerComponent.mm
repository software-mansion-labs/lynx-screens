#import "RNSStackHeaderItemSpacerComponent.h"

#import <Lynx/LynxComponentRegistry.h>
#import <Lynx/LynxLog.h>
#import <Lynx/LynxPropsProcessor.h>

@LynxElement("ls-stack-header-item-spacer")
@implementation RNSStackHeaderItemSpacerComponent {
    RNSHeaderItemSpacerPlacement _placement;
    BOOL _didSetHeaderItemSpacerPlacement;
    BOOL _isFlexible;
    CGFloat _width;
    BOOL _needsUpdate;
}

- (instancetype)init
{
    if (self = [super init]) {
        [self resetProps];
    }
    return self;
}

- (void)resetProps
{
    _placement = RNSHeaderItemSpacerPlacementTrailing;
    _didSetHeaderItemSpacerPlacement = NO;
    _isFlexible = YES;
    _width = 0;
    _needsUpdate = NO;
}

- (UIView *)createView
{
    return [[UIView alloc] init];
}

#pragma mark - RNSStackHeaderItemSpacerDataProviding

- (RNSHeaderItemSpacerPlacement)placement
{
    return _placement;
}

- (BOOL)isFlexible
{
    return _isFlexible;
}

- (CGFloat)width
{
    return _width;
}

#pragma mark - Props

// Unlike Fabric, Lynx invokes prop setters also for absent/reset props with
// requestReset set - fall back to the default instead of failing.

LYNX_PROP_SETTER("placement", setPlacement, NSString *) {
    if (_didSetHeaderItemSpacerPlacement) {
        LLogWarn(@"[RNScreens] Changing header item spacer placement at runtime is not supported");
        return;
    }
    _didSetHeaderItemSpacerPlacement = YES;

    if (requestReset || value == nil || [value isEqualToString:@"trailing"]) {
        _placement = RNSHeaderItemSpacerPlacementTrailing;
    } else if ([value isEqualToString:@"leading"]) {
        _placement = RNSHeaderItemSpacerPlacementLeading;
    } else {
        LLogError(@"[RNScreens] Invalid StackHeaderItemSpacer placement: %@", value);
        _placement = RNSHeaderItemSpacerPlacementTrailing;
    }
}

LYNX_PROP_SETTER("sizing", setSizing, NSString *) {
    BOOL isFlexible = YES;
    if (!requestReset && [value isEqualToString:@"fixed"]) {
        isFlexible = NO;
    }
    if (_isFlexible != isFlexible) {
        _isFlexible = isFlexible;
        _needsUpdate = YES;
    }
}

LYNX_PROP_SETTER("width", setWidth, CGFloat) {
    if (requestReset) {
        value = 0;
    }
    if (_width != value) {
        _width = value;
        _needsUpdate = YES;
    }
}

- (void)propsDidUpdate
{
    [super propsDidUpdate];

    if (_needsUpdate) {
        _needsUpdate = NO;
        [_invalidationDelegate headerItemSpacerDidInvalidate];
    }
}

@end
