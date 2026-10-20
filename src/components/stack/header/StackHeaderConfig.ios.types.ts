import type { ReactElement } from '@lynx-js/react';
import type { CSSProperties } from '@lynx-js/types';
import type { PlatformIconIOS } from '../../shared/types.js';
import type { StackHeaderMenuIOS } from './ios/StackHeaderMenu.ios.types.js';

/**
 * @summary Options for updating a menu action (leaf item) at runtime.
 *
 * @description
 * Omitted keys preserve current values. Explicit `undefined` resets to default.
 *
 * @platform ios
 */
export interface StackHeaderMenuItemOptionsIOS {
  /**
   * @summary New title for the menu action.
   *
   * @platform ios
   */
  title?: string | undefined;
  /**
   * @summary New icon for the menu action.
   *
   * @platform ios
   */
  icon?: PlatformIconIOS | undefined;
  /**
   * @summary Sets the toggle state of the menu item.
   *
   * @description
   * When inside a single selection hierarchy, setting `true` deselects the
   * previously selected item and selects this one. Setting `false` is a noop
   * in this case - only has effect for regular toggles.
   *
   * @platform ios
   */
  toggleState?: boolean | undefined;
}

/**
 * @summary Options for updating a submenu at runtime.
 *
 * @description
 * Omitted keys preserve current values. Explicit `undefined` resets to default.
 *
 * @platform ios
 */
export interface StackHeaderMenuOptionsIOS {
  /**
   * @summary New title for the submenu.
   *
   * @platform ios
   */
  title?: string | undefined;
  /**
   * @summary New icon for the submenu.
   *
   * @platform ios
   */
  icon?: PlatformIconIOS | undefined;
}

export interface StackHeaderBaseItemIOS {
  id: string;
  title?: string | undefined;
  /**
   * @summary Icon displayed for the header item.
   *
   * @description
   * Supports SF Symbols, xcassets, and image sources. For async image sources,
   * the item renders without an icon first and updates when loaded.
   * Ignored when custom view ({@link StackHeaderInlineCustomItemIOS.render | render}) is set.
   *
   * @platform ios
   */
  icon?: PlatformIconIOS | undefined;
}

export interface SupportsMenuIOS {
  menu?: StackHeaderMenuIOS | undefined;
}

export interface SupportsSharedBackgroundIOS {
  /**
   * @summary Whether the liquid glass background for this item should be hidden.
   *
   * @description
   * On iOS 26, adjacent bar button items are grouped inside a shared liquid
   * glass background. Setting this to `true` removes the shared background
   * from this item.
   *
   * @default false
   *
   * @platform iOS
   *
   * @supported iOS 26 and higher
   */
  hidesSharedBackground?: boolean | undefined;
}

export interface SupportsIdentifierIOS {
  /**
   * @summary Stable identifier used to match the item across different screens
   * for more intelligent animation on transition.
   *
   * @description
   * When navigating between screens, iOS tries to match similarly looking items (i.e. same sfSymbol)
   * and animate between them. If the heuristic fails, a simpler crossfade is applied.
   * In a situation where visually different items should be logically considered the same across screens,
   * you may use this prop to tell this fact to the system. The identifier shouldn't be updated at runtime;
   * doing so will result in item rebuild and visual flash.
   *
   * @platform iOS
   *
   * @supported iOS 26 and higher
   */
  identifier?: string | undefined;
}

export interface StackHeaderInlineItemIOS
  extends StackHeaderBaseItemIOS,
    SupportsMenuIOS,
    SupportsIdentifierIOS,
    SupportsSharedBackgroundIOS {
  type: 'item';
  /**
   * @summary Callback invoked when the header item is pressed.
   *
   * @description
   * Fires when the user taps the header item. When combined with
   * {@link SupportsMenuIOS.menu | menu}, tapping fires `onPress` and
   * long-pressing shows the menu.
   *
   * @platform ios
   */
  onPress?: (() => void) | undefined;
}

export interface StackHeaderInlineCustomItemIOS
  extends SupportsMenuIOS,
    SupportsIdentifierIOS,
    SupportsSharedBackgroundIOS {
  id: string;
  type: 'item';
  render: () => ReactElement;
}

interface StackHeaderFixedSpacerItemIOS {
  id: string;
  type: 'spacer';
  sizing: 'fixed';
  width: number;
}

interface StackHeaderFlexibleSpacerItemIOS {
  id: string;
  type: 'spacer';
  sizing: 'flexible';
}

export type StackHeaderSpacerItemIOS =
  | StackHeaderFixedSpacerItemIOS
  | StackHeaderFlexibleSpacerItemIOS;

export interface StackHeaderTitleCustomItemIOS {
  id: string;
  render: () => ReactElement;
}

/**
 * @summary Controls how the back button title is displayed.
 *
 * @description
 * - `default`: the system chooses the title depending on available space.
 *   On iOS < 26 options include: custom title (defaults to previous screen title),
 *   generic "Back", no title; on iOS >= 26 it's either custom title (if set) or no title.
 * - `generic`: on iOS < 26, the system uses a generic "Back" title or no title;
 *   on iOS >= 26 it's the same as `minimal`.
 * - `minimal`: no title is displayed next to the back button chevron.
 *
 * @platform iOS
 */
export type StackHeaderBackButtonDisplayModeIOS =
  | 'default'
  | 'generic'
  | 'minimal';

export interface StackHeaderAppearanceIOS {
  /**
   * @summary Specifies the font family used for the title of the header.
   *
   * @platform ios
   */
  titleFontFamily?: CSSProperties['fontFamily'] | undefined;
  /**
   * @summary Specifies the font size used for the title of the header.
   *
   * @platform ios
   */
  titleFontSize?: number | undefined;
  /**
   * @summary Specifies the font weight used for the title of the header.
   *
   * @platform ios
   */
  titleFontWeight?: CSSProperties['fontWeight'] | undefined;
  /**
   * @summary Specifies the font style used for the title of the header.
   *
   * @platform ios
   */
  titleFontStyle?: CSSProperties['fontStyle'] | undefined;
  /**
   * @summary Specifies the font color used for the title of the header.
   *
   * @platform ios
   */
  titleFontColor?: string | undefined;
  /**
   * @summary Specifies the font family used for the large title of the header.
   *
   * @platform ios
   */
  largeTitleFontFamily?: CSSProperties['fontFamily'] | undefined;
  /**
   * @summary Specifies the font size used for the large title of the header.
   *
   * @platform ios
   */
  largeTitleFontSize?: number | undefined;
  /**
   * @summary Specifies the font weight used for the large title of the header.
   *
   * @platform ios
   */
  largeTitleFontWeight?: CSSProperties['fontWeight'] | undefined;
  /**
   * @summary Specifies the font style used for the large title of the header.
   *
   * @platform ios
   */
  largeTitleFontStyle?: CSSProperties['fontStyle'] | undefined;
  /**
   * @summary Specifies the font color used for the large title of the header.
   *
   * @platform ios
   */
  largeTitleFontColor?: string | undefined;
  /**
   * @summary Specifies the font family used for the subtitle of the header.
   *
   * @description Applies to both the regular and the large subtitle.
   *
   * @platform ios
   *
   * @supported iOS 26 and higher
   */
  subtitleFontFamily?: CSSProperties['fontFamily'] | undefined;
  /**
   * @summary Specifies the font size used for the subtitle of the header.
   *
   * @description Applies to both the regular and the large subtitle.
   *
   * @platform ios
   *
   * @supported iOS 26 and higher
   */
  subtitleFontSize?: number | undefined;
  /**
   * @summary Specifies the font weight used for the subtitle of the header.
   *
   * @description Applies to both the regular and the large subtitle.
   *
   * @platform ios
   *
   * @supported iOS 26 and higher
   */
  subtitleFontWeight?: CSSProperties['fontWeight'] | undefined;
  /**
   * @summary Specifies the font style used for the subtitle of the header.
   *
   * @description Applies to both the regular and the large subtitle.
   *
   * @platform ios
   *
   * @supported iOS 26 and higher
   */
  subtitleFontStyle?: CSSProperties['fontStyle'] | undefined;
  /**
   * @summary Specifies the font color used for the subtitle of the header.
   *
   * @description Applies to both the regular and the large subtitle.
   *
   * @platform ios
   *
   * @supported iOS 26 and higher
   */
  subtitleFontColor?: string | undefined;
}

export interface StackHeaderConfigPropsIOS {
  /**
   * @summary Title displayed next to the back button on this screen.
   *
   * @description
   * Configured on the screen whose back button it applies to (the screen that
   * is pushed on top). When unset, the system derives the back title from the
   * previous screen's `title`.
   *
   * @platform iOS
   */
  backButtonTitle?: string | undefined;
  /**
   * @summary Controls how the back button title is displayed.
   *
   * @default 'default'
   *
   * @platform iOS
   */
  backButtonDisplayMode?: StackHeaderBackButtonDisplayModeIOS | undefined;
  /**
   * @summary Whether the back button shows the navigation history menu.
   *
   * @description
   * Configured on the screen whose back button it applies to (the screen that
   * is pushed on top). When `false`, the navigation history menu is not shown
   * on either of the gestures that normally open it: long-pressing the back
   * button and secondary-clicking it (trackpad / mouse right click); tapping
   * it still pops the screen.
   *
   * @default true
   *
   * @platform iOS
   */
  backButtonMenuEnabled?: boolean | undefined;
  subtitleItem?: StackHeaderTitleCustomItemIOS | undefined;
  leadingItems?:
    | (
        | StackHeaderInlineItemIOS
        | StackHeaderInlineCustomItemIOS
        | StackHeaderSpacerItemIOS
      )[]
    | undefined;
  titleItem?: StackHeaderTitleCustomItemIOS | undefined;
  /**
   * @summary Menu definition for the title context menu.
   *
   * @description
   * Configures a dropdown menu attached to the navigation bar title area.
   * Works independently of {@link titleItem}; the menu appears for both
   * plain text and custom view title.
   *
   * @platform ios
   *
   * @supported iOS 16 and higher
   */
  titleMenu?: StackHeaderMenuIOS | undefined;
  trailingItems?:
    | (
        | StackHeaderInlineItemIOS
        | StackHeaderInlineCustomItemIOS
        | StackHeaderSpacerItemIOS
      )[]
    | undefined;
  largeTitle?: string | undefined;
  largeTitleEnabled?: boolean | undefined;
  largeSubtitle?: string | undefined;
  largeSubtitleItem?: StackHeaderTitleCustomItemIOS | undefined;
  /**
   * @summary A single line of text displayed at the top of the navigation bar,
   * above the title.
   *
   * @description
   * Setting this prop increases the height of the navigation bar.
   *
   * @platform iOS
   */
  prompt?: string | undefined;
  /**
   * @summary Appearance of the header when the edge of scrollable content
   * is not aligned with the edge of the header.
   *
   * @platform ios
   */
  standardAppearance?: StackHeaderAppearanceIOS | undefined;
  /**
   * @summary Appearance of the header when the edge of scrollable content
   * is aligned with the edge of the header.
   *
   * @description If unset, derives the configuration from `standardAppearance`,
   * otherwise becomes a standalone definition. In both cases it keeps transparent
   * background by default (iOS <18).
   *
   * @platform ios
   */
  scrollEdgeAppearance?: StackHeaderAppearanceIOS | undefined;
}

export interface StackHeaderConfigCommandsIOS {
  /**
   * @summary Updates properties of a menu action (leaf item) at runtime.
   *
   * @param menuElementId The ID of the menu action to update.
   * @param options Object with properties to change. Omitted keys preserve current
   *        values. Explicit `undefined` resets to default.
   *
   * @platform ios
   */
  setMenuItemOptions: (
    menuElementId: string,
    options: StackHeaderMenuItemOptionsIOS,
  ) => void;
  /**
   * @summary Updates properties of a submenu at runtime.
   *
   * @param menuElementId The ID of the submenu to update.
   * @param options Object with properties to change. Omitted keys preserve current
   *        values. Explicit `undefined` resets to default.
   *
   * @platform ios
   */
  setMenuOptions: (
    menuElementId: string,
    options: StackHeaderMenuOptionsIOS,
  ) => void;
}
