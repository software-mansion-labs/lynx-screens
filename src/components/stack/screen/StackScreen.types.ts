import type * as Lynx from '@lynx-js/types';

export type OnDismissEventPayload = Readonly<{
  isNativeDismiss: boolean;
}>;

export type EmptyEventPayload = Record<string, never>;

export type OnDismissEvent = Lynx.BaseEventOrig<OnDismissEventPayload>;

export type StackScreenActivityMode = 'detached' | 'attached';

export type StackScreenEventHandler = Lynx.EventHandler<
  Lynx.BaseEventOrig<EmptyEventPayload>
>;

export type StackScreenProps = {
  children?: Lynx.ViewProps['children'] | undefined;

  // Control
  activityMode: StackScreenActivityMode;
  screenKey: string;

  // Events
  onWillAppear?: StackScreenEventHandler | undefined;
  onDidAppear?: StackScreenEventHandler | undefined;
  onWillDisappear?: StackScreenEventHandler | undefined;
  onDidDisappear?: StackScreenEventHandler | undefined;

  onDismiss?: ((screenKey: string) => void) | undefined;
  onNativeDismiss?: ((screenKey: string) => void) | undefined;
  onNativeDismissPrevented?: StackScreenEventHandler | undefined;

  // Configuration
  preventNativeDismiss?: boolean | undefined;
};
