import type { FormSheetProps } from '../types/FormSheet.js';

export const FORM_SHEET_FIT_TO_CONTENTS = -1;
export const FORM_SHEET_LAST_DETENT = -1;
export const FORM_SHEET_UNCONTROLLED_DETENT = -2;
export const FORM_SHEET_ALWAYS_DIMMED = -1;
export const FORM_SHEET_NEVER_DIMMED = -2;

export function resolveNativeDetents(
  detents?: FormSheetProps['detents'],
): number[] | undefined {
  if (!detents) {
    return undefined;
  }

  return detents === 'fitToContents' ? [FORM_SHEET_FIT_TO_CONTENTS] : detents;
}

export function resolveInitialDetentIndex(
  initialDetentIndex: FormSheetProps['initialDetentIndex'],
  detentsCount = 0,
): number {
  if (initialDetentIndex === undefined) {
    return 0;
  }

  if (initialDetentIndex === 'last') {
    return FORM_SHEET_LAST_DETENT;
  }

  const lastDetentIndex = Math.max(detentsCount - 1, 0);
  if (!isIndexInClosedRange(initialDetentIndex, 0, lastDetentIndex)) {
    console.error(
      `[LynxScreens] Invalid value provided for 'initialDetentIndex' (${initialDetentIndex}). Expected an integer between 0 and ${lastDetentIndex}. Falling back to 0.`,
    );
    return 0;
  }

  return initialDetentIndex;
}

export function resolveSelectedDetentIndex(
  selectedDetentIndex: FormSheetProps['selectedDetentIndex'],
  detentsCount = 0,
): number {
  if (selectedDetentIndex === undefined) {
    return FORM_SHEET_UNCONTROLLED_DETENT;
  }

  if (selectedDetentIndex === 'last') {
    return FORM_SHEET_LAST_DETENT;
  }

  const lastDetentIndex = Math.max(detentsCount - 1, 0);
  if (!isIndexInClosedRange(selectedDetentIndex, 0, lastDetentIndex)) {
    console.error(
      `[LynxScreens] Invalid value provided for 'selectedDetentIndex' (${selectedDetentIndex}). Expected an integer between 0 and ${lastDetentIndex}. Leaving the FormSheet detent uncontrolled.`,
    );
    return FORM_SHEET_UNCONTROLLED_DETENT;
  }

  return selectedDetentIndex;
}

export function resolveLargestUndimmedDetentIndex(
  largestUndimmedDetentIndex: FormSheetProps['largestUndimmedDetentIndex'],
  detentsCount = 0,
): number {
  if (
    largestUndimmedDetentIndex === undefined ||
    largestUndimmedDetentIndex === 'none'
  ) {
    return FORM_SHEET_ALWAYS_DIMMED;
  }

  if (largestUndimmedDetentIndex === 'last') {
    return FORM_SHEET_NEVER_DIMMED;
  }

  const lastDetentIndex = Math.max(detentsCount - 1, 0);
  if (!isIndexInClosedRange(largestUndimmedDetentIndex, 0, lastDetentIndex)) {
    console.error(
      `[LynxScreens] Invalid value provided for 'largestUndimmedDetentIndex' (${largestUndimmedDetentIndex}). Expected an integer between 0 and ${lastDetentIndex}. Falling back to the default behavior (always dimmed).`,
    );
    return FORM_SHEET_ALWAYS_DIMMED;
  }

  return largestUndimmedDetentIndex;
}

export function resolveNativeCornerRadius(
  radius: FormSheetProps['preferredCornerRadius'],
): number | undefined {
  if (
    radius === 'systemDefault' ||
    (typeof radius === 'number' && radius < 0)
  ) {
    return -1;
  }

  return radius;
}

export function resolveFormSheetHostStyle(
  detents: FormSheetProps['detents'],
): import('@lynx-js/types').CSSProperties {
  const pixelRatio = SystemInfo.pixelRatio > 0 ? SystemInfo.pixelRatio : 1;
  const screenWidth = SystemInfo.pixelWidth / pixelRatio;
  const screenHeight = SystemInfo.pixelHeight / pixelRatio;

  if (detents === 'fitToContents') {
    return {
      position: 'absolute',
      top: 0,
      left: 0,
      width: `${screenWidth}px`,
    };
  }

  const largestDetent =
    detents && detents.length > 0 && areFractionalDetentsValid(detents)
      ? Math.max(...detents)
      : 1;
  const largestDetentPercent = Math.max(0, Math.min(largestDetent, 1)) * 100;

  return {
    position: 'absolute',
    left: 0,
    bottom: 0,
    width: `${screenWidth}px`,
    height: `${(screenHeight * largestDetentPercent) / 100}px`,
  };
}

function areFractionalDetentsValid(detents: number[]): boolean {
  return detents.every(
    (detent, index) =>
      Number.isFinite(detent) &&
      detent >= 0 &&
      detent <= 1 &&
      (index === 0 || detent > detents[index - 1]),
  );
}

function isIndexInClosedRange(
  value: number,
  lowerBound: number,
  upperBound: number,
): boolean {
  return Number.isInteger(value) && value >= lowerBound && value <= upperBound;
}
