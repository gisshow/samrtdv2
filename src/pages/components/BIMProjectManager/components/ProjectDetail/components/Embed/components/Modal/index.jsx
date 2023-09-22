import styles from './index.module.less';
// 函数库
import { atom, useAtom } from 'jotai';
import { initDragElement, initResizeElement } from './utils/DragResizeElement';
// 组件库
import { Modal } from 'antd';
import { useEffect } from 'react';
// 组件
export const visibleAtom = atom(); // 显示对话框
export default function Index({ url }) {
  const [visible, setVisible] = useAtom(visibleAtom);
  useEffect(function() {
    const content = document
      .querySelector('.' + styles.container)
      .querySelector('.ant-modal-content');
    content.style.height = document.body.offsetHeight * 0.67 + 'px';
    const header = content.querySelector('.ant-modal-header');
    initDragElement({ content, header });
    initResizeElement({ content });
  }, []);
  return (
    <div className={styles.container}>
      <Modal
        title="项目管理平台"
        visible={visible}
        mask={false}
        maskClosable={false}
        footer={null}
        onCancel={() => {
          setVisible(false);
        }}
        width={document.body.offsetWidth * 0.67}
        getContainer={false}
      >
        {/* 网页 */}
        <iframe title="项目管理平台" width="100%" height="100%" src={url}></iframe>
      </Modal>
    </div>
  );
}
