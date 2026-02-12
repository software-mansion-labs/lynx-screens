import React from 'react';
import { useEffect } from '@lynx-js/react';
import { StackNavigationContext } from '../contexts/StackNavigationContext';
import type {
  NavigationActionMethods,
  StackNavigationEffect,
} from '../types/StackContainer';
import { useLatestCallback } from './useLatestCallback'

export function useParentNavigationEffect(
  navActionMethods: NavigationActionMethods,
  effects: StackNavigationEffect[] | undefined,
) {
  const parentNavigation = React.useContext(StackNavigationContext);

  /**
   * Replacement of React.useEffectEvent.
   * This hook returns a callback with always up-to-date reactive state inside, 
   * allowing it to be used inside an effect without specifying it as a dependency.
   */
  const consumeEffect = useLatestCallback((effect: StackNavigationEffect) => {
    if (effect.type !== 'pop-container') {
      throw new Error(`[Stack] Unrecognized effect type: ${effect.type}`);
    }
    if (parentNavigation) {
      parentNavigation.pop(parentNavigation.routeKey);
    }
  });

  const clearEffects = useLatestCallback(() => {
    navActionMethods.clearEffectsAction();
  });

  useEffect(() => {
    if (effects && effects.length > 0) {
      effects.forEach(consumeEffect);
      clearEffects();
    }
    // 'effects' is the only thing that triggers this re-run.
    // 'consumeEffect' and 'clearEffects' are stable and don't need to be in deps.
  }, [effects]);
}
