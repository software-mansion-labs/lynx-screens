#pragma once

#import <UIKit/UIKit.h>

#if defined(__cplusplus)
#import <vector>
#endif

@protocol RNSFormSheetBehaviorProvider;

NS_ASSUME_NONNULL_BEGIN

static const double kRNSFormSheetFitToContents = -1.0;
static NSInteger const kRNSFormSheetLastDetent = -1;
static NSInteger const kRNSFormSheetAlwaysDimmed = -1;
static NSInteger const kRNSFormSheetNeverDimmed = -2;

@interface RNSFormSheetDetentResolver : NSObject

#if !TARGET_OS_TV && defined(__cplusplus)
+ (NSArray<UISheetPresentationControllerDetent *> *)buildSheetDetentsWithBehaviorProvider:
    (id<RNSFormSheetBehaviorProvider>)provider;
#endif

#if !TARGET_OS_TV
+ (nullable UISheetPresentationControllerDetentIdentifier)initialDetentIdentifierForDetents:
                                                               (NSArray<UISheetPresentationControllerDetent *> *)detents
                                                                            atRequestedIndex:(NSInteger)requestedIndex;
+ (nullable UISheetPresentationControllerDetentIdentifier)
    largestUndimmedDetentIdentifierForDetents:(NSArray<UISheetPresentationControllerDetent *> *)detents
                             atRequestedIndex:(NSInteger)requestedIndex;
#endif

#if !TARGET_OS_TV && defined(__cplusplus)
+ (NSInteger)detentIndexFromDetentIdentifier:(nullable UISheetPresentationControllerDetentIdentifier)identifier
                               forRawDetents:(const std::vector<double> &)detents;
#endif

@end

NS_ASSUME_NONNULL_END
