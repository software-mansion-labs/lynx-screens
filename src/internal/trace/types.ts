/** Versioned framework protocol. Not application navigation state. */
export type TraceSession = Readonly<{
  version: 1;
  runtimeId: string;
  navigatorKey: string;
  enabled: true;
}>;
export type ExpectedChange =
  | Readonly<{
      kind: 'stack';
      beforeScreenKeys: readonly string[];
      afterScreenKeys: readonly string[];
    }>
  | Readonly<{
      kind: 'sheet';
      screenKey: string;
      fromOpen: boolean;
      toOpen: boolean;
    }>;
export type NavigationOperationBinding = Readonly<{
  navigationTraceId: string;
  actionType: string;
  sourceScreenKey?: string | undefined;
  targetScreenKey?: string | undefined;
  preloadTraceId?: string | undefined;
  expectedChange: ExpectedChange;
}>;
export type NavigationTraceEnvelope = Readonly<{
  version: 1;
  runtimeId: string;
  navigatorKey: string;
  sequence: number;
  bindings: readonly NavigationOperationBinding[];
}>;
export type ContentIdentity = Readonly<{
  version: 1;
  runtimeId: string;
  navigatorKey: string;
  screenKey: string;
  contentScopeId: string;
}>;
export type NativeTraceIdentity = Readonly<{
  version: 1;
  containerId: string;
  runtimeId?: string | undefined;
  navigatorKey?: string | undefined;
  navigationTraceId?: string | undefined;
  nativeTransitionId?: string | undefined;
  screenKey?: string | undefined;
  contentScopeId?: string | undefined;
  preloadTraceId?: string | undefined;
}>;
export type NativeEventContext = Readonly<{
  traceIdentity?: NativeTraceIdentity | undefined;
  nativeEvent: string;
  isNativeDismiss?: boolean | undefined;
  dismissCount?: number | undefined;
  channel?: string | undefined;
}>;
export interface ScreenBridgeObserver {
  onRootCommitted?(identity: ContentIdentity): void;
  onEventForwarded?(event: string, identity?: NativeTraceIdentity): void;
}
export type ScreenContentTraceProps = Readonly<{
  identity: ContentIdentity;
}>;
export type ScreenInternalTraceProps = Readonly<{
  session: TraceSession;
  content?: ScreenContentTraceProps | undefined;
  observer?: ScreenBridgeObserver | undefined;
}>;
export type HostInternalTraceProps = Readonly<{
  session: TraceSession;
  envelope?: NavigationTraceEnvelope | undefined;
}>;
