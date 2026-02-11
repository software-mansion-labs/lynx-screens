import React from 'react';
import * as Lynx from '@lynx-js/types';
import type {
  OnDismissEventPayload,
  StackScreenProps,
} from '../types/StackContainer.js';

export const StackScreenNativeComponent = ({
  children,
  // Control
  activityMode,
  screenKey,
  // Events
  onWillAppear,
  onDidAppear,
  onWillDisappear,
  onDidDisappear,
  onDismiss,
  onNativeDismiss,
  onNativeDismissPrevented,
  // Configuration
  preventNativeDismiss,
}: StackScreenProps) => {
  const onDismissWrapper = React.useCallback(
    (event: Lynx.BaseEventOrig<OnDismissEventPayload>) => {
      if (event.detail.isNativeDismiss) {
        console.log('isNativeDismiss');
        onNativeDismiss?.(screenKey);
      } else {
        console.log('isDismiss');
        onDismiss?.(screenKey);
      }
    },
    [onDismiss, onNativeDismiss, screenKey],
  );

  return (
    <stack-screen-native
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
      }}
      // Control
      activityMode={activityMode}
      screenKey={screenKey}
      // Events
      bindOnWillAppear={onWillAppear}
      bindOnDidAppear={onDidAppear}
      bindOnWillDisappear={onWillDisappear}
      bindOnDidDisappear={onDidDisappear}
      bindOnDismiss={onDismissWrapper}
      bindOnNativeDismissPrevented={onNativeDismissPrevented}
      // Configuration
      preventNativeDismiss={preventNativeDismiss}
    >
      {children}
    </stack-screen-native>
  );
};
