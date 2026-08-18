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
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface StackHeaderConfigPropsIOS {}

export interface StackHeaderConfigPropsBase {
  title?: string | undefined;
  hidden?: boolean | undefined;
  transparent?: boolean | undefined;
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
