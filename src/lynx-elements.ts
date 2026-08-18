import type { ReactNode } from '@lynx-js/react';
import type * as Lynx from '@lynx-js/types';

declare module "@lynx-js/types" {
  type EmptyEventPayload = Record<string, never>;

  type OnDismissEventPayload = Readonly<{
    isNativeDismiss: boolean;
  }>;

  interface IntrinsicElements extends Lynx.IntrinsicElements {
    "ls-stack-host": {
      className?: string;
      children: ReactNode;
      id?: string;
      style?: string | Lynx.CSSProperties;
    };
    "ls-stack-screen": {
      className?: string;
      children: ReactNode;
      id?: string;
      style?: string | Lynx.CSSProperties;
      // Control
      activityMode?: 'detached' | 'attached';
      screenKey?: string;
      // Events
      bindOnWillAppear?: Lynx.EventHandler<Lynx.BaseEventOrig<EmptyEventPayload>>;
      bindOnDidAppear?: Lynx.EventHandler<Lynx.BaseEventOrig<EmptyEventPayload>>;
      bindOnWillDisappear?: Lynx.EventHandler<Lynx.BaseEventOrig<EmptyEventPayload>>;
      bindOnDidDisappear?: Lynx.EventHandler<Lynx.BaseEventOrig<EmptyEventPayload>>;
      bindOnDismiss?: Lynx.EventHandler<Lynx.BaseEventOrig<OnDismissEventPayload>>;
      bindOnNativeDismissPrevented?: Lynx.EventHandler<Lynx.BaseEventOrig<EmptyEventPayload>>;
      // Configuration
      preventNativeDismiss?: boolean;
    }
  }
}

export {};
