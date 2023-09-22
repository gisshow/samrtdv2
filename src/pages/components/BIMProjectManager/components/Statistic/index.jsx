// 数据库
import { projectsAtom } from './utils/projectsAtom';
// 函数库
import { Suspense } from 'react';
import { useAtomValue } from 'jotai';
// 组件库
import { Spin } from 'antd';
import Button from './components/Button';
import Modal from './components/Modal';
// 组件
function Index() {
  const projects = useAtomValue(projectsAtom);
  if (projects === undefined) {
    return null;
  }
  return (
    <div>
      {/* 已添加项目41个 */}
      <Button total={projects.length}></Button>
      {/* 项目统计表 */}
      <Modal projects={projects}></Modal>
    </div>
  );
}
export default function IndexPage() {
  return (
    <Suspense fallback={<Spin></Spin>}>
      <Index></Index>
    </Suspense>
  );
}
