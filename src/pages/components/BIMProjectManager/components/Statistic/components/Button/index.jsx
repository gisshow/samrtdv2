import styles from './index.module.less';
import { visibleAtom } from '../Modal';
import { projectsAtom } from '../../utils/projectsAtom';

import { useSetAtom } from 'jotai';

import { Button } from 'antd';

export default function Index({ total }) {
  const setVisible = useSetAtom(visibleAtom);
  const refreshProjects = useSetAtom(projectsAtom);
  function onClick() {
    setVisible(true); // 显示对话框
    refreshProjects(); // 刷新所有项目
  }
  return (
    <Button className={styles.container} onClick={onClick}>
      已添加项目<span className={styles.total}>{total}</span>个
    </Button>
  );
}
