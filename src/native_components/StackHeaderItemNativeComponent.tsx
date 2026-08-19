import React from 'react';
import type { ReactElement } from '@lynx-js/react';
import type { StackHeaderMenu } from '../types/StackHeaderConfig.js';

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
  menu?: StackHeaderMenu | undefined;
};

export const StackHeaderItemNativeComponent = ({
  placement,
  label,
  render,
  menu,
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
      menu={menu}
    >
      {render?.()}
    </ls-stack-header-item>
  );
};
