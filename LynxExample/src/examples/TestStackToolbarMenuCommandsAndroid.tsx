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
type TitleOption =
  | 'Title A'
  | 'Title B'
  | 'Title C'
  | 'Long Title'
  | 'Changed'
  | 'undefined';
type HiddenOption = 'true' | 'false' | 'undefined';

type CmdTitleOption = TitleOption | 'no change';
type CmdHiddenOption = HiddenOption | 'no change';

const ID_OPTIONS: IdOption[] = ['item-1', 'item-2', 'item-3'];
const TITLE_OPTIONS: TitleOption[] = [
  'Title A',
  'Title B',
  'Title C',
  'Long Title',
  'Changed',
  'undefined',
];
const HIDDEN_OPTIONS: HiddenOption[] = ['true', 'false', 'undefined'];
const CMD_TITLE_OPTIONS: CmdTitleOption[] = ['no change', ...TITLE_OPTIONS];
const CMD_HIDDEN_OPTIONS: CmdHiddenOption[] = ['no change', ...HIDDEN_OPTIONS];

interface SlotConfig {
  include: boolean;
  id: IdOption;
  title: TitleOption;
  hidden: HiddenOption;
}

type Slots = [SlotConfig, SlotConfig, SlotConfig];

const DEFAULT_SLOTS: Slots = [
  { include: true, id: 'item-1', title: 'Title A', hidden: 'false' },
  { include: true, id: 'item-2', title: 'Title B', hidden: 'false' },
  { include: true, id: 'item-3', title: 'Title C', hidden: 'false' },
];

function resolveTitle(t: TitleOption): string | undefined {
  return t === 'undefined' ? undefined : t;
}

function resolveHidden(h: HiddenOption): boolean | undefined {
  return h === 'undefined' ? undefined : h === 'true';
}

function buildItems(slots: Slots): StackHeaderToolbarMenuElementAndroid[] {
  return slots
    .filter((s) => s.include)
    .map(({ id, title, hidden }) => ({
      type: 'menuItem',
      id,
      title: resolveTitle(title),
      hidden: resolveHidden(hidden),
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

const HEADER_TITLE = 'Toolbar Menu Commands Test';

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
  const [cmdHidden, setCmdHidden] = useState<CmdHiddenOption>('no change');

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
      ...(cmdTitle !== 'no change' && { title: resolveTitle(cmdTitle) }),
      ...(cmdHidden !== 'no change' && { hidden: resolveHidden(cmdHidden) }),
    };
    headerConfigRef.current?.android?.updateToolbarMenuElements({
      id: cmdTargetId,
      options,
    });
  }, [cmdTargetId, cmdTitle, cmdHidden]);

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
          <SettingsPicker<TitleOption>
            label="title"
            value={slot.title}
            items={TITLE_OPTIONS}
            onValueChange={(v) => updateSlot(i, { title: v })}
          />
          <SettingsPicker<HiddenOption>
            label="hidden"
            value={slot.hidden}
            items={HIDDEN_OPTIONS}
            onValueChange={(v) => updateSlot(i, { hidden: v })}
          />
        </Fragment>
      ))}
    </>
  );
}
