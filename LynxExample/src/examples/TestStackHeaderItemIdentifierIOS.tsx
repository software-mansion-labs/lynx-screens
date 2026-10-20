import {
  createContext,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactElement,
} from '@lynx-js/react';
import type {
  PlatformIconIOS,
  StackHeaderConfigProps,
  StackHeaderInlineCustomItemIOS,
  StackHeaderInlineItemIOS,
  StackHeaderSpacerItemIOS,
} from 'lynx-screens';
import { SettingsButton, SettingsSwitch } from '../components/SettingsControls';
import { StackContainer } from '../components/StackContainer';
import { useStackNavigationContext } from '../hooks/useStackNavigationContext';
import type { StackRouteConfig } from '../types/StackContainer';

// Port of RNS single-feature-tests/stack-v5/test-stack-header-item-identifier-ios.

type ItemId = 'alpha' | 'bravo' | 'charlie';

const SYMBOL_CYCLES: Record<ItemId, string[]> = {
  alpha: ['1.circle.fill', '2.circle.fill', '3.circle.fill'],
  bravo: ['fish.fill', 'birthday.cake.fill', 'carrot.fill'],
  charlie: ['carrot.fill', 'fish.fill', 'birthday.cake.fill'],
};

const COLOR_CYCLES: Record<ItemId, string[]> = {
  alpha: ['#f44336', '#ffeb3b', '#1a237e'],
  bravo: ['#4caf50', '#2196f3', '#9c27b0'],
  charlie: ['#2196f3', '#9c27b0', '#4caf50'],
};

function iconForItem(id: ItemId, screenIndex: number): PlatformIconIOS {
  const cycle = SYMBOL_CYCLES[id];
  return { type: 'sfSymbol', name: cycle[screenIndex % cycle.length]! };
}

function colorForItem(id: ItemId, screenIndex: number): string {
  const cycle = COLOR_CYCLES[id];
  return cycle[screenIndex % cycle.length]!;
}

const ROUTE_NAMES = ['One', 'Two', 'Three'];

const LAYOUTS: Record<string, ItemId[]> = {
  One: ['charlie', 'bravo', 'alpha'],
  Two: ['charlie', 'alpha', 'bravo'],
  Three: ['alpha', 'charlie', 'bravo'],
};

type ToggleValues = {
  identifiersEnabled: boolean;
  separatorsEnabled: boolean;
  customViewsEnabled: boolean;
};

type Toggles = ToggleValues & {
  setIdentifiersEnabled: (value: boolean) => void;
  setSeparatorsEnabled: (value: boolean) => void;
  setCustomViewsEnabled: (value: boolean) => void;
};

const DEFAULT_TOGGLE_VALUES: ToggleValues = {
  identifiersEnabled: true,
  separatorsEnabled: false,
  customViewsEnabled: false,
};

const ToggleContext = createContext<Toggles>({
  ...DEFAULT_TOGGLE_VALUES,
  setIdentifiersEnabled: () => {},
  setSeparatorsEnabled: () => {},
  setCustomViewsEnabled: () => {},
});

type HeaderItem = StackHeaderInlineItemIOS | StackHeaderInlineCustomItemIOS;

function makeItem(
  id: ItemId,
  screenIndex: number,
  withIdentifier: boolean,
  withCustomView: boolean,
): HeaderItem {
  const identifierProp = withIdentifier ? { identifier: id } : {};
  if (withCustomView) {
    const color = colorForItem(id, screenIndex);
    return {
      type: 'item',
      id,
      render: () => (
        <view
          style={{
            width: '24px',
            height: '24px',
            borderRadius: '6px',
            backgroundColor: color,
          }}
        />
      ),
      ...identifierProp,
    };
  }
  return {
    type: 'item',
    id,
    icon: iconForItem(id, screenIndex),
    ...identifierProp,
  };
}

function buildItems(
  ids: ItemId[],
  screenIndex: number,
  withIdentifier: boolean,
  withSeparators: boolean,
  withCustomView: boolean,
): (HeaderItem | StackHeaderSpacerItemIOS)[] {
  const result: (HeaderItem | StackHeaderSpacerItemIOS)[] = [];
  ids.forEach((id, index) => {
    if (withSeparators && index > 0) {
      result.push({
        id: `sep-${index}`,
        type: 'spacer',
        sizing: 'fixed',
        width: 12,
      });
    }
    result.push(makeItem(id, screenIndex, withIdentifier, withCustomView));
  });
  return result;
}

function buildHeaderConfig(
  routeName: string,
  toggles: ToggleValues,
): StackHeaderConfigProps {
  const screenIndex = ROUTE_NAMES.indexOf(routeName);
  return {
    title: routeName,
    ios: {
      trailingItems: buildItems(
        LAYOUTS[routeName]!,
        screenIndex,
        toggles.identifiersEnabled,
        toggles.separatorsEnabled,
        toggles.customViewsEnabled,
      ),
    },
  };
}

function Screen(props: { routeName: string }) {
  const { routeName } = props;
  const {
    identifiersEnabled,
    separatorsEnabled,
    customViewsEnabled,
    setIdentifiersEnabled,
    setSeparatorsEnabled,
    setCustomViewsEnabled,
  } = useContext(ToggleContext);
  const navigation = useStackNavigationContext();
  const { setRouteOptions, routeKey } = navigation;
  const screenIndex = ROUTE_NAMES.indexOf(routeName);

  const headerConfig = useMemo<StackHeaderConfigProps>(
    () =>
      buildHeaderConfig(routeName, {
        identifiersEnabled,
        separatorsEnabled,
        customViewsEnabled,
      }),
    [routeName, identifiersEnabled, separatorsEnabled, customViewsEnabled],
  );

  useLayoutEffect(() => {
    setRouteOptions(routeKey, { headerConfig });
  }, [headerConfig, setRouteOptions, routeKey]);

  const nextRoute = ROUTE_NAMES[screenIndex + 1];

  return (
    <view
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        padding: '16px',
        gap: '6px',
        backgroundColor: 'white',
      }}
    >
      <SettingsSwitch
        label="Identifiers"
        value={identifiersEnabled}
        onValueChange={setIdentifiersEnabled}
      />
      <SettingsSwitch
        label="Separators"
        value={separatorsEnabled}
        onValueChange={setSeparatorsEnabled}
      />
      <SettingsSwitch
        label="Custom views"
        value={customViewsEnabled}
        onValueChange={setCustomViewsEnabled}
      />
      {nextRoute && (
        <SettingsButton label="Next" onTap={() => navigation.push(nextRoute)} />
      )}
      {routeName !== 'One' && (
        <SettingsButton
          label="Go back"
          onTap={() => navigation.pop(routeKey)}
        />
      )}
    </view>
  );
}

const SCREENS: Record<string, () => ReactElement> = Object.fromEntries(
  ROUTE_NAMES.map((routeName) => [
    routeName,
    () => <Screen routeName={routeName} />,
  ]),
);

export default function App() {
  const [identifiersEnabled, setIdentifiersEnabled] = useState(
    DEFAULT_TOGGLE_VALUES.identifiersEnabled,
  );
  const [separatorsEnabled, setSeparatorsEnabled] = useState(
    DEFAULT_TOGGLE_VALUES.separatorsEnabled,
  );
  const [customViewsEnabled, setCustomViewsEnabled] = useState(
    DEFAULT_TOGGLE_VALUES.customViewsEnabled,
  );

  const toggles = useMemo<Toggles>(
    () => ({
      identifiersEnabled,
      separatorsEnabled,
      customViewsEnabled,
      setIdentifiersEnabled,
      setSeparatorsEnabled,
      setCustomViewsEnabled,
    }),
    [identifiersEnabled, separatorsEnabled, customViewsEnabled],
  );

  // The header config is also part of the route options so a pushed screen
  // mounts its header in the same commit as the screen - the setRouteOptions
  // layout effect lands in a later native update than the push on Lynx,
  // which would make the items miss the iOS 26 navigation bar transition
  // this example is about. Mounted screens keep receiving runtime updates
  // through the effect.
  const routeConfigs = useMemo<StackRouteConfig[]>(
    () =>
      ROUTE_NAMES.map((routeName) => ({
        name: routeName,
        Component: SCREENS[routeName]!,
        options: { headerConfig: buildHeaderConfig(routeName, toggles) },
      })),
    [toggles],
  );

  return (
    <ToggleContext.Provider value={toggles}>
      <StackContainer routeConfigs={routeConfigs} />
    </ToggleContext.Provider>
  );
}
