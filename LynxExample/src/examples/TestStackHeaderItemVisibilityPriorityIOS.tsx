import { useLayoutEffect, useMemo, useState } from '@lynx-js/react';
import type {
  StackHeaderConfigProps,
  StackHeaderItemVisibilityPriorityIOS,
} from 'lynx-screens';
import { SettingsButton } from '../components/SettingsControls';
import { StackContainer } from '../components/StackContainer';
import { useStackNavigationContext } from '../hooks/useStackNavigationContext';

// Port of RNS single-feature-tests/stack-v5/test-stack-header-item-visibility-priority-ios.
// Requires iOS 27+ (visibilityPriority is a no-op below).

const PRIORITIES: StackHeaderItemVisibilityPriorityIOS[] = [
  'standard',
  'high',
  'low',
];

// Adaptation: RNS examples rely on UIKit's automatic scroll-view content
// inset (contentInsetAdjustmentBehavior="automatic") to start content below
// the navigation bar. Lynx's scroll-view hardcodes that behavior to "never",
// and RNS does not offset v5 screen content below the header natively (yet)
// on iOS - approximate the inset with a static padding instead.
const CONTENT_PADDING_TOP = SystemInfo.platform === 'iOS' ? '120px' : '16px';

function SquareItem() {
  const [large, setLarge] = useState(false);

  return (
    <view
      bindtap={() => setLarge((value) => !value)}
      style={{
        width: large ? '300px' : '30px',
        height: '30px',
        backgroundColor: '#3f51b5',
      }}
    />
  );
}

function buildHeaderConfig(
  squareVisibilityPriority: StackHeaderItemVisibilityPriorityIOS,
  videoVisibilityPriority: StackHeaderItemVisibilityPriorityIOS,
  searchVisibilityPriority: StackHeaderItemVisibilityPriorityIOS,
): StackHeaderConfigProps {
  return {
    title: 'Visibility priority',
    ios: {
      trailingItems: [
        {
          type: 'item',
          id: 'square',
          visibilityPriority: squareVisibilityPriority,
          render: () => <SquareItem />,
        },
        {
          type: 'item',
          id: 'video',
          title: 'Video',
          icon: { type: 'sfSymbol', name: 'video' },
          visibilityPriority: videoVisibilityPriority,
        },
        {
          type: 'item',
          id: 'search',
          title: 'Search',
          icon: { type: 'sfSymbol', name: 'magnifyingglass' },
          visibilityPriority: searchVisibilityPriority,
        },
      ],
    },
  };
}

function PriorityScreen() {
  const { setRouteOptions, routeKey } = useStackNavigationContext();
  const [squarePriorityIndex, setSquarePriorityIndex] = useState(0);
  const [videoPriorityIndex, setVideoPriorityIndex] = useState(0);
  const [searchPriorityIndex, setSearchPriorityIndex] = useState(0);
  const squarePriority = PRIORITIES[squarePriorityIndex]!;
  const videoPriority = PRIORITIES[videoPriorityIndex]!;
  const searchPriority = PRIORITIES[searchPriorityIndex]!;

  const headerConfig = useMemo(
    () => buildHeaderConfig(squarePriority, videoPriority, searchPriority),
    [squarePriority, videoPriority, searchPriority],
  );

  useLayoutEffect(() => {
    setRouteOptions(routeKey, { headerConfig });
  }, [headerConfig, setRouteOptions, routeKey]);

  return (
    <scroll-view scroll-y style={{ width: '100%', height: '100%' }}>
      <view
        style={{ padding: '16px', paddingTop: CONTENT_PADDING_TOP, gap: '8px' }}
      >
        <SettingsButton
          label={`square visibilityPriority: ${squarePriority}`}
          onTap={() =>
            setSquarePriorityIndex((index) => (index + 1) % PRIORITIES.length)
          }
        />
        <SettingsButton
          label={`video visibilityPriority: ${videoPriority}`}
          onTap={() =>
            setVideoPriorityIndex((index) => (index + 1) % PRIORITIES.length)
          }
        />
        <SettingsButton
          label={`search visibilityPriority: ${searchPriority}`}
          onTap={() =>
            setSearchPriorityIndex((index) => (index + 1) % PRIORITIES.length)
          }
        />
      </view>
    </scroll-view>
  );
}

export default function TestStackHeaderItemVisibilityPriorityIOS() {
  return (
    <StackContainer
      routeConfigs={[
        {
          name: 'Home',
          Component: PriorityScreen,
          // Initial header config (default state, no-op callbacks) so the
          // screen mounts its header in the same commit as the screen - the
          // setRouteOptions layout effect lands in a later native update on
          // Lynx, so the nested stack would otherwise start with a hidden
          // navigation bar and animate it in during the push. The screen's
          // effect replaces it with the live config right after mount.
          options: {
            headerConfig: buildHeaderConfig(
              PRIORITIES[0]!,
              PRIORITIES[0]!,
              PRIORITIES[0]!,
            ),
          },
        },
      ]}
    />
  );
}
