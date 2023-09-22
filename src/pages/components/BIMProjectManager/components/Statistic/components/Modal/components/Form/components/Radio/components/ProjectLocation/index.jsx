// 数据库
import { projectLocationsAtom } from '../../../../../../../../utils/projectsAtom';
// 函数库
import { atom, useSetAtom, useAtomValue } from 'jotai';
// 组件库
import { Select } from 'antd';
// 组件
/**
 * 下拉列表所选择的行政区
 */
export const selectedAtom = atom();
const { Option } = Select;
export default function Index() {
  const projectLocations = useAtomValue(projectLocationsAtom);
  const setSelected = useSetAtom(selectedAtom);
  const selected = useAtomValue(selectedAtom);
  return (
    <Select
      style={{ width: 148 }}
      placeholder="请选择行政区"
      onSelect={setSelected}
      defaultValue={selected}
    >
      {projectLocations.map(function(projectLocation, index) {
        return (
          <Option value={projectLocation} key={index}>
            {projectLocation}
          </Option>
        );
      })}
    </Select>
  );
}
