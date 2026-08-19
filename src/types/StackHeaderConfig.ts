import type { ReactElement, ReactNode } from '@lynx-js/react';

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

export interface StackHeaderToolbarMenuItemBaseAndroid {
  /**
   * @summary Unique identifier of the menu element.
   *
   * @platform android
   */
  id: string;
  /**
   * @summary Title of the menu element.
   *
   * @platform android
   */
  title?: string | undefined;
  /**
   * @summary Specifies if the menu element should be hidden.
   *
   * @default false
   * @platform android
   */
  hidden?: boolean | undefined;
  /**
   * @summary Specifies whether the element should be displayed as a button in
   * the Toolbar.
   *
   * @description
   * The following values are available:
   * - `always` - always displays the element as a button in the Toolbar,
   * - `alwaysWithText` - always displays the element as a button in the
   *   Toolbar, forcing the text label to be visible even if an icon is
   *   provided,
   * - `ifRoom` - displays the element as a button in the Toolbar only if the
   *   system determines there is sufficient space,
   * - `ifRoomWithText` - displays the element as a button in the Toolbar if
   *   the system determines there is sufficient space, forcing the text label
   *   to be visible even if an icon is provided,
   * - `never` - never displays the element as a button in the Toolbar; it
   *   will be placed in the overflow menu instead.
   *
   * @remarks
   * Due to native limitations, the width limit for the `ifRoom` options is
   * determined during the initial render and will not adapt to subsequent
   * layout or orientation changes.
   *
   * @default never
   * @platform android
   */
  showAsAction?: StackHeaderToolbarMenuItemShowAsActionAndroid | undefined;
  /**
   * @summary Specifies the icon for the menu element.
   *
   * @description
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
   * The icon will be visible only if the menu element is shown in the
   * Toolbar.
   *
   * @platform android
   */
  icon?: PlatformIconAndroid | undefined;
  /**
   * @summary Specifies the tint color to apply to the menu element icon.
   *
   * @platform android
   */
  iconTintColorNormal?: string | undefined;
  /**
   * @summary Specifies the tint color to apply to the menu element icon when
   * it is pressed.
   *
   * @remarks
   * Due to native platform limitations, if you set this prop, you must also
   * provide `iconTintColorNormal`. Otherwise, the icon will become
   * transparent.
   *
   * @platform android
   */
  iconTintColorPressed?: string | undefined;
  /**
   * @summary Specifies the tint color to apply to the menu element icon when
   * it is focused (e.g. by keyboard navigation).
   *
   * @remarks
   * Due to native platform limitations, if you set this prop, you must also
   * provide `iconTintColorNormal`. Otherwise, the icon will become
   * transparent.
   *
   * @platform android
   */
  iconTintColorFocused?: string | undefined;
  /**
   * @summary Specifies the tint color to apply to the menu element icon when
   * it is disabled.
   *
   * @remarks
   * Disabling menu elements isn't currently supported.
   *
   * Due to native platform limitations, if you set this prop, you must also
   * provide `iconTintColorNormal`. Otherwise, the icon will become
   * transparent.
   *
   * @platform android
   */
  iconTintColorDisabled?: string | undefined;
}

export type StackHeaderToolbarMenuItemTypeAndroid =
  | 'action'
  | 'toggle'
  | 'automatic';

export interface StackHeaderToolbarMenuItemAndroid
  extends StackHeaderToolbarMenuItemBaseAndroid {
  /**
   * @summary Marks this object as a menu item.
   *
   * @platform android
   */
  type: 'menuItem';
  /**
   * @summary Assigns this item to a group.
   *
   * @description
   * Groups enable selection behavior (single-selection / radio, or
   * multi-toggle). A group is scoped to the menu level it is defined
   * in — groups cannot span submenus.
   *
   * Required when `itemType` is `toggle`. Cannot be set when
   * `itemType` is `action`.
   *
   * @platform android
   */
  groupId?: string | undefined;
  /**
   * @summary Controls how the item behaves when clicked.
   *
   * @description
   * The following values are available:
   * - `action` - the item fires `onPress` without any toggle state,
   * - `toggle` - the item is checkable; requires `groupId`,
   * - `automatic` - the item becomes checkable if it has a `groupId`,
   *   otherwise it behaves as an action.
   *
   * @remarks
   * If `toggle` menu item is shown in the toolbar by setting `showAsAction`
   * prop to value other than `never`, there is no visual indication of the item
   * toggle state.
   *
   * @default automatic
   * @platform android
   */
  itemType?: StackHeaderToolbarMenuItemTypeAndroid | undefined;
  /**
   * @summary Initial checked state for toggle items.
   *
   * @description
   * Only meaningful when effective `itemType` is `toggle`.
   *
   * @remarks
   * The initial state does not trigger `onSelectionChange` on
   * the group at mount time.
   *
   * @default false
   * @platform android
   */
  initialToggleState?: boolean | undefined;
  /**
   * @summary Callback invoked when the menu item is pressed.
   *
   * @remarks
   * Not called for items that behave as toggles (items with a
   * `groupId` or `itemType: 'toggle'`). For those items, use
   * `onSelectionChange` on the group instead.
   *
   * @platform android
   */
  onPress?: (() => void) | undefined;
}

export interface StackHeaderToolbarMenuGroupAndroid {
  /**
   * @summary Unique identifier of the group.
   *
   * @description
   * Groups enable selection behavior (single-selection / radio, or
   * multi-toggle). A group is scoped to the menu level it is defined
   * in — groups cannot span submenus.
   *
   * Group identifier must be unique across the entire menu tree.
   *
   * @platform android
   */
  groupId: string;
  /**
   * @summary Determines the type of selection in the group.
   *
   * @description
   * When `true`, only one item in the group can be selected
   * at a time (radio behavior). When `false`, items toggle
   * independently (checkbox behavior).
   *
   * @default false
   * @platform android
   */
  singleSelection?: boolean | undefined;
  /**
   * @summary Callback invoked when the selection within the group
   * changes. Receives the list of currently selected item IDs.
   *
   * @platform android
   */
  onSelectionChange?: (selectedMenuElementIds: string[]) => void;
}

export interface StackHeaderToolbarMenuBaseAndroid {
  /**
   * @summary Group definitions for items in this menu level.
   *
   * @description
   * Groups enable selection behavior (single or multi-toggle) for
   * items that share the same `groupId`. A group is scoped to the
   * menu level it is defined in — groups cannot span submenus.
   *
   * @platform android
   */
  groups?: StackHeaderToolbarMenuGroupAndroid[] | undefined;
  /**
   * @summary Menu elements displayed in the toolbar menu.
   *
   * @platform android
   */
  children?: StackHeaderToolbarMenuElementAndroid[];
}

export interface StackHeaderToolbarMenuAndroid
  extends StackHeaderToolbarMenuItemBaseAndroid,
    StackHeaderToolbarMenuBaseAndroid {
  /**
   * @summary Marks this object as a submenu.
   *
   * @remarks
   * Android's `MenuItem` interface claims that nesting submenus isn't supported
   * but Material's implementation handles it correctly.
   *
   * @platform android
   */
  type: 'menu';
}

export type StackHeaderToolbarMenuElementAndroid =
  | StackHeaderToolbarMenuItemAndroid
  | StackHeaderToolbarMenuAndroid;

export type StackHeaderToolbarMenuItemOptionsAndroid = Partial<
  Omit<StackHeaderToolbarMenuItemBaseAndroid, 'id'>
> & {
  /**
   * @summary Sets the checked state of the menu item.
   *
   * @description
   * In single-selection groups, setting `checked: true`
   * automatically unchecks other group members.
   *
   * @platform android
   */
  checked?: boolean | undefined;
};

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
   * @summary Toolbar menu configuration.
   *
   * @description
   * This prop serves as initial configuration of the toolbar menu. If you
   * want to change some property in runtime, use `setToolbarMenuItemOptions`
   * view command.
   *
   * Changing this prop in runtime will result in full toolbar menu rebuild.
   * Any prior changes applied via `setToolbarMenuItemOptions` will be lost.
   *
   * @platform android
   */
  toolbarMenu?: StackHeaderToolbarMenuBaseAndroid | undefined;
  /**
   * @summary Enables visual dividers between menu groups.
   *
   * @remarks
   * Requires API 28 (Android 9). On earlier versions, the value of this prop is
   * ignored.
   *
   * @default false
   * @platform android
   * @supported API 28 or higher
   */
  toolbarMenuGroupDividerEnabled?: boolean | undefined;
}

/**
 * @summary Represents a single actionable item inside a {@link StackHeaderMenuIOS} menu.
 *
 * @description
 * A menu item is a leaf element that the user can interact with.
 * Depending on its {@link StackHeaderMenuItemIOS.itemType | itemType}, the item
 * behaves as a one-shot action or a stateful toggle.
 *
 * @platform ios
 */
export interface StackHeaderMenuItemIOS {
  /**
   * @summary Unique identifier of the menu item.
   *
   * @description
   * Used to locate the item inside a menu tree and to identify selected items
   * in {@link StackHeaderMenuIOS.onSelectionChange} callback.
   *
   * @platform ios
   */
  id: string;
  /**
   * @summary Marks this object as a menu item definition.
   *
   * @platform ios
   */
  type: 'menuItem';
  /**
   * @summary Title displayed for the menu item.
   *
   * @platform ios
   */
  title?: string | undefined;
  /**
   * @summary Determines the behavior of the menu item.
   *
   * @description
   * The following values are available:
   * - `action` - a button that fires {@link StackHeaderMenuItemIOS.onPress | onPress}
   *   when tapped. Cannot be used inside a `singleSelection` menu.
   * - `toggle` - a stateful item whose on/off state is tracked automatically.
   *   Toggle items do not fire `onPress`; instead, parent menu
   *   (or Single Selection Root in case of {@link StackHeaderMenuIOS.singleSelection | singleSelection})
   *   is passed currently selected items with {@link StackHeaderMenuIOS.onSelectionChange | onSelectionChange}
   * - `automatic` - resolved at render time: becomes `toggle` when the item is
   *   under `singleSelection` hierarchy, `action` otherwise.
   *
   * @default automatic
   *
   * @platform ios
   */
  itemType?: 'action' | 'toggle' | 'automatic' | undefined;
  /**
   * @summary Initial on/off state of a toggle item.
   *
   * @description
   * Only meaningful when {@link StackHeaderMenuItemIOS.itemType | itemType}
   * resolves to `toggle`. Inside a `singleSelection` hierarchy, at most one
   * item can set this to `true`.
   *
   * @default false
   *
   * @platform ios
   */
  initialToggleState?: boolean | undefined;
  /**
   * @summary Callback invoked when the menu item is pressed.
   *
   * @description
   * Fires only for items whose effective type is `action`. For toggle items,
   * this callback will not fire — use
   * {@link StackHeaderMenuIOS.onSelectionChange | onSelectionChange} on the
   * parent menu instead.
   *
   * @platform ios
   */
  onPress?: () => void | undefined;
}

/**
 * @summary Represents a menu (or submenu) that groups
 * {@link StackHeaderMenuElementIOS} children.
 *
 * @description
 * A menu is a container that can hold both leaf items
 * ({@link StackHeaderMenuItemIOS}) and nested menus. Set
 * {@link StackHeaderMenuIOS.singleSelection | singleSelection} to `true` to
 * make the menu behave like radio group across its entire hierarchy.
 *
 * Note: The topmost menu that enables this prop becomes Single Selection Root.
 * Only the root receives {@link StackHeaderMenuIOS.onSelectionChange | onSelectionChange}
 * event, with exactly one item id passed to the callback. Only one item may be selected,
 * across the whole hierarchy under Single Selection Root (even when mixing items and nested menus).
 * Previously selected item is deselected automatically.
 * Multiple Single Selection Roots may exist only if their hierarchy is completely separate.
 *
 * @platform ios
 */
export interface StackHeaderMenuIOS {
  /**
   * @summary Unique identifier of the menu.
   *
   * @description
   * Used to locate the menu inside a tree and as the reference when querying or
   * manipulating menu state.
   *
   * @platform ios
   */
  id: string;
  /**
   * @summary Marks this object as a menu definition.
   *
   * @platform ios
   */
  type: 'menu';
  /**
   * @summary Title displayed for the menu.
   *
   * @platform ios
   */
  title?: string | undefined;
  /**
   * @summary Enables single selection mode for this menu and its descendants.
   *
   * @description
   * The topmost menu with `singleSelection` enabled becomes Single Selection Root.
   * At most one toggle item in the entire hierarchy rooted at this
   * menu can be selected at a time.
   *
   * Items with `itemType` set to `automatic` are resolved to `toggle` inside a
   * `singleSelection` hierarchy. `action` items are disallowed.
   *
   * @default false
   * @platform ios
   */
  singleSelection?: boolean | undefined;
  /**
   * @summary Child elements of this menu.
   *
   * @description
   * Each child is either a {@link StackHeaderMenuItemIOS} (leaf) or another
   * {@link StackHeaderMenuIOS}, allowing arbitrarily nested menu trees.
   *
   * @platform ios
   */
  children: StackHeaderMenuElementIOS[];
  /**
   * @summary Callback invoked when the set of selected toggle items changes.
   *
   * @description
   * Receives an array of IDs of all currently selected toggle items in this
   * menu's hierarchy. For Single Selection Root, always returns one item.
   * When defined below Single Selection Root, the callback doesn't fire.
   * In regular non-single-selection case, only changes to direct children are reflected.
   *
   * @platform ios
   */
  onSelectionChange?: (selectedMenuElementIds: string[]) => void;
}

/**
 * @summary A menu element type.
 *
 * @description
 * A menu element is either a {@link StackHeaderMenuIOS | menu} (container with
 * children) or a {@link StackHeaderMenuItemIOS | menu item} (actionable leaf).
 *
 * @platform ios
 */
export type StackHeaderMenuElementIOS =
  | StackHeaderMenuIOS
  | StackHeaderMenuItemIOS;

export interface StackHeaderBaseItemIOS {
  id: string;
  title?: string | undefined;
}

export interface SupportsMenuIOS {
  menu?: StackHeaderMenuIOS | undefined;
}

export interface StackHeaderInlineItemIOS
  extends StackHeaderBaseItemIOS,
    SupportsMenuIOS {
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

export interface StackHeaderInlineCustomItemIOS extends SupportsMenuIOS {
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
