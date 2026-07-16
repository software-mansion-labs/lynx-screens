import { StackContainer } from '../components/StackContainer';
import type { StackRouteConfig } from '../types/StackContainer';
import { ROUTE } from './routes';
import { AccountScreen } from './screens/AccountScreen';
import { CartScreen } from './screens/CartScreen';
import { CheckoutScreen } from './screens/CheckoutScreen';
import { ConfirmationScreen } from './screens/ConfirmationScreen';
import { ProductScreen } from './screens/ProductScreen';
import { StorefrontScreen } from './screens/StorefrontScreen';
import { RouteRegistryProvider } from './state/RouteRegistryProvider';
import { ShopStoreProvider } from './state/ShopStore';

/**
 * Northwell — a production-shaped shop used to exercise StackContainer the way
 * a real app would. See PREVIEW_APP.md for what each flow is meant to show and
 * for the gaps it surfaced.
 *
 * The first entry is the initial route: `determineInitialNavigationState` takes
 * `routeConfigs[0]`, so the Storefront is what mounts, and it stays at the
 * bottom of the stack for the whole session.
 */
const ROUTE_CONFIGS: StackRouteConfig[] = [
  {
    name: ROUTE.Storefront,
    Component: StorefrontScreen,
    options: {},
  },
  {
    name: ROUTE.Product,
    Component: ProductScreen,
    options: {},
  },
  {
    name: ROUTE.Cart,
    Component: CartScreen,
    options: {},
  },
  {
    // Pushed unguarded; the screen promotes its own instance to
    // `preventNativeDismiss: true` via `setRouteOptions` once the form is dirty.
    name: ROUTE.Checkout,
    Component: CheckoutScreen,
    options: {},
  },
  {
    name: ROUTE.Confirmation,
    Component: ConfirmationScreen,
    options: {},
  },
  {
    // Hosts a nested StackContainer of its own.
    name: ROUTE.Account,
    Component: AccountScreen,
    options: {},
  },
];

export default function ShopApp() {
  return (
    <ShopStoreProvider>
      <RouteRegistryProvider>
        <StackContainer routeConfigs={ROUTE_CONFIGS} />
      </RouteRegistryProvider>
    </ShopStoreProvider>
  );
}
