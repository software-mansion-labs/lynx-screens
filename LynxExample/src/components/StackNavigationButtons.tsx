import { useStackNavigationContext } from '../hooks/useStackNavigationContext';

interface ButtonProps {
  onTap: () => void;
  label: string;
}

const Button = ({ onTap, label }: ButtonProps) => (
  <view
    style={{
      width: '200px',
      height: '50px',
      backgroundColor: 'blue',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: '10px',
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

export function StackNavigationButtons(props: {
  routeNames: string[];
  isPopEnabled: boolean;
}) {
  const navigation = useStackNavigationContext();

  return (
    <>
      {props.routeNames.map((routeName) => (
        <Button
          key={routeName}
          label={`Push ${routeName}`}
          onTap={() => navigation.push(routeName)}
        />
      ))}
      {props.isPopEnabled && (
        <Button label="Pop" onTap={() => navigation.pop(navigation.routeKey)} />
      )}
    </>
  );
}
