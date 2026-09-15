import type { NativeEventContext, NativeTraceIdentity } from './types.js';
const MAX_SIZE = 65536;
export function encodeTrace(value: unknown): string | undefined {
  if (value == null) return undefined;
  try {
    const encoded = JSON.stringify(value);
    return encoded.length <= MAX_SIZE ? encoded : undefined;
  } catch {
    return undefined;
  }
}
const id = (value: unknown): value is string =>
  typeof value === 'string' && value.length > 0 && value.length <= 1024;
export function decodeNativeIdentity(
  value: unknown,
): NativeTraceIdentity | undefined {
  if (value == null || typeof value !== 'object') return undefined;
  const record = value as Record<string, unknown>;
  if (record.version !== 1 || !id(record.containerId)) return undefined;
  const result: Record<string, unknown> = {
    version: 1,
    containerId: record.containerId,
  };
  for (const key of [
    'runtimeId',
    'navigatorKey',
    'navigationTraceId',
    'nativeTransitionId',
    'screenKey',
    'contentScopeId',
    'preloadTraceId',
  ]) {
    if (record[key] !== undefined) {
      if (!id(record[key])) return undefined;
      result[key] = record[key];
    }
  }
  return Object.freeze(result) as NativeTraceIdentity;
}
export function decodeNativeEvent(
  event: unknown,
  nativeEvent: string,
): NativeEventContext {
  try {
    const detail =
      (event as { detail?: Record<string, unknown> })?.detail ?? {};
    return Object.freeze({
      nativeEvent,
      traceIdentity: decodeNativeIdentity(detail.traceIdentity),
      isNativeDismiss:
        typeof detail.isNativeDismiss === 'boolean'
          ? detail.isNativeDismiss
          : undefined,
      dismissCount: Number.isSafeInteger(detail.dismissCount)
        ? (detail.dismissCount as number)
        : undefined,
      channel: typeof detail.channel === 'string' ? detail.channel : undefined,
    });
  } catch {
    return { nativeEvent };
  }
}
