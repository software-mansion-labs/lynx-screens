import type { StackHeaderConfigProps } from './StackHeaderConfig.types.js';
import { StackHeaderConfigAndroid } from './StackHeaderConfig.android.js';
import { StackHeaderConfigIOS } from './StackHeaderConfig.ios.js';

// RNS splits the header config into platform files resolved at build time; a
// Lynx bundle serves both platforms, so the split happens at runtime instead.
// `ref` is a regular prop (ReactLynx runs on Preact 11), as in RNS on React 19;
// the platform components keep receiving it as `forwardedRef`.
export const StackHeaderConfig = (props: StackHeaderConfigProps) => {
  const { ref: forwardedRef, ...restProps } = props;

  return SystemInfo.platform === 'iOS' ? (
    <StackHeaderConfigIOS {...restProps} forwardedRef={forwardedRef} />
  ) : (
    <StackHeaderConfigAndroid {...restProps} forwardedRef={forwardedRef} />
  );
};
