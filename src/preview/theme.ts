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

export function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}
