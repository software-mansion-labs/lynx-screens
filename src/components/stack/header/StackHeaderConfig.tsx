import { forwardRef, type Ref } from '@lynx-js/react';
import type {
  StackHeaderConfigProps,
  StackHeaderConfigRef,
} from './StackHeaderConfig.types.js';
import { StackHeaderConfigAndroid } from './StackHeaderConfig.android.js';
import { StackHeaderConfigIOS } from './StackHeaderConfig.ios.js';

// RNS splits the header config into platform files resolved at build time; a
// Lynx bundle serves both platforms, so the split happens at runtime instead.
const StackHeaderConfigInner = (
  props: StackHeaderConfigProps,
  forwardedRef: Ref<StackHeaderConfigRef>,
) =>
  SystemInfo.platform === 'iOS' ? (
    <StackHeaderConfigIOS {...props} forwardedRef={forwardedRef} />
  ) : (
    <StackHeaderConfigAndroid {...props} forwardedRef={forwardedRef} />
  );

export const StackHeaderConfig = forwardRef<
  StackHeaderConfigRef,
  StackHeaderConfigProps
>(StackHeaderConfigInner);
