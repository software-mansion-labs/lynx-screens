#import "LynxColorBoxViewManager.h"

#import <Lynx/LynxComponentRegistry.h>
#import <Lynx/LynxPropsProcessor.h>

@implementation LynxColorBoxViewManager

LYNX_LAZY_REGISTER_UI("color-box-view")

LYNX_PROP_SETTER("backgroundColorHex", setBackgroudColorHex, NSString *) {
    self.view.backgroundColorHex = value;
}

- (UIView *)createView {
  UIView *colorBoxView = [[LynxColorBoxView alloc] init];
  return colorBoxView;
}

@end
