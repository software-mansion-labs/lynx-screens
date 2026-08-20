import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  type Ref,
} from '@lynx-js/react';
import type { BaseEventOrig, EventHandler, NodesRef } from '@lynx-js/types';
import type {
  PlatformIconAndroid,
  StackHeaderConfigProps,
  StackHeaderConfigPropsAndroid,
  StackHeaderConfigRef,
  StackHeaderInlineCustomItemIOS,
  StackHeaderInlineItemIOS,
  StackHeaderSpacerItemIOS,
  StackHeaderTitleCustomItemIOS,
  StackHeaderToolbarMenuBaseAndroid,
  StackHeaderToolbarMenuElementAndroid,
  StackHeaderToolbarMenuGroupAndroid,
  StackHeaderToolbarMenuItemAndroid,
  StackHeaderToolbarMenuItemBaseAndroid,
  StackHeaderMenuItemOptionsIOS,
  StackHeaderMenuOptionsIOS,
  StackHeaderToolbarMenuElementOptionsAndroid,
  StackHeaderToolbarMenuElementUpdateAndroid,
  StackHeaderTypeAndroid,
  SupportsMenuIOS,
} from '../types/StackHeaderConfig.js';
import { findMenuElementByIdInItems, validateMenuCallbacks } from './utils.js';
import { StackHeaderSubviewNativeComponent } from './StackHeaderSubviewNativeComponent.js';
import { parseAndroidIconToNativeProps } from '../shared/index.js';
import {
  StackHeaderItemNativeComponent,
  type StackHeaderItemPlacement,
} from './StackHeaderItemNativeComponent.js';
import {
  StackHeaderItemSpacerNativeComponent,
  type StackHeaderItemSpacerPlacement,
} from './StackHeaderItemSpacerNativeComponent.js';

// RNS splits the header config into platform files resolved at build time; a
// Lynx bundle serves both platforms, so the split happens at runtime instead.
const StackHeaderConfigNativeComponentInner = (
  props: StackHeaderConfigProps,
  forwardedRef: Ref<StackHeaderConfigRef>,
) =>
  SystemInfo.platform === 'iOS' ? (
    <StackHeaderConfigIOS {...props} forwardedRef={forwardedRef} />
  ) : (
    <StackHeaderConfigAndroid {...props} forwardedRef={forwardedRef} />
  );

type PlatformInnerProps = StackHeaderConfigProps & {
  forwardedRef: Ref<StackHeaderConfigRef>;
};

const StackHeaderConfigIOS = (props: PlatformInnerProps) => {
  // android props are safely dropped
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { android, ios, forwardedRef, ...baseProps } = props;

  const nativeRef = useRef<NodesRef>(null);

  useImperativeHandle(forwardedRef, () => ({
    ios: {
      setMenuItemOptions: (
        menuElementId: string,
        options: StackHeaderMenuItemOptionsIOS,
      ) => {
        if (!nativeRef.current) {
          console.warn(
            '[RNScreens] Reference to native header config component has not been updated yet.',
          );
          return;
        }
        // RNS dispatches a Fabric view command here; the Lynx counterpart is
        // a UI method invocation through the NodesRef.
        nativeRef.current
          .invoke({
            method: 'setMenuItemOptions',
            params: {
              menuElementId,
              options: parseMenuElementOptionsToNativeIOS(options),
            },
          })
          .exec();
      },
      setMenuOptions: (
        menuElementId: string,
        options: StackHeaderMenuOptionsIOS,
      ) => {
        if (!nativeRef.current) {
          console.warn(
            '[RNScreens] Reference to native header config component has not been updated yet.',
          );
          return;
        }
        nativeRef.current
          .invoke({
            method: 'setMenuOptions',
            params: {
              menuElementId,
              options: parseMenuElementOptionsToNativeIOS(options),
            },
          })
          .exec();
      },
    },
  }));

  const {
    leadingItems,
    trailingItems,
    titleItem,
    subtitleItem,
    largeSubtitleItem,
    largeTitle,
    largeSubtitle,
    largeTitleEnabled,
  } = ios ?? {};

  const handleMenuItemPress: EventHandler<
    BaseEventOrig<{ menuItemId: string }>
  > = useCallback(
    (event) => {
      const items: SupportsMenuIOS[] = Array.of(
        ...(leadingItems ?? []).filter((it) => it && it.type === 'item'),
        ...(trailingItems ?? []).filter((it) => it && it.type === 'item'),
      );
      const menuElement = findMenuElementByIdInItems(
        items,
        event.detail.menuItemId,
      );
      if (menuElement && menuElement.type === 'menuItem') {
        menuElement.onPress?.();
      }
    },
    [leadingItems, trailingItems],
  );

  const allMenuItems: SupportsMenuIOS[] = [
    ...(leadingItems ?? []),
    ...(trailingItems ?? []),
  ].filter((it) => it && it.type === 'item');

  const handleSelectionChange: EventHandler<
    BaseEventOrig<{ menuId: string; selectedMenuItemIds: string[] }>
  > = useCallback(
    (event) => {
      const { menuId, selectedMenuItemIds } = event.detail;
      const menu = findMenuElementByIdInItems(allMenuItems, menuId);
      if (menu && menu.type === 'menu') {
        menu.onSelectionChange?.(selectedMenuItemIds);
      }
    },
    [allMenuItems],
  );

  useEffect(() => {
    for (const item of allMenuItems) {
      if ('menu' in item && item.menu) {
        validateMenuCallbacks(item.menu);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leadingItems, trailingItems]);

  return (
    <ls-stack-header-config
      ref={nativeRef}
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
      }}
      {...baseProps}
      largeTitle={largeTitle}
      largeSubtitle={largeSubtitle}
      largeTitleEnabled={!!largeTitleEnabled}
      bindOnMenuItemPress={handleMenuItemPress}
      bindOnMenuSelectionChange={handleSelectionChange}
    >
      {leadingItems?.map((item) => makeItemViewFromItem(item, 'leading'))}
      {titleItem && makeItemViewFromItem(titleItem, 'title')}
      {subtitleItem && makeItemViewFromItem(subtitleItem, 'subtitle')}
      {largeSubtitleItem &&
        makeItemViewFromItem(largeSubtitleItem, 'largeSubtitle')}
      {trailingItems?.map((item) => makeItemViewFromItem(item, 'trailing'))}
    </ls-stack-header-config>
  );
};

function makeItemViewFromItem(
  item:
    | StackHeaderInlineItemIOS
    | StackHeaderInlineCustomItemIOS
    | StackHeaderTitleCustomItemIOS
    | StackHeaderSpacerItemIOS,
  placement: StackHeaderItemPlacement,
) {
  if ('type' in item && item.type === 'spacer') {
    const { id, ...rest } = item;

    if (!(placement === 'leading' || placement === 'trailing')) {
      console.warn(
        `[Stack] Invalid placement for spacer: "${placement}", defaulting to "trailing"`,
      );
      placement = 'trailing';
    }

    return (
      <StackHeaderItemSpacerNativeComponent
        key={id}
        placement={placement as StackHeaderItemSpacerPlacement}
        {...rest}
      />
    );
  }

  const { id, ...rest } = item;

  return (
    <StackHeaderItemNativeComponent
      key={id}
      itemId={id}
      placement={placement}
      {...rest}
    />
  );
}

const StackHeaderConfigAndroid = (props: PlatformInnerProps) => {
  // ios props are safely dropped
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { android, ios, forwardedRef, ...baseProps } = props;

  const ref = useHeaderConfigRef(forwardedRef);

  const {
    backgroundSubview,
    leadingSubview,
    centerSubview,
    trailingSubview,
    backButtonIcon,
    scrollFlagScroll,
    scrollFlagEnterAlways,
    scrollFlagEnterAlwaysCollapsed,
    scrollFlagExitUntilCollapsed,
    scrollFlagSnap,
    toolbarMenu,
    toolbarMenuGroupDividerEnabled,
    ...filteredAndroidProps
  } = android ?? {};

  const parsedToolbarMenu = parseToolbarMenuToNativeProps(toolbarMenu);
  const handleToolbarMenuItemPress: EventHandler<
    BaseEventOrig<{ id: string }>
  > = (event) => {
    const element = findToolbarMenuElementById(
      toolbarMenu?.children,
      event.detail.id,
    );
    if (element?.type === 'menuItem') {
      element.onPress?.();
    }
  };

  const handleToolbarMenuGroupSelectionChange: EventHandler<
    BaseEventOrig<{ groupId: string; selectedIds: string[] }>
  > = (event) => {
    const { groupId, selectedIds } = event.detail;
    const group = findToolbarMenuGroupById(toolbarMenu, groupId);
    group?.onSelectionChange?.(selectedIds);
  };

  const backButtonIconProps = parseBackButtonIconToNativeProps(backButtonIcon);
  const scrollFlagProps = resolveScrollFlags(filteredAndroidProps.type, {
    scrollFlagScroll,
    scrollFlagEnterAlways,
    scrollFlagEnterAlwaysCollapsed,
    scrollFlagExitUntilCollapsed,
    scrollFlagSnap,
  });

  return (
    <ls-stack-header-config
      ref={ref}
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
      }}
      {...baseProps}
      {...filteredAndroidProps}
      toolbarMenu={parsedToolbarMenu}
      toolbarMenuGroupDividerEnabled={!!toolbarMenuGroupDividerEnabled}
      bindOnToolbarMenuItemPress={handleToolbarMenuItemPress}
      bindOnToolbarMenuGroupSelectionChange={handleToolbarMenuGroupSelectionChange}
      {...backButtonIconProps}
      {...scrollFlagProps}
      hasBackgroundSubview={backgroundSubview != null}
    >
      {/*
        Please note that the order of the subviews MUST match
        the order in native StackHeaderConfigComponent.getConfigSubviewAt.
        */}
      {backgroundSubview && (
        <StackHeaderSubviewNativeComponent
          type="background"
          collapseMode={backgroundSubview.collapseMode}
        >
          {backgroundSubview.render()}
        </StackHeaderSubviewNativeComponent>
      )}
      {leadingSubview && (
        <StackHeaderSubviewNativeComponent type="leading">
          {leadingSubview.render()}
        </StackHeaderSubviewNativeComponent>
      )}
      {centerSubview && (
        <StackHeaderSubviewNativeComponent type="center">
          {centerSubview.render()}
        </StackHeaderSubviewNativeComponent>
      )}
      {trailingSubview && (
        <StackHeaderSubviewNativeComponent type="trailing">
          {trailingSubview.render()}
        </StackHeaderSubviewNativeComponent>
      )}
    </ls-stack-header-config>
  );
};

// Adaptation: RNS resolves require() icon assets via resolveAssetSources
// here; Lynx icons are plain uri objects and pass through as data.
function parseMenuElementOptionsToNativeIOS(
  options: StackHeaderMenuItemOptionsIOS | StackHeaderMenuOptionsIOS,
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(options).flatMap(([key, value]): [string, unknown][] => {
      if (
        key !== 'icon' &&
        typeof value === 'object' &&
        value !== null &&
        !Array.isArray(value)
      ) {
        throw new Error(`[RNScreens] Unexpected nested object.`);
      }

      return [
        [
          key,
          // We need to replace explicit `undefined` with `null`
          // so that we're able to read that information on the native side.
          value === undefined ? null : value,
        ],
      ];
    }),
  );
}

function useHeaderConfigRef(forwardedRef: Ref<StackHeaderConfigRef>) {
  const ref = useRef<NodesRef>(null);

  useImperativeHandle(forwardedRef, () => ({
    android: {
      updateToolbarMenuElements: (updates) => {
        if (!ref.current) {
          console.warn(
            '[RNScreens] Reference to native header config component has not been updated yet.',
          );
          return;
        }

        const updatesArray: StackHeaderToolbarMenuElementUpdateAndroid[] =
          Array.isArray(updates) ? updates : [updates];

        const nativeUpdates = updatesArray.map(({ id, options }) => ({
          id,
          ...parseToolbarMenuElementOptionsToParams(options),
        }));

        // RNS dispatches a Fabric view command here; the Lynx counterpart is
        // a UI method invocation through the NodesRef. NodesRef.invoke takes a
        // single params map, so the batch array travels under the "updates"
        // key.
        ref.current
          .invoke({
            method: 'updateToolbarMenuElements',
            params: {
              updates: nativeUpdates,
            },
          })
          .exec();
      },
    },
  }));

  return ref;
}

type StackHeaderToolbarMenuGroupAttr = {
  groupId: string;
  singleSelection?: boolean | undefined;
};

type StackHeaderToolbarMenuElementAttr = {
  type: 'menuItem' | 'menu';
  id: string;
  title?: string | undefined;
  titleCondensed?: string | undefined;
  tooltipText?: string | undefined;
  accessibilityLabel?: string | undefined;
  hidden?: boolean | undefined;
  disabled?: boolean | undefined;
  showAsAction?:
    | 'always'
    | 'alwaysWithText'
    | 'ifRoom'
    | 'ifRoomWithText'
    | 'never'
    | undefined;
  drawableIconResourceName?: string | undefined;
  imageIconUri?: string | undefined;
  iconTintColorNormal?: string | undefined;
  iconTintColorPressed?: string | undefined;
  iconTintColorFocused?: string | undefined;
  iconTintColorDisabled?: string | undefined;
  groupId?: string | undefined;
  itemType?: 'action' | 'toggle' | 'automatic' | undefined;
  initialToggleState?: boolean | undefined;
  menuTitle?: string | undefined;
  groups?: StackHeaderToolbarMenuGroupAttr[] | undefined;
  children?: StackHeaderToolbarMenuElementAttr[] | undefined;
};

function findToolbarMenuGroupById(
  menu: StackHeaderToolbarMenuBaseAndroid | undefined,
  groupId: string,
): StackHeaderToolbarMenuGroupAndroid | null {
  if (!menu) {
    return null;
  }
  for (const group of menu.groups ?? []) {
    if (group.groupId === groupId) {
      return group;
    }
  }
  for (const element of menu.children ?? []) {
    if (element.type === 'menu') {
      const found = findToolbarMenuGroupById(element, groupId);
      if (found) {
        return found;
      }
    }
  }
  return null;
}

function findToolbarMenuElementById(
  elements: StackHeaderToolbarMenuElementAndroid[] | undefined,
  id: string,
): StackHeaderToolbarMenuElementAndroid | null {
  if (!elements) {
    return null;
  }
  for (const element of elements) {
    if (element.id === id) {
      return element;
    }
    if (element.type === 'menu') {
      const found = findToolbarMenuElementById(element.children, id);
      if (found) {
        return found;
      }
    }
  }
  return null;
}

function parseToolbarMenuToNativeProps(
  menu: StackHeaderToolbarMenuBaseAndroid | undefined,
) {
  if (!menu?.children?.length) {
    return undefined;
  }
  assertUniqueItemIds(menu.children);
  assertUniqueGroupIds(menu);
  assertGroupIdReferencesExist(menu);
  assertRadioInitialSelection(menu);
  return {
    groups: parseGroupsToNativeProps(menu.groups),
    children: menu.children.map(parseElementToNativeProps),
  };
}

function parseGroupsToNativeProps(
  groups: StackHeaderToolbarMenuGroupAndroid[] | undefined,
) {
  if (!groups?.length) {
    return undefined;
  }
  return groups.map(({ groupId, singleSelection }) => ({
    groupId,
    singleSelection,
  }));
}

function parseElementToNativeProps(
  element: StackHeaderToolbarMenuElementAndroid,
): StackHeaderToolbarMenuElementAttr {
  if (element.type === 'menu') {
    const { type, children, groups, ...baseProps } = element;
    return {
      type,
      ...parseBaseItemToNativeProps(baseProps),
      groups: parseGroupsToNativeProps(groups),
      children: children?.map(parseElementToNativeProps),
    };
  }

  assertItemTypeGroupIdConsistency(element);
  assertNoOnPressOnToggleItem(element);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { type, onPress, groupId, itemType, initialToggleState, ...baseProps } =
    element;
  return {
    type,
    groupId,
    itemType,
    initialToggleState,
    ...parseBaseItemToNativeProps(baseProps),
  };
}

function assertUniqueItemIds(
  elements: StackHeaderToolbarMenuElementAndroid[],
  seen: Set<string> = new Set(),
): void {
  for (const element of elements) {
    if (seen.has(element.id)) {
      throw new Error(
        `[RNScreens] Duplicate toolbar menu item id: '${element.id}'. ` +
          `Item IDs must be unique across the entire menu.`,
      );
    }
    seen.add(element.id);
    if (element.type === 'menu' && element.children) {
      assertUniqueItemIds(element.children, seen);
    }
  }
}

function assertUniqueGroupIds(
  menu: StackHeaderToolbarMenuBaseAndroid,
  seen: Set<string> = new Set(),
): void {
  if (menu.groups) {
    for (const group of menu.groups) {
      if (seen.has(group.groupId)) {
        throw new Error(
          `[RNScreens] Duplicate toolbar menu group id: '${group.groupId}'. ` +
            `Group IDs must be unique across the entire menu.`,
        );
      }
      seen.add(group.groupId);
    }
  }
  if (menu.children) {
    for (const element of menu.children) {
      if (element.type === 'menu') {
        assertUniqueGroupIds(element, seen);
      }
    }
  }
}

function assertGroupIdReferencesExist(
  menu: StackHeaderToolbarMenuBaseAndroid,
): void {
  const localGroupIds = new Set(menu.groups?.map((g) => g.groupId));
  if (menu.children) {
    for (const element of menu.children) {
      if (element.type === 'menuItem' && element.groupId != null) {
        if (!localGroupIds.has(element.groupId)) {
          throw new Error(
            `[RNScreens] Menu item '${element.id}' references group ` +
              `'${element.groupId}' which is not defined at the same ` +
              `menu level. Groups cannot span submenus.`,
          );
        }
      }
      if (element.type === 'menu') {
        assertGroupIdReferencesExist(element);
      }
    }
  }
}

function assertRadioInitialSelection(
  menu: StackHeaderToolbarMenuBaseAndroid,
): void {
  if (menu.groups && menu.children) {
    for (const group of menu.groups) {
      if (!group.singleSelection) {
        continue;
      }
      let count = 0;
      for (const element of menu.children) {
        if (
          element.type === 'menuItem' &&
          element.groupId === group.groupId &&
          element.initialToggleState
        ) {
          count++;
        }
      }
      if (count > 1) {
        throw new Error(
          `[RNScreens] Radio group '${group.groupId}' has ${count} items ` +
            `with initialToggleState=true. At most 1 is allowed for ` +
            `single-selection groups.`,
        );
      }
    }
  }
  if (menu.children) {
    for (const element of menu.children) {
      if (element.type === 'menu') {
        assertRadioInitialSelection(element);
      }
    }
  }
}

function assertItemTypeGroupIdConsistency(
  element: StackHeaderToolbarMenuItemAndroid,
): void {
  if (element.itemType === 'toggle' && element.groupId == null) {
    throw new Error(
      `[RNScreens] Menu item '${element.id}' has itemType='toggle' ` +
        `but no groupId. Toggle items must belong to a group.`,
    );
  }

  if (element.itemType === 'action' && element.groupId != null) {
    throw new Error(
      `[RNScreens] Menu item '${element.id}' has itemType='action' ` +
        `and belongs to group '${element.groupId}'. ` +
        `Action items cannot belong to groups.`,
    );
  }
}

function assertNoOnPressOnToggleItem(
  element: StackHeaderToolbarMenuItemAndroid,
): void {
  if (!element.onPress) {
    return;
  }

  const effectiveItemType = element.itemType ?? 'automatic';

  if (effectiveItemType === 'toggle') {
    throw new Error(
      `[RNScreens] Menu item '${element.id}' has itemType='toggle' and defines onPress. ` +
        `Toggle items do not emit press events. Use onSelectionChange on the group instead.`,
    );
  }

  if (effectiveItemType === 'automatic' && element.groupId != null) {
    throw new Error(
      `[RNScreens] Menu item '${element.id}' belongs to group '${element.groupId}' ` +
        `and defines onPress. Items in a group behave as toggles and do not emit press events. ` +
        `Use onSelectionChange on the group instead.`,
    );
  }
}

function parseBaseItemToNativeProps({
  icon,
  ...rest
}: Omit<StackHeaderToolbarMenuItemBaseAndroid, 'children' | 'type'>) {
  // RNS additionally routes the tint colors through processColor; on Lynx the
  // CSS color strings are parsed natively.
  return {
    ...rest,
    ...parseAndroidIconToNativeProps(icon),
  };
}

function parseToolbarMenuElementOptionsToParams(
  options: StackHeaderToolbarMenuElementOptionsAndroid,
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(options).flatMap(([key, value]): [string, unknown][] => {
      if (key === 'icon') {
        const iconValue =
          value as StackHeaderToolbarMenuElementOptionsAndroid['icon'];

        // Explicit `undefined` means "reset the icon". The native side treats
        // an absent key as "no change", so to clear the icon we must send every
        // native icon key explicitly as `null`.
        if (iconValue === undefined) {
          return [
            ['imageIconUri', null],
            ['drawableIconResourceName', null],
          ];
        }

        return Object.entries(parseAndroidIconToNativeProps(iconValue));
      }

      if (
        typeof value === 'object' &&
        value !== null &&
        !Array.isArray(value)
      ) {
        throw new Error(`[RNScreens] Unexpected nested object.`);
      }

      return [
        [
          key,
          // We need to replace explicit `undefined` with `null`
          // so that we're able to read that information on the native side.
          value === undefined ? null : value,
        ],
      ];
    }),
  );
}

function parseBackButtonIconToNativeProps(
  icon: PlatformIconAndroid | undefined,
): {
  backButtonImageIconUri?: string | undefined;
  backButtonDrawableIconResourceName?: string | undefined;
} {
  if (!icon) {
    return {};
  }

  if (icon.type === 'imageSource') {
    return {
      backButtonImageIconUri: icon.uri,
    };
  } else if (icon.type === 'drawableResource') {
    return {
      backButtonDrawableIconResourceName: icon.name,
    };
  } else {
    throw new Error(
      '[RNScreens] Incorrect icon format for Android. You must provide `imageSource` or `drawableResource`.',
    );
  }
}

type ScrollFlagFields = {
  scrollFlagScroll: boolean;
  scrollFlagEnterAlways: boolean;
  scrollFlagEnterAlwaysCollapsed: boolean;
  scrollFlagExitUntilCollapsed: boolean;
  scrollFlagSnap: boolean;
};

const SCROLL_FLAG_DEFAULTS_BY_TYPE: Record<
  StackHeaderTypeAndroid,
  ScrollFlagFields
> = {
  small: {
    scrollFlagScroll: false,
    scrollFlagEnterAlways: false,
    scrollFlagEnterAlwaysCollapsed: false,
    scrollFlagExitUntilCollapsed: false,
    scrollFlagSnap: false,
  },
  medium: {
    scrollFlagScroll: true,
    scrollFlagEnterAlways: false,
    scrollFlagEnterAlwaysCollapsed: false,
    scrollFlagExitUntilCollapsed: true,
    scrollFlagSnap: true,
  },
  large: {
    scrollFlagScroll: true,
    scrollFlagEnterAlways: false,
    scrollFlagEnterAlwaysCollapsed: false,
    scrollFlagExitUntilCollapsed: true,
    scrollFlagSnap: true,
  },
};

function resolveScrollFlags(
  type: StackHeaderTypeAndroid | undefined,
  overrides: Pick<StackHeaderConfigPropsAndroid, keyof ScrollFlagFields>,
): ScrollFlagFields {
  const defaults = SCROLL_FLAG_DEFAULTS_BY_TYPE[type ?? 'small'];
  return {
    scrollFlagScroll: overrides.scrollFlagScroll ?? defaults.scrollFlagScroll,
    scrollFlagEnterAlways:
      overrides.scrollFlagEnterAlways ?? defaults.scrollFlagEnterAlways,
    scrollFlagEnterAlwaysCollapsed:
      overrides.scrollFlagEnterAlwaysCollapsed ??
      defaults.scrollFlagEnterAlwaysCollapsed,
    scrollFlagExitUntilCollapsed:
      overrides.scrollFlagExitUntilCollapsed ??
      defaults.scrollFlagExitUntilCollapsed,
    scrollFlagSnap: overrides.scrollFlagSnap ?? defaults.scrollFlagSnap,
  };
}

export const StackHeaderConfigNativeComponent = forwardRef<
  StackHeaderConfigRef,
  StackHeaderConfigProps
>(StackHeaderConfigNativeComponentInner);
