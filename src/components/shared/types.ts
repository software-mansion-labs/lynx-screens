// RNS resolves RN assets via Image.resolveAssetSource; on Lynx images are
// referenced by plain URI strings (bundler-emitted URLs, remote URLs or
// android_asset paths).
export type PlatformIconShared = {
  type: 'imageSource';
  uri: string;
};

export type PlatformIconAndroid =
  | {
      type: 'drawableResource';
      name: string;
    }
  | PlatformIconShared;

export type PlatformIconIOSSfSymbol = {
  type: 'sfSymbol';
  name: string;
};

export type PlatformIconIOSXcasset = {
  type: 'xcasset';
  name: string;
};

// Adaptation from RNS: image and template sources are plain uri strings
// (Lynx has no require()-based assets / resolveAssetSource).
export type PlatformIconIOS =
  | PlatformIconIOSSfSymbol
  | PlatformIconIOSXcasset
  | {
      type: 'templateSource';
      uri: string;
    }
  | PlatformIconShared;
