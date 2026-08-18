import React from 'react';
import type {
  NavigationAction,
  StackContainerProps,
  StackNavigationState,
  StackRouteConfig,
  StackState,
} from '../types/StackContainer';
import {
  determineInitialNavigationState,
  navigationStateReducerWithLogging,
} from '../utils/reducer';
import { useStackOperationMethods } from '../hooks/useStackOperationMethods';
import {
  StackNavigationContext,
  type StackNavigationContextPayload,
} from '../contexts/StackNavigationContext';
import {
  StackHeaderConfigNativeComponent,
  StackHostNativeComponent,
  StackScreenNativeComponent,
} from 'lynx-screens';
import { useParentNavigationEffect } from '../hooks/useParentNavigationEffect';
import { useComponentsByName } from '../hooks/useComponentsByName';

export function StackContainer({ routeConfigs }: StackContainerProps) {
  useSanitizeRouteConfigs(routeConfigs);

  const componentsByName = useComponentsByName(routeConfigs);

  const [stackNavState, navActionDispatch]: [
    StackNavigationState,
    React.Dispatch<NavigationAction>,
  ] = React.useReducer(
    navigationStateReducerWithLogging,
    routeConfigs,
    determineInitialNavigationState,
  );

  const navMethods = useStackOperationMethods(navActionDispatch, routeConfigs);

  // If reducer produced a parent action, we need to dispatch it
  // as an effect, because we can not modify the state during the render phase.
  useParentNavigationEffect(navMethods, stackNavState.effects);

  const onDismiss = React.useCallback(
    (screenKey: string) => {
      console.log(`onScreenDismissed for ${screenKey}`);
      navMethods.popCompletedAction(screenKey);
    },
    [navMethods],
  );

  const onNativeDismiss = React.useCallback(
    (screenKey: string) => {
      console.log(`onScreenNativelyDismissed for ${screenKey}`);
      navMethods.popNativeAction(screenKey);
    },
    [navMethods],
  );

  return (
    <StackHostNativeComponent>
      {stackNavState.stack.map(
        ({ options: { headerConfig, ...options }, activityMode, routeKey, name }) => {
          const stackNavigationContext: StackNavigationContextPayload = {
            routeKey,
            routeOptions: { ...options },
            push: navMethods.pushAction,
            pop: navMethods.popAction,
            preload: navMethods.preloadAction,
            batch: navMethods.batchAction,
            setRouteOptions: navMethods.setRouteOptions,
          };

          const Component = componentsByName.get(name);
          if (!Component) {
            throw new Error(
              `[Stack] No config matches the "${name}" route name`,
            );
          }

        return (
          <StackScreenNativeComponent
            key={routeKey}
            {...options}
            activityMode={activityMode}
            screenKey={routeKey}
            onDismiss={onDismiss}
            onNativeDismiss={onNativeDismiss}
          >
            <StackNavigationContext.Provider value={stackNavigationContext}>
              <Component />
              {headerConfig !== undefined && (
                <StackHeaderConfigNativeComponent {...headerConfig} />
              )}
            </StackNavigationContext.Provider>
          </StackScreenNativeComponent>
        );
      })}
    </StackHostNativeComponent>
  );
}

function useSanitizeRouteConfigs(
  routeConfigs?: StackRouteConfig[] | undefined | null,
) {
  if (!routeConfigs || routeConfigs.length === 0) {
    throw new Error('[Stack] There must be at least one route configured');
  }

  // Do not recompute in case the routeConfigs have not changed
  const areNamesUnique = React.useMemo(() => {
    const routeNames = routeConfigs.map((routeConfig) => routeConfig.name);
    const uniqueRouteNames = new Set(routeNames);
    return routeNames.length === uniqueRouteNames.size;
  }, [routeConfigs]);

  if (!areNamesUnique) {
    throw new Error('[Stack] All routes must have unique names');
  }
}
