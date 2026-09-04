#pragma once

#import <UIKit/UIKit.h>

@class RNSFormSheetContentWrapperComponent;

NS_ASSUME_NONNULL_BEGIN

@protocol RNSFormSheetContentWrapperDelegate <NSObject>

- (void)contentWrapper:(RNSFormSheetContentWrapperComponent *)wrapper didChangeContentsHeight:(CGFloat)height;

@end

NS_ASSUME_NONNULL_END
