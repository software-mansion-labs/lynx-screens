import { InitDataProvider } from '@lynx-js/react'

import * as Tests from './examples'

export function App(props: { onRender?: () => void }) {
  return (
    // The provider is what lets screens read the window insets the native host
    // measures for us — see `useSafeArea` in preview/theme.ts.
    <InitDataProvider>
      <page
        style={{
          display: 'flex',
          backgroundColor: 'white',
          width: '100%',
          height: '100%',
        }}
      >
        <Tests.PreviewShopApp />
      </page>
    </InitDataProvider>
  );
}
