#import <Lynx/LynxUIView.h>
#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

@class BaseTransferUI;

/** Native receiver that hosts Lynx child views outside their original view hierarchy. */
@interface BaseTransferReceiverView : UIView

/** The transfer UI whose Lynx subtree is hosted by this receiver. */
@property (nonatomic, weak, readonly) BaseTransferUI *transfer;

- (instancetype)initWithTransfer:(BaseTransferUI *)transfer;

@end

/** Base Lynx UI for native components that render their children in another native hierarchy. */
@interface BaseTransferUI : LynxUIView

/** Receiver containing the transferred Lynx child views. */
@property (nonatomic, strong, readonly) BaseTransferReceiverView *transferReceiver;

/** Override to provide a specialized receiver view. */
- (BaseTransferReceiverView *)createTransferReceiver;

@end

NS_ASSUME_NONNULL_END
