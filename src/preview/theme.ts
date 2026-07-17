/**
 * Design tokens for the preview shop app.
 *
 * Kept deliberately small: the point of the preview app is to look like a
 * shipped product so that StackContainer's behaviour can be judged in a
 * realistic setting, not to be a design system.
 */

export const color = {
  bg: '#FFFFFF',
  surface: '#F5F5F7',
  surfaceSunken: '#EDEDF0',
  ink: '#101014',
  inkMuted: '#6B6B76',
  inkFaint: '#9A9AA5',
  line: '#E3E3E8',
  accent: '#3B4BF5',
  accentSoft: '#EEF0FE',
  success: '#137A4E',
  successSoft: '#E6F4EE',
  danger: '#C42B1C',
  dangerSoft: '#FCECEA',
  onInk: '#FFFFFF',
  scrim: 'rgba(16, 16, 20, 0.45)',
} as const;

export const space = {
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '24px',
  xxl: '32px',
} as const;

export const radius = {
  sm: '8px',
  md: '12px',
  lg: '18px',
  pill: '999px',
} as const;

export const font = {
  display: '28px',
  title: '20px',
  body: '15px',
  label: '13px',
  caption: '11px',
} as const;

export const shadow = {
  card: '0px 1px 2px rgba(16, 16, 20, 0.06)',
  raised: '0px 8px 24px rgba(16, 16, 20, 0.12)',
  sheet: '0px -8px 32px rgba(16, 16, 20, 0.18)',
} as const;

/**
 * ---------------------------------------------------------------------------
 * Workaround: no safe-area insets, and the two platforms disagree about the top.
 * ---------------------------------------------------------------------------
 *
 * StackContainer hands every screen the full window and Lynx has no safe-area
 * API (no `env(safe-area-inset-*)`), so the app has to work out for itself where
 * it is allowed to draw.
 *
 * The top differs per platform, because the stacks are not the same thing:
 *   - iOS puts the screens in a `UINavigationController`, so a real, translucent
 *     nav bar already owns the top of every screen and the content renders
 *     underneath it. Chrome has to start below the bar or it collides with the
 *     native back button.
 *   - Android hosts the screens as fragments under a `NoActionBar` theme, so
 *     there is no native bar and only the status bar is in the way.
 *
 * The values are deliberate over-estimates: `SystemInfo` reports the screen but
 * not its insets, and the iOS status bar is not a function of screen height
 * (a 14 Pro is 59pt, a 13 of near-identical height is 47pt), so it can only be
 * bounded, not derived. A few points of slack read as header padding, whereas
 * an under-estimate collides with the native chrome. See PREVIEW_APP.md.
 */
const systemInfo: Partial<typeof SystemInfo> =
  typeof SystemInfo === 'undefined' ? {} : SystemInfo;

const isIOS = systemInfo.platform === 'iOS';

const screenHeightPt =
  systemInfo.pixelHeight && systemInfo.pixelRatio
    ? systemInfo.pixelHeight / systemInfo.pixelRatio
    : 0;

/** Every iPhone with a home indicator is at least 812pt tall. */
const isEdgeToEdgeIPhone = isIOS && screenHeightPt >= 812;

const IOS_NAV_BAR_HEIGHT = 44;
/** The tallest status bar in each class — 62pt is the iPhone 16 Pro. */
const IOS_STATUS_BAR_HEIGHT = isEdgeToEdgeIPhone ? 62 : 20;

/** Home indicator on iOS, gesture bar on Android. */
const SYSTEM_BOTTOM_INSET = isIOS ? (isEdgeToEdgeIPhone ? 34 : 0) : 16;

/** `space.lg`, as a number — the app's base padding. */
const BASE_PADDING = 16;

export const inset = {
  /** The first y a screen may draw its own chrome at. */
  top: isIOS ? `${IOS_STATUS_BAR_HEIGHT + IOS_NAV_BAR_HEIGHT}px` : '28px',
  /**
   * Bottom padding for a surface pinned to the foot of the screen: clears the
   * system gesture area without ever dropping below the app's base padding.
   */
  bottom: `${Math.max(SYSTEM_BOTTOM_INSET, BASE_PADDING)}px`,
} as const;

export function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}
