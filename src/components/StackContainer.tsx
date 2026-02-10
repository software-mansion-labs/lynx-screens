import React from 'react';
import type {
  NavigationAction,
  StackContainerProps,
  StackRouteConfig,
  StackState,
} from '../types/StackContainer';
import {
  determineFirstRoute,
  navigationStateReducerWithLogging,
} from '../utils/reducer';
import { useStackOperationMethods } from '../hooks/useStackOperationMethods';
import {
  StackNavigationContext,
  type StackNavigationContextPayload,
} from '../contexts/StackNavigationContext';
import { StackHostNativeComponent } from '../native_components/StackHostNativeComponent';
import { StackScreenNativeComponent } from '../native_components/StackScreenNativeComponent';

export function StackContainer({ routeConfigs }: StackContainerProps) {
  useSanitizeRouteConfigs(routeConfigs);

  const [stackState, navActionDispatch]: [
    StackState,
    React.Dispatch<NavigationAction>,
  ] = React.useReducer(
    navigationStateReducerWithLogging,
    routeConfigs,
    determineFirstRoute,
  );

  const navMethods = useStackOperationMethods(navActionDispatch, routeConfigs);

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
      {stackState.map(({ Component, options, activityMode, routeKey }) => {
        const stackNavigationContext: StackNavigationContextPayload = {
          routeKey,
          push: navMethods.pushAction,
          pop: navMethods.popAction,
          preload: navMethods.preloadAction,
          batch: navMethods.batchAction,
        };

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
    throw new Error('[RNScreens] There must be at least one route configured');
  }

  // Do not recompute in case the routeConfigs have not changed
  const areNamesUnique = React.useMemo(() => {
    const routeNames = routeConfigs.map((routeConfig) => routeConfig.name);
    const uniqueRouteNames = new Set(routeNames);
    return routeNames.length === uniqueRouteNames.size;
  }, [routeConfigs]);

  if (!areNamesUnique) {
    throw new Error('[RNScreens] All routes must have unique names');
  }
}
