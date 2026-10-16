#pragma once

#import <Lynx/LynxUI.h>

#if defined(__cplusplus)
#import <vector>
#endif

NS_ASSUME_NONNULL_BEGIN

// Adaptation: LynxUI is the Lynx counterpart of the upstream RNSReactBaseView.
@interface RNSFormSheetHostComponent : LynxUI <UIView *>
@end

#pragma mark - Props

@interface RNSFormSheetHostComponent ()

#if defined(__cplusplus)
- (const std::vector<double> &)detents;
#endif

@property (nonatomic, readonly) BOOL isOpen;
@property (nonatomic, readonly) BOOL prefersGrabberVisible;
@property (nonatomic, readonly) CGFloat preferredCornerRadius;
@property (nonatomic, readonly) NSInteger largestUndimmedDetentIndex;
@property (nonatomic, readonly) NSInteger initialDetentIndex;
@property (nonatomic, readonly) BOOL prefersScrollingExpandsWhenScrolledToEdge;
@property (nonatomic, readonly) BOOL preventNativeDismiss;
@property (nonatomic, readonly, nullable) UIColor *nativeContainerBackgroundColor;

@end

NS_ASSUME_NONNULL_END
