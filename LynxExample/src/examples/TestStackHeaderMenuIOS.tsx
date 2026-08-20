import {
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from '@lynx-js/react';
import type {
  StackHeaderConfigProps,
  StackHeaderConfigRef,
  StackHeaderMenuItemOptionsIOS,
  StackHeaderMenuOptionsIOS,
} from 'lynx-screens';
import {
  Heading,
  LongText,
  SettingsButton,
  SettingsPicker,
} from '../components/SettingsControls';
import { StackContainer } from '../components/StackContainer';
import { useStackNavigationContext } from '../hooks/useStackNavigationContext';

// Port of RNS single-feature-tests/stack-v5/test-stack-header-menu-ios.
// Adaptation: the RNS example reports menu events (onPress, onSelectionChange)
// through a Toast; a "Last clicked" text is used instead (no toast component
// in this app).

const ACTION_IDS = [
  'subitem-1-1',
  'toggle-1-1',
  'toggle-1-2',
  'toggle-1-3',
  'radio-1-1',
  'radio-1-2',
  'radio-1-3',
  'title-action-1',
  'title-action-2',
] as const;
type ActionId = (typeof ACTION_IDS)[number];

const MENU_IDS = ['menu-1', 'submenu-1', 'subsubmenu-1', 'title-menu'] as const;
type MenuId = (typeof MENU_IDS)[number];

const TITLE_OPTIONS = [
  'no change',
  'Changed',
  'New Title',
  'undefined',
] as const;
type TitleOption = (typeof TITLE_OPTIONS)[number];

const ICON_OPTIONS = [
  'no change',
  'star.fill',
  'heart.fill',
  'bell.fill',
  'undefined',
] as const;
type IconOption = (typeof ICON_OPTIONS)[number];

const TOGGLE_STATE_OPTIONS = ['no change', 'true', 'false'] as const;
type ToggleStateOption = (typeof TOGGLE_STATE_OPTIONS)[number];

const DEFAULT_TRAILING_ITEMS_COUNT = 2;
const NO_CHANGE = 'NO_CHANGE';

function resolveTitle(
  option: TitleOption,
): StackHeaderMenuItemOptionsIOS['title'] | typeof NO_CHANGE {
  if (option === 'no change') return NO_CHANGE;
  return option === 'undefined' ? undefined : option;
}

function resolveIcon(
  option: IconOption,
): StackHeaderMenuItemOptionsIOS['icon'] | typeof NO_CHANGE {
  if (option === 'no change') return NO_CHANGE;
  if (option === 'undefined') return undefined;
  return { type: 'sfSymbol', name: option };
}

function resolveToggleState(
  option: ToggleStateOption,
): boolean | undefined | typeof NO_CHANGE {
  if (option === 'no change') return NO_CHANGE;
  return option === 'true';
}

// Adaptation: RNS examples rely on UIKit's automatic scroll-view content
// inset (contentInsetAdjustmentBehavior="automatic") to start content below
// the navigation bar. Lynx's scroll-view hardcodes that behavior to "never",
// and RNS does not offset v5 screen content below the header natively (yet)
// on iOS - approximate the inset with a static padding instead.
const CONTENT_PADDING_TOP = SystemInfo.platform === 'iOS' ? '120px' : '16px';

export default function App(props: { onRender?: () => void }) {
  return (
    <StackContainer
      routeConfigs={[
        {
          name: 'Home',
          Component: ConfigScreen,
        },
      ]}
    />
  );
}

function PressableWithFeedback({
  width,
  height,
}: {
  width: number;
  height: number;
}) {
  const [pressed, setPressed] = useState(false);

  return (
    <view
      style={{
        width: `${width}px`,
        height: `${height}px`,
        backgroundColor: pressed ? '#7986cb' : '#3f51b5',
        borderRadius: '4px',
      }}
      bindtouchstart={() => setPressed(true)}
      bindtouchend={() => setPressed(false)}
      bindtouchcancel={() => setPressed(false)}
    />
  );
}

function buildHeaderConfig(
  trailingItemsCount: number,
  showClicked: (text: string) => void,
  keepsMenuPresented: boolean,
): StackHeaderConfigProps {
  const trailingItems: NonNullable<
    NonNullable<StackHeaderConfigProps['ios']>['trailingItems']
  > = Array.from({ length: trailingItemsCount }).map((_, i) => ({
    type: 'item',
    id: `trailing-${i}`,
    title: `Menu ${i}`,
    // every second item is custom
    ...(i % 2 === 0 && {
      render: () => <PressableWithFeedback width={30} height={30} />,
    }),
    menu: {
      type: 'menu',
      id: `menu-${i}`,
      onSelectionChange: (selection) =>
        showClicked('Selected "' + selection.join('", "') + '"'),
      children: [
        {
          id: `subitem-${i}-1`,
          type: 'menuItem',
          itemType: 'action',
          title: `Action ${i}-1`,
          keepsMenuPresented,
          onPress: () => showClicked(`Clicked Action ${i}-1`),
        },
        {
          id: `toggle-${i}-1`,
          type: 'menuItem',
          itemType: 'toggle',
          title: `Toggle ${i}-1`,
          keepsMenuPresented,
        },
        {
          id: `toggle-${i}-2`,
          type: 'menuItem',
          itemType: 'toggle',
          title: `Toggle ${i}-2`,
          keepsMenuPresented,
        },
        {
          id: `toggle-${i}-3`,
          type: 'menuItem',
          itemType: 'toggle',
          title: `Toggle ${i}-3`,
          keepsMenuPresented,
        },
        {
          id: `submenu-${i}`,
          type: 'menu',
          title: `Submenu with Radio`,
          singleSelection: true,
          onSelectionChange: (selection) =>
            showClicked(`Selected unique "${selection}"`),
          children: [
            {
              id: `radio-${i}-1`,
              type: 'menuItem',
              title: `Radio ${i}-1`,
              initialToggleState: true,
            },
            {
              id: `subsubmenu-${i}`,
              type: 'menu',
              title: `SubSubMenu with Radio`,
              children: [
                {
                  id: `radio-${i}-2`,
                  type: 'menuItem',
                  title: `Radio ${i}-2`,
                },
                {
                  id: `radio-${i}-3`,
                  type: 'menuItem',
                  title: `Radio ${i}-3`,
                },
              ],
            },
          ],
        },
      ],
    },
  }));

  return {
    title: 'Header Menu',
    ios: {
      trailingItems,
      titleMenu: {
        type: 'menu',
        id: 'title-menu',
        children: [
          {
            id: 'title-action-1',
            type: 'menuItem',
            itemType: 'action',
            title: 'Title Action 1',
            onPress: () => showClicked('Clicked "Title Action 1"'),
          },
          {
            id: 'title-action-2',
            type: 'menuItem',
            itemType: 'action',
            title: 'Title Action 2',
            onPress: () => showClicked('Clicked "Title Action 2"'),
          },
        ],
      },
    },
  };
}

function ConfigScreen() {
  const navigation = useStackNavigationContext();
  const [trailingItemsCount, setTrailingItemsCount] = useState<number>(
    DEFAULT_TRAILING_ITEMS_COUNT,
  );
  const [keepsMenuPresented, setKeepsMenuPresented] = useState(false);
  const [lastClicked, setLastClicked] = useState<string | null>(null);

  const showClicked = useCallback(
    (text: string) => setLastClicked(text),
    [],
  );

  const headerConfigRef = useRef<StackHeaderConfigRef>(null);

  const { setRouteOptions, routeKey } = navigation;
  const headerConfig = useMemo(
    () => buildHeaderConfig(trailingItemsCount, showClicked, keepsMenuPresented),
    [trailingItemsCount, showClicked, keepsMenuPresented],
  );

  useLayoutEffect(() => {
    setRouteOptions(routeKey, {
      headerConfig,
      headerConfigRef,
    });
  }, [headerConfig, setRouteOptions, routeKey]);

  const [actionId, setActionId] = useState<ActionId>('subitem-1-1');
  const [actionTitle, setActionTitle] = useState<TitleOption>('no change');
  const [actionIcon, setActionIcon] = useState<IconOption>('no change');
  const [actionToggle, setActionToggle] =
    useState<ToggleStateOption>('no change');

  const [menuId, setMenuId] = useState<MenuId>('submenu-1');
  const [menuTitle, setMenuTitle] = useState<TitleOption>('no change');
  const [menuIcon, setMenuIcon] = useState<IconOption>('no change');

  const sendActionCommand = useCallback(() => {
    const options: StackHeaderMenuItemOptionsIOS = {};
    const resolvedTitle = resolveTitle(actionTitle);
    if (resolvedTitle !== NO_CHANGE) options.title = resolvedTitle;
    const resolvedIcon = resolveIcon(actionIcon);
    if (resolvedIcon !== NO_CHANGE) options.icon = resolvedIcon;
    const resolvedToggleState = resolveToggleState(actionToggle);
    if (resolvedToggleState !== NO_CHANGE)
      options.toggleState = resolvedToggleState;

    headerConfigRef.current?.ios?.setMenuItemOptions(actionId, options);
  }, [actionId, actionTitle, actionIcon, actionToggle]);

  const sendMenuCommand = useCallback(() => {
    const options: StackHeaderMenuOptionsIOS = {};
    const resolvedTitle = resolveTitle(menuTitle);
    if (resolvedTitle !== NO_CHANGE) options.title = resolvedTitle;
    const resolvedIcon = resolveIcon(menuIcon);
    if (resolvedIcon !== NO_CHANGE) options.icon = resolvedIcon;

    headerConfigRef.current?.ios?.setMenuOptions(menuId, options);
  }, [menuId, menuTitle, menuIcon]);

  return (
    <scroll-view
      scroll-y
      style={{ width: '100%', height: '100%', backgroundColor: 'white' }}
    >
      <view
        style={{
          padding: '16px',
          paddingTop: CONTENT_PADDING_TOP,
          paddingBottom: '50px',
          gap: '6px',
        }}
      >
        <SettingsButton
          label={`Toggle trailing items count (${trailingItemsCount}/4)`}
          onTap={() => setTrailingItemsCount((count) => (count + 1) % 5)}
        />
        <SettingsButton
          label={`keepsMenuPresented: ${keepsMenuPresented}`}
          onTap={() => setKeepsMenuPresented((prev) => !prev)}
        />

        <Heading label="setMenuItemOptions (Menu 1)" />
        <SettingsPicker<ActionId>
          label="target id"
          value={actionId}
          items={[...ACTION_IDS]}
          onValueChange={setActionId}
        />
        <SettingsPicker<TitleOption>
          label="title"
          value={actionTitle}
          items={[...TITLE_OPTIONS]}
          onValueChange={setActionTitle}
        />
        <SettingsPicker<IconOption>
          label="icon"
          value={actionIcon}
          items={[...ICON_OPTIONS]}
          onValueChange={setActionIcon}
        />
        <SettingsPicker<ToggleStateOption>
          label="toggleState"
          value={actionToggle}
          items={[...TOGGLE_STATE_OPTIONS]}
          onValueChange={setActionToggle}
        />
        <SettingsButton
          label="Send setMenuItemOptions"
          onTap={sendActionCommand}
        />

        <Heading label="setMenuOptions (Menu 1)" />
        <SettingsPicker<MenuId>
          label="target id"
          value={menuId}
          items={[...MENU_IDS]}
          onValueChange={setMenuId}
        />
        <SettingsPicker<TitleOption>
          label="title"
          value={menuTitle}
          items={[...TITLE_OPTIONS]}
          onValueChange={setMenuTitle}
        />
        <SettingsPicker<IconOption>
          label="icon"
          value={menuIcon}
          items={[...ICON_OPTIONS]}
          onValueChange={setMenuIcon}
        />
        <SettingsButton label="Send setMenuOptions" onTap={sendMenuCommand} />
        <text style={{ color: 'black', fontSize: '15px' }}>
          Last clicked: {lastClicked ?? '—'}
        </text>
        <LongText paragraphs={10} />
      </view>
    </scroll-view>
  );
}
