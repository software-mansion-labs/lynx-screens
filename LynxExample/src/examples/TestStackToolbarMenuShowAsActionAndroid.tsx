import {
  Fragment,
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
} from '@lynx-js/react';
import type {
  StackHeaderConfigRef,
  StackHeaderToolbarMenuElementAndroid,
  StackHeaderToolbarMenuElementOptionsAndroid,
  StackHeaderToolbarMenuItemShowAsActionAndroid,
} from 'lynx-screens';
import {
  Heading,
  SettingsButton,
  SettingsPicker,
  SettingsSwitch,
} from '../components/SettingsControls';
import { StackContainer } from '../components/StackContainer';
import { useStackNavigationContext } from '../hooks/useStackNavigationContext';

type IdOption = 'item-1' | 'item-2' | 'item-3';
type ShowAsActionOption =
  | 'undefined'
  | 'never'
  | 'always'
  | 'alwaysWithText'
  | 'ifRoom'
  | 'ifRoomWithText';
type CmdShowAsActionOption = 'no change' | ShowAsActionOption;

const ID_OPTIONS: IdOption[] = ['item-1', 'item-2', 'item-3'];
const SHOW_AS_ACTION_OPTIONS: ShowAsActionOption[] = [
  'undefined',
  'never',
  'always',
  'alwaysWithText',
  'ifRoom',
  'ifRoomWithText',
];
const CMD_SHOW_AS_ACTION_OPTIONS: CmdShowAsActionOption[] = [
  'no change',
  ...SHOW_AS_ACTION_OPTIONS,
];

interface SlotConfig {
  include: boolean;
  id: IdOption;
  showAsAction: ShowAsActionOption;
}

type Slots = [SlotConfig, SlotConfig, SlotConfig];

const DEFAULT_SLOTS: Slots = [
  { include: true, id: 'item-1', showAsAction: 'undefined' },
  { include: true, id: 'item-2', showAsAction: 'undefined' },
  { include: true, id: 'item-3', showAsAction: 'undefined' },
];

function resolveShowAsAction(
  v: ShowAsActionOption,
): StackHeaderToolbarMenuItemShowAsActionAndroid | undefined {
  return v === 'undefined' ? undefined : v;
}

const ITEM_TITLES: Record<IdOption, string> = {
  'item-1': 'I1',
  'item-2': 'Item 2',
  'item-3': 'Item Number Three',
};

function buildItems(slots: Slots): StackHeaderToolbarMenuElementAndroid[] {
  return slots
    .filter((s) => s.include)
    .map(({ id, showAsAction }) => ({
      type: 'menuItem',
      id,
      title: ITEM_TITLES[id],
      showAsAction: resolveShowAsAction(showAsAction),
    }));
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

const HEADER_TITLE = 'Show As Action Test';

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
  const [cmdShowAsAction, setCmdShowAsAction] =
    useState<CmdShowAsActionOption>('no change');

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
      ...(cmdShowAsAction !== 'no change' && {
        showAsAction: resolveShowAsAction(cmdShowAsAction),
      }),
    };
    headerConfigRef.current?.android?.setToolbarMenuElementOptions(
      cmdTargetId,
      options,
    );
  }, [cmdTargetId, cmdShowAsAction]);

  return (
    <scroll-view
      style={{ width: '100%', height: '100%', backgroundColor: 'white' }}
    >
      <view style={{ padding: '10px', paddingBottom: '50px', gap: '6px' }}>
        <Heading label="Send Command" />
        <SettingsPicker<IdOption>
          label="target id"
          value={cmdTargetId}
          items={ID_OPTIONS}
          onValueChange={setCmdTargetId}
        />
        <SettingsPicker<CmdShowAsActionOption>
          label="showAsAction"
          value={cmdShowAsAction}
          items={CMD_SHOW_AS_ACTION_OPTIONS}
          onValueChange={setCmdShowAsAction}
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
            Slot {i + 1} (item-{i + 1})
          </text>
          <SettingsSwitch
            label="include"
            value={slot.include}
            onValueChange={(v) => updateSlot(i, { include: v })}
          />
          <SettingsPicker<ShowAsActionOption>
            label="showAsAction"
            value={slot.showAsAction}
            items={SHOW_AS_ACTION_OPTIONS}
            onValueChange={(v) => updateSlot(i, { showAsAction: v })}
          />
        </Fragment>
      ))}
    </>
  );
}
