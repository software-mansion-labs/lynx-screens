import { useCallback, useEffect, useMemo, useState } from '@lynx-js/react';
import type { StackHeaderConfigProps } from 'lynx-screens';
import { ScrollViewMarker } from 'lynx-screens';
import {
  Heading,
  LongText,
  SettingsPicker,
  SettingsSwitch,
} from '../components/SettingsControls';
import { StackContainer } from '../components/StackContainer';
import { useStackNavigationContext } from '../hooks/useStackNavigationContext';

// Port of RNS single-feature-tests/stack-v5/test-stack-lift-on-scroll-android.

type TriState = 'undefined' | 'true' | 'false';

const TRI_STATE_VALUES: TriState[] = ['undefined', 'true', 'false'];

interface Config {
  enabled: boolean;
  liftOnScroll: TriState;
  transparent: boolean;
  hidden: boolean;
}

const DEFAULT_CONFIG: Config = {
  enabled: true,
  liftOnScroll: 'undefined', // -> default (true)
  transparent: false,
  hidden: false,
};

function resolveTriState(value: TriState): boolean | undefined {
  return value === 'undefined' ? undefined : value === 'true';
}

function buildHeaderConfig(config: Config): StackHeaderConfigProps | undefined {
  if (!config.enabled) {
    return undefined;
  }

  return {
    title: 'Lift on scroll',
    hidden: config.hidden,
    transparent: config.transparent,
    android: {
      type: 'small',
      liftOnScroll: resolveTriState(config.liftOnScroll),
    },
  };
}

export default function App(props: { onRender?: () => void }) {
  return (
    <StackContainer
      routeConfigs={[{ name: 'Home', Component: ConfigScreen, options: {} }]}
    />
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
          <SettingsSwitch
            label="headerConfig enabled (attach/detach)"
            value={config.enabled}
            onValueChange={(v) => updateConfig('enabled', v)}
          />
          <SettingsPicker<TriState>
            label="liftOnScroll"
            value={config.liftOnScroll}
            onValueChange={(v) => updateConfig('liftOnScroll', v)}
            items={TRI_STATE_VALUES}
          />
          <SettingsSwitch
            label="transparent"
            value={config.transparent}
            onValueChange={(v) => updateConfig('transparent', v)}
          />
          <SettingsSwitch
            label="hidden"
            value={config.hidden}
            onValueChange={(v) => updateConfig('hidden', v)}
          />

          <Heading label="Scroll to observe lift" />
          <LongText paragraphs={20} />
        </view>
      </scroll-view>
    </ScrollViewMarker>
  );
}
