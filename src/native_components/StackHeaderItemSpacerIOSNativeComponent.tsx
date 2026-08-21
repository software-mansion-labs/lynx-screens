import React from 'react';
import type { StackHeaderItemPlacement } from './StackHeaderItemIOSNativeComponent.js';

export type StackHeaderItemSpacerPlacement = Extract<
  StackHeaderItemPlacement,
  'leading' | 'trailing'
>;

export type StackHeaderItemSpacerProps = {
  placement: StackHeaderItemSpacerPlacement;
  sizing?: 'fixed' | 'flexible' | undefined;
  width?: number | undefined;
};

export const StackHeaderItemSpacerIOSNativeComponent = (
  props: StackHeaderItemSpacerProps,
) => {
  return (
    <ls-stack-header-item-spacer-ios
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
      }}
      {...props}
    />
  );
};
