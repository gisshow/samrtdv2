/* global mars3d */
/* global viewer */
/* global Cesium */
import colorPost from '@/pages/components/cesiumMap/components/postProcess/post';
import { useState } from 'react';
import axios from 'axios';
import { useEffect } from 'react';
import { Button } from 'antd';
import { getCesiumUrl } from '@/utils/index';
import ProjectModels from './components/Models';
import styles from './index.less';
export default function IndexPage(props) {
  const [models, setModels] = useState([]);
  const [map, setMap] = useState();
  const { parentThis } = props;
  async function getModelList() {
    // 根据项目id获取模型列表
    const projectId = parentThis.state.project_detail_id;
    const response = await axios({
      method: 'GET',
      url: `/gws/model/all/${projectId}`,
    });
    const response_data = response.data;
    const { success, data } = response_data;
    if (success === true) {
      let data_sorted = data.sort(function(m, n) {
        return m.id - n.id;
      });
      console.log('project models', data_sorted);
      setModels(data_sorted);
    }
  }
  useEffect(
    function() {
      // 移除已经加载的模型
      if (window.BIMProject) {
        if (window.BIMProject.removeBIMProjectTilesets) {
          window.BIMProject.removeBIMProjectTilesets();
        }
      }
      getModelList();
      // 关闭项目详情
      parentThis.setState({
        project_detail_visible: false,
      });
      // 创建地图
      const map = mars3d.createMap({
        id: 'cesiumContainerEx',
        data: [],
        homeButton: false,
        geocoder: false,
        sceneModePicker: false,
        navigationHelpButton: false,
        vrButton: false,
        fullscreenButton: false,
        baseLayerPicker: false,
        success: function(_viewer, gisdata, jsondata) {
          //地图成功加载完成后执行
        },
      });
      // map.imageryLayers.addImageryProvider(

      //   new Cesium.ArcGisMapServerImageryProvider({
      //     url: 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer',
      //   }),

      // );

      setMap(map);
      console.log('map', map.scene.id);
      if (window.BIMProject) {
        window.BIMProject.projectCompareMap = map;
      }
      // 加载深圳市行政区边界线
      let district_line_dataSource = viewer.dataSources.getByName(
        'sz_distinct_part_line2.geojson',
      )[0];
      if (district_line_dataSource) {
        map.dataSources.add(Cesium.clone(district_line_dataSource));
      }
      // 右侧地图
      viewer.container.style.cssText = `
      position:fixed;
      width:50%;
      height:100%;
      right:0;
      top:0;
      `;
      // 修改标签偏移
      /**
       * 监听元素大小变化
       * @see https:/ / juejin.cn / post / 7025435825319968798;
       * @param {HTMLElement} element 监听的元素
       * @param {function} listener 元素大小发生变化时的回调函数
       */
      function onDOMElementResize(element, listener) {
        let MutationObserver =
          window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver;
        let observer = new MutationObserver(listener);
        observer.observe(element, {
          attributes: true,
          attributeFilter: ['style', 'width', 'height'],
          attributeOldValue: true,
        });
        return observer;
      }
      const observer = onDOMElementResize(viewer.canvas, function() {
        let mode = viewer.scene.mode;
        viewer.scene.mode = Cesium.SceneMode.COLUMBUS_VIEW;
        viewer.scene.mode = mode;
      });
      // 同步视角
      function getCesiumCameraView(camera) {
        return {
          destination: camera.position,
          orientation: {
            heading: camera.heading,
            pitch: camera.pitch,
            roll: camera.roll,
          },
        };
      }
      let percentageChanged1 = viewer.camera.percentageChanged;
      let percentageChanged2 = map.camera.percentageChanged;
      let percentageChanged = 0.01; // 同步的频率
      viewer.camera.percentageChanged = percentageChanged;
      map.camera.percentageChanged = percentageChanged;
      function sync1() {
        map.scene.camera.setView(getCesiumCameraView(viewer.camera));
      }
      function sync2() {
        viewer.scene.camera.setView(getCesiumCameraView(map.camera));
      }
      sync1();
      map.camera.changed.addEventListener(sync2);
      viewer.camera.changed.addEventListener(sync1);
      // 添加模型
      viewer.scene.primitives._primitives.forEach(function(primitive) {
        const url = primitive._url;
        if (url === undefined) {
          return;
        }
        map.scene.primitives.add(
          new Cesium.Cesium3DTileset({
            url: getCesiumUrl(url, true),
            show: true,
          }),
        );
      });
      // 后期处理
      // src/pages/components/cesiumMap/components/postProcess/post.js
      map.scene.postProcessStages.add(
        new Cesium.PostProcessStage({
          fragmentShader: `
  uniform sampler2D colorTexture;
  varying vec2 v_textureCoordinates;
  uniform vec4 highlight;
  uniform float brightness;
  uniform float saturation;
  uniform float contrast;
  void main() {
      vec4 color = texture2D(colorTexture, v_textureCoordinates);
          vec3 finalColor = color.rgb * brightness;
          float luminance = 0.2125 * color.r + 0.7154 * color.g + 0.721 * color.b;
          vec3 luminaceColor  = vec3(luminance);
          finalColor = mix(luminaceColor,finalColor,saturation);
          vec3 avgColor = vec3(0.5,0.5,0.5);
          finalColor = mix(avgColor,finalColor,contrast);
          gl_FragColor = vec4(finalColor.rgb, color.a);
  }
                `,
          uniforms: { brightness: 1.02, saturation: 1.0, contrast: 1.2 },
        }),
      );
      return function() {
        map.dataSources.removeAll(); // 删除深圳市行政区边界线
        map.scene.primitives.removeAll();
        viewer.camera.percentageChanged = percentageChanged1;
        map.camera.percentageChanged = percentageChanged2;
        map.camera.changed.removeEventListener(sync2);
        viewer.camera.changed.removeEventListener(sync1);
        if (window.BIMProject) {
          window.BIMProject.projectCompareMap = null;
          delete window.BIMProject.projectCompareMap;
        }
        map.destroy();
        viewer.container.style.cssText = '';
        setTimeout(function() {
          observer.disconnect();
          observer.takeRecords();
        }, 1000);
      };
    },
    [], // eslint-disable-line
  );
  function onClickToClose() {
    parentThis.setState({
      project_compare_visible: false,
    });
  }
  return (
    <>
      <div id="cesiumContainerEx" className={styles.container}></div>
      <Button
        style={{ position: 'fixed', top: '80px', right: 'calc(50% + 16px)' }}
        onClick={onClickToClose}
      >
        退出比选
      </Button>
      {models && (
        <>
          <div
            style={{
              position: 'fixed',
              right: 'calc(50% + 16px)',
              top: 'calc((100vh - 500px) / 2)',
              backgroundColor: '#ffffffc7',
              border: '1px solid',
              borderRadius: '8px',
            }}
          >
            <ProjectModels models={models} viewer={map} getModelList={getModelList}></ProjectModels>
          </div>
          <div
            style={{
              position: 'fixed',
              left: 'calc(50% + 16px)',
              top: 'calc((100vh - 500px) / 2)',
              backgroundColor: '#ffffffc7',
              border: '1px solid',
              borderRadius: '8px',
            }}
          >
            <ProjectModels
              models={models}
              viewer={viewer}
              getModelList={getModelList}
            ></ProjectModels>
          </div>
        </>
      )}
    </>
  );
}
