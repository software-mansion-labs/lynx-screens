import { useState } from '@lynx-js/react';
import { FormSheetNativeComponent, ScrollViewMarker } from 'lynx-screens';
import {
  Heading,
  SettingsButton,
  SettingsPicker,
  SettingsSwitch,
} from '../components/SettingsControls';

type DetentsOption = '0.4' | '0.6' | '0.4, 0.9' | 'fitToContents';
type InitialDetentOption = 'first' | 'last';
type LargestUndimmedDetentOption = 'none' | 'first' | 'last';
type CornerRadiusOption = 'systemDefault' | '16' | '32';
type BackgroundColorOption = 'white' | 'blue' | 'purple';

const DETENTS_OPTIONS: DetentsOption[] = [
  '0.4',
  '0.6',
  '0.4, 0.9',
  'fitToContents',
];
const INITIAL_DETENT_OPTIONS: InitialDetentOption[] = ['first', 'last'];
const LARGEST_UNDIMMED_DETENT_OPTIONS: LargestUndimmedDetentOption[] = [
  'none',
  'first',
  'last',
];
const CORNER_RADIUS_OPTIONS: CornerRadiusOption[] = [
  'systemDefault',
  '16',
  '32',
];
const BACKGROUND_COLOR_OPTIONS: BackgroundColorOption[] = [
  'white',
  'blue',
  'purple',
];

function resolveDetents(option: DetentsOption): number[] | 'fitToContents' {
  switch (option) {
    case '0.4':
      return [0.4];
    case '0.6':
      return [0.6];
    case '0.4, 0.9':
      return [0.4, 0.9];
    case 'fitToContents':
      return 'fitToContents';
  }
}

function resolveBackgroundColor(option: BackgroundColorOption): string {
  switch (option) {
    case 'blue':
      return '#e8eaf6';
    case 'purple':
      return '#f3e5f5';
    case 'white':
      return '#ffffff';
  }
}

export default function App() {
  const [isOpen, setIsOpen] = useState(false);
  const [detents, setDetents] = useState<DetentsOption>('0.6');
  const [initialDetent, setInitialDetent] =
    useState<InitialDetentOption>('first');
  const [largestUndimmedDetent, setLargestUndimmedDetent] =
    useState<LargestUndimmedDetentOption>('none');
  const [cornerRadius, setCornerRadius] =
    useState<CornerRadiusOption>('systemDefault');
  const [backgroundColor, setBackgroundColor] =
    useState<BackgroundColorOption>('white');
  const [prefersGrabberVisible, setPrefersGrabberVisible] = useState(true);
  const [preventNativeDismiss, setPreventNativeDismiss] = useState(false);
  const [prefersScrollingExpands, setPrefersScrollingExpands] = useState(true);
  const [lastEvent, setLastEvent] = useState('none');
  const [currentDetentIndex, setCurrentDetentIndex] = useState(0);

  const resolvedBackgroundColor = resolveBackgroundColor(backgroundColor);

  const close = (event: string) => {
    setLastEvent(event);
    setIsOpen(false);
  };

  return (
    <view style={{ width: '100%', height: '100%', backgroundColor: 'white' }}>
      <ScrollViewMarker style={{ width: '100%', height: '100%' }}>
        <scroll-view scroll-y style={{ width: '100%', height: '100%' }}>
          <view style={{ padding: '16px', paddingBottom: '40px', gap: '6px' }}>
            <Heading label="FormSheet configuration" />
            <SettingsPicker<DetentsOption>
              label="detents"
              value={detents}
              onValueChange={setDetents}
              items={DETENTS_OPTIONS}
            />
            <SettingsPicker<InitialDetentOption>
              label="initialDetentIndex"
              value={initialDetent}
              onValueChange={setInitialDetent}
              items={INITIAL_DETENT_OPTIONS}
            />
            <SettingsPicker<LargestUndimmedDetentOption>
              label="largestUndimmedDetentIndex (iOS)"
              value={largestUndimmedDetent}
              onValueChange={setLargestUndimmedDetent}
              items={LARGEST_UNDIMMED_DETENT_OPTIONS}
            />
            <SettingsPicker<CornerRadiusOption>
              label="preferredCornerRadius"
              value={cornerRadius}
              onValueChange={setCornerRadius}
              items={CORNER_RADIUS_OPTIONS}
            />
            <SettingsPicker<BackgroundColorOption>
              label="native background"
              value={backgroundColor}
              onValueChange={setBackgroundColor}
              items={BACKGROUND_COLOR_OPTIONS}
            />
            <SettingsSwitch
              label="prefersGrabberVisible"
              value={prefersGrabberVisible}
              onValueChange={setPrefersGrabberVisible}
            />
            <SettingsSwitch
              label="preventNativeDismiss"
              value={preventNativeDismiss}
              onValueChange={setPreventNativeDismiss}
            />
            <SettingsSwitch
              label="prefersScrollingExpandsWhenScrolledToEdge (iOS)"
              value={prefersScrollingExpands}
              onValueChange={setPrefersScrollingExpands}
            />

            <Heading label="Result" />
            <text style={{ color: 'black' }}>Last event: {lastEvent}</text>
            <text style={{ color: 'black' }}>
              Current detent index: {currentDetentIndex}
            </text>
            <SettingsButton
              label="Open FormSheet"
              onTap={() => {
                setLastEvent('opening');
                setIsOpen(true);
              }}
            />
          </view>
        </scroll-view>
      </ScrollViewMarker>

      <FormSheetNativeComponent
        isOpen={isOpen}
        detents={resolveDetents(detents)}
        initialDetentIndex={initialDetent === 'last' ? 'last' : 0}
        largestUndimmedDetentIndex={
          largestUndimmedDetent === 'first' ? 0 : largestUndimmedDetent
        }
        preferredCornerRadius={
          cornerRadius === 'systemDefault' ? 'systemDefault' : Number(cornerRadius)
        }
        prefersGrabberVisible={prefersGrabberVisible}
        preventNativeDismiss={preventNativeDismiss}
        prefersScrollingExpandsWhenScrolledToEdge={prefersScrollingExpands}
        nativeContainerStyle={{ backgroundColor: resolvedBackgroundColor }}
        onWillAppear={() => setLastEvent('will appear')}
        onDidAppear={() => setLastEvent('did appear')}
        onWillDisappear={() => setLastEvent('will disappear')}
        onDidDisappear={() => setLastEvent('did disappear')}
        onDismiss={() => close('dismissed from JS')}
        onNativeDismiss={() => close('dismissed natively')}
        onNativeDismissPrevented={() =>
          setLastEvent('native dismiss prevented')
        }
        onDetentChanged={(index) => {
          setCurrentDetentIndex(index);
          setLastEvent(`detent changed to ${index}`);
        }}
      >
        <view
          style={{
            paddingTop: '28px',
            paddingLeft: '20px',
            paddingRight: '20px',
            paddingBottom: '28px',
            gap: '12px',
            backgroundColor: resolvedBackgroundColor,
          }}
        >
          <text style={{ color: 'black', fontSize: '24px', fontWeight: 'bold' }}>
            FormSheet
          </text>
          <text style={{ color: 'black' }}>detents: {detents}</text>
          <text style={{ color: 'black' }}>
            native dismiss: {preventNativeDismiss ? 'prevented' : 'allowed'}
          </text>
          <SettingsButton
            label="Dismiss from JS"
            onTap={() => close('dismiss requested from JS')}
          />
        </view>
      </FormSheetNativeComponent>
    </view>
  );
}
