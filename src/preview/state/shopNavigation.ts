import React from 'react';
import { useStackNavigationContext } from '../../hooks/useStackNavigationContext';
import { ROUTE, type ProductParams } from '../routes';
import { setPendingParams } from './navParams';
import { usePopActionsFor } from './RouteRegistry';
import { useShopStore } from './shopStoreContext';

/**
 * The navigation moves that make the shop a shop. Each one is a small wrapper
 * around the StackContainer API, kept here so the screens read as product code
 * and the interesting calls stay in one place.
 */

/** Plain push, with the product id handed over through the params box. */
export function useOpenProduct(): (productId: string) => void {
  const navigation = useStackNavigationContext();

  return React.useCallback(
    (productId: string) => {
      setPendingParams(ROUTE.Product, { productId } satisfies ProductParams);
      navigation.push(ROUTE.Product);
    },
    [navigation],
  );
}

/**
 * "Buy now" — add the item and skip the cart, straight to Checkout.
 *
 * Only ever called from the Product screen, so the Product the user is buying
 * from is already on the stack and stays underneath: going back from Checkout
 * lands on it. Pushing a Product here as well would stack a second copy of the
 * screen the user is looking at.
 */
export function useBuyNow(): (productId: string, size: string) => void {
  const navigation = useStackNavigationContext();
  const { addToCart } = useShopStore();

  return React.useCallback(
    (productId: string, size: string) => {
      addToCart(productId, size);
      navigation.push(ROUTE.Checkout);
    },
    [navigation, addToCart],
  );
}

/**
 * "Order placed" — tear the whole funnel down and put Confirmation in its place,
 * so that back from Confirmation returns to the Storefront rather than to a
 * checkout for an order that no longer exists.
 *
 * This is the transition that most needs `batch`: popping three screens and
 * pushing a fourth as separate dispatches would render three intermediate
 * stacks and animate each one. As a batch it is a single atomic update.
 *
 * It is also the transition that most exposes the missing `reset`/`popTo` — the
 * route keys come from the app's own RouteRegistry because the API will not
 * tell us what is on the stack.
 */
export function useCompleteOrder(): () => void {
  const navigation = useStackNavigationContext();
  const popActionsFor = usePopActionsFor();

  return React.useCallback(() => {
    navigation.batch([
      ...popActionsFor(ROUTE.Checkout, ROUTE.Cart, ROUTE.Product),
      { type: 'push', routeName: ROUTE.Confirmation },
    ]);
  }, [navigation, popActionsFor]);
}

/**
 * Warms the Checkout screen while the user is still browsing.
 *
 * Mounted on the Storefront, which lives at the bottom of the stack for the
 * whole session. As soon as the cart has something in it, Checkout is rendered
 * in `detached` mode: the native side does not show it, but the JS tree and the
 * views exist, so pushing it later only has to attach it.
 *
 * `preloadInFlight` guards the window between dispatching the preload and the
 * Checkout instance reporting itself, so a quick second tap on "Add to cart"
 * cannot warm two Checkouts. Once a Checkout is popped it is dropped from the
 * stack entirely, so `liveCheckoutCount` falling back to zero re-warms the next.
 */
export function usePreloadCheckout(): void {
  const navigation = useStackNavigationContext();
  const { cartCount, settings, liveCheckoutCount } = useShopStore();
  const preloadInFlight = React.useRef(false);

  React.useEffect(() => {
    if (liveCheckoutCount > 0) {
      preloadInFlight.current = false;
      return;
    }
    if (!settings.preloadCheckout || cartCount === 0) {
      return;
    }
    if (preloadInFlight.current) {
      return;
    }
    preloadInFlight.current = true;
    navigation.preload(ROUTE.Checkout);
  }, [liveCheckoutCount, settings.preloadCheckout, cartCount, navigation]);
}

/** Pops the current screen. Every screen's back button routes through here. */
export function useGoBack(): () => void {
  const navigation = useStackNavigationContext();
  return React.useCallback(
    () => navigation.pop(navigation.routeKey),
    [navigation],
  );
}
