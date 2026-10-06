import type { ReactNode } from '@lynx-js/react';
import type * as Lynx from '@lynx-js/types';

export interface NativeProps {
  className?: string | undefined;
  children: ReactNode;
  id?: string | undefined;
  style?: string | Lynx.CSSProperties | undefined;
}
