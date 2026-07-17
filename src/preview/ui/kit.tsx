import React from 'react';
import { color, font, radius, shadow, space, useSafeArea } from '../theme';

/**
 * Presentational primitives shared by the preview screens. Nothing here touches
 * navigation — keeping the chrome dumb makes the StackContainer usage in the
 * screens easier to read.
 */

export function Screen(props: {
  children: React.ReactNode;
  background?: string;
}) {
  return (
    <view
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        backgroundColor: props.background ?? color.bg,
      }}
    >
      {props.children}
    </view>
  );
}

/**
 * Titles the screen. Deliberately has no back affordance: going back is the
 * native stack's job — the iOS nav bar's back button and the system back
 * gesture on both platforms — and that is the thing this app exists to show.
 *
 * `useSafeArea().top` is what keeps this clear of the iOS nav bar it renders
 * under, and of the Android status bar.
 *
 * `flexShrink: 0` is not decoration: the screen is a flex column whose
 * scroll-view sizes to its content, so a long screen overflows the column and
 * the chrome — being shrinkable by default — gets squeezed. That truncated the
 * title on Checkout, the longest form in the app.
 */
export function Header(props: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  const safeArea = useSafeArea();

  return (
    <view
      style={{
        display: 'flex',
        flexDirection: 'row',
        flexShrink: 0,
        alignItems: 'center',
        gap: space.sm,
        paddingLeft: space.lg,
        paddingRight: space.lg,
        paddingTop: safeArea.top,
        paddingBottom: space.md,
        backgroundColor: color.bg,
        borderBottomWidth: '1px',
        borderBottomStyle: 'solid',
        borderBottomColor: color.line,
      }}
    >
      {/*
        `flexShrink` + `minWidth: 0` let a long subtitle give way to `right`
        instead of pushing it out of the header.
      */}
      <view
        style={{
          display: 'flex',
          flexDirection: 'column',
          flexGrow: 1,
          flexShrink: 1,
          minWidth: 0,
        }}
      >
        <text
          style={{
            fontSize: font.title,
            fontWeight: '600',
            color: color.ink,
          }}
        >
          {props.title}
        </text>
        {props.subtitle && (
          <text style={{ fontSize: font.label, color: color.inkMuted }}>
            {props.subtitle}
          </text>
        )}
      </view>
      {props.right && (
        <view style={{ display: 'flex', flexShrink: 0 }}>{props.right}</view>
      )}
    </view>
  );
}

/**
 * The pinned action bar at the foot of a screen. Owns the home-indicator inset
 * so that its buttons are tappable rather than tucked under the system gesture
 * area.
 *
 * `flexShrink: 0` for the same reason as Header — without it the column squeezes
 * this bar and its rows overlap each other.
 */
export function BottomBar(props: { children: React.ReactNode }) {
  const safeArea = useSafeArea();

  return (
    <view
      style={{
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        gap: space.sm,
        padding: space.lg,
        paddingBottom: safeArea.bottom,
        backgroundColor: color.bg,
        borderTopWidth: '1px',
        borderTopStyle: 'solid',
        borderTopColor: color.line,
      }}
    >
      {props.children}
    </view>
  );
}

export function Button(props: {
  label: string;
  onTap: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  disabled?: boolean;
  fullWidth?: boolean;
}) {
  const variant = props.variant ?? 'primary';

  const palette = {
    primary: { bg: color.ink, fg: color.onInk, border: color.ink },
    secondary: { bg: color.bg, fg: color.ink, border: color.line },
    ghost: { bg: 'transparent', fg: color.accent, border: 'transparent' },
    danger: { bg: color.danger, fg: color.onInk, border: color.danger },
  }[variant];

  return (
    <view
      bindtap={props.disabled ? undefined : props.onTap}
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: '48px',
        paddingLeft: space.lg,
        paddingRight: space.lg,
        borderRadius: radius.md,
        borderWidth: '1px',
        borderStyle: 'solid',
        borderColor: palette.border,
        backgroundColor: palette.bg,
        opacity: props.disabled ? 0.4 : 1,
        width: props.fullWidth ? '100%' : undefined,
      }}
    >
      <text
        native-interaction-enabled={false}
        user-interaction-enabled={false}
        style={{
          fontSize: font.body,
          fontWeight: '600',
          color: palette.fg,
        }}
      >
        {props.label}
      </text>
    </view>
  );
}

export function Card(props: {
  children: React.ReactNode;
  onTap?: () => void;
  padded?: boolean;
}) {
  return (
    <view
      bindtap={props.onTap}
      style={{
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: color.bg,
        borderRadius: radius.lg,
        borderWidth: '1px',
        borderStyle: 'solid',
        borderColor: color.line,
        boxShadow: shadow.card,
        overflow: 'hidden',
        padding: props.padded ? space.lg : undefined,
      }}
    >
      {props.children}
    </view>
  );
}

/** Stands in for product photography. */
export function ProductImage(props: { gradient: string; height?: string; label?: string }) {
  return (
    <view
      style={{
        display: 'flex',
        width: '100%',
        height: props.height ?? '150px',
        backgroundImage: props.gradient,
        alignItems: 'flex-end',
        justifyContent: 'flex-start',
        padding: space.sm,
      }}
    >
      {props.label && (
        <text
          style={{
            fontSize: font.caption,
            fontWeight: '600',
            color: 'rgba(255,255,255,0.85)',
            letterSpacing: '0.08em',
          }}
        >
          {props.label.toUpperCase()}
        </text>
      )}
    </view>
  );
}

export function Badge(props: { label: string; tone?: 'accent' | 'success' | 'neutral' }) {
  const tone = props.tone ?? 'neutral';
  const palette = {
    accent: { bg: color.accentSoft, fg: color.accent },
    success: { bg: color.successSoft, fg: color.success },
    neutral: { bg: color.surfaceSunken, fg: color.inkMuted },
  }[tone];

  return (
    <view
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        paddingLeft: space.sm,
        paddingRight: space.sm,
        paddingTop: '3px',
        paddingBottom: '3px',
        borderRadius: radius.pill,
        backgroundColor: palette.bg,
      }}
    >
      <text
        style={{
          fontSize: font.caption,
          fontWeight: '600',
          color: palette.fg,
        }}
      >
        {props.label}
      </text>
    </view>
  );
}

export function CartButton(props: { count: number; onTap: () => void }) {
  return (
    <view
      bindtap={props.onTap}
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: '36px',
        paddingLeft: space.md,
        paddingRight: space.md,
        borderRadius: radius.pill,
        backgroundColor: props.count > 0 ? color.ink : color.surface,
      }}
    >
      <text
        native-interaction-enabled={false}
        style={{
          fontSize: font.label,
          fontWeight: '600',
          color: props.count > 0 ? color.onInk : color.inkMuted,
        }}
      >
        Cart {props.count > 0 ? `· ${props.count}` : ''}
      </text>
    </view>
  );
}

export function Row(props: {
  label: string;
  value?: string;
  emphasis?: boolean;
  onTap?: () => void;
  right?: React.ReactNode;
}) {
  return (
    <view
      bindtap={props.onTap}
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: space.md,
        paddingBottom: space.md,
      }}
    >
      <text
        style={{
          fontSize: font.body,
          fontWeight: props.emphasis ? '600' : '400',
          color: props.emphasis ? color.ink : color.inkMuted,
        }}
      >
        {props.label}
      </text>
      {props.right ?? (
        <text
          style={{
            fontSize: font.body,
            fontWeight: props.emphasis ? '700' : '500',
            color: color.ink,
          }}
        >
          {props.value ?? ''}
        </text>
      )}
    </view>
  );
}

export function Divider() {
  return (
    <view
      style={{
        height: '1px',
        width: '100%',
        backgroundColor: color.line,
      }}
    />
  );
}

export function SectionTitle(props: { children: string }) {
  return (
    <text
      style={{
        fontSize: font.label,
        fontWeight: '600',
        color: color.inkFaint,
        letterSpacing: '0.06em',
        marginBottom: space.sm,
      }}
    >
      {props.children.toUpperCase()}
    </text>
  );
}

export function Toggle(props: { on: boolean; onTap: () => void }) {
  return (
    <view
      bindtap={props.onTap}
      style={{
        display: 'flex',
        flexDirection: 'row',
        width: '48px',
        height: '28px',
        borderRadius: radius.pill,
        backgroundColor: props.on ? color.ink : color.surfaceSunken,
        padding: '3px',
        justifyContent: props.on ? 'flex-end' : 'flex-start',
        alignItems: 'center',
      }}
    >
      <view
        style={{
          width: '22px',
          height: '22px',
          borderRadius: radius.pill,
          backgroundColor: color.bg,
          boxShadow: shadow.card,
        }}
      />
    </view>
  );
}

/** Bottom sheet used for the "discard your order?" confirmation. */
export function Sheet(props: {
  title: string;
  body: string;
  children: React.ReactNode;
}) {
  return (
    <view
      style={{
        display: 'flex',
        flexDirection: 'column',
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        backgroundColor: color.scrim,
        justifyContent: 'flex-end',
      }}
    >
      <view
        style={{
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: color.bg,
          borderTopLeftRadius: radius.lg,
          borderTopRightRadius: radius.lg,
          padding: space.xl,
          paddingBottom: space.xxl,
          boxShadow: shadow.sheet,
        }}
      >
        <text
          style={{
            fontSize: font.title,
            fontWeight: '600',
            color: color.ink,
            marginBottom: space.sm,
          }}
        >
          {props.title}
        </text>
        <text
          style={{
            fontSize: font.body,
            color: color.inkMuted,
            marginBottom: space.xl,
          }}
        >
          {props.body}
        </text>
        <view style={{ display: 'flex', flexDirection: 'column', gap: space.sm }}>
          {props.children}
        </view>
      </view>
    </view>
  );
}
