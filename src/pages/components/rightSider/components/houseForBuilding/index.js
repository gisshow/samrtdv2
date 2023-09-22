/* global Cesium */
/* global viewer */
/* global mars3d */
/* global $ */
/* global turf */
import React, { Component } from 'react'
import ModuleTitle from '@/components/moduleTitle'
import SearchPanel from '@/components/searchPanel'
import ListView from '@/components/listView'
import styles from './styles.less';
import { connect } from 'dva';
import {getBuild3DUrl,getBuildById,getParcelByBuildId} from '@/service/house';
import markpng from '../../images/mark_build.png';
import { PUBLIC_PATH } from '@/utils/config'
import BuildingInfo from './components/buildingInfo';
const Ajax = require('axios');
let count = 0;//点击次数
function coordinatesArrayToCartesianArray(coordinates) {
  var positions = new Array(coordinates.length);
  for (var i = 0; i < coordinates.length; i++) {
    var coord=coordinates[i];
      positions[i] = Cesium.Cartesian3.fromDegrees(coord[0], coord[1])
  }
  return positions;
}

@connect(({ House,Map }) => ({
  House,Map
}))
class HouseForBuilding extends Component {

  constructor(props){
    super(props);
    this.state = {
      lastShowFeature :null,
      activeId:props.House.activeBuildListId || [],
    }
    this.handler=null;
    this.basicBldgId=null;
    this.iconLayer=null;
    this.refList=React.createRef(); //这个指向list
    this.depthTest=viewer.scene.globe.depthTestAgainstTerrain;

  }

  componentDidMount() {
    // 关闭深度检测
    viewer.scene.globe.depthTestAgainstTerrain=false;
    const {parcelId,jdName,quName,activeBuildListId} =this.props.House;
    const {toolsActiveKey} = this.props.Map;
    this.props.onRef && this.props.onRef(this);
    this.bindEvent();
    if(jdName){
      // this.addBuildWMS();
      // this.add3DTiles();
    }
    // if(parcelId){
    //   this.props.dispatch({
    //     type: 'House/getBuildList',
    //     payload: {
    //       parcelId:parcelId
    //     }
    //   })
    // }else{
      if(jdName==='' || toolsActiveKey==="query"){
        return;
      }
      this.props.dispatch({
        type: 'House/getBuildList',
        payload:{
          jdName:jdName,
          // quName:quName
        }
      })
    // }
    if(activeBuildListId){
      this.handleScrollToElement(activeBuildListId);
    }


  }

  bindEvent=()=>{
    this.handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    this.handler.setInputAction((event)=> {
      var position = event.position;
      var pickedObject = viewer.scene.pick(position);
      if(!pickedObject || !pickedObject.collection){
        this.removeFeature();
      }

    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
  }

  componentWillUnmount() {
    const {buildWMS,tileset} =this.props.House;
    // this.removeFeature();
    // $('.mars3d-popup').remove();
    if(this.handler){
      this.handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK)//移除事件
    }
    if(this.iconLayer){
      viewer.dataSources.remove(this.iconLayer);
      this.iconLayer=null;
    }
    if(buildWMS){
      // 只隐藏
      // buildWMS.setVisible(false);
      // buildWMS.remove();
      // this.props.dispatch({
      //   type: 'House/setBuildWMS',
      //   payload: ''
      // })
    }
    // if(buildSpecialWMS){
    //   buildSpecialWMS.setVisible(false);
    //   // buildSpecialWMS.remove();
    //   // this.props.dispatch({
    //   //   type: 'House/setBuildSpecialWMS',
    //   //   payload: ''
    //   // })
    // }

    if(tileset){
      tileset.show=false;
      // viewer.scene.primitives.remove(tileset);
      // tileset && tileset.destroy();
      // this.props.dispatch({
      //   type: 'House/setTileset',
      //   payload: undefined
      // });
    }

    // viewer.mars.popup.removeFeatureForImageryLayer();//
    viewer.scene.globe.depthTestAgainstTerrain=this.depthTest;

  }

  componentWillReceiveProps(newPorps){
    const {activeBuildListId,jdName,quName} =this.props.House;
    let newId=newPorps.House.activeBuildListId;
    if(newId && activeBuildListId!==newId){
      // var element = document.getElementById(newId);
      // if(!element) {
      //   this.props.dispatch({
      //     type: 'House/getBuildList',
      //     payload:{
      //       jdName:jdName,
      //       // quName:quName
      //     }
      //   })
      // }
      this.handleScrollToElement(newId);
      this.setState({
        activeId:[...newId]
      });
    }
  }

  //加载wms服务
  addBuildWMS=()=>{
    const {buildWMS,houseHoldModel} =this.props.House;
    if(houseHoldModel) return;
    if(buildWMS){
      buildWMS.setVisible(true);
      // buildSpecialWMS.setVisible(true);
      return;
    }
    return;
    //增加其他底图
    let layer = mars3d.layer.createLayer({
      "name": "JCLWMS",
      "type": "wms",
      "url": "/geoserver/JCL/wms",
      "layers": "JCL:jcl_BASICBLDGATTINF",
      "crs": "EPSG:4490",
      "parameters": {
        "transparent": "true",
        "format": "image/png"
      },
      "showClickFeature": true,
      "pickFeatureStyle": {//选择的要素样式，同Draw类样式
        // "showTime": 5000,
        "clampToGround": true,
        "fill": true,
        "color": "#2deaf7",
        "opacity": 0.6,
        "outline": true,
        "outlineWidth": 1,
        "outlineColor": "#e000d9",
        "outlineOpacity": 1.0
      },
      "getFeatureInfoParameters": {
        "feature_count": 2
      },
      // "popup": "all",
      // "popupPosition":{"top":10,"left":10 }, //固定再左侧位置，不浮动 ，数值对应top/btoom、left/right
      "click": (features, viewerPoint)=> {
        for (let i = 0; i < features.length; i++) {
          const item = features[i];
          if(item.imageryLayer.config.name==="JCLWMS"){
            this.props.dispatch({
              type: 'House/setBldgNo',
              payload: item.properties.BLDG_NO
            })
             // 根据楼id联动房列表
             this.props.dispatch({
              type: 'House/setBasicBldgId',
              payload: item.properties.BLDG_NO
            })
            // this.getBuildInfo(item.properties.BLDG_NO,viewerPoint);
            return;
          }

        }

      },
      "visible": true,
    }, viewer);

    
    // this.buildWMS=layer;
    this.props.dispatch({
      type: 'House/setBuildWMS',
      payload: layer
    })
   

  }

  // 点击地块后去查询
  getBuildInfo= async(basicId,viewerPoint)=>{
    let buildInfo= await getBuildById({"basicId":basicId});
    if(buildInfo.success && buildInfo.data){
      //根据objectid联动列表
      this.props.dispatch({
        type: 'House/setActiveBuildListId',
        payload: buildInfo.data.id
      })
      this.showPopupInfo(this.buildPopup(buildInfo.data.attributes),viewerPoint);
      this.getBuilding3DUrl(buildInfo.data.attributes.basicBldgId);
    }
  }

  showPopupInfo=(popup,viewerPoint)=>{
    let position=mars3d.point.getCurrentMousePosition(viewer.scene,viewerPoint);
    viewer.mars.popup.show({
      id: 'imageryLayerFeaturePromise',
      popup: popup,
    }, position, viewerPoint);
  }



  handleScrollToElement=(id)=> {
    if(!id){
      this.refList.current.listWrapper.scrollTop--;
      return;
    }
    // 如果对应多条记录，则，滚动到第一条
    if(Object.prototype.toString.call(id)==="[object Array]"){
      id=id[0];
    }
    this.setState({
      scrollToId : id
    })
  }

  onClick=(v)=>{
    count += 1;
    setTimeout(() => {
      if (count === 1) {
        this.flyTo(v,false);
      } else if (count === 2) {
        this.flyTo(v,true);
      }
      count = 0;
    }, 300);
  }


  removeFeature=()=>{
    const {lastShowFeature} = this.state;
    const {buildEntityHash} = this.props.House;
    this.removeExtraSource();
    // if (lastShowFeature == null) return;
    //   viewer.dataSources.remove(lastShowFeature);
    if(this.basicBldgId && buildEntityHash[this.basicBldgId]){
      buildEntityHash[this.basicBldgId].show=true;
      this.basicBldgId=null;
    }
    if(this.iconLayer){
      viewer.dataSources.remove(this.iconLayer);
      this.iconLayer=null;
    }



  }

  flyTo = (properties,showPop) => {
    const {houseHoldModel} =this.props.House;
    if(houseHoldModel){
      return;
    }
    // 清除feature
    viewer.mars.popup.removeFeatureForImageryLayer();//
    // 构造feature
    // if(!properties.type && !properties.properties){
    //   properties.type="Feature";
    //   properties.properties=properties;
    //   properties.geometry=JSON.parse(properties.shape)
    // }
    let geojsonObj={};
    geojsonObj.type="Feature";
    geojsonObj.geometry=JSON.parse(properties.location);
    geojsonObj.properties=properties.attributes;

    this.showEntity(geojsonObj,showPop);
    // this.hideOldEntity(properties.basicId);
    this.setState({
      activeId:[properties.id]
    });
    this.props.dispatch({
      type: 'House/setActiveBuildListId',
      payload: [properties.id],
    })
    // 根据楼id联动房列表
    this.props.dispatch({
      type: 'House/setBasicBldgId',
      payload: properties.basicId
    })
  }
  //隐藏地图上的建筑体，避免重复添加
  hideOldEntity=(basicBldgId)=>{
    const {buildEntityHash} = this.props.House;
    if(this.basicBldgId && buildEntityHash[this.basicBldgId]){
      buildEntityHash[this.basicBldgId].show=true;
      // this.basicBldgId=null;
    }
    if(buildEntityHash[basicBldgId]){
      buildEntityHash[basicBldgId].show=false;
      this.basicBldgId=basicBldgId;
    }

  }
  showEntity= async (feature,showPop)=>{

    // viewer.mars.popup.showFeatureForImageryLayer(feature,{
    //   stroke:"#ffff00",
    //   opacity:0.7,
    //   strokeWidth:3,
    //   fill:"#ffff00"
    // });
    this.unhightLight();
    this.removeExtraSource();
    // const {lastShowFeature} =this.state;
    // if (feature == null) return;
    // if (lastShowFeature !== null){
    //   viewer.dataSources.remove(lastShowFeature);
    // };
    let buffere = turf.buffer(feature, 2.5, { units: 'meters', steps: 64 });

    let options = {};
    let dataSource = await viewer.dataSources.add(Cesium.GeoJsonDataSource.load(buffere, {
      clampToGround: true,
      stroke: new Cesium.Color.fromCssColorString(options.stroke || "#ffff00"),
      strokeWidth: options.strokeWidth || 3,
      fill: new Cesium.Color.fromCssColorString(options.fill || "#FEC205").withAlpha(options.fillAlpha || 0.6)
    }));
    // let dataSource=viewer.mars.popup.lastShowFeature;
    let entities=dataSource.entities.values;
    entities.map((item,index)=>{
      // item.polygon.extrudedHeight=parseFloat(item.properties.bldgHeight.getValue() || 50);
      item.polygon.classificationType=Cesium.ClassificationType.BOTH;
      item.polygon.closeBottom=false;
      // item.popupStr=this.buildPopup(feature.properties);
    })
    // viewer.flyTo(dataSource);

    let entity=dataSource.entities.values[0];
    let polyPositions = entity.polygon.hierarchy.getValue().positions;
    let polyCenter = Cesium.BoundingSphere.fromPoints(polyPositions).center;
    // polyCenter = Cesium.Ellipsoid.WGS84.scaleToGeodeticSurface(polyCenter);
    let height=entity.properties.bldgHeight ? entity.properties.bldgHeight.getValue()+50 : 50;
    viewer.scene.camera.flyToBoundingSphere(new Cesium.BoundingSphere(polyCenter,height*3), {
      duration: 2
    });
    // if(showPop){
    //   let catographic = Cesium.Cartographic.fromCartesian(polyCenter);//转弧度经纬度
    //   catographic.height=catographic.height+parseFloat(entity.properties.bldgHeight?entity.properties.bldgHeight.getValue():50);
    //   // catographic=new Cesium.Cartographic(catographic.longitude,catographic.latitude,height);
    //   polyCenter=Cesium.Cartesian3.fromRadians(catographic.longitude,catographic.latitude,catographic.height);
    //   // this.addIconLabel(polyCenter,entity.popupStr,feature.properties.basicBldgId);
    //   // this.showPopup(entity,polyCenter);
    // }
    this.getLandVecByBuildId(feature);
    this.setExtraSource(dataSource);

    // this.setState({
    //   lastShowFeature: dataSource
    // })
  }

  //查询楼所在的地，并加载显示。
  getLandVecByBuildId= async (feature)=>{
    let buffere = turf.buffer(feature, 5, { units: 'meters', steps: 64 });
    let holeGeometry=buffere.geometry;
    let result=await getParcelByBuildId({bldgNo:feature.properties.bldgNo});
    if(result.success && result.data){
        this.addLandVecByBuild(result.data,holeGeometry);
        
    }
  }
  addLandVecByBuild =(item,holeGeometry)=>{
        
    let dataSource=new Cesium.CustomDataSource('landByBuildId');
    viewer.dataSources.add(dataSource);
    // this.dataSource=dataSource;
    // landData.map((item,index)=>{
        let positions=[];
        let location={};
        let hole={};
        try {
            location=JSON.parse(item.location);
            // hole=JSON.parse(holeGeometry);
            if(location.type==="MultiPolygon"){
                positions = location.coordinates[0][0];
            }else if(location.type==="Polygon"){
                positions = location.coordinates[0];
            }
        } catch (error) {
            console.log(item.location);
        }

        var holes = [];
        holes.push(
          new Cesium.PolygonHierarchy(
            coordinatesArrayToCartesianArray(holeGeometry.type==="MultiPolygon"?holeGeometry.coordinates[0][0]:holeGeometry.coordinates[0])
          )
        );
      let entity=dataSource.entities.add({
        polyline:{
          //   hierarchy : {
              positions : coordinatesArrayToCartesianArray(positions),
          //   },
            material:Cesium.Color.RED.withAlpha(1.0),//Cesium.Color.DIMGRAY.withAlpha(0.8),//Cesium.Color.fromRandom({alpha:1.0})Cesium.Color.DARKGRAY.withAlpha(0.0)
            classificationType:Cesium.ClassificationType.BOTH,
            clampToGround:true,
            width:3,
          },
        // polygon:{
        //   hierarchy : {
        //     positions : coordinatesArrayToCartesianArray(positions),
        //     holes:holes
        //   },
        //   material:Cesium.Color.fromCssColorString('#1694E7').withAlpha(0.6),//Cesium.Color.DIMGRAY.withAlpha(0.8),//Cesium.Color.fromRandom({alpha:1.0})Cesium.Color.DARKGRAY.withAlpha(0.0)
        //   classificationType:Cesium.ClassificationType.BOTH,
        //   clampToGround:true,
        //   width:3,
        // },
      });
      this.setExtraSource(dataSource);
    // })    
  }

 

  getBuilding3DUrl=async (basicBldgId)=>{
    let buildUrl = await getBuild3DUrl({ buildingId:basicBldgId});
    if (buildUrl.status==="ok" && buildUrl.result.total!==0) {
      if(buildUrl.result.total===1){
        this.showHouseHoldBtn(basicBldgId);
      }else{
        this.appendHouseHoldBtn(basicBldgId,buildUrl.result.data);
      }

    }
  }

  

  // 针对数据entity,高亮、取消高亮的操作。
  // 额外添加的entity,标记和移除操作。
  // 上述两者可统一放model管理放入数组
  setExtraSource=(source)=>{
    
    const {extraSource}=this.props.House;
    let sources=(extraSource && extraSource.length!==0 ) ? extraSource.concat(source) : [source];
    
    this.props.dispatch({
      type: 'House/setExtraSource',
      payload: sources
    })
  }
  removeExtraSource=()=>{
    const {extraSource}=this.props.House;
    if(extraSource && extraSource.length!==0 ){
      extraSource.map((item)=>{
        viewer.dataSources.remove(item);
      })
    }
    
    this.props.dispatch({
      type: 'House/setExtraSource',
      payload: undefined,
    })
  }

  unhightLight=()=>{
    const {feature,originalColor}=this.props.House.selected;

    if(Cesium.defined(feature)){
      try{
        feature.polygon.material = new Cesium.ColorMaterialProperty(originalColor);
      } catch(ex){

      }

      this.props.dispatch({
        type: 'House/setSelected',
        payload: {
          feature:undefined,
        }
      })
    }
  }

  //指定id查询楼实体
  search=(value)=>{
    const {jdName} =this.props.House;
    if(jdName===''){
      return;
    }
    if(value===''){
      this.props.dispatch({
        type: 'House/getBuildList',
        payload: {
          jdName:jdName,
        }
      })
      return;
    }
    // 数据过滤
    this.props.dispatch({
      type: 'House/getBuildList',
      payload: {
        jdName:jdName,
        name:value
      }
    })
    // this.props.dispatch({
    //   type: 'House/getBuildById',
    //   payload: {
    //     basicId:name
    //   }
    // })

  }

  OpenSpaceQuery=()=>{
    this.props.dispatch({
      type: 'Map/setToolsActiveKey',
      payload: "query"
    })
  }

  render() {
    const {buildList,bldgNo} = this.props.House;
    const {activeId} = this.state;
    return (
      <>
        <div className={styles.box}>
   {/*       <ModuleTitle title='楼列表' />
          <SearchPanel onSearch={this.search.bind(this)}>
            <div className={styles.spaceQuery}><span className={`iconfont icon_multiselect ${styles.icon}`} title='框选' onClick={() => this.OpenSpaceQuery()} /></div>
          </SearchPanel>*/}
          <div className={styles.table}>
            <ListView
            ref={this.refList}
              source = {buildList}
              scrollToId  = {this.state.scrollToId}
              renderItem = {({item,index,style})=>(
                <div className={(activeId.includes(item.id))? styles.row +' '+styles.active :styles.row} key={index} id={item.id} style={{...style}} onClick={() => this.flyTo(item,true)}>
                  <div className={styles.blank}></div>
                  <div className={styles.num}>{index+1}</div>
                  <div className={styles.name} title={item.attributes.nowname}>{item.attributes.nowname}</div>
                  <div className={styles.state}>{item.attributes.bldgUsageName}</div>
                  <div className={styles.state}>{item.attributes.bldgLdArea}</div>
                </div>
              )}
            ></ListView>
          </div>
        </div>
        {/* {
          bldgNo && <BuildingInfo basicId={bldgNo}/>
        } */}
      </>
    );
  }
}

export default HouseForBuilding;
