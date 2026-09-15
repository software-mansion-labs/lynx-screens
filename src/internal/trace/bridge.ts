import React from 'react';
import { decodeNativeEvent, encodeTrace } from './codec.js';
import type { ScreenInternalTraceProps } from './types.js';

export function useScreenTrace(trace?: ScreenInternalTraceProps) {
  const session = trace?.session;
  const content = trace?.content;
  const observer = trace?.observer;
  React.useEffect(() => {
    if (content) {
      try {
        observer?.onRootCommitted?.(content.identity);
      } catch {
        /* Observation only. */
      }
    }
  }, [content, observer]);
  const props = React.useMemo(
    () =>
      session
        ? {
            traceSession: encodeTrace(session),
            contentTraceContext: encodeTrace(content?.identity),
          }
        : { traceSession: undefined, contentTraceContext: undefined },
    [session, content],
  );
  return {
    props,
    context(event: unknown, name: string) {
      const context = decodeNativeEvent(event, name);
      try {
        observer?.onEventForwarded?.(name, context.traceIdentity);
      } catch {
        /* Observation only. */
      }
      return context;
    },
    forward<T>(name: string, handler?: (event: T) => void) {
      if (!trace) return handler;
      return (event: T) => {
        const context = decodeNativeEvent(event, name);
        try {
          observer?.onEventForwarded?.(name, context.traceIdentity);
        } catch {
          /* Observation only. */
        }
        handler?.(event);
      };
    },
  };
}
