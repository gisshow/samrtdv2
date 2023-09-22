// 数据库
import styles from './index.module.less';
// 函数库
import { atom, useAtom } from 'jotai';
// 组件库
import ProjectLocation from './components/ProjectLocation';
import ProjectType from './components/ProjectType';
import { Radio } from 'antd';

const { Group } = Radio;
/**
 * 单选框所选择的类型
 * {"全部", "按行政区"}
 */
export const typeAtom = atom('全部');
export default function Index() {
  const [type, setType] = useAtom(typeAtom);
  return (
    <Group
      className={styles.container}
      defaultValue={type}
      onChange={event => setType(event.target.value)}
    >
      <Radio value="全部">全部</Radio>
      <Radio value="按行政区">
        按行政区{type === '按行政区' && <ProjectLocation></ProjectLocation>}
      </Radio>
      <Radio value="按项目分类">
        按项目分类{type === '按项目分类' && <ProjectType></ProjectType>}
      </Radio>
    </Group>
  );
}
