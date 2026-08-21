#pragma once

#import <Foundation/Foundation.h>

@class RNSScrollViewMarkerComponent;

@protocol RNSScrollViewSeeking <NSObject>

/**
 *  Call this method to register a ScrollView wrapped by marker with an interested component (receiver).
 */
- (void)registerDescendantScrollView:(nonnull UIScrollView *)scrollView
                          fromMarker:(nonnull RNSScrollViewMarkerComponent *)marker;

@end
