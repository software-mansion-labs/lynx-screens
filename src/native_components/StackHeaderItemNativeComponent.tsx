import React from 'react';
import type { ReactElement } from '@lynx-js/react';

export type StackHeaderItemPlacement =
  | 'leading'
  | 'trailing'
  | 'title'
  | 'subtitle'
  | 'largeSubtitle';

export type StackHeaderItemProps = {
  placement: StackHeaderItemPlacement;
  label?: string | undefined;
  render?: (() => ReactElement) | undefined;
};

export const StackHeaderItemNativeComponent = ({
  placement,
  label,
  render,
}: StackHeaderItemProps) => {
  return (
    <ls-stack-header-item
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
      }}
      placement={placement}
      label={label}
    >
      {render?.()}
    </ls-stack-header-item>
  );
};
