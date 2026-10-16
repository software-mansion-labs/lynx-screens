import type * as Lynx from '@lynx-js/types';

export type EmptyEventPayload = Record<string, never>;

export type FormSheetEventHandler<T> = Lynx.EventHandler<Lynx.BaseEventOrig<T>>;

export interface FormSheetDetentChangedEvent {
  index: number;
}

export type FormSheetDetents = number[] | 'fitToContents';

export type FormSheetNativeContainerStyleProps = {
  backgroundColor?: Lynx.CSSProperties['backgroundColor'] | undefined;
};

export type FormSheetProps = {
  children?: Lynx.ViewProps['children'] | undefined;
  isOpen: boolean;
  detents?: FormSheetDetents | undefined;
  prefersGrabberVisible?: boolean | undefined;
  preferredCornerRadius?: number | 'systemDefault' | undefined;
  largestUndimmedDetentIndex?: number | 'none' | 'last' | undefined;
  initialDetentIndex?: number | 'last' | undefined;
  prefersScrollingExpandsWhenScrolledToEdge?: boolean | undefined;
  preventNativeDismiss?: boolean | undefined;
  nativeContainerStyle?: FormSheetNativeContainerStyleProps | undefined;

  // Events

  onWillAppear?: FormSheetEventHandler<EmptyEventPayload> | undefined;
  onDidAppear?: FormSheetEventHandler<EmptyEventPayload> | undefined;
  onWillDisappear?: FormSheetEventHandler<EmptyEventPayload> | undefined;
  onDidDisappear?: FormSheetEventHandler<EmptyEventPayload> | undefined;
  onDismiss?: FormSheetEventHandler<EmptyEventPayload> | undefined;
  onNativeDismiss?: FormSheetEventHandler<EmptyEventPayload> | undefined;
  onDetentChanged?:
    | FormSheetEventHandler<FormSheetDetentChangedEvent>
    | undefined;
  onNativeDismissPrevented?:
    | FormSheetEventHandler<EmptyEventPayload>
    | undefined;
};
