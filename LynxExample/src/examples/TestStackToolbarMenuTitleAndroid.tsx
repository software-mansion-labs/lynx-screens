import {
  Fragment,
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
} from '@lynx-js/react';
import type {
  PlatformIconAndroid,
  StackHeaderConfigRef,
  StackHeaderToolbarMenuElementAndroid,
  StackHeaderToolbarMenuElementOptionsAndroid,
  StackHeaderToolbarMenuItemShowAsActionAndroid,
} from 'lynx-screens';
import searchIcon from '../assets/search_black.png';
import {
  Heading,
  SettingsButton,
  SettingsPicker,
} from '../components/SettingsControls';
import { StackContainer } from '../components/StackContainer';
import { useStackNavigationContext } from '../hooks/useStackNavigationContext';

// Port of RNS single-feature-tests/stack-v5/test-stack-toolbar-menu-title-android.

const ID_OPTIONS = ['item-1', 'item-2', 'item-3'] as const;
type IdOption = (typeof ID_OPTIONS)[number];

const ICON_OPTIONS = ['undefined', 'searchIcon'] as const;
type IconOption = (typeof ICON_OPTIONS)[number];

const SHOW_AS_ACTION_OPTIONS = [
  'undefined',
  'never',
  'always',
  'alwaysWithText',
  'ifRoom',
  'ifRoomWithText',
] as const;
type ShowAsActionOption = (typeof SHOW_AS_ACTION_OPTIONS)[number];

const TITLE_CONDENSED_OPTIONS = ['undefined', 'Cond', 'Short'] as const;
type TitleCondensedOption = (typeof TITLE_CONDENSED_OPTIONS)[number];

const TOOLTIP_OPTIONS = ['undefined', 'Tooltip text', 'Hi!'] as const;
type TooltipOption = (typeof TOOLTIP_OPTIONS)[number];

// Title is fixed per id so the condensed/tooltip fallbacks are easy to spot.
const ITEM_TITLES: Record<IdOption, string> = {
  'item-1': 'First Item',
  'item-2': 'Second Item Title',
  'item-3': 'Third Item Long Title',
};

type CmdTitleOption = 'no change' | 'Cmd Title' | 'undefined';
type CmdCondensedOption = 'no change' | TitleCondensedOption;
type CmdTooltipOption = 'no change' | TooltipOption;

const CMD_TITLE_OPTIONS: CmdTitleOption[] = [
  'no change',
  'Cmd Title',
  'undefined',
];
const CMD_CONDENSED_OPTIONS: CmdCondensedOption[] = [
  'no change',
  ...TITLE_CONDENSED_OPTIONS,
];
const CMD_TOOLTIP_OPTIONS: CmdTooltipOption[] = [
  'no change',
  ...TOOLTIP_OPTIONS,
];

interface SlotConfig {
  id: IdOption;
  icon: IconOption;
  showAsAction: ShowAsActionOption;
  titleCondensed: TitleCondensedOption;
  tooltipText: TooltipOption;
}

type Slots = [SlotConfig, SlotConfig, SlotConfig];

const DEFAULT_SLOTS: Slots = [
  {
    id: 'item-1',
    icon: 'searchIcon',
    showAsAction: 'alwaysWithText',
    titleCondensed: 'Cond',
    tooltipText: 'Tooltip text',
  },
  {
    id: 'item-2',
    icon: 'searchIcon',
    showAsAction: 'always',
    titleCondensed: 'undefined',
    tooltipText: 'undefined',
  },
  {
    id: 'item-3',
    icon: 'undefined',
    showAsAction: 'never',
    titleCondensed: 'Short',
    tooltipText: 'undefined',
  },
];

function resolveIcon(option: IconOption): PlatformIconAndroid | undefined {
  switch (option) {
    case 'searchIcon':
      return {
        type: 'imageSource',
        uri: searchIcon,
      };
    default:
      return undefined;
  }
}

function resolveShowAsAction(
  v: ShowAsActionOption,
): StackHeaderToolbarMenuItemShowAsActionAndroid | undefined {
  return v === 'undefined' ? undefined : v;
}

function resolveOptionalString(v: string): string | undefined {
  return v === 'undefined' ? undefined : v;
}

function buildItems(slots: Slots): StackHeaderToolbarMenuElementAndroid[] {
  return slots.map(
    ({ id, icon, showAsAction, titleCondensed, tooltipText }) => ({
      type: 'menuItem',
      id,
      title: ITEM_TITLES[id],
      titleCondensed: resolveOptionalString(titleCondensed),
      tooltipText: resolveOptionalString(tooltipText),
      icon: resolveIcon(icon),
      showAsAction: resolveShowAsAction(showAsAction),
    }),
  );
}

function withOnPress(
  items: ReturnType<typeof buildItems>,
  onPress: (id: string) => void,
) {
  return items.map((item) => ({
    ...item,
    onPress: () => onPress(item.id),
  }));
}

function updateSlotAt(
  slots: Slots,
  index: number,
  patch: Partial<SlotConfig>,
): Slots {
  return slots.map((s, i) => (i === index ? { ...s, ...patch } : s)) as Slots;
}

const HEADER_TITLE = 'Title / Condensed / Tooltip';

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
              android: { toolbarMenu: { children: buildItems(DEFAULT_SLOTS) } },
            },
          },
        },
      ]}
    />
  );
}

function MainScreen() {
  const [slots, setSlots] = useState<Slots>(DEFAULT_SLOTS);
  const [lastClicked, setLastClicked] = useState<string | null>(null);

  const [cmdTargetId, setCmdTargetId] = useState<IdOption>('item-1');
  const [cmdTitle, setCmdTitle] = useState<CmdTitleOption>('no change');
  const [cmdCondensed, setCmdCondensed] =
    useState<CmdCondensedOption>('no change');
  const [cmdTooltip, setCmdTooltip] = useState<CmdTooltipOption>('no change');

  const headerConfigRef = useRef<StackHeaderConfigRef>(null);
  const { setRouteOptions, routeKey } = useStackNavigationContext();

  useLayoutEffect(() => {
    setRouteOptions(routeKey, {
      headerConfig: {
        title: HEADER_TITLE,
        android: {
          toolbarMenu: {
            children: withOnPress(buildItems(DEFAULT_SLOTS), setLastClicked),
          },
        },
      },
      headerConfigRef,
    });
  }, [setRouteOptions, routeKey]);

  const applySlots = useCallback(
    (next: Slots) => {
      setSlots(next);
      setRouteOptions(routeKey, {
        headerConfig: {
          title: HEADER_TITLE,
          android: {
            toolbarMenu: {
              children: withOnPress(buildItems(next), setLastClicked),
            },
          },
        },
      });
    },
    [setRouteOptions, routeKey],
  );

  const sendCommand = useCallback(() => {
    const options: StackHeaderToolbarMenuElementOptionsAndroid = {
      ...(cmdTitle !== 'no change' && {
        title: cmdTitle === 'undefined' ? undefined : cmdTitle,
      }),
      ...(cmdCondensed !== 'no change' && {
        titleCondensed: resolveOptionalString(cmdCondensed),
      }),
      ...(cmdTooltip !== 'no change' && {
        tooltipText: resolveOptionalString(cmdTooltip),
      }),
    };
    headerConfigRef.current?.android?.setToolbarMenuElementOptions(
      cmdTargetId,
      options,
    );
  }, [cmdTargetId, cmdTitle, cmdCondensed, cmdTooltip]);

  return (
    <scroll-view
      style={{ width: '100%', height: '100%', backgroundColor: 'white' }}
    >
      <view style={{ padding: '10px', paddingBottom: '50px', gap: '6px' }}>
        <Heading label="Send Command" />
        <SettingsPicker<IdOption>
          label="target id"
          value={cmdTargetId}
          items={[...ID_OPTIONS]}
          onValueChange={setCmdTargetId}
        />
        <SettingsPicker<CmdTitleOption>
          label="title"
          value={cmdTitle}
          items={CMD_TITLE_OPTIONS}
          onValueChange={setCmdTitle}
        />
        <SettingsPicker<CmdCondensedOption>
          label="titleCondensed"
          value={cmdCondensed}
          items={CMD_CONDENSED_OPTIONS}
          onValueChange={setCmdCondensed}
        />
        <SettingsPicker<CmdTooltipOption>
          label="tooltipText"
          value={cmdTooltip}
          items={CMD_TOOLTIP_OPTIONS}
          onValueChange={setCmdTooltip}
        />
        <SettingsButton label="Send Command" onTap={sendCommand} />

        <Heading label="Result" />
        <text style={{ color: 'black', fontSize: '15px' }}>
          Last clicked: {lastClicked ?? '—'}
        </text>

        <Heading label="Menu Items — Props" />
        <SlotControls
          slots={slots}
          updateSlot={(i, patch) => applySlots(updateSlotAt(slots, i, patch))}
        />
      </view>
    </scroll-view>
  );
}

interface SlotControlsProps {
  slots: Slots;
  updateSlot: (index: number, patch: Partial<SlotConfig>) => void;
}

function SlotControls({ slots, updateSlot }: SlotControlsProps) {
  return (
    <>
      {slots.map((slot, i) => (
        <Fragment key={i}>
          <text
            style={{
              color: 'black',
              fontSize: '16px',
              fontWeight: '600',
              marginTop: '8px',
            }}
          >
            Slot {i + 1} ({slot.id}) — title "{ITEM_TITLES[slot.id]}"
          </text>
          <SettingsPicker<IconOption>
            label="icon"
            value={slot.icon}
            items={[...ICON_OPTIONS]}
            onValueChange={(v) => updateSlot(i, { icon: v })}
          />
          <SettingsPicker<ShowAsActionOption>
            label="showAsAction"
            value={slot.showAsAction}
            items={[...SHOW_AS_ACTION_OPTIONS]}
            onValueChange={(v) => updateSlot(i, { showAsAction: v })}
          />
          <SettingsPicker<TitleCondensedOption>
            label="titleCondensed"
            value={slot.titleCondensed}
            items={[...TITLE_CONDENSED_OPTIONS]}
            onValueChange={(v) => updateSlot(i, { titleCondensed: v })}
          />
          <SettingsPicker<TooltipOption>
            label="tooltipText"
            value={slot.tooltipText}
            items={[...TOOLTIP_OPTIONS]}
            onValueChange={(v) => updateSlot(i, { tooltipText: v })}
          />
        </Fragment>
      ))}
    </>
  );
}
