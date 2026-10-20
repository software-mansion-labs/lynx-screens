import { useState } from '@lynx-js/react';
import { FormSheet, ScrollViewMarker } from 'lynx-screens';
import {
  Heading,
  SettingsButton,
  SettingsSwitch,
} from '../components/SettingsControls';

// Port of RNS component-integration-tests/form-sheet/test-form-sheet-scrollview-nesting-scrollview-in-form-sheet.
// Adaptations: RN's `nestedScrollEnabled` opt-in is the ScrollViewMarker on
// Lynx - the switch wraps the sheet's scroll-view in the marker (or not) so the
// sheet can (or cannot) follow the list's scroll events; RN Buttons / Switch
// are SettingsButtons / SettingsSwitch.

function SheetScrollView({
  withMarker,
  children,
}: {
  withMarker: boolean;
  children: React.ReactNode;
}) {
  const scrollView = (
    <scroll-view scroll-y style={{ width: '100%', flex: 1 }}>
      <view style={{ padding: '24px', alignItems: 'center', gap: '8px' }}>
        {children}
      </view>
    </scroll-view>
  );

  return withMarker ? (
    <ScrollViewMarker style={{ width: '100%', flex: 1 }}>
      {scrollView}
    </ScrollViewMarker>
  ) : (
    scrollView
  );
}

export default function App() {
  const [isOpen, setIsOpen] = useState(false);
  const [nestedScrollEnabled, setNestedScrollEnabled] = useState(true);
  const [detentIndex, setDetentIndex] = useState<number | null>(null);

  const handleOpen = () => {
    setDetentIndex(0);
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
    setDetentIndex(null);
  };

  return (
    <view
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '24px',
        gap: '12px',
        backgroundColor: '#f5f5f5',
      }}
    >
      <Heading label="ScrollView In Sheet Test" />

      <view style={{ width: '100%' }}>
        <SettingsSwitch
          label="ScrollViewMarker (nested scroll)"
          value={nestedScrollEnabled}
          onValueChange={setNestedScrollEnabled}
        />
      </view>

      <text style={{ color: 'black', fontSize: '16px' }}>
        Detent: {detentIndex === null ? '-' : detentIndex}
      </text>

      <view style={{ width: '100%', marginTop: '32px' }}>
        <SettingsButton label="Open FormSheet" onTap={handleOpen} />
      </view>

      <FormSheet
        isOpen={isOpen}
        onNativeDismiss={handleClose}
        detents={[0.5, 1.0]}
        onDetentChanged={(e) => setDetentIndex(e.detail.index)}
      >
        <view
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: 'white',
          }}
        >
          <view
            style={{
              width: '100%',
              paddingTop: '16px',
              paddingBottom: '16px',
              alignItems: 'center',
              borderBottomWidth: '1px',
              borderBottomColor: '#c5cae9',
              backgroundColor: 'white',
            }}
          >
            <view
              style={{
                width: '40px',
                height: '5px',
                borderRadius: '3px',
                backgroundColor: '#9fa8da',
                marginBottom: '12px',
              }}
            />
            <text
              style={{ color: 'black', fontSize: '22px', fontWeight: 'bold' }}
            >
              Drag Here
            </text>
          </view>

          <SheetScrollView withMarker={nestedScrollEnabled}>
            <text
              style={{ color: 'black', fontSize: '22px', fontWeight: 'bold' }}
            >
              Scrollable Content
            </text>
            <text
              style={{
                color: '#5c6bc0',
                fontSize: '14px',
                textAlign: 'center',
                marginBottom: '16px',
              }}
            >
              Swipe on the list. The sheet should expand, collapse and dismiss
              like a native sheet with a scroll view inside.
            </text>

            {Array.from({ length: 50 }).map((_, index) => (
              <view
                key={index}
                style={{
                  width: '100%',
                  padding: '16px',
                  backgroundColor: '#e8eaf6',
                  borderRadius: '8px',
                  alignItems: 'center',
                }}
              >
                <text style={{ color: 'black', fontSize: '16px' }}>
                  List Item {index + 1}
                </text>
              </view>
            ))}

            <view style={{ width: '100%', marginTop: '24px' }}>
              <SettingsButton label="Dismiss from JS" onTap={handleClose} />
            </view>
          </SheetScrollView>
        </view>
      </FormSheet>
    </view>
  );
}
