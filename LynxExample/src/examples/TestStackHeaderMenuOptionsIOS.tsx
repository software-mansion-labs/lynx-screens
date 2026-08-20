import { useLayoutEffect, useMemo, useState } from '@lynx-js/react';
import type { StackHeaderConfigProps } from 'lynx-screens';
import { LongText, SettingsButton } from '../components/SettingsControls';
import { StackContainer } from '../components/StackContainer';
import { useStackNavigationContext } from '../hooks/useStackNavigationContext';

// Port of RNS single-feature-tests/stack-v5/test-stack-header-menu-options-ios.

// Adaptation: RNS examples rely on UIKit's automatic scroll-view content
// inset (contentInsetAdjustmentBehavior="automatic") to start content below
// the navigation bar. Lynx's scroll-view hardcodes that behavior to "never",
// and RNS does not offset v5 screen content below the header natively (yet)
// on iOS - approximate the inset with a static padding instead.
const CONTENT_PADDING_TOP = SystemInfo.platform === 'iOS' ? '120px' : '16px';

function buildHeaderConfig(
  displayInline: boolean,
  nestedDisplayInline: boolean,
  displayAsPalette: boolean,
  paletteDisplayInline: boolean,
): StackHeaderConfigProps {
  return {
    title: 'Menu Options',
    ios: {
      trailingItems: [
        {
          type: 'item',
          id: 'menu-button',
          title: 'Options',
          icon: { type: 'sfSymbol', name: 'ellipsis' },
          menu: {
            type: 'menu',
            id: 'root-menu',
            children: [
              {
                id: 'action-copy',
                type: 'menuItem',
                itemType: 'action',
                title: 'Copy',
                icon: { type: 'sfSymbol', name: 'doc.on.doc' },
              },
              {
                id: 'action-paste',
                type: 'menuItem',
                itemType: 'action',
                title: 'Paste',
                icon: { type: 'sfSymbol', name: 'doc.on.clipboard' },
              },
              {
                id: 'action-share',
                type: 'menuItem',
                itemType: 'action',
                title: 'Share',
                icon: { type: 'sfSymbol', name: 'square.and.arrow.up' },
              },
              {
                id: 'submenu-sorting',
                type: 'menu',
                title: 'Sort By',
                displayInline,
                icon: { type: 'sfSymbol', name: 'arrow.up.arrow.down' },
                singleSelection: true,
                children: [
                  {
                    id: 'sort-name',
                    type: 'menuItem',
                    title: 'Name',
                    icon: { type: 'sfSymbol', name: 'textformat.abc' },
                    initialToggleState: true,
                  },
                  {
                    id: 'sort-date',
                    type: 'menuItem',
                    title: 'Date',
                    icon: { type: 'sfSymbol', name: 'calendar' },
                  },
                  {
                    id: 'sort-size',
                    type: 'menuItem',
                    title: 'Size',
                    icon: { type: 'sfSymbol', name: 'internaldrive' },
                  },
                  {
                    id: 'submenu-rating',
                    type: 'menu',
                    title: 'Rating',
                    displayInline: nestedDisplayInline,
                    icon: { type: 'sfSymbol', name: 'star' },
                    children: [
                      {
                        id: 'rating-best-reviews',
                        type: 'menuItem',
                        title: 'Best Reviews',
                        icon: { type: 'sfSymbol', name: 'star.fill' },
                      },
                      {
                        id: 'rating-most-reviews',
                        type: 'menuItem',
                        title: 'Most Reviews',
                        icon: { type: 'sfSymbol', name: 'text.bubble' },
                      },
                      {
                        id: 'rating-highest-rated',
                        type: 'menuItem',
                        title: 'Highest Rated',
                        icon: { type: 'sfSymbol', name: 'hand.thumbsup' },
                      },
                    ],
                  },
                ],
              },
              {
                id: 'action-delete',
                type: 'menuItem',
                itemType: 'action',
                title: 'Delete',
                icon: { type: 'sfSymbol', name: 'trash' },
              },
            ],
          },
        },
        {
          type: 'spacer',
          id: 'palette-spacer',
          sizing: 'flexible',
        },
        {
          type: 'item',
          id: 'palette-button',
          title: 'Palette',
          icon: { type: 'sfSymbol', name: 'paintpalette' },
          menu: {
            type: 'menu',
            id: 'palette-root',
            children: [
              {
                id: 'palette-submenu',
                type: 'menu',
                title: 'Text Style',
                displayAsPalette,
                displayInline: paletteDisplayInline,
                icon: { type: 'sfSymbol', name: 'textformat' },
                children: [
                  {
                    id: 'style-bold',
                    type: 'menuItem',
                    itemType: 'action',
                    title: 'Bold',
                    icon: { type: 'sfSymbol', name: 'bold' },
                  },
                  {
                    id: 'style-italic',
                    type: 'menuItem',
                    itemType: 'action',
                    title: 'Italic',
                    icon: { type: 'sfSymbol', name: 'italic' },
                  },
                  {
                    id: 'style-underline',
                    type: 'menuItem',
                    itemType: 'action',
                    title: 'Underline',
                    icon: { type: 'sfSymbol', name: 'underline' },
                  },
                  {
                    id: 'style-strikethrough',
                    type: 'menuItem',
                    itemType: 'action',
                    title: 'Strikethrough',
                    icon: { type: 'sfSymbol', name: 'strikethrough' },
                  },
                ],
              },
              {
                id: 'palette-action-reset',
                type: 'menuItem',
                itemType: 'action',
                title: 'Reset Formatting',
                icon: { type: 'sfSymbol', name: 'clear' },
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
  const [displayInline, setDisplayInline] = useState(false);
  const [nestedDisplayInline, setNestedDisplayInline] = useState(false);
  const [displayAsPalette, setDisplayAsPalette] = useState(false);
  const [paletteDisplayInline, setPaletteDisplayInline] = useState(false);

  const { setRouteOptions, routeKey } = navigation;
  const headerConfig = useMemo(
    () =>
      buildHeaderConfig(
        displayInline,
        nestedDisplayInline,
        displayAsPalette,
        paletteDisplayInline,
      ),
    [
      displayInline,
      nestedDisplayInline,
      displayAsPalette,
      paletteDisplayInline,
    ],
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
          gap: '6px',
        }}
      >
        <text style={{ color: 'black', fontSize: '15px' }}>
          To test displayInline (iOS 17.0+) try different combinations with
          nested menus:
        </text>
        <SettingsButton
          label={`displayInline (Sort By): ${displayInline}`}
          onTap={() => setDisplayInline((prev) => !prev)}
        />
        <SettingsButton
          label={`displayInline (Rating): ${nestedDisplayInline}`}
          onTap={() => setNestedDisplayInline((prev) => !prev)}
        />
        <text style={{ color: 'black', fontSize: '15px' }}>
          displayAsPalette works best combined with displayInline:
        </text>
        <SettingsButton
          label={`displayAsPalette (Text Style): ${displayAsPalette}`}
          onTap={() => setDisplayAsPalette((prev) => !prev)}
        />
        <SettingsButton
          label={`displayInline (Text Style): ${paletteDisplayInline}`}
          onTap={() => setPaletteDisplayInline((prev) => !prev)}
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
          options: {},
        },
      ]}
    />
  );
}
