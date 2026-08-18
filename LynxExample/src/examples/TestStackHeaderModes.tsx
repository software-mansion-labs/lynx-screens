import { StackContainer } from '../components/StackContainer';
import { StackNavigationButtons } from '../components/StackNavigationButtons';
import type { StackRouteConfig } from '../types/StackContainer';

const ROUTE_CONFIGS: StackRouteConfig[] = [
  {
    name: 'Home',
    Component: () => <Screen isHome={true} />,
    options: {},
  },
  {
    name: 'A',
    Component: () => <Screen isHome={false} />,
    options: {},
  },
];

export default function App(props: { onRender?: () => void }) {
  return <StackContainer routeConfigs={ROUTE_CONFIGS} />;
}

function Screen({ isHome }: { isHome: boolean }) {
  return (
    <scroll-view
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: 'white',
      }}
    >
      <LongText paragraphs={2} />
      <view
        style={{
          paddingTop: '10px',
          paddingBottom: '10px',
          gap: '10px',
          alignItems: 'center',
        }}
      >
        <StackNavigationButtons isPopEnabled={!isHome} routeNames={['A']} />
      </view>
      <LongText paragraphs={20} />
    </scroll-view>
  );
}

function LongText({ paragraphs }: { paragraphs: number }) {
  return (
    <view style={{ padding: '10px', gap: '10px' }}>
      {Array.from({ length: paragraphs }, (_, index) => (
        <text key={index} style={{ color: 'black' }}>
          {index + 1}. Lorem ipsum dolor sit amet, consectetur adipiscing elit,
          sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut
          enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi
          ut aliquip ex ea commodo consequat.
        </text>
      ))}
    </view>
  );
}
