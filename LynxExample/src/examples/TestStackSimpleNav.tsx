import { StackContainer } from '../components/StackContainer';
import { StackNavigationButtons } from '../components/StackNavigationButtons';
import { useStackNavigationContext } from '../hooks/useStackNavigationContext';
import type { StackRouteConfig } from '../types/StackContainer';

const ROUTE_CONFIGS: StackRouteConfig[] = [
  {
    name: 'Home',
    Component: HomeScreen,
    options: {},
  },
  {
    name: 'A',
    Component: AScreen,
    options: {},
  },
  {
    name: 'B',
    Component: BScreen,
    options: {},
  },
];

export default function App(props: { onRender?: () => void }) {
  return <StackContainer routeConfigs={ROUTE_CONFIGS} />;
}

function HomeScreen() {
  return (
    <CenteredLayoutView backgroundColor="#cce5ff">
      <RouteInformation routeName="Home" />
      <StackNavigationButtons isPopEnabled={false} routeNames={['A', 'B']} />
    </CenteredLayoutView>
  );
}

function AScreen() {
  return (
    <CenteredLayoutView backgroundColor="#fff3cd">
      <RouteInformation routeName="A" />
      <StackNavigationButtons isPopEnabled={true} routeNames={['A', 'B']} />
    </CenteredLayoutView>
  );
}

function BScreen() {
  return (
    <CenteredLayoutView backgroundColor="#d4edda">
      <RouteInformation routeName="B" />
      <StackNavigationButtons isPopEnabled={true} routeNames={['A', 'B']} />
    </CenteredLayoutView>
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
