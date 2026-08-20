import { useCallback, useLayoutEffect, useRef, useState } from '@lynx-js/react';
import type {
  PlatformIconAndroid,
  StackHeaderConfigRef,
  StackHeaderToolbarMenuBaseAndroid,
} from 'lynx-screens';
import { ScrollViewMarker } from 'lynx-screens';
import { Heading, SettingsButton } from '../components/SettingsControls';
import { StackContainer } from '../components/StackContainer';
import { useStackNavigationContext } from '../hooks/useStackNavigationContext';

// Port of RNS single-feature-tests/stack-v5/test-stack-toolbar-menu-batch-commands-android.
// Adaptation: imageSource icons take plain uri strings (no RN asset objects).

const FRUIT_IDS = ['apple', 'banana', 'cherry', 'date'] as const;

const FRUIT_ITEMS: { id: string; title: string }[] = [
  { id: 'apple', title: 'Apple' },
  { id: 'banana', title: 'Banana' },
  { id: 'cherry', title: 'Cherry' },
  { id: 'date', title: 'Date' },
];

const VIEW_ITEMS: { id: string; title: string }[] = [
  { id: 'list', title: 'List' },
  { id: 'grid', title: 'Grid' },
];

function buildMenu(
  onGroupChange: (groupId: string, selectedIds: string[]) => void,
): StackHeaderToolbarMenuBaseAndroid {
  const groups = [
    {
      groupId: 'fruits',
      singleSelection: false,
      onSelectionChange: (ids: string[]) => onGroupChange('fruits', ids),
    },
    {
      groupId: 'view',
      singleSelection: true,
      onSelectionChange: (ids: string[]) => onGroupChange('view', ids),
    },
  ];

  const fruitItems: StackHeaderToolbarMenuBaseAndroid['children'] =
    FRUIT_ITEMS.map(({ id, title }) => ({
      type: 'menuItem',
      id,
      title,
      groupId: 'fruits',
      initialToggleState: id === 'apple',
    }));

  const viewItems: StackHeaderToolbarMenuBaseAndroid['children'] =
    VIEW_ITEMS.map(({ id, title }) => ({
      type: 'menuItem',
      id,
      title,
      groupId: 'view',
      initialToggleState: id === 'list',
    }));

  const children: StackHeaderToolbarMenuBaseAndroid['children'] = [
    ...(fruitItems ?? []),
    ...(viewItems ?? []),
  ];

  return {
    groups,
    children,
  };
}

const HEADER_TITLE = 'Toolbar Menu Batch Commands Test';

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
              android: { toolbarMenu: buildMenu(() => {}) },
            },
          },
        },
      ]}
    />
  );
}

function MainScreen() {
  const [eventLog, setEventLog] = useState<string[]>([]);
  const [eventCount, setEventCount] = useState(0);
  const [appleInToolbar, setAppleInToolbar] = useState(false);

  const headerConfigRef = useRef<StackHeaderConfigRef>(null);
  const { setRouteOptions, routeKey } = useStackNavigationContext();

  const handleGroupChange = useCallback(
    (groupId: string, selectedIds: string[]) => {
      const msg = `${groupId}: ${JSON.stringify(selectedIds)}`;
      setEventCount((prev) => prev + 1);
      setEventLog((prev) => [msg, ...prev].slice(0, 6));
    },
    [],
  );

  useLayoutEffect(() => {
    setRouteOptions(routeKey, {
      headerConfig: {
        title: HEADER_TITLE,
        android: {
          toolbarMenu: buildMenu(handleGroupChange),
        },
      },
      headerConfigRef,
    });
  }, [setRouteOptions, routeKey, handleGroupChange]);

  // A large image with a random seed each call, so every download is unique and
  // uncached (even across app restarts) and the async load stays visibly slow.
  // Requires network access. The icon is only visible while Apple is shown in
  // the toolbar (overflow menu items don't render icons).
  const nextPhotoIcon = useCallback((): PlatformIconAndroid => {
    const seed = Math.floor(Math.random() * 1_000_000_000);
    return {
      type: 'imageSource',
      uri: `https://picsum.photos/seed/rns-${seed}/5000`,
    };
  }, []);

  // A guaranteed-to-fail image. The load never yields a drawable; the queue
  // must still complete the batch (icon cleared) rather than wait forever for a
  // callback that never comes.
  const failingIcon = useCallback(
    (): PlatformIconAndroid => ({
      type: 'imageSource',
      uri: 'https://invalid.invalid/icon.png',
    }),
    [],
  );

  const resetLog = useCallback(() => {
    setEventLog([]);
    setEventCount(0);
  }, []);

  // Case #1: a multi-element batch fires one coalesced event per affected
  // group (not one per checked item).
  const selectAll = useCallback(() => {
    headerConfigRef.current?.android?.updateToolbarMenuElements(
      FRUIT_IDS.map((id) => ({ id, options: { checked: true } })),
    );
  }, []);

  const deselectAll = useCallback(() => {
    headerConfigRef.current?.android?.updateToolbarMenuElements(
      FRUIT_IDS.map((id) => ({ id, options: { checked: false } })),
    );
  }, []);

  // Case #2: one batch touching two groups emits one coalesced event PER
  // affected group, in update order (fruits, then view).
  const batchAcrossGroups = useCallback(() => {
    headerConfigRef.current?.android?.updateToolbarMenuElements([
      { id: 'cherry', options: { checked: true } },
      { id: 'grid', options: { checked: true } },
    ]);
  }, []);

  // Case #3: a single-object (non-array) argument is normalized to a
  // one-element batch.
  const singleObjectUpdate = useCallback(() => {
    headerConfigRef.current?.android?.updateToolbarMenuElements({
      id: 'banana',
      options: { checked: true },
    });
  }, []);

  // showAsAction is updatable via the view command — moves Apple between the
  // toolbar (icon visible) and the overflow menu (checkbox visible) at runtime.
  const toggleAppleShowAsAction = useCallback(() => {
    headerConfigRef.current?.android?.updateToolbarMenuElements({
      id: 'apple',
      options: { showAsAction: appleInToolbar ? 'never' : 'always' },
    });
    setAppleInToolbar((prev) => !prev);
  }, [appleInToolbar]);

  // Case #4: a batch mixing an async image load (Apple) with a plain check
  // (cherry) is applied atomically — the icon appears and the single fruits
  // event fires together, only after the image has loaded, never cherry first
  // and Apple later.
  const batchWithImageLoad = useCallback(() => {
    headerConfigRef.current?.android?.updateToolbarMenuElements([
      { id: 'apple', options: { checked: true, icon: nextPhotoIcon() } },
      { id: 'cherry', options: { checked: true } },
    ]);
  }, [nextPhotoIcon]);

  // Case #5: two back-to-back commands on Apple. The first loads a slow remote
  // image alongside checked:true; the second unchecks Apple synchronously. With
  // the queue they are serialized, so the LAST event reflects the SECOND
  // command (Apple absent). Without it, the first command's late download would
  // land last and wrongly re-check Apple.
  const runOrderingRace = useCallback(() => {
    const android = headerConfigRef.current?.android;
    android?.updateToolbarMenuElements([
      { id: 'apple', options: { checked: true, icon: nextPhotoIcon() } },
    ]);
    android?.updateToolbarMenuElements([
      { id: 'apple', options: { checked: false } },
    ]);
  }, [nextPhotoIcon]);

  // Case #6: a batch whose image fails to load. The failed load resolves to "no
  // icon" (Apple's icon is cleared) and the batch still completes, so the
  // following batch (checking Banana) is applied and emits its event.
  const runFailingImageRepro = useCallback(() => {
    const android = headerConfigRef.current?.android;
    android?.updateToolbarMenuElements([
      { id: 'apple', options: { checked: true, icon: failingIcon() } },
    ]);
    android?.updateToolbarMenuElements([
      { id: 'banana', options: { checked: true } },
    ]);
  }, [failingIcon]);

  // Case #7: the same id appears twice in one batch, applied in order. The first
  // update checks Apple with a failing icon and the second sets a real photo (no
  // check), so Apple ends up checked (the first update's check is kept) and shows
  // the photo (the last icon wins over the failed one). A following batch then
  // checks Cherry.
  const runDuplicateIdRepro = useCallback(() => {
    const android = headerConfigRef.current?.android;
    android?.updateToolbarMenuElements([
      { id: 'apple', options: { checked: true, icon: failingIcon() } },
      { id: 'apple', options: { icon: nextPhotoIcon() } },
    ]);
    android?.updateToolbarMenuElements([
      { id: 'cherry', options: { checked: true } },
    ]);
  }, [failingIcon, nextPhotoIcon]);

  return (
    <ScrollViewMarker style={{ width: '100%', height: '100%' }}>
      <scroll-view
        scroll-y
        style={{ width: '100%', height: '100%', backgroundColor: 'white' }}
      >
        <view style={{ padding: '10px', paddingBottom: '50px', gap: '6px' }}>
          <Heading label="Batch Commands" />
          <SettingsButton label="Select All (1 event)" onTap={selectAll} />
          <SettingsButton label="Deselect All (1 event)" onTap={deselectAll} />
          <SettingsButton
            label="Batch across groups (2 events)"
            onTap={batchAcrossGroups}
          />
          <SettingsButton
            label="Single object update (1 event)"
            onTap={singleObjectUpdate}
          />
          <SettingsButton
            label={
              appleInToolbar ? 'Move Apple to overflow' : 'Move Apple to toolbar'
            }
            onTap={toggleAppleShowAsAction}
          />
          <SettingsButton
            label="Batch: image + check (atomic)"
            onTap={batchWithImageLoad}
          />
          <SettingsButton
            label="Ordering race (last: Apple absent)"
            onTap={runOrderingRace}
          />
          <SettingsButton
            label="Failing image + follow-up"
            onTap={runFailingImageRepro}
          />
          <SettingsButton
            label="Duplicate id: merge + last icon"
            onTap={runDuplicateIdRepro}
          />
          <SettingsButton label="Reset log (menu state kept)" onTap={resetLog} />

          <text style={{ color: '#3f51b5', fontSize: '13px', marginTop: '8px' }}>
            Move Apple to the toolbar to see its loaded icon (overflow items don't
            render icons); its checkbox is only visible in the overflow menu. Icon
            & showAsAction changes emit no events. Menu checked state persists
            across taps — Reset log clears only the counter and log.
          </text>

          <Heading label={`Events received: ${eventCount}`} />
          <text style={{ color: '#3f51b5', fontSize: '13px' }}>Newest first</text>
          {eventLog.length === 0 ? (
            <text style={{ color: 'black', fontSize: '15px' }}>—</text>
          ) : (
            eventLog.map((entry, i) => (
              <text
                key={`${i}-${entry}`}
                style={{ color: 'black', fontSize: '15px' }}
              >
                {i === 0 ? '▶ ' : '  '}
                {entry}
              </text>
            ))
          )}
        </view>
      </scroll-view>
    </ScrollViewMarker>
  );
}
