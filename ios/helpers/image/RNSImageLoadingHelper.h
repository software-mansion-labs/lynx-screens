#pragma once

#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

/**
 * Adaptation: the RNS helper wraps RCTImageLoader (with an RCTImageSource
 * resolved from an RN asset object); on Lynx images are loaded through the
 * shared LynxImageLoader - the image engine of Lynx's standard image-service
 * setup - from a plain URI, so no loader instance is threaded through.
 */
@interface RNSImageLoadingHelper : NSObject

/**
 * Loads image from a URI string, relies on `LynxImageLoader` implementation.
 * `completionBlock` is executed on main queue.
 */
+ (void)loadImageFromURI:(NSString *)uri
              asTemplate:(BOOL)isTemplate
         completionBlock:(void (^_Nonnull)(UIImage *_Nullable image))imageLoadingCompletionBlock;

@end

NS_ASSUME_NONNULL_END
