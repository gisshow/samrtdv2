/* global Cesium */
/* global viewer */
/* global mars3d */
/* global $ */
/* global turf */
import React, { Component } from 'react';
import ModuleTitle from '@/components/moduleTitle'
import SplitLine from '@/components/splitLine'
import styles from './styles.less';
import {Checkbox,message,Modal} from 'antd';
import { PUBLIC_PATH } from '@/utils/config';
import { getMonitor,getMonitorSensor } from '@/service/house';


var htmlMonitorEntity,htmlMonitorMarker

window.showInfoWin=(ssss)=>{
  var content = JSON.parse(htmlMonitorMarker.content)
  let markerHtml = `<div class='marker' ><div class='${styles.marker_pophtml}'>`
  for(let i in content){
    markerHtml += `<div class='${styles.marker_pop_row}'><span>${i}:</span><span>${content[i]?content[i]:''}</span></div>`
  }
  markerHtml += `</div><div class='${styles.marker_pop_row}'><div class='${styles.marker_btn}' onclick="hideInfoWin(${123})">返回</div></div></div>`
  htmlMonitorEntity.popup.html = markerHtml
  $('.marker').empty()
  $('.marker').append(markerHtml)
  // htmlMonitorEntity=null;htmlMonitorMarker=null;
}
window.hideInfoWin=(ssss)=>{
  let marker = htmlMonitorMarker
  let markerHtml = `<div class='marker' ><div class='${styles.marker_pophtml}'>
  <div class='${styles.marker_pop_row}'><span>平台名称:</span><span>${marker.platFormName}</span></div>
  <div class='${styles.marker_pop_row}'><span>传感器名称:</span><span>${marker.deviceName}</span></div>
  <div class='${styles.marker_pop_row}'><span>传感器Code:</span><span>${marker.deviceCode}</span></div>
  <div class='${styles.marker_pop_row}'><span>传感器id:</span><span>${marker.id}</span></div>
  <div class='${styles.marker_pop_row}'><div class='${styles.marker_btn}' onclick="showInfoWin(${123})">详细信息</div></div>
</div></div>`
  htmlMonitorEntity.popup.html = markerHtml
  $('.marker').empty()
  $('.marker').append(markerHtml)
  // htmlMonitorEntity=null;htmlMonitorMarker=null;
}

class Monitoring extends Component {

  constructor(props) {
    super(props);
    this.state = {
      isShowBg:true,//是否显示背景
      monitor:[]
    }
  }

  componentDidMount() {
    this.monitorEntity=[];
    this.monitorArray=[]
    this.getMonitor();
  }


  componentWillUnmount() {
    this.removeAllMonitor()
  }

  componentWillReceiveProps(newPorps){

  }
  getMonitor=async ()=>{
    let monitor= await getMonitor();
    if(monitor&&monitor.data){
      this.setState({
        monitor: monitor.data,
      })
    }
  }

  toggleHouseBox = () => {
    this.setState({
      isShowBg: !this.state.isShowBg
    })
  }

  //添加温湿度、空气质量地址标记
  addMonitorSensor=(monitorSensor,index,indexs)=>{
    var html ;
    let monitorIndex = [];
    let id = 'monitor'+index+'-'+indexs
    let color = [
      Cesium.Color.fromCssColorString('#f31313'),
      Cesium.Color.fromCssColorString('#edf93d'),
      Cesium.Color.fromCssColorString('#7f0be8'),
      Cesium.Color.fromCssColorString('#06f52e'),
      Cesium.Color.fromCssColorString('#23ffec'),
      Cesium.Color.fromCssColorString('#06f592'),
      Cesium.Color.fromCssColorString('#1b0dea'),
      Cesium.Color.fromCssColorString('#edf93d'),
      Cesium.Color.fromCssColorString('#f327da'),
      Cesium.Color.fromCssColorString('#10bef3')
    ]
    if(monitorSensor.data==null || monitorSensor.data.length===0){
      message.error('传感器数据为空',1)
      return
    }
    for(var i=0;i<monitorSensor.data.length;i++){
      var marker = monitorSensor.data[i];
      var cato = Cesium.Cartographic.fromDegrees(Number(marker.geoX),Number(marker.geoY));
      var height = viewer.scene.sampleHeight(cato);
      height = isNaN(height) ? (70+0.001*(i+1)) : (height +0.001*(i+1))
      if(height<0){
        height=0;
      }
      html = this.getHtmlMonitorSensor(marker);
      var entitys = viewer.entities.add({
          id:marker.deviceCode,
          position: Cesium.Cartesian3.fromDegrees(Number(marker.geoX),Number(marker.geoY), height),
          point:{
            color: color[indexs],
            pixelSize:7, // default: 1
            outlineColor: Cesium.Color.WHITE, // default: BLACK
            outlineWidth: 2, // default: 0
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
          },
          click: (entity) => {//单击
            htmlMonitorEntity=entity;
            for(var i=0;i<monitorSensor.data.length;i++){
              var markers = monitorSensor.data[i];
              if(entity.id===markers.deviceCode){
                htmlMonitorMarker=markers;
                break
              }
            }
            console.log(window.hideInfoWin())
            entity.popup.html = html;
          },
          popup: {
            html:html,
            anchor: [0, 0],//定义偏移像素值 [x, y]
          },
          option:{
            latitude:marker.geoY,
            longitude:marker.geoX,
          },
          mouseover:function (entity) {
            entity.point.pixelSize._value=10
          },
          mouseout:function (entity){
            entity.point.pixelSize._value=7
          },
      });
      monitorIndex.push(entitys)
    }
    this.monitorEntity.push({id,monitorIndex})
  }

  getHtmlMonitorSensor=(marker)=>{
    let markerHtml = `<div class='marker' >
    <div class='${styles.marker_pophtml}'>
      <div class='${styles.marker_pop_row}'><span>平台名称:</span><span>${marker.platFormName}</span></div>
      <div class='${styles.marker_pop_row}'><span>传感器名称:</span><span>${marker.deviceName}</span></div>
      <div class='${styles.marker_pop_row}'><span>传感器Code:</span><span>${marker.deviceCode}</span></div>
      <div class='${styles.marker_pop_row}'><span>传感器id:</span><span>${marker.id}</span></div>
      <div class='${styles.marker_pop_row}'><div class='${styles.marker_btn}' onclick="showInfoWin(${123})">详细信息</div></div>
    </div>
    </div`
    return markerHtml
  }

  removeAllMonitor=(id)=>{
    if(id){
      this.monitorEntity.map(item=>{
        if(id===item.id){
          item.monitorIndex.map(items=>{
            viewer.entities.remove(items);
          })
        }
      })
    }else{
      this.monitorEntity.map(item=>{
          item.monitorIndex.map(items=>{
            viewer.entities.remove(items);
          })
      })
      this.monitorEntity=[];
      this.monitorArray=[];
    }
  }

  defaultChecked = (deviceTypes,index,indexs)=>{
    let id = 'monitor'+index+'-'+indexs;
    let name = deviceTypes.name;
    return this.monitorArray.indexOf({name,id})>-1
  }

  onChangeMonitor = async(e,platformId,deviceTypes,index,indexs) => {
    let id = 'monitor'+index+'-'+indexs;
    let name = deviceTypes.name;
    if(e.target.checked){
      let deviceType = deviceTypes.id;
      let sensorStore = {platformId,deviceType}
      let monitorSensor= await getMonitorSensor({sensorStore:sensorStore});
      this.monitorArray.push({name,id})
      this.addMonitorSensor(monitorSensor,index,indexs)
    }else{
      this.monitorArray.remove({name,id})
      this.removeAllMonitor(id);
    }
  }
  monitorListOpen=(index)=>{
    let items = this.state.monitor;
    let item = items[index];
    item.showMonitor = item.showMonitor?!item.showMonitor:true;
    if(!item.deviceTypes){
      item.showMonitor = false
      message.error('无传感器数据',1)
    }
    this.setState({
      listOpen: !this.state.listOpen,
    })
  }

  render() {
    const { monitor } = this.state;
    return (
      <div className={`${styles.houseBox} ${this.state.isShowBg ? styles.bgShow : styles.bgHide}`}>
        <div className={`${styles.mainStatBox}`} >
            <ModuleTitle title='监测专题'>
            </ModuleTitle>
        </div>
        <div  className={styles.scrollBox}>
          {
            monitor && monitor.map((item,index)=>{
              return <div key={index} >
                <div className={styles.monitorBox} >
                  <div>
                    {item.showMonitor?<span onClick={this.monitorListOpen.bind(this,index)} className={styles.iconMonitorJian}></span>:<span onClick={this.monitorListOpen.bind(this,index)} className={styles.iconMonitorJia}></span>}
                    <span onClick={this.monitorListOpen.bind(this,index)} style={{'cursor':'pointer','marginLeft':'10px'}} >{item.platFormName}</span></div>
                  {
                    item.showMonitor && item.deviceTypes && item.deviceTypes.map((items,indexs)=>{
                      return <div key={indexs} style={{'padding':'5px 0px 5px 20px'}} >
                        <Checkbox defaultChecked={this.defaultChecked(items,index,indexs)} onChange={(e)=>this.onChangeMonitor(e,item.platformId,items,index,indexs)} >
                          <span className={styles.monitorScopeBox}>{items.name}</span>
                        </Checkbox>
                      </div>
                    })
                  }
                </div>
                <SplitLine/>
              </div>
            })
          }
        </div>
        {
          this.state.isShowBg === true ? <div className={styles.hideBtn} onClick={this.toggleHouseBox}></div> :
          <div className={styles.text} onClick={this.toggleHouseBox}>监测专题</div>
        }
      </div>
    );
  }
}

export default Monitoring