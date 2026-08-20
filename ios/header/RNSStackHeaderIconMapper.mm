#import "RNSStackHeaderIconMapper.h"

@implementation RNSStackHeaderIconMapper

+ (nullable RNSStackHeaderIconData *)iconFromDictionary:(nullable id)dictionary
{
    if (![dictionary isKindOfClass:[NSDictionary class]]) {
        return nil;
    }
    NSDictionary *dict = (NSDictionary *)dictionary;

    NSString *type = dict[@"type"];
    if (![type isKindOfClass:[NSString class]]) {
        return nil;
    }

    if ([type isEqualToString:@"sfSymbol"]) {
        return [[RNSStackHeaderIconData alloc] initWithType:RNSStackHeaderIconTypeSfSymbol
                                               resourceName:dict[@"name"]
                                                 jsonSource:nil];
    }

    if ([type isEqualToString:@"xcasset"]) {
        return [[RNSStackHeaderIconData alloc] initWithType:RNSStackHeaderIconTypeXcasset
                                               resourceName:dict[@"name"]
                                                 jsonSource:nil];
    }

    // Adaptation: on Lynx the image and template sources are flat { uri }
    // objects (no RN resolved-asset dictionaries under `imageSource` /
    // `templateSource` keys) - the icon dictionary itself is stored as the
    // json source.
    if ([type isEqualToString:@"imageSource"]) {
        if (![dict[@"uri"] isKindOfClass:[NSString class]]) {
            return nil;
        }
        return [[RNSStackHeaderIconData alloc] initWithType:RNSStackHeaderIconTypeImageSource
                                               resourceName:nil
                                                 jsonSource:dict];
    }

    if ([type isEqualToString:@"templateSource"]) {
        if (![dict[@"uri"] isKindOfClass:[NSString class]]) {
            return nil;
        }
        return [[RNSStackHeaderIconData alloc] initWithType:RNSStackHeaderIconTypeTemplateSource
                                               resourceName:nil
                                                 jsonSource:dict];
    }

    return nil;
}

@end
