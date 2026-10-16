import type { ScrollViewMarkerProps } from './ScrollViewMarker.types.js';

export function ScrollViewMarker(props: ScrollViewMarkerProps) {
  const { children, ...rest } = props;

  return <ls-scroll-view-marker {...rest}>{children}</ls-scroll-view-marker>;
}
