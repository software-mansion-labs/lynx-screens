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

export type HeaderAppearance = {
  titleFontFamily?: string | undefined;
  titleFontSize?: number | undefined;
  titleFontWeight?: string | undefined;
  titleFontStyle?: string | undefined;
  titleFontColor?: string | undefined;

  largeTitleFontFamily?: string | undefined;
  largeTitleFontSize?: number | undefined;
  largeTitleFontWeight?: string | undefined;
  largeTitleFontStyle?: string | undefined;
  largeTitleFontColor?: string | undefined;

  subtitleFontFamily?: string | undefined;
  subtitleFontSize?: number | undefined;
  subtitleFontWeight?: string | undefined;
  subtitleFontStyle?: string | undefined;
  subtitleFontColor?: string | undefined;
};

export interface NativeProps {
  ref?: Ref<Lynx.NodesRef> | undefined;
  className?: string | undefined;
  children?: ReactNode | undefined;
  id?: string | undefined;
  style?: string | Lynx.CSSProperties | undefined;
  type?: 'small' | 'medium' | 'large' | undefined;
  titleCentered?: boolean | undefined;
  subtitleCentered?: boolean | undefined;
  expandedTitleHorizontalGravity?: 'start' | 'center' | 'end' | undefined;
  expandedTitleVerticalGravity?: 'top' | 'center' | 'bottom' | undefined;
  collapsedTitleHorizontalGravity?: 'start' | 'center' | 'end' | undefined;
  collapsedTitleVerticalGravity?: 'top' | 'center' | 'bottom' | undefined;
  collapsedTitleGravityMode?: 'entireSpace' | 'availableSpace' | undefined;
  contentInsetStart?: number | undefined;
  contentInsetEnd?: number | undefined;
  titleColor?: string | undefined;
  titleFontFamily?: string | undefined;
  titleFontSize?: number | undefined;
  titleFontWeight?: string | undefined;
  titleFontStyle?: string | undefined;
  subtitleColor?: string | undefined;
  subtitleFontFamily?: string | undefined;
  subtitleFontSize?: number | undefined;
  subtitleFontWeight?: string | undefined;
  subtitleFontStyle?: string | undefined;
  expandedTitleColor?: string | undefined;
  expandedTitleFontFamily?: string | undefined;
  expandedTitleFontSize?: number | undefined;
  expandedTitleFontWeight?: string | undefined;
  expandedTitleFontStyle?: string | undefined;
  collapsedTitleColor?: string | undefined;
  collapsedTitleFontFamily?: string | undefined;
  collapsedTitleFontSize?: number | undefined;
  collapsedTitleFontWeight?: string | undefined;
  collapsedTitleFontStyle?: string | undefined;
  expandedSubtitleColor?: string | undefined;
  expandedSubtitleFontFamily?: string | undefined;
  expandedSubtitleFontSize?: number | undefined;
  expandedSubtitleFontWeight?: string | undefined;
  expandedSubtitleFontStyle?: string | undefined;
  collapsedSubtitleColor?: string | undefined;
  collapsedSubtitleFontFamily?: string | undefined;
  collapsedSubtitleFontSize?: number | undefined;
  collapsedSubtitleFontWeight?: string | undefined;
  collapsedSubtitleFontStyle?: string | undefined;
  title?: string | undefined;
  subtitle?: string | undefined;
  maxLines?: number | undefined;
  hidden?: boolean | undefined;
  transparent?: boolean | undefined;
  backButtonHidden?: boolean | undefined;
  backButtonTintColorNormal?: string | undefined;
  backButtonTintColorPressed?: string | undefined;
  backButtonTintColorFocused?: string | undefined;
  backButtonDrawableIconResourceName?: string | undefined;
  backButtonImageIconUri?: string | undefined;
  overflowIconTintColorNormal?: string | undefined;
  overflowIconTintColorPressed?: string | undefined;
  overflowIconTintColorFocused?: string | undefined;
  overflowIconDrawableIconResourceName?: string | undefined;
  overflowIconImageIconUri?: string | undefined;
  scrollFlagScroll?: boolean | undefined;
  scrollFlagEnterAlways?: boolean | undefined;
  scrollFlagEnterAlwaysCollapsed?: boolean | undefined;
  scrollFlagExitUntilCollapsed?: boolean | undefined;
  scrollFlagSnap?: boolean | undefined;
  liftOnScroll?: boolean | undefined;
  backgroundColor?: string | undefined;
  scrolledBackgroundColor?: string | undefined;
  statusBarScrimColor?: string | undefined;
  hasBackgroundSubview?: boolean | undefined;
  backButtonTitle?: string | undefined;
  backButtonDisplayMode?: 'default' | 'generic' | 'minimal' | undefined;
  backButtonMenuEnabled?: boolean | undefined;
  largeTitle?: string | undefined;
  largeSubtitle?: string | undefined;
  largeTitleEnabled?: boolean | undefined;
  prompt?: string | undefined;
  standardAppearance?: HeaderAppearance | undefined;
  scrollEdgeAppearance?: HeaderAppearance | undefined;
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
