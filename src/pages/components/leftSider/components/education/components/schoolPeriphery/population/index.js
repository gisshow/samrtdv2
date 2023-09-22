/* global Cesium */
/* global viewer */
/* global mars3d */

import React, { Component } from 'react'
import { Slider, InputNumber} from 'antd';
import styles from './styles.less';
import {coordinatesArrayToCartesianArray,locationToBuffer,locationToPolygon,debounces} from '@/utils/index';
import Bar  from '@/components/Chart/Bar';
import { connect } from 'dva'  

@connect(({ House }) => ({
  House
}))

class PopulationStat extends Component {

  constructor(props){
    super(props);
    this.state = {
      OtherInfo :{},
      statField: "age",//默认统计字段
      // range:this.props.gap ? this.props.gap:100,
    }
    this.debouncesUpdate=debounces(this.updatePOIStat,500);
  }

  componentWillReceiveProps(nextProps) {
    if(this.props.gap!==nextProps.gap){
      if(nextProps.gap){
        this.debouncesUpdate(nextProps.gap)
      }
    } 
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
  
  //滑动条回调防抖，更新缓冲范围
  onChangeBoundary=(value)=>{
    this.debouncesUpdate(value);
    this.props.getGapvalue && this.props.getGapvalue(value);
    this.setState({
      range:value,
    })
  }

  //InputNumber 数据发生变化回调幻术
  onInputChange=(value)=>{
    this.debouncesUpdate(value);
    this.props.getGapvalue && this.props.getGapvalue(value);
    this.setState({
      range:value,
    })
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

    // 更新人口数据信息
    this.props.dispatch({
      // type: 'House/getPopulationStatistics',
      type: 'House/getPopulationSchoolStat',
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

  removeExtraSource=()=>{
    const {extraSource}=this.props.House;
    if(extraSource && extraSource.length!==0 ){
      extraSource.forEach(item => {
        item.name==="buffer" && viewer.dataSources.remove(item);
      });
    }
  }

  setExtraSource=(source)=>{
    
    const {extraSource}=this.props.House;
    let sources=(extraSource && extraSource.length!==0 ) ? extraSource.concat(source) : [source];
    
    this.props.dispatch({
      type: 'House/setExtraSource',
      payload: sources
    })
  }

  handleData=()=>{
    const {isShow}=this.state;
    this.setState({
      isShow:!isShow
    },()=>{
      this.props.handleData && this.props.handleData(this.state.isShow);
    })
  }
  //获取面积单位
  getAreaScale=(num)=>{
    let scale=1;
    if(num>10000 && num<1000000){
        scale=10000;
    }else if(num>1000000){
        scale=1000000;
    }
    return scale;
  }

  render() {
    const { range,statField } = this.state;
    const { House,}=this.props;
    const { populationStatistic,populationSchoolStat} = House;
    let chartData =undefined;
    if(populationSchoolStat){
      chartData = populationSchoolStat.chartData
    }
    return (
      <>
        <div className={styles.box}>
          {
             chartData ? (<>
              <div className={styles.title}>
                  <div className={styles.radius} onClick={this.handleData}>缓冲半径</div>
                  <div className={styles.slider}>
                    <Slider style={{width:'265px',marginLeft:0}} min={1} max={2000} value={this.props.gap} onChange={(value)=>this.onChangeBoundary(value)}/>
                    {/* <span className={styles.radius}>{range}m</span> */}
                    <InputNumber min={0} max={2000} style={{ marginLeft: 6,marginRight:10 }} step={1} value={this.props.gap}  onChange={(value)=>{this.onInputChange(value)}}/>
                  </div>
              </div>
              <div>
                <div className={styles.head}>
                  <div className={styles.item}>
                    <span className={styles.sum}>{chartData?(chartData.age.sum+"").replace(/(\d)(?=(\d{3})+$)/g,"$1,"):''}</span>
                    <span className={styles.name}>POI总数</span>
                    {
                        chartData && <Bar data={chartData[statField].stat} step={this.getAreaScale(chartData[statField].sum)} type={statField} height={240} padding={[0 ,20 ,15 ,80]}/>
                    }
                  </div>
                </div>
              </div> 
             </>):null
          }
        </div>
      </>
    );
  }
}

export default PopulationStat;
