import { useCallback, useLayoutEffect, useMemo, useState } from '@lynx-js/react';
import type { StackHeaderConfigProps } from 'lynx-screens';
import { SettingsSwitch } from '../components/SettingsControls';
import { StackContainer } from '../components/StackContainer';
import { useStackNavigationContext } from '../hooks/useStackNavigationContext';

// Port of RNS single-feature-tests/stack-v5/test-stack-header-item-appearance-ios.
// Adaptation: the toast provider is replaced by a "last press" readout.

// Adaptation: RNS examples rely on UIKit's automatic scroll-view content
// inset (contentInsetAdjustmentBehavior="automatic") to start content below
// the navigation bar. Lynx's scroll-view hardcodes that behavior to "never",
// and RNS does not offset v5 screen content below the header natively (yet)
// on iOS - approximate the inset with a static padding instead.
const CONTENT_PADDING_TOP = SystemInfo.platform === 'iOS' ? '120px' : '16px';

const buildHeaderConfig = (
  overflow: boolean,
  showToast: (text: string) => void,
): StackHeaderConfigProps => ({
  title: 'Item Appearance',
  ios: {
    trailingItems: [
      {
        // TODO: make this item prominent once prominent style is implemented
        type: 'item',
        title: 'Prominent Disabled',
        id: 'prominent-disabled-item',
        icon: { type: 'sfSymbol', name: '4.circle' },
        disabled: true,
        onPress: () => showToast('Prominent disabled item pressed'),
      },
      {
        type: 'spacer',
        id: 'spacer-0',
        sizing: 'flexible',
      },
      {
        // TODO: make this item prominent once prominent style is implemented
        type: 'item',
        title: 'Prominent',
        id: 'prominent-item',
        icon: { type: 'sfSymbol', name: '3.circle' },
        onPress: () => showToast('Prominent item pressed'),
      },
      {
        type: 'spacer',
        id: 'spacer-1',
        sizing: 'flexible',
      },
      {
        type: 'item',
        title: 'Disabled',
        id: 'disabled-item',
        icon: { type: 'sfSymbol', name: '2.circle' },
        disabled: true,
        onPress: () => showToast('Disabled item pressed'),
      },
      {
        type: 'spacer',
        id: 'spacer-2',
        sizing: 'flexible',
      },
      {
        type: 'item',
        title: 'Regular',
        id: 'regular-item',
        icon: { type: 'sfSymbol', name: '1.circle' },
        onPress: () => showToast('Regular item pressed'),
      },
      ...(overflow
        ? [
            {
              type: 'item',
              id: 'wide-custom-item',
              render: () => (
                <view
                  style={{
                    width: '500px',
                    height: '20px',
                    backgroundColor: 'black',
                  }}
                />
              ),
            } as const,
          ]
        : []),
    ],
  },
});

function ConfigScreen() {
  const navigation = useStackNavigationContext();
  const [overflow, setOverflow] = useState(false);
  const [lastPress, setLastPress] = useState('none yet');

  const showToast = useCallback((text: string) => setLastPress(text), []);

  const { setRouteOptions, routeKey } = navigation;
  const headerConfig = useMemo(
    () => buildHeaderConfig(overflow, showToast),
    [overflow, showToast],
  );

  useLayoutEffect(() => {
    setRouteOptions(routeKey, {
      headerConfig,
    });
  }, [headerConfig, setRouteOptions, routeKey]);

  return (
    <scroll-view scroll-y style={{ width: '100%', height: '100%' }}>
      <view style={{ paddingTop: CONTENT_PADDING_TOP, gap: '8px' }}>
        <text
          style={{
            fontSize: '14px',
            fontWeight: '600',
            padding: '16px',
            color: 'black',
          }}
        >
          Header shows 4 items: regular (1), disabled (2), prominent (3),
          prominent disabled (4)
        </text>
        <view style={{ paddingLeft: '16px', paddingRight: '16px' }}>
          <SettingsSwitch
            label="Push to overflow"
            value={overflow}
            onValueChange={setOverflow}
          />
          <text style={{ color: 'black', paddingTop: '8px' }}>
            Last press: {lastPress}
          </text>
        </view>
      </view>
    </scroll-view>
  );
}

export default function TestStackHeaderItemAppearanceIOS() {
  return (
    <StackContainer routeConfigs={[{ name: 'Home', Component: ConfigScreen }]} />
  );
}
