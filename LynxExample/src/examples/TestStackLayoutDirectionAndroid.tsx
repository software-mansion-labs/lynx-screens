import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from '@lynx-js/react';
import type {
  StackHeaderConfigProps,
  StackHeaderTitleHorizontalGravityAndroid,
  StackHeaderToolbarMenuBaseAndroid,
  StackHeaderTypeAndroid,
  StackHostDirection,
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

// Port of RNS single-feature-tests/stack-v5/test-stack-layout-direction-android.
// Adaptation: there is no I18nManager on Lynx, so the "forceRTL" switch and
// readout are gone - the StackHost `direction` prop is the only direction
// control here.

// Probes are fixed-width boxes with their width printed on them: the edge a
// probe sits on is the whole point of this test, so they must be
// distinguishable from the title and from each other at a glance.
const PROBE_WIDTH = 48;
const PROBE_HEIGHT = 32;

const PUSH_LABEL = 'Push screen (adds a back button)';

// Each picker's options are the single source of truth; the option union type is
// derived from the array so the two can never drift apart.
const options = <const T extends string>(...values: T[]): T[] => values;

const DIRECTIONS: StackHostDirection[] = ['inherit', 'ltr', 'rtl'];
const MENU_OPTIONS = options('none', 'action + overflow');
// medium is the same Collapsing branch as large, differing only in type scale.
const HEADER_TYPES: StackHeaderTypeAndroid[] = ['small', 'large'];
const HORIZONTAL_GRAVITY_OPTIONS: StackHeaderTitleHorizontalGravityAndroid[] = [
  'start',
  'center',
  'end',
];

export type MenuOption = (typeof MENU_OPTIONS)[number];

interface Config {
  direction: StackHostDirection;
  type: StackHeaderTypeAndroid;
  centerSubview: boolean;
  titleCentered: boolean;
  subtitleCentered: boolean;
  expandedTitleHorizontalGravity: StackHeaderTitleHorizontalGravityAndroid;
  collapsedTitleHorizontalGravity: StackHeaderTitleHorizontalGravityAndroid;
  menu: MenuOption;
}

const DEFAULT_CONFIG: Config = {
  direction: 'inherit',
  type: 'small',
  centerSubview: false,
  titleCentered: false,
  subtitleCentered: false,
  expandedTitleHorizontalGravity: 'start',
  collapsedTitleHorizontalGravity: 'start',
  menu: 'none',
};

const CARD_BACKGROUND = '#ffffff';
const CARD_BORDER = '#c7c7cc';
const PROBE_BACKGROUND = '#d1c4e9';

const ConfigContext = createContext<{
  config: Config;
  updateConfig: <K extends keyof Config>(key: K, value: Config[K]) => void;
  setConfig: (config: Config) => void;
}>({
  config: DEFAULT_CONFIG,
  updateConfig: () => {},
  setConfig: () => {},
});

function makeProbe(label: string) {
  return {
    render: () => (
      <view
        style={{
          display: 'flex',
          width: `${PROBE_WIDTH}px`,
          height: `${PROBE_HEIGHT}px`,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: '1px',
          borderColor: CARD_BORDER,
          backgroundColor: PROBE_BACKGROUND,
        }}
      >
        <text style={{ fontSize: '12px', fontWeight: 'bold', color: 'black' }}>
          {`${label}·${PROBE_WIDTH}`}
        </text>
      </view>
    ),
  };
}

function buildMenu(
  option: MenuOption,
): StackHeaderToolbarMenuBaseAndroid | undefined {
  if (option === 'none') {
    return undefined;
  }

  return {
    children: [
      {
        type: 'menuItem',
        id: 'action-1',
        title: 'Act',
        showAsAction: 'always',
      },
      { type: 'menuItem', id: 'overflow-1', title: 'Overflow one' },
      { type: 'menuItem', id: 'overflow-2', title: 'Overflow two' },
    ],
  };
}

function buildHeaderConfig(config: Config): StackHeaderConfigProps {
  const isSmall = config.type === 'small';

  return {
    title: 'Direction',
    subtitle: 'Subtitle',
    android: {
      type: config.type,
      titleCentered: config.titleCentered,
      subtitleCentered: config.subtitleCentered,
      expandedTitleHorizontalGravity: config.expandedTitleHorizontalGravity,
      collapsedTitleHorizontalGravity: config.collapsedTitleHorizontalGravity,
      leadingSubview: makeProbe('L'),
      // Center subviews are supported only by the small header.
      centerSubview:
        isSmall && config.centerSubview ? makeProbe('C') : undefined,
      trailingSubview: makeProbe('T'),
      toolbarMenu: buildMenu(config.menu),
      // Keeps the collapsed state of the large header reachable from any offset.
      scrollFlagEnterAlways: isSmall ? undefined : true,
    },
  };
}

export default function TestStackLayoutDirectionAndroid() {
  const [config, setConfig] = useState<Config>(DEFAULT_CONFIG);

  const updateConfig = useCallback(
    <K extends keyof Config>(key: K, value: Config[K]) => {
      setConfig((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  return (
    <ConfigContext.Provider value={{ config, updateConfig, setConfig }}>
      <StackContainer
        direction={config.direction}
        routeConfigs={[
          { name: 'Root', Component: ConfigScreen },
          { name: 'Pushed', Component: ConfigScreen },
        ]}
      />
    </ConfigContext.Provider>
  );
}

function ConfigControls() {
  const { config, updateConfig, setConfig } = useContext(ConfigContext);
  const isSmall = config.type === 'small';

  return (
    <>
      <Heading label="StackHost" />
      <SettingsPicker<StackHostDirection>
        label="direction"
        value={config.direction}
        onValueChange={(v) => updateConfig('direction', v)}
        items={DIRECTIONS}
      />

      <Heading label="Header" />
      <SettingsPicker<StackHeaderTypeAndroid>
        label="type"
        value={config.type}
        onValueChange={(v) => updateConfig('type', v)}
        items={HEADER_TYPES}
      />
      <SettingsPicker<MenuOption>
        label="menu"
        value={config.menu}
        onValueChange={(v) => updateConfig('menu', v)}
        items={MENU_OPTIONS}
      />
      {isSmall ? (
        <>
          <SettingsSwitch
            label="titleCentered"
            value={config.titleCentered}
            onValueChange={(v) => updateConfig('titleCentered', v)}
          />
          <SettingsSwitch
            label="subtitleCentered"
            value={config.subtitleCentered}
            onValueChange={(v) => updateConfig('subtitleCentered', v)}
          />
          <SettingsSwitch
            label="centerSubview"
            value={config.centerSubview}
            onValueChange={(v) => updateConfig('centerSubview', v)}
          />
        </>
      ) : (
        <>
          <SettingsPicker<StackHeaderTitleHorizontalGravityAndroid>
            label="expandedTitleHorizontalGravity"
            value={config.expandedTitleHorizontalGravity}
            onValueChange={(v) =>
              updateConfig('expandedTitleHorizontalGravity', v)
            }
            items={HORIZONTAL_GRAVITY_OPTIONS}
          />
          <SettingsPicker<StackHeaderTitleHorizontalGravityAndroid>
            label="collapsedTitleHorizontalGravity"
            value={config.collapsedTitleHorizontalGravity}
            onValueChange={(v) =>
              updateConfig('collapsedTitleHorizontalGravity', v)
            }
            items={HORIZONTAL_GRAVITY_OPTIONS}
          />
        </>
      )}
      <SettingsButton label="Reset" onTap={() => setConfig(DEFAULT_CONFIG)} />
    </>
  );
}

// Makes the screen content's own direction readable without measuring the
// header. Adaptation: the row is laid out by Lynx, which the host's native
// `direction` does not reach, so START stays on the left - only the native
// header (probes, title, menu, back button) and the transitions flip.
function ContentDirectionMarker() {
  return (
    <view
      style={{
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderWidth: '1px',
        borderColor: CARD_BORDER,
        padding: '8px',
      }}
    >
      <text style={{ fontWeight: 'bold', color: 'black' }}>START</text>
      <text style={{ fontWeight: 'bold', color: 'black' }}>END</text>
    </view>
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

function ConfigScreen() {
  const { push } = useStackNavigationContext();
  useApplyHeaderConfig();

  return (
    <ScrollViewMarker style={{ width: '100%', height: '100%' }}>
      <scroll-view
        scroll-y
        style={{ width: '100%', height: '100%', backgroundColor: CARD_BACKGROUND }}
      >
        <view style={{ padding: '16px', gap: '6px' }}>
          <ContentDirectionMarker />
          <ConfigControls />
          <Heading label="Navigation" />
          <SettingsButton label={PUSH_LABEL} onTap={() => push('Pushed')} />
          <LongText paragraphs={12} />
          <text style={{ color: 'black' }}>End of content</text>
        </view>
      </scroll-view>
    </ScrollViewMarker>
  );
}
