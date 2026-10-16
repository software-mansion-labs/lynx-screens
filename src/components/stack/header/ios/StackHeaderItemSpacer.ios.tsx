import type { StackHeaderItemSpacerProps } from './StackHeaderItemSpacer.ios.types.js';

export const StackHeaderItemSpacer = (props: StackHeaderItemSpacerProps) => {
  return (
    <ls-stack-header-item-spacer-ios
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
      }}
      {...props}
    />
  );
};
