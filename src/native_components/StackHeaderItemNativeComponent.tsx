import React from 'react';
import type { ReactElement } from '@lynx-js/react';
import type {
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
  title?: string | undefined;
  render?: (() => ReactElement) | undefined;
  menu?: StackHeaderMenuIOS | undefined;
};

type StackHeaderMenuItemAttr = {
  id: string;
  type: 'menuItem';
  title?: string | undefined;
  itemType?: 'action' | 'toggle' | 'automatic' | undefined;
  initialToggleState?: boolean | undefined;
};

type StackHeaderMenuAttr = {
  id: string;
  type: 'menu';
  title?: string | undefined;
  singleSelection?: boolean | undefined;
  children: (StackHeaderMenuAttr | StackHeaderMenuItemAttr)[];
};

// Adaptation: RNS passes the menu tree to the native component as-is and
// relies on the RN bridge dropping function values; Lynx props must stay
// serializable, so the onPress/onSelectionChange callbacks are stripped
// here - they come back through the config's OnMenuItemPress and
// OnMenuSelectionChange events and are resolved by id.
function parseMenuElementToAttr(
  element: StackHeaderMenuElementIOS,
): StackHeaderMenuAttr | StackHeaderMenuItemAttr {
  if (element.type === 'menu') {
    return {
      id: element.id,
      type: 'menu',
      title: element.title,
      singleSelection: element.singleSelection,
      children: element.children.map(parseMenuElementToAttr),
    };
  }

  return {
    id: element.id,
    type: 'menuItem',
    title: element.title,
    itemType: element.itemType,
    initialToggleState: element.initialToggleState,
  };
}

export const StackHeaderItemNativeComponent = ({
  placement,
  title,
  render,
  menu,
}: StackHeaderItemProps) => {
  return (
    <ls-stack-header-item
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
      }}
      placement={placement}
      title={title}
      menu={menu && (parseMenuElementToAttr(menu) as StackHeaderMenuAttr)}
    >
      {render?.()}
    </ls-stack-header-item>
  );
};
