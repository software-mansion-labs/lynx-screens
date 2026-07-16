import React from 'react';
import {
  RouteRegistryContext,
  type RouteEntry,
} from './RouteRegistry';

export function RouteRegistryProvider(props: { children: React.ReactNode }) {
  // A ref, not state: the registry is only ever read inside event handlers at
  // the moment an action is dispatched, so re-rendering on change buys nothing.
  const entriesRef = React.useRef<RouteEntry[]>([]);

  const register = React.useCallback((entry: RouteEntry) => {
    entriesRef.current = [...entriesRef.current, entry];
    return () => {
      entriesRef.current = entriesRef.current.filter(
        (candidate) => candidate.routeKey !== entry.routeKey,
      );
    };
  }, []);

  const keysFor = React.useCallback((...routeNames: string[]) => {
    return entriesRef.current
      .filter((entry) => routeNames.includes(entry.routeName))
      .map((entry) => entry.routeKey);
  }, []);

  const value = React.useMemo(
    () => ({ register, keysFor }),
    [register, keysFor],
  );

  return (
    <RouteRegistryContext.Provider value={value}>
      {props.children}
    </RouteRegistryContext.Provider>
  );
}
