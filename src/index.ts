import './lynx-elements';

export { StackHostNativeComponent } from './native_components/StackHostNativeComponent';
export { StackScreenNativeComponent } from './native_components/StackScreenNativeComponent';
export { StackHeaderConfigNativeComponent } from './native_components/StackHeaderConfigNativeComponent';

export type {
  OnDismissEventPayload,
  EmptyEventPayload, // TODO: Remove this from public types (we need one shared type for this)
  StackScreenActivityMode,
  StackScreenProps,
} from './types/StackScreen';

export type {
  StackHeaderConfigPropsBase,
  StackHeaderConfigProps,
  // Android
  StackHeaderTypeAndroid,
  StackHeaderBackgroundSubviewCollapseModeAndroid,
  StackHeaderToolbarSubviewAndroid,
  StackHeaderBackgroundSubviewAndroid,
  StackHeaderConfigPropsAndroid,
  PlatformIconShared,
  PlatformIconAndroid,
  // iOS
  StackHeaderConfigPropsIOS,
} from './types/StackHeaderConfig';
