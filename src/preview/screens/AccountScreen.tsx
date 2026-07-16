import React from 'react';
import { StackContainer } from '../../components/StackContainer';
import { useStackNavigationContext } from '../../hooks/useStackNavigationContext';
import type { StackRouteConfig } from '../../types/StackContainer';
import { ACCOUNT_ROUTE, type OrderDetailParams } from '../routes';
import { setPendingParams, useRouteParams } from '../state/navParams';
import { useShopStore } from '../state/shopStoreContext';
import { useGoBack } from '../state/shopNavigation';
import { color, font, formatPrice, radius, space } from '../theme';
import {
  Button,
  Card,
  Divider,
  Header,
  Row,
  Screen,
  SectionTitle,
  Toggle,
} from '../ui/kit';
import { findProduct } from '../data/catalog';

/**
 * The account section is its own StackContainer nested inside a screen of the
 * root one — the shape a real app reaches for when a tab or a modal flow owns
 * its own history.
 *
 * The payoff is in AccountHomeScreen: popping the *root* of a nested container
 * has nothing left to pop, so StackContainer raises a `pop-container` effect
 * and the parent container pops the screen hosting this stack. One `pop` call
 * closes the whole section, and the same thing happens for a system back
 * gesture, with no coordination code in the app.
 */
export function AccountScreen() {
  return <StackContainer routeConfigs={ACCOUNT_ROUTE_CONFIGS} />;
}

function AccountHomeScreen() {
  const navigation = useStackNavigationContext();
  // Pops this stack's root → delegated up to the root container, which pops the
  // Account screen itself.
  const closeSection = useGoBack();
  const { orders } = useShopStore();

  return (
    <Screen background={color.surface}>
      <Header title="Account" subtitle="Tomasz Boroń" onBack={closeSection} />

      <scroll-view scroll-y style={{ display: 'flex', flexGrow: 1, width: '100%' }}>
        <view
          style={{
            display: 'flex',
            flexDirection: 'column',
            padding: space.lg,
            gap: space.lg,
          }}
        >
          <Card padded>
            <view
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                gap: space.md,
              }}
            >
              <view
                style={{
                  display: 'flex',
                  width: '48px',
                  height: '48px',
                  borderRadius: radius.pill,
                  backgroundColor: color.ink,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <text style={{ fontSize: font.body, fontWeight: '600', color: color.onInk }}>
                  TB
                </text>
              </view>
              <view style={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                <text style={{ fontSize: font.body, fontWeight: '600', color: color.ink }}>
                  Tomasz Boroń
                </text>
                <text style={{ fontSize: font.label, color: color.inkMuted }}>
                  Member since 2021
                </text>
              </view>
            </view>
          </Card>

          <Card padded>
            <Row
              label="Orders"
              value={orders.length === 0 ? 'None yet' : `${orders.length} →`}
              emphasis
              onTap={() => navigation.push(ACCOUNT_ROUTE.Orders)}
            />
            <Divider />
            <Row
              label="Settings"
              value="→"
              emphasis
              onTap={() => navigation.push(ACCOUNT_ROUTE.Settings)}
            />
          </Card>

          <text
            style={{
              fontSize: font.caption,
              color: color.inkFaint,
              textAlign: 'center',
            }}
          >
            This section is a nested StackContainer. Back from here closes the
            whole section — the nested stack asks its parent to pop.
          </text>
        </view>
      </scroll-view>
    </Screen>
  );
}

function OrdersScreen() {
  const navigation = useStackNavigationContext();
  const goBack = useGoBack();
  const { orders } = useShopStore();

  return (
    <Screen background={color.surface}>
      <Header title="Orders" onBack={goBack} />
      <scroll-view scroll-y style={{ display: 'flex', flexGrow: 1, width: '100%' }}>
        <view
          style={{
            display: 'flex',
            flexDirection: 'column',
            padding: space.lg,
            gap: space.md,
          }}
        >
          {orders.length === 0 ? (
            <view
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: space.sm,
                paddingTop: space.xxl,
              }}
            >
              <text style={{ fontSize: font.body, fontWeight: '600', color: color.ink }}>
                No orders yet
              </text>
              <text style={{ fontSize: font.label, color: color.inkMuted }}>
                Place one and it will appear here.
              </text>
            </view>
          ) : (
            orders.map((order) => (
              <Card
                key={order.id}
                onTap={() => {
                  setPendingParams(ACCOUNT_ROUTE.OrderDetail, {
                    orderId: order.id,
                  } satisfies OrderDetailParams);
                  navigation.push(ACCOUNT_ROUTE.OrderDetail);
                }}
              >
                <view
                  style={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    padding: space.md,
                    gap: space.md,
                  }}
                >
                  <view style={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                    <text
                      style={{ fontSize: font.body, fontWeight: '600', color: color.ink }}
                    >
                      {order.id}
                    </text>
                    <text style={{ fontSize: font.label, color: color.inkMuted }}>
                      {order.placedAtLabel} ·{' '}
                      {order.lines.length === 1 ? '1 item' : `${order.lines.length} items`}
                    </text>
                  </view>
                  <text
                    style={{ fontSize: font.body, fontWeight: '600', color: color.ink }}
                  >
                    {formatPrice(order.totalCents)}
                  </text>
                </view>
              </Card>
            ))
          )}
        </view>
      </scroll-view>
    </Screen>
  );
}

function OrderDetailScreen() {
  const params = useRouteParams<OrderDetailParams>(ACCOUNT_ROUTE.OrderDetail);
  const goBack = useGoBack();
  const { orders } = useShopStore();
  const order = orders.find((candidate) => candidate.id === params?.orderId);

  return (
    <Screen background={color.surface}>
      <Header title={order?.id ?? 'Order'} onBack={goBack} />
      <scroll-view scroll-y style={{ display: 'flex', flexGrow: 1, width: '100%' }}>
        <view
          style={{
            display: 'flex',
            flexDirection: 'column',
            padding: space.lg,
            gap: space.lg,
          }}
        >
          {!order ? (
            <text style={{ fontSize: font.body, color: color.inkMuted }}>
              This order could not be loaded.
            </text>
          ) : (
            <>
              <Card padded>
                <SectionTitle>Items</SectionTitle>
                {order.lines.map((line) => {
                  const product = findProduct(line.productId);
                  if (!product) {
                    return null;
                  }
                  return (
                    <view
                      key={line.lineId}
                      style={{ display: 'flex', flexDirection: 'column' }}
                    >
                      <Row
                        label={`${product.name} × ${line.qty}`}
                        value={formatPrice(product.priceCents * line.qty)}
                      />
                      <Divider />
                    </view>
                  );
                })}
                <Row label="Total" value={formatPrice(order.totalCents)} emphasis />
              </Card>

              <Card padded>
                <SectionTitle>Delivery</SectionTitle>
                <view style={{ display: 'flex', flexDirection: 'column', gap: space.xs }}>
                  <text style={{ fontSize: font.label, color: color.inkMuted }}>
                    Address
                  </text>
                  <text style={{ fontSize: font.body, color: color.ink }}>
                    {order.addressLine}
                  </text>
                </view>
                <Divider />
                <Row label="Window" value={order.slotLabel} />
              </Card>
            </>
          )}
        </view>
      </scroll-view>
    </Screen>
  );
}

function SettingsScreen() {
  const goBack = useGoBack();
  const { settings, updateSettings } = useShopStore();

  return (
    <Screen background={color.surface}>
      <Header title="Settings" onBack={goBack} />
      <scroll-view scroll-y style={{ display: 'flex', flexGrow: 1, width: '100%' }}>
        <view
          style={{
            display: 'flex',
            flexDirection: 'column',
            padding: space.lg,
            gap: space.lg,
          }}
        >
          <Card padded>
            <SectionTitle>Navigation</SectionTitle>
            <view
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                gap: space.md,
                paddingTop: space.sm,
              }}
            >
              <view style={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                <text style={{ fontSize: font.body, fontWeight: '600', color: color.ink }}>
                  Preload checkout
                </text>
                <text style={{ fontSize: font.label, color: color.inkMuted }}>
                  Render the checkout in the background as soon as the cart has
                  something in it, so opening it only has to attach it.
                </text>
              </view>
              <Toggle
                on={settings.preloadCheckout}
                onTap={() =>
                  updateSettings({ preloadCheckout: !settings.preloadCheckout })
                }
              />
            </view>
            <Divider />
            <view
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: space.sm,
                paddingTop: space.md,
              }}
            >
              <text style={{ fontSize: font.body, fontWeight: '600', color: color.ink }}>
                Simulated checkout cost
              </text>
              <text style={{ fontSize: font.label, color: color.inkMuted }}>
                Stands in for rehydrating cards and recomputing totals. This is
                the cost preloading moves off the tap.
              </text>
              <view style={{ display: 'flex', flexDirection: 'row', gap: space.sm }}>
                {[0, 200, 400, 800].map((ms) => (
                  <view
                    key={String(ms)}
                    bindtap={() => updateSettings({ simulatedCheckoutCostMs: ms })}
                    style={{
                      display: 'flex',
                      flexGrow: 1,
                      height: '40px',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: radius.sm,
                      borderWidth: '1px',
                      borderStyle: 'solid',
                      borderColor:
                        settings.simulatedCheckoutCostMs === ms
                          ? color.ink
                          : color.line,
                      backgroundColor:
                        settings.simulatedCheckoutCostMs === ms
                          ? color.ink
                          : color.bg,
                    }}
                  >
                    <text
                      native-interaction-enabled={false}
                      style={{
                        fontSize: font.label,
                        fontWeight: '600',
                        color:
                          settings.simulatedCheckoutCostMs === ms
                            ? color.onInk
                            : color.ink,
                      }}
                    >
                      {ms === 0 ? 'None' : `${ms}ms`}
                    </text>
                  </view>
                ))}
              </view>
            </view>
          </Card>

          <Card padded>
            <SectionTitle>Try it</SectionTitle>
            <text style={{ fontSize: font.label, color: color.inkMuted }}>
              Turn preloading off, put something in the cart, and open the
              checkout: the tap hangs for the simulated cost before the screen
              moves. Turn it back on and the same push is instant, because the
              screen was already rendered in detached mode while you browsed.
            </text>
          </Card>

          <Button label="Done" variant="secondary" onTap={goBack} />
        </view>
      </scroll-view>
    </Screen>
  );
}

const ACCOUNT_ROUTE_CONFIGS: StackRouteConfig[] = [
  { name: ACCOUNT_ROUTE.AccountHome, Component: AccountHomeScreen, options: {} },
  { name: ACCOUNT_ROUTE.Orders, Component: OrdersScreen, options: {} },
  { name: ACCOUNT_ROUTE.OrderDetail, Component: OrderDetailScreen, options: {} },
  { name: ACCOUNT_ROUTE.Settings, Component: SettingsScreen, options: {} },
];
