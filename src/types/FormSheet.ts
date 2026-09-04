import type * as Lynx from '@lynx-js/types';

export type FormSheetDetents = number[] | 'fitToContents';

export type FormSheetNativeContainerStyle = {
  backgroundColor?: string | undefined;
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
  nativeContainerStyle?: FormSheetNativeContainerStyle | undefined;
  onWillAppear?:
    | Lynx.EventHandler<Lynx.BaseEventOrig<Record<string, never>>>
    | undefined;
  onDidAppear?:
    | Lynx.EventHandler<Lynx.BaseEventOrig<Record<string, never>>>
    | undefined;
  onWillDisappear?:
    | Lynx.EventHandler<Lynx.BaseEventOrig<Record<string, never>>>
    | undefined;
  onDidDisappear?:
    | Lynx.EventHandler<Lynx.BaseEventOrig<Record<string, never>>>
    | undefined;
  onDismiss?: (() => void) | undefined;
  onNativeDismiss?: (() => void) | undefined;
  onNativeDismissPrevented?:
    | Lynx.EventHandler<Lynx.BaseEventOrig<Record<string, never>>>
    | undefined;
  onDetentChanged?: ((index: number) => void) | undefined;
};
