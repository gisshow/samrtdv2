/* global Cesium */
/* global viewer */
/* global mars3d */
/* global $ */
/* global turf */
/* global Popup */

import React, { Component } from 'react';
import style from './index.less';
import { connect } from 'dva';
import { PUBLIC_PATH } from '@/utils/config';
import BorderPoint from '../border-point';
import { Icon, Tree, Tooltip } from 'antd';
import VideoInfo from '../video-info';
import PipePanel from '../cesiumMap/components/pipeline/index';
import FishingPort from '../cesiumMap/components/fishing/index';
import OceanPanel from '../cesiumMap/components/ocean/index';
import FrameQuery from './components/frameSelectQuery';
import SearchSider from './components/searchSider';
import LayersManage from '@/pages/components/leftSider/components/layersManage';
import { coordinatesArrayToCartesianArray, getCesiumUrl } from '@/utils/index';
import IndoorRoam from './components/indoorroam';
import IndoorEvacuation from './components/indoorEvacuation';
import EvacuationImg from './components/evacuationImg';

var datacutover;
let motherBoard;
const Ajax = require('axios');
@connect(({ Map, RightFloatMenu, Global, House }) => ({
  Map,
  RightFloatMenu,
  Global,
  House,
}))
class RightFloatMenu extends Component {
  constructor(props) {
    super(props);
    this.state = {
      displayType: 0,
      startIndoor: false,
      videoScale: 0,
      undergroundOn: false, //开关 0，关闭，1开启,
      selectOn: false, //点选开关
      showLayer: false,
    };
  }

  // popHandler = null
  entityModel = null;
  selectObj = {
    type: '',
    name: '',
    address: '',
  };
  async componentWillMount() {
    let data2 = await Ajax.get(`${PUBLIC_PATH}config/datacutover.json`);
    datacutover = data2.data;
    let data1 = await Ajax.get(`${PUBLIC_PATH}config/motherBoard.json`);
    motherBoard = data1.data;
  }

  componentWillUnmount() {
    this.removeSelectLayer();
  }

  HandleMenu = () => {
    let displayType = this.state.displayType;

    if (displayType === 0) {
      this.setState({ ...this.state, displayType: 1 });
    } else {
      this.setState({ ...this.state, displayType: 0 });
    }
  };
  toggleMenuActive(name) {
    this.props.dispatch({
      type: 'RightFloatMenu/toggleMenu',
      payload: name,
    });
  }
  //所有场景关闭事件
  removeOtherscenes = type => {
    var $this = this;
    if (type == 'isIndoorActive') {
      //关闭除室内外的所有
      closeDantihuaActive();
      closeundergroundOn();
      closeVideoActive();
    } else if (type == 'isUndergroundActive') {
      //关闭除地下外的所有
      closeIndoormodel();
      closeVideoActive();
      closeDantihuaActive();
    } else if (type == 'isVideoActive') {
      //关闭除视频外的所有
      closeIndoormodel();
      closeundergroundOn();
      closeDantihuaActive();
    } else if (type == 'isDantihuaActive') {
      //关闭除单体化外的所有
      closeIndoormodel();
      closeundergroundOn();
      closeVideoActive();
    }
    function closeIndoormodel() {
      const { startIndoor } = $this.state;
      if (startIndoor) {
        var FParentpolygon = viewer.entities.getById('FParentpolygon');
        FParentpolygon.show = false;
        for (var i = 0; i < window.T3DTilesetList.length; i++) {
          window.T3DTilesetList[i].divpoint.visible = false;
        }
        $this.setState({ startIndoor: false });
      }
    }
    function closeundergroundOn() {
      const { undergroundOn } = $this.state;
      if (undergroundOn) {
        $this.setState({
          undergroundOn: false,
        });
      }
    }
    function closeVideoActive() {
      let videoScale = $this.state.videoScale;
      if (videoScale == 1) {
        $this.setState({
          videoScale: 0,
        });
      }
    }
    function closeDantihuaActive() {
      const { scence } = $this.props.RightFloatMenu;
      // if ($this.Ccesium3DTile) {
      //   $this.Ccesium3DTile.show = false;
      // }
      $this.cleardantihua();
      if (scence == 'dantihua') {
        $this.props.dispatch({
          type: 'RightFloatMenu/setLayer',
          payload: {
            key: 'scence',
            value: 'all',
          },
        });
      }
      viewer.camera.moveEnd.removeEventListener($this.isInBoundingBox, 'rightFloatMenu');

      // 移除加载完成监听事件
      if ($this.Ccesium3DTile) {
        $this.Ccesium3DTile.initialTilesLoaded.removeEventListener($this.applyCollision, this);
      }

      // $this.setPanelVisiable(false);

      viewer.mars.keyboardRoam.applyCollision = false;
      viewer.mars.keyboardRoam.applyGravity = false;
      $this.props.dispatch({
        type: 'Map/setIndoorKey',
        payload: '',
      });

      //延迟设置标签的隐藏
      setTimeout(() => {
        //标签隐藏
        for (var i = 0; i < window.T3DTilesetList.length; i++) {
          window.T3DTilesetList[i].divpoint.visible = false;
        }
      }, 1500);
    }
  };
  Indoormodel = isActive => {
    //室内开启
    this.props.dispatch({
      type: 'RightFloatMenu/setLayer',
      payload: {
        key: 'scence',
        value: 'indoor',
      },
    });
    const { startIndoor } = this.state;
    var FParentpolygon = viewer.entities.getById('FParentpolygon');
    if (!startIndoor) {
      //开启
      //跳转到福田莲花
      viewer.mars.centerAt({
        y: 22.54232,
        x: 114.055322,
        z: 3919.72,
        heading: 358,
        pitch: -73,
        roll: 360,
      });
      //获取 压片区域集合
      for (var i = 0; i < window.T3DTilesetList.length; i++) {
        window.T3DTilesetList[i].divpoint.visible = true;
      }
      FParentpolygon.show = true;
      this.removeOtherscenes('isIndoorActive');
    } else {
      //关闭
      FParentpolygon.show = false;
      for (var i = 0; i < window.T3DTilesetList.length; i++) {
        window.T3DTilesetList[i].divpoint.visible = false;
      }
    }

    this.setState({ ...this.state, startIndoor: !startIndoor });
    this.props.dispatch({
      type: 'RightFloatMenu/toggleLayerBtn',
      payload: 'isIndoorActive',
    });

    if (!isActive) {
      this.props.dispatch({
        type: 'RightFloatMenu/toggleMenu',
        payload: 'isLayerActive',
      });
    }
  };

  //地下模块开关
  underground = isActive => {
    const { undergroundOn } = this.state;
    const { scence } = this.props.RightFloatMenu;
    if (!undergroundOn) {
      this.removeOtherscenes('isUndergroundActive');
    }
    this.setState({
      undergroundOn: !undergroundOn,
    });
    const newVal = scence == 'underground' ? 'all' : 'underground';
    this.props.dispatch({
      type: 'RightFloatMenu/setLayer',
      payload: {
        key: 'scence',
        value: newVal,
      },
    });
    this.props.dispatch({
      type: 'RightFloatMenu/toggleLayerBtn',
      payload: 'isUndergroundActive',
    });
    if (!isActive) {
      this.props.dispatch({
        type: 'RightFloatMenu/toggleMenu',
        payload: 'isUndergroundActive',
      });
    }
  };
  //渔港GPS开关
  toggleFishing = isActive => {
    const { scence } = this.props.RightFloatMenu;
    const newVal = scence == 'fishing' ? 'all' : 'fishing';
    this.props.dispatch({
      type: 'RightFloatMenu/setLayer',
      payload: {
        key: 'scence',
        value: newVal,
      },
    });
    if (scence != 'fishing') {
      this.removeOtherscenes('isFishingActive');
    }
    this.props.dispatch({
      type: 'RightFloatMenu/toggleLayerBtn',
      payload: 'isFishingActive',
    });
    if (!isActive) {
      this.props.dispatch({
        type: 'RightFloatMenu/toggleMenu',
        payload: 'isFishingActive',
      });
    }
  };
  //视频场景开关
  toggleVideo = isActive => {
    let videoScale = this.state.videoScale;
    if (videoScale == 0) {
      this.removeOtherscenes('isVideoActive');
    }
    this.setState({
      ...this.state,
      videoScale: videoScale === 1 ? 0 : 1,
    });
    this.props.dispatch({
      type: 'RightFloatMenu/setLayer',
      payload: {
        key: 'scence',
        value: 'video',
      },
    });
    this.props.dispatch({
      type: 'RightFloatMenu/toggleLayerBtn',
      payload: 'isVideoActive',
    });
    if (!isActive) {
      this.props.dispatch({
        type: 'RightFloatMenu/toggleMenu',
        payload: 'isLayerActive',
      });
    } else {
      this.props.dispatch({
        type: 'RightFloatMenu/setLayer',
        payload: {
          key: 'scence',
          value: 'all',
        },
      });
    }
  };

  // 海洋开关
  toggleOcean = isActive => {
    const { scence } = this.props.RightFloatMenu;
    const newVal = scence == 'oceanwater' ? 'all' : 'oceanwater';
    this.props.dispatch({
      type: 'RightFloatMenu/setLayer',
      payload: {
        key: 'scence',
        value: newVal,
      },
    });
    if (scence != 'oceanwater') {
      this.removeOtherscenes('isOceanActive');
    }
    this.props.dispatch({
      type: 'RightFloatMenu/toggleLayerBtn',
      payload: 'isOceanActive',
    });
    if (!isActive) {
      this.props.dispatch({
        type: 'RightFloatMenu/toggleMenu',
        payload: 'isOceanActive',
      });
    }
  };

  //加载 3DTileset 数据 隐藏状态
  add3DTileset = (url, offsetHeight, modelMatrix) => {
    //url不存在 返回undefined
    let cesium3DTileset = undefined;
    if (url != undefined && url != '') {
      cesium3DTileset = new Cesium.Cesium3DTileset({
        url: getCesiumUrl(url, true),
        show: true,
      });
      viewer.scene.primitives.add(cesium3DTileset);
      cesium3DTileset.readyPromise.then(tileset => {
        tileset.show = false;
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
        tileset._root.transform = modelMatrix == undefined ? tileset._root.transform : modelMatrix; //暂时 模型位置正确后 必须删除
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
        //不在显示区域里
        //判断是否在飞行
        if ($this.flyshow) {
          return;
        }
        var height = Math.ceil(viewer.camera.positionCartographic.height);
        if (height < 60) {
          return;
        }
        //取消压平
        // $this.flattenLists.forEach((element, index) => {
        //   element.Foptions.cesium3DTile.show = false;
        //   element.destroy();
        //   $this.flattenLists.splice(index, 1)
        // });
        $this.Ccesium3DTile.show = false;
        newhandler.destroy();
      }
    }
  };
  //单体化使用裁切并加载室内模型 彦
  DanTiHuaTilesClip = () => {
    const {
      dataswicth: { Indoormodel },
    } = datacutover;
    var $this = this;
    this.DthPolygon = [];
    Indoormodel.forEach(data => {
      let { entrance, cutterpolygon } = data; //入口位置和压平区域
      let cesium3DTileset = this.getFtileset(data.url);
      if (cesium3DTileset != undefined) {
        if (cutterpolygon) {
          //标签显示
          for (var i = 0; i < window.T3DTilesetList.length; i++) {
            window.T3DTilesetList[i].divpoint.visible = true;
          }
          var entity = viewer.entities.getById('DTHELEY' + data.id);
          if (entity) {
            if (!entity.show) {
              entity.show = true;
            }
          } else {
            var redPolygon = viewer.entities.add({
              name: 'DTHELEpolygon' + data.name,
              id: 'DTHELEY' + data.id,
              perPositionHeight: false, //贴地参数
              polygon: {
                hierarchy: Cesium.Cartesian3.fromDegreesArray(cutterpolygon),
                material: Cesium.Color.TRANSPARENT, //Cesium.Color.fromRandom()
              },
              option: {
                offsetHeight: data.offsetHeight,
                cutterurl: data.dantihuacutterurl,
                cutterpolygon: data.cutterpolygon,
                indoorheight: data.indoorheight,
                IndoorID: data.id,
                cesium3DTile: cesium3DTileset,
              },
              mouseover: function(entity) {
                //室内漫游传参
                // $this.props.dispatch({
                //   type: 'Map/setIndoorID',
                //   payload: entity.option.IndoorID
                // })
                //室内模型显示
                entity.option.cesium3DTile.show = true;
                if ($this.Ccesium3DTile !== entity.option.cesium3DTile) {
                  if ($this.Ccesium3DTile) {
                    $this.Ccesium3DTile.show = false;
                  }
                  $this.Ccesium3DTile = entity.option.cesium3DTile;
                }

                //始终只显示一个室内
                $this.newindoorheight = entity.option.indoorheight;
                //监听是否已经进入室内 并显示漫游和场景
                // $this.FlyandImportantscene(true);
                // $this.isInPoly(entity)
              },
              mouseout: function(entity) {
                // $this.FlyandImportantscene(false);
                // $this.newindoorheight = 10000000000;
              },
            });
            this.DthPolygon.push(redPolygon);
          }
        }
      }
    });
  };
  //取消单体化中选中室内模型
  cleardantihua = () => {
    this.Ccesium3DTile && (this.Ccesium3DTile.show = false);
    //标签隐藏
    for (var i = 0; i < window.T3DTilesetList.length; i++) {
      window.T3DTilesetList[i].divpoint.visible = false;
    }
    //面隐藏
    if (this.DthPolygon && this.DthPolygon.length !== 0) {
      for (var j = 0; j < this.DthPolygon.length; j++) {
        this.DthPolygon[j].show = false;
      }
    }
  };
  //室内漫游及重要场景
  FlyandImportantscene = isindoor => {
    var $this = this;
    //判断鼠标是否在模型里和视角是否在固定高度内
    if (isindoor) {
      viewer.camera.moveEnd.addEventListener(this.showpanel);
      // viewer.camera.changed.addEventListener(this.showpanel)
    } else {
      viewer.camera.moveEnd.removeEventListener(this.showpanel);
      // viewer.camera.changed.removeEventListener(this.showpanel)
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
  //单体化场景开关
  toggleDanTiHua = isActive => {
    const { scence } = this.props.RightFloatMenu;
    if (scence == 'dantihua') {
      this.cleardantihua();
      this.props.dispatch({
        type: 'RightFloatMenu/setLayer',
        payload: {
          key: 'scence',
          value: 'all',
        },
      });
      viewer.camera.moveEnd.removeEventListener(this.isInBoundingBox, 'rightFloatMenu');
      if (this.Ccesium3DTile) {
        // 移除加载完成监听事件
        this.Ccesium3DTile.initialTilesLoaded.removeEventListener(this.applyCollision, this);
        // this.Ccesium3DTile._initialTilesLoaded=false;
      }
      viewer.mars.keyboardRoam.applyCollision = false;
      viewer.mars.keyboardRoam.applyGravity = false;
      this.props.dispatch({
        type: 'Map/setIndoorKey',
        payload: '',
      });

      //延迟设置标签的隐藏
      setTimeout(() => {
        //标签隐藏
        for (var i = 0; i < window.T3DTilesetList.length; i++) {
          window.T3DTilesetList[i].divpoint.visible = false;
        }
      }, 1500);
    } else {
      this.DanTiHuaTilesClip();
      this.props.dispatch({
        type: 'RightFloatMenu/setLayer',
        payload: {
          key: 'scence',
          value: 'dantihua',
        },
      });
      // 添加移动监听
      viewer.camera.moveEnd.addEventListener(this.isInBoundingBox, 'rightFloatMenu');
    }
    if (scence != 'dantihua') {
      this.removeOtherscenes('isDantihuaActive');
    }
    this.props.dispatch({
      type: 'RightFloatMenu/toggleLayerBtn',
      payload: 'isDantihuaActive',
    });
    if (!isActive) {
      this.props.dispatch({
        type: 'RightFloatMenu/toggleMenu',
        payload: 'isDantihuaActive',
      });
    }
  };

  isInBoundingBox = () => {
    const {
      dataswicth: { Indoormodel },
    } = datacutover;
    let point = viewer.camera.position;
    for (let i = 0; i < Indoormodel.length; i++) {
      const item = Indoormodel[i];
      if (!item.boundBoxPoints) continue;
      let positions = Cesium.Cartesian3.fromDegreesArrayHeights(item.boundBoxPoints); // 计算包围盒
      let bbox = Cesium.AxisAlignedBoundingBox.fromPoints(positions);
      if (this.containsPoint(bbox, point)) {
        // console.log("IN");
        this.isflying();
        this.FlyToIndoor(item);
        this.showCurrentIndoorModel(item);
        // 移除监听
        viewer.camera.moveEnd.removeEventListener(this.isInBoundingBox, 'rightFloatMenu');

        // 隐藏单体化数据--看是否需要移除
        // this.setDanTiHuaVisiable(false);
        // this.removeSzYX(false);
        break;
      }
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

  setRealityVisiable = flag => {
    this.props.dispatch({
      type: 'RightFloatMenu/setLayer',
      payload: {
        key: 'scence',
        value: 'all',
      },
    });
  };

  setSzYXVisiable = flag => {
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
          layers[i].show = flag;
          break;
        }
      }
      resolve();
    });
  };

  addSzYX = () => {
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
          layers[i].show = true;
          resolve();
          return;
        }
      }
      var layer = viewer.imageryLayers.addImageryProvider(
        new Cesium.UrlTemplateImageryProvider({
          url: url,
        }),
      );
      resolve();
    });
  };

  removeSzYX = () => {
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
    var entrance = item.entrance;
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
        this.setDanTiHuaVisiable(false);
        this.removeSzYX(false);
        // 隐藏或删除单体化数据
        // this.cleardantihua();
        if (this.Ccesium3DTile && this.Ccesium3DTile._initialTilesLoaded) {
          setTimeout(() => {
            this.applyCollision();
          });
        }
        // 开启碰撞检测，需要等待加载完成才可以开启检测
        // viewer.mars.keyboardRoam.applyCollision=true;
        // viewer.mars.keyboardRoam.applyGravity=true;
        // 限制鼠标操作
        // 延迟操作，flyTo会将enableInputs更新为true;\
        setTimeout(() => {
          viewer.scene.screenSpaceCameraController.enableInputs = false;
          this.setPanelVisiable(true, item.id);
        });
      },
    });
  };

  closeIndoorPanel = () => {
    // viewer.camera.moveEnd.addEventListener(this.isInBoundingBox, "rightFloatMenu");
    if (this.Ccesium3DTile) {
      // 移除加载完成监听事件
      this.Ccesium3DTile.initialTilesLoaded.removeEventListener(this.applyCollision, this);
      this.Ccesium3DTile.show = false;
      // this.Ccesium3DTile._initialTilesLoaded=false;
    }
    this.setPanelVisiable(false);
    setTimeout(() => {
      this.setDanTiHuaVisiable(true);
      this.addSzYX();
    });
  };

  //点选开关
  selectEvent = () => {
    const { selectOn } = this.state;
    const { selectObj, isPick } = this.props.House;
    if (!selectOn) {
      // this.mapClick();
      // 开启点选
      // this.props.dispatch({
      //   type: 'House/setPickMode',
      //   payload: false,
      // });
      this.props.dispatch({
        type: 'House/setIsPick',
        payload: true,
      });
    } else {
      // this.selectObj.type = "";
      // const handler  = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas); //注册 事件
      // handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK);
      this.props.dispatch({
        type: 'House/setIsPick',
        payload: false,
      });
      this.props.dispatch({
        type: 'House/setSelectObj',
        payload: { show: false },
      });
    }
    //点选的结果弹框关闭
    this.closePanel();
    //清除叠加的矢量效果
    this.removeExtraSource();
    //清空详情信息
    this.clearDetailData();
    this.setState({
      selectOn: !selectOn,
    });
  };

  closePanel = () => {
    const { detailType, statType } = this.props.House;
    if (statType.isRenderSubStat) {
      this.props.dispatch({
        type: 'House/setStatType',
        payload: {
          ...statType,
          isRenderSubStat: false,
        },
      });
    }
    if (detailType.isRenderDetail) {
      this.props.dispatch({
        type: 'House/setDetailType',
        payload: {
          ...detailType,
          isRenderDetail: false,
        },
      });
    }
  };

  clearDetailData = () => {
    this.props.dispatch({
      type: 'House/setParcelCod',
      payload: undefined,
    });
    this.props.dispatch({
      type: 'House/setBldgNo',
      payload: undefined,
    });
  };

  removeExtraSource = () => {
    const { extraSource } = this.props.House;
    if (extraSource && extraSource.length !== 0) {
      extraSource.map(item => {
        viewer.dataSources.remove(item);
      });
    }

    this.props.dispatch({
      type: 'House/setExtraSource',
      payload: undefined,
    });
  };

  getSelectContent = () => {
    const {
      selectObj: { type, name },
    } = this.props.House;
    // if(this.selectObj.type){
    if (type) {
      return (
        <div className={style.selectContent}>
          <BorderPoint />
          <div className={style.selectItem}>
            <div className={style.selectName}>名称：</div>
            <div className={style.selectText}>{name}</div>
          </div>
          <div className={style.selectItem}>
            <div className={style.selectName}>类型：</div>
            <div className={style.selectText}>{type}</div>
          </div>
        </div>
      );
    }
    return null;
  };

  click = item => {
    if (item.type == 'widget') {
      this.activeItem(item);
    } else {
      this.props.dispatch({
        type: 'Map/setToolsActiveKey',
        payload: item.key,
      });
    }
  };

  activeItem = item => {
    const uri = item.uri;
    /*global mars3d*/
    if (mars3d.widget.isActivate(uri)) {
      mars3d.widget.disable(uri);
    } else {
      var opt = {};
      opt.uri = uri;
      opt.name = item.name;
      mars3d.widget.activate(opt);
    }
  };

  toggleMenu = (name, isActive) => {
    // if(name==="isHouseActive"){
    //   this.props.dispatch({
    //     type: 'Home/setTabsActiveKey',
    //     payload: "house"
    //   })
    //   this.props.dispatch({
    //     type:'RightFloatMenu/setLayer',
    //     payload:{
    //       key:'scence',
    //       value:'house',
    //     }
    //   });
    //   return;
    // }
    this.props.dispatch({
      type: 'House/setRightActiveKey',
      payload: '',
    });

    this.toggleMenuActive(name);
    const {
      isClickActive,
      isSearchActive,
      isSpaceActive,
      isFlyActive,
      isCountActive,
      isBookMarkActive,
      isDistrictStatActive,
      isFrameQueryActive,
      isFishingActive,
    } = this.props.RightFloatMenu;
    if (name !== 'isSearchActive' && isSearchActive) {
      this.toggleSearch(); //点击其他菜单时，如果打开了搜索菜单，就关闭搜索
    }
    if (name !== 'isClickActive' && isClickActive) {
      this.selectEvent(); //点击其他菜单时，如果打开了点选菜单，就关闭点选
    }
    if (name !== 'isDistrictStatActive' && isDistrictStatActive) {
      this.toggleDistrictStat(); //点击其他菜单时，如果打开了行政区统计菜单，就关闭点选
    }
    if (name !== 'isFrameQueryActive' && isFrameQueryActive) {
      this.toggleFrameQuery(); //点击其他菜单时，如果打开了框选菜单，就关闭点选
    }

    if (
      (name !== 'isFlyActive' && isFlyActive) ||
      (name !== 'isSpaceActive' && isSpaceActive) ||
      (name !== 'isCountActive' && isCountActive) ||
      (name !== 'isBookMarkActive' && isBookMarkActive)
    ) {
      this.props.dispatch({
        type: 'Map/setToolsActiveKey',
        payload: '',
      });
    }

    this.removeSelectLayer();
    switch (name) {
      case 'isLayerActive': //图层开关
        break;
      case 'isDistrictStatActive': //行政区统计开关
        this.toggleDistrictStat();
        break;
      case 'isSearchActive': //搜索开关
        this.toggleSearch(isActive);
        break;
      case 'isFlyActive': //自动漫游
        this.toggleRoam();
        break;
      case 'isClickActive': //点选开关
        this.selectEvent();
        break;
      case 'isFrameQueryActive': //框选开关
        this.toggleFrameQuery();
        break;
      // case 'isCountActive': //量测开关
      //   this.toggleCount()
      //   break;
      case 'isBookMarkActive': //视角开关
        this.toggleView();
        break;
      // case 'isSpaceActive': //空间标记
      //   this.toggleSpace()
      //   break;
      default:
        break;
    }
  };
  //搜索开关
  toggleSearch = isActive => {
    // return;
    // this.activeItem({
    //   name:'搜索',
    //   uri:`${PUBLIC_PATH}widgets/queryBaiduPOI/widget.js`
    // });
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
  //视角开关
  toggleView = () => {
    this.click({
      name: '视角书签',
      key: 'perBookmark',
      icon: 'icon_visual-angle',
    });
  };
  //飞行漫游
  toggleRoam = () => {
    this.click({
      name: '飞行漫游',
      key: 'automaticroam',
      icon: 'icon_navigation',
    });
  };
  // 量测开关
  toggleCount() {
    this.click({
      name: '测量工具',
      key: 'measure',
      icon: 'icon_measure',
    });
  }

  //框选开关
  toggleFrameQuery = () => {
    const { rightActiveKey: activeKey } = this.props.House;
    if (activeKey !== 'query') {
      this.props.dispatch({
        type: 'House/setRightActiveKey',
        payload: 'query',
      });
    } else {
      this.props.dispatch({
        type: 'House/setRightActiveKey',
        payload: '',
      });
      // return;
    }
  };
  //空间标记开关
  toggleSpace = () => {
    this.click({
      name: '空间标记',
      key: 'spaceMark',
      icon: 'icon_space-mark',
    });
  };

  //行政区统计
  toggleDistrictStat = () => {
    const { jdName, rightActiveKey: activeKey } = this.props.House;
    if (activeKey !== 'mainStat') {
      this.props.dispatch({
        type: 'House/setRightActiveKey',
        payload: 'mainStat',
      });
    } else {
      this.clearDistrictStat();
      return;
    }
    this.props.dispatch({
      type: 'House/setMainStat',
      payload: true,
    });

    this.switchPickMode(false);
    // 如果不是在街道级别则设置为不可点选
    if (jdName == '') {
      this.props.dispatch({
        type: 'House/setIsPick',
        payload: false,
      });
    }
  };

  clearDistrictStat = () => {
    const { isPick } = this.props.House;
    this.props.dispatch({
      type: 'House/setMainStat',
      payload: false,
    });
    // !isPick && this.props.dispatch({
    //   type: 'House/setIsPick',
    //   payload: true,
    // });
    this.props.dispatch({
      type: 'House/setIsPick',
      payload: false,
    });
    this.props.dispatch({
      type: 'House/setRightActiveKey',
      payload: '',
    });

    // 清除面板和地图标记
    this.removeExtraSource();
    this.clearHouseInfo();
  };

  clearHouseInfo = () => {
    const { detailType } = this.props.House;
    this.props.dispatch({
      type: 'House/setHouseId',
      payload: undefined,
    });
    this.props.dispatch({
      type: 'House/setActiveLandListId',
      payload: -1,
    });
    this.props.dispatch({
      type: 'House/setActiveBuildListId',
      payload: [-1],
    });
    this.props.dispatch({
      type: 'House/setActiveRoomListId',
      payload: -1,
    });
    //清空Tree列表高亮
    this.props.dispatch({
      type: 'House/SetTreeSelectedKeys',
      payload: -1,
    });
    //清空点选的geo信息
    this.props.dispatch({
      type: 'House/setSelectObj',
      payload: { show: false },
    });
    // 此时关闭详情弹框
    this.props.dispatch({
      type: 'House/setDetailType',
      payload: {
        ...detailType,
        isRenderDetail: false,
      },
    });
    this.props.dispatch({
      type: 'House/setParcelCod',
      payload: undefined,
    });
    this.props.dispatch({
      type: 'House/setBldgNo',
      payload: undefined,
    });
  };

  removeExtraSource = () => {
    const { extraSource } = this.props.House;
    if (extraSource && extraSource.length !== 0) {
      extraSource.map(item => {
        viewer.dataSources.remove(item);
      });
    }

    this.props.dispatch({
      type: 'House/setExtraSource',
      payload: undefined,
    });
  };

  switchPickMode = flag => {
    // const {pickMode}=this.props.House;
    this.props.dispatch({
      type: 'House/setPickMode',
      payload: flag,
    });
  };

  handler = null;
  removeSelectLayer = () => {
    this.entityModel && viewer.entities.remove(this.entityModel);
    this.selectObj.type = '';
    this.handler && this.handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK);
  };
  mapClick = () => {
    const { isClickActive } = this.props.RightFloatMenu;
    this.handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas); //注册 事件
    this.handler.setInputAction(movement => {
      const cartesian = mars3d.point.getCurrentMousePosition(viewer.scene, movement.position);
      const _this = this;
      if (cartesian) {
        const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
        const jd = Number(Cesium.Math.toDegrees(cartographic.longitude).toFixed(6));
        const wd = Number(Cesium.Math.toDegrees(cartographic.latitude).toFixed(6));
        const geo = `point(${jd} ${wd})`;
        $.ajax({
          url: `/vb/city/geo/by-point`,
          type: 'get',
          data: { geo },
          beforeSend: function(request) {
            const token = window.localStorage.getItem('token');
            token && request.setRequestHeader('token', token);
          },
          success: function(res) {
            if (res.data && res.data.length > 0) {
              const data = res.data[0];
              _this.selectObj.type = data.type;
              _this.selectObj.name = data.name;
              _this.selectObj.address = data.address;
              // const geom = JSON.parse(data.geom);
              // var s = geom.coordinates.join().split(",");
              // var positions = Cesium.Cartesian3.fromDegreesArray(s);
              ////////by zwpeng 20201202
              let positions = [];
              let location = {};
              try {
                location = JSON.parse(data.geom);
                // hole=JSON.parse(holeGeometry);
                if (location.type === 'MultiPolygon') {
                  positions = location.coordinates[0][0];
                } else if (location.type === 'Polygon') {
                  positions = location.coordinates[0];
                } else if (location.type === 'LineString') {
                  positions = location.coordinates;
                }
              } catch (error) {
                console.log(data.geom);
              }
              positions = coordinatesArrayToCartesianArray(positions);
              ////////////
              var d = new Date();
              _this.entityModel && viewer.entities.remove(_this.entityModel);
              if (data.type == 'LineString') {
                _this.entityModel = {
                  id: d.getTime(),
                  name: 'Fpolygon' + data.name,
                  perPositionHeight: false, //贴地参数
                  polyline: {
                    positions: positions,
                    hierarchy: {
                      positions: positions,
                    },
                    material: Cesium.Color.fromCssColorString('#FEC205').withAlpha(0.6), //Cesium.Color.DIMGRAY.withAlpha(0.8),//Cesium.Color.fromRandom({alpha:1.0})Cesium.Color.DARKGRAY.withAlpha(0.0)
                    classificationType: Cesium.ClassificationType.BOTH,
                    clampToGround: true,
                    outline: true,
                    oultlineColor: Cesium.Color.BLACK,
                    width: 5,
                  },
                };
              } else {
                _this.entityModel = {
                  id: d.getTime(),
                  name: 'Fpolygon' + data.name,
                  perPositionHeight: false, //贴地参数
                  polygon: {
                    hierarchy: {
                      positions: positions,
                    },
                    material: Cesium.Color.fromCssColorString('#FEC205').withAlpha(0.6), //Cesium.Color.DIMGRAY.withAlpha(0.8),//Cesium.Color.fromRandom({alpha:1.0})Cesium.Color.DARKGRAY.withAlpha(0.0)
                    classificationType: Cesium.ClassificationType.BOTH,
                    clampToGround: true,
                    outline: true,
                    oultlineColor: Cesium.Color.BLACK,
                  },
                };
              }
              viewer.entities.add(_this.entityModel);
              // viewer.zoomTo(entity);
              _this.forceUpdate();
            }
          },
        });
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
  };

  CloseFrameSelectQuery = () => {
    this.props.dispatch({
      type: 'RightFloatMenu/toggleMenu',
      payload: 'isFrameQueryActive',
    });
    // 同时禁掉点选功能
    this.props.dispatch({
      type: 'House/setIsPick',
      payload: false,
    });
  };
  getAuths() {
    let obj = {
      LayerOperate: {
        LayerManage: false,
        IndoorDisplay: false,
        UnderDisplay: false,
        VideoDisplay: false,
        MonoDisplay: false,
        OceanDisplay: false,
      },
      MapQuery: false,
      MapClick: false,
      MapMeasure: false,
      MapFly: false,
      Fishing: false,
      MapBookmark: false,
      MapMark: false,
      // house:false,  //地楼房专题
      FrameSelectQuery: false, //框选查询
      DistrictStat: false, //行政区统计
    };
    try {
      const {
        pageAuths: {
          CityDisplay: {
            LayerOperate,
            MapQuery,
            MapClick,
            MapMeasure,
            MapFly,
            Fishing,
            MapBookmark,
            MapMark,
            FrameSelectQuery,
            DistrictStat,
          },
          // house
        },
      } = this.props.Global;

      return {
        ...obj,
        ...{ LayerOperate },
        MapQuery,
        MapClick,
        MapMeasure,
        MapFly,
        Fishing,
        MapBookmark,
        MapMark,
        FrameSelectQuery,
        DistrictStat,
      };
    } catch (err) {
      return obj;
    }
  }

  render() {
    const {
      showMenu,
      scence,
      isDantihuaActive,
      isLayerActive,
      isSearchActive,
      isBookMarkActive,
      isCountActive,
      isFishingActive,
      isFlyActive,
      isClickActive,
      isIndoorActive,
      isUndergroundActive,
      isVideoActive,
      isOceanActive,
      isSpaceActive,
      isFrameQueryActive,
      isDistrictStatActive,
    } = this.props.RightFloatMenu;
    const { IndoorKey } = this.props.Map;
    const {
      isPick,
      selectObj: { show: selectOn },
    } = this.props.House;
    const {
      LayerOperate,
      MapQuery,
      MapClick,
      MapMeasure,
      MapFly,
      Fishing,
      MapBookmark,
      MapMark,
      house,
      FrameSelectQuery,
      DistrictStat,
    } = this.getAuths();
    const treeData = [
      {
        title: '基础时空数据',
        key: '0-0',
        children: [
          {
            title: '倾斜摄影模型',
            key: '0-0-0',
          },
          {
            title: '单体化模型',
            key: '0-0-1',
          },
          {
            title: '地楼房权人',
            key: '0-0-2',
          },
          {
            title: '影像',
            key: '0-0-3',
          },
        ],
      },
      {
        title: '城市管理数据',
        key: '1-0',
        children: [],
      },
      {
        title: '城市运行感知',
        key: '2-0',
        children: [],
      },
    ];
    return (
      <>
        <div className={style.rightFloatMenu} style={{ display: showMenu ? 'block' : 'none' }}>
          <div className={style.menus}>
            {LayerOperate.LayerManage ? (
              <Tooltip title="图层" placement="left">
                <div
                  className={[style.item, isLayerActive ? style.active : ''].join(' ')}
                  onClick={() => {
                    this.toggleMenu('isLayerActive');
                  }}
                >
                  <BorderPoint />
                  <span className={'iconfont' + ' ' + style.icon}>&#xe661;</span>
                </div>
              </Tooltip>
            ) : null}
            {MapQuery ? (
              <Tooltip title="搜索" placement="left">
                <div
                  className={[style.item, isSearchActive ? style.active : ''].join(' ')}
                  onClick={() => {
                    this.toggleMenu('isSearchActive', isSearchActive);
                  }}
                >
                  <BorderPoint />
                  <span className={'iconfont' + ' ' + style.icon}>&#xe658;</span>
                </div>
              </Tooltip>
            ) : null}
            {MapClick ? (
              <Tooltip title="点选" placement="left">
                <div
                  className={[style.item, isClickActive ? style.active : ''].join(' ')}
                  onClick={() => {
                    this.toggleMenu('isClickActive');
                  }}
                >
                  <BorderPoint />
                  <span className={'iconfont' + ' ' + style.icon}>&#xe65e;</span>
                </div>
              </Tooltip>
            ) : null}
            {FrameSelectQuery ? (
              <Tooltip title="框选" placement="left">
                <div
                  className={[style.item, isFrameQueryActive ? style.active : ''].join(' ')}
                  onClick={() => {
                    this.toggleMenu('isFrameQueryActive');
                  }}
                >
                  <BorderPoint />
                  <span className={'iconfont icon_multiselect' + ' ' + style.icon}></span>
                </div>
              </Tooltip>
            ) : null}
            {DistrictStat ? (
              <Tooltip title="行政区统计" placement="left">
                <div
                  className={[style.item, isDistrictStatActive ? style.active : ''].join(' ')}
                  onClick={() => {
                    this.toggleMenu('isDistrictStatActive');
                  }}
                >
                  <BorderPoint />
                  <span className={'iconfont icon_directselect' + ' ' + style.icon}></span>
                </div>
              </Tooltip>
            ) : null}

            {/* {
            MapMeasure?(
              <Tooltip title="量测" placement="left">
                <div className={[style.item, isCountActive?style.active:''].join(' ')} onClick={()=>{this.toggleMenu('isCountActive')}} >
                    <BorderPoint />
                    <span className={"iconfont"+' '+style.icon}>&#xe655;</span>
                  </div>
              </Tooltip>
            ) : null
          } */}
            {MapFly ? (
              <Tooltip title="飞行漫游" placement="left">
                <div
                  className={[style.item, isFlyActive ? style.active : ''].join(' ')}
                  onClick={() => {
                    this.toggleMenu('isFlyActive');
                  }}
                >
                  <BorderPoint />
                  <span className={'iconfont' + ' ' + style.icon}>&#xe654;</span>
                </div>
              </Tooltip>
            ) : null}
            {MapBookmark ? (
              <Tooltip title="视角书签" placement="left">
                <div
                  className={[style.item, isBookMarkActive ? style.active : ''].join(' ')}
                  onClick={() => {
                    this.toggleMenu('isBookMarkActive');
                  }}
                >
                  <BorderPoint />
                  <span className={'iconfont' + ' ' + style.icon}>&#xe659;</span>
                </div>
              </Tooltip>
            ) : null}
            {/* {
            MapMark?(
              <Tooltip title="空间标记" placement="left">
                <div className={[style.item, isSpaceActive?style.active:''].join(' ')} onClick={()=>{this.toggleMenu('isSpaceActive')}}>
                  <BorderPoint />
                  <span className={"iconfont"+' '+style.icon}>&#xe656;</span>
                </div>
              </Tooltip>
            ):null
          } */}
            {house ? (
              <Tooltip title="地楼房综合查询" placement="left">
                <div
                  className={[style.item, isSpaceActive ? style.active : ''].join(' ')}
                  onClick={() => {
                    this.toggleMenu('isHouseActive');
                  }}
                >
                  <BorderPoint />
                  <span className={'iconfont' + ' ' + style.icon}>&#xe67a;</span>
                </div>
              </Tooltip>
            ) : null}
          </div>
          <div className={style.menuData} style={{ display: isLayerActive ? 'block' : 'none' }}>
            <BorderPoint />
            <div className={style.subTitle}>图层</div>
            {/*<Tree*/}
            {/*    className='tree'*/}
            {/*    checkable*/}
            {/*    treeData={treeData}*/}
            {/*/>*/}
            <div className={style.contentWrapper}>
              <LayersManage show={true} />
              {LayerOperate.MonoDisplay ||
              LayerOperate.UnderDisplay ||
              LayerOperate.VideoDisplay ||
              LayerOperate.IndoorDisplay ||
              LayerOperate.OceanDisplay ? (
                <>
                  <div className="line-point"></div>
                  <div className={style.subTitle}>专题</div>
                  <div className={style.blocks}>
                    {LayerOperate.MonoDisplay ? (
                      <div
                        className={[style.block, isDantihuaActive ? style.activeBlock : ''].join(
                          ' ',
                        )}
                        onClick={() => this.toggleDanTiHua(isDantihuaActive)}
                      >
                        单体化
                      </div>
                    ) : null}
                    {LayerOperate.UnderDisplay ? (
                      <div
                        className={[style.block, isUndergroundActive ? style.activeBlock : ''].join(
                          ' ',
                        )}
                        onClick={() => this.underground(isUndergroundActive)}
                      >
                        地下场景
                      </div>
                    ) : null}
                    {LayerOperate.Fishing ? (
                      <div
                        className={[style.block, isFishingActive ? style.activeBlock : ''].join(
                          ' ',
                        )}
                        onClick={() => this.toggleFishing(isFishingActive)}
                      >
                        渔港GPS
                      </div>
                    ) : null}
                    {LayerOperate.VideoDisplay ? (
                      <div
                        className={[style.block, isVideoActive ? style.activeBlock : ''].join(' ')}
                        onClick={() => this.toggleVideo(isVideoActive)}
                      >
                        视频场景
                      </div>
                    ) : null}
                    {LayerOperate.IndoorDisplay ? (
                      <div
                        className={[style.block, isIndoorActive ? style.activeBlock : ''].join(' ')}
                        onClick={() => this.Indoormodel(isIndoorActive)}
                      >
                        室内场景
                      </div>
                    ) : null}
                    {LayerOperate.OceanDisplay ? (
                      <div
                        className={[style.block, isOceanActive ? style.activeBlock : ''].join(' ')}
                        onClick={() => this.toggleOcean(isOceanActive)}
                      >
                        海底
                      </div>
                    ) : null}
                  </div>
                </>
              ) : null}
            </div>
          </div>
          {selectOn && this.getSelectContent()}
          {isSearchActive && <SearchSider />}
        </div>
        {scence === 'underground' && <PipePanel />}
        {this.state.videoScale && isVideoActive && (
          <VideoInfo videoScale={this.state.videoScale} toggleVideoPanel={this.toggleVideo} />
        )}
        {scence === 'fishing' && <FishingPort />}
        {scence === 'oceanwater' && <OceanPanel />}
        {/* 将框选组件添加到这里 */}
        {isFrameQueryActive && <FrameQuery onClose={() => this.CloseFrameSelectQuery()} />}
        {//室内漫游面板
        IndoorKey === 'indoorroam' && (
          <IndoorRoam
            close={() => {
              this.closeIndoorPanel();
            }}
          />
        )}
        {//室内疏散满版
        IndoorKey === 'indoorEvacuation' && (
          <IndoorEvacuation
            close={() => {
              this.closeIndoorPanel();
            }}
            tileset={this.Ccesium3DTile}
          />
        )}
        {
          //室内疏散土拍面板
          // IndoorKey === 'indoorEvacuation' && <EvacuationImg/>
        }
      </>
    );
  }
}

export default RightFloatMenu;
