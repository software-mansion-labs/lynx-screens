import { useCallback, useLayoutEffect, useMemo, useState } from '@lynx-js/react';
import type {
  StackHeaderConfigProps,
  StackHeaderMenuIOS,
  StackHeaderMenuElementIOS,
} from 'lynx-screens';
import {
  Heading,
  SettingsButton,
  SettingsPicker,
  SettingsSwitch,
} from '../components/SettingsControls';
import { StackContainer } from '../components/StackContainer';
import { useStackNavigationContext } from '../hooks/useStackNavigationContext';

// Port of RNS single-feature-tests/stack-v5/test-stack-header-selective-updates-ios.
// Adaptation: the RNS example reports events through a Toast; a "Last event"
// text is used instead (no toast component in this app).

// Adaptation: RNS examples rely on UIKit's automatic scroll-view content
// inset (contentInsetAdjustmentBehavior="automatic") to start content below
// the navigation bar. Lynx's scroll-view hardcodes that behavior to "never",
// and RNS does not offset v5 screen content below the header natively (yet)
// on iOS - approximate the inset with a static padding instead.
const CONTENT_PADDING_TOP = SystemInfo.platform === 'iOS' ? '120px' : '16px';

const MENU_MODES = ['none', 'single', 'multi'] as const;
type MenuMode = (typeof MENU_MODES)[number];

interface ItemConfig {
  titleVariant: 'foo' | 'bar';
  customView: boolean;
  menuMode: MenuMode;
}

const DEFAULT_ITEMS: ItemConfig[] = [
  { titleVariant: 'foo', customView: false, menuMode: 'none' },
  { titleVariant: 'foo', customView: false, menuMode: 'none' },
];

const THIRD_ITEM_DEFAULT: ItemConfig = {
  titleVariant: 'foo',
  customView: false,
  menuMode: 'none',
};

function itemTitle(index: number, variant: 'foo' | 'bar'): string {
  return variant === 'foo' ? `Foo ${index + 1}` : `Bar ${index + 1}`;
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

function buildMenu(
  itemIndex: number,
  menuMode: 'single' | 'multi',
  showEvent: (text: string) => void,
): StackHeaderMenuIOS {
  const singleSelection = menuMode === 'single';

  const children: StackHeaderMenuElementIOS[] = [
    {
      id: `Option-${itemIndex}-A`,
      type: 'menuItem',
      itemType: 'toggle',
      initialToggleState: true,
      title: `Option-${itemIndex}-A`,
    },
    {
      id: `Option-${itemIndex}-B`,
      type: 'menuItem',
      itemType: 'toggle',
      title: `Option-${itemIndex}-B`,
    },
    {
      id: `Option-${itemIndex}-C`,
      type: 'menuItem',
      itemType: 'toggle',
      title: `Option-${itemIndex}-C`,
    },
  ];

  return {
    type: 'menu',
    id: `menu-${itemIndex}`,
    singleSelection,
    onSelectionChange: (selection) =>
      showEvent(
        `Item ${itemIndex + 1} [${menuMode}]: "${selection.join('", "')}"`,
      ),
    children,
  };
}

type StackHeaderItems = NonNullable<
  StackHeaderConfigProps['ios']
>['trailingItems'];

function buildHeaderConfig(
  items: ItemConfig[],
  showEvent: (text: string) => void,
): StackHeaderConfigProps {
  const trailingItems: StackHeaderItems = items.flatMap((item, i) => {
    const menu =
      item.menuMode !== 'none'
        ? buildMenu(i, item.menuMode, showEvent)
        : undefined;

    let outItems: NonNullable<StackHeaderItems> = [];

    if (item.customView) {
      outItems.push({
        type: 'item',
        id: `trailing-${i}`,
        render: () => <PressableWithFeedback width={30} height={30} />,
        menu,
      });
    } else {
      outItems.push({
        type: 'item',
        id: `trailing-${i}`,
        title: itemTitle(i, item.titleVariant),
        onPress: () => showEvent(`Pressed Item ${i + 1}`),
        menu,
      });
    }

    outItems.push({ type: 'spacer', id: `spacer-${i}`, sizing: 'flexible' });

    return outItems;
  });

  return {
    title: 'Selective Updates',
    ios: {
      trailingItems,
    },
  };
}

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

function ConfigScreen() {
  const navigation = useStackNavigationContext();
  const [items, setItems] = useState<ItemConfig[]>(DEFAULT_ITEMS);
  const [showThirdItem, setShowThirdItem] = useState(false);
  const [thirdItemConfig, setThirdItemConfig] =
    useState<ItemConfig>(THIRD_ITEM_DEFAULT);
  const [lastEvent, setLastEvent] = useState<string | null>(null);

  const allItems = useMemo(
    () => (showThirdItem ? [...items, thirdItemConfig] : items),
    [items, showThirdItem, thirdItemConfig],
  );

  const showEvent = useCallback((text: string) => setLastEvent(text), []);

  const updateItem = useCallback(
    (index: number, update: Partial<ItemConfig>) => {
      if (index === 2) {
        setThirdItemConfig((prev) => ({ ...prev, ...update }));
      } else {
        setItems((prev) =>
          prev.map((item, i) => (i === index ? { ...item, ...update } : item)),
        );
      }
    },
    [],
  );

  const { setRouteOptions, routeKey } = navigation;
  const headerConfig = useMemo(
    () => buildHeaderConfig(allItems, showEvent),
    [allItems, showEvent],
  );

  useLayoutEffect(() => {
    setRouteOptions(routeKey, {
      headerConfig,
    });
  }, [headerConfig, setRouteOptions, routeKey]);

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
          gap: '12px',
        }}
      >
        <text style={{ color: 'black', fontSize: '14px' }}>
          On iOS 26 and above, item update is visible as visual flash / blur.
          Updating single item should NOT make other items flash. Updating the
          menu should NOT make any item flash. Updating the title when custom
          item is set should NOT make it flash.
        </text>
        <text style={{ color: 'black', fontSize: '15px' }}>
          Last event: {lastEvent ?? '—'}
        </text>
        {allItems.map((item, i) => (
          <view
            key={i}
            style={{
              gap: '4px',
              borderBottomWidth: '1px',
              borderBottomColor: '#e0e0e0',
              paddingBottom: '12px',
            }}
          >
            <Heading label={`Item ${i + 1}`} />
            <SettingsPicker<'foo' | 'bar'>
              label="Title"
              value={item.titleVariant}
              onValueChange={(v) => updateItem(i, { titleVariant: v })}
              items={['foo', 'bar']}
            />
            <SettingsSwitch
              label="Custom view"
              value={item.customView}
              onValueChange={(v) => updateItem(i, { customView: v })}
            />
            <SettingsPicker<MenuMode>
              label="Menu"
              value={item.menuMode}
              onValueChange={(v) => updateItem(i, { menuMode: v })}
              items={[...MENU_MODES]}
            />
          </view>
        ))}
        <SettingsButton
          label={showThirdItem ? 'Remove Item 3' : 'Add Item 3'}
          onTap={() => setShowThirdItem((prev) => !prev)}
        />
      </view>
    </scroll-view>
  );
}
