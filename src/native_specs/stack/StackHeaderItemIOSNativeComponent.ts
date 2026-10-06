import type { ReactNode } from '@lynx-js/react';
import type * as Lynx from '@lynx-js/types';

export type StackHeaderIconIOSAttr =
  | {
      type: 'sfSymbol' | 'xcasset';
      name: string;
    }
  | {
      type: 'imageSource' | 'templateSource';
      uri: string;
    };

export type StackHeaderMenuItemAttr = {
  id: string;
  type: 'menuItem';
  title?: string | undefined;
  itemType?: 'action' | 'toggle' | 'automatic' | undefined;
  initialToggleState?: boolean | undefined;
  keepsMenuPresented?: boolean | undefined;
  icon?: StackHeaderIconIOSAttr | undefined;
};

export type StackHeaderMenuAttr = {
  id: string;
  type: 'menu';
  title?: string | undefined;
  singleSelection?: boolean | undefined;
  icon?: StackHeaderIconIOSAttr | undefined;
  displayInline?: boolean | undefined;
  displayAsPalette?: boolean | undefined;
  children: (StackHeaderMenuAttr | StackHeaderMenuItemAttr)[];
};

export interface NativeProps {
  className?: string | undefined;
  children?: ReactNode | undefined;
  id?: string | undefined;
  style?: string | Lynx.CSSProperties | undefined;
  placement?:
    | 'leading'
    | 'trailing'
    | 'title'
    | 'subtitle'
    | 'largeSubtitle'
    | undefined;
  itemId?: string | undefined;
  title?: string | undefined;
  icon?: StackHeaderIconIOSAttr | undefined;
  menu?: StackHeaderMenuAttr | undefined;
  respondsToOnPress?: boolean | undefined;
  bindOnHeaderItemPress?:
    | Lynx.EventHandler<Lynx.BaseEventOrig<Record<string, never>>>
    | undefined;
}
