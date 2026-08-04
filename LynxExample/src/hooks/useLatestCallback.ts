import React from 'react';
import { useRef, useEffect, useCallback } from '@lynx-js/react';

export function useLatestCallback<T extends (...args: any[]) => any>(callback: T): T {
  const callbackRef = useRef(callback);

  // Update the ref every time the component renders.
  useEffect(() => {
    callbackRef.current = callback;
  });

  // Return a stable function that never changes.
  return useCallback(((...args) => {
    return callbackRef.current(...args);
  }) as T, []);
}
