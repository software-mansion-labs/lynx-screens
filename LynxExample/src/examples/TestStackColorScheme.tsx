import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useRef,
  useState,
} from '@lynx-js/react';
import type {
  StackHeaderConfigRef,
  StackHeaderToolbarMenuBaseAndroid,
  StackHeaderTypeAndroid,
  StackHostColorScheme,
} from 'lynx-screens';
import { ScrollViewMarker } from 'lynx-screens';
import bundledIcon from '../assets/lynx-logo.png';
import {
  Heading,
  LongText,
  SettingsButton,
  SettingsPicker,
} from '../components/SettingsControls';
import { StackContainer } from '../components/StackContainer';
import { useStackNavigationContext } from '../hooks/useStackNavigationContext';
import type { StackRouteConfig } from '../types/StackContainer';

// Port of RNS single-feature-tests/stack-v5/test-stack-color-scheme.
// Adaptations: the "React Native's color scheme" picker (Appearance.setColorScheme)
// has no Lynx counterpart and is dropped - change the system scheme instead; the
// TextInput is dropped; the toolbar icon is the bundled lynx-logo asset; the RN
// Buttons are SettingsButtons.

const HOST_COLOR_SCHEMES: StackHostColorScheme[] = ['inherit', 'light', 'dark'];
const HEADER_TYPES: StackHeaderTypeAndroid[] = ['small', 'medium', 'large'];

const ColorSchemeContext = createContext<{
  hostColorScheme: StackHostColorScheme;
  setHostColorScheme: (val: StackHostColorScheme) => void;
}>({
  hostColorScheme: 'inherit',
  setHostColorScheme: () => {},
});

function Note({ text }: { text: string }) {
  return (
    <text style={{ color: 'gray', marginBottom: '10px' }}>{text}</text>
  );
}

// Rendered on every screen so the scheme can be changed without navigating back.
function ColorSchemePickers() {
  const { hostColorScheme, setHostColorScheme } = useContext(ColorSchemeContext);

  return (
    <view style={{ marginBottom: '20px' }}>
      <Heading label="StackHost color scheme" />
      <SettingsPicker<StackHostColorScheme>
        label="colorScheme"
        value={hostColorScheme}
        onValueChange={setHostColorScheme}
        items={HOST_COLOR_SCHEMES}
      />
    </view>
  );
}

function buildToolbarMenu(
  onGroupChange: (groupId: string, selectedIds: string[]) => void,
): StackHeaderToolbarMenuBaseAndroid {
  return {
    groups: [
      {
        groupId: 'filters',
        onSelectionChange: (ids) => onGroupChange('filters', ids),
      },
      {
        groupId: 'sort',
        singleSelection: true,
        onSelectionChange: (ids) => onGroupChange('sort', ids),
      },
    ],
    children: [
      {
        type: 'menuItem',
        id: 'textAction',
        title: 'Text',
        showAsAction: 'always',
        onPress: () => {},
      },
      {
        type: 'menuItem',
        id: 'iconAction',
        title: 'Icon',
        showAsAction: 'always',
        icon: {
          type: 'imageSource',
          uri: bundledIcon,
        },
        onPress: () => {},
      },
      {
        type: 'menuItem',
        id: 'filterA',
        title: 'Filter A',
        groupId: 'filters',
        initialToggleState: true,
      },
      {
        type: 'menuItem',
        id: 'filterB',
        title: 'Filter B',
        groupId: 'filters',
      },
      {
        type: 'menuItem',
        id: 'sortAsc',
        title: 'Sort ascending',
        groupId: 'sort',
        initialToggleState: true,
      },
      {
        type: 'menuItem',
        id: 'sortDesc',
        title: 'Sort descending',
        groupId: 'sort',
      },
    ],
  };
}

function ConfigScreen() {
  const { push, setRouteOptions, routeKey } = useStackNavigationContext();

  const [headerType, setHeaderType] = useState<StackHeaderTypeAndroid>('small');
  const [lastSelection, setLastSelection] = useState<string | null>(null);

  const headerConfigRef = useRef<StackHeaderConfigRef>(null);
  const iconSeedRef = useRef(0);

  const handleGroupChange = useCallback(
    (groupId: string, selectedIds: string[]) => {
      setLastSelection(`${groupId}: ${JSON.stringify(selectedIds)}`);
    },
    [],
  );

  useLayoutEffect(() => {
    setRouteOptions(routeKey, {
      headerConfig: {
        title: 'Config',
        subtitle: 'Color scheme test',
        android: {
          type: headerType,
          scrollFlagScroll: true,
          scrollFlagExitUntilCollapsed: true,
          toolbarMenu: buildToolbarMenu(handleGroupChange),
        },
      },
      headerConfigRef,
    });
  }, [setRouteOptions, routeKey, headerType, handleGroupChange]);

  const loadRemoteIcon = useCallback(() => {
    iconSeedRef.current += 1;
    headerConfigRef.current?.android?.updateToolbarMenuElements({
      id: 'iconAction',
      options: {
        icon: {
          type: 'imageSource',
          uri: `https://picsum.photos/seed/rns-color-scheme-${iconSeedRef.current}/128`,
        },
      },
    });
  }, []);

  return (
    <ScrollViewMarker style={{ width: '100%', height: '100%' }}>
      <scroll-view
        scroll-y
        style={{ width: '100%', height: '100%', backgroundColor: 'white' }}
      >
        <view style={{ padding: '20px' }}>
          <view style={{ marginBottom: '20px' }}>
            <Note text="Sources of color scheme in ascending order of precedence: system, StackHost prop." />
          </view>

          <view style={{ marginBottom: '20px' }}>
            <Heading label="System color scheme" />
            <Note text="Switch system color scheme via quick settings in notification drawer." />
          </view>

          <ColorSchemePickers />

          <view style={{ marginBottom: '20px' }}>
            <Heading label="Header type (Android)" />
            <SettingsPicker<StackHeaderTypeAndroid>
              label="type"
              value={headerType}
              onValueChange={setHeaderType}
              items={HEADER_TYPES}
            />
          </view>

          <view style={{ marginBottom: '20px' }}>
            <Heading label="Back button" />
            <SettingsButton label="Push Details" onTap={() => push('Details')} />
          </view>

          <view style={{ marginBottom: '20px', gap: '6px' }}>
            <Heading label="Toolbar menu (Android)" />
            <Note text="Change checkbox/radio selection in the overflow menu, load a remote icon, then change the color scheme and observe what the toolbar menu keeps." />
            <Note text={`Last selection: ${lastSelection ?? 'none yet'}`} />
            <SettingsButton
              label="Load remote icon (imperative)"
              onTap={loadRemoteIcon}
            />
          </view>

          <LongText paragraphs={30} />
        </view>
      </scroll-view>
    </ScrollViewMarker>
  );
}

function DetailsScreen() {
  return (
    <scroll-view
      scroll-y
      style={{ width: '100%', height: '100%', backgroundColor: 'white' }}
    >
      <view style={{ padding: '20px' }}>
        <view style={{ marginBottom: '20px' }}>
          <Note text="Change the color scheme here and watch the back arrow, then navigate back — the Config header must already use the new palette when it shows up." />
        </view>

        <ColorSchemePickers />
      </view>
    </scroll-view>
  );
}

const ROUTE_CONFIGS: StackRouteConfig[] = [
  {
    name: 'Config',
    Component: ConfigScreen,
  },
  {
    name: 'Details',
    Component: DetailsScreen,
    options: {
      headerConfig: {
        title: 'Details',
        subtitle: 'Back button',
      },
    },
  },
];

export default function App() {
  const [hostColorScheme, setHostColorScheme] =
    useState<StackHostColorScheme>('inherit');

  return (
    <ColorSchemeContext.Provider
      value={{
        hostColorScheme,
        setHostColorScheme,
      }}
    >
      <StackContainer
        routeConfigs={ROUTE_CONFIGS}
        colorScheme={hostColorScheme}
      />
    </ColorSchemeContext.Provider>
  );
}
