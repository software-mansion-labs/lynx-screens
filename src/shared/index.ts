import type { PlatformIconAndroid } from '../types/StackHeaderConfig.js';

// RNS resolves RN assets through Image.resolveAssetSource here; on Lynx icons
// are referenced by plain URI strings, so the parse step only splits the icon
// union into the two native prop keys.
export function parseAndroidIconToNativeProps(
  icon: PlatformIconAndroid | undefined,
): {
  imageIconUri?: string | undefined;
  drawableIconResourceName?: string | undefined;
} {
  if (!icon) {
    return {};
  }

  if (icon.type === 'imageSource') {
    return {
      imageIconUri: icon.uri,
    };
  } else if (icon.type === 'drawableResource') {
    return {
      drawableIconResourceName: icon.name,
    };
  } else {
    throw new Error(
      '[RNScreens] Incorrect icon format for Android. You must provide `imageSource` or `drawableResource`.',
    );
  }
}
