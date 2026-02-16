import React from "react";
import type { 
  BatchActionMethod,
  PopActionMethod,
  PreloadActionMethod,
  PushActionMethod,
  StackRouteOptions,
} from "../types/StackContainer";

export type StackNavigationContextPayload = {
  routeKey: string;
  routeOptions: StackRouteOptions;
  push: PushActionMethod,
  pop: PopActionMethod,
  preload: PreloadActionMethod,
  batch: BatchActionMethod,
};

export const StackNavigationContext =
  React.createContext<StackNavigationContextPayload | null>(null);
