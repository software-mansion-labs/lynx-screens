import { useCallback, useEffect, useMemo, useState } from '@lynx-js/react';
import type { CSSProperties } from '@lynx-js/types';
import type { StackHeaderConfigProps, StackHeaderTypeAndroid } from 'lynx-screens';
import { ScrollViewMarker } from 'lynx-screens';
import {
  Heading,
  LongText,
  SettingsButton,
  SettingsPicker,
} from '../components/SettingsControls';
import { StackContainer } from '../components/StackContainer';
import { useStackNavigationContext } from '../hooks/useStackNavigationContext';
import type { StackRouteConfig } from '../types/StackContainer';

// Port of RNS single-feature-tests/stack-v5/test-stack-header-title-appearance-android.
// Adaptations: the PlatformColor option/preset is dropped (RN-only API; Lynx
// colors are CSS strings), font weights are CSS strings (Lynx typing has no
// numeric weights) and the RN Button row is a row of SettingsButtons.

// `same` resolves title and subtitle to one shared string so we can verify the
// small header keeps them apart by TextView identity, not by text.
const TITLE_TEXT = 'Title';
const SUBTITLE_TEXT = 'Subtitle';
const SAME_TEXT = 'Same';

// Each picker's options are the single source of truth; the option union type is
// derived from the array so the two can never drift apart.
const options = <const T extends string>(...values: T[]): T[] => values;

const TEXT_OPTIONS = options('undefined', 'short', 'same');
const COLOR_OPTIONS = options('default', 'red', 'blue');
const SIZE_OPTIONS = options('default', '12', '30');
const FAMILY_OPTIONS = options('default', 'serif', 'monospace');
const WEIGHT_OPTIONS = options('default', '400', '700', 'bold', '900');
const STYLE_OPTIONS = options('default', 'normal', 'italic');
const HEADER_TYPES: StackHeaderTypeAndroid[] = ['small', 'medium', 'large'];

type TextOption = (typeof TEXT_OPTIONS)[number];
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

type SlotKey =
  | 'title'
  | 'subtitle'
  | 'expandedTitle'
  | 'collapsedTitle'
  | 'expandedSubtitle'
  | 'collapsedSubtitle';

interface Config {
  type: StackHeaderTypeAndroid;
  title: TextOption;
  subtitle: TextOption;
  appearance: Record<SlotKey, SlotAppearance>;
}

const TITLE_SLOTS: SlotKey[] = ['title', 'expandedTitle', 'collapsedTitle'];
const SUBTITLE_SLOTS: SlotKey[] = [
  'subtitle',
  'expandedSubtitle',
  'collapsedSubtitle',
];

const DEFAULT_SLOT: SlotAppearance = {
  color: 'default',
  fontSize: 'default',
  fontFamily: 'default',
  fontWeight: 'default',
  fontStyle: 'default',
};

function makeDefaultAppearance(): Record<SlotKey, SlotAppearance> {
  return {
    title: { ...DEFAULT_SLOT },
    subtitle: { ...DEFAULT_SLOT },
    expandedTitle: { ...DEFAULT_SLOT },
    collapsedTitle: { ...DEFAULT_SLOT },
    expandedSubtitle: { ...DEFAULT_SLOT },
    collapsedSubtitle: { ...DEFAULT_SLOT },
  };
}

const DEFAULT_CONFIG: Config = {
  type: 'small',
  title: 'short',
  subtitle: 'short',
  appearance: makeDefaultAppearance(),
};

function resolveText(value: TextOption, short: string): string | undefined {
  switch (value) {
    case 'short':
      return short;
    case 'same':
      return SAME_TEXT;
    default:
      return undefined;
  }
}

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

function resolveStyle(
  value: StyleOption,
): Exclude<CSSProperties['fontStyle'], 'oblique'> {
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

function buildHeaderConfig(config: Config): StackHeaderConfigProps {
  const a = config.appearance;
  const title = resolveSlot(a.title);
  const subtitle = resolveSlot(a.subtitle);
  const expandedTitle = resolveSlot(a.expandedTitle);
  const collapsedTitle = resolveSlot(a.collapsedTitle);
  const expandedSubtitle = resolveSlot(a.expandedSubtitle);
  const collapsedSubtitle = resolveSlot(a.collapsedSubtitle);

  return {
    title: resolveText(config.title, TITLE_TEXT),
    subtitle: resolveText(config.subtitle, SUBTITLE_TEXT),
    android: {
      type: config.type,

      // Collapsing headers re-expand as soon as the user scrolls up, so the
      // tester can compare expanded/collapsed appearance from any scroll offset.
      scrollFlagEnterAlways: config.type === 'small' ? undefined : true,

      titleColor: title.color,
      titleFontSize: title.fontSize,
      titleFontFamily: title.fontFamily,
      titleFontWeight: title.fontWeight,
      titleFontStyle: title.fontStyle,

      subtitleColor: subtitle.color,
      subtitleFontSize: subtitle.fontSize,
      subtitleFontFamily: subtitle.fontFamily,
      subtitleFontWeight: subtitle.fontWeight,
      subtitleFontStyle: subtitle.fontStyle,

      expandedTitleColor: expandedTitle.color,
      expandedTitleFontSize: expandedTitle.fontSize,
      expandedTitleFontFamily: expandedTitle.fontFamily,
      expandedTitleFontWeight: expandedTitle.fontWeight,
      expandedTitleFontStyle: expandedTitle.fontStyle,

      collapsedTitleColor: collapsedTitle.color,
      collapsedTitleFontSize: collapsedTitle.fontSize,
      collapsedTitleFontFamily: collapsedTitle.fontFamily,
      collapsedTitleFontWeight: collapsedTitle.fontWeight,
      collapsedTitleFontStyle: collapsedTitle.fontStyle,

      expandedSubtitleColor: expandedSubtitle.color,
      expandedSubtitleFontSize: expandedSubtitle.fontSize,
      expandedSubtitleFontFamily: expandedSubtitle.fontFamily,
      expandedSubtitleFontWeight: expandedSubtitle.fontWeight,
      expandedSubtitleFontStyle: expandedSubtitle.fontStyle,

      collapsedSubtitleColor: collapsedSubtitle.color,
      collapsedSubtitleFontSize: collapsedSubtitle.fontSize,
      collapsedSubtitleFontFamily: collapsedSubtitle.fontFamily,
      collapsedSubtitleFontWeight: collapsedSubtitle.fontWeight,
      collapsedSubtitleFontStyle: collapsedSubtitle.fontStyle,
    },
  };
}

function setSlotsColor(
  appearance: Record<SlotKey, SlotAppearance>,
  slots: SlotKey[],
  color: ColorOption,
): Record<SlotKey, SlotAppearance> {
  const next = { ...appearance };
  for (const slot of slots) {
    next[slot] = { ...next[slot], color };
  }
  return next;
}

function withColors(
  titleColor: ColorOption,
  subtitleColor: ColorOption,
): Record<SlotKey, SlotAppearance> {
  return setSlotsColor(
    setSlotsColor(makeDefaultAppearance(), TITLE_SLOTS, titleColor),
    SUBTITLE_SLOTS,
    subtitleColor,
  );
}

const PRESETS: { label: string; apply: (prev: Config) => Config }[] = [
  {
    label: 'Reset appearance',
    apply: (prev) => ({ ...prev, appearance: makeDefaultAppearance() }),
  },
  {
    label: 'Differentiation',
    apply: (prev) => ({
      ...prev,
      title: 'same',
      subtitle: 'same',
      appearance: withColors('red', 'blue'),
    }),
  },
];

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

  const updateSlot = useCallback((slot: SlotKey, next: SlotAppearance) => {
    setConfig((prev) => ({
      ...prev,
      appearance: { ...prev.appearance, [slot]: next },
    }));
  }, []);

  const { setRouteOptions, routeKey } = navigation;
  const headerConfig = useMemo(() => buildHeaderConfig(config), [config]);

  useEffect(() => {
    setRouteOptions(routeKey, { headerConfig });
  }, [headerConfig, setRouteOptions, routeKey]);

  const isSmall = config.type === 'small';

  return (
    <ScrollViewMarker style={{ width: '100%', height: '100%' }}>
      <scroll-view
        scroll-y
        style={{ width: '100%', height: '100%', backgroundColor: 'white' }}
      >
        <view style={{ padding: '16px', gap: '6px' }}>
          <Heading label="Presets" />
          <view
            style={{
              display: 'flex',
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: '8px',
            }}
          >
            {PRESETS.map((preset) => (
              <view key={preset.label} style={{ flexGrow: 1 }}>
                <SettingsButton
                  label={preset.label}
                  onTap={() => setConfig((prev) => preset.apply(prev))}
                />
              </view>
            ))}
          </view>

          <Heading label="General" />
          <SettingsPicker<StackHeaderTypeAndroid>
            label="type"
            value={config.type}
            onValueChange={(v) => setConfig((prev) => ({ ...prev, type: v }))}
            items={HEADER_TYPES}
          />
          <SettingsPicker<TextOption>
            label="title"
            value={config.title}
            onValueChange={(v) => setConfig((prev) => ({ ...prev, title: v }))}
            items={TEXT_OPTIONS}
          />
          <SettingsPicker<TextOption>
            label="subtitle"
            value={config.subtitle}
            onValueChange={(v) =>
              setConfig((prev) => ({ ...prev, subtitle: v }))
            }
            items={TEXT_OPTIONS}
          />

          <Heading label="Appearance" />
          {isSmall ? (
            <>
              <AppearanceControls
                label="title"
                value={config.appearance.title}
                onChange={(next) => updateSlot('title', next)}
              />
              <AppearanceControls
                label="subtitle"
                value={config.appearance.subtitle}
                onChange={(next) => updateSlot('subtitle', next)}
              />
            </>
          ) : (
            <>
              <AppearanceControls
                label="expandedTitle"
                value={config.appearance.expandedTitle}
                onChange={(next) => updateSlot('expandedTitle', next)}
              />
              <AppearanceControls
                label="collapsedTitle"
                value={config.appearance.collapsedTitle}
                onChange={(next) => updateSlot('collapsedTitle', next)}
              />
              <AppearanceControls
                label="expandedSubtitle"
                value={config.appearance.expandedSubtitle}
                onChange={(next) => updateSlot('expandedSubtitle', next)}
              />
              <AppearanceControls
                label="collapsedSubtitle"
                value={config.appearance.collapsedSubtitle}
                onChange={(next) => updateSlot('collapsedSubtitle', next)}
              />
            </>
          )}

          <Heading label="ScrollView content" />
          <LongText paragraphs={20} />
        </view>
      </scroll-view>
    </ScrollViewMarker>
  );
}
