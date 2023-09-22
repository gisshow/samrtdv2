/* global Cesium */
/* global mars3d */
import ReactDOM from 'react-dom';

import { useRef } from 'react';
import { useEffect } from 'react';
import { useState } from 'react';
import axios from 'axios';
import { add3DTileset, flat } from '@/utils/bimProject';
import { Icon } from 'antd';
import { Table } from 'antd';
import { Radio } from 'antd';
import { Popconfirm } from 'antd';
import * as BIMProjectUtility from '@/utils/bimProject';
export default function IndexPage(props) {
  const { viewer, models, getModelList, init_model } = props;
  const ratio_group_ref = useRef(null);
  // 管理3D Tiles
  const [BIM3DTilesets, setBIM3DTilesets] = useState([]); // 所有加载的模型
  const [Flat3DTilesets, setFlat3DTilesets] = useState([]); // 所有压平的模型
  const [GeoJSONDataSources, setGeoJSONDataSources] = useState([]); // 所有红线
  function removeFlat3DTilesets() {
    console.log('移除已经压平的模型', Flat3DTilesets.length);
    if (Flat3DTilesets.length === 0) {
      return;
    }
    Flat3DTilesets.filter(function(a) {
      return a;
    }).forEach(function(tileset) {
      Flat3DTilesets.remove(tileset);
      if (viewer === undefined) {
        return;
      }
      try {
        tileset.destroy();
      } catch (error) {
        console.log(error);
      }
      viewer.scene.primitives.remove(tileset);
    });
    setFlat3DTilesets([]);
  }
  function removeBIM3DTilesets() {
    console.log('移除已经加载的模型', BIM3DTilesets.length);
    if (BIM3DTilesets.length === 0) {
      return;
    }
    BIM3DTilesets.filter(function(a) {
      return a;
    }).forEach(function(tileset) {
      BIM3DTilesets.remove(tileset);
      if (viewer === undefined) {
        return;
      }
      try {
        tileset.destroy();
      } catch (error) {
        console.log(error);
      }
      viewer.scene.primitives.remove(tileset);
    });
    setBIM3DTilesets([]);
  }
  function removeGeoJSONDataSources() {
    console.log('移除红线', GeoJSONDataSources.length);
    GeoJSONDataSources.forEach(function(dataSource) {
      GeoJSONDataSources.remove(dataSource);
      if (viewer === undefined) {
        return;
      }
      viewer.dataSources.remove(dataSource);
    });
    setGeoJSONDataSources([]);
  }
  function removeModels() {
    removeGeoJSONDataSources();
    removeFlat3DTilesets();
    removeBIM3DTilesets();
  }
  // 创建组件时
  useEffect(
    function() {
      // 销毁组件时
      return function() {
        removeModels();
      };
    },
    [], // eslint-disable-line
  );
  // 默认选中最新的模型
  useEffect(
    function() {
      // return; // 取消默认选中最新的模型
      const ratios = ReactDOM.findDOMNode(ratio_group_ref.current).getElementsByTagName('input');
      if (ratios === undefined) {
        return;
      }
      const ratio = ratios[ratios.length - 1];
      if (ratio === undefined) {
        return;
      }
      // console.log('ratio', ratio);
      setTimeout(function() {
        ratio.click();
      }, 1500);
    },
    [models],
  );
  // 点击模型列表时
  async function onSelect(event) {
    console.log('onSelect', event, viewer.scene.id);

    // 删除模型
    removeModels();

    let select_id = event.target.value;
    if (select_id === undefined) {
      return;
    }
    select_id = parseInt(select_id);
    console.log('select_id', select_id);
    // 模型的地址
    let model = models.filter(function({ id }) {
      return id === select_id;
    })[0];
    let { url } = model;
    if (url === null) {
      return;
    }
    if (url === undefined) {
      return;
    }
    console.log('模型url', url);
    // 模型的高度
    let project;
    if (window.BIMProject) {
      project = window.BIMProject.getBIMProjectById(
        window.BIMProject.rootThis.state.project_detail_id,
      );
      console.log('project', project);
    }
    let height;
    if (project) {
      height = project.height;
    }
    // 添加模型
    let bim3DTileset = add3DTileset(viewer, url, height);
    BIM3DTilesets.push(bim3DTileset);
    if (project.tiltAddress) {
      BIM3DTilesets.push(add3DTileset(viewer, project.tiltAddress));
    } // 添加倾斜模型，也是3DTileset。
    setBIM3DTilesets(BIM3DTilesets);
    // 压平模型
    let geojsonPath;
    if (project) {
      geojsonPath = project.geojsonPath;
    }
    let flatHeight = model.flatheight;
    console.log('GeoJSONDataSources', GeoJSONDataSources);
    await BIMProjectUtility.flatten({
      viewer,
      geojsonPath,
      flatHeight,
      Flat3DTilesets,
      GeoJSONDataSources,
      tiltAddress: project.tiltAddress,
      tiltScope: project.tiltScope,
    });
    setGeoJSONDataSources(GeoJSONDataSources);
    setFlat3DTilesets(Flat3DTilesets);
    console.log('flat GeoJSONDataSources', GeoJSONDataSources.length);
  }
  /**
   * 点击删除模型时
   * @param {object} record
   */
  async function onClickDeleteModel(record) {
    console.log('onClickDeleteModel', record);
    const id = record.key;
    await axios({
      method: 'GET',
      url: `/gws/model/remove/${id}`,
    });
    await getModelList();
  }
  return (
    <Radio.Group onChange={onSelect} ref={ratio_group_ref}>
      <Table
        showHeader={false}
        pagination={false}
        columns={[
          {
            title: '模型名称',
            dataIndex: 'modelName',
            key: 'modelName',
            render: (text, record) => <Radio value={record.key}>{text}</Radio>,
          },
          {
            title: '删除模型',
            dataIndex: 'deleteModel',
            key: 'deleteModel',
            render: (text, record) => {
              return (
                <Popconfirm title="确定删除模型？" onConfirm={() => onClickDeleteModel(record)}>
                  <Icon type="close"></Icon>
                </Popconfirm>
              );
            },
          },
        ]}
        dataSource={models.map(function({ id, modelName }) {
          return {
            key: id,
            modelName,
          };
        })}
      ></Table>
    </Radio.Group>
  );
}
