import React from 'react';
import type {
  PlatformIconAndroid,
  StackHeaderConfigProps,
  StackHeaderConfigPropsAndroid,
  StackHeaderTypeAndroid,
} from '../types/StackHeaderConfig.js';
import { StackHeaderSubviewNativeComponent } from './StackHeaderSubviewNativeComponent.js';

export const StackHeaderConfigNativeComponent = (
  props: StackHeaderConfigProps,
) => {
  // ios props are safely dropped
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { android, ios, ...baseProps } = props;

  const {
    backgroundSubview,
    leadingSubview,
    centerSubview,
    trailingSubview,
    backButtonIcon,
    scrollFlagScroll,
    scrollFlagEnterAlways,
    scrollFlagEnterAlwaysCollapsed,
    scrollFlagExitUntilCollapsed,
    scrollFlagSnap,
    ...filteredAndroidProps
  } = android ?? {};

  const backButtonIconProps = parseBackButtonIconToNativeProps(backButtonIcon);
  const scrollFlagProps = resolveScrollFlags(filteredAndroidProps.type, {
    scrollFlagScroll,
    scrollFlagEnterAlways,
    scrollFlagEnterAlwaysCollapsed,
    scrollFlagExitUntilCollapsed,
    scrollFlagSnap,
  });

  return (
    <stack-header-config-native
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
      }}
      {...baseProps}
      {...filteredAndroidProps}
      {...backButtonIconProps}
      {...scrollFlagProps}
      hasBackgroundSubview={backgroundSubview != null}
    >
      {/*
        Please note that the order of the subviews MUST match
        the order in native StackHeaderConfigComponent.getConfigSubviewAt.
        */}
      {backgroundSubview && (
        <StackHeaderSubviewNativeComponent
          type="background"
          collapseMode={backgroundSubview.collapseMode}
        >
          {backgroundSubview.Component}
        </StackHeaderSubviewNativeComponent>
      )}
      {leadingSubview && (
        <StackHeaderSubviewNativeComponent type="leading">
          {leadingSubview.Component}
        </StackHeaderSubviewNativeComponent>
      )}
      {centerSubview && (
        <StackHeaderSubviewNativeComponent type="center">
          {centerSubview.Component}
        </StackHeaderSubviewNativeComponent>
      )}
      {trailingSubview && (
        <StackHeaderSubviewNativeComponent type="trailing">
          {trailingSubview.Component}
        </StackHeaderSubviewNativeComponent>
      )}
    </stack-header-config-native>
  );
};

function parseBackButtonIconToNativeProps(
  icon: PlatformIconAndroid | undefined,
): {
  backButtonImageIconUri?: string | undefined;
  backButtonDrawableIconResourceName?: string | undefined;
} {
  if (!icon) {
    return {};
  }

  if (icon.type === 'imageSource') {
    return {
      backButtonImageIconUri: icon.uri,
    };
  } else if (icon.type === 'drawableResource') {
    return {
      backButtonDrawableIconResourceName: icon.name,
    };
  } else {
    throw new Error(
      '[RNScreens] Incorrect icon format for Android. You must provide `imageSource` or `drawableResource`.',
    );
  }
}

type ScrollFlagFields = {
  scrollFlagScroll: boolean;
  scrollFlagEnterAlways: boolean;
  scrollFlagEnterAlwaysCollapsed: boolean;
  scrollFlagExitUntilCollapsed: boolean;
  scrollFlagSnap: boolean;
};

const SCROLL_FLAG_DEFAULTS_BY_TYPE: Record<
  StackHeaderTypeAndroid,
  ScrollFlagFields
> = {
  small: {
    scrollFlagScroll: false,
    scrollFlagEnterAlways: false,
    scrollFlagEnterAlwaysCollapsed: false,
    scrollFlagExitUntilCollapsed: false,
    scrollFlagSnap: false,
  },
  medium: {
    scrollFlagScroll: true,
    scrollFlagEnterAlways: false,
    scrollFlagEnterAlwaysCollapsed: false,
    scrollFlagExitUntilCollapsed: true,
    scrollFlagSnap: true,
  },
  large: {
    scrollFlagScroll: true,
    scrollFlagEnterAlways: false,
    scrollFlagEnterAlwaysCollapsed: false,
    scrollFlagExitUntilCollapsed: true,
    scrollFlagSnap: true,
  },
};

function resolveScrollFlags(
  type: StackHeaderTypeAndroid | undefined,
  overrides: Pick<StackHeaderConfigPropsAndroid, keyof ScrollFlagFields>,
): ScrollFlagFields {
  const defaults = SCROLL_FLAG_DEFAULTS_BY_TYPE[type ?? 'small'];
  return {
    scrollFlagScroll: overrides.scrollFlagScroll ?? defaults.scrollFlagScroll,
    scrollFlagEnterAlways:
      overrides.scrollFlagEnterAlways ?? defaults.scrollFlagEnterAlways,
    scrollFlagEnterAlwaysCollapsed:
      overrides.scrollFlagEnterAlwaysCollapsed ??
      defaults.scrollFlagEnterAlwaysCollapsed,
    scrollFlagExitUntilCollapsed:
      overrides.scrollFlagExitUntilCollapsed ??
      defaults.scrollFlagExitUntilCollapsed,
    scrollFlagSnap: overrides.scrollFlagSnap ?? defaults.scrollFlagSnap,
  };
}
