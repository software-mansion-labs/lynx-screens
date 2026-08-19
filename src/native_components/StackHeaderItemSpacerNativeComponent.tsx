import React from 'react';
import type { StackHeaderItemPlacement } from './StackHeaderItemNativeComponent.js';

export type StackHeaderItemSpacerPlacement = Extract<
  StackHeaderItemPlacement,
  'leading' | 'trailing'
>;

export type StackHeaderItemSpacerProps = {
  placement: StackHeaderItemSpacerPlacement;
  sizing?: 'fixed' | 'flexible' | undefined;
  width?: number | undefined;
};

export const StackHeaderItemSpacerNativeComponent = (
  props: StackHeaderItemSpacerProps,
) => {
  return (
    <ls-stack-header-item-spacer
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
      }}
      {...props}
    />
  );
};
