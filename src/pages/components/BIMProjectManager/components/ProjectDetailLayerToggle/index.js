import unfold_image from './images/unfold.png';
export default function IndexPage(props) {
  const { parentThis } = props;
  function onClick() {
    parentThis.setState({
      project_detail_layer_toggle_visible: false,
      project_detail_visible: true,
    });
  }
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: 'calc((100vh - 500px) / 2)',
      }}
      onClick={onClick}
      title="点击打开“项目详情”面板"
    >
      <div
        style={{
          writingMode: 'tb-rl',
          backgroundImage: `url(${unfold_image})`,
          height: '96px',
          textAlign: 'center',
          userSelect: 'none',
          cursor: 'pointer',
        }}
      >
        项目详情
      </div>
    </div>
  );
}
