#pragma once

#import <Foundation/Foundation.h>
#import "RNSFormSheetProviders.h"

@class RNSFormSheetContentController;

NS_ASSUME_NONNULL_BEGIN

@interface RNSFormSheetPresentationManager : NSObject

- (void)updatePresentationIfNeededWithProvider:(id<RNSFormSheetPresentationProvider>)provider
                                    controller:(RNSFormSheetContentController *)controller;
- (BOOL)handleNativeDismiss;

@end

NS_ASSUME_NONNULL_END
