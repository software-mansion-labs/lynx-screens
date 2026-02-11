/// <reference types="@lynx-js/rspeedy/client" />

import * as ReactLynx from "@lynx-js/react";
import * as Lynx from "@lynx-js/types";

declare module "@lynx-js/types" {
  type EmptyEventPayload = Record<string, never>;

  type OnDismissEventPayload = Readonly<{
    isNativeDismiss: boolean;
  }>;

  interface IntrinsicElements extends Lynx.IntrinsicElements {
    "color-box-view": {
      className?: string;
      children: Lynx.Element;
      id?: string;
      style?: string | Lynx.CSSProperties;
      backgroundColorHex?: string | undefined;
    };
    "stack-host-native": {
      className?: string;
      children: Lynx.Element;
      id?: string;
      style?: string | Lynx.CSSProperties;
    };
    "stack-screen-native": {
      className?: string;
      children: Lynx.Element;
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
