import type { FormSheetProps } from './FormSheet.types.js';
import {
  resolveInitialDetentIndex,
  resolveLargestUndimmedDetentIndex,
  resolveNativeCornerRadius,
  resolveNativeDetents,
} from './FormSheetUtils.js';

export const FormSheet = ({
  children,
  detents,
  initialDetentIndex,
  largestUndimmedDetentIndex,
  preferredCornerRadius,
  nativeContainerStyle,
  // Events
  onWillAppear,
  onDidAppear,
  onWillDisappear,
  onDidDisappear,
  onDismiss,
  onNativeDismiss,
  onDetentChanged,
  onNativeDismissPrevented,
  ...rest
}: FormSheetProps) => {
  const nativeDetents = resolveNativeDetents(detents);
  const detentsCount = nativeDetents?.length ?? 0;

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
      bindOnDismiss={onDismiss}
      bindOnNativeDismiss={onNativeDismiss}
      bindOnDetentChanged={onDetentChanged}
      bindOnNativeDismissPrevented={onNativeDismissPrevented}
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
