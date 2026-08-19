import React from 'react';
import { StackContainer } from './StackContainer';
import type { StackContainerProps, StackRouteOptions } from '../types/StackContainer';
import { StackRouteConfigContext } from '../contexts/StackRouteConfigContext';

/**
 * StackContainer wrapped in context allowing for modifying options
 * of route configs.
 * See StackRouteConfigContext.
 */
export function StackContainerWithDynamicRouteConfigs(
  props: StackContainerProps,
) {
  const [routeConfigs, setRouteConfigs] = React.useState(props.routeConfigs);

  const updateRouteConfigWithOptions = React.useCallback(
    (routeName: string, options: Partial<StackRouteOptions>) => {
      setRouteConfigs((prevConfigs) => {
        const routeConfigIndex = prevConfigs.findIndex(
          (config) => config.name === routeName,
        );

        if (routeConfigIndex === -1) {
          throw new Error(`Route with name "${routeName}" not found`);
        }

        return prevConfigs.toSpliced(routeConfigIndex, 1, {
          ...prevConfigs[routeConfigIndex],
          options: {
            ...prevConfigs[routeConfigIndex].options,
            ...options,
          } as StackRouteOptions,
        });
      });
    },
    [],
  );

  return (
    <StackRouteConfigContext.Provider
      value={{
        routeConfigs,
        updateRouteConfigWithOptions,
      }}
    >
      <StackContainer routeConfigs={routeConfigs} />
    </StackRouteConfigContext.Provider>
  );
}
