import { useCallback, useLayoutEffect, useRef, useState } from '@lynx-js/react';
import type {
  StackHeaderConfigRef,
  StackHeaderToolbarMenuElementAndroid,
  StackHeaderToolbarMenuElementOptionsAndroid,
} from 'lynx-screens';
import searchIcon from '../assets/search_black.png';
import {
  Heading,
  SettingsButton,
  SettingsPicker,
} from '../components/SettingsControls';
import { StackContainer } from '../components/StackContainer';
import { useStackNavigationContext } from '../hooks/useStackNavigationContext';

// Port of RNS single-feature-tests/stack-v5/test-stack-toolbar-menu-a11y-android.
// Adaptation: imageSource icons take a plain uri string (Lynx bundler asset
// import) instead of require() assets.

const ALL_IDS = [
  'action-item',
  'overflow-item',
  'submenu',
  'sub-item',
] as const;
type AllIds = (typeof ALL_IDS)[number];

type LabelOption = 'no change' | 'Updated label' | 'undefined';
const LABEL_OPTIONS: LabelOption[] = [
  'no change',
  'Updated label',
  'undefined',
];

function buildMenu(
  onPress: (id: string) => void,
): StackHeaderToolbarMenuElementAndroid[] {
  return [
    {
      type: 'menuItem',
      id: 'action-item',
      title: 'Alpha',
      accessibilityLabel: 'Accessibility for Alpha',
      showAsAction: 'always',
      icon: {
        type: 'imageSource',
        uri: searchIcon,
      },
      onPress: () => onPress('action-item'),
    },
    {
      type: 'menuItem',
      id: 'overflow-item',
      title: 'Beta',
      accessibilityLabel: 'Accessibility for Beta',
      onPress: () => onPress('overflow-item'),
    },
    {
      type: 'menu',
      id: 'submenu',
      title: 'Gamma',
      accessibilityLabel: 'Accessibility for Gamma',
      children: [
        {
          type: 'menuItem',
          id: 'sub-item',
          title: 'Delta',
          accessibilityLabel: 'Accessibility for Delta',
          onPress: () => onPress('sub-item'),
        },
      ],
    },
  ];
}

const HEADER_TITLE = 'Toolbar Menu A11y';

export default function App(props: { onRender?: () => void }) {
  return (
    <StackContainer
      routeConfigs={[
        {
          name: 'Main',
          Component: MainScreen,
          options: {
            headerConfig: {
              title: HEADER_TITLE,
              android: {
                toolbarMenu: {
                  children: buildMenu(() => {}),
                },
              },
            },
          },
        },
      ]}
    />
  );
}

function MainScreen() {
  const [lastClicked, setLastClicked] = useState<string | null>(null);

  const [cmdTargetId, setCmdTargetId] = useState<AllIds>('action-item');
  const [cmdLabel, setCmdLabel] = useState<LabelOption>('no change');

  const headerConfigRef = useRef<StackHeaderConfigRef>(null);
  const { setRouteOptions, routeKey } = useStackNavigationContext();

  useLayoutEffect(() => {
    setRouteOptions(routeKey, {
      headerConfig: {
        title: HEADER_TITLE,
        android: {
          toolbarMenu: {
            children: buildMenu(setLastClicked),
          },
        },
      },
      headerConfigRef,
    });
  }, [setRouteOptions, routeKey]);

  const sendCommand = useCallback(() => {
    const options: StackHeaderToolbarMenuElementOptionsAndroid = {
      ...(cmdLabel !== 'no change' && {
        accessibilityLabel: cmdLabel === 'undefined' ? undefined : cmdLabel,
      }),
    };
    headerConfigRef.current?.android?.updateToolbarMenuElements({
      id: cmdTargetId,
      options,
    });
  }, [cmdTargetId, cmdLabel]);

  return (
    <scroll-view
      scroll-y
      style={{ width: '100%', height: '100%', backgroundColor: 'white' }}
    >
      <view
        style={{ padding: '10px', paddingBottom: '50px', gap: '6px' }}
      >
        <Heading label="Result" />
        <text style={{ color: 'black', fontSize: '15px' }}>
          Last clicked: {lastClicked ?? '—'}
        </text>

        <Heading label="Send Command" />
        <SettingsPicker<AllIds>
          label="target id"
          value={cmdTargetId}
          items={[...ALL_IDS]}
          onValueChange={setCmdTargetId}
        />
        <SettingsPicker<LabelOption>
          label="accessibilityLabel"
          value={cmdLabel}
          items={LABEL_OPTIONS}
          onValueChange={setCmdLabel}
        />
        <SettingsButton label="Send Command" onTap={sendCommand} />
      </view>
    </scroll-view>
  );
}
