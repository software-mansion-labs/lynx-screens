import { useLayoutEffect, useMemo, useState } from '@lynx-js/react';
import type { StackHeaderConfigProps } from 'lynx-screens';
import {
  Heading,
  LongText,
  SettingsButton,
  SettingsPicker,
  SettingsSwitch,
} from '../components/SettingsControls';
import { StackContainer } from '../components/StackContainer';
import { useStackNavigationContext } from '../hooks/useStackNavigationContext';

// Port of RNS single-feature-tests/stack-v5/test-stack-subviews-ios.
// Adaptations: hitSlop maps to Lynx's `hit-slop` attribute;
// pressRetentionOffset is dropped (RN Pressable-specific; no Lynx
// counterpart), PressableWithFeedback is replaced with a touch-feedback view
// built on Lynx touch events. RNS's key-based remount hack is not needed -
// the `hit-slop` prop updates at runtime on Lynx.

const SHORT_TITLE = 'Title';
const LONG_TITLE = 'A quick brown fox jumped over the lazy dog';

const TITLE_OPTIONS = ['short', 'long', 'view'] as const;
const LARGE_TITLE_OPTIONS = ['none', 'short', 'long'] as const;
const LARGE_SUBTITLE_OPTIONS = ['none', 'short', 'long', 'view'] as const;
const HIT_SLOP_VALUES = ['0', '10', '30'] as const;

type TitleOption = (typeof TITLE_OPTIONS)[number];
type LargeTitleOption = (typeof LARGE_TITLE_OPTIONS)[number];
type LargeSubtitleOption = (typeof LARGE_SUBTITLE_OPTIONS)[number];
type HitSlopValue = (typeof HIT_SLOP_VALUES)[number];

function PressableWithFeedback({
  onTap,
  width,
  height,
  hitSlop,
}: {
  onTap?: (() => void) | undefined;
  width: number;
  height: number;
  hitSlop?: HitSlopValue | undefined;
}) {
  const [pressed, setPressed] = useState(false);

  return (
    <view
      style={{
        width: `${width}px`,
        height: `${height}px`,
        backgroundColor: pressed ? '#7986cb' : '#3f51b5',
        borderRadius: '4px',
      }}
      hit-slop={`${hitSlop ?? '0'}px`}
      bindtouchstart={() => setPressed(true)}
      bindtouchend={() => setPressed(false)}
      bindtouchcancel={() => setPressed(false)}
      bindtap={() => onTap?.()}
    />
  );
}

function ResizingItem({ hitSlop }: { hitSlop: HitSlopValue }) {
  const [large, setLarge] = useState(false);

  return (
    <PressableWithFeedback
      onTap={() => setLarge((lg) => !lg)}
      hitSlop={hitSlop}
      width={large ? 60 : 20}
      height={large ? 30 : 20}
    />
  );
}

function LargeHorizontalItem() {
  return <PressableWithFeedback width={100} height={20} />;
}

function SmallHorizontalItem() {
  return <PressableWithFeedback width={80} height={10} />;
}

interface Config {
  enabled: boolean;
  hidden: boolean;
  largeTitleEnabled: boolean;
  largeTitle: LargeTitleOption;
  largeSubtitle: LargeSubtitleOption;
  leadingItemsCount: number;
  trailingItemsCount: number;
  title: TitleOption;
  subtitle: TitleOption;
  hitSlop: HitSlopValue;
}

function resolveTitle(
  value: TitleOption | LargeTitleOption | LargeSubtitleOption,
) {
  switch (value) {
    case 'short':
      return SHORT_TITLE;
    case 'long':
      return LONG_TITLE;
    default:
      return undefined;
  }
}

// Adaptation: RNS examples rely on UIKit's automatic scroll-view content
// inset (contentInsetAdjustmentBehavior="automatic") to start content below
// the navigation bar. Lynx's scroll-view hardcodes that behavior to "never",
// and RNS does not offset v5 screen content below the header natively (yet)
// on iOS - approximate the inset with a static padding instead.
const CONTENT_PADDING_TOP = SystemInfo.platform === 'iOS' ? '120px' : '16px';

const DEFAULT_CONFIG: Config = {
  enabled: true,
  hidden: false,
  largeTitleEnabled: false,
  largeTitle: 'none',
  largeSubtitle: 'none',
  leadingItemsCount: 2,
  trailingItemsCount: 2,
  title: 'short',
  subtitle: 'short',
  hitSlop: '0',
};

function buildHeaderConfig(config: Config): StackHeaderConfigProps | undefined {
  if (!config.enabled) {
    return undefined;
  }

  const leadingItems: NonNullable<
    NonNullable<StackHeaderConfigProps['ios']>['leadingItems']
  > = Array.from({
    length: config.leadingItemsCount,
  }).map((_, i) => ({
    type: 'item',
    id: `leading-${i}`,
    render: () => <ResizingItem hitSlop={config.hitSlop} />,
  }));
  if (leadingItems.length > 1) {
    leadingItems.splice(1, 0, {
      type: 'spacer',
      id: 'spacer-leading-1',
      sizing: 'fixed',
      width: 100,
    });
  }

  const trailingItems: NonNullable<
    NonNullable<StackHeaderConfigProps['ios']>['trailingItems']
  > = Array.from({ length: config.trailingItemsCount }).map((_, i) => ({
    type: 'item',
    id: `trailing-${i}`,
    render: () => <ResizingItem hitSlop={config.hitSlop} />,
  }));
  if (trailingItems.length > 1) {
    trailingItems.splice(1, 0, {
      type: 'spacer',
      id: 'spacer-trailing-1',
      sizing: 'fixed',
      width: 100,
    });
  }

  return {
    title: resolveTitle(config.title),
    subtitle: resolveTitle(config.subtitle),
    hidden: config.hidden,
    ios: {
      largeTitleEnabled: config.largeTitleEnabled,
      largeTitle: resolveTitle(config.largeTitle),
      largeSubtitle: resolveTitle(config.largeSubtitle),
      titleItem:
        config.title === 'view'
          ? {
              id: 'title',
              render: () => <LargeHorizontalItem />,
            }
          : undefined,
      subtitleItem:
        config.subtitle === 'view'
          ? {
              id: 'subtitle',
              render: () => <SmallHorizontalItem />,
            }
          : undefined,
      largeSubtitleItem:
        config.largeSubtitle === 'view'
          ? {
              id: 'largeSubtitle',
              render: () => <LargeHorizontalItem />,
            }
          : undefined,
      leadingItems,
      trailingItems,
    },
  };
}

export default function App(props: { onRender?: () => void }) {
  return (
    <StackContainer
      routeConfigs={[
        {
          name: 'Home',
          Component: ConfigScreen,
        },
        {
          name: 'Second',
          Component: ConfigScreen,
        },
      ]}
    />
  );
}

function ConfigScreen() {
  const navigation = useStackNavigationContext();
  const [config, setConfig] = useState<Config>(DEFAULT_CONFIG);

  const updateConfig = <K extends keyof Config>(key: K, value: Config[K]) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const { setRouteOptions, routeKey } = navigation;
  const headerConfig = useMemo(() => buildHeaderConfig(config), [config]);

  useLayoutEffect(() => {
    setRouteOptions(routeKey, {
      headerConfig,
    });
  }, [headerConfig, setRouteOptions, routeKey]);

  return (
    <scroll-view
      scroll-y
      style={{ width: '100%', height: '100%', backgroundColor: 'white' }}
    >
      <view
        style={{
          padding: '16px',
          paddingTop: CONTENT_PADDING_TOP,
          paddingBottom: '50px',
          gap: '6px',
        }}
      >
        <Heading label="Header config" />
        <SettingsSwitch
          label="headerConfig enabled"
          value={config.enabled}
          onValueChange={(v) => updateConfig('enabled', v)}
        />
        <SettingsSwitch
          label="hidden"
          value={config.hidden}
          onValueChange={(v) => updateConfig('hidden', v)}
        />
        <SettingsSwitch
          label="large header enabled"
          value={config.largeTitleEnabled}
          onValueChange={(v) => updateConfig('largeTitleEnabled', v)}
        />
        <SettingsPicker<TitleOption>
          label="title"
          value={config.title}
          items={[...TITLE_OPTIONS]}
          onValueChange={(v) => updateConfig('title', v)}
        />
        <SettingsPicker<TitleOption>
          label="subtitle"
          value={config.subtitle}
          items={[...TITLE_OPTIONS]}
          onValueChange={(v) => updateConfig('subtitle', v)}
        />
        <SettingsPicker<LargeTitleOption>
          label="large title"
          value={config.largeTitle}
          items={[...LARGE_TITLE_OPTIONS]}
          onValueChange={(v) => updateConfig('largeTitle', v)}
        />
        <SettingsPicker<LargeSubtitleOption>
          label="large subtitle"
          value={config.largeSubtitle}
          items={[...LARGE_SUBTITLE_OPTIONS]}
          onValueChange={(v) => updateConfig('largeSubtitle', v)}
        />
        <SettingsPicker<HitSlopValue>
          label="hit slop"
          value={config.hitSlop}
          items={[...HIT_SLOP_VALUES]}
          onValueChange={(v) => updateConfig('hitSlop', v)}
        />
        <SettingsButton
          label={`Toggle leading items count (${config.leadingItemsCount}/3)`}
          onTap={() =>
            updateConfig('leadingItemsCount', (config.leadingItemsCount + 1) % 4)
          }
        />
        <SettingsButton
          label={`Toggle trailing items count (${config.trailingItemsCount}/3)`}
          onTap={() =>
            updateConfig(
              'trailingItemsCount',
              (config.trailingItemsCount + 1) % 4,
            )
          }
        />
        {routeKey.includes('Home') && (
          <SettingsButton
            label="Go to Second"
            onTap={() => navigation.push('Second')}
          />
        )}
        <LongText paragraphs={10} />
      </view>
    </scroll-view>
  );
}
