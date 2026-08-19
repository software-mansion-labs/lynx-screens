#pragma once

#pragma mark - SDK availability utility

// Counterpart of RNS ios/utils/RNSDefines.h (only the bits needed by the
// header implementation are ported).
#define RNS_IPHONE_OS_VERSION_AVAILABLE(v)                              \
  (defined(__IPHONE_OS_VERSION_MAX_ALLOWED) && defined(__IPHONE_##v) && \
   __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_##v)
