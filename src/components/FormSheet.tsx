import type { FormSheetProps } from '../types/FormSheet.js';
import {
  resolveFormSheetHostStyle,
  resolveInitialDetentIndex,
  resolveLargestUndimmedDetentIndex,
  resolveNativeCornerRadius,
  resolveNativeDetents,
  resolveSelectedDetentIndex,
} from '../utils/form-sheet.js';

export function FormSheet({
  children,
  isOpen,
  detents,
  prefersGrabberVisible,
  preferredCornerRadius,
  largestUndimmedDetentIndex,
  initialDetentIndex,
  selectedDetentIndex,
  prefersScrollingExpandsWhenScrolledToEdge,
  preventNativeDismiss,
  preventNativeDismissDragFeedback,
  nativeContainerStyle,
  onWillAppear,
  onDidAppear,
  onWillDisappear,
  onDidDisappear,
  onDismiss,
  onNativeDismiss,
  onDetentChanged,
  onNativeDismissPrevented,
}: FormSheetProps) {
  const nativeDetents = resolveNativeDetents(detents);
  const detentsCount = nativeDetents?.length ?? 0;

  return (
    <form-sheet-native
      style={resolveFormSheetHostStyle(detents)}
      isOpen={isOpen}
      user-interaction-enabled={isOpen}
      detents={nativeDetents}
      prefersGrabberVisible={prefersGrabberVisible}
      preferredCornerRadius={resolveNativeCornerRadius(preferredCornerRadius)}
      largestUndimmedDetentIndex={resolveLargestUndimmedDetentIndex(
        largestUndimmedDetentIndex,
        detentsCount,
      )}
      initialDetentIndex={resolveInitialDetentIndex(
        initialDetentIndex,
        detentsCount,
      )}
      selectedDetentIndex={resolveSelectedDetentIndex(
        selectedDetentIndex,
        detentsCount,
      )}
      prefersScrollingExpandsWhenScrolledToEdge={
        prefersScrollingExpandsWhenScrolledToEdge
      }
      preventNativeDismiss={preventNativeDismiss}
      preventNativeDismissDragFeedback={preventNativeDismissDragFeedback}
      nativeContainerBackgroundColor={nativeContainerStyle?.backgroundColor}
      bindOnWillAppear={onWillAppear}
      bindOnDidAppear={onDidAppear}
      bindOnWillDisappear={onWillDisappear}
      bindOnDidDisappear={onDidDisappear}
      bindOnDismiss={onDismiss}
      bindOnNativeDismiss={onNativeDismiss}
      bindOnDetentChanged={onDetentChanged}
      bindOnNativeDismissPrevented={onNativeDismissPrevented}
    >
      {children}
    </form-sheet-native>
  );
}
