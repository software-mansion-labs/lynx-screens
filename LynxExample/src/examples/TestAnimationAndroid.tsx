import { StackNavigationButtons } from '../components/StackNavigationButtons';
import { StackContainer } from '../components/StackContainer';
import { useStackNavigationContext } from '../hooks/useStackNavigationContext';

const FORM_SHEET_DETENTS = [0.3, 0.6, 1.0];
const SCROLL_TEST_ITEMS = Array.from({ length: 20 }, (_, index) => index + 1);

export default function App() {
  return <StackSetup />;
}

function StackSetup() {
  return (
    <StackContainer
      routeConfigs={[
        {
          name: 'Home',
          Component: HomeScreen,
          options: {},
        },
        {
          name: 'Blue',
          Component: BlueScreen,
          options: {},
        },
        {
          name: 'Red',
          Component: RedScreen,
          options: {},
        },
        {
          name: 'NestedHost',
          Component: NestedHostScreen,
          options: {},
        },
        {
          name: 'FormSheet',
          Component: FormSheetScreen,
          options: {
            presentation: 'formSheet',
            detents: FORM_SHEET_DETENTS,
            selectedDetentIndex: 1,
            largestUndimmedDetentIndex: 0,
            prefersGrabberVisible: false,
            preferredCornerRadius: 10,
            preventNativeDismiss: ['back', 'drag', 'backdrop'],
            preventNativeDismissDragFeedback: true,
          },
        },
      ]}
    />
  );
}

function HomeScreen() {
  return (
    <view
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        height: '100%',
        backgroundColor: 'yellow',
      }}
    >
      <StackNavigationButtons
        isPopEnabled={false}
        routeNames={['Blue', 'Red', 'NestedHost', 'FormSheet']}
      />
    </view>
  );
}

function FormSheetScreen() {
  const navigation = useStackNavigationContext();
  if (navigation.routeOptions.presentation !== 'formSheet') {
    throw new Error('[FormSheet] Expected a FormSheet route');
  }

  const selectedDetentIndex =
    navigation.routeOptions.selectedDetentIndex === 'last'
      ? FORM_SHEET_DETENTS.length - 1
      : (navigation.routeOptions.selectedDetentIndex ?? 0);

  return (
    <view
      style={{
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        padding: '20px',
        backgroundColor: '#e8e7e1',
        borderWidth: '2px',
        borderColor: '#171717',
        borderRadius: '10px',
        display: 'flex',
        flexDirection: 'column',
        height: SystemInfo.pixelHeight + 'ppx',
        width: '100%',
      }}
    >
      <view
        style={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          paddingBottom: '12px',
          marginBottom: '18px',
          borderBottomWidth: '1px',
          borderColor: '#171717',
        }}
      >
        <text style={{ color: '#171717', fontSize: '12px' }}>
          FORM SHEET / 01
        </text>
        <text style={{ color: '#171717', fontSize: '12px' }}>
          LEVEL {selectedDetentIndex + 1} / 3
        </text>
      </view>

      <text
        style={{
          color: '#171717',
          fontSize: '24px',
          fontWeight: '700',
          marginBottom: '18px',
        }}
      >
        SELECT HEIGHT
      </text>

      <view
        style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginBottom: '12px',
        }}
      >
        {FORM_SHEET_DETENTS.map((detent, index) => (
          <view
            key={detent}
            style={{
              width: '31%',
              height: '42px',
              justifyContent: 'center',
              alignItems: 'center',
              borderWidth: '1px',
              borderColor: '#171717',
              backgroundColor:
                selectedDetentIndex === index ? '#171717' : '#e8e7e1',
            }}
            bindtap={() =>
              navigation.setRouteOptions(navigation.routeKey, {
                selectedDetentIndex: index,
              })
            }
          >
            <text
              native-interaction-enabled={false}
              user-interaction-enabled={false}
              style={{
                color: selectedDetentIndex === index ? '#f5f5f0' : '#171717',
                fontSize: '13px',
                fontWeight: '600',
              }}
            >
              {Math.round(detent * 100)}%
            </text>
          </view>
        ))}
      </view>

      <view
        style={{
          width: '100%',
          flex: 1,
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginBottom: '12px',
        }}
      >
        <scroll-view
          scroll-orientation="vertical"
          enable-scroll={true}
          style={{
            width: '48%',
            height: '100%',
            borderWidth: '1px',
            borderColor: '#171717',
          }}
        >
          {SCROLL_TEST_ITEMS.map((item) => (
            <view
              key={item}
              style={{
                height: '44px',
                justifyContent: 'center',
                paddingLeft: '12px',
                borderBottomWidth: '1px',
                borderColor: '#aaa9a4',
              }}
            >
              <text style={{ color: '#171717', fontSize: '12px' }}>
                SCROLL VIEW / {item}
              </text>
            </view>
          ))}
        </scroll-view>

        <list
          list-type="single"
          scroll-orientation="vertical"
          enable-scroll={true}
          enable-nested-scroll={true}
          style={{
            width: '48%',
            height: '100%',
            borderWidth: '1px',
            borderColor: '#171717',
          }}
        >
          {SCROLL_TEST_ITEMS.map((item) => (
            <list-item
              key={item}
              item-key={String(item)}
              style={{ height: '44px' }}
            >
              <view
                style={{
                  height: '44px',
                  justifyContent: 'center',
                  paddingLeft: '12px',
                  borderBottomWidth: '1px',
                  borderColor: '#aaa9a4',
                }}
              >
                <text style={{ color: '#171717', fontSize: '12px' }}>
                  LIST / {item}
                </text>
              </view>
            </list-item>
          ))}
        </list>
      </view>

      <view
        style={{
          width: '100%',
          height: '42px',
          justifyContent: 'center',
          alignItems: 'center',
          borderWidth: '1px',
          borderColor: '#171717',
        }}
        bindtap={() => navigation.pop(navigation.routeKey)}
      >
        <text
          native-interaction-enabled={false}
          user-interaction-enabled={false}
          style={{ color: '#171717', fontSize: '13px', fontWeight: '600' }}
        >
          CLOSE
        </text>
      </view>
    </view>
  );
}

function BlueScreen() {
  return (
    <view
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        height: '100%',
        backgroundColor: 'cyan',
      }}
    >
      <StackNavigationButtons
        isPopEnabled={true}
        routeNames={['Red', 'Blue', 'NestedHost']}
      />
    </view>
  );
}

function RedScreen() {
  return (
    <view
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        height: '100%',
        backgroundColor: 'red',
      }}
    >
      <StackNavigationButtons
        isPopEnabled={true}
        routeNames={['Blue', 'Red', 'NestedHost']}
      />
    </view>
  );
}

function NestedHostScreen() {
  return (
    <StackContainer
      routeConfigs={[
        {
          name: 'NestedHome',
          Component: NestedHomeScreen,
          options: {},
        },
        {
          name: 'NestedBlue',
          Component: NestedBlueScreen,
          options: {},
        },
        {
          name: 'NestedRed',
          Component: NestedRedScreen,
          options: {},
        },
      ]}
    />
  );
}

function NestedHomeScreen() {
  return (
    <view
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        height: '100%',
        backgroundColor: 'yellow',
      }}
    >
      <StackNavigationButtons
        isPopEnabled={true}
        routeNames={['NestedBlue', 'NestedRed']}
      />
    </view>
  );
}

function NestedBlueScreen() {
  return (
    <view
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        height: '100%',
        backgroundColor: 'cyan',
      }}
    >
      <StackNavigationButtons
        isPopEnabled={true}
        routeNames={['NestedRed', 'NestedBlue']}
      />
    </view>
  );
}

function NestedRedScreen() {
  return (
    <view
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        height: '100%',
        backgroundColor: 'red',
      }}
    >
      <StackNavigationButtons
        isPopEnabled={true}
        routeNames={['NestedBlue', 'NestedRed']}
      />
    </view>
  );
}
