import { useCallback, useLayoutEffect, useMemo, useState } from '@lynx-js/react';
import type { StackHeaderConfigProps } from 'lynx-screens';
import { LongText, SettingsButton } from '../components/SettingsControls';
import { StackContainer } from '../components/StackContainer';
import { useStackNavigationContext } from '../hooks/useStackNavigationContext';

// Port of RNS single-feature-tests/stack-v5/test-stack-header-menu-ios.
// Adaptation: the RNS example reports onPress through a Toast; a
// "Last clicked" text is used instead (no toast component in this app).

const DEFAULT_TRAILING_ITEMS_COUNT = 2;

// Adaptation: RNS examples rely on UIKit's automatic scroll-view content
// inset (contentInsetAdjustmentBehavior="automatic") to start content below
// the navigation bar. Lynx's scroll-view hardcodes that behavior to "never",
// and RNS does not offset v5 screen content below the header natively (yet)
// on iOS - approximate the inset with a static padding instead.
const CONTENT_PADDING_TOP = SystemInfo.platform === 'iOS' ? '120px' : '16px';

export default function App(props: { onRender?: () => void }) {
  return (
    <StackContainer
      routeConfigs={[
        {
          name: 'Home',
          Component: ConfigScreen,
          options: {},
        },
      ]}
    />
  );
}

function PressableWithFeedback({
  width,
  height,
}: {
  width: number;
  height: number;
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
      bindtouchstart={() => setPressed(true)}
      bindtouchend={() => setPressed(false)}
      bindtouchcancel={() => setPressed(false)}
    />
  );
}

function buildHeaderConfig(
  trailingItemsCount: number,
  showClicked: (text: string) => void,
): StackHeaderConfigProps {
  const trailingItems: NonNullable<
    NonNullable<StackHeaderConfigProps['ios']>['trailingItems']
  > = Array.from({ length: trailingItemsCount }).map((_, i) => ({
    type: 'item',
    key: `trailing-${i}`,
    label: `Menu ${i}`,
    // every second item is custom
    ...(i % 2 === 0 && {
      render: () => <PressableWithFeedback width={30} height={30} />,
    }),
    menu: {
      type: 'menu',
      id: `menu-${i}`,
      children: [
        {
          id: `subitem-${i}-1`,
          type: 'menuItem',
          title: `Item ${i}.1`,
          onPress: () => showClicked(`Clicked Item ${i}.1`),
        },
        {
          id: `subitem-${i}-2`,
          type: 'menuItem',
          title: `Item ${i}.2`,
          onPress: () => showClicked(`Clicked Item ${i}.2`),
        },
        {
          id: `submenu-${i}`,
          type: 'menu',
          title: `Submenu ${i}`,
          children: [
            {
              id: `subsubitem-${i}-1`,
              type: 'menuItem',
              title: `Nested ${i}.1`,
              onPress: () => showClicked(`Clicked Nested ${i}.1`),
            },
            {
              id: `subsubitem-${i}-2`,
              type: 'menuItem',
              title: `Nested ${i}.2`,
              onPress: () => showClicked(`Clicked Nested ${i}.2`),
            },
          ],
        },
      ],
    },
  }));

  return {
    title: 'Header Menu',
    ios: {
      trailingItems,
    },
  };
}

function ConfigScreen() {
  const navigation = useStackNavigationContext();
  const [trailingItemsCount, setTrailingItemsCount] = useState<number>(
    DEFAULT_TRAILING_ITEMS_COUNT,
  );
  const [lastClicked, setLastClicked] = useState<string | null>(null);

  const showClicked = useCallback(
    (text: string) => setLastClicked(text),
    [],
  );

  const { setRouteOptions, routeKey } = navigation;
  const headerConfig = useMemo(
    () => buildHeaderConfig(trailingItemsCount, showClicked),
    [trailingItemsCount, showClicked],
  );

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
        <SettingsButton
          label={`Toggle trailing items count (${trailingItemsCount}/4)`}
          onTap={() => setTrailingItemsCount((count) => (count + 1) % 5)}
        />
        <text style={{ color: 'black', fontSize: '15px' }}>
          Last clicked: {lastClicked ?? '—'}
        </text>
        <LongText paragraphs={10} />
      </view>
    </scroll-view>
  );
}
