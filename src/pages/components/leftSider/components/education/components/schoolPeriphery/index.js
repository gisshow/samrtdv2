import React, { Component } from 'react';
import ModuleTitle from '@/components/moduleTitle';
import { Tabs, Slider, Row, Col, InputNumber} from 'antd';
import { connect } from 'dva';
import {coordinatesArrayToCartesianArray,locationToBuffer,locationToPolygon,debounces} from '@/utils/index';
import POIStat from './poiStat';
import PopulationStat from './population';
import style from './index.less';
import Bar from '../chart';
import POIList from  '../poi';
/* global Cesium */
/* global viewer */


@connect(({House }) => ({
  House
}))

class Region extends Component {
  constructor(props) {
    super(props);
    this.state= {
      inputValue: 1,
      isdDataExpand:true,
      range:100,
      statField: "age",//默认统计字段
      visible:true,
      gap:100,
    }
    // this.debouncesUpdate=debounces(this.updatePOIStat,500);
  }
  

  componentDidMount() {
    this.Updatalist(100)
  }

  componentWillMount() {
   
  }

  onChange = value => {
    this.setState({
        inputValue:value
     });
  }

  //滑动条回调防抖，更新缓冲范围
  onChangeBoundary=(value)=>{
    // this.debouncesUpdate(value);
    this.setState({
      range:value,
    })
  }

  Updatalist=(distance)=> {
    //方法：landLocation接收空间查询地实体数据landResult传入父组件schoolProperties的值
    const {landLocation}=this.props;
    if(!landLocation)  return;
    let dataParam={};
    let location=landLocation;
    if(location.indexOf("geo")!=-1 || location.indexOf("circle")!=-1){
      dataParam=JSON.parse(landLocation.data[0].location);
    }else{
      dataParam={"geo":"POLYGON(("+locationToPolygon(location,100)+"))"};
    }
    // const {info:location}=this.props.data;
    // if(!location)  return;
    // let dataParam={};
    // if(location.indexOf("geo")!=-1 || location.indexOf("circle")!=-1){
    //   dataParam=JSON.parse(location);
    // }else{
    //   dataParam={"geo":"POLYGON(("+locationToPolygon(location,distance)+"))"};
    // } 

    // // 更新poi统计数据，缓冲的计算
    // this.props.dispatch({
    //   type: 'House/getPOIStatisticsBySpace',
    //   payload: dataParam
    // })
    // //更新poilist
    // this.props.dispatch({
    //   type: 'House/getPOIList',
    //   payload: {
    //     geo:dataParam.geo,
    //   }
    // })
    // // 更新人口数据信息
    // this.props.dispatch({
    //   type: 'House/getPopulationStatistics',
    //   payload: dataParam
    // })
    //展示缓冲区
    if(location.indexOf("geo")==-1 && location.indexOf("circle")==-1){
      let buffereGeo=locationToBuffer(location,distance);
      this.showBuffereFeature(buffereGeo);
    }
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
  //InputNumber 数据发生变化回调幻术
  onInputChange=(value)=>{
    // this.debouncesUpdate(value);
    this.setState({
      range:value,
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

  onVisible=()=>{
    this.setState({
      visible:false,
    })
  }
  getGapvalue=(val)=>{
    this.setState({
      gap:val
   });
  }
  handle=(val)=>{
    this.props.getMsg(val)
  }

  render() {
    const {inputValue, isdDataExpand, range, statField,visible} =this.state;
    const {type,info} = this.props.data;
    const {POIQueryStatistics, statType,populationSchoolStat} = this.props.House;
  
    return (
      <div className={style.region}>
          {
            <Tabs defaultActiveKey='1' centered size="large" style={{'position': 'static','color':'#E0E9F6','overflow': visible ? 'hidden' : 'visible'}} onChange={(activeKey)=>{
              this.handle(activeKey);this.child.onShow();this.setState({visible:true,})
            }} >
              <Tabs.TabPane tab='周边信息' key='1'>
                {/* <DataPanel data={roomStatistic} type="Bar" isExpand={false}/> */}
                <div>
                  <div className={`${style.scrollBox} ${type==="query"?style.query:''}`}>
                    <POIStat info={info} radius={true} onExpand={(value)=>this.setState({isdDataExpand:value})} getGapvalue={this.getGapvalue.bind(this)} gap={this.state.gap}/>
                  </div>
                    <POIList isExpand= {isdDataExpand} onVisible={this.onVisible.bind(this)} onRef={(ref)=>{this.child=ref}}/>
                </div>
                {/* <div className={style.feters} onClick={()=>{this.props.changeName('schools')}}>
                    返回学校信息
                </div> */}
                <div className={style.footer}>
                  <div className={style.btn} onClick={()=>{this.props.changeName('schools')}}><span>返回详情信息</span></div>
                </div>
              </Tabs.TabPane>
              <Tabs.TabPane tab='人口信息' key='2'>
                <div>
                    {
                      <PopulationStat info={info} radius={true} onExpand={(value)=>this.setState({isdDataExpand:value})} getGapvalue={this.getGapvalue.bind(this)} gap={this.state.gap}/>
                    }
                    <div className={`${style.feters}  ${style.footertop}`} onClick={()=>{this.props.changeName('schools')}}>
                        返回学校信息
                    </div>
                </div>
              </Tabs.TabPane>
            </Tabs>
          }
      </div>
    );
  }
}

export default Region