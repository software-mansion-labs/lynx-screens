/// <reference types="@lynx-js/rspeedy/client" />

import * as Lynx from "@lynx-js/types";

declare module "@lynx-js/types" {
  interface IntrinsicElements extends Lynx.IntrinsicElements {
    "color-box-view": {
      className?: string;
      children: Lynx.Element;
      id?: string;
      style?: string | Lynx.CSSProperties;
      backgroundColorHex?: string | undefined;
    };
  }
}
