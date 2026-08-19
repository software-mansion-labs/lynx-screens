import type { ReactNode, Ref } from '@lynx-js/react';
import type * as Lynx from '@lynx-js/types';

declare module "@lynx-js/types" {
  type EmptyEventPayload = Record<string, never>;

  type StackHeaderMenuItemAttr = {
    id: string;
    type: 'menuItem';
    title?: string | undefined;
  };

  type StackHeaderMenuAttr = {
    id: string;
    type: 'menu';
    title?: string | undefined;
    children: (StackHeaderMenuAttr | StackHeaderMenuItemAttr)[];
  };

  type OnDismissEventPayload = Readonly<{
    isNativeDismiss: boolean;
  }>;

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
      toolbarMenuItems?:
        | Array<{
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
          }>
        | undefined;
      bindOnToolbarMenuItemClicked?:
        | Lynx.EventHandler<Lynx.BaseEventOrig<{ id: string }>>
        | undefined;
      bindOnMenuItemPress?:
        | Lynx.EventHandler<Lynx.BaseEventOrig<{ menuItemId: string }>>
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
      label?: string | undefined;
      menu?: StackHeaderMenuAttr | undefined;
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
