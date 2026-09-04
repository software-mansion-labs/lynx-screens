#pragma once

#import <Lynx/LynxUI.h>
#import "RNSFormSheetContentWrapperDelegate.h"

NS_ASSUME_NONNULL_BEGIN

@interface RNSFormSheetContentWrapperComponent : LynxUI <UIView *>

@property (nonatomic, weak, nullable) id<RNSFormSheetContentWrapperDelegate> delegate;

@end

NS_ASSUME_NONNULL_END
