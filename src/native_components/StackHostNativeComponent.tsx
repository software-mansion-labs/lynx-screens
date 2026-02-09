import React from 'react';
import * as Lynx from '@lynx-js/types';

export const StackHostNativeComponent = ({ children }: Lynx.ViewProps) => {
  return (
    <stack-host-native
      style={{
        display: 'flex',
        flex: 1,
        width: '100%',
        height: '100%',
      }}
    >
      {children}
    </stack-host-native>
  );
};
