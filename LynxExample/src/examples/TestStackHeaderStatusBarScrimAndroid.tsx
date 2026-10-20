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

// Port of RNS single-feature-tests/stack-v5/test-stack-header-status-bar-scrim-android.
// Adaptations: the PlatformColor option is dropped (RN-only API; Lynx colors
// are CSS strings) and the translucent/transparent colors are written in the
// #AARRGGBB form the native side parses.

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
  statusBarScrimColor: ColorOption;
  exitUntilCollapsed: boolean;
}

const DEFAULT_CONFIG: Config = {
  type: 'small',
  backgroundColor: 'default',
  scrolledBackgroundColor: 'default',
  statusBarScrimColor: 'default',
  exitUntilCollapsed: false,
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

function resolveStrongColor(value: ColorOption): string | undefined {
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

function buildHeaderConfig(config: Config): StackHeaderConfigProps {
  return {
    title: 'Status bar scrim',
    android: {
      type: config.type,

      // Header content must be able to pass under the status bar to exercise
      // the scrim: the small toolbar scrolls fully off, and medium/large exit
      // fully unless exitUntilCollapsed pins the toolbar below the inset.
      scrollFlagScroll: true,
      scrollFlagEnterAlways: true,
      scrollFlagExitUntilCollapsed:
        config.type === 'small' ? undefined : config.exitUntilCollapsed,

      backgroundColor: resolveBackgroundColor(config.backgroundColor),
      scrolledBackgroundColor: resolveStrongColor(
        config.scrolledBackgroundColor,
      ),
      statusBarScrimColor: resolveStrongColor(config.statusBarScrimColor),
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
            label="statusBarScrimColor"
            value={config.statusBarScrimColor}
            onValueChange={(v) => updateConfig('statusBarScrimColor', v)}
            items={COLOR_OPTIONS}
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
            label="scrollFlagExitUntilCollapsed (medium/large)"
            value={config.exitUntilCollapsed}
            onValueChange={(v) => updateConfig('exitUntilCollapsed', v)}
          />

          <Heading label="Scroll to move content under the bar" />
          <LongText paragraphs={30} />
        </view>
      </scroll-view>
    </ScrollViewMarker>
  );
}
