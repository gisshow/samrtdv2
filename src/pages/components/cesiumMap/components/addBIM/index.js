/* global Cesium */
/* global viewer */
/* global $ */
/* global mars3d */
import { PROJECT_TYPES } from '../../../BIMProjectManager/components/Statistic/components/Modal/components/Form/components/Radio/components/ProjectType/index';
import { getProjectID } from '@/utils/bimProject';
import { getTokenFromLocalStorage } from '@/utils/login';
import React, { Component } from 'react';
import RootContainer from '@/components/rootContainer';
import styles from './styles.less';
import { connect } from 'dva';
import { Input, Select, Form, Upload, Button, message } from 'antd';
import { SERVER_TYPE } from '@/utils/config';
import { Icon } from 'antd';

import { PUBLIC_PATH } from '@/utils/config';

import getGWSProjectList from '@/service/gws/project/list';
import { InputNumber } from 'antd';

import { Tabs } from 'antd';

const { TabPane } = Tabs;
const Ajax = require('axios');
const { Option } = Select;

//经纬度坐标转笛卡尔坐标
function coordinatesArrayToCartesianArray(coordinates) {
  var positions = new Array(coordinates.length);
  for (var i = 0; i < coordinates.length; i++) {
    var coord = coordinates[i];
    //   coord=coord.split(" ");
    positions[i] = Cesium.Cartesian3.fromDegrees(coord[0], coord[1]);
  }
  return positions;
}

@Form.create()
@connect(({ Map }) => ({
  Map,
}))
class AddBIM extends Component {
  constructor(props) {
    super(props);
    this.state = {
      upoloading: false,
      btnTextg: '点击上传文件',
      feaStr: null,
      fileDTO: null,
      tabsActiveKey: '1',
      addModelProjectSelectData: [],
      addModelTabsActiveKey: '201',
    };
  }

  componentDidMount() {
    //关闭键盘事件
    this.doKeyEvent(false);
  }

  componentWillUnmount() {
    //打开键盘事件
    this.doKeyEvent(true);
  }

  //键盘事件开关
  doKeyEvent = isActive => {
    var isHomekeystop;
    if (!isActive) {
      isHomekeystop = true;
      viewer.mars.keyboardRoam.unbind();
    } else {
      isHomekeystop = false;
      viewer.mars.keyboardRoam.bind();
    }
    //控制键盘漫游是否开启
    this.props.dispatch({
      type: 'RightFloatMenu/setisHomekeystop',
      payload: isHomekeystop,
    });
  };

  btnSubmit = val => {
    this.setState(
      {
        btnTextg: '点击上传文件',
      },
      () => {
        this.props.submit({
          ...val,
        });
      },
    );
  };

  add = () => {
    const $this = this;
    const { feaStr, fileDTO, tabsActiveKey, addModelTabsActiveKey } = this.state;
    const { validateFields } = this.props.form;
    validateFields(async function(err, values) {
      console.log('values', values);
      if (err) {
        return;
      }
      if (tabsActiveKey === '1') {
        const {
          projectName,
          longitude,
          latitude,
          height,
          controlHeight,
          projectCode,
          projectType,
        } = values;
        const ajax_data = {
          projectName,
          longitude,
          latitude,
          height,
          geojsonPath: values.red_line[0].response.data,
          projectCode,
          projectType,
        };
        if (controlHeight !== undefined) {
          ajax_data.controlHeight = controlHeight;
        }
        const ajax_options = {
          method: 'POST',
          url: '/gws/project/save',
          data: ajax_data,
        };
        console.log('ajax_options', ajax_options);
        const response = await Ajax(ajax_options);
        const response_data = response.data;
        console.log('response_data', response_data);
        const { success, data } = response_data;
        if (success === true) {
          const id = getProjectID(projectName);
          // 更新内存里的BIM项目数据
          if (window.BIMProject && window.BIMProject.projects) {
            window.BIMProject.projects[id] = ajax_options.data;
          }
          window.BIMProject.rootThis.addBIMProject(window.BIMProject.projects[id]);
          $this.btnClose();
        }
      }
      if (tabsActiveKey === '2') {
        let url;
        if (addModelTabsActiveKey === '201') {
          url = values.model_file[0].response.data;
          url = url + '/tileset.json'; // 带上tileset.json
        }
        if (addModelTabsActiveKey === '202') {
          url = values.url;
        }
        console.log('模型URL', url);

        const projectId = values.projectId;
        const flatheight = values.flatheight;
        const ajax_options = {
          method: 'POST',
          url: '/gws/model/save',
          data: {
            projectId,
            modelName: values.modelName,
            flatheight,
            url,
          },
        };
        console.log('ajax_options', ajax_options);
        const response = await Ajax(ajax_options);
        const response_data = response.data;
        console.log('response_data', response_data);
        const { success, data } = response_data;
        if (success === true) {
          // 添加模型到场景里
          async function getProjectDetail(id) {
            const response = await Ajax({
              method: 'GET',
              url: `/gws/project/detail/${id}`,
            });
            const response_data = response.data;
            console.log('response_data', response_data);
            const { success, data } = response_data;
            if (success === true) {
              return data;
            }
            return;
          }
          const project_detail = await getProjectDetail(projectId);
          // $this.add3DTileset(url, height);

          const { projectName, longitude, latitude, height } = project_detail;

          if (url.endsWith('tileset.json') === false) {
            url = url + '/tileset.json';
          }

          const id = getProjectID(projectName);

          // 更新内存里的BIM项目数据
          if (window.BIMProject && window.BIMProject.projects) {
            const project = window.BIMProject.projects[id];
            if (project) {
              console.log('project', project);
              project.url = url;
              project.flatHeight = flatheight;
            }
          }

          // 点击项目标签
          $('#' + id).click();
        }

        
        $this.btnClose();
      }
      if (tabsActiveKey === '3') {
        const { projectId, tiltAddress, tiltHeight } = values;
        const projectName = $this.state.addModelProjectSelectData.filter(function({ value }) {
          return value === projectId;
        })[0].text;
        console.log('projectName', projectName);
        const ajax_options = {
          method: 'POST',
          url: '/gws/project/save/tilt',
          data: {
            projectId,
            tiltAddress,
            tiltScope: values.tiltScope[0].response.data,
            tiltHeight,
          },
        };
        console.log('ajax_options', ajax_options);
        const response = await Ajax(ajax_options);
        const response_data = response.data;
        console.log('response_data', response_data);
        const { success, data } = response_data;
        if (success === true) {
          const id = getProjectID(projectName);
          // 更新内存里的BIM项目数据
          if (window.BIMProject && window.BIMProject.projects) {
            const project = window.BIMProject.projects[id];
            if (project) {
              console.log('project', project);
              project.tiltAddress = ajax_options.tiltAddress;
              project.tiltScope = ajax_options.tiltScope;
            }
          }
          // 点击项目标签
          $('#' + id).click();
        }
        $this.btnClose();
      }
    });
  };

  addBIMModel = ({
    projectName,
    longitude,
    latitude,
    height = 0,
    geojsonPath,
    url,
    flatheight = 0,
    flatURLs,
  } = {}) => {
    if (window.BIMProject === undefined) {
      window.BIMProject = {};
    }
    if (window.BIMProject.BIM3DTilesets === undefined) {
      window.BIMProject.BIM3DTilesets = []; // 所有已经加载的模型
    }
    if (window.BIMProject.Flat3DTilesets === undefined) {
      window.BIMProject.Flat3DTilesets = []; // 所有已经压平的模型
    }

    const $this = this;
    let isFlat = false;
    const id = 'key_' + new Date().getTime() + '_' + projectName;
    //添加入室标签
    new mars3d.DivPoint(viewer, {
      id,
      name: projectName,
      html: `<div class="${styles.divpointtheme}"><div class="${styles.title}" id="${id}">${projectName}</div></div>`,
      visible: true,
      position: Cesium.Cartesian3.fromDegrees(longitude, latitude, height || 0),
      distanceDisplayCondition: new Cesium.DistanceDisplayCondition(3000, 116000), //按视距距离显示
      // scaleByDistance: new Cesium.NearFarScalar(500, 1.0, 100000, 0.1),
      click: function(entity) {}, //单击
    });
  };

  addBIMIcon = data => {
    return new Promise((resolve, reject) => {
      //已经加载

      let { flatpolygon, flaturl, flatHeight, name } = data; //入口位置和压平区域

      //添加入室标签
      var divpoint = new mars3d.DivPoint(viewer, {
        id: data.id,
        name: data.name,
        html: `<div class="${styles.divpointtheme}"><div class="${styles.title}" id="${data.id}">${data.name}</div></div>`,
        visible: true,
        position: Cesium.Cartesian3.fromDegrees(data.longitude, data.latitude, data.height || 0),
        distanceDisplayCondition: new Cesium.DistanceDisplayCondition(3000, 116000), //按视距距离显示
        // scaleByDistance: new Cesium.NearFarScalar(500, 1.0, 100000, 0.1),
        click: function(entity) {}, //单击
      });

      let cesium3DTileset = this.add3DTileset(data.url, data.height, data.modelMatrix);
      console.log('data.url', data.url);
      if (flatpolygon) {
        let positions = new Cesium.Cartesian3.fromDegreesArray(flatpolygon);
        //   //var Ftpositions =new mars3d.draw.attr.polygon.getPositions(entity);
        let Ftileset = this.getModelbyurl(flaturl);
        // let Ftileset = mars3d.tileset.pick3DTileset(viewer, Ftpositions);
        if (Ftileset) {
          Ftileset._config = {};
          var object = { name: name };
          var flatten = this.addflatten(Ftileset, positions, flatHeight, object);
          // $this.flattenLists.push(flatten);
        } else {
          console.error('倾斜压平失误，请刷新');
        }
      }

      //鼠标单击/移入/移出事件
      $('#' + data.id).on('click', function() {
        viewer.camera.flyToBoundingSphere(cesium3DTileset.boundingSphere);
      });
      resolve();
    });
  };

  //压平接口调用
  addflatten = (Ftileset, positions, flatHeight, object) => {
    let tilesflatten = undefined;

    tilesflatten = new mars3d.tiles.TilesFlat({
      viewer: viewer,
      tileset: Ftileset,
      positions: positions,
      flatHeight: flatHeight,
    });
    return tilesflatten;
  };

  add3DTileset = (url, offsetHeight, modelMatrix) => {
    //url不存在 返回undefined
    let cesium3DTileset = undefined;
    if (url != undefined && url != '') {
      var cur3Dtiles = this.getModelbyurl(url);
      if (cur3Dtiles) {
        cur3Dtiles.show = true;
        return cur3Dtiles;
      }
      cesium3DTileset = new Cesium.Cesium3DTileset({
        url: url,
        show: true,
      });
      viewer.scene.primitives.add(cesium3DTileset);
      cesium3DTileset.readyPromise.then(tileset => {
        tileset.show = true;
        if (offsetHeight) {
          //调整高度
          let origin = tileset.boundingSphere.center;
          let cartographic = Cesium.Cartographic.fromCartesian(origin);
          let surface = Cesium.Cartesian3.fromRadians(
            cartographic.longitude,
            cartographic.latitude,
            0.0,
          );
          let offset = Cesium.Cartesian3.fromRadians(
            cartographic.longitude,
            cartographic.latitude,
            offsetHeight,
          );
          let translation = Cesium.Cartesian3.subtract(offset, surface, new Cesium.Cartesian3());
          tileset.modelMatrix = Cesium.Matrix4.fromTranslation(translation);
        }
        // tileset._root.transform = modelMatrix == undefined ? tileset._root.transform : modelMatrix; //暂时 模型位置正确后 必须删除
      });
      
    }
    return cesium3DTileset;
  };
  //根据路径 获取模型
  getModelbyurl = url => {
    let primitives = viewer.scene.primitives._primitives;
    let Ftileset = undefined;
    primitives.forEach(data => {
      let newurl = data.url;
      if (newurl === url) {
        Ftileset = data;
        return;
      }
    });
    return Ftileset;
  };

  saveValue = value => {
    let result = [];
    let history = window.localStorage.getItem('BIMProject');
    if (history) {
      result = JSON.parse(history);
      result.push(value);
    } else {
      result.push(value);
    }
    // result=result.slice(-10);
    result = JSON.stringify(result);
    window.localStorage.setItem('BIMProject', result);
    this.btnClose();
  };

  btnClose = () => {
    this.props.dispatch({
      type: 'Map/setToolsActiveKey',
      payload: '',
    });
    // this.setState({
    //   btnTextg:'点击上传文件',
    // },()=>{
    //   this.props.close();
    // })
  };

  btnClick = () => {
    this.setState({
      feaStr: null,
    });
  };

  /**
   * 切换标签时
   */
  onChangeTabs = activeKey => {
    this.setState({
      tabsActiveKey: activeKey,
    });
  };

  /**
   * 上传文件时
   */
  normFile = e => {
    console.log('Upload event:', e);
    if (Array.isArray(e)) {
      return e;
    }
    return e && e.fileList;
  };

  /**
   * 添加模型时，展开下拉列表
   */
  onAddModelDropdownVisibleChange = async open => {
    // console.log('open', open);
    if (open === false) {
      return;
    }
    const response = await getGWSProjectList();
    const response_data = response.data;
    const { success, data } = response_data;
    if (success === true) {
      let icons = data;
      this.setState({
        addModelProjectSelectData: icons.map(function({ id, projectName }) {
          return { value: id, text: projectName };
        }),
      });
      // icons
    }
  };
  /**
   * 切换标签时
   */
  onAddModelChangeTabs = activeKey => {
    this.setState({
      addModelTabsActiveKey: activeKey,
    });
  };

  render() {
    const { getFieldDecorator, getFieldValue, setFieldsValue } = this.props.form;
    const { btnTextg, upoloading, tabsActiveKey } = this.state;
    return (
      <>
        {
          <RootContainer>
            <div className={styles.bg}>
              <div className={styles.form}>
                <Form>
                  <Tabs defaultActiveKey="1" onChange={this.onChangeTabs}>
                    <TabPane tab="添加BIM项目" key="1">
                      {tabsActiveKey === '1' && (
                        <>
                          <>
                            <div className={styles.label}>项目名称</div>
                            <Form.Item>
                              {getFieldDecorator('projectName', {
                                rules: [{ required: true, message: '请输入项目名称' }],
                              })(
                                <Input
                                  placeholder="请输入"
                                  onFocus={e => {
                                    e.stopPropagation();
                                  }}
                                />,
                              )}
                            </Form.Item>
                          </>

                          <div className={styles.label}>经度</div>
                          <Form.Item>
                            {getFieldDecorator('longitude', {
                              rules: [{ required: true, message: '请输入经度' }],
                            })(
                              <Input
                                placeholder="请输入"
                                onFocus={e => {
                                  e.stopPropagation();
                                }}
                              />,
                            )}
                          </Form.Item>

                          <div className={styles.label}>纬度</div>
                          <Form.Item>
                            {getFieldDecorator('latitude', {
                              rules: [{ required: true, message: '请输入纬度' }],
                            })(
                              <Input
                                placeholder="请输入"
                                onFocus={e => {
                                  e.stopPropagation();
                                }}
                              />,
                            )}
                          </Form.Item>

                          <div className={styles.label}>海拔</div>
                          <Form.Item>
                            {getFieldDecorator('height', {
                              rules: [{ required: true, message: '请输入海拔' }],
                            })(
                              <Input
                                placeholder="请输入"
                                onFocus={e => {
                                  e.stopPropagation();
                                }}
                              />,
                            )}
                          </Form.Item>

                          <div className={styles.label}>红线范围（GeoJSON）</div>
                          <Form.Item>
                            {getFieldDecorator('red_line', {
                              valuePropName: 'fileList',
                              getValueFromEvent: this.normFile,
                              rules: [{ required: true, message: '请上传红线范围' }],
                            })(
                              <Upload.Dragger
                                name="file"
                                action="/gws/project/upload"
                                headers={{
                                  token: getTokenFromLocalStorage(),
                                }}
                                accept=".geojson,.json"
                              >
                                <p className="ant-upload-drag-icon">
                                  <Icon type="inbox" />
                                </p>
                                <p className="ant-upload-text">点击或拖拽文件到此区域以上传文件</p>
                                <p className="ant-upload-hint">仅支持.geojson和.json格式</p>
                              </Upload.Dragger>,
                            )}
                          </Form.Item>

                          <div className={styles.label}>控高</div>
                          <Form.Item>
                            {getFieldDecorator('controlHeight', {
                              rules: [{ required: false, message: '请输入控高' }],
                            })(
                              <Input
                                placeholder="请输入"
                                onFocus={e => {
                                  e.stopPropagation();
                                }}
                              />,
                            )}
                          </Form.Item>

                          <div className={styles.label}>项目编码</div>
                          <Form.Item>
                            {getFieldDecorator('projectCode', {
                              rules: [{ required: false, message: '请输入项目编码' }],
                            })(
                              <Input
                                placeholder="请输入"
                                onFocus={e => {
                                  e.stopPropagation();
                                }}
                              />,
                            )}
                          </Form.Item>

                          <div className={styles.label}>项目分类</div>
                          <Form.Item>
                            {getFieldDecorator('projectType', {
                              rules: [{ required: false, message: '请输入项目分类' }],
                            })(
                              <Select>
                                {PROJECT_TYPES.map(function(value, index) {
                                  return (
                                    <Option value={value} key={index}>
                                      {value}
                                    </Option>
                                  );
                                })}
                              </Select>,
                            )}
                          </Form.Item>
                        </>
                      )}
                    </TabPane>
                    <TabPane tab="添加模型" key="2">
                      {tabsActiveKey === '2' && (
                        <>
                          <>
                            <div className={styles.label}>项目名称</div>
                            <Form.Item>
                              {getFieldDecorator('projectId', {
                                rules: [{ required: true, message: '请输入项目名称' }],
                              })(
                                <Select
                                  showSearch
                                  optionFilterProp="children"
                                  onDropdownVisibleChange={this.onAddModelDropdownVisibleChange}
                                >
                                  {this.state.addModelProjectSelectData.map(function(
                                    { value, text },
                                    index,
                                  ) {
                                    return (
                                      <Option value={value} key={index}>
                                        {text}
                                      </Option>
                                    );
                                  })}
                                </Select>,
                              )}
                            </Form.Item>
                          </>
                          <>
                            <div className={styles.label}>模型名称</div>
                            <Form.Item>
                              {getFieldDecorator('modelName', {
                                rules: [{ required: true, message: '请输入模型名称' }],
                              })(
                                <Input
                                  placeholder="请输入"
                                  onFocus={e => {
                                    e.stopPropagation();
                                  }}
                                />,
                              )}
                            </Form.Item>
                          </>
                          <>
                            <div className={styles.label}>模型压平</div>
                            <Form.Item>
                              {getFieldDecorator('flatheight', {
                                rules: [{ required: true, message: '请输入模型压平高度' }],
                              })(
                                <InputNumber
                                  placeholder="请输入"
                                  onFocus={e => {
                                    e.stopPropagation();
                                  }}
                                />,
                              )}
                            </Form.Item>
                          </>
                          <Tabs defaultActiveKey="201" onChange={this.onAddModelChangeTabs}>
                            <TabPane tab="模型文件" key="201">
                              {this.state.addModelTabsActiveKey === '201' && (
                                <>
                                  {/* <div className={styles.label}>模型文件</div> */}
                                  <Form.Item>
                                    {getFieldDecorator('model_file', {
                                      valuePropName: 'fileList',
                                      getValueFromEvent: this.normFile,
                                      rules: [{ required: true, message: '请上传模型文件' }],
                                    })(
                                      <Upload.Dragger
                                        name="file"
                                        action="/gws/model/upload"
                                        headers={{
                                          token: getTokenFromLocalStorage(),
                                        }}
                                        accept=".zip"
                                      >
                                        <p className="ant-upload-drag-icon">
                                          <Icon type="inbox" />
                                        </p>
                                        <p className="ant-upload-text">
                                          点击或拖拽文件到此区域以上传文件
                                        </p>
                                        <p className="ant-upload-hint">仅支持.zip格式</p>
                                      </Upload.Dragger>,
                                    )}
                                  </Form.Item>
                                </>
                              )}
                            </TabPane>
                            <TabPane tab="数据服务地址" key="202">
                              {this.state.addModelTabsActiveKey === '202' && (
                                <>
                                  {/* <div className={styles.label}>数据服务地址</div> */}
                                  <Form.Item>
                                    {getFieldDecorator('url', {
                                      rules: [{ required: true, message: '请输入数据服务地址' }],
                                    })(<Input placeholder="请输入" />)}
                                  </Form.Item>
                                </>
                              )}
                            </TabPane>
                          </Tabs>
                        </>
                      )}
                    </TabPane>
                    <TabPane tab="添加倾斜" key="3">
                      {tabsActiveKey === '3' && (
                        <>
                          <div className={styles.label}>项目名称</div>
                          <Form.Item>
                            {getFieldDecorator('projectId', {
                              rules: [{ required: true, message: '请输入项目名称' }],
                            })(
                              <Select
                                showSearch
                                optionFilterProp="children"
                                onDropdownVisibleChange={this.onAddModelDropdownVisibleChange}
                              >
                                {this.state.addModelProjectSelectData.map(function(
                                  { value, text },
                                  index,
                                ) {
                                  return (
                                    <Option value={value} key={index}>
                                      {text}
                                    </Option>
                                  );
                                })}
                              </Select>,
                            )}
                          </Form.Item>
                          <div className={styles.label}>倾斜地址</div>
                          <Form.Item>
                            {getFieldDecorator('tiltAddress', {
                              rules: [{ required: true, message: '请输入倾斜地址' }],
                            })(
                              <Input
                                placeholder="请输入"
                                onFocus={e => {
                                  e.stopPropagation();
                                }}
                              />,
                            )}
                          </Form.Item>
                          <div className={styles.label}>倾斜范围（GeoJSON）</div>
                          <Form.Item>
                            {getFieldDecorator('tiltScope', {
                              valuePropName: 'fileList',
                              getValueFromEvent: this.normFile,
                              rules: [{ required: true, message: '请上传倾斜范围' }],
                            })(
                              <Upload.Dragger
                                name="file"
                                action="/gws/project/upload"
                                headers={{
                                  token: getTokenFromLocalStorage(),
                                }}
                                accept=".geojson,.json"
                              >
                                <p className="ant-upload-drag-icon">
                                  <Icon type="inbox" />
                                </p>
                                <p className="ant-upload-text">点击或拖拽文件到此区域以上传文件</p>
                                <p className="ant-upload-hint">仅支持.geojson和.json格式</p>
                              </Upload.Dragger>,
                            )}
                          </Form.Item>
                          <div className={styles.label}>倾斜高度</div>
                          <Form.Item>
                            {getFieldDecorator('tiltHeight', {
                              rules: [{ required: false, message: '请输入倾斜高度' }],
                            })(
                              <Input
                                placeholder="请输入"
                                onFocus={e => {
                                  e.stopPropagation();
                                }}
                              />,
                            )}
                          </Form.Item>
                        </>
                      )}
                    </TabPane>
                  </Tabs>
                  {/* <div className={styles.title}>
                        添加BIM项目
                        <span
                          className={`iconfont icon_add ${styles.close}`}
                          onClick={this.props.close}
                        />
                      </div> */}

                  <div className={styles.opera}>
                    <div
                      className={styles.btn}
                      onClick={() => {
                        this.btnClose();
                      }}
                    >
                      取消
                    </div>
                    <div className={styles.btn} onClick={this.add}>
                      确定
                    </div>
                  </div>
                </Form>
              </div>
            </div>
          </RootContainer>
        }
      </>
    );
  }
}

export default AddBIM;
