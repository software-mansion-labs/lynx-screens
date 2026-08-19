#import "RNSFormSheetController.h"
#import "RNSFormSheetComponent.h"

#import <QuartzCore/QuartzCore.h>

#include <cmath>

static const CGFloat RNSFormSheetDefaultDimAlpha = 0.5;
static const CGFloat RNSFormSheetDefaultCornerRadius = 12.0;
static const CGFloat RNSFormSheetGrabberWidth = 36.0;
static const CGFloat RNSFormSheetGrabberHeight = 5.0;
static const CGFloat RNSFormSheetDismissZone = 60.0;
static const NSTimeInterval RNSFormSheetAnimationDuration = 0.3;

// selectedDetentIndex / initialDetentIndex sentinels
static const NSInteger RNSFormSheetLastDetent = -1;
// largestUndimmedDetentIndex sentinels
static const NSInteger RNSFormSheetAlwaysDimmed = -1;
static const NSInteger RNSFormSheetNeverDimmed = -2;
// detents sentinel for fitToContents
static const double RNSFormSheetFitToContents = -1.0;

#pragma mark - Present transition

// Presents the sheet with the backdrop fading in while the sheet itself slides
// up. Keeps the dim from sliding with the sheet (a plain CoverVertical modal
// transition moves them together, leaving a moving dim edge on screen).
@interface RNSFormSheetPresentAnimator : NSObject <UIViewControllerAnimatedTransitioning>

- (instancetype)initWithDimmingView:(UIView *)dimmingView sheetView:(UIView *)sheetView;

@end

@implementation RNSFormSheetPresentAnimator {
    UIView *_dimmingView;
    UIView *_sheetView;
}

- (instancetype)initWithDimmingView:(UIView *)dimmingView sheetView:(UIView *)sheetView
{
    if (self = [super init]) {
        _dimmingView = dimmingView;
        _sheetView = sheetView;
    }
    return self;
}

- (NSTimeInterval)transitionDuration:(id<UIViewControllerContextTransitioning>)transitionContext
{
    return RNSFormSheetAnimationDuration;
}

- (void)animateTransition:(id<UIViewControllerContextTransitioning>)transitionContext
{
    UIView *containerView = transitionContext.containerView;
    UIView *toView = [transitionContext viewForKey:UITransitionContextToViewKey];
    if (toView.superview != containerView) {
        [containerView addSubview:toView];
    }
    toView.frame = containerView.bounds;
    [toView layoutIfNeeded];

    CGFloat targetDimAlpha = _dimmingView.alpha;
    CGFloat targetSheetY = CGRectGetMinY(_sheetView.frame);
    CGFloat containerHeight = CGRectGetHeight(containerView.bounds);

    _dimmingView.alpha = 0;
    CGRect startFrame = _sheetView.frame;
    startFrame.origin.y = containerHeight;
    _sheetView.frame = startFrame;

    // Backdrop fades in with the same ease-in-out curve as the sheet slide, so
    // the two stay in lockstep.
    [UIView animateWithDuration:[self transitionDuration:transitionContext]
                          delay:0
                        options:UIViewAnimationOptionCurveEaseInOut
                     animations:^{
        CGRect frame = self->_sheetView.frame;
        frame.origin.y = targetSheetY;
        self->_sheetView.frame = frame;
        self->_dimmingView.alpha = targetDimAlpha;
    } completion:^(BOOL finished) {
        [transitionContext completeTransition:!transitionContext.transitionWasCancelled];
    }];
}

@end

@implementation RNSFormSheetController {
    UIView *_dimmingView;
    UIView *_sheetView;
    UIView *_grabberView;
    UIView *_contentView;

    UIPanGestureRecognizer *_panGesture;
    UITapGestureRecognizer *_backdropTapGesture;
    UIGestureRecognizer *_disabledScrollPanGesture;

    NSArray<NSNumber *> *_resolvedHeights;
    NSInteger _currentDetentIndex;
    NSInteger _lastEmittedDetentIndex;
    BOOL _applyInitialDetent;
    BOOL _applyInitialDetentPending;

    CGFloat _dragStartTop;
    BOOL _isDragging;
    CGSize _lastLayoutSize;
}

- (instancetype)initWithComponent:(RNSFormSheetComponent *)component
                      contentView:(UIView *)contentView
{
    if (self = [super initWithNibName:nil bundle:nil]) {
        _component = component;
        _contentView = contentView;
        _currentDetentIndex = 0;
        _lastEmittedDetentIndex = -1;
        _lastLayoutSize = CGSizeZero;

        self.modalPresentationStyle = UIModalPresentationOverFullScreen;
        self.modalTransitionStyle = UIModalTransitionStyleCoverVertical;
        self.transitioningDelegate = self;

        [self setUpViews];
    }
    return self;
}

- (void)setUpViews
{
    self.view.backgroundColor = UIColor.clearColor;

    _dimmingView = [[UIView alloc] initWithFrame:self.view.bounds];
    _dimmingView.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;
    _dimmingView.backgroundColor = UIColor.blackColor;
    _dimmingView.alpha = RNSFormSheetDefaultDimAlpha;
    [self.view addSubview:_dimmingView];

    // Attached to the full-screen background rather than the dimming view:
    // UIKit hit-testing ignores views whose alpha drops below 0.01, so once the
    // backdrop fades out (largestUndimmedDetentIndex) it would stop receiving taps.
    _backdropTapGesture = [[UITapGestureRecognizer alloc] initWithTarget:self
                                                                  action:@selector(handleBackdropTap:)];
    _backdropTapGesture.delegate = self;
    _backdropTapGesture.cancelsTouchesInView = NO;
    [self.view addGestureRecognizer:_backdropTapGesture];

    _sheetView = [[UIView alloc] initWithFrame:self.view.bounds];
    if (@available(iOS 11.0, *)) {
        _sheetView.layer.maskedCorners = kCALayerMinXMinYCorner | kCALayerMaxXMinYCorner;
    }
    _sheetView.clipsToBounds = YES;
    _sheetView.backgroundColor = UIColor.clearColor;
    [self.view addSubview:_sheetView];

    _contentView.frame = _sheetView.bounds;
    [_sheetView addSubview:_contentView];

    _grabberView = [[UIView alloc] init];
    _grabberView.backgroundColor = [UIColor colorWithWhite:0.5 alpha:0.6];
    _grabberView.layer.cornerRadius = RNSFormSheetGrabberHeight / 2.0;
    _grabberView.userInteractionEnabled = NO;
    [_sheetView addSubview:_grabberView];

    _panGesture = [[UIPanGestureRecognizer alloc] initWithTarget:self action:@selector(handlePan:)];
    _panGesture.delegate = self;
    _panGesture.maximumNumberOfTouches = 1;
    [_sheetView addGestureRecognizer:_panGesture];
}

#pragma mark - Configuration

- (void)applyConfigurationApplyingInitialDetent:(BOOL)applyInitialDetent
{
    _applyInitialDetent = applyInitialDetent;
    [self applyAppearance];

    BOOL hasSize = self.view.bounds.size.height > 0;
    if (hasSize) {
        [self resolveDetentHeights];
        [self applyDetentFrameAnimated:NO];
        [self applyRequestedDetentAnimated:NO];
    } else {
        _applyInitialDetentPending = YES;
    }
    [self layoutContent];
    [self updateDimming];
}

- (void)invalidateDetents
{
    if (!_isDragging) {
        [self resolveDetentHeights];
        [self applyDetentFrameAnimated:NO];
        [self updateDimming];
    }
}

- (void)applyAppearance
{
    _sheetView.layer.cornerRadius = self.component.preferredCornerRadius < 0
        ? RNSFormSheetDefaultCornerRadius
        : self.component.preferredCornerRadius;
    // The native sheet frame already stays inside the safe area. The content
    // fills that frame; apps remain responsible for any additional insets.
    _contentView.backgroundColor = [self.component resolvedContainerBackgroundColor] ?: UIColor.clearColor;
}

- (void)resolveDetentHeights
{
    CGFloat availableHeight = CGRectGetHeight(self.view.bounds);
    if (availableHeight <= 0) {
        return;
    }

    NSArray<NSNumber *> *rawDetents = [self validatedDetents:self.component.detents];
    NSMutableArray<NSNumber *> *heights = [NSMutableArray arrayWithCapacity:rawDetents.count ?: 1];

    if (rawDetents.count == 0) {
        [heights addObject:@(availableHeight)];
    } else if (rawDetents.count == 1 && rawDetents.firstObject.doubleValue == RNSFormSheetFitToContents) {
        CGFloat contentHeight = MAX([self.component measuredContentHeight], 1);
        [heights addObject:@(MIN(contentHeight, availableHeight))];
    } else {
        [rawDetents enumerateObjectsUsingBlock:^(NSNumber *fraction, NSUInteger idx, BOOL *stop) {
            [heights addObject:@(availableHeight * MIN(MAX(fraction.doubleValue, 0), 1))];
        }];
    }

    _resolvedHeights = heights;
    _currentDetentIndex = MIN(MAX(_currentDetentIndex, 0), (NSInteger)_resolvedHeights.count - 1);
}

#pragma mark - Detent layout

- (void)viewDidLayoutSubviews
{
    [super viewDidLayoutSubviews];

    _dimmingView.frame = self.view.bounds;

    if (!CGSizeEqualToSize(_lastLayoutSize, self.view.bounds.size)) {
        _lastLayoutSize = self.view.bounds.size;
        [self resolveDetentHeights];
        [self applyDetentFrameAnimated:NO];
        [self updateDimming];
    }

    if (_applyInitialDetentPending) {
        _applyInitialDetentPending = NO;
        [self applyRequestedDetentAnimated:NO];
    }

    [self layoutContent];
    [self layoutGrabber];
}

- (void)viewSafeAreaInsetsDidChange
{
    if (@available(iOS 11.0, *)) {
        [super viewSafeAreaInsetsDidChange];
        [self resolveDetentHeights];
        [self applyDetentFrameAnimated:NO];
        [self updateDimming];
    }
}

- (void)applyDetentFrameAnimated:(BOOL)animated
{
    if (_resolvedHeights.count == 0) {
        return;
    }
    CGFloat height = _resolvedHeights[_currentDetentIndex].doubleValue;
    CGRect safeFrame = self.view.bounds;
    CGFloat top = MAX(CGRectGetMaxY(safeFrame) - height, CGRectGetMinY(safeFrame));
    CGFloat targetDimAlpha = [self dimAlphaForSheetHeight:height];

    if (animated) {
        // The backdrop follows the sheet with the same curve and duration, so
        // its edge always tracks the sheet edge (FloatingPanel does the same by
        // setting backdropView.alpha inside the sheet's animator).
        [UIView animateWithDuration:0.28
                              delay:0
             usingSpringWithDamping:0.85
              initialSpringVelocity:0
                            options:UIViewAnimationOptionCurveEaseOut
                         animations:^{
            [self setSheetTop:top];
            self->_dimmingView.alpha = targetDimAlpha;
        } completion:nil];
    } else {
        [self setSheetTop:top];
        _dimmingView.alpha = targetDimAlpha;
    }
}

- (void)applyRequestedDetentAnimated:(BOOL)animated
{
    NSInteger count = (NSInteger)_resolvedHeights.count;
    if (count == 0) {
        _applyInitialDetentPending = YES;
        return;
    }

    NSInteger selected = self.component.selectedDetentIndex;
    NSInteger index;
    if (selected >= RNSFormSheetLastDetent) {
        index = selected;
        // JS-driven controlled updates animate; the very first (initial) apply
        // stays non-animated so it doesn't fight the presentation transition.
        if (!_applyInitialDetent) {
            animated = YES;
        }
    } else if (_applyInitialDetent) {
        index = self.component.initialDetentIndex;
    } else {
        return;
    }

    if (index == RNSFormSheetLastDetent) {
        index = count - 1;
    }
    [self setDetentIndex:MIN(MAX(index, 0), count - 1) animated:animated];
}

- (void)setDetentIndex:(NSInteger)index animated:(BOOL)animated
{
    NSInteger count = (NSInteger)_resolvedHeights.count;
    if (count == 0) {
        return;
    }
    NSInteger clamped = MIN(MAX(index, 0), count - 1);
    _currentDetentIndex = clamped;
    [self applyDetentFrameAnimated:animated];

    if (clamped != _lastEmittedDetentIndex) {
        _lastEmittedDetentIndex = clamped;
        [self.component emitOnDetentChanged:clamped];
    }
}

- (void)setSheetTop:(CGFloat)top
{
    CGRect safeFrame = self.view.bounds;
    CGFloat height = MAX(CGRectGetMaxY(safeFrame) - top, 0);
    _sheetView.frame = CGRectMake(CGRectGetMinX(safeFrame), top, CGRectGetWidth(safeFrame), height);
    [self layoutContent];
    [self layoutGrabber];
}

- (void)layoutContent
{
    _contentView.frame = _sheetView.bounds;
}

- (void)layoutGrabber
{
    CGFloat x = (CGRectGetWidth(_sheetView.bounds) - RNSFormSheetGrabberWidth) / 2.0;
    _grabberView.frame = CGRectMake(x, 8, RNSFormSheetGrabberWidth, RNSFormSheetGrabberHeight);
    _grabberView.hidden = !self.component.prefersGrabberVisible;
}

#pragma mark - Dimming

- (void)updateDimming
{
    CGFloat sheetHeight = CGRectGetHeight(_sheetView.bounds);
    if (sheetHeight <= 0) {
        _dimmingView.alpha = RNSFormSheetDefaultDimAlpha;
        return;
    }
    _dimmingView.alpha = [self dimAlphaForSheetHeight:sheetHeight];
}

- (CGFloat)dimAlphaForSheetHeight:(CGFloat)sheetHeight
{
    NSInteger lud = self.component.largestUndimmedDetentIndex;
    CGFloat baseAlpha;
    if (lud == RNSFormSheetAlwaysDimmed) {
        baseAlpha = RNSFormSheetDefaultDimAlpha;
    } else if (lud == RNSFormSheetNeverDimmed) {
        baseAlpha = 0;
    } else if (_resolvedHeights.count == 0) {
        baseAlpha = RNSFormSheetDefaultDimAlpha;
    } else {
        NSInteger index = MIN(MAX(lud, 0), (NSInteger)_resolvedHeights.count - 1);
        CGFloat threshold = _resolvedHeights[index].doubleValue;
        if (sheetHeight <= threshold) {
            // At or below the largest undimmed detent the backdrop stays clear.
            baseAlpha = 0;
        } else {
            // Larger detents dim the backdrop. Fade it in linearly across the
            // whole gap between the largest undimmed detent and the next larger
            // one, so the alpha follows the sheet position.
            NSInteger nextIndex = MIN(index + 1, (NSInteger)_resolvedHeights.count - 1);
            CGFloat upper = _resolvedHeights[nextIndex].doubleValue;
            if (upper <= threshold) {
                baseAlpha = RNSFormSheetDefaultDimAlpha;
            } else {
                CGFloat progress = MIN((sheetHeight - threshold) / (upper - threshold), 1);
                baseAlpha = RNSFormSheetDefaultDimAlpha * progress;
            }
        }
    }

    // When the backdrop is otherwise always dimmed, fade it across the full
    // distance from the smallest visible detent to hidden.
    if (lud == RNSFormSheetAlwaysDimmed && _resolvedHeights.count > 0) {
        CGFloat fadeStartHeight = 0;
        for (NSNumber *height in _resolvedHeights) {
            if (height.doubleValue > 0) {
                fadeStartHeight = height.doubleValue;
                break;
            }
        }
        if (fadeStartHeight > 0) {
            CGFloat dismissProgress = MIN(MAX(sheetHeight / fadeStartHeight, 0), 1);
            baseAlpha *= dismissProgress;
        } else {
            baseAlpha = 0;
        }
    }
    return baseAlpha;
}

#pragma mark - Drag interaction

- (void)handlePan:(UIPanGestureRecognizer *)pan
{
    switch (pan.state) {
        case UIGestureRecognizerStateBegan: {
            _isDragging = YES;
            _dragStartTop = CGRectGetMinY(_sheetView.frame);
            _disabledScrollPanGesture = [self scrollPanGestureAtPoint:[pan locationInView:_sheetView]];
            _disabledScrollPanGesture.enabled = NO;
            break;
        }
        case UIGestureRecognizerStateChanged: {
            if (_resolvedHeights.count == 0) {
                break;
            }
            CGFloat translationY = [pan translationInView:self.view].y;
            CGFloat top = _dragStartTop + translationY;
            // Clamp the top edge so the sheet never grows beyond its largest detent.
            top = MAX(top, [self largestDetentTop]);
            if ([self isPullDownDismissRigid]) {
                // preventNativeDismissDragFeedback: keep the sheet rigid at
                // the smallest detent - it neither follows the finger below it
                // nor bounces back.
                top = MIN(top, [self smallestDetentTop]);
            }
            [self setSheetTop:top];
            [self updateDimming];
            break;
        }
        case UIGestureRecognizerStateEnded:
        case UIGestureRecognizerStateCancelled: {
            _isDragging = NO;
            _disabledScrollPanGesture.enabled = YES;
            _disabledScrollPanGesture = nil;
            if (_resolvedHeights.count == 0) {
                break;
            }
            CGFloat velocity = [pan velocityInView:self.view].y;
            [self settleAfterDragWithVelocity:velocity];
            break;
        }
        default:
            break;
    }
}

- (void)settleAfterDragWithVelocity:(CGFloat)velocity
{
    CGFloat top = CGRectGetMinY(_sheetView.frame);
    BOOL inDismissZone = top > [self smallestDetentTop] + RNSFormSheetDismissZone;
    BOOL fastDownwardFromSmallest = _currentDetentIndex == 0 && velocity > 1200.0;

    if (inDismissZone || fastDownwardFromSmallest) {
        if ([self isPullDownDismissPrevented]) {
            [self.component emitOnNativeDismissPreventedWithChannel:@"drag"];
            [self setDetentIndex:0 animated:YES];
            return;
        }
        [self performNativeDismiss];
        return;
    }

    NSInteger target = [self targetDetentIndexForTop:top velocity:velocity];
    [self setDetentIndex:target animated:YES];
}

- (NSInteger)targetDetentIndexForTop:(CGFloat)top velocity:(CGFloat)velocity
{
    NSInteger count = (NSInteger)_resolvedHeights.count;
    if (count <= 1) {
        return 0;
    }
    if (velocity == 0) {
        return [self nearestDetentIndexForTop:top];
    }

    CGFloat availableHeight = CGRectGetHeight(self.view.bounds);
    CGFloat (^detentTop)(NSInteger) = ^CGFloat(NSInteger index) {
        return availableHeight - self->_resolvedHeights[index].doubleValue;
    };

    // Detent indices sorted by top ascending (largest detent first).
    NSMutableArray<NSNumber *> *sorted = [NSMutableArray arrayWithCapacity:count];
    for (NSInteger i = count - 1; i >= 0; i--) {
        [sorted addObject:@(i)];
    }
    NSInteger (^indexAt)(NSInteger) = ^NSInteger(NSInteger position) {
        return sorted[position].integerValue;
    };
    NSInteger (^nextIndex)(NSInteger) = ^NSInteger(NSInteger idx) {
        NSUInteger position = [sorted indexOfObject:@(idx)];
        return (position != NSNotFound && position + 1 < sorted.count) ? sorted[position + 1].integerValue : idx;
    };
    NSInteger (^preIndex)(NSInteger) = ^NSInteger(NSInteger idx) {
        NSUInteger position = [sorted indexOfObject:@(idx)];
        return (position != NSNotFound && position > 0) ? sorted[position - 1].integerValue : idx;
    };

    BOOL forward = velocity > 0; // moving down (toward smaller detents)

    // Locate the adjacent detent pair around the release position. Boundary
    // handling is direction-aware (mirrors FloatingPanel's segment(at:forward:)):
    // a release exactly on a detent moves toward the next detent in the travel
    // direction instead of being stuck on the resting detent.
    NSInteger upperPosition = NSNotFound;
    for (NSInteger position = 0; position < count; position++) {
        CGFloat detent = detentTop(indexAt(position));
        if (forward ? (top < detent) : (top <= detent)) {
            upperPosition = position;
            break;
        }
    }

    NSInteger lowerIndex;
    NSInteger upperIndex;
    if (upperPosition == NSNotFound) {
        lowerIndex = upperIndex = indexAt(count - 1);
    } else if (upperPosition == 0) {
        lowerIndex = upperIndex = indexAt(0);
    } else {
        lowerIndex = indexAt(upperPosition - 1);
        upperIndex = indexAt(upperPosition);
    }

    if (lowerIndex == upperIndex) {
        if (forward) {
            upperIndex = nextIndex(upperIndex);
        } else {
            lowerIndex = preIndex(lowerIndex);
        }
    }

    NSInteger fromIndex = forward ? lowerIndex : upperIndex;
    NSInteger toIndex = forward ? upperIndex : lowerIndex;

    // Project the release with the WWDC18 momentum model, trimmed to the
    // release segment so a single gesture moves at most ONE detent.
    CGFloat projected = top + [self projectedOffsetForVelocity:velocity];
    CGFloat fromTop = detentTop(fromIndex);
    CGFloat toTop = detentTop(toIndex);
    CGFloat minTop = MIN(fromTop, toTop);
    CGFloat maxTop = MAX(fromTop, toTop);
    CGFloat clamped = MAX(MIN(projected, maxTop), minTop);
    CGFloat progress = (maxTop == minTop) ? 1.0 : std::fabs(clamped - fromTop) / std::fabs(toTop - fromTop);
    return progress > 0.5 ? toIndex : fromIndex;
}

- (NSInteger)nearestDetentIndexForTop:(CGFloat)top
{
    NSInteger count = (NSInteger)_resolvedHeights.count;
    CGFloat availableHeight = CGRectGetHeight(self.view.bounds);
    NSInteger target = 0;
    CGFloat bestDistance = CGFLOAT_MAX;
    for (NSInteger i = 0; i < count; i++) {
        CGFloat detentTop = availableHeight - _resolvedHeights[i].doubleValue;
        CGFloat distance = std::fabs(top - detentTop);
        if (distance < bestDistance) {
            bestDistance = distance;
            target = i;
        }
    }
    return target;
}

- (CGFloat)projectedOffsetForVelocity:(CGFloat)velocity
{
    // Distance travelled while decelerating from `velocity` at UIScrollView's
    // normal deceleration rate (WWDC18 "Designing Fluid Interfaces").
    static const CGFloat kDecelerationRate = 0.998;
    return (velocity / 1000.0) * kDecelerationRate / (1.0 - kDecelerationRate);
}

- (void)requestUserDismiss
{
    if ([self.component isDismissPreventedForChannel:@"backdrop"]) {
        [self.component emitOnNativeDismissPreventedWithChannel:@"backdrop"];
        return;
    }
    [self performNativeDismiss];
}

- (void)performNativeDismiss
{
    [self.component formSheetWasNativelyDismissed];
    [self dismissSheetWithCompletion:^{
        [self.component formSheetDidDisappear];
    }];
}

- (BOOL)isPullDownDismissPrevented
{
    return [self.component isDismissPreventedForChannel:@"drag"];
}

- (BOOL)isPullDownDismissRigid
{
    return [self isPullDownDismissPrevented] && self.component.preventNativeDismissDragFeedback;
}

- (void)dismissSheetWithCompletion:(void (^)(void))completion
{
    [UIView animateWithDuration:RNSFormSheetAnimationDuration
                          delay:0
                        options:UIViewAnimationOptionCurveEaseInOut
                     animations:^{
        CGRect frame = self->_sheetView.frame;
        frame.origin.y = CGRectGetHeight(self.view.bounds);
        self->_sheetView.frame = frame;
        self->_dimmingView.alpha = 0;
    } completion:^(BOOL finished) {
        [self dismissViewControllerAnimated:NO completion:completion];
    }];
}

- (void)handleBackdropTap:(UITapGestureRecognizer *)tap
{
    if (tap.state == UIGestureRecognizerStateRecognized) {
        [self requestUserDismiss];
    }
}

#pragma mark - Scroll coordination

- (UIScrollView *)scrollViewAtPoint:(CGPoint)pointInSheet
{
    CGPoint pointInContent = [_sheetView convertPoint:pointInSheet toView:_contentView];
    UIView *target = [_contentView hitTest:pointInContent withEvent:nil];
    if (!target) {
        return nil;
    }
    UIView *view = target;
    while (view) {
        if ([view isKindOfClass:UIScrollView.class]) {
            return (UIScrollView *)view;
        }
        view = view.superview;
    }
    return nil;
}

- (UIGestureRecognizer *)scrollPanGestureAtPoint:(CGPoint)pointInSheet
{
    UIScrollView *scroll = [self scrollViewAtPoint:pointInSheet];
    if (scroll && [self isScrollViewAtTop:scroll]) {
        return scroll.panGestureRecognizer;
    }
    return nil;
}

- (BOOL)isScrollViewAtTop:(UIScrollView *)scroll
{
    UIEdgeInsets contentInset = scroll.contentInset;
    if (@available(iOS 11.0, *)) {
        contentInset = scroll.adjustedContentInset;
    }
    return scroll.contentOffset.y <= -contentInset.top + 1.0;
}

#pragma mark - UIGestureRecognizerDelegate

- (BOOL)gestureRecognizer:(UIGestureRecognizer *)gestureRecognizer
    shouldReceiveTouch:(UITouch *)touch
{
    if (gestureRecognizer == _backdropTapGesture) {
        // Only treat taps outside the sheet as backdrop taps, so content inside
        // the sheet keeps its own interaction.
        CGPoint point = [touch locationInView:self.view];
        return !CGRectContainsPoint(_sheetView.frame, point);
    }
    return YES;
}

- (BOOL)gestureRecognizerShouldBegin:(UIGestureRecognizer *)gestureRecognizer
{
    if (gestureRecognizer != _panGesture) {
        return YES;
    }
    CGPoint point = [gestureRecognizer locationInView:_sheetView];
    UIScrollView *scroll = [self scrollViewAtPoint:point];
    if (!scroll) {
        return YES;
    }
    if (scroll.isTracking || scroll.isDragging) {
        return NO;
    }
    if (!self.component.prefersScrollingExpandsWhenScrolledToEdge) {
        return NO;
    }
    return [self isScrollViewAtTop:scroll];
}

#pragma mark - UIViewControllerTransitioningDelegate

- (id<UIViewControllerAnimatedTransitioning>)
    animationControllerForPresentedController:(UIViewController *)presented
                         presentingController:(UIViewController *)presenting
                             sourceController:(UIViewController *)source
{
    return [[RNSFormSheetPresentAnimator alloc] initWithDimmingView:_dimmingView
                                                          sheetView:_sheetView];
}

#pragma mark - Helpers

- (CGFloat)largestDetentTop
{
    CGFloat availableHeight = CGRectGetHeight(self.view.bounds);
    return availableHeight - _resolvedHeights.lastObject.doubleValue;
}

- (CGFloat)smallestDetentTop
{
    CGFloat availableHeight = CGRectGetHeight(self.view.bounds);
    return availableHeight - _resolvedHeights.firstObject.doubleValue;
}

- (NSArray<NSNumber *> *)validatedDetents:(NSArray *)detents
{
    if (detents.count == 0) {
        return @[];
    }
    if (detents.count == 1 && [detents.firstObject isKindOfClass:NSNumber.class]
        && [detents.firstObject doubleValue] == RNSFormSheetFitToContents) {
        return detents;
    }

    BOOL valid = YES;
    double previous = -1;
    for (id value in detents) {
        if (![value isKindOfClass:NSNumber.class]) {
            valid = NO;
            break;
        }
        double fraction = [value doubleValue];
        if (!std::isfinite(fraction) || fraction < 0 || fraction > 1 || fraction <= previous) {
            valid = NO;
            break;
        }
        previous = fraction;
    }

    if (!valid) {
        NSLog(@"[RNScreens] Invalid FormSheet detents %@. Falling back to the large detent.", detents);
        return @[];
    }
    return detents;
}

#pragma mark - Lifecycle events

- (void)viewWillAppear:(BOOL)animated
{
    [super viewWillAppear:animated];
    [self.component emitOnWillAppear];
}

- (void)viewDidAppear:(BOOL)animated
{
    [super viewDidAppear:animated];
    [self.component emitOnDidAppear];
}

- (void)viewWillDisappear:(BOOL)animated
{
    [super viewWillDisappear:animated];
    [self.component emitOnWillDisappear];
}

- (void)viewDidDisappear:(BOOL)animated
{
    [super viewDidDisappear:animated];
    [self.component formSheetDidDisappear];
    [self.component emitOnDidDisappear];
}

@end
