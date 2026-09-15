import React from 'react';
import { useScreenTrace } from '../internal/trace/bridge.js';
import * as Lynx from '@lynx-js/types';
import type {
  OnDismissEventPayload,
  StackScreenProps,
} from '../types/StackScreen.js';

export const StackScreenNativeComponent = ({
  children,
  internalTrace,
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
  const trace = useScreenTrace(internalTrace);
  const onDismissWrapper = React.useCallback(
    (event: Lynx.BaseEventOrig<OnDismissEventPayload>) => {
      if (event.detail.isNativeDismiss) {
        onNativeDismiss?.(screenKey, trace.context(event, 'onNativeDismiss'));
      } else {
        onDismiss?.(screenKey, trace.context(event, 'onDismiss'));
      }
    },
    [onDismiss, onNativeDismiss, screenKey, trace],
  );

  return (
    <ls-stack-screen
      traceSession={trace.props.traceSession}
      contentTraceContext={trace.props.contentTraceContext}
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
      bindOnWillAppear={trace.forward('onWillAppear', onWillAppear)}
      bindOnDidAppear={trace.forward('onDidAppear', onDidAppear)}
      bindOnWillDisappear={trace.forward('onWillDisappear', onWillDisappear)}
      bindOnDidDisappear={trace.forward('onDidDisappear', onDidDisappear)}
      bindOnDismiss={onDismissWrapper}
      bindOnNativeDismissPrevented={trace.forward(
        'onNativeDismissPrevented',
        onNativeDismissPrevented,
      )}
      // Configuration
      preventNativeDismiss={preventNativeDismiss}
    >
      {children}
    </ls-stack-screen>
  );
};
