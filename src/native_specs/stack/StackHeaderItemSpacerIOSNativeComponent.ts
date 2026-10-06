import type * as Lynx from '@lynx-js/types';

export interface NativeProps {
  className?: string | undefined;
  id?: string | undefined;
  style?: string | Lynx.CSSProperties | undefined;
  placement?: 'leading' | 'trailing' | undefined;
  sizing?: 'fixed' | 'flexible' | undefined;
  width?: number | undefined;
}
