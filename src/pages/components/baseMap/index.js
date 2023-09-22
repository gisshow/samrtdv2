/* global Cesium */
/* global viewer */
/* global mars3d */
/* global $ */
/* global turf */
import React, { Component, Fragment } from 'react';
import { List, Empty, Switch, Icon, Row, Col, message } from 'antd';
import styles from './styles.less';
import RootContainer from '@/components/rootContainer';
import { PUBLIC_PATH } from '@/utils/config';
import { getColorRamp } from '@/utils/renderer';
import QueryGeoServer from './js/QueryGeoServer.js';
import TilesFlatten from './js/TilesFlatten';
import { hidemodelanddivpoint, publicretracement, request } from '@/utils/request';
import { connect } from 'dva';
import { getCesiumUrl } from '@/utils/index';
import BorderPoint from '../border-point';
import { getBaseMapKey } from '@/service/global';

import ProjectDetail from '../BIMProjectManager/components/ProjectDetail';
import ProjectCompare from '../BIMProjectManager/components/ProjectCompare';

import getGWSProjectList from '@/service/gws/project/list';

import ProjectMapFly from '../BIMProjectManager/components/ProjectMapFly';

import { flat as flatModel } from '@/utils/bimProject';
import { destoryProjectLimitHeight } from '@/utils/bimProject';
import { addProjectLimitHeight } from '@/utils/bimProject';
import { destroyProjectRedline, addProjectRedline } from '@/utils/bimProject';
import * as BIMProjectUtility from '@/utils/bimProject';

import ProjectDetailLayerToggle from '../BIMProjectManager/components/ProjectDetailLayerToggle';

import { getProjectID } from '@/utils/bimProject';

import { labelShowHideListener } from '@/utils/bimProject';

//const turf = require('@turf/turf');
const Ajax = require('axios');
//降维、把key转成下标
const flat = list => {
  let obj = {};
  list.forEach(v => {
    obj[v.id] = v;
    if (v.children && v.children.length) {
      obj = { ...obj, ...flat(v.children) };
    }
  });
  return obj;
};
const URL = {
  districtMultPolyline: `${PUBLIC_PATH}data/json/sz_distinct_part_line2.geojson`,
  shenZhenWall: `${PUBLIC_PATH}data/json/shenzhen_coor_array.json`,
};

const Cesium = window.Cesium;
var isloadzj = false,
  zkpoiadd = true;
let mapItems;
let motherBoard;
let datacutover;
let nowcamera;
let IndoormodeldivList = [];

@connect(({ BaseMap, Home, House, Map, RightFloatMenu, Global }) => ({
  BaseMap,
  Home,
  House,
  Map,
  RightFloatMenu,
  Global,
}))
class BaseMap extends Component {
  constructor(props) {
    super(props);
    this.state = {
      baseMapKey: 'REALITY',
      isOpen: false,
      isForbid: false, //禁止底图切换点击
      isOpen3D: true,
      storedData: {},
      zhuji_handler: null, //鼠标滚轮监听
      szdlx_handler: null, //深圳道路线
      buildingZhuji_handler: null, //建筑物注记
      roadZhuji_handler: null, //道路注记
      dantihua: null,
      project_detail_layer_toggle_visible: false, // 左侧项目详情展开按钮是否显示
      project_detail_visible: false, // 项目详情是否显示
      project_detail: {}, // 项目详情的内容
      project_detail_id: null, // 项目详情的id
      project_compare_visible: false, // 项目比选是否显示
      project_map_fly_visible: false, // 项目飞行漫游
      project_limit_height_checked: false, // 项目详情界面里的项目控高分析开关是否打开，开关打开或关闭与添加控高分析到场景里是两个步骤。
      project_redline_checked: false, // 项目详情界面里的项目红线开关
    };
  }
  globalMap = null;
  globalMapVisible = true;
  szqingxie = null;
  sanweiTimer = null;
  hasLoad3DTiles = false;

  POICache = {}; // 记录上次poi请求的行列号,level,col,row

  async componentWillMount() {
    let data = await Ajax.get(`${PUBLIC_PATH}config/mapList.json`);
    mapItems = eval(data.data.replace(/\$\#\$/gi, PUBLIC_PATH));

    let data1 = await Ajax.get(`${PUBLIC_PATH}config/motherBoard.json`);
    motherBoard = data1.data;

    let data2 = await Ajax.get(`${PUBLIC_PATH}config/datacutover.json`);
    datacutover = data2.data;

    // 获取底板空间公共key
    let mapkeyInfo = await getBaseMapKey();

    if (mapkeyInfo && mapkeyInfo.success) {
      mapkeyInfo.data && window.localStorage.setItem('baseMapLicenseKey', mapkeyInfo.data);
    } else {
      window.localStorage.setItem(
        'baseMapLicenseKey',
        '/n6R1nTO1GDjPhIH8LawdgVZcJhkmyqONAiZaMkbW79SEvtPjcTt3pICO/bKZSKW',
      );
    }

    motherBoard && datacutover && this.bindAddReality();
    try {
      this.FParentpolygon = viewer.entities.add(
        new Cesium.Entity({ id: 'FParentpolygon', name: '压平区域面', show: true }),
      );
      this.CutParentpolygon = viewer.entities.add(
        new Cesium.Entity({ id: 'CutParentpolygon', name: '裁剪区域面', show: true }),
      );
    } catch (e) {}
    window.isOpen3D = true; //默认

    this.updateKeyboardRoam();

    // 循环监听POI请求
    // viewer.clock.onTick.addEventListener(this.POIFunc, this);

    // viewer.camera.moveEnd.addEventListener(this.isInBoundingBox, 'BaseMap'); // 进入模型范围内加载模型

    // 双击罗盘回到初始位置
    if (viewer.cesiumNavigation) {
      const viewModel = viewer.cesiumNavigation.navigationViewModel;
      viewModel.handleDoubleClick = function() {
        viewModel.flyHome(viewModel);
      };
    }

    // 按下F2隐藏或显示界面
    const viewerCanvasStyle = viewer.canvas.style;
    function onKeyDown(event) {
      let keycode = event.keyCode;
      // console.log(keycode);
      if (keycode === 113) {
        if (viewerCanvasStyle.zIndex === '') {
          Object.assign(viewerCanvasStyle, {
            position: 'absolute',
            zIndex:
              // @see https://cloud.tencent.com/developer/article/1436432javascript 寻找当前页面中最大的 z-index 值的方法
              [...document.all].reduce(
                (r, e) => Math.max(r, +window.getComputedStyle(e).zIndex || 0),
                0,
              ) + 1,
          });
          return;
        }
        Object.assign(viewerCanvasStyle, {
          position: '',
          zIndex: '',
        });
        return;
      }
    }
    document.addEventListener('keydown', onKeyDown);

    window.viewer.mars.keyboardRoam.unbind(); // 关闭键盘漫游
    window.viewer.mars.keyboardRoam.bind = function() {
      console.log('因无法解决的问题，暂时禁用键盘漫游功能');
    };
    console.log('关闭键盘漫游');
  }

  componentDidMount() {
    this.props.onRef && this.props.onRef(this);
  }

  componentWillReceiveProps(newPorps) {
    // console.log(this.props);
    const { leftActiveKey, rightActiveKey } = this.props.Home;
    const { leftActiveKey: newLeftKey, rightActiveKey: newRightKey } = newPorps.Home;
    const { storedData } = this.state;
    const { isShowMainStat } = newPorps.House;
    if (isShowMainStat && isShowMainStat !== this.props.House.isShowMainStat) {
      //地楼房专题，隐藏边界和区名称注记
      // 如果是统计状态开启，则隐藏
      // if(isShowMainStat){
      this.changeDistrict(false);
      this.changeDistrictZhuji(false);
      // }
    }
    const { scence } = newPorps.RightFloatMenu;
    if (scence != this.props.RightFloatMenu.scence) {
      // console.log(scence)
      if (scence == 'dantihua') {
        setTimeout(() => {
          this.showDanTiHua();
          this.showMonomerIcon(true);
        }, 500);
      } else if (scence == 'all' || scence == 'floor') {
        this.props.RightFloatMenu.scence !== 'house' &&
          motherBoard &&
          datacutover &&
          this.bindAddReality();
        this.removeDem();
        this.props.RightFloatMenu.scence !== 'house' && this.goHome();
        window.isOpen3D = true;
        this.setState({
          isOpen3D: true,
        });
      } else if (scence == 'education') {
        this.props.RightFloatMenu.scence !== 'house' &&
          motherBoard &&
          datacutover &&
          this.bindAddReality();
        this.addDem();
        this.setState({
          isOpen3D: true,
          baseMapKey: 'REALITY',
        });
        // this.removeDem();
        this.goHome();
      } else if (scence == 'house') {
        // this.removeDistrictZhuji()
        // this.removeDistrict();
        this.showMonomerIcon(false);
        setTimeout(() => {
          // motherBoard && datacutover && this.showHouse();
          this.removeDem();
          // this.goHome();
        }, 500);
      } else if (scence == 'underground') {
        this.onMapChange(false);
        this.removeDanTiHua();
        this.showMonomerIcon(false);
      } else if (scence == 'ocean') {
        setTimeout(() => {
          this.showOcean();
        }, 500);
      } else if (scence == 'oceanwater') {
        //海底：海底地形+海洋水面
        setTimeout(() => {
          this.showOceanWater();
        }, 500);
        // this.goHome();
      } else if (scence == 'traffic') {
        // const {
        //   dark: {
        //     sz_dark_map, global_dark_map, blue_guandongRoad
        //   },
        //   digital: {
        //     global_map, sz_map
        //   },
        //   reality: { sz_yx,sz_road,sz_district }
        // } = motherBoard
        // this.setState({
        //   isOpen3D: false,
        //   baseMapKey: 'REALITY',
        // },()=>{
        //   this.bindAddReality();
        //   // this.removeDem();
        //   this.goHome();
        // })
        setTimeout(() => {
          this.setState(
            {
              isOpen3D: false,
              baseMapKey: 'REALITY',
            },
            () => {
              //  this.bindAddDark();
              this.bindAddReality();
              this.showTraffic();
              // this.addWMTS(sz_dark_map)
              this.addDem();
              this.goHome();
              // this.removeDem();
            },
          );
        }, 500);
      } else if (scence == 'commute') {
        this.changeDistrict(false);
        this.changeDistrictZhuji(false);
        this.setState({
          isOpen3D: false,
        });
      } else if (scence == 'monitoring') {
        this.setState({
          isOpen3D: false,
        });
        this.goHome();
      } else if (scence == 'video') {
        this.onMapChange(false);
        this.removeDanTiHua();
      } else if (scence == 'indoor') {
        this.props.RightFloatMenu.scence != 'all' &&
          motherBoard &&
          datacutover &&
          this.bindAddReality();
        this.props.RightFloatMenu.scence != 'all' && this.removeDem();
      }
    }
  }

  componentWillUnmount() {
    viewer.camera.moveStart.removeEventListener(this.moveStart);
    viewer.camera.moveEnd.removeEventListener(this.moveEnd);
    // viewer.clock.onTick.removeEventListener(this.POIFunc, this);
  }

  goHome = () => {
    const centeropt = {
      x: 114.14347633526161,
      y: 22.63403261589422,
      z: 93996.87093563561,
      heading: 360,
      pitch: -90,
      roll: 360,
    };
    const height = centeropt.z || 2500;
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(centeropt.x, centeropt.y, height), //经度、纬度、高度
      orientation: {
        heading: Cesium.Math.toRadians(centeropt.heading || 0), //绕垂直于地心的轴旋转
        pitch: Cesium.Math.toRadians(centeropt.pitch || -90), //绕纬度线旋转
        roll: Cesium.Math.toRadians(centeropt.roll || 0), //绕经度线旋转
      },
      duration: 4,
    });
  };

  goDantihuaCenter = () => {
    const centeropt = {
      x: 114.055377,
      y: 22.549661,
      z: 2500,
      heading: 360,
      pitch: -90,
      roll: 360,
    };
    const height = centeropt.z || 2500;
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(centeropt.x, centeropt.y, height), //经度、纬度、高度
      orientation: {
        heading: Cesium.Math.toRadians(centeropt.heading || 0), //绕垂直于地心的轴旋转
        pitch: Cesium.Math.toRadians(centeropt.pitch || -90), //绕纬度线旋转
        roll: Cesium.Math.toRadians(centeropt.roll || 0), //绕经度线旋转
      },
      duration: 4,
    });
  };

  click = item => {
    const { isOpen3D, baseMapKey } = this.state;
    const {
      dark: { sz_dark_map, global_dark_map, blue_guandongRoad },
      digital: { global_map, sz_map },
      reality: { sz_yx },
    } = motherBoard;
    const { leftActiveKey } = this.props.Home;
    this.showMonomerIcon(false);
    switch (item.key) {
      case 'DIGITAL': //浅色电子
        if (isOpen3D) {
          this.bindAddDigital();
        } else {
          this.toggleBasemap(false)
            .then(() => {
              return this.removeSzYX(sz_yx); //移除实景影像
            })
            .then(() => {
              return this.removeWMS(global_dark_map); //移除深色电子
            })
            .then(() => {
              return this.removeWMS(blue_guandongRoad);
            })
            .then(() => {
              return this.removeWMTS(sz_dark_map); //移除深色电子
            })
            .then(() => {
              return this.removeWMS(global_map);
            })
            .then(() => {
              return this.addWMS(global_map);
            })
            .then(() => {
              return this.addWMTS(sz_map);
            });
        }
        break;
      case 'DARK': //深色电子
        if (isOpen3D) {
          this.bindAddDark();
        } else {
          this.toggleBasemap(false)
            .then(() => {
              return this.removeSzYX(sz_yx);
            })
            .then(() => {
              return this.removeWMS(sz_dark_map);
            })
            .then(() => {
              return this.removeWMTS(sz_map); //移除浅色电子
            })
            .then(() => {
              return this.addWMS(global_dark_map);
            })
            .then(() => {
              return this.addWMS(blue_guandongRoad);
            })
            .then(() => {
              return this.addWMTS(sz_dark_map);
            });
        }
        break;
      case 'REALITY': //三维实景
        if (isOpen3D) {
          this.bindAddReality();
        } else {
          this.removeWMS(global_map)
            .then(() => {
              return this.removeWMTS(sz_map);
            })
            .then(() => {
              return this.removeWMS(global_dark_map);
            })
            .then(() => {
              return this.removeWMS(blue_guandongRoad);
            })
            .then(() => {
              return this.removeWMTS(sz_dark_map);
            })
            .then(() => {
              return this.toggleBasemap(true);
            })
            .then(() => {
              return this.addSzYX(sz_yx);
            });
        }
        break;
      default:
        this.changeImageLayer(item.imageryLayer);
        break;
    }

    this.setState({
      baseMapKey: item.key,
    });

    this.setPostProcess(item.key);
    // if(leftActiveKey==='house'){
    this.props.dispatch({
      type: 'BaseMap/setCheckedKey',
      payload: item.key,
    });
  };

  // 判断是否开启了后处理，并根据缓存调整效果
  setPostProcess = key => {
    if (window.stage) {
      let storage = window.localStorage;
      let info = storage.getItem(key) || '{}';
      info = JSON.parse(info);
      window.stage.uniforms.brightness = info.brightness || 1.0;
      window.stage.uniforms.saturation = info.saturation || 1.0;
      window.stage.uniforms.contrast = info.contrast || 1.0;
    }
  };

  setBaseMap = type => {
    const {
      digital: { sz_baseMap },
    } = motherBoard;
    if (type === 'DIGITAL') {
      this.addWMS(sz_baseMap); //加载深圳电子底图（自己配的wms,非天地图）
    } else {
      this.removeWMS(sz_baseMap); //移除深圳底图
    }
  };

  onMapChange = checked => {
    const { baseMapKey, isOpen3D } = this.state;
    const {
      digital: { whiteModel, global_map, sz_map },
      dark: { sz_dark_map, global_dark_map, blue_guandongRoad, whiteModel_dark },
      reality: { sz_yx },
    } = motherBoard;
    switch (baseMapKey) {
      case 'DIGITAL':
        if (checked) {
          this.showOrHideWhiteModel(whiteModel, true);
        } else {
          this.showOrHideWhiteModel(whiteModel, false);
        }
        break;
      case 'DARK':
        if (checked) {
          this.showOrHideWhiteModel(whiteModel_dark, true);
          // .then(() => {
          //   return this.addWhiteModel2(whiteModel)
          // })
        } else {
          this.showOrHideWhiteModel(whiteModel_dark, false);
        }
        break;
      case 'REALITY':
        if (checked) {
          this.bindAddReality();
          var nowheight = Math.ceil(viewer.camera.positionCartographic.height);
          if (nowheight > 600) {
            //高度小于600不执行

            var nowheight = Math.ceil(viewer.camera.positionCartographic.height) - 400;
            let newcartesian = Cesium.Cartesian3.fromDegrees(nowcamera.x, nowcamera.y, nowheight);
            // viewer.camera.flyTo({
            //   destination: newcartesian,
            //   orientation: {
            //     pitch: Cesium.Math.toRadians(-45),
            //     heading: Cesium.Math.toRadians(nowcamera.heading),
            //     roll: Cesium.Math.toRadians(nowcamera.roll)
            //   }
            // });
          }
        } else {
          this.bindRemoveReality().then(() => {
            this.addSzYX(sz_yx);
          });
          //视角 垂直
          nowcamera = viewer.mars.getCameraView();
          var Center = mars3d.point.getCenter(viewer);
          var nowheight = Math.ceil(viewer.camera.positionCartographic.height) + 400;
          let cartesian = Cesium.Cartesian3.fromDegrees(Center.x, Center.y, nowheight);
          // viewer.camera.flyTo({
          //   destination: cartesian,
          //   orientation: {
          //       pitch : Cesium.Math.toRadians(-90),
          //       heading: Cesium.Math.toRadians(nowcamera.heading),
          //       roll: Cesium.Math.toRadians(nowcamera.roll)
          //   }
          // })
        }

        break;
    }
    window.isOpen3D = !isOpen3D;
    this.setState({
      isOpen3D: !isOpen3D,
    });
  };

  //电子底图底板
  bindAddDigital = () => {
    const {
      digital: { whiteModel, global_map, sz_map },
    } = motherBoard;
    const {
      dataswicth: { Monomerization, Indoormodel },
    } = datacutover;

    this.setState(
      {
        isForbid: true,
      },
      () => {
        this.bindRemoveReality() //删除实景地图底板
          .then(() => {
            return this.bindRemoveDark(true); //不移除白模，默认移除
          })
          .then(() => {
            //移除影像basemap
            return this.toggleBasemap(false);
          })
          // .then(() => {
          //   return this.addWMS(global_map)
          // })
          .then(() => {
            // return this.addWMTS(sz_map)
            return this.addArcGIS2000(sz_map);
          })
          .then(() => {
            return this.addWhiteModel2(whiteModel);
          })
          // .then(() => {
          //   //加载室内模型
          //   return this.eleaddIndoorModel(Indoormodel);
          // })
          .then(() => {
            // setTimeout(() => {
            //   this.setState({
            //     isForbid: false
            //   })
            // }, 5000);
          });
      },
    );
  };

  bindRemoveDigital = holdWhite => {
    const {
      digital: { whiteModel, global_map, sz_map },
    } = motherBoard;
    return new Promise((resolve, reject) => {
      // this.removeWhiteModel2(whiteModel)
      //   .then(() => {
      //     return this.removeWMS(global_map) //移除深圳底图
      //   })
      this.removeWMS(global_map)
        .then(() => {
          return this.removeWMTS(sz_map);
        })
        // .then(() => {
        //   return this.removELEModel()
        // })
        .then(() => {
          if (!holdWhite) {
            this.removeWhiteModel2(whiteModel).then(() => {
              resolve();
            });
          } else {
            resolve();
          }
        });
    });
  };

  //电子底图底板
  bindAddDark = () => {
    const {
      dark: { sz_dark_map, global_dark_map, blue_guandongRoad, whiteModel_dark },
    } = motherBoard;
    const { baseMapKey } = this.state;

    this.setState(
      {
        isForbid: true,
      },
      () => {
        this.bindRemoveReality() //删除实景地图底板
          .then(() => {
            return this.bindRemoveDigital(true); //删除浅色电子，不移除白模
          })
          .then(() => {
            //移除影像basemap
            return this.toggleBasemap(false);
          })
          // .then(() => {
          //   return this.addWMS(global_dark_map)
          // })
          // .then(() => {
          //   return this.addWMS(blue_guandongRoad)
          // })
          .then(() => {
            // return this.addWMTS(sz_dark_map) //模拟加载深色电子
            return this.addArcGIS2000(sz_dark_map);
          })
          .then(() => {
            return this.addWhiteModel2(whiteModel_dark);
          })
          .then(() => {
            // setTimeout(() => {
            //   this.setState({
            //     isForbid: false
            //   })
            // }, 5000);
          });
      },
    );
  };

  bindRemoveDark = holdWhite => {
    const {
      dark: { global_dark_map, blue_guandongRoad, sz_dark_map, whiteModel_dark },
    } = motherBoard;
    return new Promise((resolve, reject) => {
      // this.removeWhiteModel2(whiteModel_dark)
      //   .then(() => {
      //     return this.removeWMS(global_dark_map)
      //   })
      this.removeWMS(global_dark_map)
        // .then(() => {
        //   return this.removeWMS(blue_guandongRoad)
        // })
        .then(() => {
          return this.removeWMTS(sz_dark_map);
          // return this,removeArcGIS2000()
        })
        // .then(() => {
        //   return this.removeMonomerModel()
        // })
        .then(() => {
          if (!holdWhite) {
            this.removeWhiteModel2(whiteModel_dark).then(() => {
              resolve();
            });
          } else {
            resolve();
          }
        });
    });
  };

  addLocalBIM = () => {};

  //房屋场景
  showHouse = () => {
    const {
      reality: { sz_yx, sz_district, sz_road, sz_osgb },
    } = motherBoard;
    const {
      dataswicth: { Monomerization, Indoormodel },
    } = datacutover;
    this.setState(
      {
        isForbid: true,
      },
      () => {
        this.bindRemoveDigital()
          .then(() => {
            return this.removeDanTiHua();
          })
          .then(() => {
            return this.bindRemoveDark();
          })
          .then(() => {
            return this.bindRemoveReality();
          })
          .then(() => {
            //添加影像basemap
            return this.toggleBasemap(true);
          })
          .then(() => {
            return this.addSzYX(sz_yx); //加载深圳影像
          })
          .then(() => {
            return this.addOSGB_all(sz_osgb);
          })
          .then(() => {
            return this.loadSzData(sz_road);
          });
      },
    );
  };

  //实景三维底板
  bindAddReality = () => {
    const {
      reality: { sz_yx, sz_osgb },
    } = motherBoard;
    const {
      dataswicth: { bimIcon, Indoormodel, addBIMIcons, maximumScreenSpaceError },
    } = datacutover;
    this.setState(
      {
        isForbid: true,
      },
      () => {
        this.bindRemoveDigital()
          .then(() => {
            return this.removeDanTiHua();
          })
          .then(() => {
            return this.bindRemoveDark();
          })
          .then(() => {
            //添加影像basemap
            return this.toggleBasemap(true);
          })
          .then(() => {
            return this.addSzYX(sz_yx); //加载深圳影像
          })
          .then(() => {
            return this.addDistrict();
          })
          .then(() => {
            return this.addDistrictZhuji();
          })
          .then(() => {
            return this.removeOSGB_all(sz_osgb);
          })
          .then(() => {
            return this.addOSGB_all(sz_osgb); // 添加倾斜摄影
          })
          .then(() => {
            return this.addBIMProjectsFromURL({
              flatURLs: sz_osgb.children,
              maximumScreenSpaceError,
            });
            // return this.addBIMIcon(bimIcon);
          })
          // .then(() => {
          //   return this.loadSzData(sz_road);
          // })
          // .then(() => {
          //   //加载室内模型
          //   // this.undergroundmodel();
          //   return this.addIndoorModel2(Indoormodel);
          // })
          .then(() => {
            // setTimeout(() => {
            //   this.setState({
            //     isForbid: false
            //   })
            // }, 1000);
          });
      },
    );
  };

  /**
   * 从后端接口里读取BIM项目
   */
  addBIMProjectsFromURL = async ({ flatURLs, maximumScreenSpaceError }) => {
    const response = await getGWSProjectList();
    // console.log('getGWSProjectList', response);
    const response_data = response.data;
    const { success, data } = response_data;
    if (success === true) {
      let icons = data;
      // icons
      this.addBIMProjects({ icons, flatURLs, maximumScreenSpaceError });
    }
  };
  /**
   * 批量添加BIM项目
   * - 显示标签
   * - 点击标签后
   *   - 加载模型
   *   - 飞往模型
   *   - 压平模型
   *   - 显示项目详情
   *   - 红线添加
   * @param {array} icons
   * @param {array} flatURLs 行政区对应的模型URL，“guangming”对应“guangming/tileset.json”，便于根据经纬度得到压平模型的URL。
   * @param {number} maximumScreenSpaceError 倾斜模型的精度，值越高距离越远越模糊。
   */
  addBIMProjects = ({ icons, flatURLs, maximumScreenSpaceError }) => {
    console.log('addBIMIcons', icons);
    console.log('flatURLs', flatURLs);
    const $this = this;
    if (window.BIMProject === undefined) {
      window.BIMProject = {};
    }
    if (window.BIMProject.maximumScreenSpaceError === undefined) {
      window.BIMProject.maximumScreenSpaceError = maximumScreenSpaceError;
    }
    if (window.BIMProject.BIM3DTilesets === undefined) {
      window.BIMProject.BIM3DTilesets = []; // 所有已经加载的模型，包括BIM模型、倾斜模型。
    }
    if (window.BIMProject.GeoJSONDataSources === undefined) {
      window.BIMProject.GeoJSONDataSources = []; // 红线
    }
    if (window.BIMProject.Flat3DTilesets === undefined) {
      window.BIMProject.Flat3DTilesets = []; // 所有已经压平的模型
    }
    if (window.BIMProject.rootThis === undefined) {
      window.BIMProject.rootThis = this;
    }
    if (window.BIMProject.flatURLs === undefined) {
      window.BIMProject.flatURLs = flatURLs; // 需要压平的所有模型
    }
    if (window.BIMProject.projects === undefined) {
      window.BIMProject.projects = {}; // 所有BIM项目
    }
    if (window.BIMProject.addBIMproject === undefined) {
      window.BIMProject.addBIMProject = $this.addBIMProject.bind($this);
    }
    if (window.BIMProject.removeBIMproject === undefined) {
      window.BIMProject.removeBIMProject = $this.removeBIMProject.bind($this);
    }
    if (window.BIMProject.removeBIMProjectTilesets === undefined) {
      window.BIMProject.removeBIMProjectTilesets = $this.removeBIMProjectTilesets.bind($this);
    }
    if (window.BIMProject.getBIMProjectById === undefined) {
      window.BIMProject.getBIMProjectById = $this.getBIMProjectById.bind($this);
    }

    // 查看某个项目时，隐藏其他远处项目的标签
    viewer.camera.changed.addEventListener(function() {
      labelShowHideListener(window.BIMProject, viewer, 3000);
    });

    icons.forEach(function(icon) {
      $this.addBIMProject(icon);
    });

    // 记录已经添加完所有BIM项目
    window.BIMProject.projectsAdded = true;
  };
  /**
   * 从内存里删除BIM项目的模型：
   * - BIM模型
   * - 压平的模型
   * - 移除红线
   * - 移除控高分析
   */
  removeBIMProjectTilesets = () => {
    // 移除已经加载的模型
    console.log('移除已经加载的模型', window.BIMProject.BIM3DTilesets.length);
    window.BIMProject.BIM3DTilesets.filter(function(a) {
      return a;
    }).forEach(function(tileset) {
      tileset.destroy();
      window.BIMProject.BIM3DTilesets.remove(tileset);
      viewer.scene.primitives.remove(tileset);
    });

    console.log('移除已经压平的模型', window.BIMProject.Flat3DTilesets.length);
    window.BIMProject.Flat3DTilesets.forEach(function(tileset) {
      tileset.destroy();
      viewer.scene.primitives.remove(tileset);
    });
    window.BIMProject.Flat3DTilesets = [];

    destroyProjectRedline(viewer);

    console.log('移除控高分析');
    destoryProjectLimitHeight();
  };
  /**
   * 添加BIM项目
   * @param {object} icon
   * @returns
   */
  addBIMProject = icon => {
    const $this = this;

    const { projectName, longitude, latitude, height, url, geojsonPath } = icon;

    const id = getProjectID(projectName);
    window.BIMProject.projects[id] = icon;

    return new Promise((resolve, reject) => {
      //添加入室标签
      window.BIMProject.projects[id].label = new mars3d.DivPoint(viewer, {
        id,
        name: projectName,
        html: `<div class="${styles.divpointtheme}"><div class="${styles.title}" id="${id}">${projectName}</div></div>`,
        visible: true,
        position: Cesium.Cartesian3.fromDegrees(longitude, latitude, height || 0),
        distanceDisplayCondition: new Cesium.DistanceDisplayCondition(3000, 116000), //按视距距离显示
        // 根据视距逐渐加大标签
        scaleByDistance: new Cesium.NearFarScalar(500, 1.0, 100000, 0.5),
        css_transform_origin: 'initial',
        // depthTest: false,
        click: function(entity) {}, //单击
      });

      //鼠标单击/移入/移出事件
      $('#' + id).on('click', function() {
        const {
          id: projectId,
          projectName,
          longitude,
          latitude,
          height,
          url,
          geojsonPath,
          controlHeight,
          tiltAddress,
          tiltScope,
          tiltHeight,
          projectCode, // 项目编码
          projectType, // 项目分类
        } = window.BIMProject.projects[id]; // 从内存里根据id读取BIM项目的数据
        console.log('单击标签', projectName, icon, window.BIMProject.BIM3DTilesets);

        $this.removeBIMProjectTilesets(); // 从内存里删除BIM项目的模型

        // 加载倾斜模型，也是3DTileset，缓存到window.BIMProject.BIM3DTilesets。
        if (tiltAddress) {
          console.log('加载倾斜模型', tiltAddress);
          window.BIMProject.BIM3DTilesets.push(
            $this.add3DTileset(tiltAddress, tiltHeight, undefined, {
              skipLevelOfDetail: true, // SkilLOD
              preferLeaves: true,
              maximumMemoryUsage: 5120, // 最大内存
              maximumScreenSpaceError: window.BIMProject.maximumScreenSpaceError || 256, // 显示精度
            }),
          );
        }

        if (url === null || url === undefined) {
          viewer.camera.flyToBoundingSphere(
            new Cesium.BoundingSphere(
              Cesium.Cartesian3.fromDegrees(longitude, latitude, height),
              3000,
            ),
          );
        } else {
          // 加载模型
          const projects = Object.values(window.BIMProject.projects).filter(function(project) {
            if (project.url === null) {
              return null;
            }
            if (project.url === undefined) {
              return null;
            }
            if (project.url === url) {
              return project.url;
            }

            /* 计算两点之间的距离 */
            function getDistanceFromDegrees(start, end) {
              start = Cesium.Cartographic.fromDegrees.apply(null, start);
              end = Cesium.Cartographic.fromDegrees.apply(null, end);

              const geodesic = new Cesium.EllipsoidGeodesic();
              geodesic.setEndPoints(start, end);
              const distance = geodesic.surfaceDistance;

              return distance;
            }
            const buffer_radius = 500; // 缓冲区半径
            if (
              getDistanceFromDegrees(
                [longitude, latitude],
                [project.longitude, project.latitude],
              ) <= buffer_radius
            ) {
              return project.url;
            }
            return null;
          });
          console.log('加载模型', projects); // 加载url经纬度500米范围之内的其他模型
          projects.forEach(async function({ url, height, geojsonPath }) {
            if (url === null) {
              return;
            }
            if (url === undefined) {
              return;
            }
            if (url.endsWith('tileset.json') === false) {
              url = url + '/tileset.json';
            }
            let cesium3DTileset = $this.add3DTileset(url, height);
            window.BIMProject.BIM3DTilesets.push(cesium3DTileset); // 缓存已经加载的模型
            // 只飞往标签所在的位置
            if (url === icon.url) {
              const tileset = await cesium3DTileset.readyPromise;
              viewer.camera.flyToBoundingSphere(tileset.boundingSphere);
              // 压平倾斜模型：行政区的倾斜模型和指定的倾斜模型。
              // 使用mars3d.tiles.TilesFlat来压平模型
              // 只压平标签所在的模型，mars3d当前的版本只支持一个压平区域
              let flatHeight = await getFlatHeight();
              await BIMProjectUtility.flatten({
                viewer,
                geojsonPath,
                flatURL: tiltAddress,
                flatHeight,
                Flat3DTilesets: window.BIMProject.Flat3DTilesets,
                tiltAddress,
                tiltScope,
              });
            }
          });
        }

        async function getFlatHeight() {
          let { flatheight, url } = icon; // 压平的高度
          if (flatheight === undefined) {
            // 从接口数据里提取压平高度
            if (url) {
              try {
                const projectId = icon.id;
                const response = await Ajax({
                  method: 'GET',
                  url: `/gws/model/all/${projectId}`,
                });
                const response_data = response.data;
                console.log('flatHeight response_data', response_data);
                const { success, data } = response_data;
                if (success === true) {
                  let models = data.filter(function(item) {
                    return item.url.startsWith(url);
                  });
                  if (models.length > 0) {
                    flatheight = models.reverse()[0].flatheight;
                    window.BIMProject.projects[id].flatheight = flatheight;
                  }
                }
              } catch (error) {
                flatheight = 0;
              }
            } else {
              flatheight = 0;
            }
          }
          console.log('flatHeight', flatheight);
          return flatheight;
        }

        // viewer.camera.flyToBoundingSphere(cesium3DTileset.boundingSphere);

        // 点击项目标签后显示“项目详情”
        if (window.BIMProject.rootThis) {
          let project_limit_height_checked = false; // 项目详情里控高分析的默认值
          let project_redline_checked = false; // 项目详情里红线选项
          // 当“项目详情”面板不显示的时候，显示左侧的“项目详情”按钮。
          if (window.BIMProject.rootThis.state.project_detail_visible === false) {
            window.BIMProject.rootThis.setState({
              project_detail_layer_toggle_visible: true,
            });
          }
          window.BIMProject.rootThis.setState({
            project_detail: {
              projectName,
              longitude,
              latitude,
              height,
              controlHeight,
              geojsonPath,
              tiltAddress,
              tiltScope,
              tiltHeight,
              projectCode,
              projectType,
            },
            project_detail_id: projectId,
            project_compare_visible: false,
            project_map_fly_visible: false,
            project_limit_height_checked,
            project_redline_checked,
          });
          console.log('项目详情', window.BIMProject.rootThis.state.project_detail);
          // console.log(
          //   'project_limit_height_checked',
          //   window.BIMProject.rootThis.state.project_limit_height_checked,
          // );
          // 设置了项目详情里控高分析的默认值为true后
          if (project_limit_height_checked === true) {
            addProjectLimitHeight(viewer);
          }
          // 设置了项目详情里红线选项的默认值为true后
          if (project_redline_checked === true) {
            addProjectRedline(viewer);
          }
        }
      });
      resolve();
    });
  };
  /**
   * 删除BIM项目
   * @param {object} icon
   */
  removeBIMProject = icon => {
    const id = getProjectID(icon.projectName);
    // 删除场景里的标签
    const init_project = window.BIMProject.projects[id];
    if (init_project) {
      const label = init_project.label;
      if (label) {
        label.destroy();
        init_project.label = null;
      }
    }
    // 删除所有模型
    this.removeBIMProjectTilesets();
    // 删除内存里的BIM项目
    delete window.BIMProject.projects[id];
    // 关闭项目详情标签
    window.BIMProject.rootThis.setState({
      project_detail_visible: false,
    });
  };
  /**
   * 依据项目id获取项目
   * @param {number} projectId
   * @returns
   */
  getBIMProjectById = projectId => {
    return Object.values(window.BIMProject.projects).filter(function({ id }) {
      return id === projectId;
    })[0];
  };

  addDanTiHua = () => {
    const { storedData } = this.state;
    const {
      reality: { dantihua },
    } = motherBoard;
    const item = dantihua;
    return new Promise((resolve, reject) => {
      let cesium3DTilesets = [];
      var children = item.children;
      Object.keys(children).forEach(key => {
        let resource = getCesiumUrl(children[key], true); //new Cesium.Resource({ url: children[key], headers: { 'authorization': item.authorization , 'szvsud-license-key': window.localStorage.getItem('userLicenseKey')} })
        let cesium3DTileset = new Cesium.Cesium3DTileset({
          url: resource, //children[key],
          show: true,
          maximumScreenSpaceError: item.maximumScreenSpaceError,
          preferLeaves: item.preferLeaves,
          skipLevelOfDetail: true,
          skipLevels: 1,
          // skipScreenSpaceErrorFactor: 16,
          // immediatelyLoadDesiredLevelOfDetail: false,
          // loadSiblings: true,
          // cullWithChildrenBounds: true,
          // cullRequestsWhileMoving: true,
          // cullRequestsWhileMovingMultiplier: 0.01,
          // preloadWhenHidden: true,
          // progressiveResolutionHeightFraction: 0.1,
          // dynamicScreenSpaceErrorDensity: 500,
          // dynamicScreenSpaceErrorFactor: 1,
          // dynamicScreenSpaceError: true
        });
        cesium3DTilesets.push(cesium3DTileset);
      });

      setTimeout(() => {
        cesium3DTilesets &&
          cesium3DTilesets.forEach(item => {
            viewer.scene.primitives.add(item);
          });
        this.goDantihuaCenter();
      }, 200);

      this.setState(
        {
          storedData: {
            ...storedData,
            dantihua: cesium3DTilesets,
          },
        },
        () => {
          resolve();
        },
      );
    });
  };

  removeDanTiHua = item => {
    const { storedData } = this.state;
    return new Promise((resolve, rejeect) => {
      storedData['dantihua'] &&
        storedData['dantihua'].forEach(item => {
          viewer.scene.primitives.remove(item);
        });
      resolve();
    });
  };

  addDem = () => {
    const { storedData } = this.state;
    const {
      reality: { dem },
    } = motherBoard;
    return new Promise((resolve, reject) => {
      let terrainProvider = new Cesium.CesiumTerrainProvider({
        url: getCesiumUrl(dem.url, true),
      });
      viewer.terrainProvider = terrainProvider;
      resolve();
    });
  };

  removeDem = () => {
    return new Promise((resolve, reject) => {
      if (!(viewer.scene.terrainProvider instanceof Cesium.EllipsoidTerrainProvider)) {
        viewer.scene.terrainProvider = new Cesium.EllipsoidTerrainProvider({}); //置空地形
      }
      resolve();
    });
  };

  showTraffic = () => {
    const {
      dark: { sz_dark_map, global_dark_map, blue_guandongRoad },
      digital: { global_map, sz_map },
      reality: { sz_yx, sz_road, sz_district },
    } = motherBoard;
    return new Promise((resolve, reject) => {
      this.toggleBasemap(true)
        .then(() => {
          // return this.removeSzYX(sz_yx)
        })
        .then(() => {
          return this.removeWMS(sz_dark_map);
        })
        .then(() => {
          return this.removeWMTS(sz_map); //移除浅色电子
        })
        .then(() => {
          // return this.addWMS(global_dark_map)
        })
        .then(() => {
          // return this.addWMS(blue_guandongRoad)
        })
        .then(() => {
          // return this.addWMTS(sz_dark_map)
        });
      this.removeGeoJson(sz_district);
      this.removeOSGB_all()
        .then(() => {
          // this.removeDistrict();
          // return this.removeDistrictZhuji()
        })
        .then(() => {
          // return this.removeSzData(sz_road)
        })
        .then(() => {
          return this.removeDanTiHua();
        })
        .then(() => {
          // return this.removeDem()
        })
        .then(() => {
          resolve();
        });
    });
  };

  showOcean = () => {
    const {
      dark: { sz_dark_map, global_dark_map, blue_guandongRoad },
      reality: { sz_district, sz_road },
    } = motherBoard;
    return new Promise((resolve, reject) => {
      // this.removeGeoJson(sz_district)
      this.removeOSGB_all()
        .then(() => {
          return this.removeSzYX(); //去除深圳影像
        })
        .then(() => {
          this.removeDistrict();
          return this.removeDistrictZhuji();
        })
        .then(() => {
          return this.removeSzData(sz_road);
        })
        .then(() => {
          return this.removeDanTiHua();
        })
        .then(() => {
          return this.removeWMS(global_dark_map); //移除深色电子
        })
        .then(() => {
          return this.removeWMTS(sz_dark_map); //移除深色电子
        })
        .then(() => {
          return this.removeWMS(blue_guandongRoad);
        })
        .then(() => {
          return this.removeDem();
        })
        .then(() => {
          //添加影像basemap
          return this.toggleBasemap(true);
        })
        .then(() => {
          resolve();
        });
    });
  };

  showOceanWater = () => {
    const {
      reality: { sz_yx, sz_road, sz_osgb },
    } = motherBoard;
    this.showMonomerIcon(false);
    return new Promise((resolve, reject) => {
      this.removeOSGB_all(sz_osgb)
        .then(() => {
          return this.removeDanTiHua();
        })
        .then(() => {
          return this.removeMonomerModel();
        })
        .then(() => {
          //添加影像basemap
          return this.toggleBasemap(true);
        })
        .then(() => {
          return this.addDistrict();
        })
        .then(() => {
          return this.addDistrictZhuji();
        })
        .then(() => {
          return this.addSzYX(sz_yx); //加载深圳影像
        })
        .then(() => {
          return this.loadSzData(sz_road);
        })
        .then(() => {
          resolve();
        });
    });
  };

  showDanTiHua = () => {
    return new Promise((resolve, reject) => {
      // this.removeGeoJson(sz_district)
      this.removeOSGB_all()
        .then(() => {
          this.addDanTiHua();
        })
        .then(() => {
          this.addSzYX();
        })
        .then(() => {
          this.addDem();
        })
        .then(() => {
          resolve();
        });
    });
  };

  bindRemoveReality = () => {
    const {
      reality: { sz_district, sz_road },
    } = motherBoard;

    return new Promise((resolve, reject) => {
      // this.removeGeoJson(sz_district)
      this.removeDistrict()
        .then(() => {
          return this.removeSzYX(); //去除深圳影像
        })
        .then(() => {
          return this.removeDistrictZhuji();
        })
        .then(() => {
          return this.removeSzData(sz_road);
        })
        .then(() => {
          return this.removeOSGB_all();
        })
        .then(() => {
          return this.removeMonomerModel();
        })
        .then(() => {
          resolve();
        });
    });
  };

  //加载 3DTileset 数据 隐藏状态
  add3DTileset = (url, offsetHeight, modelMatrix, Cesium3DTilesetOptions) => {
    //url不存在 返回undefined
    let cesium3DTileset = undefined;
    if (url != undefined && url != '') {
      var cur3Dtiles = this.getModelbyurl(url);
      if (cur3Dtiles) {
        cur3Dtiles.show = true;
        return cur3Dtiles;
      }
      cesium3DTileset = new Cesium.Cesium3DTileset({
        url: getCesiumUrl(url, true),
        show: true,
        ...Cesium3DTilesetOptions,
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
  //获取 需要压平的倾斜摄影
  getFtileset = fmarkurl => {
    let Ftileset = this.getModelbyurl(fmarkurl);
    //需要压平的倾斜摄影没有加载时，添加
    if (Ftileset == undefined) {
      Ftileset = this.add3DTileset(fmarkurl);
    }
    return Ftileset;
  };
  //添加 进入单体化标签
  getdivpoint = (id, name, centerposition, cesium3DTileset) => {
    var divpoint = new mars3d.DivPoint(viewer, {
      id: 'I' + id,
      name: name,
      html: `<div class="${styles.divpointtheme}"><div class="${styles.title}" id="${'I' +
        id}">${name}</div></div>`,
      visible: true,
      position: centerposition,
      distanceDisplayCondition: new Cesium.DistanceDisplayCondition(1000, 200000), //按视距距离显示
      scaleByDistance: new Cesium.NearFarScalar(1000, 1.0, 100000, 0.1),
      click: function(entity) {}, //单击
    });
    if (cesium3DTileset == undefined) {
      divpoint.visible = false;
    }
    return divpoint;
  };
  //压平接口调用
  addflatten = (Ftileset, positions, flatHeight, object) => {
    //判断 是否 有相同倾斜摄影的压平
    let num = -1;
    let tilesflatten = undefined;
    if (window.nowTilesetList) {
      window.nowTilesetList.forEach((data, index) => {
        let tilesflatten = data.tilesflatten;
        if (tilesflatten.tileset.url == Ftileset.url) {
          num = index;
        }
      });
    }

    if (num != -1) {
      //存在相同的倾斜压平 //注销 再重新赋值
      window.nowTilesetList[num].tilesflatten.destroy();
      window.nowTilesetList.splice(num, 1); //删除num当前数组
    }
    // tilesflatten = new TilesFlatten({
    //   viewer: viewer,
    //   tileset: Ftileset,
    //   positions: positions,
    //   flatHeight: flatHeight, //压平高度
    //   Foptions: object
    // });
    if (Ftileset) {
    }
    tilesflatten = new mars3d.tiles.TilesFlat({
      viewer: viewer,
      tileset: Ftileset,
      positions: positions,
      flatHeight: flatHeight,
    });
    return tilesflatten;
  };
  //电子
  removELEModel = () => {
    const { storedData } = this.state;
    const { MonomerizationList, T3DTilesetList, nowTilesetList } = window;
    return new Promise((resolve, rejeect) => {
      //室内模型 隐藏
      // T3DTilesetList && T3DTilesetList.forEach((Indoor) => {
      //   Indoor.divpoint.visible = false;
      //   Indoor.cesium3DTileset.show = false;
      // });

      // if (document.getElementById("retracement") != undefined) {
      //   document.getElementById("retracement").style.display = "none";
      // }
      resolve();
    });
  };

  showMonomerIcon = flag => {
    return new Promise((resolve, reject) => {
      IndoormodeldivList &&
        IndoormodeldivList.forEach(data => {
          data.visible = flag;
        });
      resolve();
    });
  };

  //实景
  removeMonomerModel = () => {
    const { storedData } = this.state;
    const { MonomerizationList, T3DTilesetList, nowTilesetList } = window;
    return new Promise((resolve, rejeect) => {
      //倾斜摄影单体化 隐藏
      // MonomerizationList && MonomerizationList.forEach((data) => {
      //   if (data.cesium3DTileset != undefined) {
      //     data.divpoint.visible = false;
      //     data.cesium3DTileset.show = false;
      //   }
      // })
      //室内模型 隐藏
      // T3DTilesetList && T3DTilesetList.forEach((Indoor) => {
      //   Indoor.divpoint.visible = false;
      //   Indoor.cesium3DTileset.show = false;
      // });
      //关闭 压平
      // nowTilesetList && nowTilesetList.forEach((flatten) => {
      //   flatten.tilesflatten.destroy();
      // });
      this.flattenLists &&
        this.flattenLists.forEach((flatten, index) => {
          flatten.destroy();
          this.flattenLists.splice(index, 1);
        });
      // if (document.getElementById("retracement") != undefined) {
      //   document.getElementById("retracement").style.display = "none";
      // }

      //storedData.Handler && storedData.Handler.destroy();
      resolve();
    });
  };

  addBIMIcon = item => {
    const $this = this;
    const { storedData } = this.state;
    window.T3DTilesetList = window.T3DTilesetList == undefined ? [] : window.T3DTilesetList; //室内模型和标签 数组
    return new Promise((resolve, reject) => {
      //已经加载
      !storedData.IndoormodelList &&
        item.forEach(data => {
          let { entrance, flatpolygon, flaturl, flatHeight, name } = data; //入口位置和压平区域

          //添加入室标签
          var divpoint = new mars3d.DivPoint(viewer, {
            id: data.id,
            name: data.name,
            html: `<div class="${styles.divpointtheme}"><div class="${styles.title}" id="${data.id}">${data.name}</div></div>`,
            visible: true,
            position: Cesium.Cartesian3.fromDegrees(
              data.markposition.longitude,
              data.markposition.latitude,
              data.markposition.height,
            ),
            distanceDisplayCondition: new Cesium.DistanceDisplayCondition(3000, 116000), //按视距距离显示
            // scaleByDistance: new Cesium.NearFarScalar(500, 1.0, 100000, 0.1),
            click: function(entity) {}, //单击
          });
          IndoormodeldivList.push(divpoint);
          let cesium3DTileset = null;
          if (data.type === 2 && flatpolygon) {
            // cesium3DTileset = this.add3DTileset(data.url, data.offsetHeight, data.modelMatrix);
            let positions = new Cesium.Cartesian3.fromDegreesArray(flatpolygon);
            //var Ftpositions =new mars3d.draw.attr.polygon.getPositions(entity);
            let Ftileset = $this.getModelbyurl(flaturl);
            //let Ftileset = mars3d.tileset.pick3DTileset(viewer, Ftpositions);
            if (Ftileset) {
              Ftileset._config = {};
              var object = { name: name };
              var flatten = $this.addflatten(Ftileset, positions, flatHeight, object);
              // $this.flattenLists.push(flatten);
            } else {
              console.error('倾斜压平失误，请刷新');
            }
            // if ($this.FParentpolygon.show) {
            //   var redPolygon = viewer.entities.add({
            //     name: 'Fpolygon' + data.name,
            //     id: 'PY' + data.id,
            //     perPositionHeight: false,  //贴地参数
            //     parent: $this.FParentpolygon,
            //     polygon: {
            //       hierarchy: Cesium.Cartesian3.fromDegreesArray(flatpolygon),
            //       material: Cesium.Color.TRANSPARENT,
            //     //   distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 4600),//按视距距离显示
            //     },
            //     option: {
            //       flatHeight: data.flatHeight,
            //       fmarkurl: data.fmarkurl,
            //       flatpolygon: data.flatpolygon,
            //       cesium3DTile: cesium3DTileset,
            //       indoorheight: data.indoorheight,
            //       IndoorID: data.id
            //     },
            //     mouseover: function (entity) {//移入
            //       //console.log('你鼠标移入到billboard：' + entity._name);
            //       //执行压平

            //       $this.props.dispatch({
            //         type: 'Map/setIndoorID',
            //         payload: entity.option.IndoorID
            //       })

            //         // if (entity.option.fmarkurl === null) { return; }
            //         // //if (!$this.FtilesetTileset.asset.nametype.includes("obliquephotography")) { return; }
            //         // let positions = new Cesium.Cartesian3.fromDegreesArray(entity.option.flatpolygon);
            //         // //var Ftpositions =new mars3d.draw.attr.polygon.getPositions(entity);
            //         // let Ftileset = $this.getModelbyurl(entity.option.fmarkurl);
            //         // //let Ftileset = mars3d.tileset.pick3DTileset(viewer, Ftpositions);
            //         // if (Ftileset) {
            //         //   Ftileset._config = {};
            //         //   var object = { name: entity.name, cesium3DTile: entity.option.cesium3DTile }
            //         //   var flatten = $this.addflatten(Ftileset, positions, entity.option.flatHeight, object);
            //         //   $this.flattenLists.push(flatten);
            //         // } else {
            //         //   message.warning("倾斜压平失误，请刷新");
            //         // }

            //        //室内模型显示
            //        entity.option.cesium3DTile.show = true;
            //       //  $this.Ccesium3DTile = entity.option.cesium3DTile;
            //        if($this.Ccesium3DTile !==entity.option.cesium3DTile){
            //         if($this.Ccesium3DTile){
            //           $this.Ccesium3DTile.show=false;
            //         }
            //         $this.Ccesium3DTile = entity.option.cesium3DTile;
            //       }
            //        $this.newindoorheight=entity.option.indoorheight;
            //       //监听是否已经进入室内 并显示漫游和场景
            //       // $this.FlyandImportantscene(true);
            //       // $this.isInPoly(entity)
            //     },

            //   });
            // }
          }

          //鼠标单击/移入/移出事件
          $('#' + data.id).on('click', function() {
            console.log(data);
            if (data.id === 'cqzg' || data.id === 'zylt1') {
              $this.props.dispatch({
                type: 'Home/setTabsActiveKey',
                payload: data.id,
              });
              let oceanUri = `${PUBLIC_PATH}widgets/iframeView/widget.js`;
              mars3d.widget.activate({
                uri: oceanUri,
                autoDisable: false,
                disableOhter: false,
                iframesrc:
                  data.id === 'cqzg'
                    ? 'http://10.89.10.50:8080/changqiang/index.html'
                    : 'http://172.16.133.216:8081/index.html',
              });
              return;
            }
            if (data.type === 1) {
              //其他应用跳转
              window.open(data.url, '_blank');
            } else if (data.type === 2) {
              //室内模型跳转
              $this.FlyToIndoor(data);
              // $this.showCurrentIndoorModel(data);
              // 移除监听
              // viewer.camera.moveEnd.removeEventListener($this.isInBoundingBox, "rightFloatMenu");
            }
          });

          //数据 存储
          window.T3DTilesetList.push({
            cesium3DTileset: cesium3DTileset,
            divpoint: divpoint,
          });
          // $("#" + data.id).on('mouseover', function () {
          //   document.getElementById(data.id).innerHTML = "进入建筑";
          // })
          // $("#" + data.id).on('mouseout', function () {
          //   document.getElementById(data.id).innerHTML = data.name;
          // })
        });
      this.showMonomerIcon(true);

      this.setState(
        {
          storedData: {
            ...storedData,
            IndoormodelList: IndoormodeldivList,
          },
        },
        () => {
          //室内模型 隐藏
          // $this.FParentpolygon.show = false;
          // cesium3DTilesetList && cesium3DTilesetList.forEach((Indoor) => {
          //   Indoor.divpoint.visible = false;
          // });
          resolve();
        },
      );
    });
  };

  //添加室内模型 压平
  addIndoorModel2 = itm => {
    const $this = this;
    const { storedData } = this.state;
    let cesium3DTilesetList =
      storedData.IndoormodelList == undefined ? [] : storedData.IndoormodelList;
    window.T3DTilesetList = window.T3DTilesetList == undefined ? [] : window.T3DTilesetList; //室内模型和标签 数组

    return new Promise((resolve, reject) => {
      //已经加载
      !storedData.IndoormodelList &&
        itm.forEach(data => {
          let { entrance, flatpolygon } = data; //入口位置和压平区域
          //加载 模型
          let cesium3DTileset = this.add3DTileset(data.url, data.offsetHeight, data.modelMatrix);
          //this.getFtileset(data.fmarkurl);
          if (cesium3DTileset != undefined) {
            //添加入室标签
            var divpoint = new mars3d.DivPoint(viewer, {
              id: data.id,
              name: data.name,
              html: `<div class="${styles.divpointtheme}"><div class="${styles.title}" id="${data.id}">${data.name}</div></div>`,
              // visible: false,
              position: Cesium.Cartesian3.fromDegrees(
                data.markposition.longitude,
                data.markposition.latitude,
                data.markposition.height,
              ),
              // distanceDisplayCondition: new Cesium.DistanceDisplayCondition(200, 4600),//按视距距离显示
              // scaleByDistance: new Cesium.NearFarScalar(500, 1.0, 100000, 0.1),
              click: function(entity) {}, //单击
            });
            IndoormodeldivList.push(divpoint);
            //添加透明贴地面 TRANSPARENT
            if (flatpolygon) {
              if ($this.FParentpolygon.show) {
                var redPolygon = viewer.entities.add({
                  name: 'Fpolygon' + data.name,
                  id: 'PY' + data.id,
                  perPositionHeight: false, //贴地参数
                  parent: $this.FParentpolygon,
                  polygon: {
                    hierarchy: Cesium.Cartesian3.fromDegreesArray(flatpolygon),
                    // material: Cesium.Color.TRANSPARENT,
                    distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 4600), //按视距距离显示
                  },
                  option: {
                    flatHeight: data.flatHeight,
                    fmarkurl: data.fmarkurl,
                    flatpolygon: data.flatpolygon,
                    cesium3DTile: cesium3DTileset,
                    indoorheight: data.indoorheight,
                    IndoorID: data.id,
                  },
                  mouseover: function(entity) {
                    //移入
                    //console.log('你鼠标移入到billboard：' + entity._name);
                    //执行压平
                    var isFtileset = $this.isFtileset(entity._name);
                    $this.props.dispatch({
                      type: 'Map/setIndoorID',
                      payload: entity.option.IndoorID,
                    });
                    if (isFtileset) {
                      //
                      $this.flattenLists.forEach(element => {
                        if (element.Foptions.name === entity._name) {
                          element.startEdit();
                        }
                      });
                    } else {
                      if (entity.option.fmarkurl === null) {
                        return;
                      }
                      //if (!$this.FtilesetTileset.asset.nametype.includes("obliquephotography")) { return; }
                      let positions = new Cesium.Cartesian3.fromDegreesArray(
                        entity.option.flatpolygon,
                      );
                      //var Ftpositions =new mars3d.draw.attr.polygon.getPositions(entity);
                      let Ftileset = $this.getModelbyurl(entity.option.fmarkurl);
                      //let Ftileset = mars3d.tileset.pick3DTileset(viewer, Ftpositions);
                      if (Ftileset) {
                        Ftileset._config = {};
                        var object = {
                          name: entity.name,
                          cesium3DTile: entity.option.cesium3DTile,
                        };
                        var flatten = $this.addflatten(
                          Ftileset,
                          positions,
                          entity.option.flatHeight,
                          object,
                        );
                        $this.flattenLists.push(flatten);
                      } else {
                        message.warning('倾斜压平失误，请刷新');
                      }
                    }
                    //室内模型显示
                    entity.option.cesium3DTile.show = true;
                    //  $this.Ccesium3DTile = entity.option.cesium3DTile;
                    if ($this.Ccesium3DTile !== entity.option.cesium3DTile) {
                      if ($this.Ccesium3DTile) {
                        $this.Ccesium3DTile.show = false;
                      }
                      $this.Ccesium3DTile = entity.option.cesium3DTile;
                    }
                    $this.newindoorheight = entity.option.indoorheight;
                    //监听是否已经进入室内 并显示漫游和场景
                    // $this.FlyandImportantscene(true);
                    // $this.isInPoly(entity)
                  },
                  mouseout: function(entity) {
                    //移出
                    //console.log('你鼠标移出了billboard：' + entity._name);
                    //取消监听
                    // $this.FlyandImportantscene(false);
                    $this.newindoorheight = 10000000000;
                    //$this.isInPoly(entity)
                  },
                });
              }
            }

            //鼠标单击/移入/移出事件
            $('#' + data.id).on('click', function() {
              // 隐藏单体化数据--看是否需要移除
              // $this.setDanTiHuaVisiable(false);
              // $this.removeSzYX();

              $this.FlyToIndoor(data);
              // $this.isflying();
              $this.showCurrentIndoorModel(data);

              // 移除监听
              $this.removeMoveEndEvent('rightFloatMenu');
              //  viewer.camera.moveEnd.removeEventListener(this.isInBoundingBox,this);
            });
            $('#' + data.id).on('mouseover', function() {
              document.getElementById(data.id).innerHTML = '进入建筑';
            });
            $('#' + data.id).on('mouseout', function() {
              document.getElementById(data.id).innerHTML = data.name;
            });

            //数据 存储
            window.T3DTilesetList.push({
              cesium3DTileset: cesium3DTileset,
              divpoint: divpoint,
            });
          }
        });
      $this.FParentpolygon.show = false;

      if (cesium3DTilesetList.length == 0) {
        cesium3DTilesetList = window.T3DTilesetList;
      }
      this.undergroundmodel();
      this.setState(
        {
          storedData: {
            ...storedData,
            IndoormodelList: cesium3DTilesetList,
          },
        },
        () => {
          //室内模型 隐藏
          // $this.FParentpolygon.show = false;
          // cesium3DTilesetList && cesium3DTilesetList.forEach((Indoor) => {
          //   Indoor.divpoint.visible = false;
          // });
          resolve();
        },
      );
    });
  };
  //电子 添加室内模型 裁切
  eleaddIndoorModel = itm => {
    const $this = this;
    const { storedData } = this.state;
    let cesium3DTilesetList =
      storedData.IndoormodelList == undefined ? [] : storedData.IndoormodelList;
    window.T3DTilesetList = window.T3DTilesetList == undefined ? [] : window.T3DTilesetList; //室内模型和标签 数组

    return new Promise((resolve, reject) => {
      //已经加载
      itm.forEach(data => {
        let { entrance, cutterpolygon } = data; //入口位置和压平区域
        //加载 模型
        let cesium3DTileset = this.getFtileset(data.url);
        //this.getFtileset(data.fmarkurl);
        if (cesium3DTileset != undefined) {
          //添加透明贴地面 TRANSPARENT
          if (cutterpolygon) {
            if ($this.CutParentpolygon.show) {
              var redPolygon = viewer.entities.add({
                name: 'ELEpolygon' + data.name,
                id: 'ELEY' + data.id,
                perPositionHeight: false, //贴地参数
                parent: $this.CutParentpolygon,
                polygon: {
                  hierarchy: Cesium.Cartesian3.fromDegreesArray(cutterpolygon),
                  //   material: Cesium.Color.TRANSPARENT
                },
                option: {
                  offsetHeight: data.offsetHeight,
                  cutterurl: data.cutterurl,
                  cutterpolygon: data.cutterpolygon,
                  cesium3DTile: cesium3DTileset,
                },
                mouseover: function(entity) {
                  //裁切区移入
                  let CUTtileset = $this.getFtileset(entity.option.cutterurl);
                  if (!$this.clipTileset) {
                    $this.clipTileset = new mars3d.tiles.TilesClipPlan(CUTtileset);
                  }
                  if ($this.clipTileset) {
                    //执行裁切
                    var Elepositions = new Cesium.Cartesian3.fromDegreesArray(
                      entity.option.cutterpolygon,
                    );
                    //var ss=Elepositions.toString();
                    if (Elepositions != 'undefined') {
                      $this.clipTileset.clipByPoints(Elepositions, {
                        unionClippingRegions: false,
                      });
                    }
                  }
                  //室内模型显示
                  entity.option.cesium3DTile.show = true;
                  // $this.Ccesium3DTile = entity.option.cesium3DTile;
                  if ($this.Ccesium3DTile !== entity.option.cesium3DTile) {
                    if ($this.Ccesium3DTile) {
                      $this.Ccesium3DTile.show = false;
                    }
                    $this.Ccesium3DTile = entity.option.cesium3DTile;
                  }
                },
                mouseout: function(entity) {
                  //裁切区移出
                  if ($this.clipTileset) {
                    //白膜剖切取消
                    $this.clipTileset.clear();
                    $this.Ccesium3DTile.show = false;
                  }
                },
              });
            }
          }
        } else {
          cesium3DTileset = this.add3DTileset(data.url, data.offsetHeight, data.modelMatrix);
        }
      });
      $this.CutParentpolygon.show = false;

      if (cesium3DTilesetList.length == 0) {
        cesium3DTilesetList = window.T3DTilesetList;
      }
      this.setState(
        {
          storedData: {
            ...storedData,
            IndoormodelList: cesium3DTilesetList,
          },
        },
        () => {
          //室内模型 隐藏
          // cesium3DTilesetList && cesium3DTilesetList.forEach((Indoor) => {
          //   Indoor.divpoint.visible = true;
          // });
          resolve();
        },
      );
    });
  };

  updateKeyboardRoam = () => {
    var that = this;
    let levelList = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24];
    let newmoveStepList = [
      200,
      150,
      100,
      70,
      30,
      10,
      8,
      5,
      0.3,
      0.15,
      0.05,
      0.05,
      0.05,
      0.05,
      0.05,
    ];
    // 防抖
    function debounces(fn, wait) {
      var timeouts = null;

      return function() {
        if (timeouts) {
          clearTimeout(timeouts);
        }
        timeouts = setTimeout(fn, wait);
      };
    }

    function handlers() {
      var level = 0;
      if (viewer.scene.globe._surface._tilesToRender.length) {
        level = viewer.scene.globe._surface._tilesToRender[0].level;
      }
      const { isHomekeystop } = that.props.RightFloatMenu;
      const { IndoorKey } = that.props.Map;
      if (level) {
        var innum = levelList.indexOf(level);
        if (!viewer.mars.keyboardRoam.enable) {
          if (!isHomekeystop) {
            //搜索按钮开始时不执行
            viewer.mars.keyboardRoam.bind();
          }
        }

        if (viewer.mars.keyboardRoam.moveStep !== newmoveStepList[innum]) {
          if (IndoorKey === 'indoorroam') {
            viewer.mars.keyboardRoam.moveStep = 0.15;
          } else {
            viewer.mars.keyboardRoam.moveStep = newmoveStepList[innum];
          }
        }
      }
    }
    var fun = debounces(handlers, 1500);
    window.addEventListener('mousemove', fun);
  };
  //二三维都无法删除的钻孔POI
  undergroundmodel = () => {
    const that = this;
    // let hasLhzkPOI= viewer.dataSources.getByName("lhzkpoi")[0];
    // if(hasLhzkPOI){
    //   that.FtilesetTileset = { url: null };
    //   that.flattenLists = [];
    //   return;
    // }

    // let zk_poi = new Cesium.CustomDataSource("lhzkpoi");
    // viewer.dataSources.add(zk_poi);
    const {
      reality: { lhzk_poi },
    } = motherBoard;
    let levelList = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24];
    let newmoveStepList = [200, 150, 100, 70, 30, 10, 8, 5, 3, 1.5, 0.9, 0.5, 0.3, 0.15, 0.05];

    // 防抖
    function debounces(fn, wait) {
      var timeouts = null;

      return function() {
        if (timeouts) {
          clearTimeout(timeouts);
        }
        timeouts = setTimeout(fn, wait);
      };
    }

    function handlers() {
      var level = 0;
      if (viewer.scene.globe._surface._tilesToRender.length) {
        level = viewer.scene.globe._surface._tilesToRender[0].level;
      }
      // if (level >= 14 && level <= 18) {
      //   //加载钻孔POI信息
      //   var dizhizk = datacutover.layers.dizhi[2]
      //   var Tilese = that.getModelbyurl(dizhizk.url);
      //   if (Tilese) {
      //     if (Tilese.show) {
      //       var oldpointEntity = zk_poi.entities.getById("point0" + level);
      //       if (!oldpointEntity) {
      //         that.addlhzkPOI(level, lhzk_poi, zk_poi);
      //       } else {
      //         var zentities = zk_poi.entities.values;
      //         if (zentities.length > 0) {
      //           for (var i = 0; i < zentities.length; i++) {
      //             var zentitie = zentities[i];
      //             var levelnum = Number(zentitie.name.replace(/[^0-9]/ig, ""))
      //             if (levelnum > level) {
      //               zk_poi.entities.remove(zentitie);
      //               i--;
      //             }
      //           }
      //         }
      //       }
      //     } else {
      //       zk_poi.entities.removeAll();
      //     }
      //   }
      // } else if (level < 14) {
      //   zk_poi.entities.removeAll();
      // }
      //根据层级设置键盘漫游的移动速度
      const { isSearchActive, isHomekeystop } = that.props.RightFloatMenu;
      const { IndoorKey } = that.props.Map;
      if (level) {
        var innum = levelList.indexOf(level);
        if (!viewer.mars.keyboardRoam.enable) {
          if (!isHomekeystop) {
            //搜索按钮开始时不执行
            viewer.mars.keyboardRoam.bind();
          }
        }

        if (viewer.mars.keyboardRoam.moveStep != newmoveStepList[innum]) {
          if (IndoorKey === 'indoorroam') {
            viewer.mars.keyboardRoam.moveStep = 0.15;
          } else {
            viewer.mars.keyboardRoam.moveStep = newmoveStepList[innum];
          }
        }
      }
    }
    this.collections = new Cesium.PrimitiveCollection();
    var fun = debounces(handlers, 1500);
    window.addEventListener('mousemove', fun);
    //that.dizhimagess();//地下模型的单击事件注册
    that.FtilesetTileset = { url: null };
    that.flattenLists = [];
  };
  //判断鼠标点坐标是否在多边形里
  isInPoly = Entity => {
    const $this = this;
    //if($this.isInArea){}
    var newhandler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    newhandler.setInputAction(analysisInpoly, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
    function analysisInpoly(event) {
      var position = mars3d.point.getCurrentMousePosition(viewer.scene, event.endPosition);
      $this.isInArea = mars3d.point.isInPoly(position, Entity);
      if (!$this.isInArea) {
        //不在压平区域里
        //判断是否在飞行
        if ($this.flyshow) {
          return;
        }
        var height = Math.ceil(viewer.camera.positionCartographic.height);
        if (height < 60) {
          return;
        }
        //取消压平
        $this.flattenLists.forEach((element, index) => {
          element.Foptions.cesium3DTile.show = false;
          element.destroy();
          $this.flattenLists.splice(index, 1);
        });
        newhandler.destroy();
      }
    }
  };
  isFtileset = name => {
    var Ftileset = null;
    if (this.flattenLists && this.flattenLists.length > 0) {
      this.flattenLists.forEach(element => {
        if (element.Foptions.name === name) {
          Ftileset = element;
        }
      });
    }
    return Ftileset;
  };
  //判断在执行飞行中
  isflying = () => {
    var $this = this;
    this.flyshow = true;
    viewer.camera.moveEnd.addEventListener(showindoor);
    function showindoor() {
      $this.flyshow = false;
      viewer.camera.moveEnd.removeEventListener(showindoor);
    }
  };

  removeMoveEndEvent = scope => {
    var event = viewer.camera.moveEnd;
    var listeners = event._listeners;
    var scopes = event._scopes;

    var index = -1;
    for (var i = 0; i < scopes.length; i++) {
      if (scopes[i] === scope) {
        index = i;
        break;
      }
    }
    if (index !== -1) {
      listeners.splice(index, 1);
      scopes.splice(index, 1);
    }
  };

  showCurrentIndoorModel = item => {
    var cur3Dtiles = this.getModelbyurl(item.url);
    cur3Dtiles.show = true;
    if (this.Ccesium3DTile !== cur3Dtiles) {
      if (this.Ccesium3DTile) {
        this.Ccesium3DTile.show = false;
      }
      this.Ccesium3DTile = cur3Dtiles;
    }

    cur3Dtiles.initialTilesLoaded.addEventListener(this.applyCollision, this);
  };

  applyCollision = () => {
    // 如果已经处于疏散模式，则跳过
    const { IndoorKey } = this.props.Map;
    if (IndoorKey !== 'indoorEvacuation') {
      viewer.mars.keyboardRoam.applyCollision = true;
      viewer.mars.keyboardRoam.applyGravity = true;
    }
  };
  //进入室内
  FlyToIndoor = item => {
    const {
      reality: { sz_osgb },
    } = motherBoard;
    const {
      storedData: { sz_yx },
    } = this.state;
    let entrance = item.entrance;
    let that = this;
    if (sz_yx) {
      sz_yx.show = true; //显示深圳影响
    }

    let cartesian = Cesium.Cartesian3.fromDegrees(
      entrance.position.longitude,
      entrance.position.latitude,
      entrance.position.height,
    );
    viewer.camera.flyTo({
      destination: cartesian,
      orientation: {
        heading: Cesium.Math.toRadians(entrance.orientation.heading),
        pitch: Cesium.Math.toRadians(entrance.orientation.pitch),
        roll: Cesium.Math.toRadians(entrance.orientation.roll),
      },
      complete: () => {
        viewer.mars.keyboardRoam.moveForward(0.01);
        viewer.mars.keyboardRoam.moveStep = 0.15;
        // this.setDanTiHuaVisiable(false);
        // this.removeSzYX();
        // 隐藏或删除单体化数据
        // this.cleardantihua();
        // if(this.Ccesium3DTile && this.Ccesium3DTile._initialTilesLoaded){
        //   setTimeout(()=>{
        //     this.applyCollision();
        //   })
        // }
        // 开启碰撞检测，需要等待加载完成才可以开启检测
        // viewer.mars.keyboardRoam.applyCollision=true;
        // viewer.mars.keyboardRoam.applyGravity=true;
        // 限制鼠标操作
        // 延迟操作，flyTo会将enableInputs更新为true;\
        setTimeout(() => {
          // viewer.scene.screenSpaceCameraController.enableInputs=false;
          // this.setPanelVisiable(true,item.id);
          if (!viewer.mars.keyboardRoam.enable) {
            viewer.mars.keyboardRoam.bind();
          }
        });
      },
    });
  };

  isInBoundingBox = () => {
    const {
      dataswicth: { bimIcon: Indoormodel },
    } = datacutover;
    let point = viewer.camera.position;
    for (let i = 0; i < Indoormodel.length; i++) {
      const item = Indoormodel[i];
      if (!item.boundBoxPoints) continue;
      let positions = Cesium.Cartesian3.fromDegreesArrayHeights(item.boundBoxPoints); // 计算包围盒
      let bbox = Cesium.AxisAlignedBoundingBox.fromPoints(positions);
      if (this.containsPoint(bbox, point)) {
        console.log('IN');
        // this.isflying();
        // this.FlyToIndoor(item);
        // this.showCurrentIndoorModel(item);
        this.add3DTileset(item.url, item.offsetHeight, item.modelMatrix);
        // 移除监听
        // viewer.camera.moveEnd.removeEventListener(this.isInBoundingBox, "rightFloatMenu");

        // 隐藏单体化数据--看是否需要移除
        // this.setDanTiHuaVisiable(false);
        // this.removeSzYX(false);
        break;
      }
    }
  };

  containsPoint = (box, point) => {
    return point.x < box.minimum.x ||
      point.x > box.maximum.x ||
      point.y < box.minimum.y ||
      point.y > box.maximum.y ||
      point.z < box.minimum.z ||
      point.z > box.maximum.z
      ? false
      : true;
  };

  //设置室内模型漫游弹框显示隐藏
  setPanelVisiable = (flag, IndoorID) => {
    if (flag) {
      this.props.dispatch({
        type: 'Map/setIndoorID',
        payload: IndoorID,
      });
      this.props.dispatch({
        type: 'Map/setIndoorKey',
        payload: 'indoorroam',
      });
      //同时还需要设置模型的ID,用于弹框内容的获取
    } else {
      this.props.dispatch({
        type: 'Map/setIndoorKey',
        payload: '',
      });
    }
  };
  setDanTiHuaVisiable = flag => {
    const {
      reality: {
        dantihua: { children: items },
      },
    } = motherBoard;
    return new Promise((resolve, rejeect) => {
      Object.keys(items).forEach(key => {
        let url = items[key];
        let danTHModel = this.getModelbyurl(url);
        if (danTHModel) {
          danTHModel.show = flag;
        }
      });
      resolve();
    });
  };

  //室内漫游及重要场景
  FlyandImportantscene = (isindoor, indoorheight) => {
    var $this = this;
    //判断鼠标是否在模型里和视角是否在固定高度内
    if (isindoor) {
      viewer.camera.moveEnd.addEventListener(this.showpanel, this);
      viewer.camera.changed.addEventListener(this.showpanel, this);
    } else {
      viewer.camera.moveEnd.removeEventListener(this.showpanel, this);
      viewer.camera.changed.removeEventListener(this.showpanel, this);
      $this.props.dispatch({
        type: 'Map/setIndoorKey',
        payload: '',
      });
    }
  };
  showpanel = () => {
    var height = Math.ceil(viewer.camera.positionCartographic.height);
    if (height < this.newindoorheight) {
      this.props.dispatch({
        type: 'Map/setIndoorKey',
        payload: 'indoorroam',
      });
    }
  };

  toggleBasemap = flag => {
    const { marsBasemap } = this.props.Map;
    return new Promise((resolve, rejeect) => {
      // let s = viewer.mars.getBasemap()
      marsBasemap && marsBasemap.setVisible(flag);
      if (marsBasemap && flag) {
        viewer.imageryLayers.lowerToBottom(marsBasemap.layer);
      }
      resolve();
    });
  };

  addArcGIS2000 = item => {
    const { storedData } = this.state;
    return new Promise((resolve, reject) => {
      if (!storedData[item.key]) {
        var wellKnownText =
          'PROJCS["CGCS2000_3_Degree_GK_CM_120E",GEOGCS["GCS_China_Geodetic_Coordinate_System_2000",DATUM["D_China_2000",SPHEROID["CGCS2000",6378137.0,298.257222101]],PRIMEM["Greenwich",0.0],UNIT["Degree",0.0174532925199433]],PROJECTION["Transverse_Mercator"],PARAMETER["False_Easting",3175.49],PARAMETER["False_Northing",-26091.448],PARAMETER["Central_Meridian",121.5],PARAMETER["Scale_Factor",1.0],PARAMETER["Latitude_Of_Origin",31.0],UNIT["Meter",1.0]]';
        let provider = new Cesium.ArcGisMapServerImageryProviderExt({
          url: item.url,
          projection: new Cesium.Proj4ProjectionExt({
            wellKnownText: wellKnownText,
          }),
        });
        let imageryLayer = viewer.imageryLayers.addImageryProvider(provider);
        this.setState(
          {
            storedData: {
              ...storedData,
              [item.key]: imageryLayer,
            },
          },
          () => {
            resolve();
          },
        );
      } else {
        this.showOrHideWMS(item, true);
        resolve();
      }
    });
  };

  addWMS = item => {
    const { storedData } = this.state;
    return new Promise((resolve, reject) => {
      if (!storedData[item.key]) {
        let provider = new Cesium.WebMapServiceImageryProvider({
          url: getCesiumUrl(item.url, true),
          layers: item.layerName,
          parameters: {
            transparent: true,
            crs: item.crs,
            format: 'image/png',
          },
        });
        let imageryLayer = viewer.imageryLayers.addImageryProvider(provider);
        this.setState(
          {
            storedData: {
              ...storedData,
              [item.key]: imageryLayer,
            },
          },
          () => {
            resolve();
          },
        );
      } else {
        this.showOrHideWMS(item, true);
        resolve();
      }
    });
  };

  showOrHideWMS = (item, flag) => {
    const { storedData } = this.state;
    return new Promise((resolve, reject) => {
      if (storedData[item.key]) {
        storedData[item.key].show = flag;
      }
      resolve();
    });
  };

  addWMTS = item => {
    const { storedData } = this.state;
    //需要对4490的服务做判断
    return new Promise((resolve, reject) => {
      let provider = null;
      if (item.tileMatrixSetID && item.tileMatrixSetID.indexOf('4490') !== -1) {
        // let url=`${url}rest/${mapName.value}/${gridsetName.value}/${gridsetName.value}:{sz}/{y}/{x}?format=image/png`;
        provider = new Cesium.UrlTemplateImageryProvider({
          url: getCesiumUrl(item.url, true),
          tilingScheme: new Cesium.GeographicTilingScheme(),
          minimumLevel: 0,
          customTags: {
            sz: function(imageryProvider, x, y, level) {
              return level - 9;
            },
            TileMatrix: function(imageryProvider, x, y, level) {
              return level - 9;
            },
            TileMatrixSet: function(imageryProvider, x, y, level) {
              return item.tileMatrixSetID;
            },
            TileRow: function(imageryProvider, x, y, level) {
              return y;
            },
            TileCol: function(imageryProvider, x, y, level) {
              return x;
            },
          },
        });
      } else {
        provider = new Cesium.WebMapTileServiceImageryProvider({
          url: getCesiumUrl(item.url, true),
          format: item.format,
          tileMatrixSetID: item.tileMatrixSetID,
        });
      }
      // var provider = new Cesium.WebMapTileServiceImageryProvider({
      //   url: getCesiumUrl(item.url,true),
      //   format: item.format,
      //   tileMatrixSetID: item.tileMatrixSetID,
      // });
      let imageryLayer = viewer.imageryLayers.addImageryProvider(provider);

      this.setState(
        {
          storedData: {
            ...storedData,
            [item.key]: imageryLayer,
          },
        },
        () => {
          resolve();
        },
      );
    });
  };

  removeWMTS = item => {
    const { storedData } = this.state;
    return new Promise((resolve, reject) => {
      storedData[item.key] && viewer.imageryLayers.remove(storedData[item.key]);
      this.setState(
        {
          storedData: {
            ...storedData,
            [item.key]: null,
          },
        },
        () => {
          resolve();
        },
      );
    });
  };

  removeWMS = item => {
    const { storedData } = this.state;
    return new Promise((resolve, reject) => {
      storedData[item.key] && viewer.imageryLayers.remove(storedData[item.key]);

      this.setState(
        {
          storedData: {
            ...storedData,
            [item.key]: null,
          },
        },
        () => {
          resolve();
        },
      );
    });
  };

  //添加白模
  addWhiteModel = item => {
    const { storedData } = this.state;
    return new Promise((resolve, reject) => {
      let cesium3DTileset = new Cesium.Cesium3DTileset({
        url: getCesiumUrl(item.url, true),
      });
      if (item.rendered) {
        let floor = item.floor;
        cesium3DTileset.style = new Cesium.Cesium3DTileStyle({
          color: {
            conditions: [
              ['${' + floor + '} > 20', 'color("#D7ECFF", 1)'],
              ['${' + floor + '} >= 10', 'color("#D0FFF0", 1)'],
              ['${' + floor + '} >= 5', 'color("#FAFAFA", 1)'],
              ['true', 'color("#FAFAFA", 1)'],
            ],
          },
          // color: 'color("#E0F2FF",0.98)', // E0F2FF   F1F9FF   CAE9FF
          // show: '${Floor} > 0',
        });
      }
      viewer.scene.primitives.add(cesium3DTileset);
      cesium3DTileset.readyPromise.then(tileset => {
        if (item.offsetHeight) {
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
            item.offsetHeight,
          );
          let translation = Cesium.Cartesian3.subtract(offset, surface, new Cesium.Cartesian3());
          tileset.modelMatrix = Cesium.Matrix4.fromTranslation(translation);
        }
      });
      this.setState(
        {
          storedData: {
            ...storedData,
            [item.key]: cesium3DTileset,
          },
        },
        () => {
          resolve();
        },
      );
    });
  };

  addWhiteModel2 = item => {
    const { storedData } = this.state;

    // 防止重复加载白模
    // 根据url获取
    let whiteModel = this.getModelbyurl(item.url);
    if (whiteModel) {
      whiteModel.style = new Cesium.Cesium3DTileStyle({
        color: {
          conditions: [
            // ['true', 'rgb(149, 228, 12)']
            // ['true', 'rgb(3, 104, 255)']
            // ['${'+floor+'} > 20', 'color("#D7ECFF", 1)'],
            // ['${'+floor+'} >= 10', 'color("#D0FFF0", 1)'],
            // ['${'+floor+'} >= 5', 'color("#FAFAFA", 1)'],
            ['true', `color("${item.color}", 1)`],
          ],
        },
      });
      this.setState({
        storedData: {
          ...storedData,
          [item.key]: whiteModel,
        },
      });
      return Promise.resolve();
    }
    return new Promise((resolve, reject) => {
      let floor = item.floor;
      let cesium3DTileset = new Cesium.Cesium3DTileset({
        url: item.url, //getCesiumUrl(item.url,true),
        // maximumScreenSpaceError: 16,
        // maximumMemoryUsage: 4000,
        // preferLeaves: false,
        // skipLevelOfDetail: true,
        // skipLevels: 1,
        // skipScreenSpaceErrorFactor: 16,
        // immediatelyLoadDesiredLevelOfDetail: false,
        // loadSiblings: true,
        // cullWithChildrenBounds: true,
        // cullRequestsWhileMoving: true,
        // cullRequestsWhileMovingMultiplier: 0.01,
        // preloadWhenHidden: true,
        // progressiveResolutionHeightFraction: 0.1,
        // dynamicScreenSpaceErrorDensity: 10000,
        // dynamicScreenSpaceErrorFactor: 1,
        // dynamicScreenSpaceError: true,
      });
      viewer.scene.primitives.add(cesium3DTileset);
      cesium3DTileset.readyPromise.then(function(tileset) {
        tileset.style = new Cesium.Cesium3DTileStyle({
          color: {
            conditions: [
              // ['true', 'rgb(149, 228, 12)']
              // ['true', 'rgb(3, 104, 255)']
              // ['${'+floor+'} > 20', 'color("#D7ECFF", 1)'],
              // ['${'+floor+'} >= 10', 'color("#D0FFF0", 1)'],
              // ['${'+floor+'} >= 5', 'color("#FAFAFA", 1)'],
              ['true', `color("${item.color}", 1)`],
            ],
          },
        });
      });

      this.setState(
        {
          storedData: {
            ...storedData,
            [item.key]: cesium3DTileset,
          },
        },
        () => {
          resolve();
        },
      );
    });
  };

  addWhiteModel3 = item => {
    const { storedData } = this.state;
    return new Promise((resolve, reject) => {
      //白模底板数据
      var tileset = mars3d.layer.createLayer(
        {
          type: '3dtiles',
          name: '蛇口片区',
          url: item.url,
          maximumScreenSpaceError: 16,
          // "maximumMemoryUsage": 1024,
          showClickFeature: false,
          popup: false, //"all"
          visible: true,
        },
        viewer,
      );

      let floor = item.floor;
      // console.log(floor)
      // let floor = 'floor'
      //设置建筑物颜色
      tileset.model.style = new Cesium.Cesium3DTileStyle({
        color: {
          conditions: [
            // ['true', 'rgb(149, 228, 12)']
            // ['true', 'rgb(3, 104, 255)']
            ['${' + floor + '} > 20', 'color("#D7ECFF", 1)'],
            // ['${'+floor+'} >= 10', 'color("#D0FFF0", 1)'],
            // ['${'+floor+'} >= 5', 'color("#FAFAFA", 1)'],
            // ['true', 'color("#FAFAFA", 1)']
          ],
        },
      });

      this.setState(
        {
          storedData: {
            ...storedData,
            [item.key]: tileset,
          },
        },
        () => {
          resolve();
        },
      );
    });
  };

  removeWhiteModel = () => {
    const { storedData } = this.state;
    return new Promise((resolve, reject) => {
      storedData.whiteModel && viewer.scene.primitives.remove(storedData.whiteModel);
      resolve();
    });
  };

  removeWhiteModel2 = item => {
    const { storedData } = this.state;
    return new Promise((resolve, reject) => {
      storedData[item.key] && viewer.scene.primitives.remove(storedData[item.key]);
      storedData[item.key] && storedData[item.key].destroy();
      // 从primitive中移除
      // 根据url删除
      // let whiteModel=this.getModelbyurl(item.url);
      // if(whiteModel){
      //   viewer.scene.primitives.remove([item.key])
      // }
      this.setState(
        {
          storedData: {
            ...storedData,
            [item.key]: null,
          },
        },
        () => {
          resolve();
        },
      );
    });
  };

  showOrHideWhiteModel = (item, flag) => {
    const { storedData } = this.state;
    return new Promise((resolve, reject) => {
      if (storedData[item.key]) {
        storedData[item.key].show = flag;
      } else {
        this.addWhiteModel2(item);
      }
      resolve();
    });
  };

  addGeoJson = item => {
    const { storedData } = this.state;
    return new Promise(async (resolve, reject) => {
      const dataSource = await viewer.dataSources.add(
        Cesium.GeoJsonDataSource.load(item.url, {
          clampToGround: true,
        }),
      );
      this.setState(
        {
          storedData: {
            ...storedData,
            [item.key]: dataSource,
          },
        },
        () => {
          resolve();
        },
      );
    });
  };

  removeGeoJson = item => {
    const { storedData } = this.state;
    return new Promise((resolve, reject) => {
      storedData[item.key] && viewer.dataSources.remove(storedData[item.key], true);
      resolve();
    });
  };

  //加载行政区
  addDistrict = () => {
    const { storedData } = this.state;
    let hasDistrict = viewer.dataSources.getByName('LG_PL.json')[0];
    if (hasDistrict) {
      return Promise.resolve();
    }
    return new Promise((resolve, reject) => {
      let promise_line = Cesium.GeoJsonDataSource.load(URL.districtMultPolyline, {
        clampToGround: true,
      });
      promise_line.then(data => {
        viewer.dataSources.add(data);
        let entities = data.entities.values;
        entities.map(entity => {
          entity.polyline.width = 3;
          // entity.polyline.clampToGround = true;
          // entity.polyline.classificationType = Cesium.ClassificationType.CESIUM_3D_TILE
          entity.polyline.material = new Cesium.PolylineGlowMaterialProperty({
            glowPower: 0.6,
            color: Cesium.Color.fromCssColorString('#1694E7').withAlpha(0.9),
          });
        });

        // Ajax(URL.shenZhenWall).then(res => {
        //   const coorArr = res.data.coordinates;
        //   let maximumHeights = [];
        //   let minimumHeights = [];
        //   if (coorArr) {
        //     coorArr.forEach((item, index) => {
        //       if (index % 2 === 0) {
        //         maximumHeights.push(800);
        //         minimumHeights.push(0);
        //       }
        //     });
        //   }

        this.setState(
          {
            storedData: {
              ...storedData,
              district: [data],
            },
          },
          () => {
            resolve();
          },
        );

        // })
      });
    });
  };

  removeDistrict = () => {
    const { storedData } = this.state;
    return new Promise((resolve, reject) => {
      if (storedData['district'] && storedData['district'].length != 0) {
        viewer.dataSources.remove(storedData['district'][0], true);
      }

      if (storedData['district'] && storedData['district'].length > 1) {
        viewer.entities.remove(storedData['district'][1], true);
      }

      resolve();
    });
  };

  changeDistrict = isTrue => {
    const { storedData } = this.state;
    return new Promise((resolve, reject) => {
      if (storedData['district']) {
        storedData['district'][0].show = isTrue;
      }
      resolve();
    });
  };

  //添加行政区注记
  addDistrictZhuji = () => {
    const { storedData } = this.state;
    const { positionDistrict } = this.props.BaseMap;
    let hasZhuji = viewer.dataSources.getByName('sz_district_zhuji')[0];
    if (hasZhuji) {
      return Promise.resolve();
    }
    return new Promise((resolve, reject) => {
      let dataSource = new Cesium.CustomDataSource('sz_district_zhuji');
      viewer.dataSources.add(dataSource);
      Object.keys(positionDistrict).forEach(item => {
        const label = dataSource.entities.add({
          position: Cesium.Cartesian3.fromDegrees(...positionDistrict[item], 150),
          label: {
            id: item,
            text: item,
            font: 24 + 'px PingFangSC-Medium',
            fillColor: Cesium.Color.WHITE,
            translucencyByDistance: new Cesium.NearFarScalar(1.5e5, 1.0, 1.5e6, 0.0),
            scaleByDistance: new Cesium.NearFarScalar(1.5e5, 1.0, 1.5e6, 0.1),
            outlineWidth: 2,
            backgroundPadding: new Cesium.Cartesian2(12, 8),
            backgroundColor: Cesium.Color.fromCssColorString('#1694E7').withAlpha(0.1),
            pixelOffset: new Cesium.Cartesian2(-30, -30),
            horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
          },
        });
      });
      this.setState(
        {
          storedData: {
            ...storedData,
            sz_district_zhuji: dataSource,
          },
        },
        () => {
          resolve();
        },
      );
    });
  };
  //添加钻孔POI
  addlhzkPOI = (level, lhzk_poi, zk_poi) => {
    let that = this;
    var currentlevel = level;
    var fontsize;
    const sourcejson = {
      WFSdatasource: {
        name: 'jzm',
        url: lhzk_poi.url, //"http://168.4.0.26:8080/geoserver/DIBIAO/wfs",
        parameters: {
          service: 'WFS',
          request: 'GetFeature',
          typename: lhzk_poi.layername,
          version: '1.0.0',
          outputFormat: 'application/json',
          srs: 'EPSG:4490',
          maxFeatures: 200,
        },
      },
      queryfield: {
        namefield: ['level'],
      },
    };
    var levelobject = { min: 14, max: 18 };
    var queryMapserver = new QueryGeoServer(sourcejson.WFSdatasource);
    addzicon(currentlevel);
    function addzicon(currentlevel) {
      queryMapserver.query({
        level: 'level',
        levelvalue: currentlevel,
        success: result => {
          if (result.dataSource) {
            if (result.dataSource.entities.values.length > 0) {
              //zk_poi.entities.removeAll();
              let entities = result.dataSource.entities.values;
              entities.map((entity, i) => {
                var oldpointEntity = zk_poi.entities.getById('point' + i + currentlevel);
                if (!oldpointEntity) {
                  var position = mars3d.pointconvert.cartesian2lonlat(entity.position.getValue());
                  var pointEntity = zk_poi.entities.add({
                    name: '点' + currentlevel,
                    id: 'point' + i + currentlevel,
                    position: Cesium.Cartesian3.fromDegrees(position[0], position[1], 50),
                    billboard: {
                      image: './config/images/mark/drill.png',
                      distanceDisplayCondition: new Cesium.DistanceDisplayCondition(500, 100000), //按视距距离显示
                      scaleByDistance: new Cesium.NearFarScalar(1000, 0.8, 100000, 0.3),
                      horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
                      verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                    },
                    option: {
                      X: entity.properties.X.getValue(),
                      Y: entity.properties.Y.getValue(),
                    },
                    click: function(entity) {
                      //单击
                      entity.show = false;
                      zkpoiadd = false;
                      var positions = mars3d.pointconvert.cartesian2lonlat(
                        entity.position.getValue(),
                      );
                      viewer.camera.flyTo({
                        destination: Cesium.Cartesian3.fromDegrees(
                          positions[0],
                          positions[1] - 0.0012,
                          60,
                        ),
                        orientation: {
                          pitch: Cesium.Math.toRadians(-22.1),
                        },
                      });
                      //贴地面
                      var collections = that.collections;
                      if (that.collections) {
                        that.collections.removeAll();
                      }
                      var positions = mars3d.pointconvert.cartesian2lonlat(
                        entity.position.getValue(),
                      );
                      var position = Cesium.Cartesian3.fromDegrees(
                        positions[0] + 0.000001,
                        positions[1] + 0.00000385,
                        -20,
                      );
                      //var position = Cesium.Cartesian3(entity.option.X, entity.option.Y, 0);
                      var circleinstance = new Cesium.GeometryInstance({
                        geometry: new Cesium.CircleGeometry({
                          center: position,
                          radius: 0.634,
                          /* extrudedHeight:1000000//拉申高度 */
                        }),
                        attributes: {
                          color: new Cesium.ColorGeometryInstanceAttribute(0.53, 0.9, 0.09, 0.5),
                        },
                      });
                      that.collections.add(
                        new Cesium.GroundPrimitive({
                          geometryInstances: [circleinstance],
                          appearance: new Cesium.PerInstanceColorAppearance(),
                        }),
                      );
                      that.collections._guid = 'dirlling';
                      viewer.scene.primitives.add(that.collections);
                      //根据XY请求数据
                      viewer.camera.moveEnd.addEventListener(ppp);
                      function ppp() {
                        that.getholedatabyXY(entity.option.X, entity.option.Y);
                        viewer.camera.moveEnd.removeEventListener(ppp);
                      }
                    },
                  });
                }
              });
            }
          } else {
            return;
          }
        },
      });
    }
  };
  //获取地质信息
  dizhimagess = () => {
    var yellowEdge = new Cesium.PostProcessStageLibrary.createEdgeDetectionStage();
    yellowEdge.uniforms.color = Cesium.Color.YELLOW;
    yellowEdge.uniforms.length = 0.01;
    yellowEdge.selected = [];
    this.handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    this.selectColor = Cesium.Color.CHARTREUSE.withAlpha(0.7); //选中的颜色
    this.handler.setInputAction(event => {
      //判断
      const { isexcavation } = this.props.Map;
      if (isexcavation) {
        var tempposition = event.position;
        var pickedObject = viewer.scene.pick(tempposition);
        if (!(pickedObject instanceof Cesium.Cesium3DTileFeature) || !pickedObject) {
          this.props.dispatch({
            type: 'Home/setBuildingInfo',
            payload: null,
          });
          return;
        }
        if (!pickedObject.primitive.asset) {
          this.props.dispatch({
            type: 'Home/setBuildingInfo',
            payload: null,
          });
          return;
        }
        if (!pickedObject.primitive.asset.dataType) {
          this.props.dispatch({
            type: 'Home/setBuildingInfo',
            payload: null,
          });
          return;
        } else {
          // if (this.selectTile) {
          //   this.selectTile.color = this.originColor;
          //   this.selectTile = pickedObject.content.tile;
          //   this.originColor = this.selectTile.color;
          //   this.selectTile.color = this.selectColor;
          //   // console.log(pickedObject)
          //   // yellowEdge.selected = [pickedObject];
          // } else {
          //   this.selectTile = pickedObject.content.tile;
          //   this.originColor = this.selectTile.color;
          //   this.selectTile.color = this.selectColor;
          // }
        }
        if (pickedObject.primitive.asset.dataType.includes('dizhi')) {
          // var propertyNames = pickedObject.getPropertyNames();
          // var length = propertyNames.length;
          // for (var i = 0; i < length; ++i) {
          //     var propertyName = propertyNames[i];
          //     console.log(propertyName + ': ' + pickedObject.getProperty(propertyName));
          // }
          if (pickedObject.primitive.asset.dataType == 'dizhi-zk') {
            //console.log("钻孔");
            //this.geologyType="钻孔模型";
            this.collections.removeAll();
            var name = pickedObject.getProperty('name');
            var id = strsplit(name);
            this.getholedatabyid(id);
          } else if (pickedObject.primitive.asset.dataType == 'dizhi-dz') {
            //console.log("地质");
            //this.geologyType="地质模型";

            var name = pickedObject.getProperty('name');
            var id = strsplit(name);
            this.getgeoatabyid(id);
          } else if (pickedObject.primitive.asset.dataType == 'dizhi-pm') {
            //console.log("剖面");
            if (pickedObject instanceof Cesium.Cesium3DTileFeature) {
              var propertyNames = pickedObject.getPropertyNames();
              var length = propertyNames.length;
              for (var i = 0; i < length; ++i) {
                var propertyName = propertyNames[i];
                // console.log(propertyName + ': ' + pickedObject.getProperty(propertyName));
              }
            }
            var name = pickedObject.getProperty('name');
            var objectid = strsplit(name);
            this.props.dispatch({
              type: 'Home/setPMindex',
              payload: objectid,
            });
            var contenturl = pickedObject.content.url;
            var list = contenturl.split('/');
            var id = list[list.length - 2];
            this.getgeoatabylayerid(id);
          } else if (pickedObject.primitive.asset.dataType == 'dizhi-jk') {
            //console.log("基坑");
            var name = pickedObject.getProperty('name');
            var id = strsplit(name.toString());
            this.getgeoatabyid(id);
          }
        }
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
    function strsplit(name) {
      var nameList = name.split('_');
      var id = Number(nameList[nameList.length - 1].replace(/[^0-9]/gi, ''));
      return id;
    }
    //换行
    function wrap(name) {
      var onename = name.substring(0, 25) + '\n';
      var twoname = name.substring(25, name.length - 1);
      return onename + twoname;
    }
  };

  //钻孔 icon 请求
  getholedatabyXY = async (X, Y) => {
    let holedata = await request(`/vb/hole/model/prop/coordinate?x=${X}&y=${Y}`);
    if (holedata.success) {
      var obj = new Object();
      obj.type = 'zkholedata';
      obj.holename = '钻孔地层信息';
      obj.holedataList = holedata.data;
      this.props.dispatch({
        type: 'Home/setBuildingInfo',
        payload: obj,
      });
    }
  };

  getExtent = currentlevel => {
    var extent = {};

    // �õ���ǰ��ά����
    var scene = viewer.scene;

    // �õ���ǰ��ά������������
    var ellipsoid = scene.globe.ellipsoid;
    var canvas = scene.canvas;

    // canvas���Ͻ�
    var car3_lt = viewer.camera.pickEllipsoid(new Cesium.Cartesian2(0, 0), ellipsoid);

    // canvas���½�
    var car3_rb = viewer.camera.pickEllipsoid(
      new Cesium.Cartesian2(canvas.width, canvas.height),
      ellipsoid,
    );

    // ��canvas���ϽǺ����½�ȫ������������
    if (car3_lt && car3_rb) {
      var carto_lt = ellipsoid.cartesianToCartographic(car3_lt);
      var carto_rb = ellipsoid.cartesianToCartographic(car3_rb);
      extent.xmin = Cesium.Math.toDegrees(carto_lt.longitude);
      extent.ymax = Cesium.Math.toDegrees(carto_lt.latitude);
      extent.xmax = Cesium.Math.toDegrees(carto_rb.longitude);
      extent.ymin = Cesium.Math.toDegrees(carto_rb.latitude);
    }

    var xmin = extent.xmin;
    var ymin = extent.ymin;
    var xmax = extent.xmax;
    var ymax = extent.ymax;

    //把地图边界加入进来就不会有超出索引的问题了 这也是需要从wmts服务文件中解析的内容
    //<ows:LowerCorner>113.804104620288 22.4137778632674</ows:LowerCorner>
    //<ows:UpperCorner>114.549161099753 22.7104495184821</ows:UpperCorner>

    xmin = Math.max(xmin, 113.804104620288);
    ymin = Math.max(ymin, 22.4137778632674);
    xmax = Math.min(xmax, 114.549161099753);
    ymax = Math.min(ymax, 22.7104495184821);

    var coordSize = 180.0 / Math.pow(2.0, currentlevel);

    var x_lt = -180; //Ӧ�ý�������ֱ��д��
    var y_lt = 90; //Ӧ�ý�������ֱ��д��

    var nColFrom = Math.floor((Math.min(xmax, xmin) - x_lt) / coordSize);
    var nColTo = Math.floor((Math.max(xmax, xmin) - x_lt) / coordSize) + 1;
    var nRowFrom = Math.floor((y_lt - Math.max(ymax, ymin)) / coordSize);
    var nRowTo = Math.floor((y_lt - Math.min(ymax, ymin)) / coordSize) + 1;

    return { nColFrom, nColTo, nRowFrom, nRowTo };
  };

  fetchPOIJson = (level, i, j, sz_poi, dlp_poi) => {
    // 判断是否是室内状态，停止更新
    if (!sz_poi) {
      const {
        reality: { sz_poi: szPOIObj },
      } = motherBoard;
      sz_poi = szPOIObj;
    }
    var request = new Cesium.Request({
      priority: i - j,
      throttleByServer: true,
      throttle: true,
    });
    // console.log(level,i,j);
    var resource = new Cesium.Resource({
      url: `${
        sz_poi.url
      }?REQUEST=GetTile&SERVICE=WMTS&VERSION=1.0.0&LAYER=DBLEVEL:L${level}&STYLE=&TILEMATRIX=EPSG:4490:${level -
        9}&TILEMATRIXSET=EPSG:4490&TILECOL=${i}&TILEROW=${j}`,
      queryParameters: {
        FORMAT: 'application/json;type=geojson',
      },
      // headers: {
      //   'szvsud-license-key' : window.localStorage.getItem('baseMapLicenseKey'),
      // },
      request: request,
    });
    this.startRequest(resource, dlp_poi, level, i, j);
  };

  startRequest = (resource, dlp_poi, level, i, j) => {
    const { IndoorKey } = this.props.Map;
    //记录网格的状态，遍历所有的请求
    let promise = resource.fetchJson();
    // console.log("POIOK0000",resource.request.state);
    if (promise) {
      promise
        .then(jsonData => {
          // Do something with the text
          // console.log("POIOK1111",resource.request.state);
          let flagIndex = `${level}_${i}_${j}`;
          this.POICache[level][flagIndex] = true;
          this.createPOI(jsonData, dlp_poi, level, i, j);
        })
        .otherwise(error => {
          // an error occurred

          if (resource.request.state === Cesium.RequestState.CANCELLED) {
            // console.log("POIcancel",resource.request.state);
            setTimeout(() => {
              IndoorKey !== 'indoorroam' && this.startRequest(resource, dlp_poi, level, i, j);
            }, 1000);
          }
          // else if(resource.request.state ===Cesium.RequestState.FAILED){
          //   console.log("POIfailed",resource.request.state);
          //   //失败的直接标记为true,不在请求
          //   // let flagIndex=`${level}_${i}_${j}`
          //   // this.POICache[level][flagIndex]=true;
          // }else{
          //   console.log("POIotherwise",resource.request.state);
          // }
        });
    } else {
      // console.log("POIundefined",resource.request.state);
      setTimeout(() => {
        IndoorKey !== 'indoorroam' && this.startRequest(resource, dlp_poi, level, i, j);
      }, 1500);
    }
  };

  createPOI = (featureCollection, dlp_poi, level, i, j) => {
    // let dlp_poi = new Cesium.CustomDataSource("poi");
    if (!dlp_poi) {
      dlp_poi = viewer.dataSources.getByName('poi')[0];
      if (!dlp_poi) return;
    }
    let entities = featureCollection.features;
    if (entities.length > 0) {
      entities.map(item => {
        var iconame;
        switch (item.properties.ysdl) {
          case '宾馆酒楼':
            iconame = 180100;
            break;
          case '购物中心':
            iconame = 200100;
            break;
          case '基础地名':
            iconame = 110301;
            break;
          case '交通设施':
            iconame = 160500;
            break;
          case '金融机构':
            iconame = 210104;
            break;
          case '科技教育':
            iconame = 130101;
            break;
          case '餐饮连锁':
            iconame = 190300;
            break;
          case '旅游观光':
            iconame = 170100;
            break;
          case '日常服务':
            iconame = 231200;
            break;
          case '市政网点':
            iconame = 240100;
            break;
          case '文化体育':
            iconame = 150800;
            break;
          case '医疗卫生':
            iconame = 140100;
            break;
          case '邮政通信':
            iconame = 220100;
            break;
          case '政府机关':
            iconame = 120100;
            break;
          case '知名企事业':
            iconame = 250200;
            break;
          default:
            iconame = 231200;
            break;
        }
        var iconameurl = `${PUBLIC_PATH}config/images/mark/` + iconame + '.png';
        if (dlp_poi.entities.getById(item.id)) return;
        dlp_poi.entities.add({
          id: item.id, //level——行
          name: item.properties.bzmc,
          position: Cesium.Cartesian3.fromDegrees(
            item.geometry.coordinates[0],
            item.geometry.coordinates[1],
            item.properties.maxhei,
          ),
          billboard: {
            image: iconameurl,
            scale: 0.7, //原始大小的缩放比例
            horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
            verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
            // heightReference: Cesium.HeightReference.CLAMP_TO_GROUND, //贴地
            scaleByDistance: new Cesium.NearFarScalar(1.5e2, 1.0, 8.0e6, 0.2),
            // disableDepthTestDistance: Number.POSITIVE_INFINITY, //一直显示，不被地形等遮挡
          },
          label: {
            text: item.properties.bzmc,
            font: 'normal small-caps normal ' + (level < 13 ? 14 : 12) + 'px  微软雅黑',
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            fillColor: Cesium.Color.AZURE,
            outlineColor: Cesium.Color.BLACK,
            outlineWidth: 2,
            horizontalOrigin: Cesium.HorizontalOrigin.LEFT,
            verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
            pixelOffset: new Cesium.Cartesian2(10, -4), //偏移量
            // heightReference: Cesium.HeightReference.CLAMP_TO_GROUND, //贴地
            distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0.0, 100000),
          },
          data: item,
          flagIndex: `${level}_${i}_${j}`,
          click: function(entity) {
            //单击
            if (viewer.camera.positionCartographic.height > 10000) {
              viewer.mars.popup.close(); //关闭popup

              var position = entity.position._value;
              viewer.mars.centerPoint(position, {
                radius: 5000, //距离目标点的距离
                pitch: -50, //相机方向
                duration: 4,
                complete: function(e) {
                  //飞行完成回调方法
                  viewer.mars.popup.show(entity); //显示popup
                },
              });
            }
          },
        });
      });
    }
  };

  //
  POIFunc = () => {
    let level = 10;
    if (viewer.scene.globe._surface._tilesToRender.length) {
      level =
        viewer.scene.globe._surface._tilesToRender[0].level < 10
          ? 10
          : viewer.scene.globe._surface._tilesToRender[0].level;
    }
    if (this.POICache.hasOwnProperty(level)) {
      for (const key in this.POICache[level]) {
        if (this.POICache[level].hasOwnProperty(key)) {
          if (!this.POICache[level][key]) {
            // 重新发起请求
            const flagIndex = key.split('_');
            // this.fetchPOIJson(flagIndex[0],flagIndex[1],flagIndex[2]);
          }
        }
      }
    }
  };

  removePOI = (dlp_poi, level) => {
    // 如果层级变化了则，清空缓存，如果缓存的属性超过50条，则清空
    if (this.POICache.hasOwnProperty(level)) {
      if (Object.keys(this.POICache[level]).length > 50) {
        this.POICache = {};
        dlp_poi.entities.removeAll();
      }
    } else {
      // 全部清空
      this.POICache = {};
      dlp_poi.entities.removeAll();
    }
    let entities = dlp_poi.entities.values; //forEach
    entities.forEach(item => {
      if (!this.POICache.hasOwnProperty(level)) {
        dlp_poi.entities.remove(item);
      } else {
        if (!this.POICache[level].hasOwnProperty(item.flagIndex)) {
          dlp_poi.entities.remove(item);
        }
      }
    });
    // dlp_poi.entities.removeAll();
  };

  //添加POI信息
  addPOI = (level, sz_poi, dlp_poi) => {
    let res = this.getExtent(level);
    let { nColFrom, nColTo, nRowFrom, nRowTo } = res;

    let tileXY = this.getCenterXY(level);
    if (!tileXY) return;
    nColFrom = Math.max(tileXY.x - 3, nColFrom);
    nColTo = Math.min(tileXY.x + 3, nColTo);
    nRowFrom = Math.max(tileXY.y - 1, nRowFrom);
    nRowTo = Math.min(tileXY.y + 1, nRowTo);

    // console.log("POIRequest Count",(nColTo-nColFrom+1)*(nRowTo-nRowFrom+1));

    for (let i = nColFrom; i <= nColTo; i++) {
      for (let j = nRowFrom; j <= nRowTo; j++) {
        let flagIndex = `${level}_${i}_${j}`;
        if (!this.POICache.hasOwnProperty(level)) {
          this.POICache[level] = {};
          this.POICache[level][flagIndex] = false;
          this.fetchPOIJson(level, i, j, sz_poi, dlp_poi);
        } else {
          if (!this.POICache[level].hasOwnProperty(flagIndex)) {
            this.POICache[level][flagIndex] = false;
            this.fetchPOIJson(level, i, j, sz_poi, dlp_poi);
          }
        }
      }
    }
  };

  getCenterXY = currentlevel => {
    var point = mars3d.point.getCenter(viewer);
    var position = Cesium.Cartographic.fromDegrees(point.x, point.y);
    var geotilingScheme = new Cesium.GeographicTilingScheme();
    var tileXY = geotilingScheme.positionToTileXY(position, currentlevel);
    // console.log("center",tileXY);
    return tileXY;
  };

  removeDistrictZhuji = () => {
    const { storedData } = this.state;
    return new Promise((resolve, reject) => {
      storedData['sz_district_zhuji'] &&
        viewer.dataSources.remove(storedData['sz_district_zhuji'], true);
      resolve();
    });
  };
  changeDistrictZhuji = isTrue => {
    const { storedData } = this.state;
    return new Promise((resolve, reject) => {
      if (storedData['sz_district_zhuji']) {
        storedData['sz_district_zhuji'].show = isTrue;
      }
      resolve();
    });
  };

  //加载深圳三维电子底图数据
  loadSzData = item => {
    // 首先判断是否poi 如果没有

    let hasPOI = viewer.dataSources.getByName('poi')[0];
    if (hasPOI) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      //let dly_1000 = new Cesium.CustomDataSource("dly_1000")
      //let dlx_1000 = new Cesium.CustomDataSource("dlx_1000")
      let dlx_500000 = new Cesium.CustomDataSource('dlx_500000');
      let dlx_50000 = new Cesium.CustomDataSource('dlx_50000');
      let dlx_250000 = new Cesium.CustomDataSource('dlx_250000');
      let dlp_poi = new Cesium.CustomDataSource('poi');
      let dl_label = new Cesium.CustomDataSource('dl_label');
      let labelCollection = new Cesium.LabelCollection({ scene: viewer.scene, name: '道路注记' }); //道路注记

      //viewer.dataSources.add(dly_1000);
      //viewer.dataSources.add(dlx_1000);
      viewer.dataSources.add(dlx_500000);
      viewer.dataSources.add(dlx_50000);
      viewer.dataSources.add(dlx_250000);
      viewer.dataSources.add(dlp_poi);
      viewer.dataSources.add(dl_label);

      function addlx(url, dataSource, extentParam) {
        $.ajax({
          url: `${url}&bbox=${extentParam.xmin}%2C${extentParam.ymin}%2C${extentParam.xmax}%2C${extentParam.ymax}`,
          type: 'get',
          beforeSend: function(request) {
            const key = window.localStorage.getItem('baseMapLicenseKey');
            key && request.setRequestHeader('szvsud-license-key', key);
          },
          dataType: 'json',
          contentType: 'application/json;charset=UTF-8',
          success: function(data) {
            if (data && data.features && data.features.length) {
              dataSource.entities.removeAll();
              let promise_line = Cesium.GeoJsonDataSource.load(data, {
                clampToGround: true,
              });
              promise_line.then(data => {
                let entities = data.entities.values;
                entities.map(entity => {
                  //entity.polyline.width = entity.properties.getValue().WIDTH != null ? parseFloat(entity.properties.getValue().WIDTH / 4) : 0;
                  entity.polyline.width = 3;
                  entity.polyline.material = new Cesium.PolylineOutlineMaterialProperty({
                    color: Cesium.Color.fromCssColorString('#E0B24A').withAlpha(0.5),
                    outlineColor: Cesium.Color.fromCssColorString('#DDDDDD').withAlpha(0.5),
                    outlineWidth: 1,
                  });
                  dataSource.entities.add(entity);
                });
              });
            }
          },
          error: function(data) {
            console.log('请求出错(' + data.status + ')：' + data.statusText);
          },
        });
      }
      //1:1000的道路面 加载路面注记
      function adddlmzj(urlPL, dataSourcePL, extentParam) {
        //加载1:1000的道路面
        /*   $.ajax({
            url: `${urlPY}&bbox=${extentParam.xmin}%2C${extentParam.ymin}%2C${extentParam.xmax}%2C${extentParam.ymax}`,
            type: "get",
            dataType: 'json',
            contentType: "application/json;charset=UTF-8",
            success: function (data) {
              if (data && data.features && data.features.length) {
                dataSourcePY.entities.removeAll()
                let promise_poly = Cesium.GeoJsonDataSource.load(data, {
                  clampToGround: true
                });
                promise_poly.then(data => {
                  let entities = data.entities.values;
                  entities.map(entity => {
                    entity.polygon.material = Cesium.Color.fromCssColorString('#FFFF73').withAlpha(.1);
                    entity.polygon.outline = true;
                    entity.polygon.outlineColor = Cesium.Color.fromCssColorString('#fecd6e').withAlpha(.1);
                    dataSourcePY.entities.add(entity)
                  })
                })
              }
            },
            error: function (data) {
              console.log("请求出错(" + data.status + ")：" + data.statusText);
            }
          }); */

        //根据道路线动态加载注记
        $.ajax({
          url: `${urlPL}&bbox=${extentParam.xmin}%2C${extentParam.ymin}%2C${extentParam.xmax}%2C${extentParam.ymax}`,
          type: 'get',
          beforeSend: function(request) {
            const key = window.localStorage.getItem('baseMapLicenseKey');
            key && request.setRequestHeader('szvsud-license-key', key);
          },
          dataType: 'json',
          contentType: 'application/json;charset=UTF-8',
          success: function(data) {
            if (data && data.features && data.features.length) {
              dataSourcePL.entities.removeAll();
              let promise_line = Cesium.GeoJsonDataSource.load(data, {
                clampToGround: true,
              });
              promise_line.then(data => {
                let entities = data.entities.values;
                //文字
                // viewer.scene.primitives.remove()
                //删除上一个道路注记集合
                // labelCollection.removeAll()
                // viewer.scene.primitives.add(labelCollection);
                // entities.map((entity) => {
                //   var num = Math.floor(entity.polyline.positions._value.length / 2);
                //   var midpoint = mars3d.pointconvert.cartesian2lonlat(entity.polyline.positions._value[num]);
                //   var primitive = labelCollection.add({
                //     position: Cesium.Cartesian3.fromDegrees(midpoint[0], midpoint[1], 60),
                //     text: entity._properties.NAME._value,
                //     font: 'normal small-caps normal 12px 黑体',
                //     scale: 1,
                //     style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                //     fillColor: new Cesium.Color.fromCssColorString("#ffc881"),
                //     outlineColor: Cesium.Color.BLACK,
                //     outlineWidth: 3,
                //     showBackground: false,
                //     horizontalOrigin: Cesium.HorizontalOrigin.LEFT,
                //     verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                //     heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
                //     //disableDepthTestDistance: Number.POSITIVE_INFINITY,
                //     distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0.0, 8000)
                //   });
                // })
                entities.map(item => {
                  var num = Math.floor(item.polyline.positions._value.length / 2);
                  var midpoint = mars3d.pointconvert.cartesian2lonlat(
                    item.polyline.positions._value[num],
                  );
                  if (dl_label.entities.getById(item.id)) return;
                  dl_label.entities.add({
                    id: item.id,
                    name: item._properties.NAME._value,
                    position: Cesium.Cartesian3.fromDegrees(midpoint[0], midpoint[1], 60),
                    label: {
                      text: item._properties.NAME._value,
                      font: 'normal small-caps normal 12px 黑体',
                      scale: 1,
                      style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                      fillColor: new Cesium.Color.fromCssColorString('#ffc881'),
                      outlineColor: Cesium.Color.BLACK,
                      outlineWidth: 3,
                      showBackground: false,
                      horizontalOrigin: Cesium.HorizontalOrigin.LEFT,
                      verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                      distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0.0, 10000),
                    },
                  });
                });
              });
            }
          },
          error: function(data) {
            console.log('请求出错(' + data.status + ')：' + data.statusText);
          },
        });
        /*  //根据道路线动态加载注记，精细化备选方案
         $.ajax({
           url: `${urlPL}&bbox=${extentParam.xmin}%2C${extentParam.ymin}%2C${extentParam.xmax}%2C${extentParam.ymax}`,
           type: "get",
           dataType: 'json',
           contentType: "application/json;charset=UTF-8",
           success: function (data) {
             if (data && data.features && data.features.length) {
               dataSourcePL.entities.removeAll()
               let promise_line = Cesium.GeoJsonDataSource.load(data, {
                 clampToGround: true
               });
               promise_line.then(data => {
                 let entities = data.entities.values;
                 entities.map(entity => {
                 var num = Math.floor(entity.polyline.positions._value.length/2);

                 var firstpoint = mars3d.pointconvert.cartesian2lonlat(entity.polyline.positions._value[num]);


                   //3dtiles路面文字,默认矩形取道路中心线的中心点的20米乘以20米的大小
                   viewer.entities.add({
                     rectangle: {
                       coordinates: Cesium.Rectangle.fromDegrees(firstpoint[0]-0.000225,firstpoint[1]-0.00001,firstpoint[0]+0.000225,firstpoint[1]+0.00001),
                       classificationType: Cesium.ClassificationType.BOTH,
                       material: new mars3d.TextMaterial({
                         text:entity._properties.NAME._value,
                         textStyles: {
                           font: '20px 楷体',
                           fill: true,
                           fillColor: new Cesium.Color(1.0,1.0,1.0,1.0),
                           stroke: true,
                           strokeWidth: 2,
                           strokeColor: new Cesium.Color(1.0,1.0,1.0,0.8),
                           backgroundColor: new Cesium.Color(0.0, 0.0, 0.0, 0),
                         },
                       }),
                       rotation: Cesium.Math.toRadians(163),
                       stRotation: Cesium.Math.toRadians(163),
                     }
                   });

                 })
               })
             }
           },
           error: function (data) {
             console.log("请求出错(" + data.status + ")：" + data.statusText);
           }
         }); */
      }
      // 处理函数
      const that = this;

      function handle() {
        const {
          reality: {
            sz_osgb,
            sz_poi,
            sz_yx: { url },
          },
        } = motherBoard;
        const { isUnderground } = that.props.BaseMap;
        const { IndoorKey, toolsActiveKey } = that.props.Map;
        const { storedData } = that.state;
        var level = 10;
        if (viewer.scene.globe._surface._tilesToRender.length) {
          // level = viewer.scene.globe._surface._tilesToRender[0].level < 10 ? 10 : viewer.scene.globe._surface._tilesToRender[0].level
          if (viewer.scene.globe._surface._tilesToRender[0].level < 10) {
            level = 10;
            that.POICache = {};
            dlp_poi.entities.removeAll();
            // 清空poi缓存
          } else {
            level = viewer.scene.globe._surface._tilesToRender[0].level;
          }
        }

        const { leftActiveKey, rightActiveKey } = that.props.Home;
        const { scence } = that.props.RightFloatMenu;
        const { baseMapKey, isOpen3D } = that.state;
        const { houseHoldModel, rightActiveKey: activeKey } = that.props.House; //分层分户模式下，隐藏倾斜或单体

        //当出现串场时立即移除资源
        // if(baseMapKey === 'DIGITAL'){
        //   that.bindRemoveReality()
        // }else if(baseMapKey === 'REALITY'){
        //   that.bindRemoveDigital()
        // }

        if (!storedData['sz_yx']) {
          var layers = viewer.imageryLayers._layers;
          for (let i = 0; i < layers.length; i++) {
            let imgurl = layers[i].imageryProvider.url;
            if (url == imgurl) {
              that.setState({
                storedData: {
                  ...storedData,
                  sz_yx: layers[i],
                },
              });
              break;
            }
          }
        }

        //分级处理道路加载
        // let extentParam = that.getViewExtend(); //获取当前视域范围
        let extentParam = viewer.mars.getExtent();
        // console.log(extentParam)
        if (isUnderground) return;
        if (level > 14 && level <= 19) {
          //dly_1000.show = true;
          //dlx_1000.show = false;
          dlx_500000.show = false;
          dlx_50000.show = true;
          dlx_250000.show = false;
          //addlx(item.urls['10000pl'], dlx_10000, extentParam)
          adddlmzj(item.urls['50000pl'], dlx_50000, extentParam);
        } else if (level >= 12 && level <= 13) {
          //dly_1000.show = false;
          /*  dlx_500000.show = false;  */
          dlx_500000.show = false;
          dlx_50000.show = false;
          dlx_250000.show = true;
          addlx(item.urls['250000pl'], dlx_250000, extentParam);
        } else if (level > 9 && level < 12) {
          //dly_1000.show = false;
          //dlx_1000.show = false;
          dlx_500000.show = true;
          dlx_50000.show = false;
          dlx_250000.show = false;
          addlx(item.urls['500000pl'], dlx_500000, extentParam);
        } else {
          //dly_1000.show = false;
          //dlx_1000.show = false;
          dlx_500000.show = false;
          dlx_50000.show = false;
          dlx_250000.show = false;
        }
        // dlp_poi.entities.removeAll();
        that.removePOI(dlp_poi, level);
        if (level >= 10 && IndoorKey !== 'indoorroam') {
          //分类加载POI信息
          that.addPOI(level, sz_poi, dlp_poi);
        }

        // 剖切模式下不执行
        if (toolsActiveKey === 'landCutting') {
          return;
        }

        //分级处理倾斜摄影
        const flystart = window.localStorage.getItem('flystart'); //判断飞行漫游是否开启
        if (level >= 13) {
          // if (rightActiveKey !== "land") {
          // storedData["osgb"].show = true //显示倾斜摄影
          baseMapKey == 'REALITY' &&
            isOpen3D &&
            storedData['osgb_all'].forEach(item => {
              if (houseHoldModel) {
                item.show = false;
              } else {
                item.show = true;
              }
            });
          if (isOpen3D && scence != 'dantihua') {
            if (houseHoldModel) {
              storedData['sz_yx'] && (storedData['sz_yx'].show = true);
            } else {
              storedData['sz_yx'] && (storedData['sz_yx'].show = false);
            }
          } else {
            storedData['sz_yx'] && (storedData['sz_yx'].show = true);
          }
          // }
        } else if (level < 13 && (flystart == 'false' || !flystart)) {
          // storedData["osgb"].show = false //隐藏倾斜摄影  执行飞行漫游时 偶然隐藏倾斜摄影
          storedData['osgb_all'].forEach(item => {
            item.show = false;
          });
          if (isOpen3D && storedData['sz_yx']) {
            storedData['sz_yx'].show = true;
          }
          // isOpen3D && (storedData['sz_yx'].show = true);
        }
        // if(level < 14){
        //   this.globalMap && (!this.globalMapVisible) && this.globalMap.setVisible(true);
        //   this.globalMapVisible =true;
        //   this.szqingxie && (this.szqingxie.maximumScreenSpaceError = 12);

        // } else {
        //   if(!this.globalMap){
        //     this.globalMap =  viewer.mars.getBasemap();
        //   }
        //   this.globalMap && this.globalMap.setVisible(false);
        //   this.globalMap && this.globalMap.setZIndex(99999);
        //   this.globalMapVisible = false;
        //   this.szqingxie && (this.szqingxie.maximumScreenSpaceError = 16);
        // }
        if (baseMapKey === 'DIGITAL') {
          if (storedData['whiteModel']) {
            storedData['whiteModel'].show = true; //显示白模
          }
        }

        /*
             //加载道路注记
               if (level >= 14 && level < 19) {
                 that.addRoadZhuji();
               } else if (level <= 13) {
                 that.removeRoadZhuji();
               } */
        //加载行政区划及注记
        if (level >= 13) {
          // that.changeDistrict(false)
          that.changeDistrictZhuji(false);
        } else if (level < 13) {
          if (activeKey !== 'mainStat' && scence != 'commute') {
            //地楼房专题下，不显示区块名称注记和边界线（与地楼房专题的重复）
            that.changeDistrict(true);
            that.changeDistrictZhuji(true);
          }
        }
      }

      // 防抖
      function debounce(fn, wait) {
        return function() {
          that.sanweiTimer && clearTimeout(that.sanweiTimer);
          that.sanweiTimer = setTimeout(fn, wait);
        };
      }

      var fun = debounce(handle, 500);
      setTimeout(handle, 1200);
      // 滚动事件
      viewer.camera.moveEnd.addEventListener(fun, this);
      // window.addEventListener('mousemove', fun);
      const { storedData } = this.state;
      this.setState(
        {
          storedData: {
            ...storedData,
            [item.key]: [dlx_500000, dlx_50000, dlx_250000, dlp_poi],
            // "dlmzj": labelCollection
            dlmzj: dl_label,
          },
          szdlx_handler: fun,
        },
        () => {
          resolve();
        },
      );
    });
  };

  findDataSource = () => {
    viewer.dataSource.getByName();
  };

  addSzRoad2 = item => {
    const { storedData } = this.state;
    return new Promise((resolve, reject) => {
      //当前页面业务相关
      function initWork() {
        gridWidget.viewer = viewer;
        gridWidget.isActivate = true;
        gridWidget.create();
        gridWidget.activate();
      }

      var gridWidget = {
        //初始化[仅执行1次]
        create: function() {
          var that = this;
          this.layer = new mars3d.layer.CustomFeatureGridLayer(
            {
              minimumLevel: 11, //限定层级，只加载该层级下的数据。[与效率相关的重要参数]
              debuggerTileInfo: false,
              IdName: 'id',
              getDataForGrid: function(opts, calback) {
                //获取网格内的数据，calback为回调方法，参数传数据数组
                that.getDataForGrid(opts, calback);
              },
              createEntity: function(opts, attributes) {
                //根据数据创造entity
                return that.createEntity(opts, attributes);
              },
              removeEntity: function(enetity) {
                that.layer.dataSource.entities.remove(enetity);
              },
            },
            this.viewer,
          );
        },
        //打开激活
        activate: function() {
          this.layer.setVisible(true);
        },
        //关闭释放
        disable: function() {
          this.layer.setVisible(false);
        },
        getDataForGrid: function(opts, calback) {
          var url = '/portal/manager/poiNs/range';
          var that = this;
          $.ajax({
            url: url,
            data: {
              minX: opts.rectangle.xmin,
              minY: opts.rectangle.ymin,
              maxX: opts.rectangle.xmax,
              maxY: opts.rectangle.ymax,
              pageSize: 1,
            },
            type: 'get',
            dataType: 'json',
            success: function(data) {
              // console.log(data)
              if (!that.isActivate) return;
              calback(data);
            },
            error: function(data) {
              console.log('请求出错(' + data.status + ')：' + data.statusText);
            },
          });
        },
        createEntity: function(opts, attributes) {
          var that = this;
          //添加实体
          var entity = this.layer.dataSource.entities.add({
            name: attributes.key,
            position: Cesium.Cartesian3.fromDegrees(attributes.x, attributes.y, 0),
            point: {
              color: new Cesium.Color.fromCssColorString('#3388ff'),
              pixelSize: 10,
              outlineColor: new Cesium.Color.fromCssColorString('#ffffff'),
              outlineWidth: 2,
              heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
              scaleByDistance: new Cesium.NearFarScalar(1.5e2, 1.0, 8.0e6, 0.2),
            },
            label: {
              text: attributes.key,
              font: 'normal small-caps normal 12px 宋体',
              style: Cesium.LabelStyle.FILL_AND_OUTLINE,
              fillColor: Cesium.Color.AZURE,
              outlineColor: Cesium.Color.BLACK,
              outlineWidth: 2,
              horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
              verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
              pixelOffset: new Cesium.Cartesian2(0, -20), //偏移量
              heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
              distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0.0, 2000000),
            },
            data: attributes,
            click: function(entity) {
              //单击回调
              that.showXQ(entity.data);
            },
          });

          return entity;

          return entity;
        },
        //打开详情
        showXQ: function(item) {
          // console.log('单击了' + item.name);
        },
      };

      initWork();

      resolve();
    });
  };

  removeSzData = item => {
    const { storedData, szdlx_handler } = this.state;
    return new Promise((resolve, reject) => {
      // window.removeEventListener('mousemove', szdlx_handler); //先移除事件监听
      viewer.camera.moveEnd.removeEventListener(szdlx_handler, this);
      storedData[item.key] &&
        storedData[item.key].forEach(v => {
          viewer.dataSources.remove(v, true);
        });
      // storedData['dlmzj'] && viewer.scene.primitives.remove(storedData['dlmzj']);
      storedData['dlmzj'] && viewer.dataSources.remove(storedData['dlmzj']);
      resolve();
    });
  };

  addSzYX = item => {
    const { storedData } = this.state;

    return new Promise((resolve, reject) => {
      const { storedData } = this.state;
      if (storedData['sz_yx']) {
        storedData['sz_yx'].show = true;
        resolve();
      } else {
        var layer = viewer.imageryLayers.addImageryProvider(
          new Cesium.UrlTemplateImageryProvider({
            url: getCesiumUrl(item.url, true),
            // url: item.url
          }),
        );
        // layer.show = false
        window.szlayer = layer;
        this.setState(
          {
            storedData: {
              ...storedData,
              sz_yx: layer,
            },
          },
          () => {
            this.showOrHideSzYX(true);
            resolve();
          },
        );
      }
    });
  };

  removeSzYX = () => {
    const { storedData } = this.state;
    return new Promise((resolve, reject) => {
      storedData['sz_yx'] && viewer.imageryLayers.remove(storedData['sz_yx']);
      if (!storedData['sz_yx']) {
        this.removeSzYXByUrl();
        // 从imagerys中找到对应图层移除
      }
      this.setState(
        {
          storedData: {
            ...storedData,
            sz_yx: null,
          },
        },
        () => {
          resolve();
        },
      );
    });
  };

  removeSzYXByUrl = () => {
    const {
      reality: {
        sz_yx: { url },
      },
    } = motherBoard;
    return new Promise((resolve, reject) => {
      var layers = viewer.imageryLayers._layers;
      for (let i = 0; i < layers.length; i++) {
        let imgurl = layers[i].imageryProvider.url;
        if (url == imgurl) {
          viewer.imageryLayers.remove(layers[i]);
          break;
        }
      }
      resolve();
    });
  };

  showOrHideSzYX = flag => {
    const { storedData } = this.state;
    return new Promise((resolve, reject) => {
      if (storedData['sz_yx']) {
        storedData['sz_yx'].show = flag;
      }
      resolve();
    });
  };

  addOSGB_all = item => {
    const { storedData } = this.state;
    var that = this;
    let sourceUrl = item.url;
    return new Promise((resolve, reject) => {
      let cesium3DTilesets = [];
      var children = item.children;
      Object.keys(children).forEach((key, index) => {
        let resource = getCesiumUrl(children[key], false); //new Cesium.Resource({ url: children[key], headers: { 'authorization': item.authorization, 'szvsud-license-key': window.localStorage.getItem('userLicenseKey') } })
        let cesium3DTileset = new Cesium.Cesium3DTileset({
          url: resource, //children[key],
          show: true,
          key: 'osgb',
          maximumScreenSpaceError: item.maximumScreenSpaceError,
          preferLeaves: item.preferLeaves,
          skipLevelOfDetail: true,
          skipLevels: 1,
          skipScreenSpaceErrorFactor: 16,
          immediatelyLoadDesiredLevelOfDetail: false,
          loadSiblings: true,
          cullWithChildrenBounds: false,
          cullRequestsWhileMoving: false,
          cullRequestsWhileMovingMultiplier: 0.01,
          preloadWhenHidden: true,
          progressiveResolutionHeightFraction: 0.1,
          dynamicScreenSpaceErrorDensity: 500,
          dynamicScreenSpaceErrorFactor: 1,
          dynamicScreenSpaceError: true,
        });
        cesium3DTilesets.push(cesium3DTileset);
        // console.log(index);
        viewer.scene.primitives.add(cesium3DTileset);
        cesium3DTileset.readyPromise
          .then(function(tileset) {
            tileset.asset.nametype = 'obliquephotography';
            if (item.offsetHeight) {
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
                item.offsetHeight,
              );
              let translation = Cesium.Cartesian3.subtract(
                offset,
                surface,
                new Cesium.Cartesian3(),
              );
              tileset.modelMatrix = Cesium.Matrix4.fromTranslation(translation);
            }
            if (index === Object.keys(children).length - 1) {
              that.setState(
                {
                  storedData: {
                    ...storedData,
                    osgb_all: cesium3DTilesets,
                  },
                },
                () => {
                  resolve();
                },
              );
            }
          })
          // Cesium 1.95 Unhandled Rejection (TypeError): cesium3DTileset.readyPromise.then(...).otherwise is not a function
          .then(function() {
            resolve();
          });
      });
      // const timeDelay = this.hasLoad3DTiles ? 0 : 6000;
      // setTimeout(() => {
      //   cesium3DTilesets && cesium3DTilesets.forEach((item) => {
      //     viewer.scene.primitives.add(item);
      //   });
      //   // viewer.camera.moveStart.addEventListener(this.moveStart);
      //   // viewer.camera.moveEnd.addEventListener(this.moveEnd);
      //   //卷帘Y
      //   // const { startroller } = this.props.Map
      //   // const { reality: { sz_osgb } } = motherBoard;
      //   // var List = ["dapeng", "baoan", "futian", "guangming", "lingdingdao", "longgang", "longhua", "luohu", "nanshan", "pingshan", "yantian"];
      //   // List.forEach((element) => {
      //   //   let url = sz_osgb.children[element];
      //   //   let primitives = this.getModelbyurl(url);
      //   //   if (primitives.show) {
      //   //     primitives.enableSceneSplit = startroller;
      //   //   }
      //   // });
      //   this.hasLoad3DTiles = true;
      //   // let Tiles = this.getModelbyurl(sz_osgb.url);
      //   // if(Tiles){
      //   //   Tiles.enableSceneSplit=startroller;
      //   // }
      // }, timeDelay);

      // this.setState({
      //   storedData: {
      //     ...storedData,
      //     'osgb_all': cesium3DTilesets
      //   }
      // }, () => {
      //   resolve()
      // })
    });
  };

  removeOSGB_all = item => {
    const { storedData } = this.state;
    return new Promise((resolve, rejeect) => {
      storedData['osgb_all'] &&
        storedData['osgb_all'].forEach(item => {
          viewer.scene.primitives.remove(item);
        });

      let primitives = viewer.scene.primitives;
      for (let i = 0; i < primitives.length; i++) {
        if (primitives.get(i).key === 'osgb') {
          viewer.scene.primitives.remove(primitives.get(i));
        }
      }

      this.setState(
        {
          storedData: {
            ...storedData,
            osgb_all: [],
          },
        },
        () => {
          resolve();
        },
      );
    });
  };

  //加载倾斜摄影
  addOSGB = item => {
    const { storedData } = this.state;

    return new Promise((resolve, reject) => {
      let resource = getCesiumUrl(item.url, true); //new Cesium.Resource({ url: item.url, headers: { 'authorization': item.authorization, 'szvsud-license-key': window.localStorage.getItem('userLicenseKey')} })
      let cesium3DTileset = new Cesium.Cesium3DTileset({
        url: resource,
        show: false,
        maximumScreenSpaceError: item.maximumScreenSpaceError,
        maximumMemoryUsage: item.maximumMemoryUsage,
        preferLeaves: item.preferLeaves,
        skipLevelOfDetail: true,
        skipLevels: 1,
        skipScreenSpaceErrorFactor: 16,
        immediatelyLoadDesiredLevelOfDetail: false,
        loadSiblings: true,
        cullWithChildrenBounds: true,
        cullRequestsWhileMoving: true,
        cullRequestsWhileMovingMultiplier: 0.01,
        preloadWhenHidden: true,
        progressiveResolutionHeightFraction: 0.1,
        dynamicScreenSpaceErrorDensity: 10000,
        dynamicScreenSpaceErrorFactor: 1,
        dynamicScreenSpaceError: true,
      });
      this.szqingxie = cesium3DTileset;
      setTimeout(() => {
        viewer.scene.primitives.add(cesium3DTileset);
        //卷帘Y
        const { startroller } = this.props.Map;
        const {
          reality: { sz_osgb },
        } = motherBoard;
        var List = [
          'dapeng',
          'baoan',
          'futian',
          'guangming',
          'lingdingdao',
          'longgang',
          'longhua',
          'luohu',
          'nanshan',
          'pingshan',
          'yantian',
        ];
        List.forEach(element => {
          let url = sz_osgb.children[element];
          let primitives = this.getModelbyurl(url);
          if (primitives.show) {
            primitives.enableSceneSplit = startroller;
          }
        });
        // let Tiles = this.getModelbyurl(sz_osgb.url);
        // if(Tiles){
        //   Tiles.enableSceneSplit=startroller;
        // }
      }, 6000);
      cesium3DTileset.readyPromise.then(function(tileset) {
        viewer.camera.moveStart.addEventListener(this.moveStart);
        viewer.camera.moveEnd.addEventListener(this.moveEnd);
        if (item.offsetHeight) {
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
            item.offsetHeight,
          );
          let translation = Cesium.Cartesian3.subtract(offset, surface, new Cesium.Cartesian3());
          tileset.modelMatrix = Cesium.Matrix4.fromTranslation(translation);
        }
      });

      this.setState(
        {
          storedData: {
            ...storedData,
            osgb: cesium3DTileset,
          },
        },
        () => {
          resolve();
        },
      );
    });
  };

  removeOSGB = () => {
    const { storedData } = this.state;
    return new Promise((resolve, rejeect) => {
      storedData['osgb'] && viewer.scene.primitives.remove(storedData['osgb']);
      resolve();
    });
  };

  handleTimer = null;
  moveStart = () => {
    const { storedData } = this.state;
    storedData['osgb_all'] &&
      storedData['osgb_all'].forEach(item => {
        item.maximumScreenSpaceError = 24;
      });
  };

  moveEnd = () => {
    const _this = this;
    const { storedData } = this.state;
    this.handleTimer && clearTimeout(this.handleTimer);
    this.handleTimer = setTimeout(() => {
      _this.handleTimer = null;
      storedData['osgb_all'] &&
        storedData['osgb_all'].forEach(item => {
          item.maximumScreenSpaceError = 16;
        });
    }, 800);
  };

  addBuildingZhuji = () => {
    const { storedData } = this.state;
    return new Promise((resolve, reject) => {
      var prefixUrl = `/vb/poi/range`;
      let zhuji_dataSource18 = new Cesium.CustomDataSource('zhuji18');
      let zhuji_dataSource19 = new Cesium.CustomDataSource('zhuji19');
      let zhuji_dataSource20 = new Cesium.CustomDataSource('zhuji20');
      zhuji_dataSource18.show = false;
      zhuji_dataSource19.show = false;
      zhuji_dataSource20.show = false;
      viewer.dataSources.add(zhuji_dataSource18, {
        clampToGround: true,
      });
      viewer.dataSources.add(zhuji_dataSource19, {
        clampToGround: true,
      });
      viewer.dataSources.add(zhuji_dataSource20, {
        clampToGround: true,
      });

      function addFeature(url, dataSource) {
        $.ajax({
          url: url,
          type: 'get',
          dataType: 'json',
          contentType: 'application/json;charset=UTF-8',
          success: function(data) {
            if (data.code == 200) {
              data.data &&
                data.data.forEach((item, index) => {
                  //添加实体
                  var entitie = dataSource.entities.add({
                    name: item.textString,
                    position: Cesium.Cartesian3.fromDegrees(item.x, item.y),
                    // billboard: {
                    //   image: './config/images/mark1.png',
                    //   scale: 0.8,  //原始大小的缩放比例
                    //   horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
                    //   verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                    //   heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
                    //   scaleByDistance: new Cesium.NearFarScalar(1.5e2, 1.0, 8.0e6, 0.2),
                    //   disableDepthTestDistance:Number.POSITIVE_INFINITY
                    // },
                    label: {
                      text: item.textString,
                      font: 'normal small-caps normal 12px 黑体',
                      style: Cesium.LabelStyle.FILL,
                      fillColor: Cesium.Color.WHITE,
                      outlineColor: Cesium.Color.BLACK,
                      outlineWidth: 2,
                      showBackground: true,
                      backgroundColor: Cesium.Color.fromAlpha(
                        Cesium.Color.fromCssColorString('#000000'),
                        0.9,
                      ),
                      backgroundPadding: new Cesium.Cartesian2(8, 3),
                      horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
                      verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                      pixelOffset: new Cesium.Cartesian2(0, -24), //偏移量
                      heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
                      distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0.0, 5000),
                      // disableDepthTestDistance: Number.POSITIVE_INFINITY
                    },
                    data: item,
                  });
                });
            }
          },
          error: function(data) {
            console.log('请求出错(' + data.status + ')：' + data.statusText);
          },
        });
      }

      addFeature(prefixUrl + `/${18}`, zhuji_dataSource18);
      addFeature(prefixUrl + `/${19}`, zhuji_dataSource19);
      addFeature(prefixUrl + `/${20}`, zhuji_dataSource20);
      //监听鼠标滚动事件
      var buildingZhuji_handler = new Cesium.ScreenSpaceEventHandler(viewer.canvas);
      buildingZhuji_handler.setInputAction(event => {
        var level = 0;
        if (viewer.scene.globe._surface._tilesToRender.length) {
          level = viewer.scene.globe._surface._tilesToRender[0].level;
        }
        if (level > 15 && level < 17) {
          zhuji_dataSource18.show = true;
          zhuji_dataSource19.show = false;
          zhuji_dataSource20.show = false;
        } else if (level >= 17 && level < 19) {
          zhuji_dataSource18.show = false;
          zhuji_dataSource19.show = true;
          zhuji_dataSource20.show = false;
        } else if (level >= 19 && level < 21) {
          zhuji_dataSource18.show = false;
          zhuji_dataSource19.show = false;
          zhuji_dataSource20.show = true;
        } else {
          zhuji_dataSource18.show = false;
          zhuji_dataSource19.show = false;
          zhuji_dataSource20.show = false;
        }
      }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

      this.setState(
        {
          storedData: {
            ...storedData,
            buildingZhuji: [zhuji_dataSource20, zhuji_dataSource19, zhuji_dataSource20],
          },
          buildingZhuji_handler,
        },
        () => {
          resolve();
        },
      );
    });
  };
  removeBuildingZhuji = () => {
    const { storedData, buildingZhuji_handler } = this.state;
    return new Promise((resolve, reject) => {
      storedData['buildingZhuji'].forEach(item => {
        viewer.dataSources.remove(item, true);
      });
      buildingZhuji_handler && buildingZhuji_handler.destroy();
      this.setState(
        {
          buildingZhuji_handler: null,
        },
        () => {
          resolve();
        },
      );
    });
  };
  //加载道路注记
  addRoadZhuji = () => {
    const { storedData, roadZhuji_handler } = this.state;
    if (isloadzj) {
      return;
    }
    return new Promise((resolve, reject) => {
      let promise_roadZhuji = Cesium.GeoJsonDataSource.load(
        `${PUBLIC_PATH}data/json/shekou_road.geojson`,
        {
          clampToGround: false,
        },
      );
      let temp_datasource = null;
      promise_roadZhuji.then(data => {
        temp_datasource = data;
        temp_datasource.show = false;
        let entities = temp_datasource.entities.values;
        // data.name = "roadZhuji"
        viewer.dataSources.add(temp_datasource);
        entities.map(entity => {
          var cartographic = viewer.scene.globe.ellipsoid.cartesianToCartographic(
            entity.position.getValue(),
          );
          var lat = Cesium.Math.toDegrees(cartographic.latitude);
          var lng = Cesium.Math.toDegrees(cartographic.longitude);

          entity.name = entity.properties.TextString._value;
          var carto = new Cesium.Cartographic.fromDegrees(lng, lat);
          //cartoArr.push(carto);
          var hei = viewer.scene.sampleHeight(carto);
          // console.log(hei);
          entity.position = Cesium.Cartesian3.fromDegrees(lng, lat, hei);
          entity.billboard = new Cesium.BillboardGraphics({
            image: './config/images/mark_road.png',
            scale: 1, //原始大小的缩放比例
            horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
            verticalOrigin: Cesium.VerticalOrigin.CENTER,
            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
            scaleByDistance: new Cesium.NearFarScalar(1.5e2, 1.0, 8.0e6, 0.2),
            pixelOffset: new Cesium.Cartesian2(-2, 2),
          });
          entity.label = new Cesium.LabelGraphics({
            text: entity.properties.TextString._value,
            font: 'normal small-caps normal 14px 黑体',
            style: Cesium.LabelStyle.FILL,
            fillColor: Cesium.Color.WHITE,
            outlineColor: Cesium.Color.BLACK,
            outlineWidth: 2,
            showBackground: true,
            backgroundColor: Cesium.Color.fromAlpha(
              Cesium.Color.fromCssColorString('#4a4738'),
              0.9,
            ), //。272412
            backgroundPadding: new Cesium.Cartesian2(8, 3),
            horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
            verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
            pixelOffset: new Cesium.Cartesian2(0, 0), //偏移量
            // heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
            distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0.0, 2000000),
          });

          //添加竖线
          temp_datasource.entities.add({
            name: 'Red line on the surface',
            polyline: {
              positions: Cesium.Cartesian3.fromDegreesArrayHeights([lng, lat, 0, lng, lat, 70]),
              width: 1,
              followSurface: false,
              material: Cesium.Color.fromAlpha(Cesium.Color.fromCssColorString('#fff'), 0.7),
            },
          });

          var roadZhuji_handler = new Cesium.ScreenSpaceEventHandler(viewer.canvas);
          roadZhuji_handler.setInputAction(event => {
            var level = 0;
            if (viewer.scene.globe._surface._tilesToRender.length) {
              level = viewer.scene.globe._surface._tilesToRender[0].level;
            }
            if (level >= 14) {
              temp_datasource.show = true;
            } else {
              temp_datasource.show = false;
            }
          }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
        });
        isloadzj = true;
        this.setState(
          {
            storedData: {
              ...storedData,
              road_zhuji: temp_datasource,
              roadZhuji_handler,
            },
          },
          () => {
            resolve();
          },
        );
      });
    });
  };
  removeRoadZhuji = () => {
    const { storedData, roadZhuji_handler } = this.state;
    if (isloadzj && storedData['road_zhuji']) {
      return new Promise((resolve, reject) => {
        storedData['road_zhuji'] && viewer.dataSources.remove(storedData['road_zhuji'], true);
        isloadzj = false;
        roadZhuji_handler && roadZhuji_handler.destroy();
        this.setState(
          {
            roadZhuji_handler: null,
          },
          () => {
            resolve();
          },
        );
      });
    } else {
      return;
    }
  };

  addRoadZhuji2 = item => {
    const { storedData, roadZhuji_handler } = this.state;
    return new Promise((resolve, reject) => {
      Ajax('./data/visiual/roadName.geojson').then(res => {
        // console.log(res)
        const { data } = res;
        data.features.forEach(item => {
          const { properties, geometry } = item;

          //取minx miny maxx maxy
          let minx = 0,
            miny = 0,
            maxx = 0,
            maxy = 0;
          geometry.coordinates[0][0].forEach((i, index) => {
            if (index == 0) {
              minx = maxx = i[0];
              miny = maxy = i[1];
            } else {
              if (i[0] < minx) minx = i[0];
              if (i[0] > maxx) maxx = i[0];
              if (i[1] < miny) miny = i[1];
              if (i[1] > maxy) maxy = i[1];
            }
          });

          // console.log(minx, maxx, miny, maxy)
          //3dtiles路面文字
          viewer.entities.add({
            name: '路面文字',
            rectangle: {
              coordinates: Cesium.Rectangle.fromDegrees(minx, miny, maxx, maxy),
              classificationType: Cesium.ClassificationType.BOTH,
              material: new mars3d.TextMaterial({
                text: '火星路',
                textStyles: {
                  font: '50px 楷体',
                  fill: true,
                  fillColor: Cesium.Color.DARKGREEN,
                  stroke: true,
                  strokeWidth: 3,
                  strokeColor: Cesium.Color.WHITE,
                  backgroundColor: new Cesium.Color(0.0, 0.0, 0.0, 0),
                },
              }),
              rotation: Cesium.Math.toRadians(163),
              stRotation: Cesium.Math.toRadians(163),
            },
          });
        });
        resolve();
      });
    });
  };

  removeRoadZhuji2 = () => {
    const { storedData, roadZhuji_handler } = this.state;
    return new Promise((resolve, reject) => {});
  };

  click_ = item => {
    this.setState({
      baseMapKey: item.key,
    });
    this.changeImageLayer(item.imageryLayer);
  };
  openPannel = () => {
    const { isOpen } = this.state;
    this.setState({
      isOpen: !isOpen,
    });
  };
  changeImageLayer = imageryLayer => {
    let imageryLayers = window.viewer.imageryLayers;
    imageryLayers.addImageryProvider(imageryLayer);
    // 移除其他图层
    for (let i = 1; i < imageryLayers.length - 1; i++) {
      const layer = imageryLayers.get(i);
      imageryLayers.remove(layer);
      // console.log(layer);
    }
  };

  getViewExtend = () => {
    let params = {};
    let extend = viewer.camera.computeViewRectangle();
    if (typeof extend === 'undefined') {
      //2D下会可能拾取不到坐标，extend返回undefined,所以做以下转换
      let canvas = viewer.scene.canvas;
      let upperLeft = new Cesium.Cartesian2(0, 0); //canvas左上角坐标转2d坐标
      let lowerRight = new Cesium.Cartesian2(canvas.clientWidth, canvas.clientHeight); //canvas右下角坐标转2d坐标

      let ellipsoid = viewer.scene.globe.ellipsoid;
      let upperLeft3 = viewer.camera.pickEllipsoid(upperLeft, ellipsoid); //2D转3D世界坐标
      if (!upperLeft3) {
        return false;
      }
      let lowerRight3 = viewer.camera.pickEllipsoid(lowerRight, ellipsoid); //2D转3D世界坐标

      let upperLeftCartographic = viewer.scene.globe.ellipsoid.cartesianToCartographic(upperLeft3); //3D世界坐标转弧度
      let lowerRightCartographic = viewer.scene.globe.ellipsoid.cartesianToCartographic(
        lowerRight3,
      ); //3D世界坐标转弧度

      let xmin = Cesium.Math.toDegrees(upperLeftCartographic.longitude); //弧度转经纬度
      let xmax = Cesium.Math.toDegrees(lowerRightCartographic.longitude); //弧度转经纬度

      let ymin = Cesium.Math.toDegrees(lowerRightCartographic.latitude); //弧度转经纬度
      let ymax = Cesium.Math.toDegrees(upperLeftCartographic.latitude); //弧度转经纬度

      params.xmin = xmin;
      params.xmax = xmax;
      params.ymin = ymin;
      params.ymax = ymax;
    } else {
      //3D获取方式
      params.xmax = Cesium.Math.toDegrees(extend.east);
      params.ymax = Cesium.Math.toDegrees(extend.north);

      params.xmin = Cesium.Math.toDegrees(extend.west);
      params.ymin = Cesium.Math.toDegrees(extend.south);
    }
    return params; //返回屏幕所在经纬度范围
  };

  GetrecExtent = () => {
    let params = {};
    let extend = viewer.camera.computeViewRectangle();
    // 兼容获取不到报extend错的情况
    if (typeof extend === 'undefined') {
      //2D下会可能拾取不到坐标，extend返回undefined,所以做以下转换
      let canvas = viewer.scene.canvas;
      let upperLeft = new Cesium.Cartesian2(0, 0); //canvas左上角坐标转2d坐标
      let lowerRight = new Cesium.Cartesian2(canvas.clientWidth, canvas.clientHeight); //canvas右下角坐标转2d坐标

      let ellipsoid = viewer.scene.globe.ellipsoid;
      let upperLeft3 = viewer.camera.pickEllipsoid(upperLeft, ellipsoid); //2D转3D世界坐标
      if (!upperLeft3) {
        return false;
      }
      let lowerRight3 = viewer.camera.pickEllipsoid(lowerRight, ellipsoid); //2D转3D世界坐标

      let upperLeftCartographic = viewer.scene.globe.ellipsoid.cartesianToCartographic(upperLeft3); //3D世界坐标转弧度
      let lowerRightCartographic = viewer.scene.globe.ellipsoid.cartesianToCartographic(
        lowerRight3,
      ); //3D世界坐标转弧度

      let xmin = Cesium.Math.toDegrees(upperLeftCartographic.longitude); //弧度转经纬度
      let xmax = Cesium.Math.toDegrees(lowerRightCartographic.longitude); //弧度转经纬度

      let ymin = Cesium.Math.toDegrees(lowerRightCartographic.latitude); //弧度转经纬度
      let ymax = Cesium.Math.toDegrees(upperLeftCartographic.latitude); //弧度转经纬度

      params.xmin = xmin;
      params.xmax = xmax;
      params.ymin = ymin;
      params.ymax = ymax;
    } else {
      params.xmax = Cesium.Math.toDegrees(extend.east);
      params.ymax = Cesium.Math.toDegrees(extend.north);

      params.xmin = Cesium.Math.toDegrees(extend.west);
      params.ymin = Cesium.Math.toDegrees(extend.south);
    }
    var childRec = turf.polygon([
      [
        [params.xmin, params.ymin],
        [params.xmin, params.ymax],
        [params.xmax, params.ymax],
        [params.xmax, params.ymin],
        [params.xmin, params.ymin],
      ],
    ]);
    return childRec;
  };
  getAuths() {
    let obj = {
      CityMap: true,
    };
    try {
      const {
        pageAuths: {
          CityDisplay: { CityMap },
        },
      } = this.props.Global;
      return { ...obj, CityMap };
    } catch (err) {
      return obj;
    }
  }
  render() {
    let { baseMapKey, isOpen, isForbid, isOpen3D } = this.state;
    let { leftActiveKey } = this.props.Home;
    let auths = this.getAuths();
    // const {isOpen } = this.props.BaseMap
    return (
      <Fragment>
        {// leftActiveKey == "floor" && auths.CityMap && (
        auths.CityMap && (
          <div className={`${styles.box} ${isOpen ? styles.select : ''}`}>
            <div className={styles.btn} onClick={() => this.openPannel()}>
              <BorderPoint />
              <span className={`iconfont icon_map ${styles.icon}`} />
              <span>底图</span>
              <span className="icon iconfont icon_unfold1"></span>
            </div>
            <div className={styles.pannel}>
              <List
                grid={{ gutter: 24, column: 3 }}
                dataSource={mapItems}
                renderItem={item => (
                  <List.Item>
                    <div
                      className={`${styles.item} ${item.key === baseMapKey ? styles.active : ''}`}
                    >
                      <img
                        className={styles.img}
                        src={item.img}
                        onClick={() => this.click(item)}
                        alt=""
                      ></img>
                      <div className={styles.itemText}>{item.name}</div>
                    </div>
                  </List.Item>
                )}
              ></List>
              {/* <Underground /> */}
              <Row>
                <Col span={5}>3D模式</Col>
                <Col span={4}>
                  <Switch
                    checkedChildren="开"
                    unCheckedChildren="关"
                    checked={isOpen3D}
                    defaultChecked
                    onClick={this.onMapChange}
                  />
                </Col>
              </Row>
            </div>
          </div>
        )}
        {this.state.project_detail_layer_toggle_visible && (
          <ProjectDetailLayerToggle parentThis={this}></ProjectDetailLayerToggle>
        )}
        {this.state.project_detail_visible && (
          <ProjectDetail parentThis={this} viewer={viewer}></ProjectDetail>
        )}
        {this.state.project_compare_visible && <ProjectCompare parentThis={this}></ProjectCompare>}
        {this.state.project_map_fly_visible && <ProjectMapFly parentThis={this}></ProjectMapFly>}
      </Fragment>
    );
  }
}

export default BaseMap;
