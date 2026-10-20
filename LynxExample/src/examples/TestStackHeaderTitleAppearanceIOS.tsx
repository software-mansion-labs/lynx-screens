import { useCallback, useEffect, useMemo, useState } from '@lynx-js/react';
import type { CSSProperties } from '@lynx-js/types';
import type {
  StackHeaderAppearanceIOS,
  StackHeaderConfigProps,
} from 'lynx-screens';
import {
  Heading,
  SettingsButton,
  SettingsPicker,
  SettingsSwitch,
} from '../components/SettingsControls';
import { StackContainer } from '../components/StackContainer';
import { useStackNavigationContext } from '../hooks/useStackNavigationContext';
import type { StackRouteConfig } from '../types/StackContainer';

// Port of RNS single-feature-tests/stack-v5/test-stack-header-title-appearance-ios.
// Adaptations: the PlatformColor option is dropped (RN-only API; Lynx colors
// are CSS strings), font weights are CSS strings (Lynx typing has no numeric
// weights) and the RN Button / Switch are a SettingsButton / SettingsSwitch.

const TITLE_TEXT = 'Title';
const SUBTITLE_TEXT = 'Subtitle';
const LARGE_TITLE_TEXT = 'Large Title';
const LARGE_SUBTITLE_TEXT = 'Large Subtitle';

// Each picker's options are the single source of truth; the option union type is
// derived from the array so the two can never drift apart.
const options = <const T extends string>(...values: T[]): T[] => values;

const COLOR_OPTIONS = options('default', 'red', 'blue');
const SIZE_OPTIONS = options('default', '12', '30');
const FAMILY_OPTIONS = options('default', 'Courier New', 'Times New Roman');
const WEIGHT_OPTIONS = options('default', '400', '700', 'bold', '900');
const STYLE_OPTIONS = options('default', 'normal', 'italic');

type ColorOption = (typeof COLOR_OPTIONS)[number];
type SizeOption = (typeof SIZE_OPTIONS)[number];
type FamilyOption = (typeof FAMILY_OPTIONS)[number];
type WeightOption = (typeof WEIGHT_OPTIONS)[number];
type StyleOption = (typeof STYLE_OPTIONS)[number];

interface SlotAppearance {
  color: ColorOption;
  fontSize: SizeOption;
  fontFamily: FamilyOption;
  fontWeight: WeightOption;
  fontStyle: StyleOption;
}

// Subtitle appearance covers both regular and large subtitle — UIKit
// derives the large subtitle appearance from subtitleTextAttributes.
type SlotKey = 'title' | 'largeTitle' | 'subtitle';

// One per appearance object — standard and scroll edge are configured
// completely independently. When `enabled` is false, the corresponding
// appearance prop is not passed at all.
interface AppearanceConfig {
  enabled: boolean;
  slots: Record<SlotKey, SlotAppearance>;
}

type AppearanceKey = 'standard' | 'scrollEdge';

interface Config {
  largeTitleEnabled: boolean;
  standard: AppearanceConfig;
  scrollEdge: AppearanceConfig;
}

const SLOTS: SlotKey[] = ['title', 'largeTitle', 'subtitle'];

const DEFAULT_SLOT: SlotAppearance = {
  color: 'default',
  fontSize: 'default',
  fontFamily: 'default',
  fontWeight: 'default',
  fontStyle: 'default',
};

function makeDefaultSlots(): Record<SlotKey, SlotAppearance> {
  return {
    title: { ...DEFAULT_SLOT },
    largeTitle: { ...DEFAULT_SLOT },
    subtitle: { ...DEFAULT_SLOT },
  };
}

function makeDefaultAppearanceConfig(): AppearanceConfig {
  return { enabled: false, slots: makeDefaultSlots() };
}

const DEFAULT_CONFIG: Config = {
  largeTitleEnabled: false,
  standard: makeDefaultAppearanceConfig(),
  scrollEdge: makeDefaultAppearanceConfig(),
};

function resolveColor(value: ColorOption): string | undefined {
  switch (value) {
    case 'red':
      return 'red';
    case 'blue':
      return 'blue';
    default:
      return undefined;
  }
}

function resolveSize(value: SizeOption): number | undefined {
  return value === 'default' ? undefined : Number(value);
}

function resolveFamily(value: FamilyOption): string | undefined {
  return value === 'default' ? undefined : value;
}

function resolveWeight(value: WeightOption): CSSProperties['fontWeight'] {
  return value === 'default' ? undefined : value;
}

function resolveStyle(value: StyleOption): CSSProperties['fontStyle'] {
  return value === 'default' ? undefined : value;
}

function resolveSlot(slot: SlotAppearance) {
  return {
    color: resolveColor(slot.color),
    fontSize: resolveSize(slot.fontSize),
    fontFamily: resolveFamily(slot.fontFamily),
    fontWeight: resolveWeight(slot.fontWeight),
    fontStyle: resolveStyle(slot.fontStyle),
  };
}

function buildAppearance(
  appearanceConfig: AppearanceConfig,
): StackHeaderAppearanceIOS | undefined {
  if (!appearanceConfig.enabled) {
    return undefined;
  }

  const title = resolveSlot(appearanceConfig.slots.title);
  const largeTitle = resolveSlot(appearanceConfig.slots.largeTitle);
  const subtitle = resolveSlot(appearanceConfig.slots.subtitle);

  return {
    titleFontColor: title.color,
    titleFontSize: title.fontSize,
    titleFontFamily: title.fontFamily,
    titleFontWeight: title.fontWeight,
    titleFontStyle: title.fontStyle,

    largeTitleFontColor: largeTitle.color,
    largeTitleFontSize: largeTitle.fontSize,
    largeTitleFontFamily: largeTitle.fontFamily,
    largeTitleFontWeight: largeTitle.fontWeight,
    largeTitleFontStyle: largeTitle.fontStyle,

    subtitleFontColor: subtitle.color,
    subtitleFontSize: subtitle.fontSize,
    subtitleFontFamily: subtitle.fontFamily,
    subtitleFontWeight: subtitle.fontWeight,
    subtitleFontStyle: subtitle.fontStyle,
  };
}

function buildHeaderConfig(config: Config): StackHeaderConfigProps {
  return {
    title: TITLE_TEXT,
    subtitle: SUBTITLE_TEXT,
    ios: {
      largeTitle: LARGE_TITLE_TEXT,
      largeSubtitle: LARGE_SUBTITLE_TEXT,
      largeTitleEnabled: config.largeTitleEnabled,
      standardAppearance: buildAppearance(config.standard),
      scrollEdgeAppearance: buildAppearance(config.scrollEdge),
    },
  };
}

function AppearanceControls({
  label,
  value,
  onChange,
}: {
  label: string;
  value: SlotAppearance;
  onChange: (next: SlotAppearance) => void;
}) {
  return (
    <>
      <text
        style={{
          color: 'black',
          fontSize: '15px',
          fontWeight: 'bold',
          marginTop: '8px',
        }}
      >
        {label}
      </text>
      <SettingsPicker<ColorOption>
        label={`${label} color`}
        value={value.color}
        onValueChange={(v) => onChange({ ...value, color: v })}
        items={COLOR_OPTIONS}
      />
      <SettingsPicker<SizeOption>
        label={`${label} fontSize`}
        value={value.fontSize}
        onValueChange={(v) => onChange({ ...value, fontSize: v })}
        items={SIZE_OPTIONS}
      />
      <SettingsPicker<FamilyOption>
        label={`${label} fontFamily`}
        value={value.fontFamily}
        onValueChange={(v) => onChange({ ...value, fontFamily: v })}
        items={FAMILY_OPTIONS}
      />
      <SettingsPicker<WeightOption>
        label={`${label} fontWeight`}
        value={value.fontWeight}
        onValueChange={(v) => onChange({ ...value, fontWeight: v })}
        items={WEIGHT_OPTIONS}
      />
      <SettingsPicker<StyleOption>
        label={`${label} fontStyle`}
        value={value.fontStyle}
        onValueChange={(v) => onChange({ ...value, fontStyle: v })}
        items={STYLE_OPTIONS}
      />
    </>
  );
}

function AppearanceSection({
  label,
  value,
  onChange,
}: {
  label: string;
  value: AppearanceConfig;
  onChange: (next: AppearanceConfig) => void;
}) {
  return (
    <>
      <SettingsSwitch
        label={label}
        value={value.enabled}
        onValueChange={(enabled) => onChange({ ...value, enabled })}
      />
      {value.enabled &&
        SLOTS.map((slot) => (
          <AppearanceControls
            key={slot}
            label={slot}
            value={value.slots[slot]}
            onChange={(next) =>
              onChange({ ...value, slots: { ...value.slots, [slot]: next } })
            }
          />
        ))}
    </>
  );
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
  return <StackContainer routeConfigs={ROUTE_CONFIGS} />;
}

function ConfigScreen() {
  const navigation = useStackNavigationContext();
  const [config, setConfig] = useState<Config>(DEFAULT_CONFIG);

  const updateAppearance = useCallback(
    (appearance: AppearanceKey, next: AppearanceConfig) => {
      setConfig((prev) => ({ ...prev, [appearance]: next }));
    },
    [],
  );

  const { setRouteOptions, routeKey } = navigation;
  const headerConfig = useMemo(() => buildHeaderConfig(config), [config]);

  useEffect(() => {
    setRouteOptions(routeKey, { headerConfig });
  }, [headerConfig, setRouteOptions, routeKey]);

  return (
    <scroll-view
      scroll-y
      style={{ width: '100%', height: '100%', backgroundColor: 'white' }}
    >
      <view style={{ padding: '16px', paddingBottom: '400px', gap: '6px' }}>
        <Heading label="Appearance" />
        <SettingsButton
          label="Reset appearance"
          onTap={() =>
            setConfig((prev) => ({
              ...prev,
              standard: makeDefaultAppearanceConfig(),
              scrollEdge: makeDefaultAppearanceConfig(),
            }))
          }
        />

        <SettingsSwitch
          label="largeTitleEnabled"
          value={config.largeTitleEnabled}
          onValueChange={(v) =>
            setConfig((prev) => ({ ...prev, largeTitleEnabled: v }))
          }
        />

        <AppearanceSection
          label="standardAppearance"
          value={config.standard}
          onChange={(next) => updateAppearance('standard', next)}
        />
        <AppearanceSection
          label="scrollEdgeAppearance"
          value={config.scrollEdge}
          onChange={(next) => updateAppearance('scrollEdge', next)}
        />
      </view>
    </scroll-view>
  );
}
