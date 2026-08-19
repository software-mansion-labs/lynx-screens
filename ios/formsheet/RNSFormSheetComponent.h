#import <UIKit/UIKit.h>
#import "BaseTransferUI.h"
#import "RNSFormSheetHostView.h"

NS_ASSUME_NONNULL_BEGIN

@class RNSFormSheetController;

@interface RNSFormSheetComponent : BaseTransferUI

@property (nonatomic, copy) NSArray<NSNumber *> *detents;
@property (nonatomic) BOOL prefersGrabberVisible;
@property (nonatomic) CGFloat preferredCornerRadius;
@property (nonatomic) NSInteger largestUndimmedDetentIndex;
@property (nonatomic) NSInteger initialDetentIndex;
@property (nonatomic) NSInteger selectedDetentIndex;
@property (nonatomic) BOOL prefersScrollingExpandsWhenScrolledToEdge;
/// Native dismissal channels to block ('back' | 'drag' | 'backdrop').
@property (nonatomic, copy) NSArray<NSString *> *preventNativeDismissChannels;
@property (nonatomic) BOOL preventNativeDismissDragFeedback;

- (BOOL)isDismissPreventedForChannel:(NSString *)channel;

- (void)hostViewDidMoveToWindow;
- (CGFloat)measuredContentHeight;
- (UIColor *)resolvedContainerBackgroundColor;

- (void)emitOnWillAppear;
- (void)emitOnDidAppear;
- (void)emitOnWillDisappear;
- (void)emitOnDidDisappear;
- (void)emitOnNativeDismissPreventedWithChannel:(NSString *)channel;
- (void)emitOnDetentChanged:(NSInteger)index;
- (void)formSheetWasNativelyDismissed;
- (void)formSheetDidDisappear;

@end

NS_ASSUME_NONNULL_END
