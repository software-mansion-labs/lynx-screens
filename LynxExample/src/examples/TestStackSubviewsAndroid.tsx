import { useCallback, useEffect, useMemo, useState } from '@lynx-js/react';
import type {
  StackHeaderConfigProps,
  StackHeaderTypeAndroid,
  StackHeaderTitleHorizontalGravityAndroid,
  StackHeaderTitleVerticalGravityAndroid,
  StackHeaderCollapsedTitleGravityModeAndroid,
  StackHeaderBackgroundSubviewCollapseModeAndroid,
  StackHeaderToolbarMenuElementAndroid,
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

const SHORT_TITLE = 'Hello';
const LONG_TITLE =
  'A Very Long Title That Should Ellipsize When There Is Not Enough Space Available';

const SHORT_SUBTITLE = 'Subtitle';
const LONG_SUBTITLE =
  'A Very Long Subtitle That Should Ellipsize When There Is Not Enough Space';

type SubviewSize = 'none' | 'sm' | 'md' | 'lg' | 'xl';
type TextOption = 'undefined' | 'short' | 'long';
type ScrollFlagValue = 'undefined' | 'true' | 'false';
type MaxLinesValue = '1' | '2' | '3';
type MenuItemsValue = '0' | '1' | '2';
type DpValue = 'default' | '0' | '8' | '16' | '32';

interface Config {
  enabled: boolean;
  type: StackHeaderTypeAndroid;
  transparent: boolean;
  hidden: boolean;
  title: TextOption;
  subtitle: TextOption;
  maxLines: MaxLinesValue;
  titleCentered: boolean;
  subtitleCentered: boolean;
  expandedTitleHorizontalGravity: StackHeaderTitleHorizontalGravityAndroid;
  expandedTitleVerticalGravity: StackHeaderTitleVerticalGravityAndroid;
  collapsedTitleHorizontalGravity: StackHeaderTitleHorizontalGravityAndroid;
  collapsedTitleVerticalGravity: StackHeaderTitleVerticalGravityAndroid;
  collapsedTitleGravityMode: StackHeaderCollapsedTitleGravityModeAndroid;
  contentInsetStart: DpValue;
  contentInsetEnd: DpValue;
  menuItems: MenuItemsValue;
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
  subtitle: 'short',
  maxLines: '1',
  titleCentered: false,
  subtitleCentered: false,
  expandedTitleHorizontalGravity: 'start',
  expandedTitleVerticalGravity: 'bottom',
  collapsedTitleHorizontalGravity: 'start',
  collapsedTitleVerticalGravity: 'center',
  collapsedTitleGravityMode: 'availableSpace',
  contentInsetStart: 'default',
  contentInsetEnd: 'default',
  menuItems: '0',
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

const SUBVIEW_SIZES: SubviewSize[] = ['none', 'sm', 'md', 'lg', 'xl'];
const HEADER_TYPES: StackHeaderTypeAndroid[] = ['small', 'medium', 'large'];
const COLLAPSE_MODES: StackHeaderBackgroundSubviewCollapseModeAndroid[] = [
  'off',
  'parallax',
];
const TEXT_OPTIONS: TextOption[] = ['undefined', 'short', 'long'];
const SCROLL_FLAG_VALUES: ScrollFlagValue[] = ['undefined', 'true', 'false'];
const MAX_LINES_OPTIONS: MaxLinesValue[] = ['1', '2', '3'];
const HORIZONTAL_GRAVITY_OPTIONS: StackHeaderTitleHorizontalGravityAndroid[] = [
  'start',
  'center',
  'end',
];
const VERTICAL_GRAVITY_OPTIONS: StackHeaderTitleVerticalGravityAndroid[] = [
  'top',
  'center',
  'bottom',
];
const GRAVITY_MODE_OPTIONS: StackHeaderCollapsedTitleGravityModeAndroid[] = [
  'availableSpace',
  'entireSpace',
];
const MENU_ITEMS_OPTIONS: MenuItemsValue[] = ['0', '1', '2'];
const DP_OPTIONS: DpValue[] = ['default', '0', '8', '16', '32'];

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

function resolveDp(value: DpValue): number | undefined {
  return value === 'default' ? undefined : Number(value);
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

function resolveText(
  value: TextOption,
  short: string,
  long: string,
): string | undefined {
  switch (value) {
    case 'short':
      return short;
    case 'long':
      return long;
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
    case 'xl':
      return { width: 250, height: 40 };
    default:
      return { width: 0, height: 0 };
  }
}

type PressedState = 'pressed-out' | 'pressed-in' | 'pressed';

// Port of RNS's shared PressableWithFeedback (purple when idle, blue while
// held down, yellow once a press registered), built on Lynx touch events -
// RN's Pressable and pressRetentionOffset have no Lynx counterpart.
function PressableWithFeedback({
  label,
  width,
  height,
}: {
  label: string;
  width: number;
  height: number;
}) {
  const [pressedState, setPressedState] = useState<PressedState>('pressed-out');

  const backgroundColor =
    pressedState === 'pressed-in'
      ? '#38acdd'
      : pressedState === 'pressed'
        ? '#ffd61e'
        : '#782aeb';

  return (
    <view
      style={{
        display: 'flex',
        width: `${width}px`,
        height: `${height}px`,
        backgroundColor,
        justifyContent: 'center',
        alignItems: 'center',
      }}
      bindtouchstart={() => setPressedState('pressed-in')}
      bindtouchcancel={() => setPressedState('pressed-out')}
      bindtouchend={() => setPressedState('pressed-out')}
      bindtap={() => {
        console.log(`[Example] Tapped subview ${label}`);
        setPressedState('pressed');
      }}
    >
      <text style={{ color: 'white', fontSize: '10px' }}>{label}</text>
    </view>
  );
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
      render: () => (
        <PressableWithFeedback
          label={label}
          width={dims.width}
          height={dims.height}
        />
      ),
    };
  };

  // The RNS example uses an image asset here; a gradient-ish colored view keeps
  // the example asset-free while still visualising parallax collapse.
  const backgroundSubview = config.backgroundEnabled
    ? {
        collapseMode: config.backgroundCollapseMode,
        render: () => (
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
    title: resolveText(config.title, SHORT_TITLE, LONG_TITLE),
    subtitle: resolveText(config.subtitle, SHORT_SUBTITLE, LONG_SUBTITLE),
    hidden: config.hidden,
    transparent: config.transparent,
    android: {
      type: config.type,
      backgroundSubview,
      leadingSubview: makeToolbarSubview(config.leadingSize, 'L'),
      centerSubview: makeToolbarSubview(config.centerSize, 'C'),
      trailingSubview: makeToolbarSubview(config.trailingSize, 'T'),
      titleCentered: config.titleCentered,
      subtitleCentered: config.subtitleCentered,
      expandedTitleHorizontalGravity: config.expandedTitleHorizontalGravity,
      expandedTitleVerticalGravity: config.expandedTitleVerticalGravity,
      collapsedTitleHorizontalGravity: config.collapsedTitleHorizontalGravity,
      collapsedTitleVerticalGravity: config.collapsedTitleVerticalGravity,
      collapsedTitleGravityMode: config.collapsedTitleGravityMode,
      maxLines: Number(config.maxLines),
      toolbarMenu:
        config.menuItems === '0'
          ? undefined
          : { children: buildMenuItems(config.menuItems) },
      contentInsetStart: resolveDp(config.contentInsetStart),
      contentInsetEnd: resolveDp(config.contentInsetEnd),
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
    // Initial header config so a pushed instance mounts its header in the
    // same commit as the screen - the setRouteOptions layout effect lands in
    // a later native update than the push on Lynx, making the header appear
    // only after the transition. The effect takes over for runtime updates.
    options: { headerConfig: buildHeaderConfig(DEFAULT_CONFIG) },
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
    <ScrollViewMarker style={{ width: '100%', height: '100%' }}>
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
          <SettingsPicker<TextOption>
            label="title"
            value={config.title}
            onValueChange={(v) => updateConfig('title', v)}
            items={TEXT_OPTIONS}
          />
          <SettingsPicker<TextOption>
            label="subtitle"
            value={config.subtitle}
            onValueChange={(v) => updateConfig('subtitle', v)}
            items={TEXT_OPTIONS}
          />

          <Heading label="Title Positioning" />
          {config.type === 'small' ? (
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
            </>
          ) : (
            <>
              <view style={{ display: 'flex', flexDirection: 'row' }}>
                <view style={{ flex: 1 }}>
                  <SettingsPicker<StackHeaderTitleHorizontalGravityAndroid>
                    label="expanded H"
                    value={config.expandedTitleHorizontalGravity}
                    onValueChange={(v) =>
                      updateConfig('expandedTitleHorizontalGravity', v)
                    }
                    items={HORIZONTAL_GRAVITY_OPTIONS}
                  />
                </view>
                <view style={{ flex: 1 }}>
                  <SettingsPicker<StackHeaderTitleVerticalGravityAndroid>
                    label="expanded V"
                    value={config.expandedTitleVerticalGravity}
                    onValueChange={(v) =>
                      updateConfig('expandedTitleVerticalGravity', v)
                    }
                    items={VERTICAL_GRAVITY_OPTIONS}
                  />
                </view>
              </view>
              <view style={{ display: 'flex', flexDirection: 'row' }}>
                <view style={{ flex: 1 }}>
                  <SettingsPicker<StackHeaderTitleHorizontalGravityAndroid>
                    label="collapsed H"
                    value={config.collapsedTitleHorizontalGravity}
                    onValueChange={(v) =>
                      updateConfig('collapsedTitleHorizontalGravity', v)
                    }
                    items={HORIZONTAL_GRAVITY_OPTIONS}
                  />
                </view>
                <view style={{ flex: 1 }}>
                  <SettingsPicker<StackHeaderTitleVerticalGravityAndroid>
                    label="collapsed V"
                    value={config.collapsedTitleVerticalGravity}
                    onValueChange={(v) =>
                      updateConfig('collapsedTitleVerticalGravity', v)
                    }
                    items={VERTICAL_GRAVITY_OPTIONS}
                  />
                </view>
              </view>
              <SettingsPicker<StackHeaderCollapsedTitleGravityModeAndroid>
                label="collapsedTitleGravityMode"
                value={config.collapsedTitleGravityMode}
                onValueChange={(v) =>
                  updateConfig('collapsedTitleGravityMode', v)
                }
                items={GRAVITY_MODE_OPTIONS}
              />
              <SettingsPicker<MaxLinesValue>
                label="maxLines"
                value={config.maxLines}
                onValueChange={(v) => updateConfig('maxLines', v)}
                items={MAX_LINES_OPTIONS}
              />
            </>
          )}

          <Heading label="Content Insets" />
          <view style={{ display: 'flex', flexDirection: 'row' }}>
            <view style={{ flex: 1 }}>
              <SettingsPicker<DpValue>
                label="inset start"
                value={config.contentInsetStart}
                onValueChange={(v) => updateConfig('contentInsetStart', v)}
                items={DP_OPTIONS}
              />
            </view>
            <view style={{ flex: 1 }}>
              <SettingsPicker<DpValue>
                label="inset end"
                value={config.contentInsetEnd}
                onValueChange={(v) => updateConfig('contentInsetEnd', v)}
                items={DP_OPTIONS}
              />
            </view>
          </view>
          <SettingsPicker<MenuItemsValue>
            label="menu items"
            value={config.menuItems}
            onValueChange={(v) => updateConfig('menuItems', v)}
            items={MENU_ITEMS_OPTIONS}
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
    </ScrollViewMarker>
  );
}
