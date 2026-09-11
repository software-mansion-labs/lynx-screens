import React from 'react';
import { useScreenTrace } from '../internal/trace/bridge.js';
import type * as Lynx from '@lynx-js/types';
import type { FormSheetProps } from '../types/FormSheet.js';
import {
  resolveInitialDetentIndex,
  resolveLargestUndimmedDetentIndex,
  resolveNativeCornerRadius,
  resolveNativeDetents,
} from '../utils/FormSheetUtils.js';

type DetentChangedEventPayload = Readonly<{
  index: number;
}>;

export const FormSheetNativeComponent = ({
  children,
  internalTrace,
  traceScreenKey,
  detents,
  initialDetentIndex,
  largestUndimmedDetentIndex,
  preferredCornerRadius,
  nativeContainerStyle,
  onWillAppear,
  onDidAppear,
  onWillDisappear,
  onDidDisappear,
  onDismiss,
  onNativeDismiss,
  onNativeDismissPrevented,
  onDetentChanged,
  ...rest
}: FormSheetProps) => {
  const trace = useScreenTrace(internalTrace);
  const nativeDetents = resolveNativeDetents(detents);
  const detentsCount = nativeDetents?.length ?? 0;

  const onDetentChangedEvent = React.useCallback(
    (event: Lynx.BaseEventOrig<DetentChangedEventPayload>) => {
      onDetentChanged?.(event.detail.index);
    },
    [onDetentChanged],
  );

  return (
    <ls-form-sheet
      traceScreenKey={
        traceScreenKey ?? internalTrace?.content?.identity.screenKey
      }
      traceSession={trace.props.traceSession}
      contentTraceContext={trace.props.contentTraceContext}
      style={{ position: 'absolute', top: 0, left: 0 }}
      detents={nativeDetents}
      initialDetentIndex={resolveInitialDetentIndex(
        initialDetentIndex,
        detentsCount,
      )}
      largestUndimmedDetentIndex={resolveLargestUndimmedDetentIndex(
        largestUndimmedDetentIndex,
        detentsCount,
      )}
      preferredCornerRadius={resolveNativeCornerRadius(preferredCornerRadius)}
      nativeContainerBackgroundColor={nativeContainerStyle?.backgroundColor}
      bindOnWillAppear={trace.forward('onWillAppear', onWillAppear)}
      bindOnDidAppear={trace.forward('onDidAppear', onDidAppear)}
      bindOnWillDisappear={trace.forward('onWillDisappear', onWillDisappear)}
      bindOnDidDisappear={trace.forward('onDidDisappear', onDidDisappear)}
      bindOnDismiss={(event) => onDismiss?.(trace.context(event, 'onDismiss'))}
      bindOnNativeDismiss={(event) =>
        onNativeDismiss?.(trace.context(event, 'onNativeDismiss'))
      }
      bindOnNativeDismissPrevented={trace.forward(
        'onNativeDismissPrevented',
        onNativeDismissPrevented,
      )}
      bindOnDetentChanged={onDetentChangedEvent}
      {...rest}
    >
      {detents === 'fitToContents' ? (
        <ls-form-sheet-content-wrapper
          style={{ position: 'absolute', top: 0, left: 0, right: 0 }}
        >
          {children}
        </ls-form-sheet-content-wrapper>
      ) : (
        // Adaptation: fixed-detent Lynx content needs a full-size native interaction container.
        <view
          native-interaction-enabled={true}
          style={{ width: '100%', height: '100%' }}
        >
          {children}
        </view>
      )}
    </ls-form-sheet>
  );
};
