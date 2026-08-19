import { afterAll, beforeAll, describe, expect, test, vi } from 'vitest';
import {
  FORM_SHEET_ALWAYS_DIMMED,
  FORM_SHEET_FIT_TO_CONTENTS,
  FORM_SHEET_LAST_DETENT,
  FORM_SHEET_NEVER_DIMMED,
  FORM_SHEET_UNCONTROLLED_DETENT,
  resolveFormSheetHostStyle,
  resolveInitialDetentIndex,
  resolveLargestUndimmedDetentIndex,
  resolveNativeCornerRadius,
  resolveNativeDetents,
  resolveSelectedDetentIndex,
} from '../utils/form-sheet.js';

describe('FormSheet native prop normalization', () => {
  beforeAll(() => {
    vi.stubGlobal('SystemInfo', {
      pixelRatio: 2,
      pixelWidth: 400,
      pixelHeight: 800,
    });
  });

  afterAll(() => {
    vi.unstubAllGlobals();
  });

  test('maps symbolic values to the RNS native protocol', () => {
    expect(resolveNativeDetents('fitToContents')).toEqual([
      FORM_SHEET_FIT_TO_CONTENTS,
    ]);
    expect(resolveInitialDetentIndex('last', 3)).toBe(FORM_SHEET_LAST_DETENT);
    expect(resolveLargestUndimmedDetentIndex('none', 3)).toBe(
      FORM_SHEET_ALWAYS_DIMMED,
    );
    expect(resolveLargestUndimmedDetentIndex('last', 3)).toBe(
      FORM_SHEET_NEVER_DIMMED,
    );
    expect(resolveNativeCornerRadius('systemDefault')).toBe(-1);
    expect(resolveSelectedDetentIndex('last', 3)).toBe(FORM_SHEET_LAST_DETENT);
    expect(resolveSelectedDetentIndex(undefined, 3)).toBe(
      FORM_SHEET_UNCONTROLLED_DETENT,
    );
  });

  test('falls back when detent indices are invalid', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(resolveInitialDetentIndex(3, 2)).toBe(0);
    expect(resolveLargestUndimmedDetentIndex(3, 2)).toBe(
      FORM_SHEET_ALWAYS_DIMMED,
    );
    expect(resolveSelectedDetentIndex(3, 2)).toBe(
      FORM_SHEET_UNCONTROLLED_DETENT,
    );
    expect(error).toHaveBeenCalledTimes(3);

    error.mockRestore();
  });

  test('uses full height when invalid detents reach host layout', () => {
    expect(resolveFormSheetHostStyle([0.7, Number.NaN])).toMatchObject({
      height: '400px',
    });
    expect(resolveFormSheetHostStyle([0.8, 0.4])).toMatchObject({
      height: '400px',
    });
  });
});
