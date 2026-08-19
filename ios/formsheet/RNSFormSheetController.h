#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

@class RNSFormSheetComponent;

/**
 * Presents the FormSheet content in a custom, fully controlled sheet.
 *
 * This deliberately does NOT use UISheetPresentationController: since iOS 26
 * the system applies a `scale(0.961)` transform to the sheet's presentation
 * wrapper at every non-large detent, leaving ~8pt margins on both sides with
 * no public API to disable it. Instead we present an over-full-screen modal and
 * draw the dimming backdrop, rounded sheet container, grabber, detents and the
 * drag interaction ourselves.
 */
@interface RNSFormSheetController : UIViewController <UIGestureRecognizerDelegate, UIViewControllerTransitioningDelegate>

@property (nonatomic, weak) RNSFormSheetComponent *component;

- (instancetype)initWithComponent:(RNSFormSheetComponent *)component
                      contentView:(UIView *)contentView;

/// Re-applies appearance and detent configuration. When `applyInitialDetent`
/// is set the requested initial/selected detent is applied (otherwise only an
/// explicitly controlled selectedDetentIndex is honored).
- (void)applyConfigurationApplyingInitialDetent:(BOOL)applyInitialDetent;

/// Re-resolves detent heights and reapplies the current sheet frame. Called on
/// layout changes (e.g. content growth for fitToContents detents).
- (void)invalidateDetents;

/// Dismisses with a custom animation (backdrop fades out, sheet slides down),
/// then removes the controller. Used for both user-initiated and programmatic
/// dismissal so the backdrop never slides with the sheet.
- (void)dismissSheetWithCompletion:(void (^)(void))completion;

@end

NS_ASSUME_NONNULL_END
