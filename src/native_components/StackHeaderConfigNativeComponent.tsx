import React from 'react';
import type {
  PlatformIconAndroid,
  StackHeaderConfigProps,
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
    ...filteredAndroidProps
  } = android ?? {};

  const backButtonIconProps = parseBackButtonIconToNativeProps(backButtonIcon);

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
