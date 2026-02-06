import { TemplateScreen } from './components/TemplateScreen';
import { StackContainer } from './components/StackContainer';
import type { StackRouteConfig } from './types/StackContainer';

const ROUTE_CONFIGS: StackRouteConfig[] = [
  {
    name: 'A',
    Component: TemplateScreen,
    options: {},
  },
  {
    name: 'B',
    Component: TemplateScreen,
    options: {}
  }
];

export function App(props: { onRender?: () => void }) {
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
