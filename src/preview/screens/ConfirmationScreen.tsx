import { useStackNavigationContext } from '../../hooks/useStackNavigationContext';
import { findProduct } from '../data/catalog';
import { ROUTE } from '../routes';
import { useRegisterRoute } from '../state/RouteRegistry';
import { useShopStore } from '../state/shopStoreContext';
import { useGoBack } from '../state/shopNavigation';
import { color, font, formatPrice, radius, space, useSafeArea } from '../theme';
import { Button, Card, Divider, Row, Screen, SectionTitle } from '../ui/kit';

export function ConfirmationScreen() {
  useRegisterRoute(ROUTE.Confirmation);

  const navigation = useStackNavigationContext();
  const goBack = useGoBack();
  const { lastOrder } = useShopStore();
  const safeArea = useSafeArea();

  return (
    <Screen background={color.surface}>
      <scroll-view scroll-y style={{ display: 'flex', flexGrow: 1, width: '100%' }}>
        <view
          style={{
            display: 'flex',
            flexDirection: 'column',
            padding: space.lg,
            paddingTop: safeArea.top,
            paddingBottom: safeArea.bottom,
            gap: space.lg,
          }}
        >
          <view
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              marginTop: space.xxl,
              gap: space.md,
            }}
          >
            <view
              style={{
                display: 'flex',
                width: '64px',
                height: '64px',
                borderRadius: radius.pill,
                backgroundColor: color.successSoft,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <text style={{ fontSize: '28px', color: color.success }}>✓</text>
            </view>
            <text
              style={{
                fontSize: font.display,
                fontWeight: '700',
                color: color.ink,
                letterSpacing: '-0.02em',
              }}
            >
              Order placed
            </text>
            <text
              style={{
                fontSize: font.body,
                color: color.inkMuted,
                textAlign: 'center',
              }}
            >
              {lastOrder
                ? `${lastOrder.id} · arriving ${lastOrder.slotLabel.toLowerCase()}`
                : 'Your order is on its way.'}
            </text>
          </view>

          {lastOrder && (
            <Card padded>
              <SectionTitle>What you bought</SectionTitle>
              {lastOrder.lines.map((line) => {
                const product = findProduct(line.productId);
                if (!product) {
                  return null;
                }
                return (
                  <view key={line.lineId} style={{ display: 'flex', flexDirection: 'column' }}>
                    <Row
                      label={`${product.name} × ${line.qty}`}
                      value={formatPrice(product.priceCents * line.qty)}
                    />
                    <Divider />
                  </view>
                );
              })}
              <Row label="Total paid" value={formatPrice(lastOrder.totalCents)} emphasis />
              <Divider />
              <view style={{ display: 'flex', flexDirection: 'column', paddingTop: space.md }}>
                <text style={{ fontSize: font.label, color: color.inkMuted }}>
                  Delivering to
                </text>
                <text style={{ fontSize: font.body, color: color.ink }}>
                  {lastOrder.addressLine}
                </text>
              </view>
            </Card>
          )}

          <view
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: space.sm,
              marginTop: space.sm,
            }}
          >
            <Button
              fullWidth
              label="Back to the shop"
              onTap={goBack}
            />
            <Button
              fullWidth
              variant="secondary"
              label="View my orders"
              onTap={() => navigation.push(ROUTE.Account)}
            />
          </view>

          <text
            style={{
              fontSize: font.caption,
              color: color.inkFaint,
              textAlign: 'center',
            }}
          >
            Swipe back from here and you land on the storefront — the cart and
            checkout were popped in the same batch that pushed this screen.
          </text>
        </view>
      </scroll-view>
    </Screen>
  );
}
