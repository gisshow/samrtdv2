/* global $ */
import { useState } from 'react';
import axios from 'axios';
import SearchPanel from '@/components/searchPanel';
import { Table } from 'antd';
import { Button } from 'antd';
import { getProjectID } from '@/utils/bimProject';
export default function IndexPage(props) {
  const [projects, setProjects] = useState();
  async function onSearch(value) {
    console.log('搜索', value);
    if (typeof value === 'object') {
      return;
    }
    const ajax_response = await axios({
      method: 'GET',
      url: '/gws/project/query',
      params: {
        keyword: value,
      },
    });
    const ajax_data = ajax_response.data;
    const { success, data } = ajax_data;
    if (success === false) {
      return;
    }
    console.log('ajax_response', data);
    setProjects(data);
  }
  /**
   * 设置行属性
   * @param {object} record
   * @param {number} index
   * @returns
   */
  function onRow(record, index) {
    return {
      onClick: function(event) {
        onClickRow(event, record, index);
      },
    };
  }
  /**
   * 点击行第几行时
   * @param {Event} event
   * @param {object} record
   * @param {number} index
   */
  function onClickRow(event, record, index) {
    console.log('点击了行', record, index);
    const { projectName } = record;
    if (projectName === undefined) {
      return;
    }
    const id = getProjectID(projectName);
    $('#' + id).click();
  }
  return (
    <div
      style={{
        position: 'absolute',
        left: '113px',
        top: '0px',
        display: 'flex',
        width: '316px',
        flexDirection: 'column',
      }}
    >
      <SearchPanel placeholder="根据项目名称搜索，然后进行定位" onSearch={onSearch}></SearchPanel>
      {projects && (
        <Table
          style={{ padding: '8px', backgroundColor: '#ffffffe6', borderRadius: '8px' }}
          onRow={onRow}
          columns={[
            {
              title: '项目名称',
              dataIndex: 'projectName',
              key: 'projectName',
              render: (text, record) => {
                return text;
              },
            },
          ]}
          dataSource={projects.map(function(project) {
            return { key: project.id, ...project };
          })}
        ></Table>
      )}
    </div>
  );
}
