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
  /**
   * @summary Called when the screen is about to appear.
   *
   * On both platforms this lands as the transition begins.
   *
   * @platform android, ios
   */
  onWillAppear?: StackScreenEventHandler | undefined;
  /**
   * @summary Called when the screen has appeared.
   *
   * Android: lands after the enter transition.
   * iOS: called by UIKit once the transition completes.
   *
   * @platform android, ios
   */
  onDidAppear?: StackScreenEventHandler | undefined;
  /**
   * @summary Called when the screen is about to disappear.
   *
   * On both platforms this lands as the transition begins. On Android it
   * also fires when the app goes to the background.
   *
   * @platform android, ios
   */
  onWillDisappear?: StackScreenEventHandler | undefined;
  /**
   * @summary Called when the screen has disappeared.
   *
   * The platforms differ here:
   *
   * - Android: `FragmentManager` stops a popped fragment as soon
   *   as the transaction is committed and only defers the view
   *   teardown until the exit transition ends, so this fires right
   *   after `onWillDisappear`, while the exit transition is still running.
   *   It also fires when the app goes to the background/
   * - iOS: called by UIKit after the transition completes, so
   *   the screen has visually left. UIKit does not call it
   *   when the app goes to the background.
   *
   * @platform android, ios
   */
  onDidDisappear?: StackScreenEventHandler | undefined;

  /**
   * @summary Called when a screen popped by the stack (`activityMode` set to
   * `'detached'`) has been removed from the native hierarchy.
   *
   * Fires after the exit transition completes on both platforms. It does
   * not fire for a screen covered by a push.
   *
   * @platform android, ios
   */
  onDismiss?: ((screenKey: string) => void) | undefined;
  /**
   * @summary Called when the screen was dismissed natively (back gesture,
   * system back, header back button) rather than through `activityMode`.
   *
   * Fires after the exit transition completes on both platforms. It does
   * not fire for a screen covered by a push.
   *
   * @platform android, ios
   */
  onNativeDismiss?: ((screenKey: string) => void) | undefined;
  onNativeDismissPrevented?: StackScreenEventHandler | undefined;

  // Configuration
  preventNativeDismiss?: boolean | undefined;
};
