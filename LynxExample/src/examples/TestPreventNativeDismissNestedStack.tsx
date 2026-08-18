import React from 'react';
import { StackContainer } from '../components/StackContainer';
import { useStackNavigationContext } from '../hooks/useStackNavigationContext';
import { StackNavigationButtons } from '../components/StackNavigationButtons';

function StackSetup() {
  return (
    <StackContainer
      routeConfigs={[
        {
          name: 'Home',
          Component: HomeScreen,
          options: {},
        },
        {
          name: 'A',
          Component: AScreen,
          options: {
            headerConfig: {
              title: 'A',
            },
          },
        },
        {
          name: 'B',
          Component: BScreen,
          options: {
            preventNativeDismiss: true,
            onNativeDismissPrevented: () => {
              console.info('Native dismiss prevented - B');
            },
            headerConfig: {
              title: 'B',
            },
          },
        },
        {
          name: 'NestedStack',
          Component: NestedStackScreen,
          options: {
            // This one is interesting. It will prevent nested stack from being popped.
            preventNativeDismiss: false,
          },
        },
      ]}
    />
  );
}

function HomeScreen() {
  return (
    <view
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        height: '100%',
        backgroundColor: 'cyan',
      }}
    >
      <RouteInformation routeName="Home" />
      <StackNavigationButtons
        isPopEnabled={false}
        routeNames={['A', 'B', 'NestedStack']}
      />
    </view>
  );
}

function AScreen() {
  return (
    <view
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        height: '100%',
        backgroundColor: 'yellow',
      }}
    >
      <RouteInformation routeName="A" />
      <PreventNativeDismissInfo />
      <StackNavigationButtons isPopEnabled routeNames={['A', 'B', 'NestedStack']} />
    </view>
  );
}

function BScreen() {
  return (
    <view
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        height: '100%',
        backgroundColor: 'lightgreen',
      }}
    >
      <RouteInformation routeName="B" />
      <PreventNativeDismissInfo />
      <StackNavigationButtons isPopEnabled routeNames={['A', 'B', 'NestedStack']} />
      <TogglePreventNativeDismiss />
    </view>
  );
}

function NestedStackScreen() {
  return (
    <StackContainer
      routeConfigs={[
        {
          name: 'NestedHome',
          Component: NestedHomeScreen,
          options: {
            // This one will also prevent!
            preventNativeDismiss: true,
            onNativeDismissPrevented: () => {
              console.info('Native dismiss prevented - NestedHome');
            },
          },
        },
        {
          name: 'NestedA',
          Component: NestedAScreen,
          options: {
            headerConfig: {
              title: 'NestedA',
            },
          },
        },
        {
          name: 'NestedB',
          Component: NestedBScreen,
          options: {
            preventNativeDismiss: true,
            onNativeDismissPrevented: () => {
              console.info('Native dismiss prevented - NestedB');
            },
          },
        },
      ]}
    />
  );
}

function NestedHomeScreen() {
  return (
    <view
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        height: '100%',
        backgroundColor: 'cyan',
      }}
    >
      <RouteInformation routeName="NestedHome" />
      <PreventNativeDismissInfo />
      <StackNavigationButtons isPopEnabled routeNames={['NestedA', 'NestedB']} />
      <TogglePreventNativeDismiss />
    </view>
  );
}

function NestedAScreen() {
  return (
    <view
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        height: '100%',
        backgroundColor: 'cyan',
      }}
    >
      <RouteInformation routeName="NestedA" />
      <PreventNativeDismissInfo />
      <StackNavigationButtons isPopEnabled routeNames={['NestedA', 'NestedB']} />
    </view>
  );
}

function NestedBScreen() {
  return (
    <view
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        height: '100%',
        backgroundColor: 'cyan',
      }}
    >
      <RouteInformation routeName="NestedB" />
      <PreventNativeDismissInfo />
      <StackNavigationButtons isPopEnabled routeNames={['NestedA', 'NestedB']} />
      <TogglePreventNativeDismiss />
    </view>
  );
}

function RouteInformation(props: { routeName: string }) {
  const routeKey = useStackNavigationContext().routeKey;

  return (
    <view>
      <text style={{ color: 'black', fontSize: 20, fontWeight: 'bold' }}>
        Name: {props.routeName}
      </text>
      <text style={{ color: 'black', fontSize: 20, fontWeight: 'bold' }}>
        Key: {routeKey}
      </text>
    </view>
  );
}

function TogglePreventNativeDismiss() {
  const navigation = useStackNavigationContext();

  return (
    <Button
      label="Toggle Prevent Native Dismiss"
      onTap={() =>
        navigation.setRouteOptions(navigation.routeKey, {
          preventNativeDismiss: !navigation.routeOptions.preventNativeDismiss,
        })
      }
    />
  );
}

function PreventNativeDismissInfo() {
  const navContext = useStackNavigationContext();

  return (
    <view>
      <text style={{ color: 'black', fontSize: 20, fontWeight: 'bold' }}>
        Prevent native dismiss:{' '}
        {navContext.routeOptions.preventNativeDismiss ? 'Enabled' : 'Disabled'}
      </text>
    </view>
  );
}

interface ButtonProps {
  onTap: () => void;
  label: string;
}

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

export default function App() {
  return <StackSetup />;
}
