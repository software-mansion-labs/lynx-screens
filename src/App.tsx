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
          borderWidth: '2px',
          display: 'flex',
        }}
        backgroundColorHex={color}
      >
        <view
          style={{
            backgroundColor: '#f01313',
            display: 'flex',
            height: '100px',
            width: '100px',
          }}
        />
      </color-box-view>
      <color-box-view
        style={{
          flex: 1,
          borderColor: '#f01313',
          borderWidth: '2px',
          display: 'flex',
        }}
        backgroundColorHex={color}
      >
        <view
          style={{
            backgroundColor: '#f01313',
            display: 'flex',
            height: '100px',
            width: '100px',
            justifyContent: 'flex-end',
            alignItems: 'flex-end',
          }}
        >
          <view
            style={{
              backgroundColor: '#1364f0',
              display: 'flex',
              height: '50px',
              width: '50px',
            }}
          />
        </view>
      </color-box-view>
    </page>
  );
}
