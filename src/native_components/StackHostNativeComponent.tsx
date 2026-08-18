import React from 'react';
import * as Lynx from '@lynx-js/types';

export const StackHostNativeComponent = ({ children }: Lynx.ViewProps) => {
  return (
    <ls-stack-host
      style={{
        display: 'flex',
        flex: 1,
        width: '100%',
        height: '100%',
      }}
    >
      {children}
    </ls-stack-host>
  );
};
