import { useCallback, useEffect, useMemo, useState } from '@lynx-js/react';
import type {
  StackHeaderConfigProps,
  StackHeaderConfigPropsAndroid,
  StackHeaderToolbarMenuElementAndroid,
} from 'lynx-screens';
import { ScrollViewMarker } from 'lynx-screens';
import searchIcon from '../assets/search_black.png';
import {
  Heading,
  SettingsPicker,
  SettingsSwitch,
} from '../components/SettingsControls';
import { StackContainer } from '../components/StackContainer';
import { useStackNavigationContext } from '../hooks/useStackNavigationContext';
import type { StackRouteConfig } from '../types/StackContainer';

// Port of RNS single-feature-tests/stack-v5/test-stack-overflow-icon-android.

const TINT_COLOR_OPTIONS = ['default', 'purple', 'red', 'green'] as const;
type TintColorOption = (typeof TINT_COLOR_OPTIONS)[number];

const ICON_OPTIONS = ['default', 'imageSource', 'drawableResource'] as const;
type IconOption = (typeof ICON_OPTIONS)[number];

interface Config {
  icon: IconOption;
  tintColorNormal: TintColorOption;
  tintColorPressed: TintColorOption;
  tintColorFocused: TintColorOption;
  showMenuItems: boolean;
}

const DEFAULT_CONFIG: Config = {
  icon: 'default',
  tintColorNormal: 'default',
  tintColorPressed: 'default',
  tintColorFocused: 'default',
  showMenuItems: true,
};

function resolveTintColor(
  option: TintColorOption,
): StackHeaderConfigPropsAndroid['overflowIconTintColorNormal'] {
  switch (option) {
    case 'purple':
      return '#9c27b0';
    case 'red':
      return '#f44336';
    case 'green':
      return '#4caf50';
    default:
      return undefined;
  }
}

function resolveIcon(
  option: IconOption,
): StackHeaderConfigPropsAndroid['overflowIcon'] {
  switch (option) {
    case 'imageSource':
      return {
        type: 'imageSource',
        uri: searchIcon,
      };
    case 'drawableResource':
      return {
        type: 'drawableResource',
        name: 'sym_call_missed',
      };
    default:
      return undefined;
  }
}

// All items use showAsAction 'never' so they land in the overflow popup, keeping
// the overflow (three-dots) button visible.
const MENU_ITEMS: StackHeaderToolbarMenuElementAndroid[] = [
  { type: 'menuItem', id: 'item-1', title: 'First', showAsAction: 'never' },
  { type: 'menuItem', id: 'item-2', title: 'Second', showAsAction: 'never' },
  { type: 'menuItem', id: 'item-3', title: 'Third', showAsAction: 'never' },
];

function buildHeaderConfig(config: Config): StackHeaderConfigProps {
  return {
    title: 'Overflow Icon Test',
    android: {
      overflowIcon: resolveIcon(config.icon),
      overflowIconTintColorNormal: resolveTintColor(config.tintColorNormal),
      overflowIconTintColorPressed: resolveTintColor(config.tintColorPressed),
      overflowIconTintColorFocused: resolveTintColor(config.tintColorFocused),
      toolbarMenu: { children: config.showMenuItems ? MENU_ITEMS : [] },
    },
  };
}

const ROUTE_CONFIGS: StackRouteConfig[] = [
  {
    name: 'Main',
    Component: MainScreen,
    // Initial header config so the screen mounts its header in the same
    // commit - the setRouteOptions effect lands in a later native update than
    // the push on Lynx, making the header appear only after the transition.
    // The effect takes over for runtime updates.
    options: { headerConfig: buildHeaderConfig(DEFAULT_CONFIG) },
  },
];

export default function App() {
  return <StackContainer routeConfigs={ROUTE_CONFIGS} />;
}

function MainScreen() {
  const [config, setConfig] = useState<Config>(DEFAULT_CONFIG);
  const { setRouteOptions, routeKey } = useStackNavigationContext();

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
          <Heading label="Overflow Icon" />
          <SettingsPicker<IconOption>
            label="icon"
            value={config.icon}
            onValueChange={(v) => updateConfig('icon', v)}
            items={[...ICON_OPTIONS]}
          />
          <SettingsPicker<TintColorOption>
            label="tintColorNormal"
            value={config.tintColorNormal}
            onValueChange={(v) => updateConfig('tintColorNormal', v)}
            items={[...TINT_COLOR_OPTIONS]}
          />
          <SettingsPicker<TintColorOption>
            label="tintColorPressed"
            value={config.tintColorPressed}
            onValueChange={(v) => updateConfig('tintColorPressed', v)}
            items={[...TINT_COLOR_OPTIONS]}
          />
          <SettingsPicker<TintColorOption>
            label="tintColorFocused"
            value={config.tintColorFocused}
            onValueChange={(v) => updateConfig('tintColorFocused', v)}
            items={[...TINT_COLOR_OPTIONS]}
          />
          <Heading label="Menu" />
          <SettingsSwitch
            label="showMenuItems"
            value={config.showMenuItems}
            onValueChange={(v) => updateConfig('showMenuItems', v)}
          />
        </view>
      </scroll-view>
    </ScrollViewMarker>
  );
}
