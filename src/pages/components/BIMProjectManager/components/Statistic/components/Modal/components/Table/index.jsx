// 数据库
import { selectedAtom as selectedProjectLocationAtom } from '../Form/components/Radio/components/ProjectLocation';
import {
  selectedAtom as selectedProjectTypeAtom,
  UNDEFINED_PROJECT_TYPE,
} from '../Form/components/Radio/components/ProjectType';
import { typeAtom } from '../Form/components/Radio';
import { hasModelAtom } from '../Form/components/HasModel';
import { hasTiltAtom } from '../Form/components/HasTilt';
import { hasProjectCodeAtom } from '../Form/components/HasProjectCode';
// 函数库
import { useAtomValue } from 'jotai';
// 组件库
import { Table } from 'antd';
import ProjectName from './components/ProjectName';
// 组件
export default function Index({ projects }) {
  const selectedProjectLocation = useAtomValue(selectedProjectLocationAtom); // 下拉列表所选择的行政区
  const selectedProjectType = useAtomValue(selectedProjectTypeAtom); // 下拉列表所选择的项目分类
  const type = useAtomValue(typeAtom); // 单选框所选择的类型 {"全部", "按行政区"}
  const hasModel = useAtomValue(hasModelAtom); // 复选框所是否勾选，勾选则只显示有模型的，不勾选则显示所有。
  const hasTilt = useAtomValue(hasTiltAtom); // 复选框所是否勾选，勾选则只显示有倾斜的，不勾选则显示所有。
  const hasProjectCode = useAtomValue(hasProjectCodeAtom); // 复选框所是否勾选，勾选则只显示有项目编码的，不勾选则显示所有。
  return (
    <Table
      columns={[
        { title: '序号', dataIndex: '序号' },
        {
          title: '项目名称',
          dataIndex: 'projectName',
          render: function(text, { elementID }) {
            return <ProjectName text={text} elementID={elementID}></ProjectName>;
          },
        },
        { title: '项目所在区', dataIndex: 'projectLocation' },
        { title: '更新时间', dataIndex: 'updateTime' },
      ]}
      dataSource={projects
        .filter(function({
          projectLocation,
          url,
          tiltAddress,
          projectCode,
          projectType = UNDEFINED_PROJECT_TYPE,
        }) {
          // 只显示有模型
          if (hasModel === true && !url) {
            return false;
          }
          // 只显示有倾斜
          if (hasTilt === true && !tiltAddress) {
            return false;
          }
          // 只显示有项目编码
          if (hasProjectCode === true && !projectCode) {
            return false;
          }
          // 全部
          if (type === '全部') {
            return true;
          }
          // 按行政区
          if (type === '按行政区') {
            return projectLocation === selectedProjectLocation;
          }
          // 按项目分类
          if (type === '按项目分类') {
            return projectType === selectedProjectType;
          }
        })
        .map(function({ projectName, projectLocation, elementID, updateTime }, index) {
          return {
            key: index,
            序号: index + 1,
            projectName,
            projectLocation,
            elementID,
            updateTime,
          };
        })}
      pagination={{
        showTotal: function(total) {
          return <p style={{ position: 'absolute', left: '8px' }}>共 {total} 条记录</p>;
        },
      }}
      style={{ padding: '8px 0' }}
    ></Table>
  );
}
