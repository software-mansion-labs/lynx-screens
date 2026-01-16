import React from 'react';
import * as Lynx from '@lynx-js/types';

export type StackScreenActivityMode = 'detached' | 'attached';

// copied form react-native-screens/src/components/gamma/stack/StackScreen.types.ts
export type EmptyEventPayload = Record<string, never>;

export type OnDismissEventPayload = Readonly<{
  isNativeDismiss: boolean;
}>;

export type StackScreenProps = {
  children?: Lynx.ViewProps['children'];

  // Control
  activityMode: StackScreenActivityMode;
  screenKey: string;

  // Events
  onWillAppear?:
    | Lynx.EventHandler<Lynx.BaseEventOrig<EmptyEventPayload>>
    | undefined;
  onDidAppear?:
    | Lynx.EventHandler<Lynx.BaseEventOrig<EmptyEventPayload>>
    | undefined;
  onWillDisappear?:
    | Lynx.EventHandler<Lynx.BaseEventOrig<EmptyEventPayload>>
    | undefined;
  onDidDisappear?:
    | Lynx.EventHandler<Lynx.BaseEventOrig<EmptyEventPayload>>
    | undefined;

  onDismiss?: (screenKey: string) => void;
  onNativeDismiss?: (screenKey: string) => void;
};

export type StackRouteOptions = Omit<
  StackScreenProps,
  'children' | 'activityMode' | 'screenKey'
>;

export type StackRouteConfig = {
  name: string;
  Component: React.ComponentType;
  options: StackRouteOptions;
};

export type StackContainerProps = {
  routeConfigs: StackRouteConfig[];
};

export type StackRoute = StackRouteConfig & {
  activityMode: StackScreenProps['activityMode'];
  routeKey: StackScreenProps['screenKey'];
};

export type PushActionMethod = (routeName: string) => void;
export type PopActionMethod = (routeKey: string) => void;
export type PopCompletedActionMethod = (routeKey: string) => void;
export type PopNativeActionMethod = (routeKey: string) => void;
export type PreloadActionMethod = (routeName: string) => void;

export type NavigationActionMethods = {
  pushAction: PushActionMethod;
  popAction: PopActionMethod;
  popCompletedAction: PopCompletedActionMethod;
  popNativeAction: PopNativeActionMethod;
  preloadAction: PreloadActionMethod;
};

export type StackState = StackRoute[];

export type NavigationActionPush = {
  type: 'push';
  routeName: string;
  ctx: NavigationActionContext;
};

export type NavigationActionPop = {
  type: 'pop';
  routeKey: string;
  ctx: NavigationActionContext;
};

export type NavigationActionPopCompleted = {
  type: 'pop-completed';
  routeKey: string;
  ctx: NavigationActionContext;
};

export type NavigationActionNativePop = {
  type: 'pop-native';
  routeKey: string;
  ctx: NavigationActionContext;
};

export type NavigationActionPreload = {
  type: 'preload';
  routeName: string;
  ctx: NavigationActionContext;
};

export type NavigationActionContext = {
  routeConfigs: StackRouteConfig[];
};

export type NavigationAction =
  | NavigationActionPush
  | NavigationActionPop
  | NavigationActionPopCompleted
  | NavigationActionNativePop
  | NavigationActionPreload;
