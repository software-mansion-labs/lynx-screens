import type { StackHostProps } from './StackHost.types.js';

export const StackHost = ({ children }: StackHostProps) => {
  return (
    <ls-stack-host
      style={{
        display: 'flex',
        flex: 1,
        width: '100%',
        height: '100%',
      }}
    >
      {children}
    </ls-stack-host>
  );
};
