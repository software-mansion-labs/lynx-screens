import React from 'react';
import type { StackHeaderSubviewProps } from '../types/StackHeaderConfig.js';

export const StackHeaderSubviewNativeComponent = ({
  children,
  type,
  collapseMode,
}: StackHeaderSubviewProps) => {
  return (
    <ls-stack-header-subview
      style={
        type === 'background'
          ? {
              position: 'absolute',
              left: 0,
              top: 0,
              width: '100%',
              height: '100%',
            }
          : {
              position: 'absolute',
              left: 0,
              top: 0,
            }
      }
      type={type}
      collapseMode={collapseMode}
    >
      {children}
    </ls-stack-header-subview>
  );
};
