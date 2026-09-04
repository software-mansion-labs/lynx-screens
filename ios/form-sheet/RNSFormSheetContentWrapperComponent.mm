#import "RNSFormSheetContentWrapperComponent.h"

#import <Lynx/LynxComponentRegistry.h>

@LynxElement("ls-form-sheet-content-wrapper")
@implementation RNSFormSheetContentWrapperComponent {
  CGFloat _lastReportedHeight;
}

- (instancetype)init
{
  if (self = [super init]) {
    _lastReportedHeight = -1.0;
  }
  return self;
}

- (UIView *)createView
{
  return [UIView new];
}

- (void)layoutDidFinished
{
  [super layoutDidFinished];

  // Adaptation: Lynx exposes final component layout through layoutDidFinished;
  // Fabric reports the same value from updateLayoutMetrics.
  CGFloat height = self.view.bounds.size.height;
  if (_lastReportedHeight != height) {
    _lastReportedHeight = height;
    [self.delegate contentWrapper:self didChangeContentsHeight:height];
  }
}

@end
