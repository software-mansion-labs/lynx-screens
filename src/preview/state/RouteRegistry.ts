import React from 'react';
import { useStackNavigationContext } from '../../hooks/useStackNavigationContext';
import type { BatchableNavigationAction } from '../../types/StackContainer';

/**
 * ---------------------------------------------------------------------------
 * Workaround: no `popTo`, no `reset`, no stack introspection.
 * ---------------------------------------------------------------------------
 *
 * `navigation.pop(routeKey)` needs the key of the route being popped, but a
 * screen only ever learns its *own* key (`navigation.routeKey`). Nothing in the
 * public API exposes the keys of the other live routes, so the single most
 * ordinary e-commerce transition — "order placed: tear down the funnel and show
 * the confirmation" — cannot be expressed with the API alone.
 *
 * (`TestBatch.tsx` sidesteps this by hardcoding generated keys like `r-C-3`,
 * which is fine for a test fixture but is not something an app can do.)
 *
 * So the preview app keeps its own registry: every screen reports its
 * (routeName, routeKey) pair on mount and withdraws it on unmount. Entries are
 * held in an array so registration order — which tracks mount order, and so
 * approximates stack order — is preserved.
 *
 * This is the workaround the library should make unnecessary. See PREVIEW_APP.md.
 */

export type RouteEntry = { routeName: string; routeKey: string };

export type RouteRegistryPayload = {
  register: (entry: RouteEntry) => () => void;
  /** Live route keys for the given route names, in registration order. */
  keysFor: (...routeNames: string[]) => string[];
};

export const RouteRegistryContext =
  React.createContext<RouteRegistryPayload | null>(null);

export function useRouteRegistry(): RouteRegistryPayload {
  const context = React.useContext(RouteRegistryContext);
  if (!context) {
    throw new Error(
      'useRouteRegistry must be used within a RouteRegistryProvider',
    );
  }
  return context;
}

/** Publishes this screen's route key so other screens can target it in a batch. */
export function useRegisterRoute(routeName: string): void {
  const { register } = useRouteRegistry();
  const { routeKey } = useStackNavigationContext();

  React.useEffect(
    () => register({ routeName, routeKey }),
    [register, routeName, routeKey],
  );
}

/**
 * Builds the pop actions that clear every live instance of the given routes.
 * Meant to be spent inside a single `navigation.batch(...)` so the whole
 * transition lands in one state update — and therefore one native animation.
 */
export function usePopActionsFor(): (
  ...routeNames: string[]
) => BatchableNavigationAction[] {
  const { keysFor } = useRouteRegistry();

  return React.useCallback(
    (...routeNames: string[]) =>
      keysFor(...routeNames).map((routeKey) => ({
        type: 'pop' as const,
        routeKey,
      })),
    [keysFor],
  );
}
