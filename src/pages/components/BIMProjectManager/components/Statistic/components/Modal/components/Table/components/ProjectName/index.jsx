/* global $ */
// 数据库
import { visibleAtom } from '../../../../index';
// 函数库
import { useSetAtom } from 'jotai';
// 组件库
import { Button } from 'antd';
// 组件
export default function Index({ text, elementID }) {
  const setVisible = useSetAtom(visibleAtom);
  function onClick() {
    $('#' + elementID).click(); // 飞往该项目
    setVisible(false); // 关闭对话框
  }
  return (
    <Button type="link" onClick={onClick} icon="environment">
      {text}
    </Button>
  );
}
