import React, { useState, useContext, createContext } from 'react';
import type {
  BatchableNavigationAction,
  StackRouteConfig,
} from '../types/StackContainer';
import { StackContainer } from '../components/StackContainer';
import { useStackNavigationContext } from '../hooks/useStackNavigationContext';

type ScenarioConfig = {
  id: string;
  description: string;

  // Those operations will be performed to setup the test.
  setup: BatchableNavigationAction[];

  // Those operations will be performed after clicking a button.
  transition: BatchableNavigationAction[];
};

type TestContextType = {
  activeScenarioId: string | null;
  setActiveScenarioId: (id: string) => void;
  scenarioFinished: boolean;
  setScenarioFinished: (finished: boolean) => void;
  baseId: number;
  setBaseId: (id: number) => void;
};

// Scenario route keys are written exactly as in the RNS original (Test3576),
// which assumes this stack's routes receive ids starting at 0 (Menu = 0,
// first setup route = 1, ...). The example-list harness shares the global id
// generator, so the actual ids start at whatever the Menu route received -
// shift the scenario keys by that base before dispatching.
function shiftRouteKey(routeKey: string, baseId: number): string {
  const match = /^r-(.+)-(\d+)$/.exec(routeKey);
  if (!match) {
    return routeKey;
  }
  return `r-${match[1]}-${Number(match[2]) + baseId}`;
}

function parseRouteKeyId(routeKey: string): number {
  const match = /^r-.+-(\d+)$/.exec(routeKey);
  return match ? Number(match[1]) : 0;
}

interface ButtonProps {
  onTap: () => void;
  label: string;
}

const TestScenarioContext = createContext<TestContextType | null>(null);

const SCENARIOS: ScenarioConfig[] = [
  {
    id: '1',
    description: 'ABCdefg -> AGEdf',
    setup: [
      { type: 'push', routeName: 'A' },
      { type: 'push', routeName: 'B' },
      { type: 'push', routeName: 'C' },
      { type: 'preload', routeName: 'D' },
      { type: 'preload', routeName: 'E' },
      { type: 'preload', routeName: 'F' },
      { type: 'preload', routeName: 'G' },
    ],
    transition: [
      { type: 'pop', routeKey: 'r-C-3' },
      { type: 'pop', routeKey: 'r-B-2' },
      { type: 'push', routeName: 'G' },
      { type: 'push', routeName: 'E' },
    ],
  },
];

const Button = ({ onTap, label }: ButtonProps) => (
  <view
    style={{
      width: '200px',
      height: '50px',
      backgroundColor: 'blue',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: '10px',
    }}
    bindtap={onTap}
  >
    <text
      native-interaction-enabled={false}
      user-interaction-enabled={false}
      style={{ color: 'white' }}
    >
      {label}
    </text>
  </view>
);

function MenuScreen() {
  const navigation = useStackNavigationContext();
  const testContext = useContext(TestScenarioContext);

  return (
    <view
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignContent: 'center',
        backgroundColor: 'white',
      }}
    >
      <view style={{ padding: '20px', maxHeight: '75%' }}>
        <text style={{ fontSize: '24px', marginBottom: '20px' }}>Select Scenario</text>
        <scroll-view style={{ gap: 10 }}>
          {SCENARIOS.map((scenario) => (
            <view key={scenario.id} style={{ borderWidth: 1, padding: 10 }}>
              <text style={{ marginBottom: '10px' }}>{scenario.description}</text>
              <Button
                label="Run Setup"
                onTap={() => {
                  // The Menu route is the first one this stack created, so
                  // its id is the base every scenario key is relative to.
                  testContext?.setBaseId(parseRouteKeyId(navigation.routeKey));
                  testContext?.setActiveScenarioId(scenario.id);
                  testContext?.setScenarioFinished(false);
                  navigation.batch(scenario.setup);
                }}
              />
            </view>
          ))}
        </scroll-view>
        <text style={{ marginTop: '20px' }}>
          Note that the test can run only once due to reliance on route key
          generation. Please restart the test screen after finishing the
          scenario and after modifying the test file.
        </text>
      </view>
    </view>
  );
}

function TemplateScreen() {
  const navigation = useStackNavigationContext();
  const testContext = useContext(TestScenarioContext);

  const scenario = SCENARIOS.find(
    (s) => s.id === testContext?.activeScenarioId,
  );

  const canPerformTransition = scenario && !testContext?.scenarioFinished;

  const performTransition = () => {
    if (canPerformTransition) {
      testContext?.setScenarioFinished(true);
      const baseId = testContext?.baseId ?? 0;
      navigation.batch(
        scenario.transition.map((action) =>
          action.type === 'pop'
            ? { ...action, routeKey: shiftRouteKey(action.routeKey, baseId) }
            : action,
        ),
      );
    }
  };

  return (
    <view
      style={{
        flex: 1,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column',
        padding: '20px',
        backgroundColor: 'white',
        width: '100%',
        height: '100%',
      }}
    >
      <text style={{ fontSize: '20px', marginBottom: '20px' }}>
        Route: {navigation.routeKey}
      </text>

      <view style={{ gap: 10 }}>
        {canPerformTransition ? (
          <Button label="Perform Transition Action" onTap={performTransition} />
        ) : (
          <text>Scenario has ended. Verify results and restart the test.</text>
        )}
      </view>
    </view>
  );
}

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

const routeConfigs: StackRouteConfig[] = [
  {
    name: 'Menu',
    Component: MenuScreen,
  },
  ...ALPHABET.map((name) => ({
    name,
    Component: TemplateScreen,
  })),
];

export default function App() {
  const [activeScenarioId, setActiveScenarioId] = useState<string | null>(null);
  const [scenarioFinished, setScenarioFinished] = useState<boolean>(false);
  const [baseId, setBaseId] = useState<number>(0);

  return (
    <TestScenarioContext.Provider
      value={{
        activeScenarioId,
        setActiveScenarioId,
        scenarioFinished,
        setScenarioFinished,
        baseId,
        setBaseId,
      }}
    >
      <StackContainer routeConfigs={routeConfigs} />
    </TestScenarioContext.Provider>
  );
}
