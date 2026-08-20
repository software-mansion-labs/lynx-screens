import { TemplateScreen } from '../components/TemplateScreen';
import { StackContainer } from '../components/StackContainer';
import type { StackRouteConfig } from '../types/StackContainer';

const ROUTE_CONFIGS: StackRouteConfig[] = [
  {
    name: 'A',
    Component: TemplateScreen,
  },
  {
    name: 'B',
    Component: TemplateScreen,
  },
];

export default function App(props: { onRender?: () => void }) {
  return (
    <StackContainer routeConfigs={ROUTE_CONFIGS} />
  );
}
