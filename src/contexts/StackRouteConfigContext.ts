import React from 'react';
import type {
  StackRouteConfig,
  StackRouteOptions,
} from '../types/StackContainer';

export type StackRouteConfigContextPayload = {
  routeConfigs: StackRouteConfig[];
  updateRouteConfigWithOptions: (
    routeName: string,
    options: Partial<StackRouteOptions>,
  ) => void;
};

export const StackRouteConfigContext =
  React.createContext<StackRouteConfigContextPayload | null>(null);
