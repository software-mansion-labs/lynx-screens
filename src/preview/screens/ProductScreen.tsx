import React from 'react';
import { useStackNavigationContext } from '../../hooks/useStackNavigationContext';
import { findProduct, PRODUCTS } from '../data/catalog';
import { ROUTE, type ProductParams } from '../routes';
import { useRouteParams } from '../state/navParams';
import { useRegisterRoute } from '../state/RouteRegistry';
import { useShopStore } from '../state/shopStoreContext';
import { useBuyNow, useOpenProduct } from '../state/shopNavigation';
import { color, font, formatPrice, radius, space } from '../theme';
import {
  Badge,
  BottomBar,
  Button,
  Card,
  Divider,
  ProductImage,
  Screen,
  SectionTitle,
} from '../ui/kit';

export function ProductScreen() {
  useRegisterRoute(ROUTE.Product);

  // Snapshotted once, on mount: two Product screens stacked on top of each
  // other (via "You might also like") each keep their own product.
  const params = useRouteParams<ProductParams>(ROUTE.Product);
  const product = params ? findProduct(params.productId) : undefined;

  const navigation = useStackNavigationContext();
  const { addToCart, cartCount } = useShopStore();
  const openProduct = useOpenProduct();
  const buyNow = useBuyNow();

  const [size, setSize] = React.useState(() => product?.sizes[0] ?? '');
  const [added, setAdded] = React.useState(false);

  if (!product) {
    return (
      <Screen>
        <view
          style={{
            display: 'flex',
            flexDirection: 'column',
            flexGrow: 1,
            alignItems: 'center',
            justifyContent: 'center',
            gap: space.md,
          }}
        >
          <text style={{ fontSize: font.body, color: color.inkMuted }}>
            This product could not be loaded.
          </text>
        </view>
      </Screen>
    );
  }

  const related = PRODUCTS.filter((candidate) => candidate.id !== product.id).slice(0, 3);

  return (
    <Screen background={color.surface}>
      <scroll-view scroll-y style={{ display: 'flex', flexGrow: 1, width: '100%' }}>
        <view style={{ display: 'flex', flexDirection: 'column' }}>
          {/* Full-bleed hero: renders under the iOS nav bar on purpose. */}
          <ProductImage gradient={product.gradient} height="320px" />

          <view
            style={{
              display: 'flex',
              flexDirection: 'column',
              padding: space.lg,
              gap: space.lg,
            }}
          >
            <view style={{ display: 'flex', flexDirection: 'column', gap: space.xs }}>
              <text style={{ fontSize: font.label, color: color.inkMuted }}>
                {product.brand}
              </text>
              <text
                style={{
                  fontSize: font.display,
                  fontWeight: '700',
                  color: color.ink,
                  letterSpacing: '-0.02em',
                }}
              >
                {product.name}
              </text>
              <view
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: space.sm,
                }}
              >
                <text
                  style={{ fontSize: font.title, fontWeight: '600', color: color.ink }}
                >
                  {formatPrice(product.priceCents)}
                </text>
                <text style={{ fontSize: font.label, color: color.inkFaint }}>
                  ★ {product.rating.toFixed(1)} · {product.reviewCount} reviews
                </text>
              </view>
              <text
                style={{
                  fontSize: font.body,
                  color: color.inkMuted,
                  marginTop: space.xs,
                }}
              >
                {product.blurb}
              </text>
            </view>

            {product.sizes.length > 1 && (
              <view style={{ display: 'flex', flexDirection: 'column' }}>
                <SectionTitle>Size</SectionTitle>
                <view
                  style={{
                    display: 'flex',
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    gap: space.sm,
                  }}
                >
                  {product.sizes.map((candidate) => (
                    <view
                      key={candidate}
                      bindtap={() => setSize(candidate)}
                      style={{
                        display: 'flex',
                        minWidth: '52px',
                        height: '44px',
                        paddingLeft: space.md,
                        paddingRight: space.md,
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: radius.sm,
                        borderWidth: '1px',
                        borderStyle: 'solid',
                        borderColor: candidate === size ? color.ink : color.line,
                        backgroundColor:
                          candidate === size ? color.ink : color.bg,
                      }}
                    >
                      <text
                        native-interaction-enabled={false}
                        style={{
                          fontSize: font.body,
                          fontWeight: '600',
                          color: candidate === size ? color.onInk : color.ink,
                        }}
                      >
                        {candidate}
                      </text>
                    </view>
                  ))}
                </view>
              </view>
            )}

            <Card padded>
              <SectionTitle>Details</SectionTitle>
              {product.details.map((detail, index) => (
                <view key={detail} style={{ display: 'flex', flexDirection: 'column' }}>
                  {index > 0 && <Divider />}
                  <text
                    style={{
                      fontSize: font.body,
                      color: color.inkMuted,
                      paddingTop: space.sm,
                      paddingBottom: space.sm,
                    }}
                  >
                    {detail}
                  </text>
                </view>
              ))}
            </Card>

            <view style={{ display: 'flex', flexDirection: 'column' }}>
              <SectionTitle>You might also like</SectionTitle>
              <view style={{ display: 'flex', flexDirection: 'column', gap: space.sm }}>
                {related.map((candidate) => (
                  <Card key={candidate.id} onTap={() => openProduct(candidate.id)}>
                    <view
                      style={{
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                        padding: space.md,
                        gap: space.md,
                      }}
                    >
                      <view
                        style={{
                          display: 'flex',
                          width: '48px',
                          height: '48px',
                          borderRadius: radius.sm,
                          backgroundImage: candidate.gradient,
                        }}
                      />
                      <view
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          flexGrow: 1,
                        }}
                      >
                        <text
                          style={{
                            fontSize: font.body,
                            fontWeight: '600',
                            color: color.ink,
                          }}
                        >
                          {candidate.name}
                        </text>
                        <text style={{ fontSize: font.label, color: color.inkMuted }}>
                          {candidate.brand}
                        </text>
                      </view>
                      <text
                        style={{
                          fontSize: font.body,
                          fontWeight: '600',
                          color: color.ink,
                        }}
                      >
                        {formatPrice(candidate.priceCents)}
                      </text>
                    </view>
                  </Card>
                ))}
              </view>
            </view>

            <view style={{ height: '96px' }} />
          </view>
        </view>
      </scroll-view>

      <BottomBar>
        <view style={{ display: 'flex', flexDirection: 'row', gap: space.sm }}>
          <view style={{ display: 'flex', flexGrow: 1 }}>
            <Button
              fullWidth
              variant="secondary"
              label={added ? `In cart · ${cartCount}` : 'Add to cart'}
              onTap={() => {
                addToCart(product.id, size);
                setAdded(true);
              }}
            />
          </view>
          <view style={{ display: 'flex', flexGrow: 1 }}>
            <Button
              fullWidth
              label="Buy now"
              onTap={() => buyNow(product.id, size)}
            />
          </view>
        </view>
        {/* Height is reserved so revealing the confirmation cannot shift the
            buttons out from under the user's finger. */}
        <view
          style={{
            display: 'flex',
            flexDirection: 'row',
            height: '22px',
            alignItems: 'center',
            justifyContent: 'center',
            gap: space.sm,
          }}
        >
          {added && (
            <>
              <Badge label="Added" tone="success" />
              <text
                style={{ fontSize: font.label, color: color.inkMuted }}
                bindtap={() => navigation.push(ROUTE.Cart)}
              >
                View cart
              </text>
            </>
          )}
        </view>
      </BottomBar>
    </Screen>
  );
}
