import type { StackHostProps } from './StackHost.types.js';

// Adaptation: RNS forwards the remaining props with a rest spread. ReactLynx
// compiles a spread placed on an intrinsic element differently and the inline
// `style` below was lost (the host laid out with zero height), so the props
// are forwarded explicitly instead.
export const StackHost = ({
  children,
  colorScheme,
  direction,
}: StackHostProps) => {
  return (
    <ls-stack-host
      style={{
        display: 'flex',
        flex: 1,
        width: '100%',
        height: '100%',
      }}
      colorScheme={colorScheme}
      direction={direction}
    >
      {children}
    </ls-stack-host>
  );
};
