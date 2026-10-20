import { useState } from '@lynx-js/react';
import { FormSheet } from 'lynx-screens';
import { SettingsButton } from '../components/SettingsControls';

const Colors = {
  background: '#ffffff',
  offBackground: '#f2f2f7',
  text: '#1c1c1e',
  cardBackground: '#ffffff',
  cardBorder: '#c7c7cc',
};

function SheetContent({
  fitToContents,
  onDismiss,
}: {
  fitToContents: boolean;
  onDismiss: () => void;
}) {
  return (
    <view
      style={{
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: Colors.background,
        padding: '24px',
        paddingBottom: fitToContents ? '48px' : '24px',
        height: fitToContents ? undefined : '100%',
      }}
    >
      <text
        style={{
          fontSize: '22px',
          fontWeight: '600',
          marginBottom: '12px',
          color: Colors.text,
          textAlign: 'center',
        }}
      >
        FormSheet content
      </text>
      <text
        style={{
          fontSize: '16px',
          textAlign: 'center',
          color: Colors.text,
          paddingLeft: '16px',
          paddingRight: '16px',
          marginBottom: '12px',
        }}
      >
        Focus the inputs to check how the sheet reacts to the keyboard.
      </text>
      <input placeholder="Top input" style={INPUT_STYLE} />
      <view style={fitToContents ? { height: '32px' } : { flexGrow: 1 }} />
      <input placeholder="Bottom input" style={INPUT_STYLE} />
      <SettingsButton label="Dismiss from JS" onTap={onDismiss} />
    </view>
  );
}

const INPUT_STYLE = {
  height: '44px',
  borderWidth: '1px',
  borderColor: Colors.cardBorder,
  borderRadius: '8px',
  paddingLeft: '12px',
  paddingRight: '12px',
  marginBottom: '12px',
  color: Colors.text,
  backgroundColor: Colors.cardBackground,
};

export default function TestFormSheetKeyboard() {
  const [isSingleDetentSheetOpen, setIsSingleDetentSheetOpen] = useState(false);
  const [isTwoDetentsSheetOpen, setIsTwoDetentsSheetOpen] = useState(false);
  const [isThreeDetentsSheetOpen, setIsThreeDetentsSheetOpen] = useState(false);
  const [isFitToContentsSheetOpen, setIsFitToContentsSheetOpen] =
    useState(false);

  return (
    <view
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        height: '100%',
        backgroundColor: Colors.offBackground,
      }}
    >
      <text
        style={{
          fontSize: '20px',
          fontWeight: 'bold',
          marginBottom: '20px',
          color: Colors.text,
        }}
      >
        FormSheet Test
      </text>
      <SettingsButton
        label="Open FormSheet (single detent)"
        onTap={() => setIsSingleDetentSheetOpen(true)}
      />
      <view style={{ height: '32px' }} />
      <SettingsButton
        label="Open FormSheet (two detents)"
        onTap={() => setIsTwoDetentsSheetOpen(true)}
      />
      <view style={{ height: '32px' }} />
      <SettingsButton
        label="Open FormSheet (three detents)"
        onTap={() => setIsThreeDetentsSheetOpen(true)}
      />
      <view style={{ height: '32px' }} />
      <SettingsButton
        label="Open FormSheet (fitToContents)"
        onTap={() => setIsFitToContentsSheetOpen(true)}
      />
      <FormSheet
        isOpen={isSingleDetentSheetOpen}
        onNativeDismiss={() => setIsSingleDetentSheetOpen(false)}
        detents={[0.4]}
      >
        <SheetContent
          fitToContents={false}
          onDismiss={() => setIsSingleDetentSheetOpen(false)}
        />
      </FormSheet>
      <FormSheet
        isOpen={isTwoDetentsSheetOpen}
        onNativeDismiss={() => setIsTwoDetentsSheetOpen(false)}
        detents={[0.6, 1.0]}
      >
        <SheetContent
          fitToContents={false}
          onDismiss={() => setIsTwoDetentsSheetOpen(false)}
        />
      </FormSheet>
      <FormSheet
        isOpen={isThreeDetentsSheetOpen}
        onNativeDismiss={() => setIsThreeDetentsSheetOpen(false)}
        detents={[0.3, 0.6, 1.0]}
      >
        <SheetContent
          fitToContents={false}
          onDismiss={() => setIsThreeDetentsSheetOpen(false)}
        />
      </FormSheet>
      <FormSheet
        isOpen={isFitToContentsSheetOpen}
        onNativeDismiss={() => setIsFitToContentsSheetOpen(false)}
        detents="fitToContents"
      >
        <SheetContent
          fitToContents
          onDismiss={() => setIsFitToContentsSheetOpen(false)}
        />
      </FormSheet>
    </view>
  );
}
