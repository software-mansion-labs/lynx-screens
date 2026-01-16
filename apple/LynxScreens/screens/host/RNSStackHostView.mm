#import "RNSStackHostView.h"
#import "RNSStackHostComponentView.h"

@implementation RNSStackHostView

- (void)didMoveToWindow {
    [super didMoveToWindow];

    if (self.window) {
        [self.componentView viewDidMoveToWindow];
    }
}

@end
