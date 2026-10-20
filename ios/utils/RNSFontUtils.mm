#import "RNSFontUtils.h"

#import <CoreText/CoreText.h>
#import <Lynx/LynxLog.h>

static UIFontWeight RNSGetFontWeight(UIFont *font)
{
    static NSArray<NSString *> *weightSuffixes;
    static NSArray<NSNumber *> *fontWeights;
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        // We use two arrays instead of one map because
        // the order is important for suffix matching.
        weightSuffixes = @[
            @"normal",
            @"ultralight",
            @"thin",
            @"light",
            @"regular",
            @"medium",
            @"semibold",
            @"demibold",
            @"extrabold",
            @"ultrabold",
            @"bold",
            @"heavy",
            @"black"
        ];
        fontWeights = @[
            @(UIFontWeightRegular),
            @(UIFontWeightUltraLight),
            @(UIFontWeightThin),
            @(UIFontWeightLight),
            @(UIFontWeightRegular),
            @(UIFontWeightMedium),
            @(UIFontWeightSemibold),
            @(UIFontWeightSemibold),
            @(UIFontWeightHeavy),
            @(UIFontWeightHeavy),
            @(UIFontWeightBold),
            @(UIFontWeightHeavy),
            @(UIFontWeightBlack)
        ];
    });
    NSString *fontName = font.fontName;
    NSInteger i = 0;
    for (NSString *suffix in weightSuffixes) {
        auto options = kCFCompareCaseInsensitive | kCFCompareAnchored | kCFCompareBackwards;
        if (CFStringFind((CFStringRef)fontName, (CFStringRef)suffix, options).location != kCFNotFound) {
            return (UIFontWeight)fontWeights[i].doubleValue;
        }
        i++;
    }
    auto traits = (__bridge_transfer NSDictionary *)CTFontCopyTraits((CTFontRef)font);
    return (UIFontWeight)[traits[UIFontWeightTrait] doubleValue];
}

static BOOL RNSIsItalicFont(UIFont *font)
{
    return (CTFontGetSymbolicTraits((CTFontRef)font) & kCTFontTraitItalic) != 0;
}

static NSArray<NSString *> *RNSFontNamesForFamilyName(NSString *familyName)
{
    static NSCache<NSString *, NSArray<NSString *> *> *cache;
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        cache = [NSCache new];
    });

    NSArray<NSString *> *names = [cache objectForKey:familyName];
    if (names == nil) {
        names = [UIFont fontNamesForFamilyName:familyName] ?: [NSArray new];
        [cache setObject:names forKey:familyName];
    }
    return names;
}

// Same table as React Native's RCTFontWeight converter.
static UIFontWeight RNSFontWeightFromString(NSString *weight, UIFontWeight fallback)
{
    static NSDictionary<NSString *, NSNumber *> *weights;
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        weights = @{
            @"normal" : @(UIFontWeightRegular),
            @"bold" : @(UIFontWeightBold),
            @"100" : @(UIFontWeightUltraLight),
            @"200" : @(UIFontWeightThin),
            @"300" : @(UIFontWeightLight),
            @"400" : @(UIFontWeightRegular),
            @"500" : @(UIFontWeightMedium),
            @"600" : @(UIFontWeightSemibold),
            @"700" : @(UIFontWeightBold),
            @"800" : @(UIFontWeightHeavy),
            @"900" : @(UIFontWeightBlack),
        };
    });
    NSNumber *value = weights[weight];
    if (value == nil) {
        LLogWarn(@"[RNScreens] Unsupported font weight: %@", weight);
        return fallback;
    }
    return (UIFontWeight)value.doubleValue;
}

// Same table as React Native's RCTFontStyle converter.
static BOOL RNSIsItalicFontStyle(NSString *style, BOOL fallback)
{
    if ([style isEqualToString:@"normal"]) {
        return NO;
    }
    if ([style isEqualToString:@"italic"] || [style isEqualToString:@"oblique"]) {
        return YES;
    }
    LLogWarn(@"[RNScreens] Unsupported font style: %@", style);
    return fallback;
}

@implementation RNSFontUtils

+ (UIFont *)updateFont:(nullable UIFont *)font
            withFamily:(nullable NSString *)family
                  size:(nullable NSNumber *)size
                weight:(nullable NSString *)weight
                 style:(nullable NSString *)style
{
    // Defaults
    static NSString *defaultFontFamily;
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        defaultFontFamily = [UIFont systemFontOfSize:14].familyName;
    });
    const UIFontWeight defaultFontWeight = UIFontWeightRegular;
    const CGFloat defaultFontSize = 14;

    // Initialize properties to defaults
    CGFloat fontSize = defaultFontSize;
    UIFontWeight fontWeight = defaultFontWeight;
    NSString *familyName = defaultFontFamily;
    BOOL isItalic = NO;

    if (font) {
        familyName = font.familyName ?: defaultFontFamily;
        fontSize = font.pointSize ?: defaultFontSize;
        fontWeight = RNSGetFontWeight(font);
        isItalic = RNSIsItalicFont(font);
    }

    // Get font attributes
    fontSize = size.doubleValue ?: fontSize;
    familyName = family ?: familyName;
    isItalic = style ? RNSIsItalicFontStyle(style, isItalic) : isItalic;
    fontWeight = weight ? RNSFontWeightFromString(weight, fontWeight) : fontWeight;

    BOOL didFindFont = NO;

    // Handle system font as special case. This ensures that we preserve
    // the specific metrics of the standard system font as closely as possible.
    if ([familyName isEqual:defaultFontFamily] || [familyName isEqualToString:@"System"]) {
        font = [UIFont systemFontOfSize:fontSize weight:fontWeight];
        if (font) {
            didFindFont = YES;

            if (isItalic) {
                UIFontDescriptor *fontDescriptor = [font fontDescriptor];
                UIFontDescriptorSymbolicTraits symbolicTraits = fontDescriptor.symbolicTraits;
                symbolicTraits |= UIFontDescriptorTraitItalic;
                fontDescriptor = [fontDescriptor fontDescriptorWithSymbolicTraits:symbolicTraits];
                font = [UIFont fontWithDescriptor:fontDescriptor size:fontSize];
            }
        }
    }

    // Gracefully handle being given a font name rather than font family, for
    // example: "Helvetica Light Oblique" rather than just "Helvetica".
    if (!didFindFont && RNSFontNamesForFamilyName(familyName).count == 0) {
        font = [UIFont fontWithName:familyName size:fontSize];
        if (font) {
            // It's actually a font name, not a font family name,
            // but we'll do what was meant, not what was said.
            familyName = font.familyName;
            fontWeight = weight ? fontWeight : RNSGetFontWeight(font);
            isItalic = style ? isItalic : RNSIsItalicFont(font);
        } else {
            // Not a valid font or family
            LLogInfo(@"[RNScreens] Unrecognized font family '%@'", familyName);
            font = [UIFont systemFontOfSize:fontSize weight:fontWeight];
        }
    }

    NSArray<NSString *> *names = RNSFontNamesForFamilyName(familyName);
    if (!didFindFont) {
        // Get the closest font that matches the given weight for the fontFamily
        CGFloat closestWeight = INFINITY;
        for (NSString *name in names) {
            UIFont *match = [UIFont fontWithName:name size:fontSize];
            if (isItalic == RNSIsItalicFont(match)) {
                CGFloat testWeight = RNSGetFontWeight(match);
                if (ABS(testWeight - fontWeight) < ABS(closestWeight - fontWeight)) {
                    font = match;
                    closestWeight = testWeight;
                }
            }
        }
    }

    // If we still don't have a match at least return the first font in the fontFamily
    // This is to support built-in font Zapfino and other custom single font families like Impact
    if (!font && names.count > 0) {
        font = [UIFont fontWithName:names[0] size:fontSize];
    }

    return font;
}

@end
