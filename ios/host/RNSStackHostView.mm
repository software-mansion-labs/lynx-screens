#import "RNSStackHostView.h"
#import "RNSStackHostComponent.h"
#import "RNSStackScreenView.h"

@implementation RNSStackHostView

- (void)didMoveToWindow {
    [super didMoveToWindow];
    
    if (self.window) {
        [self.component viewDidMoveToWindow];
    }
}

- (void)insertSubview:(UIView *)view atIndex:(NSInteger)index
{
    /**
     * `LynxUI.insertChild` method automatically calls `insertSubview`, taking the management over the native hierarchy.
     * However, we need to intercept and ignore this call when dealing with a `StackHost` - `StackScreen` communication.
     * While attaching a `StackScreen` as a Lynx child of a `StackHost` is reasonable for Lynx component hierarchy (similarly to `reactSubviews`),
     * the native hierarchy requires screen management to be realized by `RNSStackNavigationController` (at the view controller level),
     * rather than relying on direct insertions.
     */
    if ([view isKindOfClass:RNSStackScreenView.class]) {
        return;
    }
    [super insertSubview:view atIndex:index];
}

@end
