import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  type Ref,
} from '@lynx-js/react';
import type { BaseEventOrig, EventHandler, NodesRef } from '@lynx-js/types';
import type {
  StackHeaderConfigProps,
  StackHeaderConfigRef,
} from './StackHeaderConfig.types.js';
import type {
  StackHeaderInlineCustomItemIOS,
  StackHeaderInlineItemIOS,
  StackHeaderSpacerItemIOS,
  StackHeaderTitleCustomItemIOS,
  StackHeaderMenuItemOptionsIOS,
  StackHeaderMenuOptionsIOS,
} from './StackHeaderConfig.ios.types.js';
import type { StackHeaderMenuIOS } from './ios/StackHeaderMenu.ios.types.js';
import {
  findMenuElementByIdInMenus,
  parseMenuElementToAttr,
  validateMenuCallbacks,
  type StackHeaderMenuAttr,
} from './utils.js';
import type { StackHeaderItemPlacement } from './ios/StackHeaderItem.ios.types.js';
import type { StackHeaderItemSpacerPlacement } from './ios/StackHeaderItemSpacer.ios.types.js';
import { StackHeaderItemSpacer } from './ios/StackHeaderItemSpacer.ios.js';
import { StackHeaderItem } from './ios/StackHeaderItem.ios.js';

type PlatformInnerProps = StackHeaderConfigProps & {
  forwardedRef: Ref<StackHeaderConfigRef>;
};

export const StackHeaderConfigIOS = (props: PlatformInnerProps) => {
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
    titleMenu,
    subtitleItem,
    largeSubtitleItem,
    largeTitle,
    largeSubtitle,
    largeTitleEnabled,
  } = ios ?? {};

  const allMenus = useMemo(
    () =>
      [
        ...(leadingItems ?? [])
          .filter((it) => it && it.type === 'item')
          .map((it) => (it as StackHeaderInlineItemIOS).menu),
        ...(trailingItems ?? [])
          .filter((it) => it && it.type === 'item')
          .map((it) => (it as StackHeaderInlineItemIOS).menu),
        titleMenu,
      ].filter((it): it is StackHeaderMenuIOS => !!it),
    [leadingItems, trailingItems, titleMenu],
  );

  const handleMenuItemPress: EventHandler<
    BaseEventOrig<{ menuItemId: string }>
  > = useCallback(
    (event) => {
      const menuElement = findMenuElementByIdInMenus(
        allMenus,
        event.detail.menuItemId,
      );
      if (menuElement && menuElement.type === 'menuItem') {
        menuElement.onPress?.();
      }
    },
    [allMenus],
  );

  const handleSelectionChange: EventHandler<
    BaseEventOrig<{ menuId: string; selectedMenuItemIds: string[] }>
  > = useCallback(
    (event) => {
      const { menuId, selectedMenuItemIds } = event.detail;
      const menu = findMenuElementByIdInMenus(allMenus, menuId);
      if (menu && menu.type === 'menu') {
        menu.onSelectionChange?.(selectedMenuItemIds);
      }
    },
    [allMenus],
  );

  useEffect(() => {
    for (const menu of allMenus) {
      validateMenuCallbacks(menu);
    }
  }, [allMenus]);

  // Adaptation: RNS resolves the menu icons here (resolveMenuIcons); on Lynx
  // the counterpart step is stripping the callbacks for serialization.
  const parsedTitleMenu = useMemo(
    () =>
      titleMenu != null
        ? (parseMenuElementToAttr(titleMenu) as StackHeaderMenuAttr)
        : undefined,
    [titleMenu],
  );

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
      titleMenu={parsedTitleMenu}
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
      <StackHeaderItemSpacer
        key={id}
        placement={placement as StackHeaderItemSpacerPlacement}
        {...rest}
      />
    );
  }

  const { id, ...rest } = item;

  return (
    <StackHeaderItem key={id} itemId={id} placement={placement} {...rest} />
  );
}

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
