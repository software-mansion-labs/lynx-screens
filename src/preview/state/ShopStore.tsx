import React from 'react';
import { findProduct } from '../data/catalog';
import {
  ShopStoreContext,
  type CartLine,
  type Order,
  type ShopSettings,
  type ShopStorePayload,
} from './shopStoreContext';

let lineCounter = 0;
let orderCounter = 1043;

export function ShopStoreProvider(props: { children: React.ReactNode }) {
  const [cart, setCart] = React.useState<CartLine[]>([]);
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [settings, setSettings] = React.useState<ShopSettings>({
    preloadCheckout: true,
    simulatedCheckoutCostMs: 400,
  });

  const addToCart = React.useCallback(
    (productId: string, size: string, qty = 1) => {
      setCart((prev) => {
        const existing = prev.find(
          (line) => line.productId === productId && line.size === size,
        );
        if (existing) {
          return prev.map((line) =>
            line.lineId === existing.lineId
              ? { ...line, qty: line.qty + qty }
              : line,
          );
        }
        lineCounter += 1;
        return [...prev, { lineId: `line-${lineCounter}`, productId, size, qty }];
      });
    },
    [],
  );

  const setLineQty = React.useCallback((lineId: string, qty: number) => {
    setCart((prev) =>
      qty <= 0
        ? prev.filter((line) => line.lineId !== lineId)
        : prev.map((line) => (line.lineId === lineId ? { ...line, qty } : line)),
    );
  }, []);

  const clearCart = React.useCallback(() => setCart([]), []);

  const cartCount = React.useMemo(
    () => cart.reduce((total, line) => total + line.qty, 0),
    [cart],
  );

  const cartSubtotalCents = React.useMemo(
    () =>
      cart.reduce((total, line) => {
        const product = findProduct(line.productId);
        return product ? total + product.priceCents * line.qty : total;
      }, 0),
    [cart],
  );

  const placeOrder = React.useCallback<ShopStorePayload['placeOrder']>(
    ({ addressLine, slotLabel, totalCents }) => {
      orderCounter += 1;
      const order: Order = {
        id: `NW-${orderCounter}`,
        lines: cart,
        totalCents,
        addressLine,
        slotLabel,
        placedAtLabel: 'Just now',
      };
      setOrders((prev) => [order, ...prev]);
      setCart([]);
      return order;
    },
    [cart],
  );

  const updateSettings = React.useCallback((patch: Partial<ShopSettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  }, []);

  const [liveCheckoutCount, setLiveCheckoutCount] = React.useState(0);

  const registerCheckoutInstance = React.useCallback(() => {
    setLiveCheckoutCount((count) => count + 1);
    return () => setLiveCheckoutCount((count) => count - 1);
  }, []);

  const value = React.useMemo<ShopStorePayload>(
    () => ({
      cart,
      cartCount,
      cartSubtotalCents,
      addToCart,
      setLineQty,
      clearCart,
      orders,
      placeOrder,
      lastOrder: orders[0],
      settings,
      updateSettings,
      liveCheckoutCount,
      registerCheckoutInstance,
    }),
    [
      cart,
      cartCount,
      cartSubtotalCents,
      addToCart,
      setLineQty,
      clearCart,
      orders,
      placeOrder,
      settings,
      updateSettings,
      liveCheckoutCount,
      registerCheckoutInstance,
    ],
  );

  return (
    <ShopStoreContext.Provider value={value}>
      {props.children}
    </ShopStoreContext.Provider>
  );
}
