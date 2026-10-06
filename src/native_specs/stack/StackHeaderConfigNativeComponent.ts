import type { ReactNode, Ref } from '@lynx-js/react';
import type * as Lynx from '@lynx-js/types';
import type { StackHeaderMenuAttr } from './StackHeaderItemIOSNativeComponent.js';

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

export interface NativeProps {
  ref?: Ref<Lynx.NodesRef> | undefined;
  className?: string | undefined;
  children?: ReactNode | undefined;
  id?: string | undefined;
  style?: string | Lynx.CSSProperties | undefined;
  type?: 'small' | 'medium' | 'large' | undefined;
  title?: string | undefined;
  subtitle?: string | undefined;
  hidden?: boolean | undefined;
  transparent?: boolean | undefined;
  backButtonHidden?: boolean | undefined;
  backButtonTintColorNormal?: string | undefined;
  backButtonTintColorPressed?: string | undefined;
  backButtonTintColorFocused?: string | undefined;
  backButtonDrawableIconResourceName?: string | undefined;
  backButtonImageIconUri?: string | undefined;
  scrollFlagScroll?: boolean | undefined;
  scrollFlagEnterAlways?: boolean | undefined;
  scrollFlagEnterAlwaysCollapsed?: boolean | undefined;
  scrollFlagExitUntilCollapsed?: boolean | undefined;
  scrollFlagSnap?: boolean | undefined;
  liftOnScroll?: boolean | undefined;
  hasBackgroundSubview?: boolean | undefined;
  largeTitle?: string | undefined;
  largeSubtitle?: string | undefined;
  largeTitleEnabled?: boolean | undefined;
  titleMenu?: StackHeaderMenuAttr | undefined;
  toolbarMenu?:
    | {
        groups?: StackHeaderToolbarMenuGroupAttr[] | undefined;
        children?: StackHeaderToolbarMenuElementAttr[] | undefined;
      }
    | undefined;
  toolbarMenuGroupDividerEnabled?: boolean | undefined;
  bindOnToolbarMenuItemPress?:
    | Lynx.EventHandler<Lynx.BaseEventOrig<{ id: string }>>
    | undefined;
  bindOnToolbarMenuGroupSelectionChange?:
    | Lynx.EventHandler<
        Lynx.BaseEventOrig<{ groupId: string; selectedIds: string[] }>
      >
    | undefined;
  bindOnMenuItemPress?:
    | Lynx.EventHandler<Lynx.BaseEventOrig<{ menuItemId: string }>>
    | undefined;
  bindOnMenuSelectionChange?:
    | Lynx.EventHandler<
        Lynx.BaseEventOrig<{
          menuId: string;
          selectedMenuItemIds: string[];
        }>
      >
    | undefined;
}
