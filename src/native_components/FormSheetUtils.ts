import type { FormSheetProps } from '../types/FormSheet.js';

const FORM_SHEET_NATIVE_FIT_TO_CONTENTS = -1.0;
const FORM_SHEET_LAST_DETENT = -1;
const FORM_SHEET_ALWAYS_DIMMED = -1;
const FORM_SHEET_NEVER_DIMMED = -2;

export function resolveNativeDetents(
  detents?: FormSheetProps['detents'],
): number[] | undefined {
  if (!detents) {
    return undefined;
  }

  return detents === 'fitToContents'
    ? [FORM_SHEET_NATIVE_FIT_TO_CONTENTS]
    : detents;
}

export function resolveInitialDetentIndex(
  initialDetentIndex: FormSheetProps['initialDetentIndex'],
  detentsCount: number,
): number {
  if (initialDetentIndex === undefined) {
    return 0;
  }

  if (initialDetentIndex === 'last') {
    return FORM_SHEET_LAST_DETENT;
  }

  const lastDetentIndex = Math.max(detentsCount - 1, 0);
  if (isIndexInClosedRange(initialDetentIndex, 0, lastDetentIndex)) {
    return initialDetentIndex;
  }

  console.error(
    `[RNScreens] Invalid initialDetentIndex (${initialDetentIndex}). Expected an integer between 0 and ${lastDetentIndex}. Falling back to 0.`,
  );
  return 0;
}

export function resolveLargestUndimmedDetentIndex(
  largestUndimmedDetentIndex: FormSheetProps['largestUndimmedDetentIndex'],
  detentsCount: number,
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
  if (isIndexInClosedRange(largestUndimmedDetentIndex, 0, lastDetentIndex)) {
    return largestUndimmedDetentIndex;
  }

  console.error(
    `[RNScreens] Invalid largestUndimmedDetentIndex (${largestUndimmedDetentIndex}). Expected an integer between 0 and ${lastDetentIndex}. Falling back to always dimmed.`,
  );
  return FORM_SHEET_ALWAYS_DIMMED;
}

export function resolveNativeCornerRadius(
  radius: FormSheetProps['preferredCornerRadius'],
): number | undefined {
  if (
    radius === 'systemDefault' ||
    (typeof radius === 'number' && radius < 0)
  ) {
    return -1.0;
  }

  return radius;
}

function isIndexInClosedRange(
  value: number,
  lowerBound: number,
  upperBound: number,
): boolean {
  return Number.isInteger(value) && value >= lowerBound && value <= upperBound;
}
