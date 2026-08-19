import type { ReactElement, ReactNode } from '@lynx-js/react';
import type * as Lynx from '@lynx-js/types';

// copied from react-native-screens/src/components/gamma/stack/header/*.types.ts

export type StackHeaderTypeAndroid = 'small' | 'medium' | 'large';

export type StackHeaderSubviewTypeAndroid =
  | 'background'
  | 'leading'
  | 'center'
  | 'trailing';

export type StackHeaderSubviewCollapseModeAndroid = 'off' | 'parallax';

export type StackHeaderBackgroundSubviewCollapseModeAndroid =
  StackHeaderSubviewCollapseModeAndroid;

// RNS resolves RN assets via Image.resolveAssetSource; on Lynx images are
// referenced by plain URI strings (bundler-emitted URLs, remote URLs or
// android_asset paths).
export type PlatformIconShared = {
  type: 'imageSource';
  uri: string;
};

export type PlatformIconAndroid =
  | {
      type: 'drawableResource';
      name: string;
    }
  | PlatformIconShared;

export interface StackHeaderToolbarSubviewAndroid {
  /**
   * @summary Render callback for the React element placed in this toolbar slot.
   *
   * The subview is sized by the Lynx layout engine but positioned by the
   * platform native layout. Each subview is placed independently — subviews do
   * not participate in a shared flex layout and cannot influence each other's
   * sizing.
   *
   * @remarks
   * Intrinsic sizing and explicit dimensions work as expected. Avoid
   * parent-relative sizing (e.g. `flex: 1`) on the root element — it will
   * produce incorrect dimensions. Flex layout within a root that has a known
   * size works as expected.
   *
   * @platform android
   */
  render: () => ReactElement;
}

export interface StackHeaderBackgroundSubviewAndroid {
  /**
   * @summary Controls how the background subview behaves when the app bar
   * collapses.
   *
   * The following values are available:
   * - `off` - the subview scrolls away with the app bar,
   * - `parallax` - the subview scrolls at a slower rate, creating a parallax
   *   effect.
   *
   * @remarks
   * `pin` is not currently supported because the background subview is
   * stretched to match the entire `AppBarLayout`, which causes pinned content
   * to move immediately rather than staying fixed. Support for `pin` collapse
   * mode might be added in the future.
   *
   * @default off
   *
   * @platform android
   */
  collapseMode?: StackHeaderSubviewCollapseModeAndroid | undefined;
  /**
   * @summary Render callback for the React element used as the header
   * background.
   *
   * @remarks
   * The subview is stretched to match the header (`AppBarLayout`) dimensions,
   * so parent-relative sizing (e.g. `flex: 1`) works correctly.
   *
   * @platform android
   */
  render: () => ReactElement;
}

export type StackHeaderToolbarMenuItemShowAsActionAndroid =
  | 'always'
  | 'alwaysWithText'
  | 'ifRoom'
  | 'ifRoomWithText'
  | 'never';

export interface StackHeaderToolbarMenuItemAndroid {
  /**
   * @summary Unique identifier of the menu item.
   *
   * @platform android
   */
  id: string;
  /**
   * @summary Title of the menu item.
   *
   * @platform android
   */
  title?: string | undefined;
  /**
   * @summary Specifies if the menu item should be hidden.
   *
   * @default false
   * @platform android
   */
  hidden?: boolean | undefined;
  /**
   * @summary Specifies whether the item should be displayed as a button in the
   * Toolbar.
   *
   * The following values are available:
   * - `always` - always displays the item as a button in the Toolbar,
   * - `alwaysWithText` - always displays the item as a button in the Toolbar,
   *   forcing the text label to be visible even if an icon is provided,
   * - `ifRoom` - displays the item as a button in the Toolbar only if the
   *   system determines there is sufficient space,
   * - `ifRoomWithText` - displays the item as a button in the Toolbar if the
   *   system determines there is sufficient space, forcing the text label to
   *   be visible even if an icon is provided,
   * - `never` - never displays the item as a button in the Toolbar; it will be
   *   placed in the overflow menu instead.
   *
   * @remarks
   * Due to native limitations, the width limit for the `ifRoom` options is
   * determined during the initial render and will not adapt to subsequent layout
   * or orientation changes.
   *
   * @default never
   * @platform android
   */
  showAsAction?: StackHeaderToolbarMenuItemShowAsActionAndroid | undefined;
  /**
   * @summary Specifies the icon for the menu item.
   *
   * Supported values:
   * - `{ type: 'imageSource', uri }`
   *   Uses an image from the provided URI.
   *
   *   Remarks: `imageSource` type doesn't support SVGs on Android.
   *   For loading SVGs use `drawableResource` type.
   *
   * - `{ type: 'drawableResource', name }`
   *   Uses a drawable resource with the given name.
   *
   *   Remarks: Requires passing a drawable to resources via Android Studio.
   *
   * @remarks
   * The icon will be visible only if the menu item is shown in the Toolbar.
   *
   * @platform android
   */
  icon?: PlatformIconAndroid | undefined;
  /**
   * @summary Specifies the tint color to apply to the menu item icon.
   *
   * @platform android
   */
  iconTintColorNormal?: string | undefined;
  /**
   * @summary Specifies the tint color to apply to the menu item icon when item
   * is pressed.
   *
   * @remarks
   * Due to native platform limitations, if you set this prop, you must also
   * provide `iconTintColorNormal`. Otherwise, the icon will become transparent.
   *
   * @platform android
   */
  iconTintColorPressed?: string | undefined;
  /**
   * @summary Specifies the tint color to apply to the menu item icon when item
   * is focused (e.g. by keyboard navigation).
   *
   * @remarks
   * Due to native platform limitations, if you set this prop, you must also
   * provide `iconTintColorNormal`. Otherwise, the icon will become transparent.
   *
   * @platform android
   */
  iconTintColorFocused?: string | undefined;
  /**
   * @summary Specifies the tint color to apply to the menu item icon when item
   * is disabled.
   *
   * @remarks
   * Disabling menu item isn't currently supported.
   *
   * Due to native platform limitations, if you set this prop, you must also
   * provide `iconTintColorNormal`. Otherwise, the icon will become transparent.
   *
   * @platform android
   */
  iconTintColorDisabled?: string | undefined;
}

export type StackHeaderToolbarMenuItemClickedEventPayload = {
  /**
   * @summary ID of the clicked menu item.
   */
  id: string;
};

export type StackHeaderToolbarMenuItemOptionsAndroid = Partial<
  Omit<StackHeaderToolbarMenuItemAndroid, 'id'>
>;

export interface StackHeaderConfigCommandsAndroid {
  /**
   * @summary Allows to change menu item configuration in runtime.
   *
   * @param id The ID of the menu item which will be updated.
   * @param options Object with properties that should be changed. If property
   *        is omitted, the current value will be preserved. If property is
   *        explicitly set to `undefined`, the default value of the prop will be
   *        restored.
   */
  setToolbarMenuItemOptions: (
    id: string,
    options: StackHeaderToolbarMenuItemOptionsAndroid,
  ) => void;
}

export interface StackHeaderConfigPropsAndroid {
  /**
   * @summary Specifies the type of the Material 3 app bar.
   *
   * The following values are available:
   * - `small` - small app bar with fixed title,
   * - `medium` - medium app bar with collapsing title,
   * - `large` - large app bar with collapsing title.
   *
   * @remarks
   * M3 Expressive headers aren't currently supported (there is no stable
   * `MDC-Android` version yet).
   *
   * @see {@link https://m3.material.io/components/app-bars/overview|Material Design 3: App bars}
   *
   * @default small
   *
   * @platform android
   */
  type?: StackHeaderTypeAndroid | undefined;
  /**
   * @summary Custom view rendered behind the header content.
   *
   * @platform android
   */
  backgroundSubview?: StackHeaderBackgroundSubviewAndroid | undefined;
  /**
   * @summary Custom view placed in the leading (start) slot of the toolbar.
   *
   * @platform android
   */
  leadingSubview?: StackHeaderToolbarSubviewAndroid | undefined;
  /**
   * @summary Custom view placed in the center slot of the toolbar.
   *
   * @platform android
   */
  centerSubview?: StackHeaderToolbarSubviewAndroid | undefined;
  /**
   * @summary Custom view placed in the trailing (end) slot of the toolbar.
   *
   * @platform android
   */
  trailingSubview?: StackHeaderToolbarSubviewAndroid | undefined;
  /**
   * @summary Tint color applied to the back button icon in its normal state.
   *
   * When `undefined`, the default tint color is used. This applies to the
   * native back arrow and `drawableResource` icons that have an associated
   * tint. For `imageSource` icons, no tint is applied by default.
   *
   * @platform android
   */
  backButtonTintColorNormal?: string | undefined;
  /**
   * @summary Tint color applied to the back button icon when it is pressed.
   *
   * @remarks
   * Due to native platform limitations, if you set this prop, you must also
   * provide `backButtonTintColorNormal`. Otherwise, the icon will become
   * transparent.
   *
   * @platform android
   */
  backButtonTintColorPressed?: string | undefined;
  /**
   * @summary Tint color applied to the back button icon when it is focused
   * (e.g. by keyboard navigation).
   *
   * @remarks
   * Due to native platform limitations, if you set this prop, you must also
   * provide `backButtonTintColorNormal`. Otherwise, the icon will become
   * transparent.
   *
   * @platform android
   */
  backButtonTintColorFocused?: string | undefined;
  /**
   * @summary Custom icon for the back button.
   *
   * When `undefined`, the native back arrow (`homeAsUpIndicator`) is used.
   *
   * Supported values:
   * - `{ type: 'imageSource', uri }`
   *   Uses an image from the provided URI.
   *
   *   Remarks: `imageSource` type doesn't support SVGs on Android.
   *   For loading SVGs use `drawableResource` type.
   *
   * - `{ type: 'drawableResource', name }`
   *   Uses a drawable resource with the given name.
   *
   *   Remarks: Requires passing a drawable to resources via Android Studio.
   *
   * @platform android
   */
  backButtonIcon?: PlatformIconAndroid | undefined;
  /**
   * @summary Whether the header reacts to nested scroll. Required for any
   * other `scrollFlag*` prop to take effect.
   *
   * When `undefined`, falls back to the type-specific default:
   * - `small` -> `false`
   * - `medium` / `large` -> `true`
   *
   * @remarks
   * Changing any `scrollFlag*` at runtime forces the header back to
   * its fully expanded state, which produces a visible snap. Treat these
   * props as a static configuration.
   *
   * @platform android
   */
  scrollFlagScroll?: boolean | undefined;
  /**
   * @summary When enabled, the header re-expands as soon as the user scrolls
   * back toward the top of the content, regardless of the ScrollView's current
   * scroll position. Without this flag, the header only begins expanding once
   * the list has reached the top of its content. Requires `scrollFlagScroll`.
   *
   * When `undefined`, falls back to the type-specific default (`false` for
   * all types).
   *
   * @platform android
   */
  scrollFlagEnterAlways?: boolean | undefined;
  /**
   * @summary Modifies `scrollFlagEnterAlways` so that the initial re-entry
   * stops at the header's collapsed height (the toolbar); the remainder
   * expands only after the ScrollView reaches the top of its content. Requires
   * `scrollFlagEnterAlways`.
   *
   * When `undefined`, falls back to the type-specific default (`false` for
   * all types).
   *
   * @remarks
   * This flag does not have any effect for `small` header.
   *
   * @platform android
   */
  scrollFlagEnterAlwaysCollapsed?: boolean | undefined;
  /**
   * @summary When enabled, the header collapses only until its minimum height
   * (the toolbar) remains pinned at the top. Without this flag, the entire
   * header scrolls off the screen. Requires `scrollFlagScroll`.
   *
   * When `undefined`, falls back to the type-specific default:
   * - `small` -> `false`
   * - `medium` / `large` -> `true`
   *
   * @remarks
   * Setting this flag for `small` header is equivalent to disabling
   * `scrollFlagScroll`.
   *
   * Even when this flag is disabled, a strip with the height of the system top
   * inset (status bar and display cutout) remains visible at the top.
   *
   * @platform android
   */
  scrollFlagExitUntilCollapsed?: boolean | undefined;
  /**
   * @summary When enabled, the header snaps to its nearest edge (fully
   * expanded, or fully collapsed as defined by `scrollFlagExitUntilCollapsed`)
   * after a scroll gesture ends, instead of resting partway. Requires
   * `scrollFlagScroll`.
   *
   * When `undefined`, falls back to the type-specific default:
   * - `small` -> `false`
   * - `medium` / `large` -> `true`
   *
   * @platform android
   */
  scrollFlagSnap?: boolean | undefined;
  /**
   * @summary Menu items displayed in the toolbar menu.
   *
   * This prop serves as initial configuration of the toolbar menu items. If you
   * want to change some property in runtime, use `setToolbarMenuItemOptions`
   * view command.
   *
   * Changing this prop in runtime will result in full toolbar menu rebuild.
   * Any prior changes applied via `setToolbarMenuItemOptions` will be lost.
   *
   * @platform android
   */
  toolbarMenuItems?: StackHeaderToolbarMenuItemAndroid[] | undefined;
  /**
   * @summary Callback invoked when a toolbar menu item is clicked.
   *
   * @platform android
   */
  onToolbarMenuItemClicked?:
    | Lynx.EventHandler<
        Lynx.BaseEventOrig<StackHeaderToolbarMenuItemClickedEventPayload>
      >
    | undefined;
}

export interface StackHeaderMenuItem {
  type: 'menuItem';
  title?: string | undefined;
}

export interface StackHeaderMenu {
  type: 'menu';
  title?: string | undefined;
  children: StackHeaderMenuElement[];
}

export type StackHeaderMenuElement = StackHeaderMenu | StackHeaderMenuItem;

export interface StackHeaderBaseItemIOS {
  key: string;
  label?: string | undefined;
}

export interface StackHeaderInlineItemIOS extends StackHeaderBaseItemIOS {
  type: 'item';
  menu?: StackHeaderMenu | undefined;
}

export interface StackHeaderInlineCustomItemIOS {
  key: string;
  type: 'item';
  render: () => ReactElement;
  menu?: StackHeaderMenu | undefined;
}

interface StackHeaderFixedSpacerItemIOS {
  key: string;
  type: 'spacer';
  sizing: 'fixed';
  width: number;
}

interface StackHeaderFlexibleSpacerItemIOS {
  key: string;
  type: 'spacer';
  sizing: 'flexible';
}

export type StackHeaderSpacerItemIOS =
  | StackHeaderFixedSpacerItemIOS
  | StackHeaderFlexibleSpacerItemIOS;

export interface StackHeaderTitleCustomItemIOS {
  key: string;
  render: () => ReactElement;
}

export interface StackHeaderConfigPropsIOS {
  subtitleItem?: StackHeaderTitleCustomItemIOS | undefined;
  leadingItems?:
    | (
        | StackHeaderInlineItemIOS
        | StackHeaderInlineCustomItemIOS
        | StackHeaderSpacerItemIOS
      )[]
    | undefined;
  titleItem?: StackHeaderTitleCustomItemIOS | undefined;
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
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface StackHeaderConfigCommandsIOS {}

export interface StackHeaderConfigPropsBase {
  /**
   * @summary Title displayed in the header.
   *
   * @platform android, ios
   */
  title?: string | undefined;
  /**
   * @summary Subtitle displayed in the header. Currently unsupported on Android.
   *
   * @platform ios
   */
  subtitle?: string | undefined;
  /**
   * @summary Specifies if the header should be hidden.
   *
   * @default false
   *
   * @platform android, ios
   */
  hidden?: boolean | undefined;
  /**
   * @summary Specifies if the content should be rendered behind the header.
   *
   * When `true`, content is rendered behind the header instead of starting
   * below it.
   *
   * On Android:
   * - The header background color is not affected by this prop.
   * - Setting this prop to `true` is not supported when header scrolling is
   *   enabled.
   *
   * @default false
   *
   * @platform android, ios
   */
  transparent?: boolean | undefined;
  /**
   * @summary Specifies if the back button should be hidden.
   *
   * This prop does not apply to the root screen of the stack for which the back
   * button is always hidden.
   *
   * @default false
   *
   * @platform android, ios
   */
  backButtonHidden?: boolean | undefined;
}

export interface StackHeaderConfigProps extends StackHeaderConfigPropsBase {
  android?: StackHeaderConfigPropsAndroid | undefined;
  ios?: StackHeaderConfigPropsIOS | undefined;
}

export interface StackHeaderConfigRef {
  android?: StackHeaderConfigCommandsAndroid;
  ios?: StackHeaderConfigCommandsIOS;
}

export type StackHeaderSubviewProps = {
  children: NonNullable<ReactNode>;

  type?: StackHeaderSubviewTypeAndroid | undefined;
  collapseMode?: StackHeaderSubviewCollapseModeAndroid | undefined;
};
