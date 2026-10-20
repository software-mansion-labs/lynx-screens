import { useState } from '@lynx-js/react';
import { FormSheet } from 'lynx-screens';
import { Heading, SettingsButton } from '../components/SettingsControls';

// Port of RNS single-feature-tests/form-sheet/test-form-sheet-fractional-detents
// (RNS 8e7619814, whose native part is already in the Android FormSheet port).
// Adaptations: the Android detent guides are positioned with percentage
// offsets of the full-size container instead of an onLayout-measured height;
// RN Buttons are SettingsButtons.

const DETENT_PRESETS: number[][] = [
  [0.5],
  [1.0],
  [0.3, 0.6],
  [0.5, 1.0],
  [0.3, 0.6, 1.0],
  [0.25, 0.5, 0.75],
  [0.3, 0.55, 0.8],
  [0.5, 0.65, 0.8],
  [0.2, 0.9, 1.0],
];

const formatDetent = (detent: number) =>
  Number.isInteger(detent) ? detent.toFixed(1) : String(detent);

const formatDetents = (detents: number[]) =>
  `[${detents.map(formatDetent).join(', ')}]`;

export default function App() {
  const [isOpen, setIsOpen] = useState(false);
  const [presetIndex, setPresetIndex] = useState(0);

  const detents = DETENT_PRESETS[presetIndex]!;

  return (
    <view style={{ width: '100%', height: '100%', backgroundColor: '#f5f5f5' }}>
      <view
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: '100%',
          height: '100%',
        }}
      >
        {detents.map((detent) => (
          <view
            key={detent}
            style={{
              position: 'absolute',
              left: 0,
              width: '100%',
              top: `${(1 - detent) * 100}%`,
              height: '1px',
              backgroundColor: '#3f51b5',
            }}
          >
            <text
              style={{
                position: 'absolute',
                right: '8px',
                bottom: '2px',
                fontSize: '12px',
                color: '#3f51b5',
              }}
            >
              {formatDetent(detent)}
            </text>
          </view>
        ))}
      </view>

      <view
        style={{
          paddingTop: '80px',
          paddingLeft: '16px',
          paddingRight: '16px',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <Heading label="Fractional Detents" />
        <text style={{ color: 'black', fontSize: '16px', fontWeight: 'bold' }}>
          Detents: {formatDetents(detents)}
        </text>
        <view
          style={{
            display: 'flex',
            flexDirection: 'row',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: '8px',
          }}
        >
          {DETENT_PRESETS.map((preset, index) => (
            <view
              key={formatDetents(preset)}
              style={{
                paddingTop: '8px',
                paddingBottom: '8px',
                paddingLeft: '12px',
                paddingRight: '12px',
                borderRadius: '6px',
                backgroundColor: index === presetIndex ? '#3f51b5' : '#e8eaf6',
              }}
              bindtap={() => setPresetIndex(index)}
            >
              <text
                style={{
                  color: index === presetIndex ? 'white' : '#3f51b5',
                  fontWeight: 'bold',
                }}
              >
                {formatDetents(preset)}
              </text>
            </view>
          ))}
        </view>

        <view style={{ width: '100%', marginTop: '24px' }}>
          <SettingsButton label="Open FormSheet" onTap={() => setIsOpen(true)} />
        </view>
      </view>

      <FormSheet
        isOpen={isOpen}
        onNativeDismiss={() => setIsOpen(false)}
        detents={detents}
        preferredCornerRadius={0}
        nativeContainerStyle={{ backgroundColor: '#ffffff80' }}
      >
        <view style={{ width: '100%', height: '100%' }}>
          <view
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '40px',
              backgroundColor: '#d32f2f',
            }}
          />
          <view
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              width: '100%',
              height: '40px',
              backgroundColor: '#d32f2f',
            }}
          />
        </view>
      </FormSheet>
    </view>
  );
}
