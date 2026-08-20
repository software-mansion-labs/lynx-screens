#pragma once

#import <Lynx/LynxUI.h>
#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

@class RNSScrollViewMarkerComponent;

/**
 * The marker's painting view; forwards window moves to the component, which
 * drives the attach-driven scroll view registration (counterpart of RNS's
 * willMoveToWindow/didMoveToWindow overrides on the component view).
 */
@interface RNSScrollViewMarkerView : UIView

@property (nonatomic, weak, nullable) RNSScrollViewMarkerComponent *component;

@end

/**
 * Counterpart of RNS RNSScrollViewMarkerComponentView. Adaptation: only the
 * scroll-view registration core is ported - the iOS-only scroll edge effect
 * subsystem belongs to later commits of the ScrollViewMarker epic and is not
 * ported.
 */
@interface RNSScrollViewMarkerComponent : LynxUI <RNSScrollViewMarkerView *>

- (void)viewWillMoveToWindow:(nullable UIWindow *)newWindow;

- (void)viewDidMoveToWindow;

@end

NS_ASSUME_NONNULL_END
