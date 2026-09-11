import type {
  ScreenInternalTraceProps,
  NativeEventContext,
} from '../internal/trace/types.js';
import type * as Lynx from '@lynx-js/types';

export type FormSheetDetents = number[] | 'fitToContents';

export type FormSheetNativeContainerStyleProps = {
  backgroundColor?: Lynx.CSSProperties['backgroundColor'] | undefined;
};

export type FormSheetProps = {
  /** @internal Navigation framework diagnostics. */
  internalTrace?: ScreenInternalTraceProps | undefined;
  children?: Lynx.ViewProps['children'] | undefined;
  isOpen: boolean;
  traceScreenKey?: string | undefined;
  detents?: FormSheetDetents | undefined;
  prefersGrabberVisible?: boolean | undefined;
  preferredCornerRadius?: number | 'systemDefault' | undefined;
  largestUndimmedDetentIndex?: number | 'none' | 'last' | undefined;
  initialDetentIndex?: number | 'last' | undefined;
  prefersScrollingExpandsWhenScrolledToEdge?: boolean | undefined;
  preventNativeDismiss?: boolean | undefined;
  nativeContainerStyle?: FormSheetNativeContainerStyleProps | undefined;
  onWillAppear?:
    Lynx.EventHandler<Lynx.BaseEventOrig<Record<string, never>>> | undefined;
  onDidAppear?:
    Lynx.EventHandler<Lynx.BaseEventOrig<Record<string, never>>> | undefined;
  onWillDisappear?:
    Lynx.EventHandler<Lynx.BaseEventOrig<Record<string, never>>> | undefined;
  onDidDisappear?:
    Lynx.EventHandler<Lynx.BaseEventOrig<Record<string, never>>> | undefined;
  onDismiss?: ((context?: NativeEventContext) => void) | undefined;
  onNativeDismiss?: ((context?: NativeEventContext) => void) | undefined;
  onNativeDismissPrevented?:
    Lynx.EventHandler<Lynx.BaseEventOrig<Record<string, never>>> | undefined;
  onDetentChanged?: ((index: number) => void) | undefined;
};
