import { useCallback, useLayoutEffect, useMemo, useState } from '@lynx-js/react';
import type { PlatformIconIOS, StackHeaderConfigProps } from 'lynx-screens';
import { Heading, LongText, SettingsButton } from '../components/SettingsControls';
import { StackContainer } from '../components/StackContainer';
import { useStackNavigationContext } from '../hooks/useStackNavigationContext';
import searchIcon from '../assets/search_black.png';
import arrowIcon from '../assets/arrow_small.png';

// Port of RNS single-feature-tests/stack-v5/test-stack-header-icon-ios.
// Adaptations: the RNS example reports events through a Toast; a "Last event"
// text is used instead. imageSource / templateSource take plain uri strings
// (Lynx bundler asset imports) instead of require() assets. The xcasset
// variant uses the custom-icon-fill imageset added to the example app's
// asset catalog.

// Adaptation: RNS examples rely on UIKit's automatic scroll-view content
// inset (contentInsetAdjustmentBehavior="automatic") to start content below
// the navigation bar. Lynx's scroll-view hardcodes that behavior to "never",
// and RNS does not offset v5 screen content below the header natively (yet)
// on iOS - approximate the inset with a static padding instead.
const CONTENT_PADDING_TOP = SystemInfo.platform === 'iOS' ? '120px' : '16px';

type IconVariant = 'sfSymbol' | 'xcasset' | 'imageSource' | 'templateSource';

const ICON_VARIANTS: IconVariant[] = [
  'sfSymbol',
  'xcasset',
  'imageSource',
  'templateSource',
];

function iconForVariant(variant: IconVariant): PlatformIconIOS {
  switch (variant) {
    case 'sfSymbol':
      return { type: 'sfSymbol', name: 'star.fill' };
    case 'xcasset':
      return { type: 'xcasset', name: 'custom-icon-fill' };
    case 'imageSource':
      return {
        type: 'imageSource',
        uri: searchIcon,
      };
    case 'templateSource':
      return {
        type: 'templateSource',
        uri: arrowIcon,
      };
  }
}

function nextVariant(current: IconVariant): IconVariant {
  const idx = ICON_VARIANTS.indexOf(current);
  return ICON_VARIANTS[(idx + 1) % ICON_VARIANTS.length]!;
}

function buildHeaderConfig(
  itemIconVariant: IconVariant,
  menuIconVariant: IconVariant,
  cycleMenuIcons: () => void,
  showEvent: (text: string) => void,
): StackHeaderConfigProps {
  const itemIcon = iconForVariant(itemIconVariant);
  const menuIcon = iconForVariant(menuIconVariant);

  return {
    title: 'Header Icons',
    ios: {
      trailingItems: [
        {
          type: 'item',
          id: 'icon-item',
          title: 'Actions',
          icon: itemIcon,
          onPress: () => showEvent('Item pressed'),
          menu: {
            type: 'menu',
            id: 'main-menu',
            onSelectionChange: (selection) =>
              showEvent('Selected: ' + selection.join(', ')),
            children: [
              {
                id: 'cycle-action',
                type: 'menuItem',
                itemType: 'action',
                title: `Cycle icons (${menuIconVariant})`,
                keepsMenuPresented: true,
                onPress: cycleMenuIcons,
              },
              {
                id: 'toggle-1',
                type: 'menuItem',
                itemType: 'toggle',
                title: 'Toggle 1',
                icon: menuIcon,
                keepsMenuPresented: true,
              },
              {
                id: 'toggle-2',
                type: 'menuItem',
                itemType: 'toggle',
                title: 'Toggle 2',
                icon: menuIcon,
                keepsMenuPresented: true,
              },
              {
                id: 'toggle-3',
                type: 'menuItem',
                itemType: 'toggle',
                title: 'Toggle 3',
                icon: menuIcon,
                keepsMenuPresented: true,
              },
              {
                id: 'submenu',
                type: 'menu',
                title: 'Submenu',
                icon: menuIcon,
                children: [
                  {
                    id: 'sub-toggle-1',
                    type: 'menuItem',
                    itemType: 'toggle',
                    title: 'Sub Toggle 1',
                    icon: menuIcon,
                    keepsMenuPresented: true,
                  },
                  {
                    id: 'sub-toggle-2',
                    type: 'menuItem',
                    itemType: 'toggle',
                    title: 'Sub Toggle 2',
                    icon: menuIcon,
                    keepsMenuPresented: true,
                  },
                  {
                    id: 'sub-toggle-3',
                    type: 'menuItem',
                    itemType: 'toggle',
                    title: 'Sub Toggle 3',
                    icon: menuIcon,
                    keepsMenuPresented: true,
                  },
                ],
              },
            ],
          },
        },
      ],
    },
  };
}

function ConfigScreen() {
  const navigation = useStackNavigationContext();

  const [itemIconVariant, setItemIconVariant] =
    useState<IconVariant>('sfSymbol');
  const [menuIconVariant, setMenuIconVariant] =
    useState<IconVariant>('sfSymbol');
  const [lastEvent, setLastEvent] = useState<string | null>(null);

  const showEvent = useCallback((text: string) => setLastEvent(text), []);

  const cycleMenuIcons = useCallback(() => {
    setMenuIconVariant((v) => nextVariant(v));
  }, []);

  const { setRouteOptions, routeKey } = navigation;
  const headerConfig = useMemo(
    () =>
      buildHeaderConfig(
        itemIconVariant,
        menuIconVariant,
        cycleMenuIcons,
        showEvent,
      ),
    [itemIconVariant, menuIconVariant, cycleMenuIcons, showEvent],
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
        <Heading label="Bar Button Item Icon" />
        <text style={{ color: 'black', fontSize: '15px' }}>
          {itemIconVariant}
        </text>
        <SettingsButton
          label="Cycle item icon"
          onTap={() => setItemIconVariant(nextVariant)}
        />
        <Heading label="Menu Toggles + Submenu Icon" />
        <text style={{ color: 'black', fontSize: '15px' }}>
          {menuIconVariant}
        </text>
        <SettingsButton label="Cycle menu icons" onTap={cycleMenuIcons} />
        <text style={{ color: 'black', fontSize: '15px' }}>
          Last event: {lastEvent ?? '—'}
        </text>
        <SettingsButton
          label="Push another screen"
          onTap={() => navigation.push('Home')}
        />
        <LongText paragraphs={4} />
      </view>
    </scroll-view>
  );
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
