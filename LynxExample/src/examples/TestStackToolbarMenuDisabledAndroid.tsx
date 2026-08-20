import { useCallback, useLayoutEffect, useRef, useState } from '@lynx-js/react';
import type {
  PlatformIconAndroid,
  StackHeaderConfigRef,
  StackHeaderToolbarMenuBaseAndroid,
  StackHeaderToolbarMenuElementOptionsAndroid,
} from 'lynx-screens';
import searchIcon from '../assets/search_black.png';
import {
  Heading,
  SettingsButton,
  SettingsPicker,
  SettingsSwitch,
} from '../components/SettingsControls';
import { StackContainer } from '../components/StackContainer';
import { useStackNavigationContext } from '../hooks/useStackNavigationContext';

// Port of RNS single-feature-tests/stack-v5/test-stack-toolbar-menu-disabled-android.

// Every disable-relevant element: a toolbar action button, an overflow
// action item, a checkable group (one item starts checked), and a submenu
// with a leaf item.
const ALL_IDS = [
  'action-bar',
  'action-overflow',
  'opt-a',
  'opt-b',
  'submenu',
  'sub-item',
] as const;
type AllIds = (typeof ALL_IDS)[number];

type CmdDisabledOption = 'no change' | 'true' | 'false' | 'undefined';

const CMD_DISABLED_OPTIONS: CmdDisabledOption[] = [
  'no change',
  'true',
  'false',
  'undefined',
];

type DisabledById = Record<AllIds, boolean>;

const DEFAULT_DISABLED: DisabledById = {
  'action-bar': false,
  'action-overflow': false,
  'opt-a': false,
  'opt-b': false,
  submenu: false,
  'sub-item': false,
};

const ITEM_LABELS: Record<AllIds, string> = {
  'action-bar': 'action-bar (toolbar button)',
  'action-overflow': 'action-overflow',
  'opt-a': 'opt-a (checkable, checked)',
  'opt-b': 'opt-b (checkable)',
  submenu: 'submenu',
  'sub-item': 'sub-item',
};

const SEARCH_ICON: PlatformIconAndroid = {
  type: 'imageSource',
  uri: searchIcon,
};

function buildMenu(
  disabled: DisabledById,
  onItemPress: (id: string) => void,
  onGroupChange: (groupId: string, selectedIds: string[]) => void,
): StackHeaderToolbarMenuBaseAndroid {
  return {
    groups: [
      {
        groupId: 'options',
        singleSelection: false,
        onSelectionChange: (ids) => onGroupChange('options', ids),
      },
    ],
    children: [
      {
        type: 'menuItem',
        id: 'action-bar',
        title: 'Action Bar',
        showAsAction: 'always',
        icon: SEARCH_ICON,
        iconTintColorNormal: '#9C27B0',
        iconTintColorDisabled: '#CE93D8',
        disabled: disabled['action-bar'],
        onPress: () => onItemPress('action-bar'),
      },
      {
        type: 'menuItem',
        id: 'action-overflow',
        title: 'Action Overflow',
        showAsAction: 'never',
        disabled: disabled['action-overflow'],
        onPress: () => onItemPress('action-overflow'),
      },
      {
        type: 'menuItem',
        id: 'opt-a',
        title: 'Option A',
        groupId: 'options',
        initialToggleState: true,
        disabled: disabled['opt-a'],
      },
      {
        type: 'menuItem',
        id: 'opt-b',
        title: 'Option B',
        groupId: 'options',
        disabled: disabled['opt-b'],
      },
      {
        type: 'menu',
        id: 'submenu',
        title: 'More',
        disabled: disabled.submenu,
        children: [
          {
            type: 'menuItem',
            id: 'sub-item',
            title: 'Sub Item',
            disabled: disabled['sub-item'],
            onPress: () => onItemPress('sub-item'),
          },
        ],
      },
    ],
  };
}

const HEADER_TITLE = 'Toolbar Menu Disabled Test';

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
                toolbarMenu: buildMenu(
                  DEFAULT_DISABLED,
                  () => {},
                  () => {},
                ),
              },
            },
          },
        },
      ]}
    />
  );
}

function MainScreen() {
  const [disabledById, setDisabledById] =
    useState<DisabledById>(DEFAULT_DISABLED);
  const [lastEvent, setLastEvent] = useState<string | null>(null);

  const [cmdTargetId, setCmdTargetId] = useState<AllIds>('action-bar');
  const [cmdDisabled, setCmdDisabled] =
    useState<CmdDisabledOption>('no change');

  const headerConfigRef = useRef<StackHeaderConfigRef>(null);
  const { setRouteOptions, routeKey } = useStackNavigationContext();

  const handleItemPress = useCallback((id: string) => {
    setLastEvent(`Pressed: ${id}`);
  }, []);

  const handleGroupChange = useCallback(
    (groupId: string, selectedIds: string[]) => {
      setLastEvent(`${groupId}: ${JSON.stringify(selectedIds)}`);
    },
    [],
  );

  useLayoutEffect(() => {
    setRouteOptions(routeKey, {
      headerConfig: {
        title: HEADER_TITLE,
        android: {
          toolbarMenu: buildMenu(
            DEFAULT_DISABLED,
            handleItemPress,
            handleGroupChange,
          ),
        },
      },
      headerConfigRef,
    });
  }, [setRouteOptions, routeKey, handleItemPress, handleGroupChange]);

  const applyDisabled = useCallback(
    (next: DisabledById) => {
      setDisabledById(next);
      setRouteOptions(routeKey, {
        headerConfig: {
          title: HEADER_TITLE,
          android: {
            toolbarMenu: buildMenu(next, handleItemPress, handleGroupChange),
          },
        },
      });
    },
    [setRouteOptions, routeKey, handleItemPress, handleGroupChange],
  );

  const sendCommand = useCallback(() => {
    const options: StackHeaderToolbarMenuElementOptionsAndroid = {
      ...(cmdDisabled !== 'no change' && {
        disabled:
          cmdDisabled === 'undefined' ? undefined : cmdDisabled === 'true',
      }),
    };
    headerConfigRef.current?.android?.setToolbarMenuElementOptions(
      cmdTargetId,
      options,
    );
  }, [cmdTargetId, cmdDisabled]);

  return (
    <scroll-view
      style={{ width: '100%', height: '100%', backgroundColor: 'white' }}
    >
      <view style={{ padding: '10px', paddingBottom: '50px', gap: '6px' }}>
        <Heading label="Last Event" />
        <text style={{ color: 'black', fontSize: '15px' }}>
          {lastEvent ?? '—'}
        </text>

        <Heading label="Send Command" />
        <SettingsPicker<AllIds>
          label="target id"
          value={cmdTargetId}
          items={[...ALL_IDS]}
          onValueChange={setCmdTargetId}
        />
        <SettingsPicker<CmdDisabledOption>
          label="disabled"
          value={cmdDisabled}
          items={CMD_DISABLED_OPTIONS}
          onValueChange={setCmdDisabled}
        />
        <SettingsButton label="Send Command" onTap={sendCommand} />

        <Heading label="Menu Items — Props" />
        {ALL_IDS.map((id) => (
          <SettingsSwitch
            key={id}
            label={`disable ${ITEM_LABELS[id]}`}
            value={disabledById[id]}
            onValueChange={(v) => applyDisabled({ ...disabledById, [id]: v })}
          />
        ))}
      </view>
    </scroll-view>
  );
}
