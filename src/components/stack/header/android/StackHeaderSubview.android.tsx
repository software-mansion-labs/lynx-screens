import type { StackHeaderSubviewProps } from './StackHeaderSubview.android.types.js';

export const StackHeaderSubview = ({
  children,
  type,
  collapseMode,
}: StackHeaderSubviewProps) => {
  return (
    <ls-stack-header-subview-android
      style={
        type === 'background'
          ? {
              position: 'absolute',
              left: 0,
              top: 0,
              width: '100%',
              height: '100%',
            }
          : {
              position: 'absolute',
              left: 0,
              top: 0,
            }
      }
      type={type}
      collapseMode={collapseMode}
    >
      {children}
    </ls-stack-header-subview-android>
  );
};
