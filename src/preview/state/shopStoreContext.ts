import React from 'react';
import { findProduct, type Product } from '../data/catalog';

export type CartLine = {
  lineId: string;
  productId: string;
  size: string;
  qty: number;
};

export type Order = {
  id: string;
  lines: CartLine[];
  totalCents: number;
  addressLine: string;
  slotLabel: string;
  placedAtLabel: string;
};

export type ShopSettings = {
  /**
   * Drives the `preload` demo. With this off, Checkout is mounted at the moment
   * it is pushed and you pay for its (deliberately heavy) first render on tap.
   * With it on, the app preloads Checkout as soon as the cart fills, so the push
   * only has to attach an already-rendered screen.
   */
  preloadCheckout: boolean;
  /**
   * Stands in for the real work a checkout screen does on first render —
   * rehydrating saved cards, recomputing tax, and so on. Exaggerated so the
   * preload difference is felt on a fast device rather than merely measured.
   */
  simulatedCheckoutCostMs: number;
};

export type ShopStorePayload = {
  cart: CartLine[];
  cartCount: number;
  cartSubtotalCents: number;
  addToCart: (productId: string, size: string, qty?: number) => void;
  setLineQty: (lineId: string, qty: number) => void;
  clearCart: () => void;
  orders: Order[];
  placeOrder: (details: {
    addressLine: string;
    slotLabel: string;
    totalCents: number;
  }) => Order;
  lastOrder: Order | undefined;
  settings: ShopSettings;
  updateSettings: (patch: Partial<ShopSettings>) => void;
  /**
   * How many Checkout instances are currently mounted (preloaded or attached).
   *
   * The stack is not observable from the outside — there is no selector for
   * "is route X already on the stack?" — so the app has to count for itself to
   * avoid preloading a second Checkout on top of one it already warmed. The
   * Checkout screen reports its own presence via `registerCheckoutInstance`.
   */
  liveCheckoutCount: number;
  registerCheckoutInstance: () => () => void;
};

export const ShopStoreContext = React.createContext<ShopStorePayload | null>(
  null,
);

export function useShopStore(): ShopStorePayload {
  const context = React.useContext(ShopStoreContext);
  if (!context) {
    throw new Error('useShopStore must be used within a ShopStoreProvider');
  }
  return context;
}

/** Cart lines joined with their catalog product, dropping any that went stale. */
export function useCartLineProducts(): Array<{
  line: CartLine;
  product: Product;
}> {
  const { cart } = useShopStore();
  return React.useMemo(
    () =>
      cart.flatMap((line) => {
        const product = findProduct(line.productId);
        return product ? [{ line, product }] : [];
      }),
    [cart],
  );
}

export const SHIPPING_FLAT_CENTS = 0;
