import Automaticroam from '@/pages/components/cesiumMap/components/automaticroam';
export default function IndexPage(props) {
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: '50%',
      }}
    >
      <Automaticroam></Automaticroam>
    </div>
  );
}
