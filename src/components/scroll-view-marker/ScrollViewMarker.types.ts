import type { ReactNode } from '@lynx-js/react';
import type * as Lynx from '@lynx-js/types';

export interface ScrollViewMarkerProps {
  children: NonNullable<ReactNode>;
  style?: string | Lynx.CSSProperties | undefined;

  // Adaptation from RNS: the iOS-only `scrollEdgeEffects` prop is not exposed -
  // the scroll edge effect part of the ScrollViewMarker epic is not ported.
}
