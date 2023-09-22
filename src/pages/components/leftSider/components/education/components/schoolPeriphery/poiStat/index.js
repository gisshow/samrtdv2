/* global Cesium */
/* global viewer */
import React, { Component } from 'react'
import DataPanel from '../../dataPanel'
import SplitLine from '@/components/splitLine'
import { connect } from 'dva'
import {coordinatesArrayToCartesianArray,locationToBuffer,locationToPolygon,debounces} from '@/utils/index';
@connect(({House }) => ({
  House
}))
class POIStat extends Component {
  constructor(props){
    super(props);
    this.debouncesUpdate=debounces(this.updatePOIStat,500);
  }
  
  //滑动条回调防抖，更新缓冲范围
  onChangeBoundary=(value)=>{
    this.debouncesUpdate(value);
  }

  componentWillReceiveProps(nextProps) {
    if(this.props.gap!==nextProps.gap){
      if(nextProps.gap){
        // console.log('ddsad',this.props.gap,nextProps.gap)
        this.debouncesUpdate(nextProps.gap)
      }
    } 
  }

  updatePOIStat=(distance)=>{
    const {info:location}=this.props;
    if(!location)  return;
    let dataParam={};
    if(location.indexOf("geo")!=-1 || location.indexOf("circle")!=-1){
      dataParam=JSON.parse(location);
    }else{
      dataParam={"geo":"POLYGON(("+locationToPolygon(location,distance)+"))"};
    }
    // let dataParam={"geo":"POLYGON(("+locationToPolygon(location,distance)+"))"};
    // 更新poi统计数据，缓冲的计算
    this.props.dispatch({
      type: 'House/getPOIStatisticsBySpace',
      payload: dataParam
    })

    //更新poilist
    this.props.dispatch({
      type: 'House/getPOIList',
      payload: dataParam
    })

    if(location.indexOf("geo")==-1 && location.indexOf("circle")==-1){
      let buffereGeo=locationToBuffer(location,distance);
      this.showBuffereFeature(buffereGeo);
    }

    // return coordinates.toString();
    // let buffere = turf.buffer(polygon, 100, { units: 'meters', steps: 64 });
    // console.log(location,buffere);
    // this.showLandFeature(buffere);
    // 地图上效果的展示
    // 页面跳转
  }

  showBuffereFeature=(location)=>{
    let dataSource=new Cesium.CustomDataSource('buffer');
    viewer.dataSources.add(dataSource);
    let positions=[];
    // let location={};
    // try {
        // location=JSON.parse(item.location);
        // hole=JSON.parse(holeGeometry);
      if(location.type==="MultiPolygon"){
          positions = location.coordinates[0][0];
      }else if(location.type==="Polygon"){
          positions = location.coordinates[0];
      }
    // } catch (error) {
    //     console.log(item.location);
    // }
    dataSource.entities.add({
      polyline:{
          positions : coordinatesArrayToCartesianArray(positions),
          material:Cesium.Color.fromCssColorString('#8EE0F8'),
          classificationType:Cesium.ClassificationType.BOTH,
          clampToGround:true,
          width:2,
      },
      polygon:{
        hierarchy : {
          positions : coordinatesArrayToCartesianArray(positions),
        },
        material:Cesium.Color.fromCssColorString("#13B7E9").withAlpha(0.5),
        classificationType:Cesium.ClassificationType.BOTH,
        clampToGround:true,
        width:2,
      },
      
    });
    this.removeExtraSource();
    this.setExtraSource(dataSource);
  }
  setExtraSource=(source)=>{

    const {extraSource}=this.props.House;
    let sources=(extraSource && extraSource.length!==0 ) ? extraSource.concat(source) : [source];
    
    this.props.dispatch({
      type: 'House/setExtraSource',
      payload: sources
    })
  }
  
  componentWillUnmount(){
    this.removeExtraSource();
  }

  removeExtraSource=()=>{
    const {extraSource}=this.props.House;
    if(extraSource && extraSource.length!==0 ){
      extraSource.forEach(item => {
        item.name==="buffer" && viewer.dataSources.remove(item);
      });
    }
  }
  onExpand=(value)=>{
    this.props.onExpand && this.props.onExpand(value);
  }
  render (){
    const {POIQueryStatistics} = this.props.House;
    const {radius,isExpand=true} = this.props;
    return (
      <>
          {
            POIQueryStatistics && <DataPanel 
                data={POIQueryStatistics} 
                type="Bar" height={300} 
                padding={[0 ,20 ,15 ,125]} 
                getGapvalue={this.props.getGapvalue.bind(this)}
                gap={this.props.gap}
                onChangeBoundary={(value)=>this.onChangeBoundary(value)} 
                radius={radius} 
                isExpand={isExpand} 
                onExpand={(value)=>this.onExpand(value)}/>}
                <SplitLine/>
      </>
    );
  }
}

export default POIStat