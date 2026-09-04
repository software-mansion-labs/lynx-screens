import React from 'react';
import type * as Lynx from '@lynx-js/types';
import type { FormSheetProps } from '../types/FormSheet.js';
import {
  resolveInitialDetentIndex,
  resolveLargestUndimmedDetentIndex,
  resolveNativeCornerRadius,
  resolveNativeDetents,
} from './FormSheetUtils.js';

type DismissEventPayload = Readonly<{
  isNativeDismiss: boolean;
}>;

type DetentChangedEventPayload = Readonly<{
  index: number;
}>;

export const FormSheetNativeComponent = ({
  children,
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
  const nativeDetents = resolveNativeDetents(detents);
  const detentsCount = nativeDetents?.length ?? 0;

  const onDismissEvent = React.useCallback(
    (event: Lynx.BaseEventOrig<DismissEventPayload>) => {
      if (event.detail.isNativeDismiss) {
        onNativeDismiss?.();
      } else {
        onDismiss?.();
      }
    },
    [onDismiss, onNativeDismiss],
  );

  const onDetentChangedEvent = React.useCallback(
    (event: Lynx.BaseEventOrig<DetentChangedEventPayload>) => {
      onDetentChanged?.(event.detail.index);
    },
    [onDetentChanged],
  );

  return (
    <ls-form-sheet
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
      bindOnWillAppear={onWillAppear}
      bindOnDidAppear={onDidAppear}
      bindOnWillDisappear={onWillDisappear}
      bindOnDidDisappear={onDidDisappear}
      bindOnDismiss={onDismissEvent}
      bindOnNativeDismissPrevented={onNativeDismissPrevented}
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
