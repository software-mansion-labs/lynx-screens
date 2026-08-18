import { useCallback, useEffect, useMemo, useState } from '@lynx-js/react';
import type {
  StackHeaderConfigProps,
  StackHeaderTypeAndroid,
  StackHeaderBackgroundSubviewCollapseModeAndroid,
} from 'lynx-screens';
import {
  Heading,
  LongText,
  SettingsButton,
  SettingsPicker,
  SettingsSwitch,
} from '../components/SettingsControls';
import { StackContainer } from '../components/StackContainer';
import { useStackNavigationContext } from '../hooks/useStackNavigationContext';
import type { StackRouteConfig } from '../types/StackContainer';

const SHORT_TITLE = 'Hello';
const LONG_TITLE =
  'A Very Long Title That Should Ellipsize When There Is Not Enough Space Available';

type SubviewSize = 'none' | 'sm' | 'md' | 'lg';
type TitleOption = 'short' | 'long';
type ScrollFlagValue = 'undefined' | 'true' | 'false';

interface Config {
  enabled: boolean;
  type: StackHeaderTypeAndroid;
  transparent: boolean;
  hidden: boolean;
  title: TitleOption;
  leadingSize: SubviewSize;
  centerSize: SubviewSize;
  trailingSize: SubviewSize;
  backgroundEnabled: boolean;
  backgroundCollapseMode: StackHeaderBackgroundSubviewCollapseModeAndroid;
  scrollFlagScroll: ScrollFlagValue;
  scrollFlagEnterAlways: ScrollFlagValue;
  scrollFlagEnterAlwaysCollapsed: ScrollFlagValue;
  scrollFlagExitUntilCollapsed: ScrollFlagValue;
  scrollFlagSnap: ScrollFlagValue;
}

const DEFAULT_CONFIG: Config = {
  enabled: true,
  type: 'large',
  transparent: false,
  hidden: false,
  title: 'short',
  leadingSize: 'none',
  centerSize: 'none',
  trailingSize: 'none',
  backgroundEnabled: false,
  backgroundCollapseMode: 'parallax',
  scrollFlagScroll: 'undefined',
  scrollFlagEnterAlways: 'undefined',
  scrollFlagEnterAlwaysCollapsed: 'undefined',
  scrollFlagExitUntilCollapsed: 'undefined',
  scrollFlagSnap: 'undefined',
};

const SUBVIEW_SIZES: SubviewSize[] = ['none', 'sm', 'md', 'lg'];
const HEADER_TYPES: StackHeaderTypeAndroid[] = ['small', 'medium', 'large'];
const COLLAPSE_MODES: StackHeaderBackgroundSubviewCollapseModeAndroid[] = [
  'off',
  'parallax',
];
const TITLE_OPTIONS: TitleOption[] = ['short', 'long'];
const SCROLL_FLAG_VALUES: ScrollFlagValue[] = ['undefined', 'true', 'false'];

function resolveScrollFlag(value: ScrollFlagValue): boolean | undefined {
  switch (value) {
    case 'true':
      return true;
    case 'false':
      return false;
    default:
      return undefined;
  }
}

function getSubviewDimensions(size: SubviewSize): {
  width: number;
  height: number;
} {
  switch (size) {
    case 'sm':
      return { width: 24, height: 24 };
    case 'md':
      return { width: 24, height: 40 };
    case 'lg':
      return { width: 80, height: 40 };
    default:
      return { width: 0, height: 0 };
  }
}

function buildHeaderConfig(config: Config): StackHeaderConfigProps | undefined {
  if (!config.enabled) {
    return undefined;
  }

  const makeToolbarSubview = (size: SubviewSize, label: string) => {
    if (size === 'none') {
      return undefined;
    }
    const dims = getSubviewDimensions(size);
    return {
      Component: (
        <view
          style={{
            display: 'flex',
            width: `${dims.width}px`,
            height: `${dims.height}px`,
            backgroundColor: '#3f51b5',
            justifyContent: 'center',
            alignItems: 'center',
          }}
          bindtap={() => console.log(`[Example] Tapped subview ${label}`)}
        >
          <text style={{ color: 'white', fontSize: '10px' }}>{label}</text>
        </view>
      ),
    };
  };

  // The RNS example uses an image asset here; a gradient-ish colored view keeps
  // the example asset-free while still visualising parallax collapse.
  const backgroundSubview = config.backgroundEnabled
    ? {
        collapseMode: config.backgroundCollapseMode,
        Component: (
          <view
            style={{
              display: 'flex',
              flexDirection: 'column',
              width: '100%',
              height: '100%',
              backgroundColor: '#2e7d32',
              justifyContent: 'flex-end',
              alignItems: 'center',
            }}
          />
        ),
      }
    : undefined;

  return {
    title: config.title === 'short' ? SHORT_TITLE : LONG_TITLE,
    hidden: config.hidden,
    transparent: config.transparent,
    android: {
      type: config.type,
      backgroundSubview,
      leadingSubview: makeToolbarSubview(config.leadingSize, 'L'),
      centerSubview: makeToolbarSubview(config.centerSize, 'C'),
      trailingSubview: makeToolbarSubview(config.trailingSize, 'T'),
      scrollFlagScroll: resolveScrollFlag(config.scrollFlagScroll),
      scrollFlagEnterAlways: resolveScrollFlag(config.scrollFlagEnterAlways),
      scrollFlagEnterAlwaysCollapsed: resolveScrollFlag(
        config.scrollFlagEnterAlwaysCollapsed,
      ),
      scrollFlagExitUntilCollapsed: resolveScrollFlag(
        config.scrollFlagExitUntilCollapsed,
      ),
      scrollFlagSnap: resolveScrollFlag(config.scrollFlagSnap),
    },
  };
}

const ROUTE_CONFIGS: StackRouteConfig[] = [
  {
    name: 'Home',
    Component: ConfigScreen,
    options: {},
  },
];

export default function App(props: { onRender?: () => void }) {
  return <StackContainer routeConfigs={ROUTE_CONFIGS} />;
}

function ConfigScreen() {
  const navigation = useStackNavigationContext();
  const [config, setConfig] = useState<Config>(DEFAULT_CONFIG);

  const updateConfig = useCallback(
    <K extends keyof Config>(key: K, value: Config[K]) => {
      setConfig((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const { setRouteOptions, routeKey, push } = navigation;
  const headerConfig = useMemo(() => buildHeaderConfig(config), [config]);

  useEffect(() => {
    setRouteOptions(routeKey, {
      headerConfig,
    });
  }, [headerConfig, setRouteOptions, routeKey]);

  return (
    <scroll-view
      style={{ width: '100%', height: '100%', backgroundColor: 'white' }}
    >
      <view style={{ padding: '16px', gap: '6px' }}>
        <Heading label="General" />
        <SettingsSwitch
          label="headerConfig enabled"
          value={config.enabled}
          onValueChange={(v) => updateConfig('enabled', v)}
        />
        <SettingsPicker<StackHeaderTypeAndroid>
          label="type"
          value={config.type}
          onValueChange={(v) => updateConfig('type', v)}
          items={HEADER_TYPES}
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
        <SettingsPicker<TitleOption>
          label="title"
          value={config.title}
          onValueChange={(v) => updateConfig('title', v)}
          items={TITLE_OPTIONS}
        />

        <Heading label="Toolbar Subviews" />
        <SettingsPicker<SubviewSize>
          label="leading"
          value={config.leadingSize}
          onValueChange={(v) => updateConfig('leadingSize', v)}
          items={SUBVIEW_SIZES}
        />
        <SettingsPicker<SubviewSize>
          label="center"
          value={config.centerSize}
          onValueChange={(v) => updateConfig('centerSize', v)}
          items={SUBVIEW_SIZES}
        />
        <SettingsPicker<SubviewSize>
          label="trailing"
          value={config.trailingSize}
          onValueChange={(v) => updateConfig('trailingSize', v)}
          items={SUBVIEW_SIZES}
        />

        <Heading label="Background Subview" />
        <SettingsSwitch
          label="background enabled"
          value={config.backgroundEnabled}
          onValueChange={(v) => updateConfig('backgroundEnabled', v)}
        />
        <SettingsPicker<StackHeaderBackgroundSubviewCollapseModeAndroid>
          label="collapseMode"
          value={config.backgroundCollapseMode}
          onValueChange={(v) => updateConfig('backgroundCollapseMode', v)}
          items={COLLAPSE_MODES}
        />

        <Heading label="Scroll Flags" />
        <SettingsPicker<ScrollFlagValue>
          label="scrollFlagScroll"
          value={config.scrollFlagScroll}
          onValueChange={(v) => updateConfig('scrollFlagScroll', v)}
          items={SCROLL_FLAG_VALUES}
        />
        <SettingsPicker<ScrollFlagValue>
          label="scrollFlagEnterAlways"
          value={config.scrollFlagEnterAlways}
          onValueChange={(v) => updateConfig('scrollFlagEnterAlways', v)}
          items={SCROLL_FLAG_VALUES}
        />
        <SettingsPicker<ScrollFlagValue>
          label="scrollFlagEnterAlwaysCollapsed"
          value={config.scrollFlagEnterAlwaysCollapsed}
          onValueChange={(v) => updateConfig('scrollFlagEnterAlwaysCollapsed', v)}
          items={SCROLL_FLAG_VALUES}
        />
        <SettingsPicker<ScrollFlagValue>
          label="scrollFlagExitUntilCollapsed"
          value={config.scrollFlagExitUntilCollapsed}
          onValueChange={(v) => updateConfig('scrollFlagExitUntilCollapsed', v)}
          items={SCROLL_FLAG_VALUES}
        />
        <SettingsPicker<ScrollFlagValue>
          label="scrollFlagSnap"
          value={config.scrollFlagSnap}
          onValueChange={(v) => updateConfig('scrollFlagSnap', v)}
          items={SCROLL_FLAG_VALUES}
        />

        <Heading label="Push screen" />
        <SettingsButton label="Push screen" onTap={() => push('Home')} />

        <Heading label="ScrollView content" />
        <LongText paragraphs={20} />
      </view>
    </scroll-view>
  );
}
