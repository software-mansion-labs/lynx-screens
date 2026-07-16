/**
 * Route names for the preview shop. Centralised so that the `push`/`preload`
 * call sites — which are stringly-typed by the StackContainer API — at least
 * fail at compile time inside the app.
 */
export const ROUTE = {
  Storefront: 'Storefront',
  Product: 'Product',
  Cart: 'Cart',
  Checkout: 'Checkout',
  Confirmation: 'Confirmation',
  Account: 'Account',
} as const;

export type RouteName = (typeof ROUTE)[keyof typeof ROUTE];

/** Params carried to the Product screen. See state/navParams.ts. */
export type ProductParams = { productId: string };

export const ACCOUNT_ROUTE = {
  AccountHome: 'AccountHome',
  Orders: 'Orders',
  OrderDetail: 'OrderDetail',
  Settings: 'Settings',
} as const;

export type OrderDetailParams = { orderId: string };
