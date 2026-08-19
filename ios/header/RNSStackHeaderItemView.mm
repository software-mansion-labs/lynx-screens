#import "RNSStackHeaderItemView.h"

@implementation RNSStackHeaderItemView

- (CGSize)intrinsicContentSize
{
    // UIKit queries this value for views that opted out of
    // `translatesAutoresizingMaskIntoConstraints` - all custom header items.
    // We leverage this to return the size computed by the Lynx engine.
    if (_lynxSizeProvider != nil) {
        return _lynxSizeProvider();
    }
    return CGSizeZero;
}

@end
