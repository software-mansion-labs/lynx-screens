import { useCallback } from 'react';
import type { ReactElement } from '@lynx-js/react';
import type { BaseEventOrig, EventHandler } from '@lynx-js/types';
import type {
  PlatformIconIOS,
  StackHeaderMenuIOS,
} from '../types/StackHeaderConfig.js';
import { parseMenuElementToAttr, type StackHeaderMenuAttr } from './utils.js';

export type StackHeaderItemPlacement =
  | 'leading'
  | 'trailing'
  | 'title'
  | 'subtitle'
  | 'largeSubtitle';

export type StackHeaderItemProps = {
  placement: StackHeaderItemPlacement;
  itemId?: string | undefined;
  title?: string | undefined;
  icon?: PlatformIconIOS | undefined;
  render?: (() => ReactElement) | undefined;
  menu?: StackHeaderMenuIOS | undefined;
  onPress?: (() => void) | undefined;
};

export const StackHeaderItemIOSNativeComponent = ({
  placement,
  itemId,
  title,
  icon,
  render,
  menu,
  onPress,
}: StackHeaderItemProps) => {
  const handlePress: EventHandler<BaseEventOrig<Record<string, never>>> =
    useCallback(() => {
      onPress?.();
    }, [onPress]);

  return (
    <ls-stack-header-item-ios
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
      }}
      placement={placement}
      itemId={itemId}
      title={title}
      icon={icon}
      menu={menu && (parseMenuElementToAttr(menu) as StackHeaderMenuAttr)}
      // We need to tell iOS that we want the handler to be attached only when we actually require it
      // because doing so makes the menu appear on long press instead of tap
      respondsToOnPress={!!onPress}
      bindOnHeaderItemPress={handlePress}
    >
      {render?.()}
    </ls-stack-header-item-ios>
  );
};
