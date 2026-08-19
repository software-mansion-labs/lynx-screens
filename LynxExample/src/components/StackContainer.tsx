import React from 'react';
import type {
  NavigationAction,
  StackContainerProps,
  StackNavigationState,
  StackRouteConfig,
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
  FormSheet,
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

  const routes = stackNavState.stack.map((route) => {
    const Component = componentsByName.get(route.name);
    if (!Component) {
      throw new Error(
        `[Stack] No config matches the "${route.name}" route name`,
      );
    }

    return {
      ...route,
      Component,
      navigationContext: {
        routeKey: route.routeKey,
        routeOptions: { ...route.options },
        push: navMethods.pushAction,
        pop: navMethods.popAction,
        preload: navMethods.preloadAction,
        batch: navMethods.batchAction,
        setRouteOptions: navMethods.setRouteOptions,
      } satisfies StackNavigationContextPayload,
    };
  });

  return (
    <>
      <StackHostNativeComponent>
        {routes.map(
          ({
            Component,
            options: routeOptions,
            activityMode,
            routeKey,
            navigationContext,
          }) => {
            if (routeOptions.presentation === 'formSheet') {
              return null;
            }

            const { headerConfig, headerConfigRef, ...options } = routeOptions;

            return (
              <StackScreenNativeComponent
                key={routeKey}
                {...options}
                activityMode={activityMode}
                screenKey={routeKey}
                onDismiss={onDismiss}
                onNativeDismiss={onNativeDismiss}
              >
                <StackNavigationContext.Provider value={navigationContext}>
                  <Component />
                  {headerConfig !== undefined && (
                    <StackHeaderConfigNativeComponent
                      ref={headerConfigRef}
                      {...headerConfig}
                    />
                  )}
                </StackNavigationContext.Provider>
              </StackScreenNativeComponent>
            );
          },
        )}
      </StackHostNativeComponent>

      {routes.map(
        ({ Component, options, activityMode, routeKey, navigationContext }) => {
          if (options.presentation !== 'formSheet') {
            return null;
          }

          const handleDidDisappear: NonNullable<
            typeof options.onDidDisappear
          > = (event) => {
            'background only';
            if (activityMode === 'detached') {
              navMethods.popCompletedAction(routeKey);
            }
            options.onDidDisappear?.(event);
          };

          const handleNativeDismiss: NonNullable<
            typeof options.onNativeDismiss
          > = (event) => {
            'background only';
            navMethods.popNativeAction(routeKey);
            options.onNativeDismiss?.(event);
          };

          const handleDetentChanged: NonNullable<
            typeof options.onDetentChanged
          > = (event) => {
            'background only';
            if (options.selectedDetentIndex !== undefined) {
              navMethods.setRouteOptions(routeKey, {
                selectedDetentIndex: event.detail.index,
              });
            }
            options.onDetentChanged?.(event);
          };

          return (
            <FormSheet
              key={routeKey}
              {...options}
              isOpen={activityMode === 'attached'}
              onDidDisappear={handleDidDisappear}
              onNativeDismiss={handleNativeDismiss}
              onDetentChanged={handleDetentChanged}
            >
              <StackNavigationContext.Provider value={navigationContext}>
                <Component />
              </StackNavigationContext.Provider>
            </FormSheet>
          );
        },
      )}
    </>
  );
}

function useSanitizeRouteConfigs(
  routeConfigs?: StackRouteConfig[] | undefined | null,
) {
  if (!routeConfigs || routeConfigs.length === 0) {
    throw new Error('[Stack] There must be at least one route configured');
  }

  if (routeConfigs[0].options.presentation === 'formSheet') {
    throw new Error('[Stack] The initial route can not be a FormSheet');
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
