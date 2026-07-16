import { useStackNavigationContext } from '../../hooks/useStackNavigationContext';
import { ROUTE } from '../routes';
import { useRegisterRoute } from '../state/RouteRegistry';
import { SHIPPING_FLAT_CENTS, useCartLineProducts, useShopStore } from '../state/shopStoreContext';
import { useGoBack, useOpenProduct } from '../state/shopNavigation';
import { color, font, formatPrice, radius, space } from '../theme';
import { Button, Card, Divider, Header, Row, Screen } from '../ui/kit';

export function CartScreen() {
  useRegisterRoute(ROUTE.Cart);

  const navigation = useStackNavigationContext();
  const goBack = useGoBack();
  const openProduct = useOpenProduct();
  const lines = useCartLineProducts();
  const { setLineQty, cartSubtotalCents, cartCount } = useShopStore();

  const totalCents = cartSubtotalCents + SHIPPING_FLAT_CENTS;

  return (
    <Screen background={color.surface}>
      <Header
        title="Cart"
        subtitle={cartCount === 1 ? '1 item' : `${cartCount} items`}
        onBack={goBack}
      />

      {lines.length === 0 ? (
        <view
          style={{
            display: 'flex',
            flexDirection: 'column',
            flexGrow: 1,
            alignItems: 'center',
            justifyContent: 'center',
            gap: space.md,
            padding: space.xl,
          }}
        >
          <text style={{ fontSize: font.title, fontWeight: '600', color: color.ink }}>
            Your cart is empty
          </text>
          <text
            style={{
              fontSize: font.body,
              color: color.inkMuted,
              textAlign: 'center',
            }}
          >
            Add something you like and it will show up here.
          </text>
          <Button label="Keep browsing" variant="secondary" onTap={goBack} />
        </view>
      ) : (
        <>
          <scroll-view scroll-y style={{ display: 'flex', flexGrow: 1, width: '100%' }}>
            <view
              style={{
                display: 'flex',
                flexDirection: 'column',
                padding: space.lg,
                gap: space.md,
              }}
            >
              {lines.map(({ line, product }) => (
                <Card key={line.lineId}>
                  <view
                    style={{
                      display: 'flex',
                      flexDirection: 'row',
                      padding: space.md,
                      gap: space.md,
                    }}
                  >
                    <view
                      bindtap={() => openProduct(product.id)}
                      style={{
                        display: 'flex',
                        width: '72px',
                        height: '72px',
                        borderRadius: radius.sm,
                        backgroundImage: product.gradient,
                      }}
                    />
                    <view
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        flexGrow: 1,
                        gap: space.xs,
                      }}
                    >
                      <text
                        style={{
                          fontSize: font.body,
                          fontWeight: '600',
                          color: color.ink,
                        }}
                      >
                        {product.name}
                      </text>
                      <text style={{ fontSize: font.label, color: color.inkMuted }}>
                        {product.brand} · Size {line.size}
                      </text>
                      <view
                        style={{
                          display: 'flex',
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginTop: space.xs,
                        }}
                      >
                        <QtyStepper
                          qty={line.qty}
                          onChange={(qty) => setLineQty(line.lineId, qty)}
                        />
                        <text
                          style={{
                            fontSize: font.body,
                            fontWeight: '600',
                            color: color.ink,
                          }}
                        >
                          {formatPrice(product.priceCents * line.qty)}
                        </text>
                      </view>
                    </view>
                  </view>
                </Card>
              ))}

              <Card padded>
                <Row label="Subtotal" value={formatPrice(cartSubtotalCents)} />
                <Divider />
                <Row label="Shipping" value="Free" />
                <Divider />
                <Row label="Total" value={formatPrice(totalCents)} emphasis />
              </Card>
            </view>
          </scroll-view>

          <view
            style={{
              display: 'flex',
              flexDirection: 'column',
              padding: space.lg,
              paddingBottom: space.xl,
              backgroundColor: color.bg,
              borderTopWidth: '1px',
              borderTopStyle: 'solid',
              borderTopColor: color.line,
            }}
          >
            <Button
              fullWidth
              label={`Checkout · ${formatPrice(totalCents)}`}
              onTap={() => navigation.push(ROUTE.Checkout)}
            />
          </view>
        </>
      )}
    </Screen>
  );
}

function QtyStepper(props: { qty: number; onChange: (qty: number) => void }) {
  return (
    <view
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: radius.sm,
        borderWidth: '1px',
        borderStyle: 'solid',
        borderColor: color.line,
      }}
    >
      <StepperButton label="−" onTap={() => props.onChange(props.qty - 1)} />
      <view
        style={{
          display: 'flex',
          minWidth: '32px',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <text style={{ fontSize: font.body, fontWeight: '600', color: color.ink }}>
          {String(props.qty)}
        </text>
      </view>
      <StepperButton label="+" onTap={() => props.onChange(props.qty + 1)} />
    </view>
  );
}

function StepperButton(props: { label: string; onTap: () => void }) {
  return (
    <view
      bindtap={props.onTap}
      style={{
        display: 'flex',
        width: '32px',
        height: '32px',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <text
        native-interaction-enabled={false}
        style={{ fontSize: font.title, color: color.inkMuted }}
      >
        {props.label}
      </text>
    </view>
  );
}
