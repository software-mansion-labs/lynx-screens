import type { ReactNode } from '@lynx-js/react';
import type * as Lynx from '@lynx-js/types';

type EmptyEventPayload = Record<string, never>;

type FormSheetDetentChangedEventPayload = Readonly<{
  index: number;
}>;

export interface NativeProps {
  className?: string | undefined;
  children?: ReactNode | undefined;
  id?: string | undefined;
  style?: string | Lynx.CSSProperties | undefined;
  isOpen?: boolean | undefined;
  detents?: number[] | undefined;
  prefersGrabberVisible?: boolean | undefined;
  preferredCornerRadius?: number | undefined;
  largestUndimmedDetentIndex?: number | undefined;
  initialDetentIndex?: number | undefined;
  prefersScrollingExpandsWhenScrolledToEdge?: boolean | undefined;
  preventNativeDismiss?: boolean | undefined;
  nativeContainerBackgroundColor?: string | undefined;
  bindOnWillAppear?:
    | Lynx.EventHandler<Lynx.BaseEventOrig<EmptyEventPayload>>
    | undefined;
  bindOnDidAppear?:
    | Lynx.EventHandler<Lynx.BaseEventOrig<EmptyEventPayload>>
    | undefined;
  bindOnWillDisappear?:
    | Lynx.EventHandler<Lynx.BaseEventOrig<EmptyEventPayload>>
    | undefined;
  bindOnDidDisappear?:
    | Lynx.EventHandler<Lynx.BaseEventOrig<EmptyEventPayload>>
    | undefined;
  bindOnDismiss?:
    | Lynx.EventHandler<Lynx.BaseEventOrig<EmptyEventPayload>>
    | undefined;
  bindOnNativeDismiss?:
    | Lynx.EventHandler<Lynx.BaseEventOrig<EmptyEventPayload>>
    | undefined;
  bindOnNativeDismissPrevented?:
    | Lynx.EventHandler<Lynx.BaseEventOrig<EmptyEventPayload>>
    | undefined;
  bindOnDetentChanged?:
    | Lynx.EventHandler<Lynx.BaseEventOrig<FormSheetDetentChangedEventPayload>>
    | undefined;
}
