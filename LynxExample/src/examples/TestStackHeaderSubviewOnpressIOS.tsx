import { useCallback, useLayoutEffect, useMemo, useState } from '@lynx-js/react';
import type { StackHeaderConfigProps } from 'lynx-screens';
import { LongText, SettingsButton } from '../components/SettingsControls';
import { StackContainer } from '../components/StackContainer';
import { useStackNavigationContext } from '../hooks/useStackNavigationContext';

// Port of RNS single-feature-tests/stack-v5/test-stack-header-subview-onpress-ios.
// Adaptation: the RNS example reports events through a Toast; a "Last clicked"
// text is used instead (no toast component in this app).

const MAX_ITEMS = 5;

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

function buildHeaderConfig(
  itemsCount: number,
  showClicked: (text: string) => void,
): StackHeaderConfigProps {
  const trailingItems: NonNullable<
    NonNullable<StackHeaderConfigProps['ios']>['trailingItems']
  > = Array.from({ length: itemsCount }).map((_, i) => ({
    type: 'item',
    id: `item-${i}`,
    title: i % 2 == 0 ? `Item ${i}` : `Menu ${i}`,
    ...(i % 2 == 0 && { onPress: () => showClicked(`onPress Item ${i}`) }),
    menu: {
      type: 'menu',
      id: `menu-${i}`,
      children: [
        {
          id: `action-${i}-1`,
          type: 'menuItem',
          itemType: 'action',
          title: `Action ${i}-1`,
          onPress: () => showClicked(`Action ${i}-1`),
        },
        {
          id: `action-${i}-2`,
          type: 'menuItem',
          itemType: 'action',
          title: `Action ${i}-2`,
          onPress: () => showClicked(`Action ${i}-2`),
        },
      ],
    },
  }));

  return {
    title: 'Header onPress',
    ios: {
      trailingItems,
    },
  };
}

function ConfigScreen() {
  const navigation = useStackNavigationContext();
  const [itemsCount, setItemsCount] = useState(2);
  const [lastClicked, setLastClicked] = useState<string | null>(null);

  const showClicked = useCallback(
    (text: string) => setLastClicked(text),
    [],
  );

  const { setRouteOptions, routeKey } = navigation;
  const headerConfig = useMemo(
    () => buildHeaderConfig(itemsCount, showClicked),
    [itemsCount, showClicked],
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
          label={`Toggle items count (${itemsCount}/${MAX_ITEMS})`}
          onTap={() => setItemsCount((count) => (count + 1) % (MAX_ITEMS + 1))}
        />
        <text style={{ color: 'black', fontSize: '15px' }}>
          Last clicked: {lastClicked ?? '—'}
        </text>
        <LongText paragraphs={10} />
      </view>
    </scroll-view>
  );
}
