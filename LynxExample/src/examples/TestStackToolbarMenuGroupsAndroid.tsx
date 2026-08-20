import { useCallback, useLayoutEffect, useRef, useState } from '@lynx-js/react';
import type {
  StackHeaderConfigRef,
  StackHeaderToolbarMenuBaseAndroid,
  StackHeaderToolbarMenuElementAndroid,
  StackHeaderToolbarMenuElementOptionsAndroid,
} from 'lynx-screens';
import { ScrollViewMarker } from 'lynx-screens';
import {
  Heading,
  SettingsButton,
  SettingsPicker,
  SettingsSwitch,
} from '../components/SettingsControls';
import { StackContainer } from '../components/StackContainer';
import { useStackNavigationContext } from '../hooks/useStackNavigationContext';

// Port of RNS single-feature-tests/stack-v5/test-stack-toolbar-menu-groups.
// Adaptation: the RNS example reports events through a Toast; a "Last Event"
// text is used instead (no toast component in this app).

const ALL_IDS = [
  'red',
  'green',
  'blue',
  'small',
  'medium',
  'large',
  'share',
  'light',
  'dark',
  'info',
] as const;
type AllIds = (typeof ALL_IDS)[number];

type CmdCheckedOption = 'no change' | 'true' | 'false';
type CmdTitleOption = 'no change' | 'Changed' | 'undefined';
type CmdHiddenOption = 'no change' | 'true' | 'false' | 'undefined';

const CMD_CHECKED_OPTIONS: CmdCheckedOption[] = ['no change', 'true', 'false'];
const CMD_TITLE_OPTIONS: CmdTitleOption[] = [
  'no change',
  'Changed',
  'undefined',
];
const CMD_HIDDEN_OPTIONS: CmdHiddenOption[] = [
  'no change',
  'true',
  'false',
  'undefined',
];

interface MenuConfig {
  singleSelectionOnColors: boolean;
  includeBlue: boolean;
  dividerEnabled: boolean;
}

const DEFAULT_CONFIG: MenuConfig = {
  singleSelectionOnColors: false,
  includeBlue: true,
  dividerEnabled: false,
};

function buildMenu(
  config: MenuConfig,
  onItemPress: (id: string) => void,
  onGroupChange: (groupId: string, selectedIds: string[]) => void,
): StackHeaderToolbarMenuBaseAndroid {
  const colorItems: StackHeaderToolbarMenuElementAndroid[] = [
    {
      type: 'menuItem',
      id: 'red',
      title: 'Red',
      groupId: 'colors',
      initialToggleState: true,
    },
    {
      type: 'menuItem',
      id: 'green',
      title: 'Green',
      groupId: 'colors',
    },
  ];

  if (config.includeBlue) {
    colorItems.push({
      type: 'menuItem',
      id: 'blue',
      title: 'Blue',
      groupId: 'colors',
    });
  }

  return {
    groups: [
      {
        groupId: 'colors',
        singleSelection: config.singleSelectionOnColors,
        onSelectionChange: (ids) => onGroupChange('colors', ids),
      },
      {
        groupId: 'size',
        singleSelection: true,
        onSelectionChange: (ids) => onGroupChange('size', ids),
      },
    ],
    children: [
      ...colorItems,
      {
        type: 'menuItem',
        id: 'small',
        title: 'Small',
        groupId: 'size',
      },
      {
        type: 'menuItem',
        id: 'medium',
        title: 'Medium',
        groupId: 'size',
        initialToggleState: true,
      },
      {
        type: 'menuItem',
        id: 'large',
        title: 'Large',
        groupId: 'size',
      },
      {
        type: 'menuItem',
        id: 'share',
        title: 'Share',
        onPress: () => onItemPress('share'),
      },
      {
        type: 'menu',
        id: 'sub',
        title: 'More',
        groups: [
          {
            groupId: 'theme',
            singleSelection: true,
            onSelectionChange: (ids) => onGroupChange('theme', ids),
          },
        ],
        children: [
          {
            type: 'menuItem',
            id: 'light',
            title: 'Light',
            groupId: 'theme',
            initialToggleState: true,
          },
          {
            type: 'menuItem',
            id: 'dark',
            title: 'Dark',
            groupId: 'theme',
          },
          {
            type: 'menuItem',
            id: 'info',
            title: 'Info',
            onPress: () => onItemPress('info'),
          },
        ],
      },
    ],
  };
}

const HEADER_TITLE = 'Toolbar Menu Groups Test';

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
                  DEFAULT_CONFIG,
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
  const [config, setConfig] = useState<MenuConfig>(DEFAULT_CONFIG);
  const [lastEvent, setLastEvent] = useState<string | null>(null);

  const [cmdTargetId, setCmdTargetId] = useState<AllIds>('red');
  const [cmdChecked, setCmdChecked] = useState<CmdCheckedOption>('no change');
  const [cmdTitle, setCmdTitle] = useState<CmdTitleOption>('no change');
  const [cmdHidden, setCmdHidden] = useState<CmdHiddenOption>('no change');

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
          toolbarMenu: buildMenu(config, handleItemPress, handleGroupChange),
          toolbarMenuGroupDividerEnabled: config.dividerEnabled,
        },
      },
      headerConfigRef,
    });
  }, [setRouteOptions, routeKey, handleItemPress, handleGroupChange, config]);

  const applyConfig = useCallback(
    (next: MenuConfig) => {
      setConfig(next);
      setRouteOptions(routeKey, {
        headerConfig: {
          title: HEADER_TITLE,
          android: {
            toolbarMenu: buildMenu(next, handleItemPress, handleGroupChange),
            toolbarMenuGroupDividerEnabled: next.dividerEnabled,
          },
        },
      });
    },
    [setRouteOptions, routeKey, handleItemPress, handleGroupChange],
  );

  const sendCommand = useCallback(() => {
    const options: StackHeaderToolbarMenuElementOptionsAndroid = {
      ...(cmdChecked !== 'no change' && { checked: cmdChecked === 'true' }),
      ...(cmdTitle !== 'no change' && {
        title: cmdTitle === 'undefined' ? undefined : cmdTitle,
      }),
      ...(cmdHidden !== 'no change' && {
        hidden: cmdHidden === 'undefined' ? undefined : cmdHidden === 'true',
      }),
    };
    headerConfigRef.current?.android?.updateToolbarMenuElements({
      id: cmdTargetId,
      options,
    });
  }, [cmdTargetId, cmdChecked, cmdTitle, cmdHidden]);

  return (
    <ScrollViewMarker style={{ width: '100%', height: '100%' }}>
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
          <SettingsPicker<CmdCheckedOption>
            label="checked"
            value={cmdChecked}
            items={CMD_CHECKED_OPTIONS}
            onValueChange={setCmdChecked}
          />
          <SettingsPicker<CmdTitleOption>
            label="title"
            value={cmdTitle}
            items={CMD_TITLE_OPTIONS}
            onValueChange={setCmdTitle}
          />
          <SettingsPicker<CmdHiddenOption>
            label="hidden"
            value={cmdHidden}
            items={CMD_HIDDEN_OPTIONS}
            onValueChange={setCmdHidden}
          />
          <SettingsButton label="Send Command" onTap={sendCommand} />

          <Heading label="Menu Config — Props" />
          <SettingsSwitch
            label="singleSelection on colors"
            value={config.singleSelectionOnColors}
            onValueChange={(v) =>
              applyConfig({ ...config, singleSelectionOnColors: v })
            }
          />
          <SettingsSwitch
            label="include Blue"
            value={config.includeBlue}
            onValueChange={(v) => applyConfig({ ...config, includeBlue: v })}
          />
          <SettingsSwitch
            label="divider enabled"
            value={config.dividerEnabled}
            onValueChange={(v) => applyConfig({ ...config, dividerEnabled: v })}
          />
        </view>
      </scroll-view>
    </ScrollViewMarker>
  );
}
