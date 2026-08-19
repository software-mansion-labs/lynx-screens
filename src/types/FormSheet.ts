import type * as Lynx from '@lynx-js/types';

type FormSheetEmptyEventPayload = Record<string, never>;

export type FormSheetEventHandler<T> = Lynx.EventHandler<Lynx.BaseEventOrig<T>>;

export interface FormSheetDetentChangedEvent {
  index: number;
}

export interface FormSheetNativeDismissPreventedEvent {
  /** The dismissal channel that was blocked. */
  channel: PreventNativeDismissChannel;
}

export type FormSheetNativeContainerStyleProps = {
  backgroundColor?: Lynx.CSSProperties['backgroundColor'] | undefined;
};

export type PreventNativeDismissChannel = 'back' | 'drag' | 'backdrop';

export interface FormSheetProps {
  children?: Lynx.ViewProps['children'] | undefined;
  isOpen: boolean;
  /** Android supports up to three detents. */
  detents?: number[] | 'fitToContents' | undefined;
  prefersGrabberVisible?: boolean | undefined;
  /** Custom Android corners require Android 13 or newer. */
  preferredCornerRadius?: number | 'systemDefault' | undefined;
  largestUndimmedDetentIndex?: number | 'none' | 'last' | undefined;
  initialDetentIndex?: number | 'last' | undefined;
  selectedDetentIndex?: number | 'last' | undefined;
  /** iOS only. */
  prefersScrollingExpandsWhenScrolledToEdge?: boolean | undefined;
  /**
   * Blocks native dismissal. `true` blocks every channel; an array blocks
   * only the listed channels.
   *
   * - `back`: Android back button
   * - `drag`: pull-down drag gesture
   * - `backdrop`: tapping the dimmed space behind the sheet
   */
  preventNativeDismiss?: boolean | PreventNativeDismissChannel[] | undefined;
  /**
   * When drag dismissal is prevented, also disables drag-follow and snap-back
   * feedback so the sheet stays at its smallest detent.
   */
  preventNativeDismissDragFeedback?: boolean | undefined;
  nativeContainerStyle?: FormSheetNativeContainerStyleProps | undefined;
  onWillAppear?: FormSheetEventHandler<FormSheetEmptyEventPayload> | undefined;
  onDidAppear?: FormSheetEventHandler<FormSheetEmptyEventPayload> | undefined;
  onWillDisappear?:
    | FormSheetEventHandler<FormSheetEmptyEventPayload>
    | undefined;
  onDidDisappear?:
    | FormSheetEventHandler<FormSheetEmptyEventPayload>
    | undefined;
  onDismiss?: FormSheetEventHandler<FormSheetEmptyEventPayload> | undefined;
  onNativeDismiss?:
    | FormSheetEventHandler<FormSheetEmptyEventPayload>
    | undefined;
  onDetentChanged?:
    | FormSheetEventHandler<FormSheetDetentChangedEvent>
    | undefined;
  onNativeDismissPrevented?:
    | FormSheetEventHandler<FormSheetNativeDismissPreventedEvent>
    | undefined;
}
