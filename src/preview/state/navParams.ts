import React from 'react';

/**
 * ---------------------------------------------------------------------------
 * Workaround: StackContainer has no route params.
 * ---------------------------------------------------------------------------
 *
 * `navigation.push(routeName)` takes a route name and nothing else, and
 * `StackRouteConfig.Component` is a `React.ComponentType` with no props. A real
 * app constantly needs "open THIS product", so the preview app parks the params
 * in a module-level box immediately before pushing, and the destination screen
 * snapshots them once, on mount.
 *
 * The box is a plain module variable rather than React state on purpose: it is
 * written synchronously, so it is already readable by the time the pushed screen
 * first renders, regardless of how the host batches state updates.
 *
 * Known limitations of this pattern (see PREVIEW_APP.md):
 *   - It does not compose with `preload`. A preloaded route mounts at preload
 *     time, so it would snapshot whatever params existed back then. Only push
 *     param-less routes through `preload`.
 *   - `push` re-attaches an existing *detached* route instead of mounting a new
 *     one, and a re-attached route keeps its original snapshot. This is only
 *     reachable in the window between `pop` and the native dismiss completing.
 */

const pendingParams = new Map<string, unknown>();

export function setPendingParams(routeName: string, params: unknown): void {
  pendingParams.set(routeName, params);
}

function consumePendingParams<T>(routeName: string): T | undefined {
  const params = pendingParams.get(routeName) as T | undefined;
  pendingParams.delete(routeName);
  return params;
}

/**
 * Snapshots the params this route instance was pushed with. Stable for the
 * lifetime of the screen, so two Product screens stacked on top of each other
 * keep showing their own product.
 */
export function useRouteParams<T>(routeName: string): T | undefined {
  const [params] = React.useState(() => consumePendingParams<T>(routeName));
  return params;
}
