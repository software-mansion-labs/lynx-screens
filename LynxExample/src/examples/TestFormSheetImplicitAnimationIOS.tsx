import { useState } from '@lynx-js/react';
import { FormSheet } from 'lynx-screens';
import { Heading, SettingsButton } from '../components/SettingsControls';

export default function TestFormSheetImplicitAnimationIOS() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <view
      style={{
        width: '100%',
        height: '100%',
        padding: '16px',
        gap: '12px',
        backgroundColor: 'white',
      }}
    >
      <Heading label="FormSheet implicit animation (iOS)" />
      <text style={{ color: 'black' }}>
        Drag the sheet between its detents and release. Compare the two
        bottom-aligned markers during the settling animation.
      </text>
      <text style={{ color: 'black' }}>
        implicit-animation is per-element, not inherited. Enable it on content
        elements whose own position or size changes during the transition.
      </text>
      <SettingsButton label="Open FormSheet" onTap={() => setIsOpen(true)} />

      <FormSheet
        isOpen={isOpen}
        detents={[0.4, 0.9]}
        initialDetentIndex={0}
        prefersGrabberVisible
        nativeContainerStyle={{ backgroundColor: 'white' }}
        onNativeDismiss={() => setIsOpen(false)}
        onDismiss={() => setIsOpen(false)}
      >
        {/* The content container changes size; UIKit animates the sheet itself. */}
        <view
          flatten={false}
          implicit-animation={true}
          style={{
            width: '100%',
            height: '100%',
            padding: '20px',
            paddingTop: '28px',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: 'white',
          }}
        >
          <text
            style={{ color: 'black', fontSize: '20px', fontWeight: 'bold' }}
          >
            Drag, then release
          </text>
          <text
            style={{ color: '#475569', fontSize: '12px', marginBottom: '12px' }}
          >
            Both parents animate. Only the right marker opts in.
          </text>
          <view
            flatten={false}
            implicit-animation={true}
            style={{
              width: '100%',
              flexGrow: 1,
              flexShrink: 1,
              flexBasis: '0px',
              minHeight: '0px',
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'space-between',
            }}
          >
            <view
              flatten={false}
              implicit-animation={true}
              style={{
                position: 'relative',
                width: '48%',
                height: '100%',
                backgroundColor: '#fff7ed',
                overflow: 'hidden',
              }}
            >
              <text style={{ padding: '12px', color: '#9a3412' }}>
                Disabled
              </text>
              {/* Keep a native view so its frame animation is observable. */}
              <view
                flatten={false}
                implicit-animation={false}
                style={{
                  position: 'absolute',
                  left: '12px',
                  right: '12px',
                  bottom: '12px',
                  height: '32px',
                  backgroundColor: '#f97316',
                }}
              />
            </view>
            <view
              flatten={false}
              implicit-animation={true}
              style={{
                position: 'relative',
                width: '48%',
                height: '100%',
                backgroundColor: '#eff6ff',
                overflow: 'hidden',
              }}
            >
              <text style={{ padding: '12px', color: '#1e40af' }}>Enabled</text>
              {/* Its local Y changes with the parent's height, so it opts in too. */}
              <view
                flatten={false}
                implicit-animation={true}
                style={{
                  position: 'absolute',
                  left: '12px',
                  right: '12px',
                  bottom: '12px',
                  height: '32px',
                  backgroundColor: '#3b82f6',
                }}
              />
            </view>
          </view>
        </view>
      </FormSheet>
    </view>
  );
}
