import './lynx-elements';

import { FormSheetNativeComponent } from './native_components/FormSheetNativeComponent';
import { StackHeaderConfigNativeComponent } from './native_components/StackHeaderConfigNativeComponent';
import { StackHostNativeComponent } from './native_components/StackHostNativeComponent';
import { StackScreenNativeComponent } from './native_components/StackScreenNativeComponent';

export { ScrollViewMarker } from './native_components/ScrollViewMarkerNativeComponent';
export type { ScrollViewMarkerProps } from './native_components/ScrollViewMarkerNativeComponent';

export {
  StackHostNativeComponent,
  StackScreenNativeComponent,
  StackHeaderConfigNativeComponent,
};

export const Stack = {
  Host: StackHostNativeComponent,
  Screen: StackScreenNativeComponent,
  HeaderConfig: StackHeaderConfigNativeComponent,
};

export { FormSheetNativeComponent, FormSheetNativeComponent as FormSheet };

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
