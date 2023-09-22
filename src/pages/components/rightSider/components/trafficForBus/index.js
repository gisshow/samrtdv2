/* global Cesium */
/* global viewer */
/* global mars3d */
/* global $ */
import React, { Component } from 'react'
import ModuleTitle from '@/components/moduleTitle'
import styles from './styles.less';
// import { BUSDATA } from './busdata'
// import { lineDatas } from './linedata'
import line_11 from './data/line_11.json'
import line_26 from './data/line_26.json'
import line_204 from './data/line_204.json'
import line_211 from './data/line_211.json'
import line_307 from './data/line_307.json'
import line_334 from './data/line_334.json'
import line_606 from './data/line_606.json'
import line_610 from './data/line_610.json'
import line_802 from './data/line_802.json'
import line_939 from './data/line_939.json'
import station_11 from './data/station_11.json'
import station_26 from './data/station_26.json'
import station_204 from './data/station_204.json'
import station_211 from './data/station_211.json'
import station_307 from './data/station_307.json'
import station_334 from './data/station_334.json'
import station_606 from './data/station_606.json'
import station_610 from './data/station_610.json'
import station_802 from './data/station_802.json'
import station_939 from './data/station_939.json'
import BUSDATA from './data/bus.json'

const ICONMAP={
  "正常":{
    icon:require('./img/bus_green.png'),
    color:"green"
  },
  "较拥挤":{
    icon:require('./img/bus_orange.png'),
    color:"orange"
  },
  "非常拥挤":{
    icon:require('./img/bus_red.png'),
    color:"red"
  },
}

export default class TrafficForBus extends Component {


  state = {
    dataSource : new Cesium.CustomDataSource('bus'),
    depthTest:viewer.scene.globe.depthTestAgainstTerrain
  }

  componentDidMount() {
    const {dataSource} = this.state;
    viewer.scene.globe.depthTestAgainstTerrain=false;
    this.addlineData();
    this.addstationData();
    this.addbusData()
    viewer.dataSources.add(dataSource);
    viewer.flyTo(dataSource, { duration: 1 });
  }

  componentWillUnmount() {
    const {depthTest} = this.state;
    viewer.scene.globe.depthTestAgainstTerrain=depthTest;
    this.removeData();
    $('.cesium-popup').remove();
  }

  flyTo = (location) => {
    // let coordinate=mars3d.pointconvert.gcj2wgs([location.lng, location.lat]);
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(location.lng,location.lat, 1000),
    })
  }

  addbusData=()=>{
    const {dataSource} = this.state;
    BUSDATA.map((v, k) => {
      // let coordinate=mars3d.pointconvert.gcj2wgs([v.lng, v.lat]);
      dataSource.entities.add({
        position: Cesium.Cartesian3.fromDegrees(v.lng,v.lat),
        billboard: {
          image: ICONMAP[v.State] ? ICONMAP[v.State]["icon"]:require('./img/bus_green.png'),
          scale: 0.4,  //原始大小的缩放比例
          horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM, // default: CENTER
          heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND //CLAMP_TO_GROUND
        },
        popup :{
          html: `<div class="${styles.popup_bus}">
                    <div class="${styles.border_1} ${styles.border}"></div>
                    <div class="${styles.border_2} ${styles.border}"></div>
                    <div class="${styles.border_3} ${styles.border}"></div>
                    <div class="${styles.border_4} ${styles.border}"></div>
                    <div class="${styles.content}">
                      <div class="${styles.header}">
                        <span class="${styles.line}">${v.LineNum}</span>
                        <span class="${styles.status} ${ICONMAP[v.State] ?ICONMAP[v.State]["color"]:'green'}">${v.State}</span>
                      </div>
                      <div class="${styles.img}"></div>
                      <div class="${styles.item}">
                        <span class="${styles.name}">车牌号</span>
                        <span class="${styles.value}">${v.BusNum}</span>
                      </div>
                      <div class="${styles.item}">
                        <span class="${styles.name}">司机</span>
                        <span class="${styles.value}">${v.Dirver || ''}</span>
                      </div>
                      <div class="${styles.item}">
                        <span class="${styles.name}">允许载客量</span>
                        <span class="${styles.value}">${v.Max}</span>
                      </div>
                      <div class="${styles.item}">
                        <span class="${styles.name}">班次</span>
                        <span class="${styles.value}">${v.Time}</span>
                      </div>
                      <div class="${styles.item}">
                        <span class="${styles.name}">累计载客量</span>
                        <span class="${styles.value}">${v.Total}</span>
                      </div>
                      
                    </div>
                  </div>`,
          anchor: [0, -50]//定义偏移像素值 [x, y]
        }
      });
    })
  }

  addstationData=()=>{
    const {dataSource} = this.state;
    let stationDatas=[station_11,station_26,station_204,station_211,station_307,station_334,station_606,station_802,station_939,station_610];
    //站点信息
    for (let i = 0; i < stationDatas.length; i++) {
      let stations = stationDatas[i].stations;
      stations.map((v, k) => {
        // let coordinate=mars3d.pointconvert.gcj2wgs([v.location.lng, v.location.lat]);
        
        dataSource.entities.add({
          position: Cesium.Cartesian3.fromDegrees(v.location.lng,v.location.lat),
          billboard: {
            image: require('./img/bus_station.png'),
            scale: 0.4,  //原始大小的缩放比例
            horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
            verticalOrigin: Cesium.VerticalOrigin.BOTTOM, // default: CENTER
            heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND //CLAMP_TO_GROUND
          },
          popup :{
            html: `<div class="${styles.popup}">
                      <div class="${styles.border_1} ${styles.border}"></div>
                      <div class="${styles.border_2} ${styles.border}"></div>
                      <div class="${styles.border_3} ${styles.border}"></div>
                      <div class="${styles.border_4} ${styles.border}"></div>
                      <div class="${styles.content}">
                        <div class="${styles.name}">${v.name}</div>
                        <div class="${styles.info}">${v.id}</div>
                      </div>
                    </div>`,
            anchor: [0, -30]//定义偏移像素值 [x, y]
          }
        });
      })
      
    }
  }

  addlineData=()=>{
    let lineDatas=[line_11,line_204,line_211,line_26,line_307,line_334,line_606,line_606,line_610,line_802,line_939];
    const {dataSource} = this.state;
    //添加路线
    let coordinates=[];
    for (let i = 0; i < lineDatas.length; i++) {
      let linePoints = lineDatas[i].linePoints;
      linePoints.map((v,k)=>{
        // let coordinate=mars3d.pointconvert.gcj2wgs([v.location.lng, v.location.lat]);
        // coordinates.push(coordinate[0],coordinate[1]);
        coordinates.push(v.location.lng,v.location.lat);
      })
      dataSource.entities.add({
        name: lineDatas[i].name,
        polyline: {
          positions: Cesium.Cartesian3.fromDegreesArray(coordinates),
          width: 3,
          clampToGround:true
        }
      });
      coordinates=[];
    }
  }

  removeData = () => {
    const {dataSource} = this.state;
    viewer.dataSources.remove(dataSource);
  }


  render() {
    return (
      <div className={styles.box}>
        <ModuleTitle title='公交车列表' />
        <div className={styles.table}>
          {
            BUSDATA.map((v, k) => {
              return (
                <div className={styles.row} key={v.ID} onClick={() => this.flyTo(v)}>
                  <div className={styles.num}>{k+1}</div>
                  <div className={styles.name}>{v.BusNum}</div>
                  <div className={styles.line}>{v.LineNum}</div>
                  <div className={styles.state}>{v.State}</div>
                </div>
              )
            })
          }
        </div>
      </div>
    );
  }
}
