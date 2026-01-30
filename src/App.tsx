import { useState } from '@lynx-js/react';
import * as Lynx from '@lynx-js/types';

import './App.css';

export function App(props: { onRender?: () => void }) {
  const [color, _] = useState('#45ac1f');

  return (
    <page>
      <color-box-view
        style={{
          flex: 1,
          borderColor: '#f01313',
          borderWidth: 2,
          display: 'flex',
        }}
        backgroundColorHex={color}
      >
        <view
          style={{
            backgroundColor: '#f01313',
            display: 'flex',
            height: 100,
            width: 100,
          }}
        />
      </color-box-view>
      <color-box-view
        style={{
          flex: 1,
          borderColor: '#f01313',
          borderWidth: 2,
          display: 'flex',
        }}
        backgroundColorHex={color}
      >
        <view
          style={{
            backgroundColor: '#f01313',
            display: 'flex',
            height: 100,
            width: 100,
            justifyContent: 'flex-end',
            alignItems: 'flex-end',
          }}
        >
          <view
            style={{
              backgroundColor: '#1364f0',
              display: 'flex',
              height: 50,
              width: 50,
            }}
          />
        </view>
      </color-box-view>
    </page>
  );
}
