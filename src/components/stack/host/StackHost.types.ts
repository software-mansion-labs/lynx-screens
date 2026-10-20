import type * as Lynx from '@lynx-js/types';
import type { ColorScheme } from '../../shared/types.js';

export type StackHostColorScheme = ColorScheme | 'inherit';

export type StackHostProps = {
  // General
  children: NonNullable<Lynx.ViewProps['children']>;
  /**
   * @summary Specifies the color scheme used by the container and any child
   * containers.
   *
   * The following values are currently supported:
   * - `inherit` - the interface style from parent,
   * - `light` - the light interface style,
   * - `dark` - the dark interface style.
   *
   * @remarks
   * Color scheme isn't currently supported on iOS.
   *
   * On Android, changing the effective color scheme rebuilds the header. The
   * toolbar menu is rebuilt from the `toolbarMenu` prop, so its initial
   * selection is restored and any changes applied via the
   * `updateToolbarMenuElements` view command are discarded.
   *
   * @default inherit
   *
   * @platform android
   */
  colorScheme?: StackHostColorScheme | undefined;
};
