import './lynx-elements';

import { StackHost } from './native_components/StackHostNativeComponent';
import { StackScreen } from './native_components/StackScreenNativeComponent';
import { StackHeaderConfig } from './native_components/StackHeaderConfigNativeComponent';

export { ScrollViewMarker } from './native_components/ScrollViewMarkerNativeComponent';
export type { ScrollViewMarkerProps } from './native_components/ScrollViewMarkerNativeComponent';
export { FormSheet } from './native_components/FormSheetNativeComponent';
export type {
  FormSheetDetents,
  FormSheetNativeContainerStyleProps,
  FormSheetProps,
} from './types/FormSheet';

export type {
  OnDismissEventPayload,
  EmptyEventPayload, // TODO: Remove this from public types (we need one shared type for this)
  StackScreenActivityMode,
  StackScreenProps,
} from './types/StackScreen';

export type {
  StackHeaderConfigPropsBase,
  StackHeaderConfigProps,
  StackHeaderConfigRef,
  // Android
  StackHeaderTypeAndroid,
  StackHeaderBackgroundSubviewCollapseModeAndroid,
  StackHeaderToolbarSubviewAndroid,
  StackHeaderBackgroundSubviewAndroid,
  StackHeaderConfigPropsAndroid,
  StackHeaderConfigCommandsAndroid,
  StackHeaderToolbarMenuAndroid,
  StackHeaderToolbarMenuBaseAndroid,
  StackHeaderToolbarMenuElementAndroid,
  StackHeaderToolbarMenuGroupAndroid,
  StackHeaderToolbarMenuItemAndroid,
  StackHeaderToolbarMenuItemBaseAndroid,
  StackHeaderToolbarMenuElementOptionsAndroid,
  StackHeaderToolbarMenuElementUpdateAndroid,
  StackHeaderToolbarMenuItemShowAsActionAndroid,
  StackHeaderToolbarMenuItemTypeAndroid,
  PlatformIconShared,
  PlatformIconAndroid,
  PlatformIconIOS,
  PlatformIconIOSSfSymbol,
  PlatformIconIOSXcasset,
  // iOS
  StackHeaderConfigPropsIOS,
  StackHeaderInlineItemIOS,
  StackHeaderInlineCustomItemIOS,
  StackHeaderTitleCustomItemIOS,
  StackHeaderSpacerItemIOS,
  StackHeaderConfigCommandsIOS,
  StackHeaderMenuIOS,
  StackHeaderMenuItemIOS,
  StackHeaderMenuElementIOS,
  StackHeaderMenuItemOptionsIOS,
  StackHeaderMenuOptionsIOS,
} from './types/StackHeaderConfig';

export const Stack = {
  Host: StackHost,
  Screen: StackScreen,
  HeaderConfig: StackHeaderConfig,
};
