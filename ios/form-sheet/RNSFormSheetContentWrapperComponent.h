#pragma once

#import "RNSFormSheetContentWrapperDelegate.h"
#import <Lynx/LynxUI.h>

NS_ASSUME_NONNULL_BEGIN

// Adaptation: LynxUI is the Lynx counterpart of the upstream RNSReactBaseView.
@interface RNSFormSheetContentWrapperComponent : LynxUI <UIView *>

@property (nonatomic, weak, nullable) id<RNSFormSheetContentWrapperDelegate> delegate;

@end

NS_ASSUME_NONNULL_END
