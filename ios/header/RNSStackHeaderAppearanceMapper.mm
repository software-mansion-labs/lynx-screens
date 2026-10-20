#import "RNSStackHeaderAppearanceMapper.h"
#import "RNSDefines.h"
#import "RNSFontUtils.h"

#import <Lynx/LynxColorUtils.h>
#import <Lynx/LynxConverter+UI.h>

// A JS `null` crosses the bridge as NSNull; treat it like an absent key.
static id _Nullable RNSValueOrNil(id _Nullable value)
{
    return [value isEqual:[NSNull null]] ? nil : value;
}

// Colors inside the appearance dictionary arrive as the raw JS values: CSS color
// strings (what the props declare) or, defensively, ARGB numbers. The Lynx prop
// processor parses strings with LynxColorUtils for UIColor-typed setters; a
// dictionary value gets no such treatment, so it is parsed here the same way.
static UIColor *_Nullable RNSColorFromValue(id value)
{
    if ([value isKindOfClass:[NSString class]]) {
        return [LynxColorUtils convertNSStringToUIColor:value];
    }
    if ([value isKindOfClass:[NSNumber class]]) {
        return [LynxConverter toUIColor:value];
    }
    return nil;
}

@implementation RNSStackHeaderAppearanceMapper

+ (nullable UINavigationBarAppearance *)appearanceFromDictionary:(nullable NSDictionary *)appearanceDict
{
    if (appearanceDict.count == 0) {
        return nil;
    }

    UINavigationBarAppearance *appearance = [UINavigationBarAppearance new];
    [self applyTextAttributesFromDictionary:appearanceDict toAppearance:appearance];
    return appearance;
}

+ (nullable UINavigationBarAppearance *)scrollEdgeAppearanceFromDictionary:(nullable NSDictionary *)appearanceDict
{
    if (appearanceDict.count == 0) {
        return nil;
    }

    UINavigationBarAppearance *appearance = [UINavigationBarAppearance new];

    // A nil navigationItem.scrollEdgeAppearance natively resolves to the item's (or bar's)
    // standard appearance with a transparent background. Start the explicit scroll edge
    // appearance from the same transparent base so that a text-only appearance prop does
    // not suddenly bring back the default bar background at the scroll edge.
    [appearance configureWithTransparentBackground];

    [self applyTextAttributesFromDictionary:appearanceDict toAppearance:appearance];
    return appearance;
}

+ (void)applyTextAttributesFromDictionary:(nullable NSDictionary *)appearanceDict
                             toAppearance:(nonnull UINavigationBarAppearance *)appearance
{
    appearance.titleTextAttributes = [self textAttributes:appearance.titleTextAttributes
                                    updatedWithDictionary:appearanceDict
                                                keyPrefix:@"title"];
    appearance.largeTitleTextAttributes = [self textAttributes:appearance.largeTitleTextAttributes
                                         updatedWithDictionary:appearanceDict
                                                     keyPrefix:@"largeTitle"];

#if RNS_IPHONE_OS_VERSION_AVAILABLE(26_0)
    if (@available(iOS 26.0, *)) {
        // UIKit derives both the regular and the large subtitle appearance from
        // subtitleTextAttributes; largeSubtitleTextAttributes is ignored.
        appearance.subtitleTextAttributes = [self textAttributes:appearance.subtitleTextAttributes
                                           updatedWithDictionary:appearanceDict
                                                       keyPrefix:@"subtitle"];
    }
#endif // RNS_IPHONE_OS_VERSION_AVAILABLE(26_0)
}

// Adaptation: fonts are resolved with RNSFontUtils (an adaptation of RCTFont) and colors
// arrive as CSS color strings parsed by LynxColorUtils (RNS gets processed colors from
// RCTConvert).
+ (nonnull NSDictionary *)textAttributes:(nullable NSDictionary *)baseAttributes
                   updatedWithDictionary:(nullable NSDictionary *)appearanceDict
                               keyPrefix:(nonnull NSString *)keyPrefix
{
    id fontFamily = RNSValueOrNil(appearanceDict[[keyPrefix stringByAppendingString:@"FontFamily"]]);
    id fontSize = RNSValueOrNil(appearanceDict[[keyPrefix stringByAppendingString:@"FontSize"]]);
    id fontWeight = RNSValueOrNil(appearanceDict[[keyPrefix stringByAppendingString:@"FontWeight"]]);
    id fontStyle = RNSValueOrNil(appearanceDict[[keyPrefix stringByAppendingString:@"FontStyle"]]);
    id fontColor = RNSValueOrNil(appearanceDict[[keyPrefix stringByAppendingString:@"FontColor"]]);

    NSMutableDictionary *textAttributes = [baseAttributes mutableCopy] ?: [NSMutableDictionary new];

    if (fontFamily != nil || fontSize != nil || fontWeight != nil || fontStyle != nil) {
        textAttributes[NSFontAttributeName] = [RNSFontUtils updateFont:baseAttributes[NSFontAttributeName]
                                                            withFamily:fontFamily
                                                                  size:fontSize
                                                                weight:fontWeight
                                                                 style:fontStyle];
    }

    if (fontColor != nil) {
        UIColor *color = RNSColorFromValue(fontColor);
        if (color != nil) {
            textAttributes[NSForegroundColorAttributeName] = color;
        }
    }

    return textAttributes;
}

@end
