import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from '@lynx-js/react';
import type {
  StackHeaderCollapsedTitleGravityModeAndroid,
  StackHeaderConfigProps,
  StackHeaderTitleHorizontalGravityAndroid,
  StackHeaderToolbarMenuElementAndroid,
  StackHeaderTypeAndroid,
} from 'lynx-screens';
import { ScrollViewMarker } from 'lynx-screens';
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

// Port of RNS single-feature-tests/stack-v5/test-stack-header-content-insets-android.
// Adaptations: the RTL controls are dropped (RN-only I18nManager; the Lynx
// example has no layout-direction toggle), the RN Buttons are SettingsButtons
// and the probe subviews are plain views.

const HEADER_TITLE = 'Insets';

// Probes are rulers: a fixed dp width, printed on them, to judge offsets
// against. Note the toolbar lays the title out before start-gravity children,
// so on `small` the leading probe follows the title rather than the inset.
const RULER_PROBE_WIDTH = 40;
const WIDE_PROBE_WIDTH = 160;
const PROBE_HEIGHT = 32;

// Each picker's options are the single source of truth; the option union type is
// derived from the array so the two can never drift apart.
const options = <const T extends string>(...values: T[]): T[] => values;

const DP_VALUES = options('default', '0', '16', '32', '64', '96');
const PROBE_SIZES = options('none', 'ruler', 'wide');
const CENTER_PROBE_SIZES = options('none', 'ruler');
const MENU_ITEMS_VALUES = options('0', '1', '2');
const HEADER_TYPES: StackHeaderTypeAndroid[] = ['small', 'medium', 'large'];
const HORIZONTAL_GRAVITY_OPTIONS: StackHeaderTitleHorizontalGravityAndroid[] = [
  'start',
  'center',
  'end',
];
const GRAVITY_MODES: StackHeaderCollapsedTitleGravityModeAndroid[] = [
  'entireSpace',
  'availableSpace',
];

export type DpValue = (typeof DP_VALUES)[number];
export type ProbeSize = (typeof PROBE_SIZES)[number];
export type CenterProbeSize = (typeof CENTER_PROBE_SIZES)[number];
export type MenuItemsValue = (typeof MENU_ITEMS_VALUES)[number];

interface Config {
  contentInsetStart: DpValue;
  contentInsetEnd: DpValue;
  type: StackHeaderTypeAndroid;
  titleCentered: boolean;
  collapsedTitleHorizontalGravity: StackHeaderTitleHorizontalGravityAndroid;
  collapsedTitleGravityMode: StackHeaderCollapsedTitleGravityModeAndroid;
  backButtonHidden: boolean;
  menuItems: MenuItemsValue;
  leadingSubview: ProbeSize;
  centerSubview: CenterProbeSize;
  trailingSubview: ProbeSize;
}

const DEFAULT_CONFIG: Config = {
  contentInsetStart: 'default',
  contentInsetEnd: 'default',
  type: 'small',
  titleCentered: false,
  collapsedTitleHorizontalGravity: 'start',
  collapsedTitleGravityMode: 'availableSpace',
  backButtonHidden: false,
  menuItems: '0',
  leadingSubview: 'ruler',
  centerSubview: 'none',
  trailingSubview: 'ruler',
};

// The reason the props exist: with `availableSpace` the collapsed title is
// centered within the inset-shrunk content area, so it reads as off-center
// until the insets are zeroed. Subviews stay off so the title is alone.
const OFF_CENTER_PRESET: Config = {
  ...DEFAULT_CONFIG,
  type: 'large',
  collapsedTitleHorizontalGravity: 'center',
  collapsedTitleGravityMode: 'availableSpace',
  leadingSubview: 'none',
  trailingSubview: 'none',
};

const FIXED_PRESET: Config = {
  ...OFF_CENTER_PRESET,
  contentInsetStart: '0',
  contentInsetEnd: '0',
};

const ConfigContext = createContext<{
  config: Config;
  updateConfig: <K extends keyof Config>(key: K, value: Config[K]) => void;
  setConfig: (config: Config) => void;
}>({
  config: DEFAULT_CONFIG,
  updateConfig: () => {},
  setConfig: () => {},
});

function resolveDp(value: DpValue): number | undefined {
  return value === 'default' ? undefined : Number(value);
}

function probeWidth(size: Exclude<ProbeSize, 'none'>): number {
  return size === 'wide' ? WIDE_PROBE_WIDTH : RULER_PROBE_WIDTH;
}

function makeProbe(size: ProbeSize, label: string) {
  if (size === 'none') {
    return undefined;
  }

  const width = probeWidth(size);

  return {
    render: () => (
      <view
        style={{
          width: `${width}px`,
          height: `${PROBE_HEIGHT}px`,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: '1px',
          borderColor: '#9e9e9e',
          backgroundColor: '#d1c4e9',
        }}
      >
        <text style={{ fontSize: '12px', fontWeight: 'bold', color: 'black' }}>
          {`${label}·${width}`}
        </text>
      </view>
    ),
  };
}

function buildMenuItems(
  count: MenuItemsValue,
): StackHeaderToolbarMenuElementAndroid[] {
  return Array.from({ length: Number(count) }, (_, i) => ({
    type: 'menuItem',
    id: `menu-item-${i}`,
    title: `M${i}`,
    showAsAction: 'always',
  }));
}

function buildHeaderConfig(config: Config): StackHeaderConfigProps {
  return {
    title: HEADER_TITLE,
    backButtonHidden: config.backButtonHidden,
    android: {
      type: config.type,
      contentInsetStart: resolveDp(config.contentInsetStart),
      contentInsetEnd: resolveDp(config.contentInsetEnd),
      titleCentered: config.titleCentered,
      collapsedTitleHorizontalGravity: config.collapsedTitleHorizontalGravity,
      collapsedTitleGravityMode: config.collapsedTitleGravityMode,
      leadingSubview: makeProbe(config.leadingSubview, 'L'),
      // Center subviews are supported only by the small header.
      centerSubview:
        config.type === 'small'
          ? makeProbe(config.centerSubview, 'C')
          : undefined,
      trailingSubview: makeProbe(config.trailingSubview, 'T'),
      toolbarMenu:
        config.menuItems === '0'
          ? undefined
          : { children: buildMenuItems(config.menuItems) },
      // Keeps the collapsed state of medium/large reachable from any offset.
      scrollFlagEnterAlways: config.type === 'small' ? undefined : true,
    },
  };
}

function Presets() {
  const { setConfig } = useContext(ConfigContext);

  return (
    <view style={{ gap: '4px' }}>
      <SettingsButton label="Reset" onTap={() => setConfig(DEFAULT_CONFIG)} />
      <SettingsButton
        label="Off-center collapsed title"
        onTap={() => setConfig(OFF_CENTER_PRESET)}
      />
      <SettingsButton
        label="Fixed with insets"
        onTap={() => setConfig(FIXED_PRESET)}
      />
    </view>
  );
}

function Note({ text }: { text: string }) {
  return (
    <text style={{ color: 'black', fontSize: '13px', marginBottom: '4px' }}>
      {text}
    </text>
  );
}

function ConfigControls() {
  const { config, updateConfig } = useContext(ConfigContext);

  return (
    <>
      <Heading label="Presets" />
      <Presets />

      <Heading label="Content insets" />
      <SettingsPicker<DpValue>
        label="contentInsetStart"
        value={config.contentInsetStart}
        onValueChange={(v) => updateConfig('contentInsetStart', v)}
        items={DP_VALUES}
      />
      <SettingsPicker<DpValue>
        label="contentInsetEnd"
        value={config.contentInsetEnd}
        onValueChange={(v) => updateConfig('contentInsetEnd', v)}
        items={DP_VALUES}
      />

      <Heading label="Header" />
      <SettingsPicker<StackHeaderTypeAndroid>
        label="type"
        value={config.type}
        onValueChange={(v) => updateConfig('type', v)}
        items={HEADER_TYPES}
      />
      <SettingsSwitch
        label="titleCentered"
        value={config.titleCentered}
        onValueChange={(v) => updateConfig('titleCentered', v)}
      />
      <SettingsPicker<StackHeaderTitleHorizontalGravityAndroid>
        label="collapsedTitleHorizontalGravity"
        value={config.collapsedTitleHorizontalGravity}
        onValueChange={(v) => updateConfig('collapsedTitleHorizontalGravity', v)}
        items={HORIZONTAL_GRAVITY_OPTIONS}
      />
      <SettingsPicker<StackHeaderCollapsedTitleGravityModeAndroid>
        label="collapsedTitleGravityMode"
        value={config.collapsedTitleGravityMode}
        onValueChange={(v) => updateConfig('collapsedTitleGravityMode', v)}
        items={GRAVITY_MODES}
      />
      <SettingsSwitch
        label="backButtonHidden"
        value={config.backButtonHidden}
        onValueChange={(v) => updateConfig('backButtonHidden', v)}
      />
      <SettingsPicker<MenuItemsValue>
        label="menuItems"
        value={config.menuItems}
        onValueChange={(v) => updateConfig('menuItems', v)}
        items={MENU_ITEMS_VALUES}
      />

      <Heading label="Probe subviews" />
      <Note
        text={`Fixed-width rulers (${RULER_PROBE_WIDTH}dp / ${WIDE_PROBE_WIDTH}dp). The trailing gap is the end inset. On small the title is laid out first, so the title marks the start inset and the leading probe follows it.`}
      />
      <SettingsPicker<ProbeSize>
        label="leadingSubview"
        value={config.leadingSubview}
        onValueChange={(v) => updateConfig('leadingSubview', v)}
        items={PROBE_SIZES}
      />
      <SettingsPicker<CenterProbeSize>
        label="centerSubview"
        value={config.centerSubview}
        onValueChange={(v) => updateConfig('centerSubview', v)}
        items={CENTER_PROBE_SIZES}
      />
      <SettingsPicker<ProbeSize>
        label="trailingSubview"
        value={config.trailingSubview}
        onValueChange={(v) => updateConfig('trailingSubview', v)}
        items={PROBE_SIZES}
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

function ConfigScreen({ pushTitle }: { pushTitle: string }) {
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
          <SettingsButton label={pushTitle} onTap={() => push('Pushed')} />
          <LongText paragraphs={20} />
        </view>
      </scroll-view>
    </ScrollViewMarker>
  );
}

function RootScreen() {
  return <ConfigScreen pushTitle="Push screen (adds a back button)" />;
}

function PushedScreen() {
  return <ConfigScreen pushTitle="Push another" />;
}

export default function App() {
  const [config, setConfig] = useState<Config>(DEFAULT_CONFIG);

  const updateConfig = useCallback(
    <K extends keyof Config>(key: K, value: Config[K]) => {
      setConfig((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const contextValue = useMemo(
    () => ({ config, updateConfig, setConfig }),
    [config, updateConfig],
  );

  // The header config is also part of the route options so a pushed screen
  // mounts its header in the same commit as the screen - the setRouteOptions
  // effect lands in a later native update than the push on Lynx, making the
  // header appear only after the transition. The effect takes over for
  // runtime updates.
  const routeConfigs = useMemo<StackRouteConfig[]>(() => {
    const headerConfig = buildHeaderConfig(config);
    return [
      { name: 'Root', Component: RootScreen, options: { headerConfig } },
      { name: 'Pushed', Component: PushedScreen, options: { headerConfig } },
    ];
  }, [config]);

  return (
    <ConfigContext.Provider value={contextValue}>
      <StackContainer routeConfigs={routeConfigs} />
    </ConfigContext.Provider>
  );
}
