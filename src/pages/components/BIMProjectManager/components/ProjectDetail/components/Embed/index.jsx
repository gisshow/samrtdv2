import Button from './components/Button';
import Modal from './components/Modal';
/**
 * 跳转其他系统，点击按钮跳转至项目管理平台
 * 根据项目编码，跳转至项目详情网页
 * @param id 项目编码
 */
export default function Index({ id }) {
  if (!id) {
    return null;
  }
  return (
    <div>
      {/* 管理平台 按钮 */}
      <Button>管理平台</Button>
      {/* 根据网址，打开其他系统（项目管理平台）的项目网页。 */}
      <Modal url={'/visualization?id=' + id}></Modal>
    </div>
  );
}
