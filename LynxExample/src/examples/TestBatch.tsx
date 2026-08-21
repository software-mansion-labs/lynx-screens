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
};

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
        flex: 1,
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
      navigation.batch(scenario.transition);
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

  return (
    <TestScenarioContext.Provider
      value={{
        activeScenarioId,
        setActiveScenarioId,
        scenarioFinished,
        setScenarioFinished,
      }}
    >
      <StackContainer routeConfigs={routeConfigs} />
    </TestScenarioContext.Provider>
  );
}
