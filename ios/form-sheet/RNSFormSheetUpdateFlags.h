#pragma once

#import <Foundation/Foundation.h>

typedef NS_OPTIONS(NSUInteger, RNSFormSheetUpdateFlags) {
  RNSFormSheetUpdateFlagsNone = 0,
  RNSFormSheetUpdateFlagsPresentation = 1 << 0,
  RNSFormSheetUpdateFlagsAppearance = 1 << 1,
  RNSFormSheetUpdateFlagsBehavior = 1 << 2,
  RNSFormSheetUpdateFlagsInitialDetent = 1 << 3,
};
