import React, { useMemo } from 'react';
import type { StackRouteConfig } from '../types/StackContainer';

export const useComponentsByName = (
  routeConfigs: readonly StackRouteConfig[],
) => {
  return useMemo(() => {
    const map = new Map<string, React.ComponentType>();

    for (const config of routeConfigs) {
      map.set(config.name, config.Component);
    }

    return map;
  }, [routeConfigs]);
};
