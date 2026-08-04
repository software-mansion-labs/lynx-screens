import type * as Lynx from '@lynx-js/types';

export type StackScreenActivityMode = 'detached' | 'attached';

// copied form react-native-screens/src/components/gamma/stack/StackScreen.types.ts
export type EmptyEventPayload = Record<string, never>;

export type OnDismissEventPayload = Readonly<{
  isNativeDismiss: boolean;
}>;

export type StackScreenProps = {
  children?: Lynx.ViewProps['children'];

  // Control
  activityMode: StackScreenActivityMode;
  screenKey: string;

  // Events
  onWillAppear?:
    | Lynx.EventHandler<Lynx.BaseEventOrig<EmptyEventPayload>>
    | undefined;
  onDidAppear?:
    | Lynx.EventHandler<Lynx.BaseEventOrig<EmptyEventPayload>>
    | undefined;
  onWillDisappear?:
    | Lynx.EventHandler<Lynx.BaseEventOrig<EmptyEventPayload>>
    | undefined;
  onDidDisappear?:
    | Lynx.EventHandler<Lynx.BaseEventOrig<EmptyEventPayload>>
    | undefined;

  onDismiss?: (screenKey: string) => void;
  onNativeDismiss?: (screenKey: string) => void;

  onNativeDismissPrevented?:
    | Lynx.EventHandler<Lynx.BaseEventOrig<EmptyEventPayload>>
    | undefined;

  // Configuration
  preventNativeDismiss?: boolean;
};
