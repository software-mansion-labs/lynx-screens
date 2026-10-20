#import "RNSStackHeaderAppearanceMapper.h"
#import "RNSDefines.h"
#import "RNSFontUtils.h"

#import <Lynx/LynxConverter+UI.h>

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
// arrive as CSS color strings parsed by LynxConverter (RNS gets processed colors from
// RCTConvert).
+ (nonnull NSDictionary *)textAttributes:(nullable NSDictionary *)baseAttributes
                   updatedWithDictionary:(nullable NSDictionary *)appearanceDict
                               keyPrefix:(nonnull NSString *)keyPrefix
{
    id fontFamily = appearanceDict[[keyPrefix stringByAppendingString:@"FontFamily"]];
    id fontSize = appearanceDict[[keyPrefix stringByAppendingString:@"FontSize"]];
    id fontWeight = appearanceDict[[keyPrefix stringByAppendingString:@"FontWeight"]];
    id fontStyle = appearanceDict[[keyPrefix stringByAppendingString:@"FontStyle"]];
    id fontColor = appearanceDict[[keyPrefix stringByAppendingString:@"FontColor"]];

    NSMutableDictionary *textAttributes = [baseAttributes mutableCopy] ?: [NSMutableDictionary new];

    if (fontFamily != nil || fontSize != nil || fontWeight != nil || fontStyle != nil) {
        textAttributes[NSFontAttributeName] = [RNSFontUtils updateFont:baseAttributes[NSFontAttributeName]
                                                            withFamily:fontFamily
                                                                  size:fontSize
                                                                weight:fontWeight
                                                                 style:fontStyle];
    }

    if (fontColor != nil) {
        textAttributes[NSForegroundColorAttributeName] = [LynxConverter toUIColor:fontColor];
    }

    return textAttributes;
}

@end
