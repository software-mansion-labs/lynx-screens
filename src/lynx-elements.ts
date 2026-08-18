import type { ReactNode } from '@lynx-js/react';
import type * as Lynx from '@lynx-js/types';

declare module "@lynx-js/types" {
  type EmptyEventPayload = Record<string, never>;

  type OnDismissEventPayload = Readonly<{
    isNativeDismiss: boolean;
  }>;

  interface IntrinsicElements extends Lynx.IntrinsicElements {
    "stack-host-native": {
      className?: string | undefined;
      children: ReactNode;
      id?: string | undefined;
      style?: string | Lynx.CSSProperties | undefined;
    };
    "stack-screen-native": {
      className?: string | undefined;
      children: ReactNode;
      id?: string | undefined;
      style?: string | Lynx.CSSProperties | undefined;
      // Control
      activityMode?: 'detached' | 'attached' | undefined;
      screenKey?: string | undefined;
      // Events
      bindOnWillAppear?: Lynx.EventHandler<Lynx.BaseEventOrig<EmptyEventPayload>> | undefined;
      bindOnDidAppear?: Lynx.EventHandler<Lynx.BaseEventOrig<EmptyEventPayload>> | undefined;
      bindOnWillDisappear?: Lynx.EventHandler<Lynx.BaseEventOrig<EmptyEventPayload>> | undefined;
      bindOnDidDisappear?: Lynx.EventHandler<Lynx.BaseEventOrig<EmptyEventPayload>> | undefined;
      bindOnDismiss?: Lynx.EventHandler<Lynx.BaseEventOrig<OnDismissEventPayload>> | undefined;
      bindOnNativeDismissPrevented?: Lynx.EventHandler<Lynx.BaseEventOrig<EmptyEventPayload>> | undefined;
      // Configuration
      preventNativeDismiss?: boolean | undefined;
    };
    "stack-header-config-native": {
      className?: string | undefined;
      children?: ReactNode | undefined;
      id?: string | undefined;
      style?: string | Lynx.CSSProperties | undefined;
      type?: 'small' | 'medium' | 'large' | undefined;
      title?: string | undefined;
      hidden?: boolean | undefined;
      transparent?: boolean | undefined;
      backButtonHidden?: boolean | undefined;
      backButtonTintColor?: string | undefined;
      backButtonDrawableIconResourceName?: string | undefined;
      backButtonImageIconUri?: string | undefined;
      hasBackgroundSubview?: boolean | undefined;
    };
    "stack-header-subview-native": {
      className?: string | undefined;
      children?: ReactNode | undefined;
      id?: string | undefined;
      style?: string | Lynx.CSSProperties | undefined;
      type?: 'background' | 'leading' | 'center' | 'trailing' | undefined;
      collapseMode?: 'off' | 'parallax' | undefined;
    };
  }
}

export {};
