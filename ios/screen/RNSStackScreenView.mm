#import "RNSStackScreenView.h"
#import "RNSStackScreenComponent.h"

@implementation RNSStackScreenView

#pragma mark - RNSScrollViewSeeking

- (void)registerDescendantScrollView:(UIScrollView *)scrollView fromMarker:(RNSScrollViewMarkerComponent *)marker
{
    [self.component registerDescendantScrollView:scrollView fromMarker:marker];
}

@end
