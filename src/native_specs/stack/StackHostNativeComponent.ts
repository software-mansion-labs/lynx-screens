import type { ReactNode } from '@lynx-js/react';
import type * as Lynx from '@lynx-js/types';

type StackHostColorScheme = 'inherit' | 'light' | 'dark';

export interface NativeProps {
  // General
  colorScheme?: StackHostColorScheme | undefined;

  className?: string | undefined;
  children: ReactNode;
  id?: string | undefined;
  style?: string | Lynx.CSSProperties | undefined;
}
