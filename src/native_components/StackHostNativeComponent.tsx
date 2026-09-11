import * as Lynx from '@lynx-js/types';
import { encodeTrace } from '../internal/trace/codec.js';
import type { HostInternalTraceProps } from '../internal/trace/types.js';

export const StackHostNativeComponent = ({
  children,
  internalTrace,
}: {
  children: NonNullable<Lynx.ViewProps['children']>;
  internalTrace?: HostInternalTraceProps | undefined;
}) => (
  <ls-stack-host
    traceSession={
      internalTrace ? encodeTrace(internalTrace.session) : undefined
    }
    navigationTraceContext={
      internalTrace ? encodeTrace(internalTrace.envelope) : undefined
    }
    style={{ display: 'flex', flex: 1, width: '100%', height: '100%' }}
  >
    {children}
  </ls-stack-host>
);
