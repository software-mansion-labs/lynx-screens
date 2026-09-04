#import "RNSFormSheetContentView.h"

@implementation RNSFormSheetContentView

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    self.backgroundColor = UIColor.clearColor;
  }
  return self;
}

- (void)insertContentSubview:(UIView *)subview atIndex:(NSInteger)index
{
  [self insertSubview:subview atIndex:index];
}

- (void)removeContentSubview:(UIView *)subview
{
  [subview removeFromSuperview];
}

@end
