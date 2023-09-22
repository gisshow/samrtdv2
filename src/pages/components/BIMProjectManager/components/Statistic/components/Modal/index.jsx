// 函数库
import { atom, useAtom } from 'jotai';
// 组件库
import Form from './components/Form';
import Table from './components/Table';
import { Modal } from 'antd';
// 组件
export const visibleAtom = atom(); // 显示对话框
export default function Index({ projects }) {
  const [visible, setVisible] = useAtom(visibleAtom);
  return (
    <Modal
      title="统计"
      visible={visible}
      footer={null}
      onCancel={() => {
        setVisible(false);
      }}
      width={720}
      getContainer={false}
    >
      {/* 表单 */}
      <Form></Form>
      {/* 表格 */}
      <Table projects={projects}></Table>
    </Modal>
  );
}
