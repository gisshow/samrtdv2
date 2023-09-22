/* global Cesium */
/* global viewer */
/* global mars */
/* global $ */
/* global mars3d */
/* turf */

import React, { Component } from 'react';
import { Slider, Button, InputNumber, Table, Switch, Radio, Checkbox, Row, Col, Tree, Icon,message } from 'antd'
import styles from './style.less'
import { connect, connectAdvanced } from 'dva';
import { PUBLIC_PATH } from '@/utils/config'
import { request } from '@/utils/request';
import imgturang from './img/turangt.png';
import excavate from './img/excavate_bottom_min.jpg';
import imgditu from './img/dizhi.png';
import Sider from 'antd/lib/layout/Sider';
import Item from 'antd/lib/list/Item';
import BorderPoint from '@/pages/components/border-point'
import CheckboxGroup from 'antd/lib/checkbox/Group';
import { GeologyListConfig, PipeLineConfig } from '@/pages/components/leftSider/config';
import { infoMap } from "./info.js";
import { getCesiumUrl } from '@/utils/index';
const Ajax = require('axios');

var terrainClipPlan = null;
var tilesYaping = null;
var tilesClip = null;
var tilesdzClip = null;
var numdeep = 50;
var underGround = null;
var isunder = false;
var isdrawing = false;
var entityPoint = null;
var isdizhiopen = false;
var isdizhineiwa = false;
var iskaiwa = true;
var urlforqxsy = null;//倾斜摄影url，剪裁倾斜摄影时用
var dzurl = null;
var RollerblindList = null, Rollerblindcamera = null, cuturl, clipTileset;
var datacutover, motherBoard;
const defaultCheckedList_pipe = []
const plainOptions_pipe = ['water_yushui', 'water_ranqi', 'water_wushui', 'water_gongshui']
const defaultCheckedList_geology = ['geology-di', 'geology-zuan', 'geology-pou', 'geology-di-nanshan', 'geology-zuan-nanshan', 'geology-pou-nanshan', 'geology-di-longgang', 'geology-zuan-longgang', 'geology-pou-longgang']
const plainOptions_geology = defaultCheckedList_geology

//监听层级缩放，小比例尺隐藏地质
var fun;

const { TreeNode } = Tree

@connect((Map, Home, RightFloatMenu, BaseMap) => ({
  Map, Home, RightFloatMenu, BaseMap
}))
class PipePanel extends Component {
  constructor(props) {
    super(props);
    this.state = {
      inputValue: 1,
      iskaiwa: true,
      bldgNo: false,
      value: 'pipeline',
      showLayersManage: false,
      toolsshowhide: true,

      showRoller: false, //卷帘模式
      storedData: {
        "pipeline": [],
        "geology": [],
        "dth": []
      }, //缓存内存数据
      selectAllPipeline_roller: true, //卷帘模式选中管线
      selectAllGeology_roller: true,  //卷帘模式选中地质

      checkedList_pipe: defaultCheckedList_pipe,
      indeterminate_pipe: false,
      checkedAll_pipe: false,

      checkedList_geology: [],
      indeterminate_geology: false,
      checkedAll_geology: false,

      jzDisable: false, //禁用地上建筑开关
      db_value: 0.6,
      groundChecked: false,

      roadName: null
    }
    this.now3dTileset=null;//当前拾取到的
  }

  //进入
  async componentDidMount() {
    terrainClipPlan = new mars3d.analysi.TerrainClipPlan(viewer, {
      height: this.numdeep, //高度
      splitNum: 50, //wall边界插值数
      wallImg: imgturang,
      bottomImg: imgditu
    });
    viewer.scene.globe.depthTestAgainstTerrain = true;
    //viewer.scene.globe.baseColor = new Cesium.Color.fromCssColorString("rgba(0,0,0.0,0.5,1.0)");
    //viewer.scene.undergroundMode = true;
    //viewer.scene.underGlobe.show = true;
    viewer.scene.globe.baseColor = new Cesium.Color(0, 0, 0, 0);
    viewer.scene.backgroundcolor = new Cesium.Color(0, 0, 0, 0);
    viewer.scene.skyBox.show = true;
    this.underGround = new mars3d.analysi.Underground(viewer, {
      alpha: 1.0,
      enable: false
    });

    let result = await Ajax.get(`${PUBLIC_PATH}config/urlforqxsy.json`);
    urlforqxsy = result.data[0].qxurl;
    let data1 = await Ajax.get(`${PUBLIC_PATH}config/motherBoard.json`);
    motherBoard = data1.data
    dzurl = result.data[0].dzurl;
    RollerblindList = result.data[0].RollerblindList;
    cuturl = result.data[0].cuturl;
    Rollerblindcamera = result.data[0].Rollerblindcamera;

    let data2 = await Ajax.get(`${PUBLIC_PATH}config/datacutover.json`);
    datacutover = data2.data
    // console.log(datacutover)

    this.nbindEvent();

    this.props.dispatch({
      type: 'BaseMap/changeUnderground'
    })

    setTimeout(() => {
      // this.startRoller()
      this.startFull()
      // console.log("info", infoMap)
    }, 1000);


    this.addZoomListener()

  }

  //卸载
  componentWillUnmount() {
    this.unbindEvent();
    this.clearwj();
    viewer.mars.popup.close();
    // var tileset;
    // for (var i = 0; i <= viewer.scene.primitives._primitives.length - 1; i++) {
    //   if (viewer.scene.primitives._primitives[i].url == urlforqxsy && viewer.scene.primitives._primitives[i].show) {
    //     tileset = viewer.scene.primitives._primitives[i];
    //   }
    // }
    // if (tileset) {
    //   tileset.style = new Cesium.Cesium3DTileStyle({
    //     color: "color() *vec4(1,1,1,1)"
    //   });
    // }
    this.entityPoint = null;
    this.terrainClipPlan = null;
    this.underGround = null;
    viewer.mars.popup.depthTest = true;

    this.props.dispatch({
      type: 'BaseMap/changeUnderground'
    })

    this.uninstall()

    // window.removeEventListener('mousemove', fun);
    viewer.scene.camera.moveEnd.addEventListener(fun, "PipeLine");
  }

  //开启卷帘模式
  startRoller = () => {
    const { storedData } = this.state
    let temp_pipe = [], temp_geo = [], tem_dth = []
    const { layers: { sz_dem, sz_tdom, sz_dth, water_ranqi, water_gongshui, water_wushui, water_yushui, dizhi, } } = datacutover

    this.addDem(sz_dem)
      .then(() => {
        return this.addTdom(sz_tdom)
      }).then(() => {
        return this.onDBChange(1)
      })
      .then(() => {
        return this.addDth(sz_dth).then((data) => {
          tem_dth.push(data)
        })
      })
      .then(async () => {
        //添加供水
        for (let i = 0; i < water_gongshui.length; i++) {
          await this.addPipeAndGeo(water_gongshui[i]).then((data) => {
            temp_pipe.push(data.model)
          })
        }
      })
      .then(async () => {
        //添加污水
        for (let i = 0; i < water_wushui.length; i++) {
          await this.addPipeAndGeo(water_wushui[i]).then((data) => {
            temp_pipe.push(data.model)
          })
        }
      })
      .then(async () => {
        //添加雨水
        for (let i = 0; i < water_yushui.length; i++) {
          await this.addPipeAndGeo(water_yushui[i]).then((data) => {
            temp_pipe.push(data.model)
          })
        }
      })
      .then(async () => {
        //添加燃气
        for (let i = 0; i < water_ranqi.length; i++) {
          await this.addPipeAndGeo(water_ranqi[i]).then((data) => {
            temp_pipe.push(data.model)
          })
        }
      })
      .then(() => {
        //添加地层
        return this.addPipeAndGeo(dizhi[0]).then((data) => {
          temp_geo.push(data.model)
        })
      })
      .then(() => {
        //写入内存
        return new Promise((resolve, reject) => {
          this.setState({
            storedData: {
              ...storedData,
              'pipeline': temp_pipe,
              'geology': temp_geo,
              'dth': tem_dth
            }
          })
          resolve()
        })
      })
      .then(() => {
        return this.rollerblind(true)
      })
      .then(() => {
        setTimeout(() => {
          viewer.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(114.047862, 22.5311, 1473), //经度、纬度、高度
            orientation: {
              heading: Cesium.Math.toRadians(357.7), //绕垂直于地心的轴旋转
              pitch: Cesium.Math.toRadians(-26.9), //绕纬度线旋转
              roll: Cesium.Math.toRadians(360) //绕经度线旋转
            },
            duration: 4
          });
        }, 2000)
      })
  }

  removeRoller = () => {
    const { storedData } = this.state
    const { layers: { sz_tdom, sz_dth, water_ranqi, water_gongshui, water_wushui, water_yushui, dizhi, } } = datacutover
    return this.removeDem().then(() => {
      return this.removeTdom(sz_tdom);
    }).then(() => { return this.removeDth(sz_dth) })
      .then(() => {
        for (let i = 0; i < water_gongshui.length; i++) {
          this.removePipeAndGeo(water_gongshui[i])
        }
        for (let i = 0; i < water_wushui.length; i++) {
          this.removePipeAndGeo(water_wushui[i])
        }
        for (let i = 0; i < water_yushui.length; i++) {
          this.removePipeAndGeo(water_yushui[i])
        }
        for (let i = 0; i < water_ranqi.length; i++) {
          this.removePipeAndGeo(water_ranqi[i])
        }
        this.removePipeAndGeo(dizhi[0])
        return Promise.resolve()
      })
  }

  //全屏模式
  startFull = () => {
    const { storedData } = this.state
    const { layers: { sz_dem, sz_tdom, sz_dth, water_gongshui, water_wushui, water_yushui, dizhi, } } = datacutover
    return new Promise((resolve, reject) => {
      let temp_pipe = [], temp_geo = []
      // Promise.resolve(this.rollerblind(false))
      this.toggleBasemap(false)
        .then(() => {
          return this.addDem(sz_dem)
        })
        // .then(() => {
        //   return this.addTdom(sz_tdom)
        // })
        .then(() => {
          return Promise.resolve(this.controlGround(true))
        })
        // .then(async () => {
        //   //添加供水
        //   for (let i = 0; i < water_gongshui.length; i++) {
        //     await this.addPipeAndGeo(water_gongshui[i]).then((data) => {
        //       temp_pipe.push(data.model)
        //     })
        //   }
        // })
        // .then(async () => {
        //   //添加污水
        //   for (let i = 0; i < water_wushui.length; i++) {
        //     await this.addPipeAndGeo(water_wushui[i]).then((data) => {
        //       data.model.show = false
        //       temp_pipe.push(data.model)
        //     })
        //   }
        // })
        // .then(async () => {
        //   //添加雨水
        //   for (let i = 0; i < water_yushui.length; i++) {
        //     await this.addPipeAndGeo(water_yushui[i]).then((data) => {
        //       data.model.show = false
        //       temp_pipe.push(data.model)
        //     })
        //   }
        // })
        // .then(async () => {
        //   //添加地层,剖面,钻孔
        //   // return this.addPipeAndGeo(dizhi[0]).then((data) => {
        //   //   temp_geo.push(data.model)
        //   // })
        //   for (let i = 0; i < dizhi.length; i++) {
        //     await this.addPipeAndGeo(dizhi[i]).then((data) => {
        //       temp_geo.push(data.model)
        //     })
        //   }
        // })
        .then(() => {
          return this.onDBChange(1)//0.3
        })
        // .then(() => {
        //   return new Promise((resolve, reject) => {
        //     this.setState({
        //       storedData: {
        //         ...storedData,
        //         'pipeline': temp_pipe,
        //         'geology': temp_geo
        //       }
        //     })
        //     resolve()
        //   })
        // })
        .then(() => {
          return this.addRoadName()
        })
        .then(() => {
          viewer.camera.flyTo({
            // destination: new Cesium.Cartesian3( -2401453.165196718, 5382507.388459364, 2429831.632532787), //经度、纬度、高度
            // orientation: {
            //   heading: 6.212220231094577, //绕垂直于地心的轴旋转
            //   pitch: -0.16609250699941924, //绕纬度线旋转
            //   roll: 6.283014674189143 //绕经度线旋转
            // },
            // duration: 4
            // destination: new Cesium.Cartesian3( -2401605.977733234, 5382935.00892605, 2430445.6062458875), //经度、纬度、高度
            // orientation: {
            //   heading: 6.256241999493812, //绕垂直于地心的轴旋转
            //   pitch: -1.2175182852318764, //绕纬度线旋转
            //   roll: 6.2829993509935775 //绕经度线旋转
            // },
            // duration: 4

            destination: new Cesium.Cartesian3(-2403360.698286805, 5384129.661689592, 2428608.1343229352), //经度、纬度、高度
            orientation: {
              heading: 6.265341294103502, //绕垂直于地心的轴旋转
              pitch: -0.6089874460419704, //绕纬度线旋转
              roll: 6.28313362303426 //绕经度线旋转
            },
            duration: 4
          });
        })
    })
  }

  removeFull = () => {
    const { storedData } = this.state
    const { layers: { sz_tdom, sz_dth, water_gongshui, water_ranqi, water_wushui, water_yushui, dizhi, } } = datacutover
    return this.removeTdom(sz_tdom)
      .then(() => {
        return this.removeDem()
      })
      .then(() => { return this.removeDth(sz_dth) })
      .then(() => {
        return this.onDBChange(1)
      })
      .then(() => {
        return this.removeRoadName()
      })
      .then(() => {
        for (let i = 0; i < water_gongshui.length; i++) {
          this.removePipeAndGeo(water_gongshui[i])
        }
        for (let i = 0; i < water_wushui.length; i++) {
          this.removePipeAndGeo(water_wushui[i])
        }
        for (let i = 0; i < water_yushui.length; i++) {
          this.removePipeAndGeo(water_yushui[i])
        }
        for (let i = 0; i < water_ranqi.length; i++) {
          this.removePipeAndGeo(water_ranqi[i])
        }
        for (let i = 0; i < dizhi.length; i++) {
          this.removePipeAndGeo(dizhi[i])
        }
        return Promise.resolve()
      })
  }

  //切换场景
  toggleScene = () => {
    this.setState({
      showRoller: !this.state.showRoller
    }, () => {
      const { showRoller } = this.state
      if (showRoller) {
        this.removeFull()
          .then(() => {
            return this.startRoller()
          })
      } else {
        this.removeRoller()
          .then(() => {
            return this.startFull()
          })
      }
    })
  }

  uninstall = () => {
    return Promise.resolve(this.rollerblind(false)).then(() => {
      return this.removeRoller()
    }).then(() => {
      return this.removeFull()
    }).then(() => {
      this.props.dispatch({
        type: 'Home/setBuildingInfo',
        payload: null
      })
    })
  }

  //地表透明度
  onDBChange = (value, type) => {
    this.setState({
      inputValue: value,
      db_value: value
    });
    if (!this.underGround) {
      let {
        viewer,
        Cesium
      } = window;
      viewer.scene.globe.depthTestAgainstTerrain = true;
      viewer.scene.globe.baseColor = new Cesium.Color(0, 0, 0, 0);
      this.underGround = new mars3d.analysi.Underground(viewer, {
        alpha: 1.0,
        enable: false
      });

    }
    else {
      this.underGround.alpha = value;
      if (this.underGround.alpha == 1.0) {
        this.underGround.enable = false;
      } else {
        this.underGround.enable = true;
      }

      //同步调整倾斜摄影的透明度
      const { reality: { sz_osgb } } = motherBoard;
      //隐藏
      var List = ["dapeng", "baoan", "futian", "guangming", "lingdingdao", "longgang", "longhua", "luohu", "nanshan", "pingshan", "yantian"];
      List.forEach((element) => {
        let url = sz_osgb.children[element];
        let primitives = this.getModelbyurl(url);
        if (primitives) {
          primitives.style = new Cesium.Cesium3DTileStyle({
            color: "color() *vec4(1,1,1," + value + ")"
          });
        }

      })
    }
  };

  addRoadName = () => {
    return new Promise((resolve, reject) => {
      var entity = new Cesium.Entity({
        name: '新洲路',
        position: Cesium.Cartesian3.fromDegrees(114.044226, 22.551225),
        label: {
          text: '新洲路',
          fillColor: Cesium.Color.AZURE,
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 2,
          horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
          // disableDepthTestDistance:Number.POSITIVE_INFINITY //一直显示,不被地形遮挡
          scaleByDistance: new Cesium.NearFarScalar(100, 1.0, 10000, 0.2),
          distanceDisplayCondition: new Cesium.DistanceDisplayCondition(10.0, 10000.0)
        }
      })

      viewer.entities.add(entity)

      this.setState({
        roadName: entity
      }, () => {
        resolve()
      })

    })
  }

  removeRoadName = () => {
    const { roadName } = this.state
    return new Promise((resolve, reject) => {
      viewer.entities.remove(roadName)
      resolve()
    })
  }

  ondeepChange = (value, type) => {
    numdeep = Number(value);
    tilesdzClip && tilesdzClip.updateDistance(numdeep);
  };

  onChangeg = e => {
    if (e.target.value == "geology") {
      isdizhiopen = true;
    } else if (e.target.value == "pipeline") {
      isdizhiopen = false;
    }
    this.setState({
      value: e.target.value
    })
  }
  // 是否是地质内挖
  onDZMSChange = (value) => {
    isdizhineiwa = value;
  };
  fushiView = () => {
    var result = viewer.camera.pickEllipsoid(new Cesium.Cartesian2(viewer.canvas.clientWidth / 2, viewer.canvas
      .clientHeight / 2));
    //console.log(result);
    var curPosition = Cesium.Ellipsoid.WGS84.cartesianToCartographic(result);
    //console.log(curPosition);
    var lon = curPosition.longitude * 180 / Math.PI;
    var lat = curPosition.latitude * 180 / Math.PI;
    var ellipsoid = viewer.scene.globe.ellipsoid;
    var height = ellipsoid.cartesianToCartographic(viewer.camera.position).height;

    viewer.scene.camera.setView({

      destination: Cesium.Cartesian3.fromDegrees(lon, lat, 500),
      orientation: {
        heading: Cesium.Math.toRadians(0.6),
        pitch: Cesium.Math.toRadians(-88.5),
        roll: 0
      }
    });
  };

  underView = () => {
    var result = viewer.camera.pickEllipsoid(new Cesium.Cartesian2(viewer.canvas.clientWidth / 2, viewer.canvas
      .clientHeight / 2));
    var curPosition = Cesium.Ellipsoid.WGS84.cartesianToCartographic(result);
    var lon = curPosition.longitude * 180 / Math.PI;
    var lat = curPosition.latitude * 180 / Math.PI;
    var ellipsoid = viewer.scene.globe.ellipsoid;
    viewer.scene.camera.setView({
      destination: Cesium.Cartesian3.fromDegrees(lon, lat, -5),
      orientation: {
        heading: Cesium.Math.toRadians(17.5),
        pitch: Cesium.Math.toRadians(8.7),
        roll: 0.1
      }
    });

  };

  jxClip = () => {
    const { checkedList_geology } = this.state
    var $this = this;
    this.props.dispatch({
      type: 'Map/setisExcavation',
      payload: false
    })
    isdizhiopen = false
    //地层在的时候开挖地质才有效
    checkedList_geology.forEach((item)=>{
      if(item.indexOf('geology-di') !== -1){
        isdizhiopen = true
      }
    })
    // if (checkedList_geology.indexOf('geology-di') !== -1) {
    //   isdizhiopen = true
    // } else {
    //   isdizhiopen = false
    // }
    //非地质开挖模式
    if (iskaiwa && !isdizhiopen) {
      isdrawing = true;
      viewer.mars.draw.startDraw({
        type: 'rectangle',
        style: {
          color: '#007be6',
          opacity: 0.8,
          outline: false,
          clampToGround: true
        },
        success: function (entity) {
          $this.props.dispatch({
            type: 'Map/setisExcavation',
            payload: true
          })
          isdrawing = false;
          var positions = mars3d.draw.attr.rectangle.getOutlinePositions(entity, true);
          var tilesettmp = mars3d.tileset.pick3DTileset(viewer, positions);
          var tileset;

          for (var i = 0; i <= viewer.scene.primitives._primitives.length - 1; i++) {
            if (viewer.scene.primitives._primitives[i].url == urlforqxsy && viewer.scene.primitives._primitives[i].show) {
              tileset = viewer.scene.primitives._primitives[i];
            }
          }

          terrainClipPlan.transparent = false;

          if (tileset && tilesettmp && (tilesettmp.url == urlforqxsy)) {
            tilesClip = new mars3d.tiles.TilesClipPlan(tileset);
            tilesClip.clipByPoints(positions, { unionClippingRegions: false });
          }
          viewer.mars.draw.deleteAll();
          terrainClipPlan.clear();
          terrainClipPlan.height = Math.abs(numdeep);
          terrainClipPlan.updateData(positions);
        }
      });
    }
    else if (iskaiwa && isdizhiopen) {
      //模型剖切
      isdrawing = true;
      viewer.mars.draw.startDraw({
        type: 'rectangle',
        style: {
          color: '#007be6',
          opacity: 0.8,
          outline: false,
          clampToGround: true
        },
        success: function (entity) {

          $this.props.dispatch({
            type: 'Map/setisExcavation',
            payload: true
          })
          isdrawing = false;
          var positions = mars3d.draw.attr.rectangle.getOutlinePositions(entity, true);

          // 根据最后一个点拾取模型对象，并筛选出3dtiles


          //var tilesettmp = mars3d.tileset.pick3DTileset(viewer, positions);
          //var dztileset;
          //var polygon_height=(-numdeep);
          var dztileset = $this.nowprimitive;

          if(!(dztileset instanceof Cesium.Cesium3DTileset)){
            dztileset=$this.now3dTileset;
          }

          // 判断primitive的类型
          if(dztileset && (dztileset instanceof Cesium.Cesium3DTileset)){
              tilesdzClip = new mars3d.tiles.TilesClipPlan(dztileset, { distance: 10.0 });
              tilesdzClip.clipByPoints(positions, { unionClippingRegions: isdizhineiwa });
              terrainClipPlan.transparent = false;  
          }else{
            message.error('未选中地质模型或地质模型未加载完成，请稍后再试！');
          }
          //var twopositions= viewer.mars.draw.getPositions(entity);
          //var modelpositions = mars3d.pointconvert.cartesians2lonlats(twopositions);
          // for (var i = 0; i <= viewer.scene.primitives._primitives.length - 1; i++) {

          //   if (viewer.scene.primitives._primitives[i].url == dzurl && viewer.scene.primitives._primitives[i].show) {
          //     dztileset = viewer.scene.primitives._primitives[i];
          //   }
          // }
          //  var minHeight=1000000;
          //  for(var i=0;i<modelpositions.length;i++){
          //    var Height =modelpositions[i][2];
          //    if(Height<minHeight){
          //     minHeight=Height;
          //    }           
          //  } 
          //   if((numdeep < minHeight)&&numdeep<0){
          //     polygon_height=minHeight;
          //    }

          terrainClipPlan.transparent = false;
          //if (dztileset && tilesettmp) {
          
          viewer.mars.draw.deleteAll();
        }
      });
    }
  };

  dbxClip = () => {
    if (iskaiwa) {
      isdrawing = true;
      viewer.mars.draw.startDraw({
        type: 'polygon',
        style: {
          color: '#007be6',
          opacity: 0.8,
          outline: true,
          clampToGround: true
        },
        success: function (entity) {
          isdrawing = false;
          var positions = viewer.mars.draw.getPositions(entity);
          // console.log(positions)
          var tilesettmp = mars3d.tileset.pick3DTileset(viewer, positions);
          var tileset;//= viewer.scene.primitives._primitives[6];
          var dztileset;
          for (var i = 0; i <= viewer.scene.primitives._primitives.length - 1; i++) {
            if (viewer.scene.primitives._primitives[i].url == urlforqxsy && viewer.scene.primitives._primitives[i].show) {
              tileset = viewer.scene.primitives._primitives[i];
            }
            if (viewer.scene.primitives._primitives[i].url == dzurl && viewer.scene.primitives._primitives[i].show) {
              dztileset = viewer.scene.primitives._primitives[i];
            }
          }
          terrainClipPlan.transparent = false;
          if (tileset && tilesettmp && (tilesettmp.url == urlforqxsy)) {
            // console.log(positions)
            //tilesClip = new mars3d.tiles.TilesClip({viewer:viewer,tileset:tileset,positions:positions,clipOutSide:false});   
            //TilesClipPlan类剪裁效果要好于 tilesClip
            tilesClip = new mars3d.tiles.TilesClipPlan(tileset);
            tilesClip.clipByPoints(positions, { unionClippingRegions: false });


            /* 压平倾斜摄影部分代码，因三角网问题，后转为倾斜摄影剪裁功能
            var geojson = mars3d.draw.attr.toGeoJSON(entity);
            var enveloped=turf.envelope(geojson);
            //var reckToPoly=new Cesium.PolygonGeometry({polygon:Cesium.polygon.fromDegrees })
           
            var bufferPositions= turf.buffer(enveloped,30,{units:'meters'});                
            var temppolyon = mars3d.pointconvert.lonlats2cartesians(bufferPositions.geometry.coordinates);
            this.tilesYaping =  new mars3d.tiles.TilesFlat({viewer:viewer,tileset:tileset,positions:positions,flatHeight:50});     */

          }
          if (dztileset && tilesettmp && (tilesettmp.url == dzurl)) {
            // console.log(positions)
            tilesdzClip = new mars3d.tiles.TilesClipPlan(dztileset);
            tilesdzClip.clipByPoints(positions, { unionClippingRegions: false });
            terrainClipPlan.transparent = true;
          }
          viewer.mars.draw.deleteAll();
          terrainClipPlan.clear();
          terrainClipPlan.height = numdeep;
          terrainClipPlan.updateData(positions);
        }
      });
    }

  };

  clearwj = () => {
    if (terrainClipPlan) {
      terrainClipPlan.clear();
    }
    if (tilesClip) {
      tilesClip.clear();
    }
    if (tilesdzClip) {
      tilesdzClip.clear();
    }
    viewer.mars.popup.close();
  };

  undergroundChange = (value) => {
    isunder = value;
    this.underGround.enable = value;
  }

  nbindEvent = () => {//获取模型
    const $this = this;
    this.handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    viewer.mars.popup.depthTest = false;
    this.handler.setInputAction((event) => {
      var tempposition = event.position;
      // var pickedObject = viewer.scene.pick(tempposition);
      var pickedObjects = viewer.scene.drillPick(tempposition,2);
      if (pickedObjects && pickedObjects.length!==0) {

        if(pickedObjects[0].primitive){
          $this.nowprimitive = pickedObjects[0].primitive;
        }
        if(pickedObjects[1] && pickedObjects[1].primitive){
          $this.now3dTileset = pickedObjects[1].primitive;
        }
        
      }else{
        $this.now3dTileset = null;
        $this.nowprimitive = null;
      }
      // if (pickedObject && pickedObject.primitive) {
      //   $this.nowprimitive = pickedObject.primitive;
      // }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK)
  }


  //获取剖切模型
  getprimitive = () => {
    const $this = this;
    this.originColor = new Cesium.Color(1, 1, 1, 1);
    this.handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    this.handler.setInputAction((event) => {
      var tempposition = event.position;
      var pickedObject = viewer.scene.pick(tempposition);
      if (pickedObject && pickedObject.primitive) {
        if (pickedObject.primitive.root) {
          $this.nowprimitive = pickedObject.primitive;
          const { isexcavation } = $this.props.Map
          if (!isexcavation) {
            pickedObject.content.tile.color = $this.originColor;
          }

        }
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK)
  }

  //根据路径 获取模型
  getModelbyurl = (url) => {
    let primitives = viewer.scene.primitives._primitives;
    let Ftileset = undefined;
    primitives.forEach((data) => {
      let newurl = data.url;
      if (newurl === url) {
        Ftileset = data;
        return;
      }
    });
    return Ftileset;
  }

  //添加单体化模型
  addDth = (item) => {
    const {
      storedData
    } = this.state
    return new Promise((resolve, reject) => {
      let cesium3DTileset = new Cesium.Cesium3DTileset({
        url: getCesiumUrl(item.url, true),
        show: true,
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

      cesium3DTileset.readyPromise.then(function (tileset) {
        viewer.scene.primitives.add(cesium3DTileset);
        // viewer.camera.moveStart.addEventListener(this.moveStart);
        // viewer.camera.moveEnd.addEventListener(this.moveEnd);
        if (item.offsetHeight) { //调整高度
          let origin = tileset.boundingSphere.center;
          let cartographic = Cesium.Cartographic.fromCartesian(origin);
          let surface = Cesium.Cartesian3.fromRadians(cartographic.longitude, cartographic.latitude, 0.0);
          let offset = Cesium.Cartesian3.fromRadians(cartographic.longitude, cartographic.latitude, item.offsetHeight);
          let translation = Cesium.Cartesian3.subtract(offset, surface, new Cesium.Cartesian3());
          tileset.modelMatrix = Cesium.Matrix4.fromTranslation(translation);
        }
      })
      resolve(cesium3DTileset)
    })
  }

  removeDth = (item) => {
    const {
      storedData
    } = this.state
    return new Promise((resolve, rejeect) => {
      storedData['dth'] && storedData['dth'].forEach((s, index) => {
        viewer.scene.primitives.remove(s)
      })
      resolve()
    })
  }

  showOrHideDth = (item, flag) => {
    const {
      storedData
    } = this.state
    return new Promise((resolve, rejeect) => {
      storedData['dth'] && storedData['dth'].forEach((s, index) => {
        s.show = flag
      })
      resolve()
    })
  }

  addDem = (item) => {
    const { storedData } = this.state
    return new Promise((resolve, reject) => {
      let terrainProvider = new Cesium.CesiumTerrainProvider({
        url: getCesiumUrl(item.url, true)
      })
      viewer.terrainProvider = terrainProvider
      resolve()
    })
  }

  removeDem = () => {
    return new Promise((resolve, reject) => {
      viewer.scene.terrainProvider = new Cesium.EllipsoidTerrainProvider({}) //置空地形
      resolve()
    })
  }

  addTdom = (item) => {
    const { storedData } = this.state
    return new Promise((resolve, reject) => {
      var layer = viewer.imageryLayers.addImageryProvider(new Cesium.UrlTemplateImageryProvider({
        url: getCesiumUrl(item.url, true)
      }));
      this.setState({
        storedData: {
          ...storedData,
          [item.key]: layer
        }
      }, () => {
        resolve()
      })
    })
  }

  removeTdom = (item) => {
    const {
      storedData
    } = this.state
    return new Promise((resolve, reject) => {
      storedData[item.key] && viewer.imageryLayers.remove(storedData[item.key])
      resolve()
    })
  }

  addPipeAndGeo = (v) => {
    return new Promise((resolve, reject) => {
      const { storedData } = this.state
      let $that = this;
      let result;
      let realUrl = getCesiumUrl(v.url, true);
      if (v.datatype && v.datatype.includes("pipeline")) {
        result = mars3d.layer.createLayer({
          "name": v.title,
          "type": "3dtiles",
          "key": v.key,
          "url": realUrl,
          "maximumScreenSpaceError": 2,
          "maximumMemoryUsage": 1024,
          "showClickFeature": true,
          "offset": {
            "z": v.offsetHeight
          },
          "style": {
            "color": v.Color
          },
          "visible": true,
          "asset": {
            "dataType": v.datatype,
            "selectColor": v.selectColor
          },
          // "flyTo":true,
          "click": function (e) {//单击
            // console.log(e);
            // e.feature.color = Cesium.Color.fromCssColorString(e.feature.primitive._config.asset.selectColor).withAlpha(0.5);
            var dataType = e.feature ? e.feature.primitive._config.asset.dataType: e._config.asset.dataType;
            if (dataType.includes("pipeline-line")) {
              //给水 排水 排污 天然气 管线
              // var name = e.feature.getProperty("name");
              // var newname = wrap(name)
              var newname = e.feature?e.feature.getProperty("OID"):1;
              var obj = new Object();
              obj.type = "wpipelinedata";
              var key=e.feature?e.feature.primitive.key:e.key;
              if (key === 'water_gongshui_line') {//给水
                obj.holename = "供水管线信息（模拟数据）";
                obj.dataList = { ...infoMap.jishui, OBJECTID: newname }
              } else if (key === 'water_wushui_line') {//排污
                obj.holename = "污水管线信息（模拟数据）";
                obj.dataList = { ...infoMap.wushui, OBJECTID: newname }
              } else if (key === 'water_yushui_line') {//排水
                obj.holename = "雨水管线信息（模拟数据）";
                obj.dataList = { ...infoMap.yushui, OBJECTID: newname }
              } else if (key === 'water_ranqi_line') {//燃气
                obj.holename = "燃气管线信息（模拟数据）";
                obj.dataList = { ...infoMap.ranqi, OBJECTID: newname }
              }
              $that.getjpstpipelinebyid(obj)
            } else if (dataType.includes("pipeline-point")) {
              //井
              var name = e.feature.getProperty("name");
              var newname = wrap(name || '')
              var obj = new Object();
              obj.type = "jiwelldata";
              if (e.feature.primitive.key === 'water_gongshui_point') {
                obj.holename = "供水管点信息（模拟数据）";
                obj.dataList = { ...infoMap.guandian, OBJECTID: newname }
              } else if (e.feature.primitive.key === 'water_wushui_point') {
                obj.holename = "污水管点信息（模拟数据）";
                obj.dataList = { ...infoMap.guandian, OBJECTID: newname }
              } else if (e.feature.primitive.key === 'water_yushui_point') {
                obj.holename = "雨水管点信息（模拟数据）";
                obj.dataList = { ...infoMap.guandian, OBJECTID: newname }
              } else if (e.feature.primitive.key === 'water_ranqi_point') {
                obj.holename = "燃气管点信息（模拟数据）";
                obj.dataList = { ...infoMap.guandian, OBJECTID: newname }
              }
              $that.getwellbyid(obj);
            }
          },
          "calback": (tileset) => {
            // $that.setState({
            //   storedData: {
            //     ...storedData,
            //     [v.id]: tileset
            //   }
            // })
          }
        }, viewer);

      } else if (v.datatype && v.datatype.includes("dizhi")) {

        //地质模型
        result = mars3d.layer.createLayer({
          "name": "地质模型",
          "type": "3dtiles",
          "key": v.key,
          "url": realUrl,
          "show": true,
          "maximumScreenSpaceError": 2,
          "maximumMemoryUsage": 1024,
          "showClickFeature": true,
          "offset": {
            "z": v.offsetHeight
          },
          "visible": true,
          "asset": {
            "dataType": v.datatype
          },
          "flyTo":true,
          "click": function (e) {
            var dataType = e.feature.primitive._config.asset.dataType;
            // console.log(e);
            if (dataType == "dizhi-zk" || dataType.includes("dizhi-zk")) {
              var primitive = $that.getprimitivebyid("dirlling");
              if (primitive.length > 0) {
                primitive.removeAll();
              }
              var name = e.feature.getProperty("name");
              var id = strsplit(name);
              $that.getholedatabyid(id, primitive)
            } else if (dataType == "dizhi-dz" || dataType.includes("dizhi-dz")) {
              //地质
              var name = e.feature.getProperty("name");
              var id = strsplit(name);
              $that.getgeoatabyid(id)
            } else if (dataType == "dizhi-pm" || dataType.includes("dizhi-pm")) {
              var name = e.feature.getProperty("name");
              var objectid = strsplit(name);
              if(objectid>11){
                this.props.dispatch({
                  type: 'Home/setBuildingInfo',
                  payload: null
                })
                return;
              }
              // $that.props.dispatch({
              //   type: 'Home/setPMindex',
              //   payload: objectid
              // })
              // var contenturl = e.feature.content.url;
              // var list = contenturl.split("/");
              // var id = list[list.length - 2];
              $that.getgeoatabylayerid(objectid);
            }
          },
          "calback": function (tileset) {
            if (v.datatype === "dizhi-pm" ||  v.datatype.includes("dizhi-pm")) {
              tileset.shadows = 0;
              tileset.imageBasedLightingFactor = new Cesium.Cartesian2(3.0, 3.0);
            }
            // $that.setState({
            //   storedData: {
            //     ...storedData,
            //     [v.id]: tileset
            //   }
            // })
          }
        }, viewer);
      }

      function strsplit(name) {
        var nameList = name.split("_");
        var id = Number(nameList[nameList.length - 1].replace(/[^0-9]/ig, ""));
        return id;
      }
      //换行
      function wrap(name) {
        // var onename = name.substring(0, 25) + "\n";
        // var twoname = name.substring(25, name.length - 1);
        // return onename + twoname;
        let alias = name.split("_")
        let alias1 = alias.slice(1, alias.length)
        return alias1.join("_")
      }

      resolve(result)
    })
  }


  addZoomListener = () =>{
    const { layers: { dizhi, } } = datacutover
    const that = this;
    function debounces(fn, wait) {
      var timeouts = null;

      return function () {
        if (timeouts) {
          clearTimeout(timeouts);  
        }
        timeouts = setTimeout(fn, wait);  
      };
    }

    function handlers() {
      var level = 0
      if (viewer.scene.globe._surface._tilesToRender.length) {
        level = viewer.scene.globe._surface._tilesToRender[0].level
      }
      if (level < 12) {
        // console.log(1111)
        dizhi.forEach(d=>{
          if (d.datatype.indexOf('dizhi-dz') !== -1){
            let tileset = that.getModelbyUrl(d.url)
            if(tileset) {
              tileset.show = false
            }
          }
        })        
      } else {
        // console.log(22222)
        const {storedData:{geology},checkedList_geology} = that.state;
        geology.map((s, index) => {
          if (checkedList_geology.indexOf(s.key) !== -1) {
            s.show = true
          }
        })
        // dizhi.forEach(d=>{
        //   if (d.datatype.indexOf('dizhi-dz') !== -1){
        //     let tileset = that.getModelbyUrl(d.url)
        //     if(tileset) {
        //       tileset.show = true
        //     }
        //   }
        // })   
      } 
    }
    fun = debounces(handlers, 500);
    viewer.scene.camera.moveEnd.addEventListener(fun, "PipeLine");
    // window.addEventListener('mousemove', fun);
  }

  getModelbyUrl = (url) => {
    let primitives = viewer.scene.primitives._primitives;
    let find3dtileset = undefined;
    primitives.forEach((data) => {
      let newurl = data.url;
      if (newurl === url) {
        find3dtileset = data;
        return;
      }
    });
    return find3dtileset;
  }

  removePipeAndGeo = (v) => {
    const { storedData: { pipeline, geology } } = this.state
    pipeline.forEach((item, index) => {
      if (item.key === v.key) {
        viewer.scene.primitives.remove(item)
      }
    })
    geology.forEach((item, index) => {
      if (item.key === v.key) {
        viewer.scene.primitives.remove(item)
      }
    })
    // return new Promise((resolve,reject) => {
    //   // geology.forEach((item,index)=>{
    //   //   console.error(item)
    //   //   mars3d.layer.remove()
    //   // })
    //   resolve()
    // })
  }

  getjpstpipelinebyid = async (object) => {
    // console.log(object)
    this.props.dispatch({
      type: 'Home/setBuildingInfo',
      payload: object
    })
  }
  //井盖 检修井 请求暂时
  getwellbyid = async (object) => {
    this.props.dispatch({
      type: 'Home/setBuildingInfo',
      payload: object
    })
  }

  //卷帘
  rollerblind = (startroller) => {
    const { layers: { sz_tdom, water_gongshui, water_wushui, water_yushui, dizhi, } } = datacutover
    const { storedData } = this.state
    //设置地球体
    viewer.scene.globe.enableSceneSplit = startroller;
    //设置单体化数据
    storedData['dth'] && storedData['dth'].forEach((s, index) => {
      s.enableSceneSplit = startroller
    })

    var data = viewer.dataSources.getByName("poi")[0];
    var lhzkpoidata = viewer.dataSources.getByName("lhzkpoi")[0];
    const { dataswicth: { Indoormodel } } = datacutover;
    if (startroller) {
      viewer.scene.skyAtmosphere.show = false;
      document.getElementById("slider").style.display = "block";
      //----POI点的隐藏 暂时---
      if (data) {
        data.show = false;
      }
      if (lhzkpoidata) {
        lhzkpoidata.show = false;
      }

      //标签隐藏
      Indoormodel.forEach((data) => {
        document.getElementById(data.id).style.display = "none";
      })
      //------------------
      //--------启动地质模型剖切---
      let cutTiles = this.getModelbyurl(cuturl);
      if (cutTiles) {
        clipTileset = new mars3d.tiles.TilesClipPlan(cutTiles);
        this.startCut(clipTileset);
      }
      //------------------
    } else {
      viewer.scene.skyAtmosphere.show = true;
      document.getElementById("slider").style.display = "none";
      //document.getElementById("slidercimg").style.display = "none";
      if (data) { data.show = true; }
      if (lhzkpoidata) { lhzkpoidata.show = true };
      if (clipTileset) {
        clipTileset.clear();
        viewer.camera.moveEnd.removeEventListener(window.clipline)
        viewer.camera.changed.removeEventListener(window.clipline)
        viewer.camera.moveStart.removeEventListener(window.clipline)
      }
      Indoormodel.forEach((data) => {
        document.getElementById(data.id).style.display = "block";
      })
    }

    this.props.dispatch({
      type: 'Map/setstartroller',
      payload: startroller
    })

  }
  //启动地质模型剖切
  startCut = (clipTileset) => {
    var slider = document.getElementById("slider");
    viewer.camera.moveEnd.addEventListener(clipline)
    // viewer.camera.changed.addEventListener(clipline)
    viewer.camera.moveStart.addEventListener(clipline)
    var cliplineobj = {
      height: slider.offsetTop,
      startpoint: 0,
      endpoint: slider.parentElement.offsetWidth
    }
    function clipline() {
      // if(slider.style.display=="none"){ 
      //   viewer.camera.moveEnd.removeEventListener(clipline) 
      //   viewer.camera.changed.removeEventListener(clipline) 
      //   viewer.camera.moveStart.removeEventListener(clipline) 
      //   return; 
      // } 
      var points = [];
      var cartesian = new Cesium.Cartesian2(cliplineobj.startpoint, cliplineobj.height);
      if (cartesian == undefined) { return; }
      var position = viewer.camera.pickEllipsoid(cartesian, viewer.scene.globe.ellipsoid);
      if (position == undefined) { return; }
      var cartesian1 = new Cesium.Cartesian2(cliplineobj.endpoint, cliplineobj.height);
      if (cartesian1 == undefined) { return; }
      var position1 = viewer.camera.pickEllipsoid(cartesian1, viewer.scene.globe.ellipsoid);
      if (position1 == undefined) { return; }
      points.push(position);
      points.push(position1);
      clipTileset.clipByPoints(points);
    }
    window.clipline = clipline
  }

  getRotationValue = () => {
    var coordinates = Cesium.Rectangle.fromDegrees(113.61448, 22.564297, 114.672106, 22.385027);
    return coordinates;
  }
  clipline = () => {
    var poiSources = viewer.dataSources.getByName("poi");
    if (poiSources.length > 0) {
      let poi = poiSources[0];
      var root = document.getElementById("root");
      var startheight = root.offsetHeight - 350;
      var twoDcartesian = new Cesium.Cartesian2(0, startheight)
      var EtwoDcartesian = new Cesium.Cartesian2(root.offsetWidth, root.offsetHeight)
      var twoDd = viewer.camera.pickEllipsoid(twoDcartesian, viewer.scene.globe.ellipsoid);
      var EtwoDd = viewer.camera.pickEllipsoid(EtwoDcartesian, viewer.scene.globe.ellipsoid);
      var position1 = mars3d.pointconvert.cartesian2lonlat(twoDd)
      var position2 = mars3d.pointconvert.cartesian2lonlat(EtwoDd)
      var coordinates = Cesium.Rectangle.fromDegrees(position1[0], position1[1], position2[0], position2[1])
      var redPolygon = viewer.entities.add({
        name: 'Red polygon on surface',
        polygon: {
          hierarchy: Cesium.Cartesian3.fromDegreesArray([
            115.0, 37.0,
            115.0, 32.0,
            107.0, 33.0,
            102.0, 31.0,
            102.0, 35.0]),
          material: Cesium.Color.RED
        }
      });
    }
  }

  //转世纪
  gettimeyear = () => {
    let dates = new Date();
    let year = dates.getFullYear();
    let century = Math.floor(year / 100);
    if (year % 100) {
      century++;
    }
    return "第" + century + "世纪";
  }

  //地层请求
  getgeoatabyid = async (id) => {
    let data = await request(`/vb/geo/model/prop/${id}`);
    if (data.success) {
      var obj = new Object();
      obj.type = "zcgeodata";
      obj.holename = "地层模型信息";
      if (data.data) {
        if (!data.data.AGEID) {
          data.data.AGEID = this.gettimeyear();
        }
        obj.dataList = data.data;
        this.props.dispatch({
          type: 'Home/setBuildingInfo',
          payload: obj
        })
      } else {
        this.props.dispatch({
          type: 'Home/setBuildingInfo',
          payload: null
        })
      }

    } else {
      console.log("geo请求失败")
    }
  }


  getprimitivebyid = (id) => {
    var primitive = null;
    var primitives = viewer.scene.primitives;
    var length = primitives.length;
    for (var i = 0; i < length; i++) {
      var p = primitives.get(i);
      if (p._guid === id) {
        primitive = p;
      }
    }
    //为空创建
    if (!primitive) {
      primitive = new Cesium.PrimitiveCollection();
      primitive._guid = "dirlling";
    }
    return primitive;
  }

  //剖面请求
  getgeoatabylayerid = async (id) => {
    let data = await request(`/vb/geo/profile/${id}`);
    if (data.success) {
      var obj = new Object();
      obj.type = "pmholedata";
      obj.holename = "剖面地质信息";
      obj.holedataList = data.data;
      this.props.dispatch({
        type: 'Home/setBuildingInfo',
        payload: obj
      })
    }
  }


  //钻孔请求
  getholedatabyid = async (id, p) => {
    let data = await request(`/vb/hole/model/prop/${id}`);
    if (data.success && data.data) {
      let holeid = data.data.HOLEID;
      let holedata = await request(`/vb/hole/model/prop/hole/${holeid}`);
      if (holedata.success && holedata.data.length!==0) {
        //添加贴地圆
        var X4490 = Number(holedata.data[0].X4490), Y4490 = Number(holedata.data[0].Y4490);
        var position = Cesium.Cartesian3.fromDegrees(X4490 + 0.000001, Y4490 + 0.00000385, -20)
        //var position = Cesium.Cartesian3(entity.option.X, entity.option.Y, 0);
        var circleinstance = new Cesium.GeometryInstance({
          geometry: new Cesium.CircleGeometry({
            center: position,
            radius: 0.634
            /* extrudedHeight:1000000//拉申高度 */
          }),
          attributes: {
            color: new Cesium.ColorGeometryInstanceAttribute(0.53, 0.90, 0.09, 0.5)
          },
        });
        p.add(new Cesium.GroundPrimitive({
          geometryInstances: [circleinstance],
          appearance: new Cesium.PerInstanceColorAppearance()
        }))
        viewer.scene.primitives.add(p);
        var obj = new Object();
        obj.type = "zkholedata";
        obj.holename = "钻孔地层信息";
        obj.holedataList = holedata.data;
        this.props.dispatch({
          type: 'Home/setBuildingInfo',
          payload: obj
        })
      }
    }
    else {
      console.log("hole请求失败")
    }
  }

  //地下工具显示隐藏
  toolsshowhide = () => {
    let { toolsshowhide } = this.state

    this.setState({
      toolsshowhide: !this.state.toolsshowhide
    })
  }
  unbindEvent = () => {
    if (this.selectTile) {
      this.selectTile.color = this.originColor
    }
    this.handler && this.handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK);
  }

  //关闭
  onClose = () => {
    this.props.dispatch({
      type: 'Map/setToolsActiveKey',
      payload: ""
    })
  }

  // check 管线
  onChangePipe = (e) => {
    const { storedData: { pipeline } } = this.state
    if (e.target.checked) {
      pipeline.forEach((t, i) => {
        t.show = true
      })
    } else {
      pipeline.forEach((t, i) => {
        t.show = false
      })
    }
    this.setState({
      selectAllPipeline_roller: e.target.checked
    })
  }

  //check 地质
  onChangeGeo = (e) => {
    const { storedData: { geology } } = this.state
    // console.log(geology)
    if (e.target.checked) {
      geology.forEach((t, i) => {
        t.show = true
      })
    } else {
      geology.forEach((t, i) => {
        t.show = false
      })
    }
    this.setState({
      selectAllGeology_roller: e.target.checked
    })
  }

  //树
  renderTreeNodes = data => {
    data.map(item => {
      if (item.children) {
        return (
          <TreeNode title={item.title} key={item.key} dataRef={item}>
            {this.renderTreeNodes(item.children)}
          </TreeNode>
        );
      }
      return <TreeNode key={item.key} {...item} />;
    });
  }

  controlGround = (checked) => {
    return new Promise((resolve, reject) => {
      const { storedData } = this.state
      const { layers: { sz_tdom, sz_dth, water_gongshui, water_wushui, water_yushui, dizhi, } } = datacutover
      if (checked) {
        if (storedData['dth'].length === 0) {
          this.addDth(sz_dth).then((data) => {
            // console.log(data)
            this.setState({
              groundChecked: checked,
              storedData: {
                ...storedData,
                'dth': [data]
              }
            }, () => {
              resolve()
            })
          })
        } else {
          this.showOrHideDth(sz_dth, true)
          this.setState({
            groundChecked: checked
          }, () => {
            resolve()
          })
        }
      } else {
        this.showOrHideDth(sz_dth, false)
        this.setState({
          groundChecked: checked
        }, () => {
          resolve()
        })
      }
    })
  }

  toggleBasemap = (flag) => {
    const { marsBasemap } = this.props.Map
    return new Promise((resolve, rejeect) => {
      let s = viewer.mars.getBasemap()
      s && s.setVisible(false)
      marsBasemap && marsBasemap.setVisible(flag)
      resolve()
    })

  }

  //单击管线
  onChange_pipe = async (checkedList) => {
    const { checkedList_pipe, storedData, pipeline } = this.state
    const { layers: { sz_dem, sz_tdom, sz_dth, water_gongshui, water_ranqi, water_wushui, water_yushui, dizhi, } } = datacutover
    let flag = checkedList.length > checkedList_pipe.length ? true : false  //true 添加，false 去除
    if (flag) { // 判断是否已加载到storeData
      storedData['pipeline'].map((s, index) => {
        var temp = s.key.split("_")
        temp.pop()
        var key = temp.join("_")
        if (key === checkedList[checkedList.length - 1]) {
          flag = false
        }
      })
    }
    if (flag) {
      let key = checkedList[checkedList.length - 1]
      let temp_pipe = [];
      switch (key) {
        case "water_gongshui":
          for (let i = 0; i < water_gongshui.length; i++) {
            await this.addPipeAndGeo(water_gongshui[i]).then((data) => {
              temp_pipe.push(data.model)
            })
          }
          break;
        case "water_wushui":
          for (let i = 0; i < water_wushui.length; i++) {
            await this.addPipeAndGeo(water_wushui[i]).then((data) => {
              temp_pipe.push(data.model)
            })
          }
          break;
        case "water_yushui":
          for (let i = 0; i < water_yushui.length; i++) {
            await this.addPipeAndGeo(water_yushui[i]).then((data) => {
              temp_pipe.push(data.model)
            })
          }
          break;
        case "water_ranqi":
          for (let i = 0; i < water_ranqi.length; i++) {
            await this.addPipeAndGeo(water_ranqi[i]).then((data) => {
              temp_pipe.push(data.model)
            })
          }
          break;
        default:
          break;
      }

      // console.log('temp_pipe', temp_pipe)
      this.setState({
        checkedList_pipe: checkedList,
        indeterminate_pipe: !!checkedList.length && checkedList.length < plainOptions_pipe.length,
        checkedAll_pipe: checkedList.length === plainOptions_pipe.length,
        storedData: {
          ...this.state.storedData,
          'pipeline': [...this.state.storedData.pipeline, ...temp_pipe]
        }
      })
    } else {
      this.setState({
        checkedList_pipe: checkedList,
        indeterminate_pipe: !!checkedList.length && checkedList.length < plainOptions_pipe.length,
        checkedAll_pipe: checkedList.length === plainOptions_pipe.length,
      }, () => {
        storedData['pipeline'].map((s, index) => {
          var temp = s.key.split("_")
          temp.pop()
          var key = temp.join("_")
          if (checkedList.indexOf(key) !== -1) {
            s.show = true
          } else {
            s.show = false
          }
        })
      })
    }
  }

  onCheckAllChange_pipe = e => {
    this.setState({
      checkedList_pipe: e.target.checked ? plainOptions_pipe : [],
      indeterminate_pipe: false,
      checkedAll_pipe: e.target.checked,
    }, () => {
      this.onChangePipe(e)
    })
  }

  //单击地质
  onChange_geology = async (checkedList) => {
    const { checkedList_geology, storedData } = this.state
    const { layers: { dizhi, } } = datacutover

    //加载地层控制
    if (checkedList[checkedList.length - 1] && checkedList[checkedList.length - 1].indexOf('geology-di') !== -1) {
      this.onDBChange(0.2)
      this.controlGround(false)
      this.setState({
        jzDisable: true,
        inputValue: 0.2,
        groundChecked: false
      })
    } else if (checkedList.indexOf('geology-di') === -1) {
      this.setState({
        jzDisable: false
      })
    }
    //end

    let flag = checkedList.length > checkedList_geology.length ? true : false  //true 添加，false 去除
    if (flag) { // 判断是否已加载到storeData
      storedData['geology'].map((s, index) => {
        if (s.key === checkedList[checkedList.length - 1]) {
          flag = false
        }
      })
    }
    if (flag) {
      //控制添加
      let key = checkedList[checkedList.length - 1]
      let temp_geo = [];
      switch (key) {
        case "geology-di":
          await this.addPipeAndGeo(dizhi[0]).then((data) => {
            temp_geo.push(data.model)
          })
          break;
        case "geology-pou":
          await this.addPipeAndGeo(dizhi[1]).then((data) => {
            temp_geo.push(data.model)
          })
          break;
        case "geology-zuan":
          await this.addPipeAndGeo(dizhi[2]).then((data) => {
            temp_geo.push(data.model)
          })
          break;
        case "geology-di-nanshan":
          await this.addPipeAndGeo(dizhi[3]).then((data) => {
            temp_geo.push(data.model)
          })
          break;
        case "geology-pou-nanshan":
          await this.addPipeAndGeo(dizhi[4]).then((data) => {
            temp_geo.push(data.model)
          })
          break;
        case "geology-zuan-nanshan":
          await this.addPipeAndGeo(dizhi[5]).then((data) => {
            temp_geo.push(data.model)
          })
          break;
        case "geology-di-longgang":
          await this.addPipeAndGeo(dizhi[6]).then((data) => {
            temp_geo.push(data.model)
          })
          break;
        case "geology-pou-longgang":
          await this.addPipeAndGeo(dizhi[7]).then((data) => {
            temp_geo.push(data.model)
          })
          break;
        case "geology-zuan-longgang":
          await this.addPipeAndGeo(dizhi[8]).then((data) => {
            temp_geo.push(data.model)
          })
          break;
        default:
          break;
      }

      this.setState({
        checkedList_geology: checkedList,
        indeterminate_geology: !!checkedList.length && checkedList.length < plainOptions_pipe.length,
        checkedAll_geology: checkedList.length === plainOptions_geology.length,
        storedData: {
          ...this.state.storedData,
          'geology': [...this.state.storedData.geology, ...temp_geo]
        }
      })
    } else {
      //只控制显示隐藏
      this.setState({
        checkedList_geology: checkedList,
        indeterminate_geology: !!checkedList.length && checkedList.length < plainOptions_pipe.length,
        checkedAll_geology: checkedList.length === plainOptions_geology.length,
      }, () => {
        storedData['geology'].map((s, index) => {
          if (checkedList.indexOf(s.key) !== -1) {
            s.show = true
          } else {
            s.show = false
          }
        })
      })
    }
  }

  onCheckAllChange_geology = e => {

    this.setState({
      checkedList_geology: e.target.checked ? plainOptions_geology : [],
      indeterminate_geology: false,
      checkedAll_geology: e.target.checked,
    }, () => {
      this.onChangeGeo(e)

      //地层控制
      if (this.state.checkedList_geology.indexOf('geology-di') === -1) {
        this.setState({
          jzDisable: false
        })
      } else {
        this.onDBChange(0.2)
        this.controlGround(false)
        this.setState({
          jzDisable: true,
          inputValue: 0.2,
          groundChecked: false
        })
      }
      //end
    })
  }


  render() {

    const { inputValue, iskaiwa, numdeep, bldgNo, popuptype, messagedata, value, selectAllPipeline_roller, selectAllGeology_roller,
      toolsshowhide, showRoller, indeterminate_pipe, checkedAll_pipe, checkedList_pipe,
      indeterminate_geology, checkedAll_geology, checkedList_geology, jzDisable, db_value, groundChecked } = this.state;
    return (
      <>
        {/* <div className={styles.leftSider}>
          <div className={`${styles.item} ${showRoller ? styles.active : ''}`} onClick={this.toggleScene}>卷帘模式</div>
          <div className={`${styles.item} ${showRoller ? '' : styles.active}`} onClick={this.toggleScene}>全屏模式</div>
        </div> */}
        {/* <div className={styles.switch}>
          <Row>
            <Col span={16}>卷帘模式</Col>
            <Col span={8} onClick={this.toggleScene} className={styles.clickBtn}>
              {
                showRoller ? <img src={require('@/assets/images/video/switch_on.png')} /> : <img src={require('@/assets/images/video/switch_off.png')} />
              }
            </Col>
          </Row>
        </div> */}

        <div className={styles.bottom} onClick={this.toolsshowhide}> <Icon type="menu" className={styles.icon} /> </div>

        <div className={`${styles.PipePdiv} ${showRoller ? '' : styles.showQuanjing} ${toolsshowhide === false ? styles.toolsShow : styles.toolsHide}`} id={"PipePdiv"}>
          <BorderPoint />
          <div className={styles.close} onClick={this.toolsshowhide}> <Icon type="menu" className={styles.icon} /> </div>
          {
            showRoller && (
              <div className={`${styles.PipePanel} `}>
                <Row className={styles.title}><Col span={4} offset={1}>卷帘模式</Col></Row>
                <Row className={styles.rowItem}>
                  <Col span={4} offset={1}>地表透明</Col>
                  <Col span={12}><Slider min={0} max={1} step={0.1} defaultValue={1.0} onChange={(value) => { this.onDBChange(value, "inputValue") }}></Slider></Col>
                </Row>
                <Row className={styles.checkItem}>
                  <Col span={6} offset={1}><Checkbox defaultChecked={true} onChange={this.onChangePipe}>管线</Checkbox></Col>
                  <Col span={6} ><Checkbox defaultChecked={true} onChange={this.onChangeGeo}>地质</Checkbox></Col>
                </Row>
              </div>
            )
          }
          {
            !showRoller && (
              <div className={`${styles.PipePanel}`}>
                <Row className={styles.title}><Col span={4} offset={1}>全屏模式</Col></Row>
                <Row className={styles.underData}>
                  <Col span={4} offset={1}>
                    {/* <Checkbox indeterminate={indeterminate_pipe} onChange={this.onCheckAllChange_pipe} checked={checkedAll_pipe} disabled>管线</Checkbox> */}
                    管线
                  </Col>
                  <Col span={19}>
                    <Checkbox.Group onChange={this.onChange_pipe} value={checkedList_pipe}>
                      <Row>
                        <Col span={5}><Checkbox value={'water_gongshui'}>供水</Checkbox></Col>
                        <Col span={5}><Checkbox value={'water_ranqi'} >燃气</Checkbox></Col>
                        <Col span={7}><Checkbox value={'water_yushui'} >排水-雨水</Checkbox></Col>
                        <Col span={7}><Checkbox value={'water_wushui'} >排水-污水</Checkbox></Col>
                      </Row>
                    </Checkbox.Group>
                  </Col>
                </Row>

                {/* 1215版本不上地层 还修改了图例面板大小 */}
                <Row className={styles.underData}>
                  <Col span={5} offset={1}>
                    <Checkbox indeterminate={indeterminate_geology} onChange={this.onCheckAllChange_geology} checked={checkedAll_geology} disabled>地质</Checkbox>
                  </Col>
                  <Col span={18}>
                    <Checkbox.Group onChange={this.onChange_geology} value={checkedList_geology}>
                      <Row>
                        <Col span={8}><Checkbox value={'geology-di'}>莲花山地层</Checkbox></Col>
                        <Col span={8}><Checkbox value={'geology-zuan'}>莲花山钻孔</Checkbox></Col>
                        <Col span={8}><Checkbox value={'geology-pou'}>莲花山剖面</Checkbox></Col>
                      </Row>
                      <Row>
                        <Col span={8}><Checkbox value={'geology-di-nanshan'}>南山地层</Checkbox></Col>
                        <Col span={8}><Checkbox value={'geology-zuan-nanshan'}>南山钻孔</Checkbox></Col>
                        <Col span={8}><Checkbox value={'geology-pou-nanshan'}>南山剖面</Checkbox></Col>
                      </Row>
                      <Row>
                        <Col span={8}><Checkbox value={'geology-di-longgang'}>龙岗地层</Checkbox></Col>
                        <Col span={8}><Checkbox value={'geology-zuan-longgang'}>龙岗钻孔</Checkbox></Col>
                        <Col span={8}><Checkbox value={'geology-pou-longgang'}>龙岗剖面</Checkbox></Col>
                      </Row>
                    </Checkbox.Group>
                  </Col>
                </Row>

                <Row className={styles.rowItem}>
                  <Col span={4} offset={1}>地表透明</Col>
                  <Col span={12}><Slider min={0} max={1} step={0.1} value={db_value} onChange={(value) => { this.onDBChange(value, "inputValue") }}></Slider></Col>
                </Row>
                <Row className={styles.rowItem}>
                  <Col span={6} offset={1}>
                    地上建筑
                  </Col>
                  <Col span={4}>
                    <Switch disabled={jzDisable} checked={groundChecked} checkedChildren="开" unCheckedChildren="关" onChange={this.controlGround} />
                  </Col>
                  {/* <Col span={24}>
                      <Row>
                        <Button onClick={this.addDem}>加载地行</Button>
                        <Button onClick={this.addDS}>加载地上</Button>
                      </Row>
                  </Col> */}
                </Row>

                <Row className={styles.rowItem}>
                  <Col span={6} offset={1}><label>开挖深度（米）</label></Col>
                  <Col span={4} ><InputNumber min={-30} max={0} step={1} defaultValue={-20} onChange={(value) => { this.ondeepChange(value) }}></InputNumber></Col>
                </Row>
                <Row className={styles.btns}>
                  <Col span={4} offset={6}><Button className={styles.pipbutton} onClick={this.jxClip}>矩形开挖</Button></Col>
                  {/* <Col span={4} offset={6}><Button className={styles.pipbutton} onClick={this.dbxClip}>多边形开挖</Button></Col> */}
                  <Col span={4} offset={2}><Button className={styles.pipbutton} onClick={this.clearwj}>清除</Button></Col>
                </Row>

                {/* <div className={styles.divloukong}>地下开挖
                  <Radio.Group onChange={this.onChangeg} value={value}>
                    <Radio value={'pipeline'} style={{ color: '#F5F2EB' }}>管线</Radio>
                    <Radio value={'geology'} style={{ color: '#F5F2EB' }} >地质</Radio>
                  </Radio.Group>
                </div> */}
              </div>
            )
          }
        </div>

        {/* 卷帘模式图例 */}

        {showRoller && (selectAllPipeline_roller || selectAllGeology_roller) &&
          <div className={styles.geologyList}>
            <ul>
              {selectAllPipeline_roller &&
                <>
                  {
                    PipeLineConfig.map((item, index) => {
                      return <li title={item.name} key={index}>
                        <img src={require('@/assets/images/' + item.icon + '.png')} alt="" />
                        {item.name}
                      </li>
                    })
                  }
                </>
              }
              {selectAllGeology_roller &&
                <>
                  {
                    GeologyListConfig.map((item, index) => {
                      return <li title={item.name} key={index}>
                        <img src={require('@/assets/images/' + item.icon + '.jpg')} alt="" />
                        {item.name}
                      </li>
                    })
                  }
                </>
              }
            </ul>
          </div>
        }

        {!showRoller && (checkedList_pipe.length > 0 || checkedList_geology.length > 0) &&
          <div className={styles.geologyList}>
            {/* <div className={styles.mark}></div> */}
            <ul>
              {checkedList_pipe.length > 0 &&
                <>
                  {
                    PipeLineConfig.map((item, index) => {
                      return <li title={item.name} key={index}>
                        <img src={require('@/assets/images/' + item.icon + '.png')} alt="" />
                        {item.name}
                      </li>
                    })
                  }
                </>
              }
              {checkedList_geology.length > 0 &&
                <>
                  {
                    GeologyListConfig.map((item, index) => {
                      return <li title={item.name} key={index}>
                        <img src={require('@/assets/images/' + item.icon + '.jpg')} alt="" />
                        {item.name}
                      </li>
                    })
                  }
                </>
              }
            </ul>
          </div>
        }
      </>
    );
  }
}

export default PipePanel;