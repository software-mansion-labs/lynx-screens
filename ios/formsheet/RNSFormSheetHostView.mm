#import "RNSFormSheetHostView.h"
#import "RNSFormSheetComponent.h"

@implementation RNSFormSheetHostView

- (void)didMoveToWindow
{
    [super didMoveToWindow];
    [self.component hostViewDidMoveToWindow];
}

- (UIView *)hitTest:(CGPoint)point withEvent:(UIEvent *)event
{
    return nil;
}

@end
