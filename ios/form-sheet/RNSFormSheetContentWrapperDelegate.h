#pragma once

#import <UIKit/UIKit.h>

// Adaptation: the Lynx wrapper component replaces the upstream Fabric component view.
@class RNSFormSheetContentWrapperComponent;

NS_ASSUME_NONNULL_BEGIN

@protocol RNSFormSheetContentWrapperDelegate <NSObject>

- (void)contentWrapper:(RNSFormSheetContentWrapperComponent *)wrapper
    didChangeReactContentsHeight:(CGFloat)reactContentsHeight;

@end

NS_ASSUME_NONNULL_END
