import { StackNavigationButtons } from '../components/StackNavigationButtons';
import { StackContainer } from '../components/StackContainer';

export default function App() {
  return <StackSetup />;
}

function StackSetup() {
  return (
    <StackContainer
      routeConfigs={[
        {
          name: 'Home',
          Component: HomeScreen,
        },
        {
          name: 'Blue',
          Component: BlueScreen,
        },
        {
          name: 'Red',
          Component: RedScreen,
        },
        {
          name: 'NestedHost',
          Component: NestedHostScreen,
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
        backgroundColor: 'yellow',
      }}
    >
      <StackNavigationButtons
        isPopEnabled={false}
        routeNames={['Blue', 'Red', 'NestedHost']}
      />
    </view>
  );
}

function BlueScreen() {
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
      <StackNavigationButtons
        isPopEnabled={true}
        routeNames={['Red', 'Blue', 'NestedHost']}
      />
    </view>
  );
}

function RedScreen() {
  return (
    <view
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        height: '100%',
        backgroundColor: 'red',
      }}
    >
      <StackNavigationButtons
        isPopEnabled={true}
        routeNames={['Blue', 'Red', 'NestedHost']}
      />
    </view>
  );
}

function NestedHostScreen() {
  return (
    <StackContainer
      routeConfigs={[
        {
          name: 'NestedHome',
          Component: NestedHomeScreen,
        },
        {
          name: 'NestedBlue',
          Component: NestedBlueScreen,
        },
        {
          name: 'NestedRed',
          Component: NestedRedScreen,
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
        backgroundColor: 'yellow',
      }}
    >
      <StackNavigationButtons
        isPopEnabled={true}
        routeNames={['NestedBlue', 'NestedRed']}
      />
    </view>
  );
}

function NestedBlueScreen() {
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
      <StackNavigationButtons
        isPopEnabled={true}
        routeNames={['NestedRed', 'NestedBlue']}
      />
    </view>
  );
}

function NestedRedScreen() {
  return (
    <view
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        height: '100%',
        backgroundColor: 'red',
      }}
    >
      <StackNavigationButtons
        isPopEnabled={true}
        routeNames={['NestedBlue', 'NestedRed']}
      />
    </view>
  );
}
