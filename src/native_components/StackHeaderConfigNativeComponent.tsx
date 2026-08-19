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
  StackHeaderToolbarMenuItemBaseAndroid,
  StackHeaderToolbarMenuItemOptionsAndroid,
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

  // No iOS commands exist yet, but resolve the ref so consumers can hold it.
  useImperativeHandle(forwardedRef, () => ({}));

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
      bindOnToolbarMenuItemPress={handleToolbarMenuItemPress}
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

function useHeaderConfigRef(forwardedRef: Ref<StackHeaderConfigRef>) {
  const ref = useRef<NodesRef>(null);

  useImperativeHandle(forwardedRef, () => ({
    android: {
      setToolbarMenuItemOptions: (id, options) => {
        if (!ref.current) {
          console.warn(
            '[RNScreens] Reference to native header config component has not been updated yet.',
          );
          return;
        }

        // RNS dispatches a Fabric view command here; the Lynx counterpart is
        // a UI method invocation through the NodesRef.
        ref.current
          .invoke({
            method: 'setToolbarMenuItemOptions',
            params: {
              id,
              options: parseToolbarMenuItemOptionsToParams(options),
            },
          })
          .exec();
      },
    },
  }));

  return ref;
}

type StackHeaderToolbarMenuElementAttr = {
  type: 'menuItem' | 'menu';
  id: string;
  title?: string | undefined;
  hidden?: boolean | undefined;
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
  children?: StackHeaderToolbarMenuElementAttr[] | undefined;
};

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
  return {
    children: menu.children.map(parseElementToNativeProps),
  };
}

function parseElementToNativeProps(
  element: StackHeaderToolbarMenuElementAndroid,
): StackHeaderToolbarMenuElementAttr {
  if (element.type === 'menu') {
    const { type, children, ...baseProps } = element;
    return {
      type,
      ...parseBaseItemToNativeProps(baseProps),
      children: children?.map(parseElementToNativeProps),
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { type, onPress, ...baseProps } = element;
  return {
    type,
    ...parseBaseItemToNativeProps(baseProps),
  };
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

function parseToolbarMenuItemOptionsToParams(
  options: StackHeaderToolbarMenuItemOptionsAndroid,
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(options).flatMap(([key, value]): [string, unknown][] => {
      if (key === 'icon') {
        const iconValue =
          value as StackHeaderToolbarMenuItemOptionsAndroid['icon'];

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
