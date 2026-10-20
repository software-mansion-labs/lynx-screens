import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from '@lynx-js/react';
import type {
  PlatformIconAndroid,
  StackHeaderConfigRef,
  StackHeaderToolbarMenuBaseAndroid,
  StackHeaderToolbarMenuElementOptionsAndroid,
  StackHeaderTypeAndroid,
  StackHostColorScheme,
} from 'lynx-screens';
import { ScrollViewMarker } from 'lynx-screens';
import propIcon from '../assets/lynx-logo.png';
import commandIcon from '../assets/search_black.png';
import {
  Heading,
  SettingsButton,
  SettingsPicker,
  SettingsSwitch,
} from '../components/SettingsControls';
import { StackContainer } from '../components/StackContainer';
import { useStackNavigationContext } from '../hooks/useStackNavigationContext';
import type { StackRouteConfig } from '../types/StackContainer';

// Port of RNS single-feature-tests/stack-v5/test-stack-toolbar-menu-state-android.
// Adaptations: the icons are the existing lynx-logo / search_black assets (the
// RNS SFT uses trees.jpg / search_white.png), the RN Buttons are
// SettingsButtons.

// Long on purpose: `maxLines` only affects the expanded title of a
// `medium` / `large` header, so it needs a title that actually wraps.
const HEADER_TITLE =
  'Toolbar Menu State with a deliberately long header title for maxLines';

const ALL_IDS = [
  'action',
  'filterA',
  'filterB',
  'sortAsc',
  'sortDesc',
  'plain',
  'submenu',
  'nested',
] as const;
type AllIds = (typeof ALL_IDS)[number];

// Annotated rather than `as const`: the union comes from the library, so the
// annotation is what checks these are real values, not a duplicate of it.
const HEADER_TYPES: StackHeaderTypeAndroid[] = ['small', 'medium', 'large'];
const HOST_COLOR_SCHEMES: StackHostColorScheme[] = ['inherit', 'light', 'dark'];

const MAX_LINES = ['1', '2'] as const;
type MaxLinesOption = (typeof MAX_LINES)[number];

const CMD_CHECKED_OPTIONS = ['no change', 'true', 'false'] as const;
type CmdCheckedOption = (typeof CMD_CHECKED_OPTIONS)[number];

const CMD_TITLE_OPTIONS = ['no change', 'Changed', 'undefined'] as const;
type CmdTitleOption = (typeof CMD_TITLE_OPTIONS)[number];

const CMD_HIDDEN_OPTIONS = ['no change', 'true', 'false', 'undefined'] as const;
type CmdHiddenOption = (typeof CMD_HIDDEN_OPTIONS)[number];

const CMD_ICON_OPTIONS = ['no change', 'search', 'undefined'] as const;
type CmdIconOption = (typeof CMD_ICON_OPTIONS)[number];

const CMD_MENU_TITLE_OPTIONS = ['no change', 'Header X', 'undefined'] as const;
type CmdMenuTitleOption = (typeof CMD_MENU_TITLE_OPTIONS)[number];

// Deliberately different from the `action` item's prop icon, so which of the
// two is on screen is unambiguous.
const COMMAND_ICON: PlatformIconAndroid = {
  type: 'imageSource',
  uri: commandIcon,
};

// Set on StackContainer, so it has to travel down to the screen rendering the
// controls.
const HostColorSchemeContext = createContext<{
  hostColorScheme: StackHostColorScheme;
  setHostColorScheme: (value: StackHostColorScheme) => void;
}>({ hostColorScheme: 'inherit', setHostColorScheme: () => {} });

function buildMenu(
  menuVersion: number,
  onItemPress: (id: string) => void,
  onGroupChange: (groupId: string, selectedIds: string[]) => void,
): StackHeaderToolbarMenuBaseAndroid {
  return {
    groups: [
      {
        groupId: 'filters',
        onSelectionChange: (ids) => onGroupChange('filters', ids),
      },
      {
        groupId: 'sort',
        singleSelection: true,
        onSelectionChange: (ids) => onGroupChange('sort', ids),
      },
    ],
    children: [
      {
        type: 'menuItem',
        id: 'action',
        title: 'Action',
        showAsAction: 'always',
        icon: {
          type: 'imageSource',
          uri: propIcon,
        },
        onPress: () => onItemPress('action'),
      },
      {
        type: 'menuItem',
        id: 'filterA',
        title: 'Filter A',
        groupId: 'filters',
        initialToggleState: true,
      },
      {
        type: 'menuItem',
        id: 'filterB',
        title: 'Filter B',
        groupId: 'filters',
      },
      {
        type: 'menuItem',
        id: 'sortAsc',
        title: 'Sort ascending',
        groupId: 'sort',
        initialToggleState: true,
      },
      {
        type: 'menuItem',
        id: 'sortDesc',
        title: 'Sort descending',
        groupId: 'sort',
      },
      {
        type: 'menuItem',
        id: 'plain',
        title: `Plain v${menuVersion}`,
        onPress: () => onItemPress('plain'),
      },
      {
        type: 'menu',
        id: 'submenu',
        title: 'More',
        menuTitle: 'More options',
        children: [
          {
            type: 'menuItem',
            id: 'nested',
            title: 'Nested',
            onPress: () => onItemPress('nested'),
          },
        ],
      },
    ],
  };
}

export default function App() {
  const [hostColorScheme, setHostColorScheme] =
    useState<StackHostColorScheme>('inherit');

  // Initial header config so the screen mounts its header in the same
  // commit - the setRouteOptions layout effect lands in a later native update
  // on Lynx. The effect takes over for runtime updates.
  const routeConfigs = useMemo<StackRouteConfig[]>(
    () => [
      {
        name: 'Main',
        Component: MainScreen,
        options: {
          headerConfig: {
            title: HEADER_TITLE,
            android: {
              toolbarMenu: buildMenu(
                1,
                () => {},
                () => {},
              ),
            },
          },
        },
      },
    ],
    [],
  );

  return (
    <HostColorSchemeContext.Provider
      value={{ hostColorScheme, setHostColorScheme }}
    >
      <StackContainer colorScheme={hostColorScheme} routeConfigs={routeConfigs} />
    </HostColorSchemeContext.Provider>
  );
}

function Result({ text }: { text: string }) {
  return (
    <text
      style={{
        color: 'black',
        fontSize: '15px',
        paddingLeft: '10px',
        paddingRight: '10px',
      }}
    >
      {text}
    </text>
  );
}

function MainScreen() {
  const { hostColorScheme, setHostColorScheme } = useContext(
    HostColorSchemeContext,
  );

  const [headerType, setHeaderType] = useState<StackHeaderTypeAndroid>('small');
  const [maxLines, setMaxLines] = useState<MaxLinesOption>('1');
  const [headerHidden, setHeaderHidden] = useState(false);
  const [menuVersion, setMenuVersion] = useState(1);
  // Bumped by "Re-send menu" only, so the effect below rebuilds a deep-equal
  // menu without changing anything in it.
  const [resendCount, setResendCount] = useState(0);

  const [lastEvent, setLastEvent] = useState<string | null>(null);
  const [eventCount, setEventCount] = useState(0);

  const [cmdTargetId, setCmdTargetId] = useState<AllIds>('filterB');
  const [cmdChecked, setCmdChecked] = useState<CmdCheckedOption>('no change');
  const [cmdTitle, setCmdTitle] = useState<CmdTitleOption>('no change');
  const [cmdHidden, setCmdHidden] = useState<CmdHiddenOption>('no change');
  const [cmdIcon, setCmdIcon] = useState<CmdIconOption>('no change');
  const [cmdMenuTitle, setCmdMenuTitle] =
    useState<CmdMenuTitleOption>('no change');

  const headerConfigRef = useRef<StackHeaderConfigRef>(null);
  const { setRouteOptions, routeKey } = useStackNavigationContext();

  const handleItemPress = useCallback((id: string) => {
    setLastEvent(`Pressed: ${id}`);
    setEventCount((count) => count + 1);
  }, []);

  const handleGroupChange = useCallback(
    (groupId: string, selectedIds: string[]) => {
      setLastEvent(`${groupId}: ${JSON.stringify(selectedIds)}`);
      setEventCount((count) => count + 1);
    },
    [],
  );

  useLayoutEffect(() => {
    setRouteOptions(routeKey, {
      headerConfig: {
        title: HEADER_TITLE,
        subtitle: 'Menu state survives header rebuilds',
        hidden: headerHidden,
        android: {
          type: headerType,
          maxLines: Number(maxLines),
          toolbarMenu: buildMenu(
            menuVersion,
            handleItemPress,
            handleGroupChange,
          ),
        },
      },
      headerConfigRef,
    });
  }, [
    setRouteOptions,
    routeKey,
    headerType,
    maxLines,
    headerHidden,
    menuVersion,
    resendCount,
    handleItemPress,
    handleGroupChange,
  ]);

  const sendCommand = useCallback(() => {
    const options: StackHeaderToolbarMenuElementOptionsAndroid = {
      ...(cmdChecked !== 'no change' && { checked: cmdChecked === 'true' }),
      ...(cmdTitle !== 'no change' && {
        title: cmdTitle === 'undefined' ? undefined : cmdTitle,
      }),
      ...(cmdHidden !== 'no change' && {
        hidden: cmdHidden === 'undefined' ? undefined : cmdHidden === 'true',
      }),
      ...(cmdIcon !== 'no change' && {
        icon: cmdIcon === 'undefined' ? undefined : COMMAND_ICON,
      }),
      ...(cmdMenuTitle !== 'no change' && {
        menuTitle: cmdMenuTitle === 'undefined' ? undefined : cmdMenuTitle,
      }),
    };
    headerConfigRef.current?.android?.updateToolbarMenuElements({
      id: cmdTargetId,
      options,
    });
  }, [cmdTargetId, cmdChecked, cmdTitle, cmdHidden, cmdIcon, cmdMenuTitle]);

  return (
    <ScrollViewMarker style={{ width: '100%', height: '100%' }}>
      <scroll-view
        scroll-y
        style={{ width: '100%', height: '100%', backgroundColor: 'white' }}
      >
        <view style={{ padding: '10px', paddingBottom: '50px', gap: '6px' }}>
          <Heading label="Last Event" />
          <Result text={lastEvent ?? '—'} />
          <Result text={`Events: ${eventCount}`} />

          <Heading label="Header rebuilds (state must survive)" />
          <SettingsPicker<StackHeaderTypeAndroid>
            label="headerType"
            value={headerType}
            items={HEADER_TYPES}
            onValueChange={setHeaderType}
          />
          <SettingsPicker<MaxLinesOption>
            label="maxLines"
            value={maxLines}
            items={[...MAX_LINES]}
            onValueChange={setMaxLines}
          />
          <SettingsPicker<StackHostColorScheme>
            label="hostColorScheme"
            value={hostColorScheme}
            items={HOST_COLOR_SCHEMES}
            onValueChange={setHostColorScheme}
          />
          <SettingsSwitch
            label="header hidden"
            value={headerHidden}
            onValueChange={setHeaderHidden}
          />

          <Heading label="Menu prop" />
          <SettingsButton
            label="Re-send menu (deep-equal)"
            onTap={() => setResendCount((count) => count + 1)}
          />
          <SettingsButton
            label={`Change toolbarMenu prop (v${menuVersion} → v${
              menuVersion + 1
            })`}
            onTap={() => setMenuVersion((version) => version + 1)}
          />

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
            items={[...CMD_CHECKED_OPTIONS]}
            onValueChange={setCmdChecked}
          />
          <SettingsPicker<CmdTitleOption>
            label="title"
            value={cmdTitle}
            items={[...CMD_TITLE_OPTIONS]}
            onValueChange={setCmdTitle}
          />
          <SettingsPicker<CmdHiddenOption>
            label="hidden"
            value={cmdHidden}
            items={[...CMD_HIDDEN_OPTIONS]}
            onValueChange={setCmdHidden}
          />
          <SettingsPicker<CmdIconOption>
            label="icon"
            value={cmdIcon}
            items={[...CMD_ICON_OPTIONS]}
            onValueChange={setCmdIcon}
          />
          <SettingsPicker<CmdMenuTitleOption>
            label="menuTitle"
            value={cmdMenuTitle}
            items={[...CMD_MENU_TITLE_OPTIONS]}
            onValueChange={setCmdMenuTitle}
          />
          <SettingsButton label="Send Command" onTap={sendCommand} />
        </view>
      </scroll-view>
    </ScrollViewMarker>
  );
}
