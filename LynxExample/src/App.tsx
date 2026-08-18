import * as Tests from './examples'

export function App(props: { onRender?: () => void }) {
  return (
    <page
      style={{
        display: 'flex',
        backgroundColor: 'white',
        width: '100%',
        height: '100%',
      }}
    >
      <Tests.TestStackBackButtonAndroid />
    </page>
  );
}
