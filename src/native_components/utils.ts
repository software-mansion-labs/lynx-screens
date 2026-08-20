import type {
  PlatformIconIOS,
  StackHeaderMenuElementIOS,
  StackHeaderMenuIOS,
} from '../types/StackHeaderConfig.js';

export type StackHeaderMenuItemAttr = {
  id: string;
  type: 'menuItem';
  title?: string | undefined;
  itemType?: 'action' | 'toggle' | 'automatic' | undefined;
  initialToggleState?: boolean | undefined;
  keepsMenuPresented?: boolean | undefined;
  icon?: PlatformIconIOS | undefined;
};

export type StackHeaderMenuAttr = {
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
// Lynx icons are plain uri strings) and pass through as data. Shared by the
// item's menu prop and the config's titleMenu prop - the Lynx counterpart of
// RNS moving the shared resolveMenuIcons helper into iconUtils.
export function parseMenuElementToAttr(
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

export function findMenuElementByIdInMenus(
  menus: StackHeaderMenuIOS[],
  id: string,
): StackHeaderMenuElementIOS | null {
  for (const menu of menus) {
    const element = findMenuElementById(menu, id);
    if (element !== null) {
      return element;
    }
  }

  return null;
}

export function findMenuElementById(
  menu: StackHeaderMenuElementIOS,
  id: string,
): StackHeaderMenuElementIOS | null {
  if (menu.id === id) {
    return menu;
  }

  if (menu.type === 'menu') {
    for (const child of menu.children) {
      const result = findMenuElementById(child, id);
      if (result !== null) {
        return result;
      }
    }
  }

  return null;
}

export function validateMenuCallbacks(menu: StackHeaderMenuIOS): void {
  walkMenuTreeAndValidateCallbacks(menu, false);
}

function walkMenuTreeAndValidateCallbacks(
  menu: StackHeaderMenuIOS,
  insideSingleSelection: boolean,
): void {
  // If this menu starts a singleSelection hierarchy, mark it.
  // If already inside one, stay inside.
  const isInsideSingleSelection =
    insideSingleSelection || !!menu.singleSelection;

  for (const child of menu.children) {
    if (child.type === 'menuItem') {
      if (
        (child.itemType === 'toggle' ||
          (isInsideSingleSelection &&
            (child.itemType ?? 'automatic') === 'automatic')) &&
        child.onPress
      ) {
        console.warn(
          `[RNScreens] onPress on menu item "${child.id}" will not fire ` +
            'because it is a toggle. Use onSelectionChange on parent menu instead.',
        );
      }
    }

    if (child.type === 'menu') {
      if (isInsideSingleSelection && child.onSelectionChange) {
        console.warn(
          `[RNScreens] onSelectionChange on menu "${child.id}" will not fire ` +
            'because it is nested inside a singleSelection hierarchy. ' +
            'Place onSelectionChange on the topmost singleSelection menu instead.',
        );
      }

      walkMenuTreeAndValidateCallbacks(child, isInsideSingleSelection);
    }
  }
}
