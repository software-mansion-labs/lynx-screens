import React, { useCallback } from 'react';
import type { ReactElement } from '@lynx-js/react';
import type { BaseEventOrig, EventHandler } from '@lynx-js/types';
import type {
  PlatformIconIOS,
  StackHeaderMenuElementIOS,
  StackHeaderMenuIOS,
} from '../types/StackHeaderConfig.js';

export type StackHeaderItemPlacement =
  | 'leading'
  | 'trailing'
  | 'title'
  | 'subtitle'
  | 'largeSubtitle';

export type StackHeaderItemProps = {
  placement: StackHeaderItemPlacement;
  itemId?: string | undefined;
  title?: string | undefined;
  icon?: PlatformIconIOS | undefined;
  render?: (() => ReactElement) | undefined;
  menu?: StackHeaderMenuIOS | undefined;
  onPress?: (() => void) | undefined;
};

type StackHeaderMenuItemAttr = {
  id: string;
  type: 'menuItem';
  title?: string | undefined;
  itemType?: 'action' | 'toggle' | 'automatic' | undefined;
  initialToggleState?: boolean | undefined;
  keepsMenuPresented?: boolean | undefined;
  icon?: PlatformIconIOS | undefined;
};

type StackHeaderMenuAttr = {
  id: string;
  type: 'menu';
  title?: string | undefined;
  singleSelection?: boolean | undefined;
  icon?: PlatformIconIOS | undefined;
  displayInline?: boolean | undefined;
  displayAsPalette?: boolean | undefined;
  children: (StackHeaderMenuAttr | StackHeaderMenuItemAttr)[];
};

// Adaptation: RNS passes the menu tree to the native component as-is and
// relies on the RN bridge dropping function values; Lynx props must stay
// serializable, so the onPress/onSelectionChange callbacks are stripped
// here - they come back through the config's OnMenuItemPress and
// OnMenuSelectionChange events and are resolved by id. Icons need no
// resolution step (RNS resolves require() assets via resolveAssetSource;
// Lynx icons are plain uri strings) and pass through as data.
function parseMenuElementToAttr(
  element: StackHeaderMenuElementIOS,
): StackHeaderMenuAttr | StackHeaderMenuItemAttr {
  if (element.type === 'menu') {
    return {
      id: element.id,
      type: 'menu',
      title: element.title,
      singleSelection: element.singleSelection,
      icon: element.icon,
      displayInline: element.displayInline,
      displayAsPalette: element.displayAsPalette,
      children: element.children.map(parseMenuElementToAttr),
    };
  }

  return {
    id: element.id,
    type: 'menuItem',
    title: element.title,
    itemType: element.itemType,
    initialToggleState: element.initialToggleState,
    keepsMenuPresented: element.keepsMenuPresented,
    icon: element.icon,
  };
}

export const StackHeaderItemNativeComponent = ({
  placement,
  itemId,
  title,
  icon,
  render,
  menu,
  onPress,
}: StackHeaderItemProps) => {
  const handlePress: EventHandler<BaseEventOrig<Record<string, never>>> =
    useCallback(() => {
      onPress?.();
    }, [onPress]);

  return (
    <ls-stack-header-item
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
      }}
      placement={placement}
      itemId={itemId}
      title={title}
      icon={icon}
      menu={menu && (parseMenuElementToAttr(menu) as StackHeaderMenuAttr)}
      // We need to tell iOS that we want the handler to be attached only when we actually require it
      // because doing so makes the menu appear on long press instead of tap
      respondsToOnPress={!!onPress}
      bindOnHeaderItemPress={handlePress}
    >
      {render?.()}
    </ls-stack-header-item>
  );
};
