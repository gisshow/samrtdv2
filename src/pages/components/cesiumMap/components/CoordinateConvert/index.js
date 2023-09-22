import { Modal } from 'antd';
import { Icon } from 'antd';
import Form from './components/Form';
import { useState } from 'react';
import styles from './index.module.less';

export default function IndexPage(props) {
  const [dataBase, setDataBase] = useState({
    title: '坐标转换',
  });
  function closePanel() {
    // console.log('props', props);
    props.dispatch({
      type: 'Map/setToolsActiveKey',
      payload: '',
    });
  }
  window.viewer.mars.keyboardRoam.unbind(); // 关闭键盘漫游
  console.log('关闭键盘漫游');
  return (
    <Modal
      title={dataBase.title}
      width={560}
      visible={true}
      footer={null}
      closeIcon={<Icon type="close" style={{ color: '#569EEB' }}></Icon>}
      onCancel={closePanel}
      style={{ color: 'white' }}
      className={styles.container}
    >
      <Form parentState={{ dataBase, setDataBase }}></Form>
    </Modal>
  );
}
