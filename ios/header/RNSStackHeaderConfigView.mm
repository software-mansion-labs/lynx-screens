#import "RNSStackHeaderConfigView.h"
#import "RNSStackHeaderConfigComponent.h"

@implementation RNSStackHeaderConfigView

- (void)didMoveToWindow
{
    [super didMoveToWindow];

    // Forwarded for both directions - the component detaches itself from the
    // header coordinator when the view leaves the window.
    [self.component viewDidMoveToWindow];
}

/**
 * `LynxUI.insertChild` automatically calls `insertSubview` on the parent's
 * view. Header items and spacers must NOT land in the native hierarchy here -
 * they are tracked as Lynx children only and converted to UIBarButtonItems /
 * navigation item views in `submitCurrentData` (RNS achieves this by not
 * calling super in `mountChildComponentView`). All Lynx children of the config
 * are items or spacers (asserted in the component), so every insertion is
 * dropped.
 */
- (void)insertSubview:(UIView *)view atIndex:(NSInteger)index
{
    // Intentionally empty.
}

@end
