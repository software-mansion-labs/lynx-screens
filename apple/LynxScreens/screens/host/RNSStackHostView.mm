#import "RNSStackHostView.h"
#import "RNSStackHostComponent.h"

@implementation RNSStackHostView

- (void)didMoveToWindow {
    [super didMoveToWindow];
    
    if (self.window) {
        [self.component viewDidMoveToWindow];
    }
}

@end
