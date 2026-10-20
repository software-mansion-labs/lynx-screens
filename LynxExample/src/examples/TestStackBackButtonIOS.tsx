import {
  createContext,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
} from '@lynx-js/react';
import type {
  StackHeaderBackButtonDisplayModeIOS,
  StackHeaderConfigProps,
} from 'lynx-screens';
import { SettingsButton } from '../components/SettingsControls';
import { StackContainer } from '../components/StackContainer';
import { useStackNavigationContext } from '../hooks/useStackNavigationContext';
import type { StackRouteConfig } from '../types/StackContainer';

// Port of RNS single-feature-tests/stack-v5/test-stack-back-button-ios.
// Adaptations: the RN Buttons are SettingsButtons and the shared
// CenteredLayoutView / StackRouteInformation helpers are local.

const TITLES = [undefined, 'Custom title', 'Longer custom title'];
const BACK_TITLES = [undefined, 'Custom title', 'Longer custom title'];
const DISPLAY_MODES: StackHeaderBackButtonDisplayModeIOS[] = [
  'default',
  'generic',
  'minimal',
];
const MAX_TRAILING_ITEMS_COUNT = 3;

interface BackButtonConfig {
  title: string | undefined;
  backButtonTitle: string | undefined;
  displayMode: StackHeaderBackButtonDisplayModeIOS;
  backButtonMenuEnabled: boolean;
  trailingItemsCount: number;
}

const INITIAL_CONFIG: BackButtonConfig = {
  title: undefined,
  backButtonTitle: undefined,
  displayMode: 'default',
  backButtonMenuEnabled: true,
  trailingItemsCount: 0,
};

type ConfigUpdater = (
  update: (prev: BackButtonConfig) => BackButtonConfig,
) => void;

interface BackButtonConfigContextPayload {
  currentConfig: BackButtonConfig;
  nextConfig: BackButtonConfig;
  setCurrentConfig: ConfigUpdater;
  setNextConfig: ConfigUpdater;
}

const BackButtonConfigContext =
  createContext<BackButtonConfigContextPayload | null>(null);

function useBackButtonConfigContext() {
  const context = useContext(BackButtonConfigContext);
  if (context === null) {
    throw new Error('BackButtonConfigContext must be used inside its provider');
  }
  return context;
}

function buildHeaderConfig(
  defaultTitle: string,
  config: BackButtonConfig,
): StackHeaderConfigProps {
  return {
    title: config.title ?? defaultTitle,
    ios: {
      backButtonTitle: config.backButtonTitle,
      backButtonDisplayMode: config.displayMode,
      backButtonMenuEnabled: config.backButtonMenuEnabled,
      trailingItems: Array.from(
        { length: config.trailingItemsCount },
        (_, index) => ({
          type: 'item' as const,
          id: `trailing-item-${index}`,
          title: `Item ${index + 1}`,
          onPress: () => {
            console.log('click');
          },
          menu: {
            id: `trailing-item-menu-${index}`,
            type: 'menu' as const,
            children: [
              {
                id: `trailing-item-menu-item-${index}`,
                type: 'menuItem' as const,
                title: 'Menu Item',
              },
            ],
          },
        }),
      ),
    },
  };
}

export default function App() {
  const [currentConfig, setCurrentConfig] = useState(INITIAL_CONFIG);
  const [nextConfig, setNextConfig] = useState(INITIAL_CONFIG);

  const contextPayload = useMemo<BackButtonConfigContextPayload>(
    () => ({ currentConfig, nextConfig, setCurrentConfig, setNextConfig }),
    [currentConfig, nextConfig],
  );

  const routeConfigs = useMemo<StackRouteConfig[]>(
    () => [
      {
        name: 'Home',
        Component: HomeScreen,
        options: {
          headerConfig: { title: 'Home' } satisfies StackHeaderConfigProps,
        },
      },
      {
        name: 'First',
        Component: FirstScreen,
        options: {
          headerConfig: buildHeaderConfig('First', INITIAL_CONFIG),
        },
      },
      {
        name: 'Second',
        Component: SecondScreen,
        options: {
          headerConfig: buildHeaderConfig('Second', nextConfig),
        },
      },
      {
        // Intentionally no headerConfig — exercises clearing of back button
        // configuration left on the previous screen by an earlier push.
        name: 'Bare',
        Component: BareScreen,
      },
    ],
    [nextConfig],
  );

  return (
    <BackButtonConfigContext.Provider value={contextPayload}>
      <StackContainer routeConfigs={routeConfigs} />
    </BackButtonConfigContext.Provider>
  );
}

function HomeScreen() {
  const { push } = useStackNavigationContext();

  return (
    <CenteredLayoutView backgroundColor="#fff3cd">
      <RouteInformation routeName="Home" />
      <SettingsButton label="Push First" onTap={() => push('First')} />
    </CenteredLayoutView>
  );
}

function BackButtonConfigSection(props: {
  label: string;
  config: BackButtonConfig;
  onChange: ConfigUpdater;
}) {
  const { label, config, onChange } = props;

  const cycleTitle = () =>
    onChange((prev) => ({
      ...prev,
      title: TITLES[(TITLES.indexOf(prev.title) + 1) % TITLES.length],
    }));

  const cycleBackTitle = () =>
    onChange((prev) => ({
      ...prev,
      backButtonTitle:
        BACK_TITLES[
          (BACK_TITLES.indexOf(prev.backButtonTitle) + 1) % BACK_TITLES.length
        ],
    }));

  const cycleDisplayMode = () =>
    onChange((prev) => ({
      ...prev,
      displayMode:
        DISPLAY_MODES[
          (DISPLAY_MODES.indexOf(prev.displayMode) + 1) % DISPLAY_MODES.length
        ]!,
    }));

  const toggleMenuEnabled = () =>
    onChange((prev) => ({
      ...prev,
      backButtonMenuEnabled: !prev.backButtonMenuEnabled,
    }));

  const cycleTrailingItemsCount = () =>
    onChange((prev) => ({
      ...prev,
      trailingItemsCount:
        (prev.trailingItemsCount + 1) % (MAX_TRAILING_ITEMS_COUNT + 1),
    }));

  return (
    <view
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        width: '100%',
        paddingTop: '8px',
        paddingBottom: '8px',
        paddingLeft: '24px',
        paddingRight: '24px',
        gap: '6px',
      }}
    >
      <text
        style={{ color: 'black', fontWeight: 'bold', textAlign: 'center' }}
      >
        {label}
      </text>
      <SettingsButton
        label={`title: ${config.title ?? 'undefined'}`}
        onTap={cycleTitle}
      />
      <SettingsButton
        label={`backButtonTitle: ${config.backButtonTitle ?? 'undefined'}`}
        onTap={cycleBackTitle}
      />
      <SettingsButton
        label={`displayMode: ${config.displayMode}`}
        onTap={cycleDisplayMode}
      />
      <SettingsButton
        label={`menuEnabled: ${config.backButtonMenuEnabled}`}
        onTap={toggleMenuEnabled}
      />
      <SettingsButton
        label={`trailingItemsCount: ${config.trailingItemsCount}`}
        onTap={cycleTrailingItemsCount}
      />
    </view>
  );
}

function FirstScreen() {
  const { routeKey, push, pop, setRouteOptions } = useStackNavigationContext();
  const { currentConfig, nextConfig, setCurrentConfig, setNextConfig } =
    useBackButtonConfigContext();

  useLayoutEffect(() => {
    setRouteOptions(routeKey, {
      headerConfig: buildHeaderConfig('First', currentConfig),
    });
  }, [currentConfig, setRouteOptions, routeKey]);

  return (
    <CenteredLayoutView backgroundColor="#cce5ff">
      <RouteInformation routeName="First" />
      <BackButtonConfigSection
        label="Current screen — back button to Home, updates live"
        config={currentConfig}
        onChange={setCurrentConfig}
      />
      <BackButtonConfigSection
        label="Next screen — back button to First, applied on push"
        config={nextConfig}
        onChange={setNextConfig}
      />
      <SettingsButton label="Push Second" onTap={() => push('Second')} />
      <SettingsButton
        label="Push Bare (no header config)"
        onTap={() => push('Bare')}
      />
      <SettingsButton label="Pop" onTap={() => pop(routeKey)} />
    </CenteredLayoutView>
  );
}

function BareScreen() {
  const { routeKey, push, pop } = useStackNavigationContext();

  return (
    <CenteredLayoutView backgroundColor="#f8d7da">
      <RouteInformation routeName="Bare" />
      <Note
        text="This screen has no header config, so the header is hidden. Push Second on top and long-press its back button — the menu entries for the screens below must not retain back button configuration from previously popped screens."
      />
      <SettingsButton label="Push Second" onTap={() => push('Second')} />
      <SettingsButton label="Pop" onTap={() => pop(routeKey)} />
    </CenteredLayoutView>
  );
}

function SecondScreen() {
  const { routeKey, push, pop } = useStackNavigationContext();

  return (
    <CenteredLayoutView backgroundColor="#d4edda">
      <RouteInformation routeName="Second" />
      <Note text='The back button reflects the "next screen" config chosen on First.' />
      <SettingsButton
        label="Push Bare (no header config)"
        onTap={() => push('Bare')}
      />
      <SettingsButton label="Pop" onTap={() => pop(routeKey)} />
    </CenteredLayoutView>
  );
}

function Note({ text }: { text: string }) {
  return (
    <text
      style={{
        color: 'black',
        textAlign: 'center',
        paddingLeft: '24px',
        paddingRight: '24px',
        paddingTop: '8px',
        paddingBottom: '8px',
      }}
    >
      {text}
    </text>
  );
}

function CenteredLayoutView({
  backgroundColor,
  children,
}: {
  backgroundColor: string;
  children?: React.ReactNode;
}) {
  return (
    <view
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '6px',
        backgroundColor,
      }}
    >
      {children}
    </view>
  );
}

function RouteInformation(props: { routeName: string }) {
  const routeKey = useStackNavigationContext().routeKey;

  return (
    <view style={{ marginBottom: '10px' }}>
      <text style={{ color: 'black', fontSize: '20px', fontWeight: 'bold' }}>
        Name: {props.routeName}
      </text>
      <text style={{ color: 'black', fontSize: '20px', fontWeight: 'bold' }}>
        Key: {routeKey}
      </text>
    </view>
  );
}
