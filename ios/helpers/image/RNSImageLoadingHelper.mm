#import "RNSImageLoadingHelper.h"

#import <Lynx/LynxImageLoader.h>
#import <Lynx/LynxURL.h>

@implementation RNSImageLoadingHelper

+ (void)loadImageFromURI:(NSString *)uri
              asTemplate:(BOOL)isTemplate
         completionBlock:(void (^_Nonnull)(UIImage *_Nullable image))imageLoadingCompletionBlock
{
    NSAssert(uri != nil, @"[RNScreens] uri must not be nil");

    LynxURL *requestUrl = [LynxURL new];
    requestUrl.url = [NSURL URLWithString:uri];

    [[LynxImageLoader sharedInstance]
        loadImageFromLynxURL:requestUrl
                        size:CGSizeZero
                 contextInfo:nil
                  processors:nil
                imageFetcher:nil
                 LynxUIImage:nil
        enableGenericFetcher:NO
                   completed:^(UIImage *_Nullable image, NSError *_Nullable error, NSURL *_Nullable imageURL) {
                       if ([NSThread isMainThread]) {
                           imageLoadingCompletionBlock([RNSImageLoadingHelper handleRenderingModeForImage:image
                                                                                               isTemplate:isTemplate]);
                       } else {
                           dispatch_async(dispatch_get_main_queue(), ^{
                               imageLoadingCompletionBlock([RNSImageLoadingHelper
                                   handleRenderingModeForImage:image
                                                    isTemplate:isTemplate]);
                           });
                       }
                   }];
}

+ (nullable UIImage *)handleRenderingModeForImage:(nullable UIImage *)image isTemplate:(BOOL)isTemplate
{
    if (isTemplate) {
        return [image imageWithRenderingMode:UIImageRenderingModeAlwaysTemplate];
    } else {
        return [image imageWithRenderingMode:UIImageRenderingModeAlwaysOriginal];
    }
}

@end
