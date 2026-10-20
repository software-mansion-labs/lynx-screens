import { useLayoutEffect, useState } from '@lynx-js/react';
import type {
  StackHeaderConfigProps,
  StackHeaderMinimizationBehaviorIOS,
  StackHeaderRestorationBehaviorIOS,
} from 'lynx-screens';
import { SettingsPicker } from '../components/SettingsControls';
import { StackContainer } from '../components/StackContainer';
import { useStackNavigationContext } from '../hooks/useStackNavigationContext';
import type { StackRouteConfig } from '../types/StackContainer';

// Port of RNS single-feature-tests/stack-v5/test-stack-header-bar-minimization-ios.
// Requires iOS 27+ (the bar never minimizes below).

const MINIMIZATION_BEHAVIORS: StackHeaderMinimizationBehaviorIOS[] = [
  'automatic',
  'never',
  'onScrollDown',
  'onScrollUp',
];

const RESTORATION_BEHAVIORS: StackHeaderRestorationBehaviorIOS[] = [
  'automatic',
  'atScrollEdge',
];

interface MinimizationConfig {
  minimizationBehavior: StackHeaderMinimizationBehaviorIOS;
  restorationBehavior: StackHeaderRestorationBehaviorIOS;
}

const INITIAL_CONFIG: MinimizationConfig = {
  minimizationBehavior: 'automatic',
  restorationBehavior: 'automatic',
};

// Adaptation: RNS examples rely on UIKit's automatic scroll-view content
// inset (contentInsetAdjustmentBehavior="automatic") to start content below
// the navigation bar. Lynx's scroll-view hardcodes that behavior to "never",
// and RNS does not offset v5 screen content below the header natively (yet)
// on iOS - approximate the inset with a static padding instead.
const CONTENT_PADDING_TOP = SystemInfo.platform === 'iOS' ? '120px' : '16px';

function ResizingItem() {
  const [large, setLarge] = useState(false);

  return (
    <view
      bindtap={() => setLarge((value) => !value)}
      style={{
        width: large ? '60px' : '20px',
        height: large ? '30px' : '20px',
        backgroundColor: '#3f51b5',
      }}
    />
  );
}

function buildHeaderConfig(config: MinimizationConfig): StackHeaderConfigProps {
  return {
    title: 'Scroll',
    ios: {
      minimizationBehavior: config.minimizationBehavior,
      restorationBehavior: config.restorationBehavior,
      leadingItems: [
        {
          type: 'item',
          id: 'leading-0',
          render: () => <ResizingItem />,
        },
        {
          type: 'spacer',
          id: 'spacer-leading-1',
          sizing: 'fixed',
          width: 100,
        },
        {
          type: 'item',
          id: 'leading-1',
          render: () => <ResizingItem />,
        },
      ],
      trailingItems: [
        {
          type: 'item',
          id: 'trailing-0',
          render: () => <ResizingItem />,
        },
        {
          type: 'spacer',
          id: 'spacer-trailing-1',
          sizing: 'flexible',
        },
        {
          type: 'item',
          id: 'trailing-1',
          render: () => <ResizingItem />,
        },
      ],
    },
  };
}

const ROUTE_CONFIGS: StackRouteConfig[] = [
  {
    name: 'Scroll',
    Component: ScrollScreen,
    options: {
      headerConfig: buildHeaderConfig(INITIAL_CONFIG),
    },
  },
];

export default function TestStackHeaderBarMinimizationIOS() {
  return <StackContainer routeConfigs={ROUTE_CONFIGS} />;
}

function ScrollScreen() {
  const { routeKey, setRouteOptions } = useStackNavigationContext();
  const [config, setConfig] = useState(INITIAL_CONFIG);

  useLayoutEffect(() => {
    setRouteOptions(routeKey, { headerConfig: buildHeaderConfig(config) });
  }, [config, setRouteOptions, routeKey]);

  return (
    <scroll-view scroll-y style={{ width: '100%', height: '100%' }}>
      <view style={{ paddingTop: CONTENT_PADDING_TOP }}>
        <view style={{ paddingLeft: '16px', paddingRight: '16px', gap: '6px' }}>
          <SettingsPicker<StackHeaderMinimizationBehaviorIOS>
            label="minimizationBehavior"
            value={config.minimizationBehavior}
            onValueChange={(value) =>
              setConfig((prev) => ({ ...prev, minimizationBehavior: value }))
            }
            items={MINIMIZATION_BEHAVIORS}
          />
          <SettingsPicker<StackHeaderRestorationBehaviorIOS>
            label="restorationBehavior"
            value={config.restorationBehavior}
            onValueChange={(value) =>
              setConfig((prev) => ({ ...prev, restorationBehavior: value }))
            }
            items={RESTORATION_BEHAVIORS}
          />
        </view>
        {Array.from({ length: 100 }, (_, index) => (
          <text
            key={index}
            style={{
              padding: '16px',
              borderBottomWidth: '1px',
              borderBottomColor: '#90caf9',
              backgroundColor: '#e3f2fd',
              color: 'black',
            }}
          >
            Row {index}
          </text>
        ))}
      </view>
    </scroll-view>
  );
}
