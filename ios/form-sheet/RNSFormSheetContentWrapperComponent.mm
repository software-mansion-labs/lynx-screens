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
  // Adaptation: Fragment Layer Renderer keeps backing UIView bounds at zero;
  // updatedFrame always contains the latest Lynx layout result.
  CGFloat newHeight = self.updatedFrame.size.height;
  // Adaptation: Lynx's callback has no oldLayoutMetrics argument.
  CGFloat oldHeight = _lastReportedHeight;
  _lastReportedHeight = newHeight;

  if (newHeight != oldHeight) {
    if (_delegate) {
      [_delegate contentWrapper:self didChangeReactContentsHeight:newHeight];
    }
  }
}

- (void)dealloc
{
  // Adaptation: LynxUI has no Fabric-style invalidate callback.
  _delegate = nil;
}

@end
