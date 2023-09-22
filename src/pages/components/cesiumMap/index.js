/* global mars3d */
/* global viewer */
/* global L */
import React, { Component } from 'react';
import { connect } from 'dva';
import styles from './styles.less';
import SunAnalys from '../SunAnalys';
import Roam from './components/roam';
import ColorBar from './components/colorbar';
import colorPost from './components/postProcess/post.js';
import PostProcess from './components/postProcess';
import SpaceMark from './components/SpaceMark';
import Automaticroam from './components/automaticroam';
import PerBookmark from './components/perBookmark';
import TimelinePlay from './components/TimelinePlay';
import PerformanceMonitor from './components/PerformanceMonitor';
import { Spin } from 'antd';
import './tool';
import { PUBLIC_PATH } from '@/utils/config';
import DistinctBorder from './components/distinctBorder';
import HouseHold from './components/householdNew';
//import Pineline from '../leftSider/components/pipeline'
import PipePanel from './components/pipeline';
import MeasurePanel from './components/measure';
import LandCuttingPanel from './components/landCutting';
import FlatteningPanel from './components/flattening';
import PanoramicView from './components/panoramicView';
import VisualAnalys from './components/visualAnalys';
import VR from './components/vr';
import Fcfh from './components/Fcfh';
import Query from './components/query';
// import IndoorRoam from './components/indoorroam'
// import RightIndoorImg from './components/rightIndoorImg'
import Tips from '../tips';
import AddBIM from './components/addBIM';

import SkyLine from './components/SkyLine';
import CoordinateConvert from './components/CoordinateConvert';

//import turf from '@turf/turf';

const Cesium = window.Cesium;
var eyeviewer, eye, eyecontrol, eyeurl, eyelayers;
var isopeneye = true;
var any = null;
@connect(({ Map, Home, RightFloatMenu }) => ({
  Map,
  Home,
  RightFloatMenu,
}))
class CesiumMap extends Component {
  constructor(props) {
    super(props);
    this.state = {
      viewer: null,
    };
  }
  componentWillMount() {
    // this.initMap();
    // eye = document.getElementById("overview");
    this.initMap()
      .then(() => {
        this.initCamera();
      })
      .then(() => {
        // this.initOverview();
      });
  }

  initMap = () => {

    window.NProgress.start();
    
    return new Promise(resolve => {
    mars3d.createMap({
        id: 'cesiumContainer',
        url: `${PUBLIC_PATH}Mars/marsConfig.json`,
        skyBox: new Cesium.SkyBox({
          sources: {
            positiveX: `${PUBLIC_PATH}skyBox/00h+00.jpg`,
            negativeX: `${PUBLIC_PATH}skyBox/12h+00.jpg`,
            positiveY: `${PUBLIC_PATH}skyBox/06h+00.jpg`,
            negativeY: `${PUBLIC_PATH}skyBox/18h+00.jpg`,
            positiveZ: `${PUBLIC_PATH}skyBox/06h+90.jpg`,
            negativeZ: `${PUBLIC_PATH}skyBox/06h-90.jpg`,
          },
        }), //用于渲染星空的SkyBox对象
    
      
        
        // scene3DOnly: false, //如果设置为true，则所有几何图形以3D模式绘制以节约GPU资源
        // shouldAnimate: false, // 初始化是否开始动画
        // clockViewModel: undefined, // 一个视图模型，它为用户界面提供 Clock
        // selectedImageryProviderViewModel: undefined, //当前图像图层的显示模型，仅baseLayerPicker设为true有意义
        // selectedTerrainProviderViewModel: undefined, //当前地形图层的显示模型，仅baseLayerPicker设为true有意义


        // skyAtmosphere: new Cesium.SkyAtmosphere(), // 围绕提供的椭球体边缘绘制的大气
        // fullscreenElement: document.body, //全屏时渲染的HTML元素,
        // useDefaultRenderLoop: true, //如果需要控制渲染循环，则设为true
        // targetFrameRate: undefined, //使用默认render loop时的帧率
        // showRenderLoopErrors: false, //如果设为true，将在一个HTML面板中显示错误信息
        // automaticallyTrackDataSourceClocks: false, //自动追踪最近添加的数据源的时钟设置
        // contextOptions: {}, //传递给Scene对象的上下文参数（scene.options）
         sceneMode: Cesium.SceneMode.SCENE3D, //初始场景模式
        // mapProjection: new Cesium.WebMercatorProjection(), //地图投影体系
        // globe: undefined, // 在场景中渲染的地球仪，包括其地形 ( Globe#terrainProvider ) 和图像图层 ( Globe#imageryLayers )
        // orderIndependentTranslucency: true,
        // dataSources: new Cesium.DataSourceCollection(), //需要进行可视化的数据源的集合
        // projectionPicker: undefined, //ProjectionPicker 是用于在透视和正交投影之间切换的单按钮小部件。
        // // imageryProviderViewModels: Cesium.createDefaultImageryProviderViewModels(), //图层选择器,可供BaseLayerPicker选择的图像图层ProviderViewModel数组
        // // terrainProviderViewModels: Cesium.createDefaultTerrainProviderViewModels(), //地形选择器,可供BaseLayerPicker选择的地形图层ProviderViewModel数组
        // // imageryProvider: new Cesium.OpenStreetMapImageryProvider({
        // //   credit: "",
        // //   url: "Custom url",
        // // }), //图像图层提供者，仅baseLayerPicker设为false有意义
         terrainProvider: new Cesium.EllipsoidTerrainProvider(), //地形图层提供者，仅baseLayerPicker设为false有意义


        // sceneMode : Cesium.SceneMode.COLUMBUS_VIEW,
        success: (viewer, gisdata, jsondata) => {
          window.viewer = viewer;
          mars3d.widget.init(viewer, jsondata.widget);
          eyeurl = gisdata.map3d.basemaps[1].url;
          eyelayers = gisdata.map3d.basemaps[1].layers;
          // viewer.mars.openFlyAnimation();
          this.setState({
            viewer,
          });
          var s = viewer.mars.getBasemap();
          this.props.dispatch({
            type: 'Map/setMarsBasemap',
            payload: s,
          });
          resolve();
        },
      });



      



    });
  };
  initCamera = () => {
    const { viewer } = this.state;
    viewer.scene.globe.depthTestAgainstTerrain = false;
    // viewer.scene.postProcessStages.fxaa.enabled = true;
    //默认后处理效果
    let stage = viewer.scene.postProcessStages.add(colorPost);
    // stage.uniforms.brightness = 1.42;
    // stage.uniforms.saturation = 1.0;
    // stage.uniforms.contrast = 1.0;
    let storage = window.localStorage;
    let info = storage.getItem('REALITY');
    if (!info) {
      info = JSON.stringify({ brightness: 1.02, saturation: 1.0, contrast: 1.2 });
    }
    if (info) {
      info = JSON.parse(info);
      stage.uniforms.brightness = info.brightness || 1.0;
      stage.uniforms.saturation = info.saturation || 1.0;
      stage.uniforms.contrast = info.contrast || 1.0;
    }

  viewer.scene.postProcessStages.fxaa.enabled = true;
  // // 去除版权信息
  //@ts-ignore
  viewer.cesiumWidget.creditContainer.style.display = "none";
  // // 增加太阳光照
  viewer.scene.globe.enableLighting = true;
  viewer.shadows = false;//关闭阴影
  var url="http://data.mars3d.cn/3dtiles/max-ytlhz/tileset.json"
  this.addBaseTiles(url)
 

 // this.loadEarthAtNight();




    window.stage = stage; //x: -2893533.4116741004, y: 4661175.170726068, z: 3252934.4545579157
    // const centeropt =viewer.gisdata ? viewer.gisdata.config.center : {"x": -2897496.3308105203, "y": 4653618.461359003, "z": 3252350.791769604,"heading":360,"pitch":-40,"roll":0};
    // // const height = centeropt.z || 2500;
    // viewer.camera.flyTo({
    //   destination: new Cesium.Cartesian3(centeropt.x, centeropt.y, centeropt.z), //经度、纬度、高度
    //   orientation: {
    //     heading: Cesium.Math.toRadians(centeropt.heading || 0), //绕垂直于地心的轴旋转
    //     pitch: Cesium.Math.toRadians(centeropt.pitch || -90), //绕纬度线旋转
    //     roll: Cesium.Math.toRadians(centeropt.roll || 0) //绕经度线旋转
    //   },
    //   complete:()=>{
    //     console.log("d")
    //   },
    //   duration: 4
    // });

    // 监听全屏事件
    document.addEventListener(Cesium.Fullscreen.changeEventName, this.fullscreenCallBack);
 
  };


  addBaseTiles=(url)=>
  {
    var cesium3DTileset = new Cesium.Cesium3DTileset({
      url: url,
      show: true,
    });
    viewer.scene.primitives.add(cesium3DTileset);
    cesium3DTileset.readyPromise.then(tileset => {
      viewer.flyTo(tileset) 
      window.NProgress.done();
    });


  }

  
// 加载昼夜联动
loadEarthAtNight = () => {

  const dynamicLighting = true;
  viewer.clock.multiplier = 4000;
  const imageryLayers = viewer.imageryLayers;
  const nightLayer = imageryLayers.get(0);
  const dayLayer = imageryLayers.addImageryProvider(
    new Cesium.IonImageryProvider({
      assetId: 3845,
    })
  );

  imageryLayers.lowerToBottom(dayLayer);
  this.updateLighting(dynamicLighting, nightLayer, dayLayer);
};

// 更新光照效果
 updateLighting = (
  dynamicLighting,
  nightLayer,
  dayLayer
) => {
  dayLayer.show = dynamicLighting;
  viewer.scene.globe.enableLighting = dynamicLighting;
  viewer.clock.shouldAnimate = dynamicLighting;
  nightLayer.dayAlpha = dynamicLighting ? 1.0 : 1.0;
};


  //全屏事件的监听
  fullscreenCallBack = () => {
    const { toolsActiveKey } = this.props.Map;
    if (!Cesium.Fullscreen.fullscreen && toolsActiveKey === 'vr') {
      // 退出VR模式
      this.props.dispatch({
        type: 'Map/setToolsActiveKey',
        payload: '',
      });
    }
  };

  showorhideoverview() {
    //let that = this;
    if (isopeneye) {
      if (eye) {
        eye.style.display = 'none';
        isopeneye = false;
        document.getElementById('close').style.display = 'block';
      }
    } else {
      if (eye) {
        eye.style.display = 'block';
        isopeneye = false;
        document.getElementById('close').style.display = 'block';
        isopeneye = true;
      }
    }
  }

  // initOverview = () => {
  //   const {
  //     viewer
  //   } = this.state;
  //   let provider = new Cesium.WebMapServiceImageryProvider({
  //     url:eyeurl,
  //     layers:eyelayers,
  //     parameters: {
  //       format: "image/png",
  //       crs: "EPSG:4326",
  //       transparent:false
  //     }
  //   });
  //   //console.log("dangq" +eyeurl);
  //
  //   //构造鹰眼地球
  //   eyeviewer = new Cesium.Viewer("overview", {
  //     sceneMode: Cesium.SceneMode.SCENE2D,
  //     homeButton: false,
  //     sceneModePicker: false,
  //     navigationHelpButton: false,
  //     vrButton: false,
  //     fullscreenButton: false,
  //     infoBox: false,
  //     animation: false,        //是否创建动画小器件，左下角仪表
  //     timeline: false,         //是否显示时间线控件
  //     geocoder: false,         //是否显示地名查找控件
  //     baseLayerPicker: false,  //是否显示图层选择控件
  //     imageryProvider: provider
  //   });
  //   eyecontrol = eyeviewer.scene.screenSpaceCameraController;
  //   eyecontrol.enableRotate = false;
  //   eyecontrol.enableTranslate = false;
  //   eyecontrol.enableZoom = false;
  //   eyecontrol.enableTilt = false;
  //   eyecontrol.enableLook = false;
  //   this.setState({
  //     eyeviewer
  //   })
  //   let syncViewer = function() {
  //
  //     var params = viewer.mars.getExtent();
  //     // var extend = viewer.camera.computeViewRectangle();
  //     // params.maxx = Cesium.Math.toDegrees(extend.east);
  //     // params.maxy = Cesium.Math.toDegrees(extend.north);
  //
  //     // params.minx = Cesium.Math.toDegrees(extend.west);
  //     // params.miny = Cesium.Math.toDegrees(extend.south);
  //
  //     //如果主图视野在深圳范围以外，执行主图和鹰眼图的同步视野操作
  //     if((params.xmin<113.7573)||(params.ymin<22.44980)||(params.xmax>114.62446)||(params.ymax>22.86315))
  //     {
  //        eyeviewer.camera.flyTo({
  //         destination: viewer.camera.position,
  //         orientation: {
  //           heading: 360,
  //           pitch: -90,
  //           roll: 360
  //         },
  //         duration: 0.0
  //       })
  //     }//否则停止视野同步，将主图视野在鹰眼图上画红框
  //     else {
  //       eyeviewer.entities.removeAll();
  //       var rectangle = eyeviewer.entities.add({
  //         rectangle: {
  //           coordinates: Cesium.Rectangle.fromDegrees(params.minx, params.miny, params.maxx, params.maxy),
  //           outline: true,
  //           outlineColor: Cesium.Color.RED,
  //           outlineWidth: 8,
  //           fill: false,
  //           heightReference: Cesium.HeightReference.NONE
  //         }
  //       })
  //     }
  //   }
  //   viewer.scene.preRender.addEventListener(syncViewer);
  // }

  render() {
    const { toolsActiveKey, IndoorKey } = this.props.Map;
    const { rightActiveKey, leftActiveKey } = this.props.Home;
    const { scene } = this.props.RightFloatMenu;
    return (
      <>
        <div className={styles.cesiumContainer} id="cesiumContainer">
          <div className={styles.mains} id="Maskb">
            <Spin className={styles.loadings}></Spin>
          </div>
          <div className={styles.sliderc} id="slider"></div>
          {/* <div className={styles.slidercimg} id='slidercimg'></div> */}
          {/*<img id="close" src='/config/images/toggle.png' className={styles.minimapdisplay} onClick={this.showorhideoverview}></img>*/}
          {/*<div id='overview' className={styles.minimap}></div>*/}
        </div>
        {toolsActiveKey === 'sunAnalys' && <SunAnalys />}
        {toolsActiveKey === 'roam' && <Roam />}
        {rightActiveKey === 'sea' && <ColorBar />}
        {toolsActiveKey === 'postProcess' && <PostProcess />}
        {toolsActiveKey === 'spaceMark' && <SpaceMark />}
        {toolsActiveKey === 'automaticroam' && <Automaticroam />}
        {toolsActiveKey === 'perBookmark' && <PerBookmark />}

        {(leftActiveKey === 'safe' || leftActiveKey === 'ocean') && <DistinctBorder />}
        {toolsActiveKey === 'houseHold' && <HouseHold />}
        {scene === 'underground' && <PipePanel />}
        {toolsActiveKey === 'measure' && <MeasurePanel />}
        {toolsActiveKey === 'landCutting' && <LandCuttingPanel />}
        {toolsActiveKey === 'flattening' && <FlatteningPanel />}
        {toolsActiveKey === 'panoramicView' && <PanoramicView />}
        {toolsActiveKey === 'visualAnalys' && <VisualAnalys />}
        {toolsActiveKey === 'query' && <Query />}
        {toolsActiveKey === 'timelinePlay' && <TimelinePlay />}
        {toolsActiveKey === 'performanceMonitor' && <PerformanceMonitor />}
        {toolsActiveKey === 'vr' && <VR />}
        {toolsActiveKey === 'addbim' && <AddBIM />}
        {toolsActiveKey === 'Fcfh' && <Fcfh />}
        {toolsActiveKey === 'skyline' && (
          <SkyLine dispatch={this.props.dispatch} viewer={viewer}></SkyLine>
        )}
        {toolsActiveKey === 'coordinateConvert' && (
          <CoordinateConvert dispatch={this.props.dispatch} viewer={viewer}></CoordinateConvert>
        )}

        {<Tips />}
      </>
    );
  }
}

export default CesiumMap;
