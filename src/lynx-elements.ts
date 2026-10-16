import type * as Lynx from '@lynx-js/types';
import type { NativeProps as FormSheetHostNativeProps } from './native_specs/modals/form-sheet/FormSheetHostNativeComponent.js';
import type { NativeProps as FormSheetContentWrapperNativeProps } from './native_specs/modals/form-sheet/FormSheetContentWrapperNativeComponent.js';
import type { NativeProps as StackHostNativeProps } from './native_specs/stack/StackHostNativeComponent.js';
import type { NativeProps as StackScreenNativeProps } from './native_specs/stack/StackScreenNativeComponent.js';
import type { NativeProps as StackHeaderConfigNativeProps } from './native_specs/stack/StackHeaderConfigNativeComponent.js';
import type { NativeProps as ScrollViewMarkerNativeProps } from './native_specs/ScrollViewMarkerNativeComponent.js';
import type { NativeProps as StackHeaderSubviewAndroidNativeProps } from './native_specs/stack/StackHeaderSubviewAndroidNativeComponent.js';
import type { NativeProps as StackHeaderItemIOSNativeProps } from './native_specs/stack/StackHeaderItemIOSNativeComponent.js';
import type { NativeProps as StackHeaderItemSpacerIOSNativeProps } from './native_specs/stack/StackHeaderItemSpacerIOSNativeComponent.js';

declare module '@lynx-js/types' {
  interface IntrinsicElements extends Lynx.IntrinsicElements {
    'ls-form-sheet': FormSheetHostNativeProps;
    'ls-form-sheet-content-wrapper': FormSheetContentWrapperNativeProps;
    'ls-stack-host': StackHostNativeProps;
    'ls-stack-screen': StackScreenNativeProps;
    'ls-stack-header-config': StackHeaderConfigNativeProps;
    'ls-scroll-view-marker': ScrollViewMarkerNativeProps;
    'ls-stack-header-subview-android': StackHeaderSubviewAndroidNativeProps;
    'ls-stack-header-item-ios': StackHeaderItemIOSNativeProps;
    'ls-stack-header-item-spacer-ios': StackHeaderItemSpacerIOSNativeProps;
  }
}
