// 数据库
import { projectTypesAtom } from '../../../../../../../../utils/projectsAtom';
// 函数库
import { atom, useSetAtom, useAtomValue } from 'jotai';
// 组件库
import { Select } from 'antd';
// 组件
/**
 * 下拉列表所选择的项目分类
 */
export const selectedAtom = atom();
/**
 * 表示未定义的项目类型
 */
export const UNDEFINED_PROJECT_TYPE = '未分类';
/**
 * 所有定义的项目类型
 */
export const PROJECT_TYPES = `医疗类、教育类、文体类、口岸类、公检法武警类、其他类`.split('、');
const { Option } = Select;
export default function Index() {
  const projectTypes = useAtomValue(projectTypesAtom);
  const setSelected = useSetAtom(selectedAtom);
  const selected = useAtomValue(selectedAtom);
  return (
    <Select
      style={{ width: 148 }}
      placeholder="请选择项目分类"
      onSelect={setSelected}
      defaultValue={selected}
    >
      {projectTypes.map(function(projectType = UNDEFINED_PROJECT_TYPE, index) {
        return (
          <Option value={projectType} key={index}>
            {projectType}
          </Option>
        );
      })}
    </Select>
  );
}
