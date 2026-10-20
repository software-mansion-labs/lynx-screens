import { useCallback, useEffect, useMemo, useState } from '@lynx-js/react';
import type { StackHeaderConfigProps, StackHeaderTypeAndroid } from 'lynx-screens';
import { ScrollViewMarker } from 'lynx-screens';
import {
  Heading,
  LongText,
  SettingsPicker,
  SettingsSwitch,
} from '../components/SettingsControls';
import { StackContainer } from '../components/StackContainer';
import { useStackNavigationContext } from '../hooks/useStackNavigationContext';
import type { StackRouteConfig } from '../types/StackContainer';

// Port of RNS single-feature-tests/stack-v5/test-stack-header-background-android.
// Adaptations: the PlatformColor option is dropped (RN-only API; Lynx colors
// are CSS strings), the translucent/transparent colors are written in the
// #AARRGGBB form the native side parses, and the trees image of the
// background subview is a colored view (keeps the example asset-free).

const options = <const T extends string>(...values: T[]): T[] => values;

const HEADER_TYPES: StackHeaderTypeAndroid[] = ['small', 'medium', 'large'];
const COLOR_OPTIONS = options(
  'default',
  'red',
  'green',
  'blue',
  'translucent',
  'transparent',
);

type ColorOption = (typeof COLOR_OPTIONS)[number];

// NavyLightTransparent of the RNS palette (#33488e40) in #AARRGGBB form.
const TRANSLUCENT = '#4033488e';
const TRANSPARENT = '#00000000';

interface Config {
  type: StackHeaderTypeAndroid;
  backgroundColor: ColorOption;
  scrolledBackgroundColor: ColorOption;
  backgroundSubview: boolean;
}

const DEFAULT_CONFIG: Config = {
  type: 'small',
  backgroundColor: 'default',
  scrolledBackgroundColor: 'default',
  backgroundSubview: false,
};

function resolveBackgroundColor(value: ColorOption): string | undefined {
  switch (value) {
    case 'red':
      return '#ffa3a1';
    case 'green':
      return '#b1dfd0';
    case 'blue':
      return '#87cce8';
    case 'translucent':
      return TRANSLUCENT;
    case 'transparent':
      return TRANSPARENT;
    default:
      return undefined;
  }
}

function resolveScrolledBackgroundColor(
  value: ColorOption,
): string | undefined {
  switch (value) {
    case 'red':
      return '#ff6259';
    case 'green':
      return '#57b495';
    case 'blue':
      return '#38acdd';
    case 'translucent':
      return TRANSLUCENT;
    case 'transparent':
      return TRANSPARENT;
    default:
      return undefined;
  }
}

// The "image" fills only the trailing part of the header so the background
// color stays visible next to it (and behind it through the scrim when
// collapsed).
function TreesBackground() {
  return (
    <view
      style={{
        display: 'flex',
        flexDirection: 'row',
        width: '100%',
        height: '100%',
        justifyContent: 'flex-end',
      }}
    >
      <view style={{ width: '50%', height: '100%', backgroundColor: '#2e7d32' }} />
    </view>
  );
}

function buildHeaderConfig(config: Config): StackHeaderConfigProps {
  return {
    title: 'Header background',
    android: {
      type: config.type,

      // Collapsing headers re-expand as soon as the user scrolls up, so the
      // tester can compare expanded/collapsed appearance from any scroll offset.
      scrollFlagEnterAlways: config.type === 'small' ? undefined : true,

      backgroundColor: resolveBackgroundColor(config.backgroundColor),
      scrolledBackgroundColor: resolveScrolledBackgroundColor(
        config.scrolledBackgroundColor,
      ),

      // The background subview is supported only for collapsing header types.
      backgroundSubview:
        config.backgroundSubview && config.type !== 'small'
          ? { collapseMode: 'parallax', render: () => <TreesBackground /> }
          : undefined,
    },
  };
}

const ROUTE_CONFIGS: StackRouteConfig[] = [
  {
    name: 'Home',
    Component: ConfigScreen,
    // Initial header config so the screen mounts its header in the same
    // commit - the setRouteOptions effect lands in a later native update on
    // Lynx, making the header appear only after the transition. The effect
    // takes over for runtime updates.
    options: { headerConfig: buildHeaderConfig(DEFAULT_CONFIG) },
  },
];

export default function App() {
  return (
    // Shows through the header when header is transparent.
    <view style={{ width: '100%', height: '100%', backgroundColor: '#b58df1' }}>
      <StackContainer routeConfigs={ROUTE_CONFIGS} />
    </view>
  );
}

function ConfigScreen() {
  const { setRouteOptions, routeKey } = useStackNavigationContext();
  const [config, setConfig] = useState<Config>(DEFAULT_CONFIG);

  const updateConfig = useCallback(
    <K extends keyof Config>(key: K, value: Config[K]) => {
      setConfig((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const headerConfig = useMemo(() => buildHeaderConfig(config), [config]);

  useEffect(() => {
    setRouteOptions(routeKey, { headerConfig });
  }, [headerConfig, setRouteOptions, routeKey]);

  return (
    <ScrollViewMarker style={{ width: '100%', height: '100%' }}>
      <scroll-view
        scroll-y
        style={{ width: '100%', height: '100%', backgroundColor: 'white' }}
      >
        <view style={{ padding: '16px', gap: '6px' }}>
          <Heading label="Header config" />
          <SettingsPicker<StackHeaderTypeAndroid>
            label="type"
            value={config.type}
            onValueChange={(v) => updateConfig('type', v)}
            items={HEADER_TYPES}
          />
          <SettingsPicker<ColorOption>
            label="backgroundColor"
            value={config.backgroundColor}
            onValueChange={(v) => updateConfig('backgroundColor', v)}
            items={COLOR_OPTIONS}
          />
          <SettingsPicker<ColorOption>
            label="scrolledBackgroundColor"
            value={config.scrolledBackgroundColor}
            onValueChange={(v) => updateConfig('scrolledBackgroundColor', v)}
            items={COLOR_OPTIONS}
          />
          <SettingsSwitch
            label="backgroundSubview (medium/large)"
            value={config.backgroundSubview}
            onValueChange={(v) => updateConfig('backgroundSubview', v)}
          />

          <Heading label="Scroll to observe color changes" />
          <LongText paragraphs={30} />
        </view>
      </scroll-view>
    </ScrollViewMarker>
  );
}
