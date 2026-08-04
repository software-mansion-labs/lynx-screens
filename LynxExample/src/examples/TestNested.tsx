import React from 'react';

import { StackContainer } from '../components/StackContainer';
import type { StackRouteConfig } from '../types/StackContainer';
import { useStackNavigationContext } from '../hooks/useStackNavigationContext';

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

function TemplateScreen() {
  const navigation = useStackNavigationContext();

  return (
    <view
      style={{
        display: 'flex',
        height: '100%',
        width: '100%',
        backgroundColor: 'white',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column',
      }}
    >
      <text>Route: {navigation.routeKey}</text>
      <Button label="Push A" onTap={() => navigation.push('A')} />
      <Button label="Push B" onTap={() => navigation.push('B')} />
      <Button
        label="Push NestedStack"
        onTap={() => navigation.push('NestedStack')}
      />
      <Button label="Pop" onTap={() => navigation.pop(navigation.routeKey)} />
      <Button label="Preload A" onTap={() => navigation.preload('A')} />
      <Button label="Preload B" onTap={() => navigation.preload('B')} />
    </view>
  );
}

function NestedTemplateScreen() {
  const navigation = useStackNavigationContext();

  return (
    <view
      style={{
        display: 'flex',
        height: '100%',
        width: '100%',
        backgroundColor: 'white',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column',
      }}
    >
      <text>Route: {navigation.routeKey}</text>
      <Button label="Push NestedA" onTap={() => navigation.push('NestedA')} />
      <Button label="Push NestedB" onTap={() => navigation.push('NestedB')} />
      <Button
        label="Push both"
        onTap={() =>
          navigation.batch([
            {
              type: 'push',
              routeName: 'NestedA',
            },
            {
              type: 'push',
              routeName: 'NestedB',
            },
          ])
        }
      />
      <Button label="Pop" onTap={() => navigation.pop(navigation.routeKey)} />
      <Button
        label="Preload NestedA"
        onTap={() => navigation.preload('NestedA')}
      />
      <Button
        label="Preload NestedB"
        onTap={() => navigation.preload('NestedB')}
      />
    </view>
  );
}

function NestedStackScreen() {
  return <StackContainer routeConfigs={ROUTE_CONFIGS_NESTED_STACK} />;
}

const ROUTE_CONFIGS: StackRouteConfig[] = [
  {
    name: 'A',
    Component: TemplateScreen,
    options: {
      onWillAppear: () => console.log('A onWillAppear'),
      onWillDisappear: () => console.log('A onWillDisappear'),
      onDidAppear: () => console.log('A onDidAppear'),
      onDidDisappear: () => console.log('A onDidDisappear'),
    },
  },
  {
    name: 'B',
    Component: TemplateScreen,
    options: {
      onWillAppear: () => console.log('B onWillAppear'),
      onWillDisappear: () => console.log('B onWillDisappear'),
      onDidAppear: () => console.log('B onDidAppear'),
      onDidDisappear: () => console.log('B onDidDisappear'),
    },
  },
  {
    name: 'NestedStack',
    Component: NestedStackScreen,
    options: {
      onWillAppear: () => console.log('NestedStack onWillAppear'),
      onWillDisappear: () => console.log('NestedStack onWillDisappear'),
      onDidAppear: () => console.log('NestedStack onDidAppear'),
      onDidDisappear: () => console.log('NestedStack onDidDisappear'),
    },
  },
];

const ROUTE_CONFIGS_NESTED_STACK: StackRouteConfig[] = [
  {
    name: 'NestedA',
    Component: NestedTemplateScreen,
    options: {},
  },
  {
    name: 'NestedB',
    Component: NestedTemplateScreen,
    options: {},
  },
];

export default function App() {
  return <StackContainer routeConfigs={ROUTE_CONFIGS} />;
}
