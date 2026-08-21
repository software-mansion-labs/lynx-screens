import { createContext, useCallback, useContext, useEffect, useMemo, useState } from '@lynx-js/react';
import type {
  StackHeaderConfigProps,
  StackHeaderConfigPropsAndroid,
} from 'lynx-screens';
import { ScrollViewMarker } from 'lynx-screens';
import arrowIcon from '../assets/arrow.png';
import {
  Heading,
  SettingsButton,
  SettingsPicker,
  SettingsSwitch,
} from '../components/SettingsControls';
import { StackContainer } from '../components/StackContainer';
import { useStackNavigationContext } from '../hooks/useStackNavigationContext';
import type { StackRouteConfig } from '../types/StackContainer';

type TintColorOption = 'default' | 'purple' | 'red' | 'green';
type IconOption = 'default' | 'imageSource' | 'drawableResource';

const TINT_COLOR_OPTIONS: TintColorOption[] = [
  'default',
  'purple',
  'red',
  'green',
];

const ICON_OPTIONS: IconOption[] = [
  'default',
  'imageSource',
  'drawableResource',
];

interface Config {
  backButtonHidden: boolean;
  tintColorNormal: TintColorOption;
  tintColorPressed: TintColorOption;
  tintColorFocused: TintColorOption;
  icon: IconOption;
}

const DEFAULT_CONFIG: Config = {
  backButtonHidden: false,
  tintColorNormal: 'default',
  tintColorPressed: 'default',
  tintColorFocused: 'default',
  icon: 'default',
};

const ConfigContext = createContext<{
  config: Config;
  updateConfig: <K extends keyof Config>(key: K, value: Config[K]) => void;
}>({
  config: DEFAULT_CONFIG,
  updateConfig: () => {},
});

function resolveTintColor(
  option: TintColorOption,
): StackHeaderConfigPropsAndroid['backButtonTintColorNormal'] {
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
): StackHeaderConfigPropsAndroid['backButtonIcon'] {
  switch (option) {
    case 'imageSource':
      return {
        type: 'imageSource',
        uri: arrowIcon,
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

function buildHeaderConfig(config: Config): StackHeaderConfigProps {
  return {
    title: 'Back Button Test',
    backButtonHidden: config.backButtonHidden,
    android: {
      backButtonTintColorNormal: resolveTintColor(config.tintColorNormal),
      backButtonTintColorPressed: resolveTintColor(config.tintColorPressed),
      backButtonTintColorFocused: resolveTintColor(config.tintColorFocused),
      backButtonIcon: resolveIcon(config.icon),
    },
  };
}

export default function App(props: { onRender?: () => void }) {
  const [config, setConfig] = useState<Config>(DEFAULT_CONFIG);

  const updateConfig = useCallback(
    <K extends keyof Config>(key: K, value: Config[K]) => {
      setConfig((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  // The header config is part of the route options so a pushed screen mounts
  // its header in the same commit as the screen - the setRouteOptions effect
  // lands in a later native update than the push on Lynx, making the header
  // appear only after the transition. The config is app-level state here, so
  // the route configs are rebuilt from the current value; already-mounted
  // instances keep receiving updates through useApplyHeaderConfig.
  const routeConfigs = useMemo<StackRouteConfig[]>(() => {
    const headerConfig = buildHeaderConfig(config);
    return [
      {
        name: 'Root',
        Component: RootScreen,
        options: { headerConfig },
      },
      {
        name: 'Pushed',
        Component: PushedScreen,
        options: { headerConfig },
      },
    ];
  }, [config]);

  return (
    <ConfigContext.Provider value={{ config, updateConfig }}>
      <StackContainer routeConfigs={routeConfigs} />
    </ConfigContext.Provider>
  );
}

function ConfigControls() {
  const { config, updateConfig } = useContext(ConfigContext);

  return (
    <>
      <Heading label="Back Button" />
      <SettingsSwitch
        label="backButtonHidden"
        value={config.backButtonHidden}
        onValueChange={(v) => updateConfig('backButtonHidden', v)}
      />
      <SettingsPicker<TintColorOption>
        label="tintColorNormal"
        value={config.tintColorNormal}
        onValueChange={(v) => updateConfig('tintColorNormal', v)}
        items={TINT_COLOR_OPTIONS}
      />
      <SettingsPicker<TintColorOption>
        label="tintColorPressed"
        value={config.tintColorPressed}
        onValueChange={(v) => updateConfig('tintColorPressed', v)}
        items={TINT_COLOR_OPTIONS}
      />
      <SettingsPicker<TintColorOption>
        label="tintColorFocused"
        value={config.tintColorFocused}
        onValueChange={(v) => updateConfig('tintColorFocused', v)}
        items={TINT_COLOR_OPTIONS}
      />
      <SettingsPicker<IconOption>
        label="icon"
        value={config.icon}
        onValueChange={(v) => updateConfig('icon', v)}
        items={ICON_OPTIONS}
      />
    </>
  );
}

function useApplyHeaderConfig() {
  const { config } = useContext(ConfigContext);
  const { setRouteOptions, routeKey } = useStackNavigationContext();
  const headerConfig = useMemo(() => buildHeaderConfig(config), [config]);

  useEffect(() => {
    setRouteOptions(routeKey, { headerConfig });
  }, [headerConfig, setRouteOptions, routeKey]);
}

function RootScreen() {
  const { push } = useStackNavigationContext();
  useApplyHeaderConfig();

  return (
    <ScrollViewMarker style={{ width: '100%', height: '100%' }}>
      <scroll-view
        scroll-y
        style={{ width: '100%', height: '100%', backgroundColor: 'white' }}
      >
        <view style={{ padding: '16px', gap: '6px' }}>
          <ConfigControls />
          <Heading label="Navigation" />
          <SettingsButton label="Push screen" onTap={() => push('Pushed')} />
        </view>
      </scroll-view>
    </ScrollViewMarker>
  );
}

function PushedScreen() {
  const { push } = useStackNavigationContext();
  useApplyHeaderConfig();

  return (
    <ScrollViewMarker style={{ width: '100%', height: '100%' }}>
      <scroll-view
        scroll-y
        style={{ width: '100%', height: '100%', backgroundColor: 'white' }}
      >
        <view style={{ padding: '16px', gap: '6px' }}>
          <ConfigControls />
          <Heading label="Navigation" />
          <SettingsButton label="Push another" onTap={() => push('Pushed')} />
        </view>
      </scroll-view>
    </ScrollViewMarker>
  );
}
