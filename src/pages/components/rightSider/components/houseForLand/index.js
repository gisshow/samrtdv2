/* global Cesium */
/* global viewer */
/* global mars3d */
/* global turf */
import React, { Component } from 'react'
import ModuleTitle from '@/components/moduleTitle'
import SearchPanel from '@/components/searchPanel'
import ListView from '@/components/listView'
import styles from './styles.less';
import { connect } from 'dva';
import markpng from '../../images/mark_land.png';
import {getParcelById} from '@/service/house';
import ParcelInfo from './components/parcelInfo'
let count = 0;//点击次数

@connect(({ House,Map }) => ({
  House,Map
}))
class EntityForParcel extends Component {

  constructor(props){
    super(props);
    this.state = {
      // lastShowFeature :null,
      depthTest:viewer.scene.globe.depthTestAgainstTerrain,
      activeId:props.House.activeLandListId || null,
    }
    this.handler=null;
    this.iconLayer=null;
    this.lastShowFeature=null;
    this.refList=React.createRef(); //这个指向list
  }

  componentDidMount() {
    const {jdName,activeLandListId} =this.props.House;
    const {toolsActiveKey} = this.props.Map;
    this.props.onRef && this.props.onRef(this);
    // this.props.dispatch({
    //     type: 'Map/setToolsActiveKey',
    //     payload: 'landLegend'
    // })
    if(jdName!==''){
      // this.addLandWMS();
    }
    if(jdName==='' || toolsActiveKey==="query"){
      return;
    }

    // if(jdName!=='' && toolsActiveKey!=="query"){
      this.props.dispatch({
        type: 'House/getParcelList',
        payload: {
          jdName:jdName,
        }
      })
    // }else{
    //   // 清空记录
    //   this.props.dispatch({
    //     type: 'House/setLandList',
    //     payload: {
    //       data:[],
    //     }
    //   })

    // }
    if(activeLandListId){
      this.handleScrollToElement(activeLandListId);
    }


    viewer.scene.globe.depthTestAgainstTerrain=false;
    // this.addWMS();
    this.handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    this.handler.setInputAction((event)=> {
      var position = event.position;
      var pickedObject = viewer.scene.pick(position);
      if(!pickedObject || !pickedObject.collection){
        this.removeFeature();
      }

    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
  }

  componentWillReceiveProps(newPorps){
    const {activeLandListId} =this.props.House;
    let newId=newPorps.House.activeLandListId;
    // const {activeId} =this.state;
    if(newId && activeLandListId!==newId){
      this.handleScrollToElement(newId);
      // console.log(newPorps);
      this.setState({
        activeId:newId
      });
    }

  }

  componentWillUnmount() {
    const {depthTest} = this.state;
    const {landWMS} =this.props.House;

    viewer.scene.globe.depthTestAgainstTerrain=depthTest;
    // this.removeData();
    // $('.mars3d-popup').remove();
    if(this.handler){
      this.handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK)//移除事件
    }
    if(this.iconLayer){
      viewer.dataSources.remove(this.iconLayer);
      this.iconLayer=null;
    }
    if(landWMS){
      // landWMS.setVisible(false);
      // landWMS.remove();
      // this.props.dispatch({
      //   type: 'House/setLandWMS',
      //   payload: ''
      // })
    }
    // viewer.mars.popup.removeFeatureForImageryLayer();//tab切换不清除高亮效果
    // this.props.dispatch({
    //     type: 'Map/setToolsActiveKey',
    //     payload: ''
    // })

  }

  

  // 点击地块后去查询
  getLandInfo= async(basicId,viewerPoint)=>{
    let landInfo= await getParcelById({"basicId":basicId});
    if(landInfo.success && landInfo.data){
      this.props.dispatch({
        type: 'House/setActiveLandListId',
        payload: landInfo.data.id
      })
      this.showPopupInfo(this.landPopup(landInfo.data.attributes),viewerPoint);
    }
  }

  showPopupInfo=(popup,viewerPoint)=>{
    let position=mars3d.point.getCurrentMousePosition(viewer.scene,viewerPoint);
    viewer.mars.popup.show({
      id: 'imageryLayerFeaturePromise',
      popup: popup,
    }, position, viewerPoint);
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
    // const {lastShowFeature} = this.state;
    if (this.lastShowFeature == null) return;
      viewer.dataSources.remove(this.lastShowFeature);
      this.lastShowFeature=null;
      this.setState({
        activeId:'',
      });
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
    // 构造feature
    viewer.mars.popup.removeFeatureForImageryLayer();//feature 统一放在mars中加载
    // if(!properties.type && !properties.properties){
    //   properties.type="Feature";
    //   properties.properties=properties;
    //   properties.geometry=JSON.parse(properties.shape)
    // }
    let geojsonObj={};
    geojsonObj.type="Feature";
    geojsonObj.geometry=JSON.parse(properties.location);
    geojsonObj.properties=properties.attributes
    this.showFeature(geojsonObj,showPop);
    // let coordinate=mars3d.pointconvert.gcj2wgs([location.lng, location.lat]);
    // viewer.camera.flyTo({
    //   destination: Cesium.Cartesian3.fromDegrees(parseFloat(properties.x),parseFloat(properties.y), 1000),
    // })
    this.setState({
      activeId:properties.id
    });
    this.props.dispatch({
      type: 'House/setActiveLandListId',
      payload: properties.id || '',
    })
    this.props.dispatch({
      type: 'House/setParcelId',
      payload: properties.basicId
    })
  }

  // 显示几何-列表数据
  showFeature= async (feature,showPop)=>{
    this.unhightLight();
    this.removeExtraSource();
    // const {lastShowFeature} =this.state;
    if (feature == null) return;
    if (this.lastShowFeature !== null){
      viewer.dataSources.remove(this.lastShowFeature);
      this.lastShowFeature=null;
    };

    let buffere = turf.buffer(feature, 2.5, { units: 'meters', steps: 64 });

    // let options = {};
    let dataSource = await viewer.dataSources.add(Cesium.GeoJsonDataSource.load(buffere || feature, {
        clampToGround: true,
        stroke: Cesium.Color.RED.withAlpha(0.0),
        strokeWidth: 3,
        fill:new Cesium.Color.fromCssColorString("#2deaf7").withAlpha(0.0),
    }));
    // viewer.flyTo(dataSource);
      var newopt = {
        "color": "#FF0000",
        "width": 3,
        "opacity": 1.0,
        "lineType": "solid",
        "clampToGround": true,
        "outline": false
    };
   
    // var entity = viewer.entities.add(polyline);
    let entities=dataSource.entities.values;
    entities.map((entity,index)=>{
      var polyline = mars3d.draw.attr.polyline.style2Entity(newopt);
      polyline.positions = mars3d.draw.attr.polygon.getPositions(entity);
      if (entity.polygon) {
        entity.polyline=polyline;
      }
    })
    let entity=dataSource.entities.values[0];
    let polyPositions = entity.polygon.hierarchy.getValue().positions;
    let polyCenter = Cesium.BoundingSphere.fromPoints(polyPositions).center;
    // polyCenter = Cesium.Ellipsoid.WGS84.scaleToGeodeticSurface(polyCenter);
    let height=150;
    viewer.scene.camera.flyToBoundingSphere(new Cesium.BoundingSphere(polyCenter,height*3), {
      duration: 2
    });
    // console.log(dataSource.entities);
    // if(showPop){
    //   let entity=dataSource.entities.values[0];
    //   var polyPositions = entity.polygon.hierarchy.getValue().positions;
    //   var polyCenter = Cesium.BoundingSphere.fromPoints(polyPositions).center;
    //   polyCenter = Cesium.Ellipsoid.WGS84.scaleToGeodeticSurface(polyCenter);
    //   this.addIconLabel(polyCenter,entity.popupStr);
    //   // this.showPopup(entity,polyCenter);
    // }
    // this.lastShowFeature=dataSource;
    this.setExtraSource(dataSource);

    // this.setState({
    //   lastShowFeature: dataSource
    // })
  }

  showPopup=(entity,cartesian)=>{
    viewer.mars.popup.show(entity, cartesian);
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

  


  removeData = () => {
    // const {dataSource} = this.state;
    if(this.lastShowFeature){
      viewer.dataSources.remove(this.lastShowFeature);
      this.lastShowFeature=null;
    }
    this.removeExtraSource();

  }

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

  search=(value)=>{
    const {jdName} =this.props.House;
    if(jdName===''){
      return;
    }
    if(value===''){
      this.props.dispatch({
        type: 'House/getParcelList',
        payload: {
          jdName:jdName,
        }
      })
      return;
    }
    // 数据过滤
    this.props.dispatch({
      type: 'House/getParcelById',
      payload: {
        basicId:value,
      }
    })
  }

  handleScrollToElement=(id)=> {
    if(!id){
      this.refList.current.listWrapper.scrollTop--;
      return;
    }
    this.setState({
      scrollToId : id
    })
  }

  OpenSpaceQuery=()=>{
    this.props.dispatch({
      type: 'Map/setToolsActiveKey',
      payload: "query"
    })
  }


  render() {
    const {landList,parcelCod} = this.props.House;
    const {activeId,scrollToId} = this.state;
    return (
      <>
      <div className={styles.box}>
        {/*<ModuleTitle title='地块列表' />*/}
{/*        <SearchPanel onSearch={this.search}>
          <div className={styles.spaceQuery}><span className={`iconfont icon_multiselect ${styles.icon}`} title='框选' onClick={() => this.OpenSpaceQuery()} /></div>
        </SearchPanel>*/}
        <div className={styles.table}>
          <ListView
            ref={this.refList}
            source = {landList}
            scrollToId  = {this.state.scrollToId}
            renderItem = {({item,index,style})=>(
              <div className={(item.id===scrollToId)? styles.row +' '+styles.active :styles.row} data={index} key={index} id={item.id} style={{...style}} onClick={() => this.flyTo(item,true)}>
                <div className={styles.blank}></div>
                <div className={styles.num}>{index+1}</div>
                <div className={styles.name}>{item.basicId}</div>
                <div className={styles.state} title={item.attributes.luFunction}>{item.attributes.luFunction}</div>
                <div className={styles.state}>{item.attributes.luArea?parseFloat(item.attributes.luArea).toFixed(3):0.0} m&sup2;</div>
              </div>
            )}
          ></ListView>
        </div>
      </div>
      {/* {
          parcelCod && <ParcelInfo parcelCod={parcelCod}/>
        } */}
      </>
    );
  }
}

export default EntityForParcel
