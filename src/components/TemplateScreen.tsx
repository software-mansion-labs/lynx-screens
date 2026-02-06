import { useStackNavigationContext } from '../hooks/useStackNavigationContext';

interface NavButtonProps {
  onTap: () => void;
  label: string;
}

const NavButton = ({ onTap, label }: NavButtonProps) => (
  <view
    style={{
      width: 200,
      height: 50,
      backgroundColor: 'blue',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 10,
    }}
    bindtap={onTap}
  >
    <text
      native-interaction-enabled={false}
      user-interaction-enabled={false}
      style={{ color: 'white' }}
    >
      {label}
    </text>
  </view>
);

export const TemplateScreen = () => {
  const navigation = useStackNavigationContext();

  return (
    <view
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'white',
      }}
    >
      <text>Route {navigation.routeKey}</text>
      <NavButton
        label="Push A"
        onTap={() => {
          console.log(`push A from ${navigation.routeKey}`);
          navigation.push('A');
        }}
      />
      <NavButton
        label="Push B"
        onTap={() => {
          console.log(`push B from ${navigation.routeKey}`);
          navigation.push('B');
        }}
      />

      <NavButton
        label="Pop"
        onTap={() => {
          console.log(`pop from ${navigation.routeKey}`);
          navigation.pop(navigation.routeKey);
        }}
      />

      <NavButton
        label="Preload A"
        onTap={() => {
          console.log(`preload A from ${navigation.routeKey}`);
          navigation.preload('A');
        }}
      />
      <NavButton
        label="Preload B"
        onTap={() => {
          console.log(`preload B from ${navigation.routeKey}`);
          navigation.preload('B');
        }}
      />
    </view>
  );
};
