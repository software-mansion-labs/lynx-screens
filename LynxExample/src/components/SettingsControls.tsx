export function Heading({ label }: { label: string }) {
  return (
    <text
      style={{
        color: 'black',
        fontSize: '20px',
        fontWeight: 'bold',
        marginTop: '12px',
        marginBottom: '4px',
      }}
    >
      {label}
    </text>
  );
}

export function SettingsSwitch({
  label,
  value,
  onValueChange,
}: {
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}) {
  return (
    <view
      style={{
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: '6px',
        paddingBottom: '6px',
      }}
      bindtap={() => onValueChange(!value)}
    >
      <text style={{ color: 'black' }}>{label}</text>
      <view
        style={{
          display: 'flex',
          width: '48px',
          height: '24px',
          borderRadius: '12px',
          backgroundColor: value ? '#3f51b5' : '#bdbdbd',
          justifyContent: 'center',
          alignItems: value ? 'flex-end' : 'flex-start',
          paddingLeft: '2px',
          paddingRight: '2px',
        }}
      >
        <view
          style={{
            width: '20px',
            height: '20px',
            borderRadius: '10px',
            backgroundColor: 'white',
          }}
        />
      </view>
    </view>
  );
}

// Tap cycles through the available values.
export function SettingsPicker<T extends string>({
  label,
  value,
  onValueChange,
  items,
}: {
  label: string;
  value: T;
  onValueChange: (value: T) => void;
  items: T[];
}) {
  const cycle = () => {
    const index = items.indexOf(value);
    onValueChange(items[(index + 1) % items.length]);
  };
  return (
    <view
      style={{
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: '6px',
        paddingBottom: '6px',
      }}
      bindtap={cycle}
    >
      <text style={{ color: 'black' }}>{label}</text>
      <view
        style={{
          paddingLeft: '10px',
          paddingRight: '10px',
          paddingTop: '4px',
          paddingBottom: '4px',
          borderRadius: '6px',
          backgroundColor: '#e8eaf6',
        }}
      >
        <text style={{ color: '#3f51b5' }}>{value}</text>
      </view>
    </view>
  );
}

export function SettingsButton({
  label,
  onTap,
}: {
  label: string;
  onTap: () => void;
}) {
  return (
    <view
      style={{
        display: 'flex',
        paddingTop: '10px',
        paddingBottom: '10px',
        borderRadius: '6px',
        backgroundColor: '#3f51b5',
        justifyContent: 'center',
        alignItems: 'center',
      }}
      bindtap={onTap}
    >
      <text style={{ color: 'white', fontWeight: 'bold' }}>{label}</text>
    </view>
  );
}

export function LongText({ paragraphs }: { paragraphs: number }) {
  return (
    <view style={{ gap: '10px' }}>
      {Array.from({ length: paragraphs }, (_, index) => (
        <text key={index} style={{ color: 'black' }}>
          {index + 1}. Lorem ipsum dolor sit amet, consectetur adipiscing elit,
          sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut
          enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi
          ut aliquip ex ea commodo consequat.
        </text>
      ))}
    </view>
  );
}
