/* eslint-disable default-case */
/* global Cesium */
/* global viewer */
/* global mars3d */
/* global haoutil */
import React, { Component } from 'react';
import { Tooltip, Icon, Popconfirm, message, Button, InputNumber, Input, Row, Col, Select, Slider, Modal } from 'antd';
import BorderPoint from '../../../border-point'
import styles from './style.less';
import { request } from '@/utils/request';
import { connect } from 'dva';
import { PUBLIC_PATH } from '@/utils/config'
const Ajax = require('axios');

const { Option } = Select;
let speedmul = 1, motherBoard;

// const layer_data = require('./testlayerdata.json')

@connect(({ RightFloatMenu, Timeline }) => ({
  RightFloatMenu, Timeline
}))
class TimelinePlay extends Component {
  state = {
    visible: false,
    // markName: '',
    // height: 50,
    // flyspeed: 200,
    // EntityList: [],
    viewType: 'big',
    index: 0,
    selectedindex: -1,

    showPlay: false, //播放
    showTimelinePanel: false, //时序面板
    tickId: null, //null时是新增，有值是更新
    tickName: '', //时序名称
    tickList: [],
    marksH: [],
    bigPlayPanel: true,//默认不展示大面板
    tickIndex: 0,
    tickValue: 0, //刻度值
    selectLayerId: -9999, //默认一个不存在的
    selectNodeIndex: -9999,
    cesiumData: {},//缓存加载的图层
    playState: false, //播放状态
    palyHandler: null, //播放的循环柄
    tickMSecond: 5000, //单位毫秒
    preTileset:null
  };

  async componentDidMount() {
    this.con = React.createRef();
    let data1 = await Ajax.get(`${PUBLIC_PATH}config/motherBoard.json`);
    motherBoard = data1.data
    this.fly = true;
    this.getList()
    this.getMyResourceList()
  }
  componentWillUnmount() {
    this.setModelVisiable(true);
    // clearInterval(this.INnewList)
    // clearInterval(this.newdraw)
    // mars3d.widget.disable(PUBLIC_PATH + "widgets/lineroam/widget.js");
    // this.data = [];
    // viewer.scene.preRender.removeEventListener(this.Listener);


    this.setState = () => false;
  }
  //路线
  getList = async () => {
    // console.log(1111111)
    this.props.dispatch({
      type: 'Timeline/listTimeline',
      payload: ''
    }).then(response => {
      const { success, data, code } = response
      // if(success){
      //   this.setState({
      //     ...this.state,
      //     tickName:data
      //   })
      // }
    })
  }

  getMyResourceList = async () => {
    this.props.dispatch({
      type: 'Timeline/myResourceList'
    })
  }

  //新增时序
  newTimeline = () => {
    this.setState({
      tickId: null,
      tickName: '',
      tickList: [],
      showTimelinePanel: true
    })
  }

  //删除时序
  confirmDel = async (id) => {
    // console.log(id)
    this.props.dispatch({
      type: 'Timeline/deleteTimeline',
      payload: {
        id,
      }
    }).then(response => {
      const { success, data, code, msg } = response;
      if (success) {
        message.success('删除成功！')
        this.getList()
        this.closePanel()
      } else {
        message.error('删除失败, ' + msg)
      }
    })
  }

  onChange = (value, type) => {
    // console.log(value, type);
    this.stage.uniforms[type] = value;
  };
  //直接播放
  flyto = (flyobject, index) => {
    // console.log(flyobject,index)

  }
  //监听
  minitorListener = () => {
    viewer.scene.preRender.removeEventListener(this.Listener);
    viewer.scene.preRender.addEventListener(this.Listener);
  }
  Listener = () => {
    var $that = this;
    const { reality: { sz_osgb } } = motherBoard;
    if (!this.isshowqingxie()) {
      var List = ["dapeng", "baoan", "futian", "guangming", "lingdingdao", "longgang", "longhua", "luohu", "nanshan", "pingshan", "yantian"];
      List.forEach((element) => {
        let url = sz_osgb.children[element];
        let primitives = $that.getModelbyurl(url);
        if (!primitives.show) {
          primitives.show = true;
        }
      })
    }
  }

  //判断倾斜摄影是否显示
  isshowqingxie = () => {
    var hidenum = 0, shownum = 0;
    const { reality: { sz_osgb } } = motherBoard;
    var List = ["dapeng", "baoan", "futian", "guangming", "lingdingdao", "longgang", "longhua", "luohu", "nanshan", "pingshan", "yantian"];
    List.forEach((element) => {
      let url = sz_osgb.children[element];
      let primitives = this.getModelbyurl(url);
      if (primitives) {
        if (!primitives.show) {
          hidenum++;
        } else {
          shownum++;
        }
      }

    });
    if (hidenum > 0) {
      return false;
    }
    if (shownum == List.length) {
      return true
    } else {
      return false;
    }
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

  //键盘按钮Q和E 视角上升和下降 监听事件
  keyboardupordown = () => {
    const { flyLine, flyspeed } = this.state;
    let $this = this;
    var unitkey = [];
    //键盘监听  

    document.addEventListener("keydown", function (e) {
      switch (e.keyCode) {
        case 18:
          var num = unitkey.indexOf(e.keyCode);
          if (num > -1) {
            unitkey.splice(num, 1);
          }
          unitkey.push(e.keyCode);
          break;
        case 187:
          //移除数组中多余的"+"加号键的标识
          var num = unitkey.indexOf(e.keyCode);
          if (num > -1) {
            unitkey.splice(num, 1);
          }
          //移除数组中已存在的"-"减号键的标识
          var numt = unitkey.indexOf(189);
          if (numt > -1) {
            unitkey.splice(numt, 1);
          }
          unitkey.push(e.keyCode);
          $this.quickenORslow(unitkey);
          break;
        case 189:
          //移除数组中多余的"-"减号键的标识
          var num = unitkey.indexOf(e.keyCode);
          if (num > -1) {
            unitkey.splice(num, 1);
          }
          //移除数组中已存在的"+"加号键的标识
          var numt = unitkey.indexOf(187);
          if (numt > -1) {
            unitkey.splice(numt, 1);
          }
          unitkey.push(e.keyCode);
          $this.quickenORslow(unitkey);
          break;

      }
    })
    document.addEventListener("keyup", function (e) {
      switch (e.keyCode) {
        case 18:
          var num = unitkey.indexOf(e.keyCode);
          unitkey.splice(num, 1);
          break;
        case 187:
          var num = unitkey.indexOf(e.keyCode);
          unitkey.splice(num, 1);
          break;
        case 189:
          var num = unitkey.indexOf(e.keyCode);
          unitkey.splice(num, 1);
          break;
      }
    })
  }
  //执行加速和减速 
  quickenORslow = (unitkey) => {

  }

  //时间获取
  formatDate = (time) => {
    var date = undefined;
    if (time == undefined) {
      date = new Date();
    } else {
      date = new Date(time);
    }

    var year = date.getFullYear(),
      month = date.getMonth() + 1,//月份是从0开始的
      day = date.getDate(),
      hour = date.getHours(),
      min = date.getMinutes(),
      sec = date.getSeconds();
    var newTime = year + '-' +
      month + '-' +
      day + ' ' +
      hour + ':' +
      min + ':' +
      sec;
    return newTime;
  }

  scrollLeft = () => {
    this.con.current.scrollLeft -= 150;
  }

  scrollRight = () => {
    this.con.current.scrollLeft += 150;
  }
  //关闭
  close = () => {
    const { palyHandler } = this.state
    window.clearInterval(palyHandler);
    this.clearLayers()

    viewer.scene.preRender.removeEventListener(this.Listener);

    this.props.dispatch({
      type: 'Map/setToolsActiveKey',
      payload: ""
    })

    this.props.dispatch({
      type: 'RightFloatMenu/toggleMenu',
      payload: 'isFlyActive'
    })


    this.componentWillUnmount();
  }

  closePanel = () => {
    const { palyHandler } = this.state
    window.clearInterval(palyHandler);
    this.clearLayers()
    this.setModelVisiable(true);
    //关闭面板
    this.setState({
      ...this.state,
      playState: false,
      showTimelinePanel: false
    })
  }

  //最小或最大
  changeSize = size => {
    this.setState({
      ...this.state,
      viewType: size
    })
  }
  changeIndex(type) {
    let index = this.state.index
    switch (type) {
      case 'plus':
        if (index < this.state.FlyrouteList.length - 1) {
          index++
          this.setState({
            ...this.state,
            index: index
          })
        }
        break;
      case 'minus':
        if (index > 0) {
          index--
          this.setState({
            ...this.state,
            index: index
          })
        }
        break;
      default:
        break;
    }
  }
  addLayer = async (v) => {
    // const {  } = this.state;
    let data = null;
    let realUrl;
    const that = this
    if (!v) return;
    v.dataFormatDesc = v && v.dataFormatDesc && v.dataFormatDesc.toLowerCase();
    
    return new Promise((resolved) => {
      var rectangleNums = [-180,-90,180,90];
      switch (v.dataFormatDesc) {

        case '3dtiles':
          // realUrl = this.getCesiumUrl(v.url, true);

          let cesium3DTileset;
          let initLoaded = false;
          if (!Cesium.defined(cesium3DTileset)) {
            cesium3DTileset = new Cesium.Cesium3DTileset({
              url: v.url,
              modelMatrix: v.modelMatrix || Cesium.Matrix4.IDENTITY,
            });

            cesium3DTileset.readyPromise.then(function (tileset) {
              if (v.offsetHeight) {//调整高度
                let origin = tileset.boundingSphere.center;
                let cartographic = Cesium.Cartographic.fromCartesian(origin);
                let surface = Cesium.Cartesian3.fromRadians(cartographic.longitude, cartographic.latitude, 0.0);
                let offset = Cesium.Cartesian3.fromRadians(cartographic.longitude, cartographic.latitude, v.offsetHeight);
                let translation = Cesium.Cartesian3.subtract(offset, surface, new Cesium.Cartesian3());
                tileset.modelMatrix = Cesium.Matrix4.fromTranslation(translation);
              }
              //飞行结束后在执行下一步
              // viewer.flyTo(cesium3DTileset)
              // let boundingSphere=new Cesium.BoundingSphere
              
              if(that.state.preTileset){
                that.state.preTileset.style =   new Cesium.Cesium3DTileStyle({
                  color: "color('rgba(255, 255, 255,1)')"
              });
              }
              tileset.style = new Cesium.Cesium3DTileStyle({
                  color: "color('rgba(0, 187, 255,1)')"
              });
              
              that.setState({
                preTileset:tileset
              })
              viewer.scene.primitives.add(cesium3DTileset);
              setTimeout(() => {
                const {preTileset} = that.state;
                if(preTileset){
                  preTileset.style =   new Cesium.Cesium3DTileStyle({
                      color: "color('rgba(255, 255, 255,1)')"
                  });
                }
              }, 30*1000);
              // console.log("initialTilesLoaded-1",cesium3DTileset.initialTilesLoaded)
              console.log(cesium3DTileset.boundingSphere,"-----------cesium3DTileset.boundingSphere")
              const boundingSphere =  new Cesium.BoundingSphere(new Cesium.Cartesian3(-2896219.0561205316,4651638.013217403,3253820.366093433), 1401.1138720572033)
              // viewer.camera.flyToBoundingSphere(cesium3DTileset.boundingSphere, {
              //   complete: () => {
              //     // console.log("initialTilesLoaded-2",cesium3DTileset.initialTilesLoaded)
              //     if (initLoaded) {
              //       // console.log("init","初始加载已完成",cesium3DTileset.url);
              //       resolved(cesium3DTileset);
              //     } else {
              //       // 若长时间未完成，则执行下一步
              //       setTimeout(() => {
              //         resolved(cesium3DTileset);
              //       }, 1000 * 15)
              //       // console.log("init","初始加载未完成",cesium3DTileset.url);
              //     }

              //   }
              // })
              
              cesium3DTileset.initialTilesLoaded.addEventListener(function () {
                initLoaded = true;
                if (!viewer._zoomIsFlight) {
                  // console.log("init","无飞行",cesium3DTileset.url);
                  resolved(cesium3DTileset);
                } else {
                  setTimeout(() => {
                    resolved(cesium3DTileset);
                    if(that.state.preTileset){
                      that.state.preTileset.style =   new Cesium.Cesium3DTileStyle({
                        color: "color('rgba(255, 255, 255,1)')"
                    });
                    }
                  }, 1000 * 15)
                  // console.log("init","正在飞行中。。。。",cesium3DTileset.url);
                }

              });

            });
          }
          // viewer.flyTo(cesium3DTileset)


          data = cesium3DTileset;
          break;

        case 'arcgis-mapserver-ext':
          // rectangleNums=[];
          if (v.rectangle) rectangleNums = v.rectangle;//.split(',').map(i => parseFloat(i));
          var Img = new Cesium.ArcGisMapServerImageryProviderExt({
            url: v.url,
          });
          var imgLayer = viewer.imageryLayers.addImageryProvider(Img);
          viewer.camera.flyTo({
            destination: Cesium.Rectangle.fromDegrees(...rectangleNums)
            , complete: () => {
              setTimeout(()=>{
                resolved(imgLayer);
              },1000) 
            },
          })
          break;

        case 'wms':
          var url = v.gisApi.apiUrl || v.gisApi.exposedRelUrl
          realUrl = this.getCesiumUrl(url, true);
          var dataDetail = JSON.parse(v.dataDetail);
          var layerName = dataDetail.find((i) => i.paramName === "layer") || {};

          let provider = new Cesium.WebMapServiceImageryProvider({
            url: realUrl,
            layers: layerName.value,
            // crs: 'EPSG:4326',
            parameters: {
              transparent: true,
              format: 'image/png',
            },
          });
          let imageryLayer = viewer.imageryLayers.addImageryProvider(provider);
          // viewer.camera.flyTo({
          //   destination: {
          //     x: -2455009.579833841,
          //     y: 5462458.593463376,
          //     z: 2392774.6950951326,
          //   },
          //   orientation: {
          //     direction: {
          //       x: 0.37770042545634724,
          //       y: -0.8403930280909273,
          //       z: 0.3886926124153328,
          //     },
          //     up: {
          //       x: -0.1593385555179573,
          //       y: 0.3545323281052194,
          //       z: 0.9213674907732223,
          //     },
          //   },
          // });
          data = imageryLayer;
          break;
        case 'wmts':
          var imageslayers = window.viewer.imageryLayers;
          var dataDetail = JSON.parse(v.dataDetail);
          var gridsetName = dataDetail.find((i) => i.paramName === 'tileMatrixSetID') || {};
          var mapName = dataDetail.find((i) => i.paramName === "layer") || {};
          var url = v.gisApi.apiUrl || v.gisApi.exposedRelUrl

          var source, imageLayer;
          if (gridsetName.value.indexOf("4490") !== -1) {//如果是4490坐标系
            url = `${url}rest/${mapName.value}/${gridsetName.value}/${gridsetName.value}:{sz}/{y}/{x}?format=image/png`;
            source = new Cesium.Resource({
              url: url,
              // headers:
              // {
              //   'szvsud-license-key': window.localStorage.getItem('userLicenseKey'),
              // },
            });
            imageLayer = new Cesium.UrlTemplateImageryProvider({
              url: source,
              tilingScheme: new Cesium.GeographicTilingScheme(),
              minimumLevel: 0,
              customTags: {
                sz: function (imageryProvider, x, y, level) {
                  return level - 9
                }
              }
            })

          } else {
            var r = new Cesium.Resource({
              url: `${url}rest/${mapName.value}/${gridsetName.value}/${gridsetName.value}:{TileMatrix}/{TileRow}/{TileCol}?format=image/png`,
              // headers:
              // {
              //   'szvsud-license-key': window.localStorage.getItem('userLicenseKey'),
              // },
            });

            imageLayer = new Cesium.WebMapTileServiceImageryProvider({
              url: r,
            });
          }

          data = window.data = imageslayers.addImageryProvider(imageLayer);

          break

        case 'mapserver':
          realUrl = this.getCesiumUrl(v.url, true);
          data = this.loadMapServer(realUrl);
          break;

        case 'arcgis-imageserver':
          // rectangleNums = [];
          if (v.rectangle) rectangleNums = v.rectangle;//.split(',').map(i => parseFloat(i));
          var Img = new Cesium.ArcGisMapServerImageryProvider({
            url: v.url,
            // rectangle:Cesium.Rectangle.fromDegrees(...rectangleNums)
          });
          var imgLayer = viewer.imageryLayers.addImageryProvider(Img);
          viewer.camera.flyTo({
            destination: Cesium.Rectangle.fromDegrees(...rectangleNums)
            , complete: () => {
              setTimeout(()=>{
                resolved(imgLayer);
              },1000) 
            },
          })

          // var dataDetail = JSON.parse(v.dataDetail);
          // var rectangle = dataDetail.find((i) => i.paramName === "rectangle") || {};
          // var url = v.gisApi.apiUrl||v.gisApi.exposedRelUrl
          // realUrl = this.getArcgisUrl(url+"exportImage", true);
          // data = this.loadArcgisServer(realUrl, rectangle.value);
          break;
        case 'arcgis-mapserver':
          if (v.rectangle) rectangleNums = v.rectangle;
          var Img = new Cesium.ArcGisMapServerImageryProvider({
            url: v.url,
          });
          var imgLayer = viewer.imageryLayers.addImageryProvider(Img);
          viewer.camera.flyTo({
            destination: Cesium.Rectangle.fromDegrees(...rectangleNums),
            complete: () => {
              setTimeout(()=>{
                resolved(imgLayer);
              },1000) 
            },
          })
          // var url = v.gisApi.apiUrl||v.gisApi.exposedRelUrl
          // realUrl = this.getArcgisUrl(url, true);
          // var dataDetail = JSON.parse(v.dataDetail);
          // var rectangle = dataDetail.find((i) => i.paramName === "rectangle") || {};
          // data = this.loadArcgisServer(realUrl, rectangle.value);
          break;
        case 'arcgis-featureserver':
          var url = v.gisApi.apiUrl || v.gisApi.exposedRelUrl
          realUrl = this.getArcgisUrl(url, true);
          var dataDetail = JSON.parse(v.dataDetail);
          var rectangle = dataDetail.find((i) => i.paramName === "rectangle") || {};
          var layer = dataDetail.find(i => i.paramName === 'layer') || {};
          data = this.loadArcgisServer(realUrl, rectangle.value, layer.value);
          break;
      }
    })

    // switch (v.dataFormatDesc) {
    //   case 'terrain':
    //     let terrain = new Cesium.CesiumTerrainProvider({
    //       url: v.url,
    //     });
    //     viewer.terrainProvider = terrain;
    //     data = terrain;
    //     break;
    //   case '3dtiles':
    //     // realUrl = this.getCesiumUrl(v.url, true);

    //     let cesium3DTileset;
    //       if (!Cesium.defined(cesium3DTileset)) {
    //         cesium3DTileset = new Cesium.Cesium3DTileset({
    //           url: v.url,
    //           modelMatrix: v.modelMatrix || Cesium.Matrix4.IDENTITY,
    //         });
    //         viewer.scene.primitives.add(cesium3DTileset);
    //         cesium3DTileset.readyPromise.then(function(tileset) {
    //           if (v.offsetHeight) {//调整高度
    //             let origin = tileset.boundingSphere.center;
    //             let cartographic = Cesium.Cartographic.fromCartesian(origin);
    //             let surface = Cesium.Cartesian3.fromRadians(cartographic.longitude, cartographic.latitude, 0.0);
    //             let offset = Cesium.Cartesian3.fromRadians(cartographic.longitude, cartographic.latitude, v.offsetHeight);
    //             let translation = Cesium.Cartesian3.subtract(offset, surface, new Cesium.Cartesian3());
    //             tileset.modelMatrix = Cesium.Matrix4.fromTranslation(translation);
    //           }
    //           viewer.flyTo(cesium3DTileset)
    //         });
    //       }
    //     // viewer.flyTo(cesium3DTileset)
    //     data = cesium3DTileset;
    //     break;
    //   case 'wms':
    //     var url = v.gisApi.apiUrl||v.gisApi.exposedRelUrl
    //     realUrl = this.getCesiumUrl(url, true);
    //     var dataDetail = JSON.parse(v.dataDetail);
    //     var layerName = dataDetail.find((i) => i.paramName === "layer") || {};

    //     let provider = new Cesium.WebMapServiceImageryProvider({
    //       url: realUrl,
    //       layers: layerName.value,
    //       // crs: 'EPSG:4326',
    //       parameters: {
    //         transparent: true,
    //         format: 'image/png',
    //       },
    //     });
    //     let imageryLayer = viewer.imageryLayers.addImageryProvider(provider);
    //     // viewer.camera.flyTo({
    //     //   destination: {
    //     //     x: -2455009.579833841,
    //     //     y: 5462458.593463376,
    //     //     z: 2392774.6950951326,
    //     //   },
    //     //   orientation: {
    //     //     direction: {
    //     //       x: 0.37770042545634724,
    //     //       y: -0.8403930280909273,
    //     //       z: 0.3886926124153328,
    //     //     },
    //     //     up: {
    //     //       x: -0.1593385555179573,
    //     //       y: 0.3545323281052194,
    //     //       z: 0.9213674907732223,
    //     //     },
    //     //   },
    //     // });
    //     data = imageryLayer;
    //     break;
    //   case 'wmts':
    //     var imageslayers = window.viewer.imageryLayers;
    //     var dataDetail = JSON.parse(v.dataDetail);
    //     var gridsetName = dataDetail.find((i) => i.paramName === 'tileMatrixSetID') || {};
    //     var mapName = dataDetail.find((i) => i.paramName === "layer") || {};
    //     var url = v.gisApi.apiUrl||v.gisApi.exposedRelUrl

    //     var source,imageLayer;
    //     if(gridsetName.value.indexOf("4490")!==-1){//如果是4490坐标系
    //       url=`${url}rest/${mapName.value}/${gridsetName.value}/${gridsetName.value}:{sz}/{y}/{x}?format=image/png`;
    //       source = new Cesium.Resource({
    //         url: url,
    //         headers:
    //           {
    //             'szvsud-license-key':  window.localStorage.getItem('userLicenseKey'),
    //           },
    //       });
    //       imageLayer = new Cesium.UrlTemplateImageryProvider({
    //         url: source,
    //         tilingScheme : new Cesium.GeographicTilingScheme(),
    //         minimumLevel:0,
    //         customTags:{
    //             sz:function(imageryProvider,x,y,level){
    //                 return level-9
    //             }
    //         }
    //       })

    //     }else{
    //       var r = new Cesium.Resource({
    //         url: `${url}rest/${mapName.value}/${gridsetName.value}/${gridsetName.value}:{TileMatrix}/{TileRow}/{TileCol}?format=image/png`,
    //         headers:
    //           {
    //             'szvsud-license-key':  window.localStorage.getItem('userLicenseKey'),
    //           },
    //       });

    //       imageLayer = new Cesium.WebMapTileServiceImageryProvider({
    //         url: r,
    //       });
    //     }

    //     data  = window.data= imageslayers.addImageryProvider(imageLayer);

    //     break
    //   case 'geojson':

    //     realUrl = this.getCesiumUrl(v.url, true);
    //     var dataSource = await viewer.dataSources.add(Cesium.GeoJsonDataSource.load(realUrl, {
    //       clampToGround: true,
    //     }));

    //     data = dataSource;
    //     break;
    //   case 'mapserver':
    //     realUrl = this.getCesiumUrl(v.url, true);
    //     data = this.loadMapServer(realUrl);
    //     break;
    //   case 'wfs':
    //     var requestParams =v.gisApi.requestParams||[];
    //     var dataDetail = JSON.parse(v.dataDetail);
    //     var layerName = dataDetail.find((i) => i.label === "typeName") || {};
    //     var url = v.gisApi.apiUrl||v.gisApi.exposedRelUrl
    //     realUrl = this.getCesiumUrl(url+`?service=WFS&request=GetFeature&typeName=${layerName.value}&outputFormat=application/json`, true);
    //     data =  await viewer.dataSources.add(Cesium.GeoJsonDataSource.load(realUrl));
    //     break;
    //   case 'arcgis-imageserver':
    //     var dataDetail = JSON.parse(v.dataDetail);
    //     var rectangle = dataDetail.find((i) => i.paramName === "rectangle") || {};
    //     var url = v.gisApi.apiUrl||v.gisApi.exposedRelUrl
    //     realUrl = this.getArcgisUrl(url+"exportImage", true);
    //     data = this.loadArcgisServer(realUrl, rectangle.value);
    //     break;
    //   case 'arcgis-mapserver':
    //     var url = v.gisApi.apiUrl||v.gisApi.exposedRelUrl
    //     realUrl = this.getArcgisUrl(url, true);
    //     var dataDetail = JSON.parse(v.dataDetail);
    //     var rectangle = dataDetail.find((i) => i.paramName === "rectangle") || {};
    //     data = this.loadArcgisServer(realUrl, rectangle.value);
    //     break;
    //   case 'arcgis-featureserver':
    //     var url = v.gisApi.apiUrl||v.gisApi.exposedRelUrl
    //     realUrl = this.getArcgisUrl(url, true);
    //     var dataDetail = JSON.parse(v.dataDetail);
    //     var rectangle = dataDetail.find((i) => i.paramName === "rectangle") || {};
    //     var layer  = dataDetail.find(i => i.paramName === 'layer') || {};
    //     data = this.loadArcgisServer(realUrl, rectangle.value, layer.value);
    //     break;
    // }
    // return data;
  };

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

  delLayerByUrl = (url, type) => {
    switch (type) {
      case "3dtiles":
        let primitives = viewer.scene.primitives._primitives;
        primitives.forEach((data) => {
          let newurl = data.url;
          if (newurl === url) {
            viewer.scene.primitives.remove(data);
            return;
          }
        });
        break;
      case "arcgis-imageserver":
      case 'arcgis-mapserver':
      case 'arcgis-mapserver-ext':  
      case 'arcgis-imageserver-ext':
        let layers = viewer.imageryLayers._layers;
        console.log("delLayerByUrl",url);
        layers.forEach((data) => {
          let newurl = data.imageryProvider.url;
          
          if (newurl === url || newurl===url+"/") {
            
            viewer.imageryLayers.remove(data);
            return;
          }
        });
         break;
      default:
        
        break;
    }

  }

  //删除cesium图层数据
  delLayer = (v) => {
    const { cesiumData } = this.state;
    if (!v) return;
    v.dataFormatDesc = v && v.dataFormatDesc && v.dataFormatDesc.toLowerCase();
    // 根据url查找primitives
    switch (v.dataFormatDesc) {
      case 'terrain':
        viewer.terrainProvider = new Cesium.EllipsoidTerrainProvider();
        break;
      case '3dtiles':
        if (v.specialmark == undefined) {
          if (v.id == '10284') {
            var data = viewer.dataSources.getByName('lhzkpoi')[0];
            data.entities.removeAll();
          }
          cesiumData[v.id] ? viewer.scene.primitives.remove(cesiumData[v.id]) : this.delLayerByUrl(v.url,v.dataFormatDesc);
        } else {

        }
        break;
      case 'geojson':
        viewer.dataSources.remove(cesiumData[v.id], true);
        break;
      case 'wfs':
        viewer.dataSources.remove(cesiumData[v.id], true)
        break;
      case 'wms':
      case 'wmts':
      case 'arcgis-imageserver':
      case 'arcgis-mapserver':
      case 'arcgis-imageserver-ext':
      case 'arcgis-mapserver-ext':  
      case 'arcgis-featureserver':
        cesiumData[v.id] ? viewer.imageryLayers.remove(cesiumData[v.id]) : this.delLayerByUrl(v.url,v.dataFormatDesc);
        break;
      default:
        break;
    }
    delete cesiumData[v.id];
  };

  loadArcgisServer = (url, rectangle, layer) => {
    let rectangleNums = [];
    if (rectangle) rectangleNums = rectangle.split(',').map(i => parseFloat(i));
    let imageLayer = viewer.imageryLayers.addImageryProvider(
      new Cesium.ArcGisMapServerImageryProvider({
        url: url,
        layers: layer,
      })
    );
    // if (rectangleNums.length) {
    //   viewer.camera.flyTo({
    //     offset: {
    //       heading: Cesium.Math.toRadians(0),
    //       pitch: Cesium.Math.toRadians(-90.0), //从上往下看为-90
    //       roll: 0,
    //     },
    //     destination: Cesium.Rectangle.fromDegrees(...rectangleNums),
    //     duration: 1.0,
    //   });
    // }
    return imageLayer;
  };
  //在arcgis图层里面添加license-key
  getArcgisUrl = (url) => {
    return url;
    // return new Cesium.Resource({
    //   url: url,
    //   queryParameters: {
    //     'szvsud-license-key': window.localStorage.getItem('userLicenseKey'),
    //   }
    // });
  };
  //在cesium图层里面添加license-key
  getCesiumUrl = (url, needKey) => {
    return url;
    // return new Cesium.Resource({
    //   url: url,
    //   headers: needKey
    //     ? {
    //       'szvsud-license-key': window.localStorage.getItem('userLicenseKey'),
    //     }
    //     : {},
    //   retryCallback: (resource, error) => {
    //     if (error) {
    //       if (error.statusCode === 401) message.error('当前数据预览接口您无访问权限');
    //       else if (error.statusCode === 404)
    //         message.error('当前数据预览接口已暂停服务或被删除');
    //       // else this.errorHandler('当前数据预览接口访问错误');
    //     }
    //     return false;
    //   },
    //   retryAttempts: 1,
    // });
  };

  //编辑时间线
  editTimeline = (item, index) => {
    // console.log(item,index)
    this.props.dispatch({
      type: 'Timeline/infoTimeline',
      payload: {
        id: item.id
      }
    }).then(response => {
      const { success, data, code, msg } = response;
      if (success) {
        // console.log(response)
        let tickList = data.node
        // tickList.forEach(ele=>{
        //   ele.layers = JSON.parse(ele.layers)
        // })
        this.setState({
          tickId: data.id,
          tickName: data.name,
          tickList,
          showTimelinePanel: true,
          showPlay: false
        })
      }
    })
  }

  //设置间隔时间
  setTick = (value) => {
    this.setState({
      tickMSecond: value * 1000
    })
  }

  tickIndex = val => {
    const { tickList, tickIndex } = this.state
    const { myResourceList } = this.props.Timeline
    let index = parseInt((tickList.length - 1) * val / 100)
    console.log('click....',index)
    this.setState({
      selectLayerId: -9999,
      selectNodeIndex: -9999,
      playState: false,
      tickValue: val, //刻度值
      tickIndex: val === 0 ? 0 : index
    }, () => {

      // 加载对应数据
      // let copy = tickList
      let playList = tickList[index];
      let playLayers = []
      // playList.forEach(el=>{
      playLayers.push(...playList.layers)

      // })
      // let oldLayers = myResourceList.filter(v=>v.id !== playLayers[index].id);
      // oldLayers.forEach((item)=>{
      //   this.delLayer(item);
      // })
      this.clearLayers();
      let newLayer = myResourceList.filter(v => v.id === playLayers[0].id)[0]
      this.addLayer(newLayer)

      // console.log(index,val);
      // this.clearLayers()
      // window.clearInterval(palyHandler)
    })
  }

  //新增时点
  newTick = () => {
    const { tickList } = this.state
    let copy = tickList
    if (copy[copy.length - 1] && copy[copy.length - 1].name === '') {
      message.warn('不允许存在空节点或空图层！')
    } else {
      this.setState({
        tickList: [...this.state.tickList, { name: '', layers: [] }]
      })
    }
  }

  onInputFocus = () => {
    //关闭键盘事件
    this.doKeyEvent(false)
  }

  //记录名称
  changeName = e => {
    this.setState({
      tickName: e.target.value
    })
  }

  onInputBlur = () => {
    // setTimeout(() => {
    //打开键盘事件
    this.doKeyEvent(true)
    // }, 2000)
  }

  //键盘事件开关
  doKeyEvent = (isActive) => {
    var isHomekeystop;
    if (!isActive) {
      isHomekeystop = true;
      viewer.mars.keyboardRoam.unbind();
    } else {
      isHomekeystop = false;
      viewer.mars.keyboardRoam.bind()
    }
    //控制键盘漫游是否开启
    this.props.dispatch({
      type: 'RightFloatMenu/setisHomekeystop',
      payload: isHomekeystop
    })
  }

  //时点name变更
  itemTickChange = (e, index) => {
    const { tickList } = this.state
    let copy = tickList
    copy[index].name = e.target.value

    this.setState({
      tickList: copy
    })

  }
  //新增图层节点
  itemTickAdd = (index) => {
    const { tickList } = this.state
    let copy = tickList
    let layerName = copy[index].name
    let layers = copy[index].layers
    let last = layers[layers.length - 1]
    if (JSON.stringify(last) === '{}') {
      message.warn('不允许存在空节点或空图层！')
    } else if (layerName.trim() === '') {
      message.warn('请输入图层节点名称')
    } else {
      copy[index].layers.push({ id: -9999, name: '' })

      this.setState({
        tickList: copy
      })
    }
  }

  //删除时序节点
  itemTickDelete = index => {
    const { tickList } = this.state
    let copy = tickList
    copy.splice(index, 1)

    this.setState({
      tickList: copy
    })
  }

  //往时序节点中添加图层
  itemLayerChange = (value, index, idx) => {
    // console.log(value)
    const { tickList } = this.state
    let copy = tickList
    copy[index].layers[idx] = { id: value.key, name: value.label }

    this.setState({
      tickList: copy
    })
  }

  //删除时序节点中的图层
  itemLayerDel = (index, idx) => {
    const { tickList } = this.state
    let copy = tickList
    // console.log(tickList, index, idx)
    copy[index].layers.splice(idx, 1)

    this.setState({
      tickList: copy
    })
  }

  //保存
  saveOrUpdateTick = () => {
    const { tickId, tickName, tickList } = this.state
    // console.log("save tick...", tickName,tickList)
    if (tickName.trim() === '') {
      message.warn('时序名称不能为空！')
      return;
    }
    if (tickList.length === 0) {
      message.warn('请输入节点！')
      return;
    }
    for (let i = 0; i < tickList.length; i++) {
      if (tickList[i].name.trim() === '') {
        message.warn('节点名称不允许为空！')
        return;
      } else if (tickList[i].layers.length === 0) {
        message.warn('节点图层不允许为空！')
        return;
      } else {
        let layers = tickList[i].layers
        for (let j = 0; j < layers.length; j++) {
          if (layers[j].id === -9999 && layers[j].name === '') {
            message.warn('节点图层不允许为空！')
            return;
          }
        }
      }
    }

    tickList.forEach(t => {
      t.layers = JSON.stringify(t.layers)
    })
    // console.log(tickList)
    if (!tickId) { //新增
      this.props.dispatch({
        type: 'Timeline/saveTimeline',
        payload: {
          name: tickName,
          node: tickList
        }
      }).then(response => {
        const { success, code, data } = response
        if (success) {
          message.success('保存成功！')
          this.getList()
          this.closePanel()
        } else {
          message.error('保存失败！')
        }
      })
    } else { //更新
      this.props.dispatch({
        type: 'Timeline/updateTimeline',
        payload: {
          id: tickId,
          name: tickName,
          node: tickList
        }
      }).then(response => {
        const { success, code, data } = response
        if (success) {
          message.success('更新成功！')
          this.getList()
          this.closePanel()
        } else {
          message.error('更新失败！')
        }
      })
    }
  }

  playTimeLineDriect = (item, index) => {
    this.props.dispatch({
      type: 'Timeline/infoTimeline',
      payload: {
        id: item.id
      }
    }).then(response => {
      const { success, data, code, msg } = response;
      if (success) {
        // console.log(response)
        let tickList = data.node
        tickList.forEach(ele => {
          ele.layers = JSON.parse(ele.layers)
        })
        this.setState({
          tickId: data.id,
          tickName: data.name,
          tickList,
          showTimelinePanel: true,
        }, () => {
          this.playTimeLine()
        })
      }
    })
  }

  //播放
  playTimeLine = () => {
    const { tickList, tickName } = this.state
    if (tickName.trim() === '') {
      message.warn('时序名称不能为空！')
      return;
    }
    if (tickList.length === 0) {
      message.warn('请输入节点！')
      return;
    }
    for (let i = 0; i < tickList.length; i++) {
      if (tickList[i].name.trim() === '') {
        message.warn('节点名称不允许为空！')
        return;
      } else if (tickList[i].layers.length === 0) {
        message.warn('节点图层不允许为空！')
        return;
      } else {
        let layers = tickList[i].layers
        for (let j = 0; j < layers.length; j++) {
          if (layers[j].id === -9999 && layers[j].name === '') {
            message.warn('节点图层不允许为空！')
            return;
          }
        }
      }
    }

    // console.log("play tick...", tickList)
    let obj = {}
    tickList.forEach((item, index) => {
      let key = tickList.length === 1 ? 0 : 100 / (tickList.length - 1) * index
      obj[key] = {
        style: {
          color: '#fff',
          size: 8,
        },
        label: <strong>{item.name.replace("年","")}</strong>,
        name: item.name,
        index,
      }
    })

    this.setState({
      showPlay: true,
      marksH: obj
    }, () => {

    })
  }

  //返回
  reback = () => {
    this.setState({
      showPlay: !this.state.showPlay,
    })

    // 清除加载的数据
    this.clearLayers();

    //还原数据
    this.setModelVisiable(true);
  }
  //播放面板大小
  changePlaySize = bool => {
    this.setState({
      ...this.state,
      bigPlayPanel: bool
    })
  }

  //循环palyer
  intervalPlay = (index, countLayers, playLayers) => {
    const { tickList, tickIndex, tickMSecond } = this.state
    const { myResourceList } = this.props.Timeline
    let count = index || 0;
    let oldLayer = null;
    if (count !== 0) oldLayer = myResourceList.filter(v => v.id === playLayers[count - 1].id)[0]
    let newLayer = myResourceList.filter(v => v.id === playLayers[count].id)[0]
    // console.log("delete-timeline", oldLayer, new Date());
    // this.delLayer(oldLayer)
    // console.log("add-timeline", newLayer, new Date());
      // let idx = this.getIndex(countLayers) + tickIndex
      // let tickValue = 100 * idx / (tickList.length - 1)
      // this.setState({
      //   tickValue
      // })
    this.addLayer(newLayer).then((data) => {
      console.log("did-timeline", data, new Date());
      let cesiumDataTemp = {};
      cesiumDataTemp[newLayer.id] = data
      let idx = this.getIndex(countLayers, count + 1) + tickIndex
      let tickValue = 100 * idx / (tickList.length - 1)
      this.setState({
        selectLayerId: newLayer.id,
        selectNodeIndex: idx,
        tickValue,
        cesiumData: {
          ...this.state.cesiumData,
          ...cesiumDataTemp,
        },
      });
      if (count >= playLayers.length - 1) {
        setTimeout(() => {
          // this.clearLayers()
        }, tickMSecond)
        this.setState({
          playState: false,
          selectLayerId: -9999,
          selectNodeIndex: -9999,
        })
        return;
      };
      count++;
      setTimeout(() => {
        this.intervalPlay(count, countLayers, playLayers);
      }, tickMSecond)
    })
  }

  getIndex = (array, count) => {
    let sum = 0, idx;
    for (let index = 0; index < array.length; index++) {
      const element = array[index];
      sum += element
      if (count <= sum) {
        idx = index;
        break;
      }
    }
    return idx;
  }

  //
  setModelVisiable=(flag)=>{
    const {reality:{sz_osgb}} =motherBoard;
    let items=sz_osgb.children;
    Object.values(items).forEach((item,index)=>{
      let model=this.getModelbyurl(item);
      if(model){
        model.show=flag;
      }
    })
  }

  playTick = () => {
    const { tickList, tickIndex, tickMSecond } = this.state
    const { myResourceList } = this.props.Timeline

    // 隐藏默认三维模型
    this.setModelVisiable(false);
    let copy = tickList
    let playList = copy.slice(tickIndex, copy.length)
    let playLayers = []
    let countLayers = []
    playList.forEach(el => {
      playLayers.push(...el.layers)
      countLayers.push(el.layers.length)
    })
    this.clearLayers();
    this.intervalPlay(0, countLayers, playLayers);
    this.setState({
      playState: true,
      // palyHandler:addInterval
    })
    return;

    let count = 0;
    let addInterval = setInterval(() => {
      let oldLayer = null;
      if (count !== 0) oldLayer = myResourceList.filter(v => v.id === playLayers[count - 1].id)[0]
      let newLayer = myResourceList.filter(v => v.id === playLayers[count].id)[0]
      console.log("delete-timeline", oldLayer, new Date());
      this.delLayer(oldLayer)
      console.log("add-timeline", newLayer, new Date());
      this.addLayer(newLayer).then(data => {
        console.log("did-timeline", data, new Date());
        let cesiumDataTemp = {};
        cesiumDataTemp[newLayer.id] = data
        let idx = getIndex(countLayers, count + 1) + tickIndex
        let tickValue = 100 * idx / (tickList.length - 1)
        this.setState({
          selectLayerId: newLayer.id,
          selectNodeIndex: idx,
          tickValue,
          cesiumData: {
            ...this.state.cesiumData,
            ...cesiumDataTemp,
          },
        });

        count++;
        if (count === playLayers.length) {
          setTimeout(() => {
            this.clearLayers()
            this.setState({
              playState: false,
              selectLayerId: -9999,
              selectNodeIndex: -9999,
            })
          }, tickMSecond)
          window.clearInterval(addInterval)
        }
      })
    }, tickMSecond);

    function getIndex(array, count) {
      let sum = 0, idx;
      for (let index = 0; index < array.length; index++) {
        const element = array[index];
        sum += element
        if (count <= sum) {
          idx = index;
          break;
        }
      }
      return idx;
    }

    this.setState({
      playState: true,
      palyHandler: addInterval
    })
  }

  pauseTick = () => {
    const { palyHandler } = this.state

    this.setState({
      playState: false
    }, () => {
      this.clearLayers()
      window.clearInterval(palyHandler)
    })
  }

  clearLayers = () => {
    const { myResourceList } = this.props.Timeline;
    myResourceList.forEach(it => {
      this.delLayer(it)
    })
  }

  render() {
    const { selectedindex, showPlay, tickList, tickName, marksH, showTimelinePanel, selectLayerId, selectNodeIndex, playState, tickValue } = this.state;
    const { timelineList, myResourceList } = this.props.Timeline
    // console.log(myResourceList)
    return (
      <>
        {
          <div className={styles.smallBox} style={{ display: this.state.viewType === 'big' ? 'none' : 'grid' }}>
            <div className={styles.sTitle}>时序播放</div>
            <div className={styles.ctl + " " + styles.arrow} onClick={() => { this.changeIndex('minus') }}>
              <Icon type="left" className={styles.arrowIcon} />
            </div>
            <div className={styles.arrow} onClick={() => { this.flyto(timelineList[this.state.index], this.state.index) }}>
              {timelineList.length === 0 ? '暂无数据' : timelineList[this.state.index].name}
            </div>
            <div className={styles.ctl + " " + styles.arrow} onClick={() => { this.changeIndex('plus') }}>
              <Icon type="right" className={styles.arrowIcon} />
            </div>
            <Tooltip title="最大化">
              <div className={styles.ctl} onClick={() => { this.changeSize('big') }}>
                <div className={styles.iconWrap}>
                  <Icon type="border" />
                </div>
              </div>
            </Tooltip>
            <Tooltip title="关闭" onClick={this.close}>
              <div className={styles.ctl}>
                <div className={styles.iconWrap}>
                  <Icon type="close" />
                </div>
              </div>
            </Tooltip>
            <BorderPoint />
          </div>
        }
        {
          <div className={styles.box} style={{ display: this.state.viewType === 'big' ? 'block' : 'none' }}>
            <BorderPoint />
            <div className={styles.boxTitle}>
              <div className={styles.titleText}>
                时序播放
              </div>
              <div className={styles.titleControl} onClick={() => { this.changeSize('small') }}>
                <Tooltip title="最小化">
                  <div className={styles.iconWrap}>
                    <Icon type="line" />
                  </div>
                </Tooltip>
                <Tooltip title="关闭" onClick={this.close}>
                  <div className={styles.iconWrap}>
                    <Icon type="close" />
                  </div>
                </Tooltip>
              </div>
            </div>
            <div className={styles.boxContent}>
              <div className={styles.leftBtn} onClick={this.scrollLeft}>
                <Icon type="left" className={styles.arrowIcon} />
              </div>
              <div ref={this.con} className={styles.con}>
                <div className={styles.father} style={{ width: (timelineList.length + 2) * 172 + "px" }}>
                  <div className={styles.item} onClick={this.newTimeline}>
                    <Icon type="plus" className={styles.addIcon} />
                    <span className={styles.addText}>新增时序</span>
                  </div>
                  {timelineList.map((item, index) => {
                    return <div key={index} className={styles.item} >
                      <img src="./config/images/shenzhen/shenzhenmap.png" alt="" className={`${index == selectedindex ? styles.selected : ""}`} />
                      <div className={styles.mask} >
                        <p className={styles.name} >{item.name == null ? "\b" : item.name}</p>
                        <div className={styles.bottomBtn}>
                          <div style={{ display: 'flex' }}>
                            <div className={styles.btnItem} style={{ marginRight: '4px' }} onClick={this.playTimeLineDriect.bind(this, item, index)}>
                              <a className={"iconfont icon_play"} ></a>
                            </div>
                            <div className={styles.btnItem} onClick={this.editTimeline.bind(this, item, index)}>
                              <a className={"iconfont icon_edit"} ></a>
                            </div>
                          </div>
                          <Popconfirm
                            title="删除此时序吗?"
                            onConfirm={this.confirmDel.bind(this, item.id)}
                            placement="top"
                            okText="是"
                            cancelText="否"
                          >
                            <div className={styles.btnItem}>
                              <span className={styles.btnIcon + ' iconfont'}>&#xe6ab;</span>
                            </div>
                          </Popconfirm>
                        </div>
                      </div>
                    </div>
                  })}
                </div>
              </div>
              <div className={styles.rightBtn} onClick={this.scrollRight}>
                <Icon type="right" className={styles.arrowIcon} />
              </div>
            </div>
          </div>
        }

        {showTimelinePanel &&
          <div className={styles.panel} style={showPlay ? (this.state.bigPlayPanel ? { height: '620px' } : { height: '165px' }) : { height: '500px' }}>
            <div className={styles.boxTitle}>
              <div className={styles.titleText}>
                数据时序
              </div>
              <div className={styles.titleControl} >
                {showPlay && <Tooltip title="返回" onClick={this.reback}>
                  <div className={styles.iconWrap}>
                    <Icon type="rollback" />
                  </div>
                </Tooltip>
                }
                {showPlay && this.state.bigPlayPanel && <Tooltip title="最小化" onClick={() => { this.changePlaySize(false) }}>
                  <div className={styles.iconWrap}>
                    <Icon type="line" />
                  </div>
                </Tooltip>
                }{showPlay && !this.state.bigPlayPanel && <Tooltip title="最大化" onClick={() => { this.changePlaySize(true) }}>
                  <div className={styles.iconWrap}>
                    <Icon type="border" />
                  </div>
                </Tooltip>
                }
                <Tooltip title="关闭" onClick={this.closePanel}>
                  <div className={styles.iconWrap}>
                    <Icon type="close" />
                  </div>
                </Tooltip>
              </div>
            </div>
            {
              !showPlay &&
              <div className={styles.add}>
                <Row type='flex' justify='end' align='middle' className={styles.item}>
                  <Col span={6}>名称</Col>
                  <Col span={18}><Input style={{ color: '#fff', background: 'rgba(38, 53, 79, .6)', border: 'unset' }} value={tickName} onFocus={this.onInputFocus} onChange={e => this.changeName(e)} onBlur={this.onInputBlur} /></Col>
                </Row>
                <Row className={styles.item}>
                  <Col span={24}><Button icon='plus' className={styles.newTime} onClick={this.newTick}>新增时点</Button></Col>
                </Row>
                <div className={styles.wrap}>
                  {
                    tickList.map((item, index) => (
                      <Row key={index} className={styles.newItem}>
                        <Col span={24}>
                          <Row type='flex' align='middle' className={styles.toolbar}>
                            <Col span={17}>
                              <Input className={styles.inputItem} value={item.name} onFocus={this.onInputFocus} onChange={value => this.itemTickChange(value, index)} onBlur={this.onInputBlur}></Input>
                            </Col>
                            <Col span={3} className={styles.btn} style={{ paddingLeft: '8px' }}>
                              <Icon type='plus' onClick={() => this.itemTickAdd(index)} />
                            </Col>
                            {/* <Col span={3} className={styles.btn}>
                              <Icon type='edit' />
                            </Col> */}
                            <Col offset={1} span={3} className={styles.btn}>
                              <Icon type='delete' onClick={() => this.itemTickDelete(index)} />
                            </Col>
                          </Row>
                        </Col>

                        <Col span={24}>
                          {
                            item.layers.map((it, idx) => (
                              <Row key={idx} type='flex' align='middle' className={styles.itemLayerRow}>
                                <Col span={20} >
                                  <Select
                                    labelInValue
                                    className={styles.itemLayerSelect}
                                    value={it !== null ? { key: it.id, label: it.name } : { key: '', label: '' }}
                                    dropdownClassName={'layerName'}
                                    onChange={value => this.itemLayerChange(value, index, idx)}
                                  >
                                    {
                                      myResourceList.map((itm, index2) => (
                                        <Select.Option key={index2} value={itm.id} className="itemOption">{itm.name}</Select.Option>
                                      ))
                                    }
                                  </Select>
                                </Col>
                                <Col span={3} offset={1} className={styles.btn}>
                                  <Icon type='delete' onClick={() => this.itemLayerDel(index, idx)} />
                                </Col>
                              </Row>
                            ))
                          }
                        </Col>
                      </Row>
                    ))
                  }
                </div>
                <div className={styles.btngroup}>
                  <Row type='flex' justify='space-between' align='middle' >
                    <Col span={12}><Button onClick={this.saveOrUpdateTick} style={{ background: 'rgba(58,134,243,0.60)', border: '1px solid #3A86F3' }}>保存</Button></Col>
                    <Col span={12}><Button onClick={this.playTimeLine} style={{ float: "right" }}>播放</Button></Col>
                  </Row>
                </div>
              </div>
            }
            {showPlay &&
              <div className={styles.play}>
                <Row type='flex' justify='end' align='middle'>
                  <Col span={4} onClick={playState ? this.pauseTick : this.playTick}>
                    {playState ? <Icon type="pause" className={styles.playBtn}></Icon> : <Icon type="caret-right" className={styles.playBtn}></Icon>}
                  </Col>
                  <Col offset={4} span={10}>
                    <span>时间间隔（秒）</span>
                  </Col>
                  <Col span={6} className={styles.rightBtn}>
                    <InputNumber size='small' min={5} defaultValue={5} onFocus={this.onInputFocus} onChange={this.setTick} onBlur={this.onInputBlur}></InputNumber>
                  </Col>
                </Row>
                <Row type='flex' justify='end' align='middle'>
                  <Col span={24}>
                    <Slider marks={marksH} step={null} tooltipVisible={false} onChange={this.tickIndex} value={tickValue} />
                  </Col>
                </Row>
                <Row type='flex' justify='space-between' align='middle' className={styles.labels}>
                  <Col span={24}>
                    {/* {
                      tickList.map(item=>{
                        return <div className={styles.leftLabel}>{item.name.replace("年","")}</div>
                      })
                    } */}
                    {/* <div className={styles.leftLabel}>{marksH[Object.keys(marksH)[0]] && marksH[0].name}</div>

                    <div className={styles.rightLabel}>{tickList[tickList.length - 1] && tickList[tickList.length - 1].name}</div> */}
                  </Col>
                </Row>
                <div className={styles.showTickbar}>
                  {this.state.bigPlayPanel &&
                    tickList.map((item, index) => (
                      <Row key={index} type='flex' justify='center' >
                        <Col span={1} className={styles.bar}></Col>
                        <Col span={2} className={styles.circle}></Col>
                        <Col span={21}>
                          <Row>
                            <Col className={styles.tickName}>{item.name}</Col>
                          </Row>
                          {
                            item.layers.map((it, idx) => (
                              <Row key={idx}>
                                <Col className={`${styles.tickLayer} ${(it.id === selectLayerId && index === selectNodeIndex) ? styles.active : ''}`}>{it.name}</Col>
                              </Row>
                            ))
                          }
                        </Col>
                      </Row>
                    ))
                  }

                  
                </div>
              </div>
            }


          </div>
        }
      </>
    );
  }
}

export default TimelinePlay;
