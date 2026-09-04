#import "RNSFormSheetDetentResolver.h"
#import "RNSDefines.h"
#import "RNSFormSheetProviders.h"

#if !TARGET_OS_TV

static BOOL RNSAreDetentsValid(const std::vector<double> &detents)
{
  if (detents.size() == 1 && detents[0] == kRNSFormSheetFitToContents) {
    return YES;
  }
  for (double currentDetent : detents) {
    if (isnan(currentDetent) || currentDetent < 0.0 || currentDetent > 1.0) {
      return NO;
    }
  }
  return YES;
}

static BOOL RNSAreDetentsStrictlyAscending(const std::vector<double> &detents)
{
  for (size_t i = 1; i < detents.size(); i++) {
    if (detents[i - 1] >= detents[i]) {
      return NO;
    }
  }
  return YES;
}

@implementation RNSFormSheetDetentResolver

+ (NSArray<UISheetPresentationControllerDetent *> *)buildSheetDetentsWithBehaviorProvider:
    (id<RNSFormSheetBehaviorProvider>)provider
{
  const std::vector<double> &detents = provider.detents;
  size_t detentsCount = detents.size();

  if (detentsCount == 0) {
    return @[ UISheetPresentationControllerDetent.largeDetent ];
  }
  if (!RNSAreDetentsValid(detents)) {
    // Adaptation: keep the UIKit core independent of React's RCTLog.
    NSLog(@"[RNScreens] Detents must be fitToContents or values in [0, 1]. Falling back to large detent.");
    return @[ UISheetPresentationControllerDetent.largeDetent ];
  }
  if (!RNSAreDetentsStrictlyAscending(detents)) {
    NSLog(@"[RNScreens] Detents must be strictly ascending. Falling back to large detent.");
    return @[ UISheetPresentationControllerDetent.largeDetent ];
  }

  NSMutableArray<UISheetPresentationControllerDetent *> *nativeDetents =
      [[NSMutableArray alloc] initWithCapacity:detentsCount];

#if RNS_IPHONE_OS_VERSION_AVAILABLE(16_0)
  if (@available(iOS 16.0, *)) {
    __weak id<RNSFormSheetBehaviorProvider> weakProvider = provider;
    for (size_t i = 0; i < detentsCount; i++) {
      double fraction = detents[i];
      NSString *identifier = [NSString stringWithFormat:@"%zu", i];
      if (fraction == kRNSFormSheetFitToContents) {
        [nativeDetents
            addObject:[UISheetPresentationControllerDetent
                          customDetentWithIdentifier:identifier
                                            resolver:^CGFloat(
                                                id<UISheetPresentationControllerDetentResolutionContext> context) {
                                              CGFloat currentHeight = weakProvider ? weakProvider.contentsHeight : 0.0;
                                              if (currentHeight <= 0.0) {
                                                currentHeight = context.maximumDetentValue;
                                              }
                                              return MIN(context.maximumDetentValue, currentHeight);
                                            }]];
      } else {
        [nativeDetents
            addObject:[UISheetPresentationControllerDetent
                          customDetentWithIdentifier:identifier
                                            resolver:^CGFloat(
                                                id<UISheetPresentationControllerDetentResolutionContext> context) {
                                              return context.maximumDetentValue * fraction;
                                            }]];
      }
    }
  } else
#endif
  {
    if (detentsCount == 1) {
      double firstDetentFraction = detents[0];
      if (firstDetentFraction == kRNSFormSheetFitToContents) {
        NSLog(@"[RNScreens] fitToContents is unsupported below iOS 16. Falling back to large detent.");
        [nativeDetents addObject:UISheetPresentationControllerDetent.largeDetent];
      } else if (firstDetentFraction < 1.0) {
        [nativeDetents addObject:UISheetPresentationControllerDetent.mediumDetent];
      } else {
        [nativeDetents addObject:UISheetPresentationControllerDetent.largeDetent];
      }
    } else {
      [nativeDetents addObject:UISheetPresentationControllerDetent.mediumDetent];
      [nativeDetents addObject:UISheetPresentationControllerDetent.largeDetent];
    }
  }
  return nativeDetents;
}

+ (nullable UISheetPresentationControllerDetentIdentifier)initialDetentIdentifierForDetents:
                                                               (NSArray<UISheetPresentationControllerDetent *> *)detents
                                                                            atRequestedIndex:(NSInteger)requestedIndex
{
  NSInteger initialIndex = requestedIndex == kRNSFormSheetLastDetent ? (NSInteger)detents.count - 1 : requestedIndex;
  if (initialIndex < 0 || initialIndex >= (NSInteger)detents.count) {
    NSLog(@"[RNScreens] initialDetentIndex (%ld) exceeds effective detents count (%lu). Falling back to 0.",
          (long)requestedIndex,
          (unsigned long)detents.count);
    initialIndex = 0;
  }
#if RNS_IPHONE_OS_VERSION_AVAILABLE(16_0)
  if (@available(iOS 16.0, *)) {
    return detents[(NSUInteger)initialIndex].identifier;
  } else
#endif
  {
    UISheetPresentationControllerDetent *targetDetent = detents[(NSUInteger)initialIndex];
    return [targetDetent isEqual:UISheetPresentationControllerDetent.mediumDetent]
        ? UISheetPresentationControllerDetentIdentifierMedium
        : UISheetPresentationControllerDetentIdentifierLarge;
  }
}

+ (nullable UISheetPresentationControllerDetentIdentifier)
    largestUndimmedDetentIdentifierForDetents:(NSArray<UISheetPresentationControllerDetent *> *)detents
                             atRequestedIndex:(NSInteger)requestedIndex
{
  if (requestedIndex == kRNSFormSheetAlwaysDimmed) {
    return nil;
  }
  NSInteger index = requestedIndex == kRNSFormSheetNeverDimmed ? (NSInteger)detents.count - 1 : requestedIndex;
  if (index < 0 || index >= (NSInteger)detents.count) {
    NSLog(@"[RNScreens] largestUndimmedDetentIndex (%ld) exceeds effective detents count (%lu). Falling back to always dimmed.",
          (long)requestedIndex,
          (unsigned long)detents.count);
    return nil;
  }
#if RNS_IPHONE_OS_VERSION_AVAILABLE(16_0)
  if (@available(iOS 16.0, *)) {
    return detents[(NSUInteger)index].identifier;
  } else
#endif
  {
    UISheetPresentationControllerDetent *targetDetent = detents[(NSUInteger)index];
    return [targetDetent isEqual:UISheetPresentationControllerDetent.mediumDetent]
        ? UISheetPresentationControllerDetentIdentifierMedium
        : UISheetPresentationControllerDetentIdentifierLarge;
  }
}

+ (NSInteger)detentIndexFromDetentIdentifier:(nullable UISheetPresentationControllerDetentIdentifier)identifier
                               forRawDetents:(const std::vector<double> &)detents
{
  if (identifier == nil) {
    return -1;
  }
#if RNS_IPHONE_OS_VERSION_AVAILABLE(16_0)
  if (@available(iOS 16.0, *)) {
    if (!detents.empty()) {
      return identifier.integerValue;
    }
  }
#endif
  if ([identifier isEqualToString:UISheetPresentationControllerDetentIdentifierMedium]) {
    return 0;
  }
  if ([identifier isEqualToString:UISheetPresentationControllerDetentIdentifierLarge]) {
    return detents.size() > 1 ? 1 : 0;
  }
  return 0;
}

@end

#endif
