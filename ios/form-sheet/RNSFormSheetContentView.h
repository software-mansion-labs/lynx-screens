#pragma once

#import <UIKit/UIKit.h>

@class LynxEventHandler;
@class LynxUI;

NS_ASSUME_NONNULL_BEGIN

@interface RNSFormSheetContentView : UIView

// Adaptation: the modal hierarchy needs a secondary Lynx event handler because
// it is outside the page root view that owns the primary handler.
@property (nonatomic, weak, nullable) LynxEventHandler *eventHandler;
@property (nonatomic, weak, nullable) LynxUI *lynxRootUI;

- (void)insertReactSubview:(UIView *)subview atIndex:(NSInteger)index;
- (void)removeReactSubview:(UIView *)subview;

@end

NS_ASSUME_NONNULL_END
