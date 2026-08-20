import type { ReactNode, Ref } from '@lynx-js/react';
import type * as Lynx from '@lynx-js/types';

declare module "@lynx-js/types" {
  type EmptyEventPayload = Record<string, never>;

  type StackHeaderMenuItemAttr = {
    id: string;
    type: 'menuItem';
    title?: string | undefined;
    itemType?: 'action' | 'toggle' | 'automatic' | undefined;
    initialToggleState?: boolean | undefined;
    keepsMenuPresented?: boolean | undefined;
  };

  type StackHeaderMenuAttr = {
    id: string;
    type: 'menu';
    title?: string | undefined;
    singleSelection?: boolean | undefined;
    children: (StackHeaderMenuAttr | StackHeaderMenuItemAttr)[];
  };

  type OnDismissEventPayload = Readonly<{
    isNativeDismiss: boolean;
  }>;

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

  interface IntrinsicElements extends Lynx.IntrinsicElements {
    "ls-stack-host": {
      className?: string | undefined;
      children: ReactNode;
      id?: string | undefined;
      style?: string | Lynx.CSSProperties | undefined;
    };
    "ls-stack-screen": {
      className?: string | undefined;
      children: ReactNode;
      id?: string | undefined;
      style?: string | Lynx.CSSProperties | undefined;
      // Control
      activityMode?: 'detached' | 'attached' | undefined;
      screenKey?: string | undefined;
      // Events
      bindOnWillAppear?: Lynx.EventHandler<Lynx.BaseEventOrig<EmptyEventPayload>> | undefined;
      bindOnDidAppear?: Lynx.EventHandler<Lynx.BaseEventOrig<EmptyEventPayload>> | undefined;
      bindOnWillDisappear?: Lynx.EventHandler<Lynx.BaseEventOrig<EmptyEventPayload>> | undefined;
      bindOnDidDisappear?: Lynx.EventHandler<Lynx.BaseEventOrig<EmptyEventPayload>> | undefined;
      bindOnDismiss?: Lynx.EventHandler<Lynx.BaseEventOrig<OnDismissEventPayload>> | undefined;
      bindOnNativeDismissPrevented?: Lynx.EventHandler<Lynx.BaseEventOrig<EmptyEventPayload>> | undefined;
      // Configuration
      preventNativeDismiss?: boolean | undefined;
    };
    "ls-stack-header-config": {
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
      hasBackgroundSubview?: boolean | undefined;
      largeTitle?: string | undefined;
      largeSubtitle?: string | undefined;
      largeTitleEnabled?: boolean | undefined;
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
    };
    "ls-stack-header-subview": {
      className?: string | undefined;
      children?: ReactNode | undefined;
      id?: string | undefined;
      style?: string | Lynx.CSSProperties | undefined;
      type?: 'background' | 'leading' | 'center' | 'trailing' | undefined;
      collapseMode?: 'off' | 'parallax' | undefined;
    };
    "ls-stack-header-item": {
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
      menu?: StackHeaderMenuAttr | undefined;
      respondsToOnPress?: boolean | undefined;
      bindOnHeaderItemPress?:
        | Lynx.EventHandler<Lynx.BaseEventOrig<Record<string, never>>>
        | undefined;
    };
    "ls-stack-header-item-spacer": {
      className?: string | undefined;
      id?: string | undefined;
      style?: string | Lynx.CSSProperties | undefined;
      placement?: 'leading' | 'trailing' | undefined;
      sizing?: 'fixed' | 'flexible' | undefined;
      width?: number | undefined;
    };
  }
}

export {};
