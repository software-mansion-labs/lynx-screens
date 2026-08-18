import type { ReactNode } from '@lynx-js/react';

// copied from react-native-screens/src/components/gamma/stack/header/*.types.ts

export type StackHeaderTypeAndroid = 'small' | 'medium' | 'large';

export type StackHeaderSubviewTypeAndroid =
  | 'background'
  | 'leading'
  | 'center'
  | 'trailing';

export type StackHeaderSubviewCollapseModeAndroid = 'off' | 'parallax';

export type StackHeaderBackgroundSubviewCollapseModeAndroid =
  StackHeaderSubviewCollapseModeAndroid;

// RNS resolves RN assets via Image.resolveAssetSource; on Lynx images are
// referenced by plain URI strings (bundler-emitted URLs, remote URLs or
// android_asset paths).
export type PlatformIconShared = {
  type: 'imageSource';
  uri: string;
};

export type PlatformIconAndroid =
  | {
      type: 'drawableResource';
      name: string;
    }
  | PlatformIconShared;

export interface StackHeaderToolbarSubviewAndroid {
  Component: ReactNode;
}

export interface StackHeaderBackgroundSubviewAndroid {
  collapseMode?: StackHeaderSubviewCollapseModeAndroid | undefined;
  Component: ReactNode;
}

export interface StackHeaderConfigPropsAndroid {
  type?: StackHeaderTypeAndroid | undefined;
  backgroundSubview?: StackHeaderBackgroundSubviewAndroid | undefined;
  leadingSubview?: StackHeaderToolbarSubviewAndroid | undefined;
  centerSubview?: StackHeaderToolbarSubviewAndroid | undefined;
  trailingSubview?: StackHeaderToolbarSubviewAndroid | undefined;
  /**
   * Tint color for the back button icon.
   * - `undefined` — use default tint (for custom images, no tint is applied)
   * - CSS color string — apply a custom tint color
   */
  backButtonTintColor?: string | undefined;
  /**
   * Custom icon for the back button.
   * - `undefined` — use the native default back arrow
   * - `PlatformIconAndroid` — use a custom icon (drawableResource or imageSource)
   */
  backButtonIcon?: PlatformIconAndroid | undefined;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface StackHeaderConfigPropsIOS {}

export interface StackHeaderConfigPropsBase {
  title?: string | undefined;
  hidden?: boolean | undefined;
  transparent?: boolean | undefined;
  backButtonHidden?: boolean | undefined;
}

export interface StackHeaderConfigProps extends StackHeaderConfigPropsBase {
  android?: StackHeaderConfigPropsAndroid | undefined;
  ios?: StackHeaderConfigPropsIOS | undefined;
}

export type StackHeaderSubviewProps = {
  children?: ReactNode | undefined;

  type?: StackHeaderSubviewTypeAndroid | undefined;
  collapseMode?: StackHeaderSubviewCollapseModeAndroid | undefined;
};
