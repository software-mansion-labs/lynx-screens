/// <reference types="@lynx-js/rspeedy/client" />

import * as ReactLynx from "@lynx-js/react";
import * as Lynx from "@lynx-js/types";

declare module "@lynx-js/types" {
  interface IntrinsicElements extends Lynx.IntrinsicElements {
    "color-box-view": {
      className?: string;
      id?: string;
      style?: string | Lynx.CSSProperties;
      backgroundColorHex?: string | undefined;
    };
  }
}
