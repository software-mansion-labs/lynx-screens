#import "RNSFormSheetContentView.h"

#import <Lynx/LynxEventHandler.h>
#import <Lynx/LynxEventTarget.h>
#import <Lynx/LynxContext.h>
#import <lynx/LynxTemplateRender+Internal.h>
#import <Lynx/LynxUI.h>
#import <Lynx/LynxView+Internal.h>

@implementation RNSFormSheetContentView

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    // Explicitly set to clearColor since this UIView is manually added
    // into the view hierarchy. This ensures it doesn't interfere with
    // any background colors defined by child React subviews.
    self.backgroundColor = [UIColor clearColor];
  }
  return self;
}

- (nullable UIView *)hitTest:(CGPoint)point withEvent:(nullable UIEvent *)event
{
  UIView *view = [super hitTest:point withEvent:event];
  LynxEventHandler *eventHandler = self.eventHandler;
  if (view == nil || eventHandler == nil) {
    return view;
  }

  LynxUI *rootUI = self.lynxRootUI;
  if (rootUI.context.lynxContext.isFragmentLayerRenderOn) {
    UIView *rootView = rootUI.context.rootView;
    if (![rootView isKindOfClass:LynxView.class]) {
      return view;
    }
    LynxTemplateRender *templateRender = ((LynxView *)rootView).templateRender;
    return [templateRender IsPlatformEventTargetEventThrough:rootUI.sign point:point] ? self : view;
  }

  // Adaptation: UIKit hit-testing must seed the secondary handler's Lynx
  // touch target before its recognizers begin dispatching events.
  id<LynxEventTarget> touchTarget = [eventHandler hitTest:point withEvent:event];
  [eventHandler handleFocus:touchTarget onView:view withContainer:self andPoint:point andEvent:event];

  CGPoint targetPoint = point;
  if ([touchTarget isKindOfClass:LynxUI.class]) {
    targetPoint = [self convertPoint:point toView:((LynxUI *)touchTarget).view];
  }
  return [touchTarget eventThrough:targetPoint] ? self : view;
}

#pragma mark - RN Subviews Management

- (void)insertReactSubview:(UIView *)subview atIndex:(NSInteger)index
{
  [self insertSubview:subview atIndex:index];
}

- (void)removeReactSubview:(UIView *)subview
{
  [subview removeFromSuperview];
}

@end
