import React from 'react';
import { useStackNavigationContext } from '../../hooks/useStackNavigationContext';
import {
  DELIVERY_SLOTS,
  SAVED_ADDRESSES,
  SAVED_CARDS,
} from '../data/catalog';
import { ROUTE } from '../routes';
import { useRegisterRoute } from '../state/RouteRegistry';
import { SHIPPING_FLAT_CENTS, useCartLineProducts, useShopStore } from '../state/shopStoreContext';
import { useCompleteOrder, useGoBack } from '../state/shopNavigation';
import { color, font, formatPrice, radius, space } from '../theme';
import {
  Badge,
  Button,
  Card,
  Divider,
  Header,
  Row,
  Screen,
  SectionTitle,
  Sheet,
} from '../ui/kit';

/**
 * Stands in for the work a real checkout does before it can paint: rehydrating
 * saved cards, recalculating tax and delivery windows, revalidating the basket
 * against stock. Exaggerated and synchronous so the cost of a cold push is
 * visible on a fast device rather than merely measurable.
 *
 * Whether this runs on the tap or long before it is exactly what the preload
 * toggle in Account → Settings changes.
 */
function simulateFirstRenderCost(durationMs: number): void {
  const startedAt = Date.now();
  while (Date.now() - startedAt < durationMs) {
    // Intentionally blocking.
  }
}

export function CheckoutScreen() {
  useRegisterRoute(ROUTE.Checkout);

  const navigation = useStackNavigationContext();
  const goBack = useGoBack();
  const completeOrder = useCompleteOrder();
  const lines = useCartLineProducts();
  const {
    cartSubtotalCents,
    placeOrder,
    settings,
    registerCheckoutInstance,
  } = useShopStore();

  // Paid once per instance, during the first render — at preload time when the
  // screen is warmed, at push time when it is not.
  React.useState(() => {
    simulateFirstRenderCost(settings.simulatedCheckoutCostMs);
    return true;
  });

  // Lets the Storefront know a Checkout already exists, so it does not warm a
  // second one, and re-warms once this instance goes away.
  React.useEffect(
    () => registerCheckoutInstance(),
    [registerCheckoutInstance],
  );

  const [addressId, setAddressId] = React.useState(SAVED_ADDRESSES[0].id);
  const [cardId, setCardId] = React.useState(SAVED_CARDS[0].id);
  const [slotId, setSlotId] = React.useState(DELIVERY_SLOTS[0].id);
  const [note, setNote] = React.useState('');
  const [showDiscardSheet, setShowDiscardSheet] = React.useState(false);

  const slot = DELIVERY_SLOTS.find((candidate) => candidate.id === slotId)!;
  const address = SAVED_ADDRESSES.find((candidate) => candidate.id === addressId)!;
  const card = SAVED_CARDS.find((candidate) => candidate.id === cardId)!;
  const totalCents = cartSubtotalCents + SHIPPING_FLAT_CENTS + slot.priceCents;

  /**
   * Dirty tracking. Once the user has touched the form we ask the native side
   * to stop honouring the swipe-back / system-back gesture, and to tell us it
   * blocked one instead — at which point we can ask whether to discard.
   *
   * `setRouteOptions` is what makes this possible: the route was pushed with
   * `preventNativeDismiss: false`, and this promotes *this instance* to guarded
   * without touching the blueprint every other Checkout is built from.
   */
  const markDirty = React.useCallback(() => {
    navigation.setRouteOptions(navigation.routeKey, {
      preventNativeDismiss: true,
      onNativeDismissPrevented: () => setShowDiscardSheet(true),
    });
  }, [navigation]);

  const releaseGuard = React.useCallback(() => {
    navigation.setRouteOptions(navigation.routeKey, {
      preventNativeDismiss: false,
      onNativeDismissPrevented: undefined,
    });
  }, [navigation]);

  const isGuarded = navigation.routeOptions.preventNativeDismiss === true;

  const requestLeave = React.useCallback(() => {
    if (isGuarded) {
      setShowDiscardSheet(true);
    } else {
      goBack();
    }
  }, [isGuarded, goBack]);

  const discardAndLeave = React.useCallback(() => {
    setShowDiscardSheet(false);
    releaseGuard();
    goBack();
  }, [releaseGuard, goBack]);

  const onPlaceOrder = React.useCallback(() => {
    // Drop the guard first: the funnel is about to be popped on purpose.
    releaseGuard();
    placeOrder({
      addressLine: address.line,
      slotLabel: `${slot.day}, ${slot.window}`,
      totalCents,
    });
    completeOrder();
  }, [releaseGuard, placeOrder, address, slot, totalCents, completeOrder]);

  return (
    <Screen background={color.surface}>
      <Header
        title="Checkout"
        subtitle={isGuarded ? 'Unsaved changes — back is guarded' : undefined}
        onBack={requestLeave}
        right={isGuarded ? <Badge label="Guarded" tone="accent" /> : undefined}
      />

      <scroll-view scroll-y style={{ display: 'flex', flexGrow: 1, width: '100%' }}>
        <view
          style={{
            display: 'flex',
            flexDirection: 'column',
            padding: space.lg,
            gap: space.lg,
          }}
        >
          <view style={{ display: 'flex', flexDirection: 'column' }}>
            <SectionTitle>Deliver to</SectionTitle>
            <view style={{ display: 'flex', flexDirection: 'column', gap: space.sm }}>
              {SAVED_ADDRESSES.map((candidate) => (
                <SelectableCard
                  key={candidate.id}
                  selected={candidate.id === addressId}
                  onTap={() => {
                    setAddressId(candidate.id);
                    markDirty();
                  }}
                  title={candidate.label}
                  subtitle={candidate.line}
                />
              ))}
            </view>
          </view>

          <view style={{ display: 'flex', flexDirection: 'column' }}>
            <SectionTitle>Delivery window</SectionTitle>
            <view
              style={{
                display: 'flex',
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: space.sm,
              }}
            >
              {DELIVERY_SLOTS.map((candidate) => (
                <view
                  key={candidate.id}
                  bindtap={() => {
                    setSlotId(candidate.id);
                    markDirty();
                  }}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    width: '47%',
                    padding: space.md,
                    borderRadius: radius.md,
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    borderColor:
                      candidate.id === slotId ? color.ink : color.line,
                    backgroundColor: color.bg,
                  }}
                >
                  <text
                    native-interaction-enabled={false}
                    style={{
                      fontSize: font.label,
                      fontWeight: '600',
                      color: color.ink,
                    }}
                  >
                    {candidate.day}
                  </text>
                  <text
                    native-interaction-enabled={false}
                    style={{ fontSize: font.label, color: color.inkMuted }}
                  >
                    {candidate.window}
                  </text>
                  <text
                    native-interaction-enabled={false}
                    style={{
                      fontSize: font.caption,
                      color:
                        candidate.priceCents === 0 ? color.success : color.inkMuted,
                      marginTop: space.xs,
                    }}
                  >
                    {candidate.priceCents === 0
                      ? 'Free'
                      : `+${formatPrice(candidate.priceCents)}`}
                  </text>
                </view>
              ))}
            </view>
          </view>

          <view style={{ display: 'flex', flexDirection: 'column' }}>
            <SectionTitle>Payment</SectionTitle>
            <view style={{ display: 'flex', flexDirection: 'column', gap: space.sm }}>
              {SAVED_CARDS.map((candidate) => (
                <SelectableCard
                  key={candidate.id}
                  selected={candidate.id === cardId}
                  onTap={() => {
                    setCardId(candidate.id);
                    markDirty();
                  }}
                  title={candidate.label}
                  subtitle={`Expires ${candidate.expiry}`}
                />
              ))}
            </view>
          </view>

          <view style={{ display: 'flex', flexDirection: 'column' }}>
            <SectionTitle>Delivery note</SectionTitle>
            <view
              style={{
                display: 'flex',
                borderRadius: radius.md,
                borderWidth: '1px',
                borderStyle: 'solid',
                borderColor: color.line,
                backgroundColor: color.bg,
                paddingLeft: space.md,
                paddingRight: space.md,
                height: '48px',
                justifyContent: 'center',
              }}
            >
              {/* Lynx `input` is uncontrolled — mirror it into state instead. */}
              <input
                placeholder="Leave with the neighbour…"
                style={{
                  height: '48px',
                  width: '100%',
                  fontSize: font.body,
                  color: color.ink,
                }}
                bindinput={(event) => {
                  setNote(event.detail.value);
                  markDirty();
                }}
              />
            </view>
          </view>

          <Card padded>
            <SectionTitle>Order summary</SectionTitle>
            {lines.map(({ line, product }) => (
              <view key={line.lineId} style={{ display: 'flex', flexDirection: 'column' }}>
                <Row
                  label={`${product.name} × ${line.qty}`}
                  value={formatPrice(product.priceCents * line.qty)}
                />
                <Divider />
              </view>
            ))}
            <Row label="Shipping" value="Free" />
            <Divider />
            <Row
              label="Delivery window"
              value={slot.priceCents === 0 ? 'Free' : formatPrice(slot.priceCents)}
            />
            <Divider />
            {note.length > 0 && (
              <>
                <Row label="Note" value={note} />
                <Divider />
              </>
            )}
            <Row label="Total" value={formatPrice(totalCents)} emphasis />
          </Card>

          <view style={{ height: '96px' }} />
        </view>
      </scroll-view>

      <view
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: space.sm,
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
          label={`Place order · ${formatPrice(totalCents)}`}
          disabled={lines.length === 0}
          onTap={onPlaceOrder}
        />
        <text
          style={{
            fontSize: font.caption,
            color: color.inkFaint,
            textAlign: 'center',
          }}
        >
          Paying {formatPrice(totalCents)} with {card.label}
        </text>
      </view>

      {showDiscardSheet && (
        <Sheet
          title="Discard this order?"
          body="Your delivery details will be lost. Your cart stays as it is."

        >
          <Button
            fullWidth
            variant="danger"
            label="Discard and leave"
            onTap={discardAndLeave}
          />
          <Button
            fullWidth
            variant="secondary"
            label="Keep editing"
            onTap={() => setShowDiscardSheet(false)}
          />
        </Sheet>
      )}
    </Screen>
  );
}

function SelectableCard(props: {
  selected: boolean;
  onTap: () => void;
  title: string;
  subtitle: string;
}) {
  return (
    <view
      bindtap={props.onTap}
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: space.md,
        padding: space.md,
        borderRadius: radius.md,
        borderWidth: '1px',
        borderStyle: 'solid',
        borderColor: props.selected ? color.ink : color.line,
        backgroundColor: color.bg,
      }}
    >
      <view
        style={{
          display: 'flex',
          width: '18px',
          height: '18px',
          borderRadius: radius.pill,
          borderWidth: '1px',
          borderStyle: 'solid',
          borderColor: props.selected ? color.ink : color.line,
          backgroundColor: props.selected ? color.ink : 'transparent',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      />
      <view style={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
        <text
          native-interaction-enabled={false}
          style={{ fontSize: font.body, fontWeight: '600', color: color.ink }}
        >
          {props.title}
        </text>
        <text
          native-interaction-enabled={false}
          style={{ fontSize: font.label, color: color.inkMuted }}
        >
          {props.subtitle}
        </text>
      </view>
    </view>
  );
}
