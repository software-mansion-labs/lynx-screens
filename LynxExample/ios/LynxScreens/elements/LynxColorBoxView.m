#import "LynxColorBoxView.h"

@implementation LynxColorBoxView

- (void)setBackgroundColorHex:(NSString *)backgroundColorHex {
    _backgroundColorHex = [backgroundColorHex copy];
    self.backgroundColor = [self colorFromHexString:_backgroundColorHex];
}

- (UIColor *)colorFromHexString:(NSString *)hexString {
    NSString *cleanString = [hexString stringByTrimmingCharactersInSet:
                             [NSCharacterSet whitespaceAndNewlineCharacterSet]];
    
    if ([cleanString hasPrefix:@"#"]) {
        cleanString = [cleanString substringFromIndex:1];
    }
    
    if (cleanString.length != 6) {
        return [UIColor lightGrayColor];
    }
    
    unsigned int rgbValue = 0;
    NSScanner *scanner = [NSScanner scannerWithString:cleanString];
    [scanner scanHexInt:&rgbValue];
    
    CGFloat red = ((rgbValue >> 16) & 0xFF) / 255.0;
    CGFloat green = ((rgbValue >> 8) & 0xFF) / 255.0;
    CGFloat blue = (rgbValue & 0xFF) / 255.0;
    
    return [UIColor colorWithRed:red green:green blue:blue alpha:1.0];
}

@end
