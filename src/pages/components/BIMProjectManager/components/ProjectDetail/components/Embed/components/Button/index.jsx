import { visibleAtom } from '../Modal';

import { useSetAtom } from 'jotai';

import { Button } from 'antd';

export default function Index() {
  const setVisible = useSetAtom(visibleAtom);
  function onClick() {
    setVisible(true); // 显示对话框
  }
  return <Button onClick={onClick}>管理平台</Button>;
}
