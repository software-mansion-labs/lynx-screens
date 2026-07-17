import { useStackNavigationContext } from '../../hooks/useStackNavigationContext';
import { PRODUCTS, type Product } from '../data/catalog';
import { ROUTE } from '../routes';
import { useRegisterRoute } from '../state/RouteRegistry';
import { useShopStore } from '../state/shopStoreContext';
import { useOpenProduct, usePreloadCheckout } from '../state/shopNavigation';
import { color, font, formatPrice, inset, radius, space } from '../theme';
import { Badge, CartButton, Card, ProductImage, Screen } from '../ui/kit';

export function StorefrontScreen() {
  useRegisterRoute(ROUTE.Storefront);

  // The Storefront outlives every other screen, which makes it the right place
  // to warm the checkout while the user is still browsing.
  usePreloadCheckout();

  const navigation = useStackNavigationContext();
  const { cartCount, settings } = useShopStore();
  const openProduct = useOpenProduct();

  return (
    <Screen background={color.surface}>
      <view
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingLeft: space.lg,
          paddingRight: space.lg,
          paddingTop: inset.top,
          paddingBottom: space.md,
          backgroundColor: color.bg,
        }}
      >
        <view style={{ display: 'flex', flexDirection: 'column' }}>
          <text
            style={{
              fontSize: font.display,
              fontWeight: '700',
              color: color.ink,
              letterSpacing: '-0.02em',
            }}
          >
            Northwell
          </text>
          <text style={{ fontSize: font.label, color: color.inkMuted }}>
            Free returns · Ships tomorrow
          </text>
        </view>
        <view style={{ display: 'flex', flexDirection: 'row', gap: space.sm }}>
          <view
            bindtap={() => navigation.push(ROUTE.Account)}
            style={{
              display: 'flex',
              width: '36px',
              height: '36px',
              borderRadius: radius.pill,
              backgroundColor: color.surface,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <text
              native-interaction-enabled={false}
              style={{ fontSize: font.label, fontWeight: '600', color: color.ink }}
            >
              TB
            </text>
          </view>
          <CartButton
            count={cartCount}
            onTap={() => navigation.push(ROUTE.Cart)}
          />
        </view>
      </view>

      <scroll-view
        scroll-y
        style={{ display: 'flex', flexGrow: 1, width: '100%' }}
      >
        <view
          style={{
            display: 'flex',
            flexDirection: 'column',
            padding: space.lg,
            gap: space.lg,
          }}
        >
          {cartCount > 0 && settings.preloadCheckout && (
            <view
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                gap: space.sm,
                padding: space.md,
                borderRadius: radius.md,
                backgroundColor: color.accentSoft,
              }}
            >
              <Badge label="Preloaded" tone="accent" />
              <text style={{ fontSize: font.label, color: color.accent, flexGrow: 1 }}>
                Checkout is warmed and waiting — opening it is instant.
              </text>
            </view>
          )}

          <view
            style={{
              display: 'flex',
              flexDirection: 'row',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              gap: space.lg,
            }}
          >
            {PRODUCTS.map((product) => (
              <ProductTile
                key={product.id}
                product={product}
                onTap={() => openProduct(product.id)}
              />
            ))}
          </view>
        </view>
      </scroll-view>
    </Screen>
  );
}

function ProductTile(props: { product: Product; onTap: () => void }) {
  const { product } = props;

  return (
    <view style={{ display: 'flex', flexDirection: 'column', width: '47%' }}>
      <Card onTap={props.onTap}>
        <ProductImage gradient={product.gradient} label={product.brand} />
        <view
          style={{
            display: 'flex',
            flexDirection: 'column',
            padding: space.md,
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
          <view
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <text
              style={{ fontSize: font.body, fontWeight: '600', color: color.ink }}
            >
              {formatPrice(product.priceCents)}
            </text>
            <text style={{ fontSize: font.caption, color: color.inkFaint }}>
              ★ {product.rating.toFixed(1)}
            </text>
          </view>
        </view>
      </Card>
    </view>
  );
}
