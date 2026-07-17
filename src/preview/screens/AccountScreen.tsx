import React from 'react';
import { useStackNavigationContext } from '../../hooks/useStackNavigationContext';
import { ROUTE, type OrderDetailParams } from '../routes';
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
 * The account section pushes onto the root stack like every other screen.
 *
 * It used to be its own StackContainer nested inside a root screen — the shape a
 * real app reaches for when a tab or a modal flow owns its own history — which
 * is the more interesting thing to demonstrate. It is flat because a nested
 * container puts a second UINavigationController inside a screen of the first,
 * and iOS then draws both of their navigation bars: two back chevrons stacked
 * down the top-left corner, the lower one landing on the app's own header. The
 * library has no way to hide a stack's native header, so there is nothing the
 * app can do about it from here.
 */
export function AccountScreen() {
  const navigation = useStackNavigationContext();
  const { orders } = useShopStore();

  return (
    <Screen background={color.surface}>
      <Header title="Account" subtitle="Tomasz Boroń" />

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
              onTap={() => navigation.push(ROUTE.Orders)}
            />
            <Divider />
            <Row
              label="Settings"
              value="→"
              emphasis
              onTap={() => navigation.push(ROUTE.Settings)}
            />
          </Card>

          <text
            style={{
              fontSize: font.caption,
              color: color.inkFaint,
              textAlign: 'center',
            }}
          >
            Every screen in this section is pushed onto the one stack the app
            has. Back from here returns to the storefront.
          </text>
        </view>
      </scroll-view>
    </Screen>
  );
}

export function OrdersScreen() {
  const navigation = useStackNavigationContext();
  const { orders } = useShopStore();

  return (
    <Screen background={color.surface}>
      <Header title="Orders" />
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
                  setPendingParams(ROUTE.OrderDetail, {
                    orderId: order.id,
                  } satisfies OrderDetailParams);
                  navigation.push(ROUTE.OrderDetail);
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

export function OrderDetailScreen() {
  const params = useRouteParams<OrderDetailParams>(ROUTE.OrderDetail);
  const { orders } = useShopStore();
  const order = orders.find((candidate) => candidate.id === params?.orderId);

  return (
    <Screen background={color.surface}>
      <Header title={order?.id ?? 'Order'} />
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

export function SettingsScreen() {
  const goBack = useGoBack();
  const { settings, updateSettings } = useShopStore();

  return (
    <Screen background={color.surface}>
      <Header title="Settings" />
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
