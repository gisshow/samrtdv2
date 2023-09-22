/* global Cesium */
/* global viewer */
/* global mars3d */
import React, { Component } from 'react'
import styles from './styles.less'
import { connect } from 'dva';
import {message } from 'antd';
import SearchPanel from '@/components/searchPanel';
import { request } from '@/utils/request';
import { PUBLIC_PATH } from '@/utils/config';
import iconUrl from './location.png'
const Ajax = require('axios');
let APIURL={};//地址反查接口

@connect(({ House,Home }) => ({
  House,Home
}))
class CoordinateSearch extends Component {

  constructor(props){
    super(props);
    this.state={
      activeKey:"",
      historyList:[],
      isFocus:false
    }
    this.dataSources=[];
    this.currentMarker=null;

  }

  async componentWillMount(){
    let result = await Ajax.get(`${PUBLIC_PATH}config/api.json`);
    let data=result.data;
    if(data){
      APIURL=data.standard_address.url;
    } 
  }

  componentWillUnmount=()=>{
    // this.handler && this.handler.destroy();
    this.removeDataSources();

    this.currentMarker && viewer.entities.remove(this.currentMarker);
    this.currentMarker=null;

}


  search = (value) => {
    // 校验经纬度坐标，限定深圳范围，中文坐标的格式
    var coord=this.getCoordinate(value);
    if(coord && Number(coord[0]) && Number(coord[1])){
      // 创建图标定位到指定坐标点
      // 查询推荐的标准地址，并且上图
      if(Number(coord[0])>180 || Number(coord[1])>90 || Number(coord[0])<0 || Number(coord[1])<0){
        return message.error("经纬度坐标超出范围！");
      }
      this.getAddress(Number(coord[0]),Number(coord[1]));
      this.updateMarker(Number(coord[0]),Number(coord[1]));
    }else{
      message.error("经纬度坐标格式错误！");
    }
  }

  getAddress=async(jd,wd)=>{
    // 删除之前匹配项
    this.removeDataSources();
    //获取数据
    let addressInfo =await Ajax(APIURL+jd+'/'+wd+'?n=3&type=building',{
      headers:{
        "token":window.localStorage.getItem('token'),
        "szvsud-license-key":window.localStorage.getItem('baseMapLicenseKey')
      }
    });
    if(addressInfo.data && addressInfo.data.status==="ok" && addressInfo.data.result){
        this.addMarker(addressInfo.data.result);
        // addressInfo.result.forEach(item=>{
        //   // 将最匹配的记录标准地址回填到详情
        //   // 加载查询的地址图标。图标监听事件
        //   item.location = {
        //     lng:parseFloat(item.xvalue),
        //     lat:parseFloat(item.yvalue)
        //   }
        // })
        // this.getAlldataList(data.data);
    } 
  }

  // 添加反查地址标记--当前点击的点是否需要添加
  addMarker=(addressList)=>{

    let dataSource=new Cesium.CustomDataSource('address_point');
    viewer.dataSources.add(dataSource);
    this.dataSources.push(dataSource);
    for (let index = 0; index < 3; index++) {
      if(!addressList[index]){
        break;
      }
      const item = addressList[index];
      
      // var position = Cesium.Cartesian3.fromDegrees(item.x, item.y);
      var cato = Cesium.Cartographic.fromDegrees(item.x, item.y);
      var height = viewer.scene.sampleHeight(cato) || 0;
      // 事实获取高度--
      dataSource.entities.add({
        name:"address_point",
        position: Cesium.Cartesian3.fromDegrees(item.x, item.y,height+0.8),
        point: {
            color: new Cesium.Color.fromCssColorString("#3388ff"),
            pixelSize: 10,
            outlineColor: new Cesium.Color.fromCssColorString("#ffffff"),
            outlineWidth: 2,
            disableDepthTestDistance: Number.POSITIVE_INFINITY, //一直显示，不被地形等遮挡 
        },
        tooltip: "<span style='color:#ffffff;'>"+item.full_name+"</span>",
      });
    }
    // viewer.flyTo(dataSource);
  }

  updateMarker=(jd,wd)=>{
    // let dataSource=new Cesium.CustomDataSource('address_current');
    // viewer.dataSources.add(dataSource);
    // this.dataSources.push(dataSource);
    // var position = Cesium.Cartesian3.fromDegrees(jd,wd);
    var cato = Cesium.Cartographic.fromDegrees(jd, wd);
    var height = viewer.scene.sampleHeight(cato);
    if(!height || height<0){
      height=6;
    }
    var position=Cesium.Cartesian3.fromDegrees(jd,wd,height);
    if (this.currentMarker == null) {
      this.currentMarker = viewer.entities.add({
            name: 'address_current',
            position: position,
            billboard:{
              image: iconUrl,//'./config/images/mark/250000.png',
              scale: 0.8, //原始大小的缩放比例
              horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
              verticalOrigin: Cesium.VerticalOrigin.CENTER,
              heightReference: Cesium.HeightReference.NONE,
              width:44,
              height:60,
              color:Cesium.Color.RED,
              scaleByDistance: new Cesium.NearFarScalar(1.5e2, 1.0, 8.0e6, 0.2),
              // distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0.0, 50000),
              disableDepthTestDistance: Number.POSITIVE_INFINITY
            },
            // point: {
            //     color: new Cesium.Color.fromCssColorString("#dd4b39"),
            //     pixelSize: 10,
            //     outlineColor: new Cesium.Color.fromCssColorString("#ffffff"),
            //     outlineWidth: 2,
            //     disableDepthTestDistance: Number.POSITIVE_INFINITY, //一直显示，不被地形等遮挡 
            // },
        });
    }
    else {
      this.currentMarker.position = position;
    }

    viewer.scene.camera.flyToBoundingSphere(new Cesium.BoundingSphere(position,400),{
      complete:()=>{
        //重新更新位置
      //   setTimeout(()=>{
      //     var cato = Cesium.Cartographic.fromDegrees(jd, wd);
      //     var height = viewer.scene.sampleHeight(cato);
      //     if(!height || height<0){
      //       height=6;
      //     }
      //     var position=Cesium.Cartesian3.fromDegrees(jd,wd,height);
      //     this.currentMarker.position = position;
      //   },5000)
        
      }
    });
  }


  getCoordinate=(str)=>{
    var temp = str.split(/[,，\/]/g);
    for (let i = 0; i < temp.length; i++) {
      if(temp[i] ==""){
        temp.splice(i,1);
        i--;
      }
    }
    if(temp.length!==2){
      return false;
    }
    return temp;
  }
  

  onChange=(value)=>{
    // if (value==='') {
    //   this.onFocus()
    // }else{
    //   // 清除历史列表
    //   this.setState({
    //     ...this.state,
    //     historyList:[],
    //   })
    //   // 执行查询
    //   this.props.dispatch({
    //     type:'House/getSearchPrevList',
    //     payload:{
    //       keyword:value,
    //     }
    //   })
    // }
  }
  //显示历史
  onFocus=()=>{
    // console.log('onfocus')
    // 记录搜索历史，存储在localStorage中
    // let history=window.localStorage.getItem('searchHistory');
    // if(!history) return;
    // // if(history){
    // history=JSON.parse(history);
    // // }
    // history=Array.from(new Set(history.reverse()));//数组去重
    // this.setState({
    //   ...this.state,
    //   isFocus:true,
    //   historyList:history,
    // })
    // // let result=history.slice(-10);
    // // result=JSON.stringify(result);
    // // window.localStorage.setItem('searchHistory',result);
  }
  onBlur=()=>{
    // this.setState({
    //   ...this.state,
    //   isFocus:false,
    // })
  }
  
  



  clearList=()=>{
    // this.setState({
    //   historyList:[],
    // })
    // this.props.dispatch({
    //   type:"House/setSearchList",
    //   payload:{
    //     data:[],
    //   }
    // })
    // localStorage.removeItem('searchHistory')
    // this.removeExtraSource();
  }



removeDataSources=()=>{
  this.dataSources.forEach((dataSource)=>{
    viewer.dataSources.remove(dataSource);
  })
  this.dataSources=[];
}

  

  render() {
    return (
      <>
        <div className={styles.searchBox}>
          <SearchPanel onSearch={this.search} placeholder="请输入经纬度坐标,eg:113.453,23.4567" onRefs={node=>this.searchPanel=node}></SearchPanel>
        </div>
      </>
    );
  }
}

export default CoordinateSearch;
