import { useCallback, useEffect, useMemo, useState } from '@lynx-js/react';
import type {
  StackHeaderConfigProps,
  StackHeaderConfigPropsAndroid,
  StackHeaderTypeAndroid,
} from 'lynx-screens';
import { ScrollViewMarker } from 'lynx-screens';
import {
  LongText,
  SettingsButton,
  SettingsPicker,
  SettingsSwitch,
} from '../components/SettingsControls';
import { StackContainer } from '../components/StackContainer';
import type { StackRouteConfig } from '../types/StackContainer';
import { useStackNavigationContext } from '../hooks/useStackNavigationContext';

// Port of RNS single-feature-tests/stack-v5/test-stack-header-hidden-restore-android.

const HEADER_TYPES: StackHeaderTypeAndroid[] = ['small', 'medium', 'large'];

type ScrollFlags = Required<
  Pick<
    StackHeaderConfigPropsAndroid,
    | 'scrollFlagScroll'
    | 'scrollFlagEnterAlways'
    | 'scrollFlagEnterAlwaysCollapsed'
    | 'scrollFlagExitUntilCollapsed'
    | 'scrollFlagSnap'
  >
>;

const ALL_FLAGS_OFF: ScrollFlags = {
  scrollFlagScroll: false,
  scrollFlagEnterAlways: false,
  scrollFlagEnterAlwaysCollapsed: false,
  scrollFlagExitUntilCollapsed: false,
  scrollFlagSnap: false,
};

// Only valid flag combinations: `enterAlwaysCollapsed` requires `enterAlways`,
// and both are meaningful only without `exitUntilCollapsed`.
const SCROLL_FLAG_PRESETS = {
  default: {
    ...ALL_FLAGS_OFF,
    scrollFlagScroll: true,
    scrollFlagExitUntilCollapsed: true,
    scrollFlagSnap: true,
  },
  'no snap': {
    ...ALL_FLAGS_OFF,
    scrollFlagScroll: true,
    scrollFlagExitUntilCollapsed: true,
  },
  'scroll only': { ...ALL_FLAGS_OFF, scrollFlagScroll: true },
  enterAlways: {
    ...ALL_FLAGS_OFF,
    scrollFlagScroll: true,
    scrollFlagEnterAlways: true,
  },
  enterAlwaysCollapsed: {
    ...ALL_FLAGS_OFF,
    scrollFlagScroll: true,
    scrollFlagEnterAlways: true,
    scrollFlagEnterAlwaysCollapsed: true,
  },
  none: ALL_FLAGS_OFF,
} satisfies Record<string, ScrollFlags>;

type ScrollFlagPreset = keyof typeof SCROLL_FLAG_PRESETS;

const SCROLL_FLAG_PRESET_NAMES = Object.keys(
  SCROLL_FLAG_PRESETS,
) as ScrollFlagPreset[];

interface Config {
  hidden: boolean;
  headerConfig: boolean;
  type: StackHeaderTypeAndroid;
  scrollFlags: ScrollFlagPreset;
}

const DEFAULT_CONFIG: Config = {
  hidden: false,
  headerConfig: true,
  type: 'large',
  scrollFlags: 'default',
};

const CARD_BACKGROUND = '#ffffff';

// Without a header there is nothing keeping the content below the status
// bar, so a top inset has to take over while the header is gone. There is no
// SafeAreaView on Lynx (RNS uses react-native-screens/experimental), so a
// fixed status-bar-sized padding stands in for it.
const STATUS_BAR_INSET = '36px';

function buildHeaderConfig(config: Config): StackHeaderConfigProps | undefined {
  if (!config.headerConfig) {
    return undefined;
  }

  return {
    title: 'Hidden restore',
    hidden: config.hidden,
    android: {
      type: config.type,
      ...SCROLL_FLAG_PRESETS[config.scrollFlags],
    },
  };
}

function HomeScreen() {
  const { push, setRouteOptions, routeKey } = useStackNavigationContext();
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

  const hasHeader = config.headerConfig && !config.hidden;

  return (
    <view
      style={{
        width: '100%',
        height: '100%',
        paddingTop: hasHeader ? undefined : STATUS_BAR_INSET,
        backgroundColor: CARD_BACKGROUND,
      }}
    >
      <ScrollViewMarker style={{ width: '100%', height: '100%' }}>
        {/* The controls stay at the top of the content (no sticky headers on
            Lynx scroll-view); scroll back up to reach them. */}
        <scroll-view
          scroll-y
          style={{ width: '100%', height: '100%', backgroundColor: CARD_BACKGROUND }}
        >
          <view style={{ padding: '16px' }}>
            <view
              style={{
                gap: '6px',
                paddingTop: '6px',
                paddingBottom: '6px',
                backgroundColor: CARD_BACKGROUND,
              }}
            >
              <SettingsSwitch
                label="hidden"
                value={config.hidden}
                onValueChange={(v) => updateConfig('hidden', v)}
              />
              <SettingsSwitch
                label="headerConfig"
                value={config.headerConfig}
                onValueChange={(v) => updateConfig('headerConfig', v)}
              />
              <SettingsPicker<StackHeaderTypeAndroid>
                label="type"
                value={config.type}
                onValueChange={(v) => updateConfig('type', v)}
                items={HEADER_TYPES}
              />
              <SettingsPicker<ScrollFlagPreset>
                label="scroll flags"
                value={config.scrollFlags}
                onValueChange={(v) => updateConfig('scrollFlags', v)}
                items={SCROLL_FLAG_PRESET_NAMES}
              />
              <SettingsButton label="Push Details" onTap={() => push('Details')} />
            </view>

            <LongText paragraphs={40} />
          </view>
        </scroll-view>
      </ScrollViewMarker>
    </view>
  );
}

function DetailsScreen() {
  const { setRouteOptions, routeKey } = useStackNavigationContext();
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    setRouteOptions(routeKey, {
      headerConfig: {
        title: 'Details',
        hidden,
        android: {
          type: 'large',
          ...SCROLL_FLAG_PRESETS.default,
        },
      },
    });
  }, [hidden, setRouteOptions, routeKey]);

  return (
    <view
      style={{
        width: '100%',
        height: '100%',
        paddingTop: hidden ? STATUS_BAR_INSET : undefined,
        backgroundColor: CARD_BACKGROUND,
      }}
    >
      <ScrollViewMarker style={{ width: '100%', height: '100%' }}>
        <scroll-view
          scroll-y
          style={{ width: '100%', height: '100%', backgroundColor: CARD_BACKGROUND }}
        >
          <view style={{ padding: '16px' }}>
            <view
              style={{
                gap: '6px',
                paddingTop: '6px',
                paddingBottom: '6px',
                backgroundColor: CARD_BACKGROUND,
              }}
            >
              <SettingsSwitch label="hidden" value={hidden} onValueChange={setHidden} />
            </view>

            <LongText paragraphs={40} />
          </view>
        </scroll-view>
      </ScrollViewMarker>
    </view>
  );
}

const STACK_ROUTE_CONFIGS: StackRouteConfig[] = [
  {
    name: 'Home',
    Component: HomeScreen,
  },
  {
    name: 'Details',
    Component: DetailsScreen,
    options: {
      headerConfig: {
        title: 'Details',
        hidden: true,
      },
    },
  },
];

export default function TestStackHeaderHiddenRestoreAndroid() {
  return <StackContainer routeConfigs={STACK_ROUTE_CONFIGS} />;
}
