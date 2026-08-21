import * as Tests from './examples'
import { StackContainer } from './components/StackContainer';
import type { StackRouteConfig } from './types/StackContainer';
import { useStackNavigationContext } from './hooks/useStackNavigationContext';
import { Heading } from './components/SettingsControls';

const EXAMPLE_NAMES = Object.keys(Tests) as (keyof typeof Tests)[];

const SECTIONS = [
  {
    title: 'Common',
    names: EXAMPLE_NAMES.filter(
      (name) => !name.endsWith('IOS') && !name.endsWith('Android'),
    ),
  },
  {
    title: 'iOS-only',
    names: EXAMPLE_NAMES.filter((name) => name.endsWith('IOS')),
  },
  {
    title: 'Android-only',
    names: EXAMPLE_NAMES.filter((name) => name.endsWith('Android')),
  },
];

// First screen of the top-level stack: lists all examples and pushes
// the selected one, so examples can be switched without reloading the app.
function ExamplesListScreen() {
  const navigation = useStackNavigationContext();

  return (
    <scroll-view
      scroll-y
      style={{ width: '100%', height: '100%', backgroundColor: 'white' }}
    >
      <view
        style={{
          display: 'flex',
          flexDirection: 'column',
          paddingTop: '60px',
          paddingBottom: '40px',
          paddingLeft: '16px',
          paddingRight: '16px',
          gap: '8px',
        }}
      >
        <text
          style={{
            color: 'black',
            fontSize: '24px',
            fontWeight: 'bold',
            marginBottom: '8px',
          }}
        >
          lynx-screens examples
        </text>
        {SECTIONS.map(({ title, names }) => (
          <view
            key={title}
            style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
          >
            <Heading label={title} />
            {names.map((name) => (
              <view
                key={name}
                style={{
                  display: 'flex',
                  paddingTop: '12px',
                  paddingBottom: '12px',
                  paddingLeft: '12px',
                  paddingRight: '12px',
                  borderRadius: '6px',
                  backgroundColor: '#e8eaf6',
                }}
                bindtap={() => navigation.push(name)}
              >
                <text style={{ color: '#3f51b5' }}>{name}</text>
              </view>
            ))}
          </view>
        ))}
      </view>
    </scroll-view>
  );
}

// The v5 stack has no interactive pop gesture on iOS (neither here nor
// upstream in RNS's ios/stack - only the legacy stack implements it), and
// UIKit disables its default edge swipe while the navigation bar is hidden.
// The harness therefore draws its own exit affordance: a floating button
// that pops the example's route off the top-level stack. It overlays the
// example instead of reserving layout space, so examples keep rendering
// full screen with real safe-area/header behavior.
function withExitOverlay(Component: React.ComponentType): React.ComponentType {
  return function ExampleWithExitOverlay() {
    const navigation = useStackNavigationContext();
    return (
      <view
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: '100%',
        }}
      >
        <Component />
        <view
          style={{
            position: 'absolute',
            right: '16px',
            bottom: '40px',
            width: '44px',
            height: '44px',
            borderRadius: '22px',
            backgroundColor: 'rgba(63, 81, 181, 0.8)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
          bindtap={() => navigation.pop(navigation.routeKey)}
        >
          <text
            native-interaction-enabled={false}
            user-interaction-enabled={false}
            style={{ color: 'white', fontSize: '18px', fontWeight: 'bold' }}
          >
            ✕
          </text>
        </view>
      </view>
    );
  };
}

// The outer stack renders no chrome of its own: without an explicit
// headerConfig the native side never touches navigation bar visibility
// (iOS shows the UINavigationController default bar), and examples must
// stay in full control of their own headers.
const HIDDEN_HEADER_OPTIONS = { headerConfig: { hidden: true } };

const ROUTE_CONFIGS: StackRouteConfig[] = [
  {
    name: 'ExamplesList',
    Component: ExamplesListScreen,
    options: HIDDEN_HEADER_OPTIONS,
  },
  ...EXAMPLE_NAMES.map((name) => ({
    name,
    Component: withExitOverlay(Tests[name]),
    options: HIDDEN_HEADER_OPTIONS,
  })),
];

export function App() {
  return (
    <page
      style={{
        display: 'flex',
        backgroundColor: 'white',
        width: '100%',
        height: '100%',
      }}
    >
      <StackContainer routeConfigs={ROUTE_CONFIGS} />
    </page>
  );
}
