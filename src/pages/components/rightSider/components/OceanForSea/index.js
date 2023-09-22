/* global Cesium */
/* global viewer */
/* global mars3d */
/* global $ */
import React, { Component } from 'react'
import ListView from '@/components/listView'
import ModuleTitle from '@/components/moduleTitle'
import styles from './styles.less';
import ColorRangeMaker from './ColorRangeMaker'
import POINTSDATA  from './data/point.json'

export default class OceanForSea extends Component {

  state = {
    dataSource : new Cesium.CustomDataSource('point'),
    depthTest:viewer.scene.globe.depthTestAgainstTerrain,
    activeId:"",
  }

  componentDidMount() {
    const {dataSource} = this.state;
    viewer.scene.globe.depthTestAgainstTerrain=false;
    // this.addlineData();
    // this.addstationData();
    this.addPointData()
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
  click=(properties)=>{
    this.setState({
      activeId:properties.ID || '',
    });
  }

  addPointData=()=>{
    const {dataSource} = this.state;
    const colorMaker=new ColorRangeMaker({color:[[0,0,125],[0,0,255],[0,200,0],[0,255,0],[255,255,0],[255,180,0],[255,0,0]],value:[-188,-130,-90,-60,30,100,170]});
    POINTSDATA.map((v, k) => {
      const color=colorMaker.make(parseFloat(v.value));
      dataSource.entities.add({
        position: Cesium.Cartesian3.fromDegrees(v.lng,v.lat),
        point:{
          color:Cesium.Color.fromBytes(color[0],color[1],color[2]),
          pixelSize:8
        },
        popup :{
          html: `<div class="${styles.popup_sea}">
                    <div class="${styles.border_1} ${styles.border}"></div>
                    <div class="${styles.border_2} ${styles.border}"></div>
                    <div class="${styles.border_3} ${styles.border}"></div>
                    <div class="${styles.border_4} ${styles.border}"></div>
                    <div class="${styles.content}">
                      <div class="${styles.header}">
                        <span class="${styles.name}">测点序号:</span>
                        <span class="${styles.value}">${v.ID}</span>
                      </div>
                      
                      <div class="${styles.item}">
                        <span class="${styles.name}">当前测值:</span>
                        <span class="${styles.value} ${styles.green}">${v.value}</span>
                      </div>
                      <div class="${styles.item}">
                        <span class="${styles.name}">站点名称:</span>
                        <span class="${styles.value}">${v.Name}</span>
                      </div>
                      <div class="${styles.item}">
                        <span class="${styles.name}">海岸:</span>
                        <span class="${styles.value}">${v.SeaCoast}</span>
                      </div>
                      <div class="${styles.item}">
                        <span class="${styles.name}">Section:</span>
                        <span class="${styles.value}">${v.Section}</span>
                      </div>
                      <div class="${styles.item}">
                        <span class="${styles.name}">ForcastStation:</span>
                        <span class="${styles.value}">${v.ForcastStation}</span>
                      </div>
                      <div class="${styles.item}">
                        <span class="${styles.name}">所在地块:</span>
                        <span class="${styles.value}">${v.land}</span>
                      </div>
                      <div class="${styles.item}">
                        <span class="${styles.name}">区县:</span>
                        <span class="${styles.value}">${v.district}</span>
                      </div>
                      
                    </div>
                  </div>`,
          anchor: [0, -30]//定义偏移像素值 [x, y]
        }
      });
    })
  }

  removeData = () => {
    const {dataSource} = this.state;
    viewer.dataSources.remove(dataSource);
  }


  render() {
    const {activeId} = this.state;
    return (
      <>
      <div className={styles.box}>
        <div className={styles.table} ref={this.refList}>
          {
            // POINTSDATA.map((v, k) => {
            //   return (
            //     <div className={styles.row} key={v.ID} onClick={() => this.flyTo(v)}>
            //       <div className={styles.blank}></div>
            //       <div className={styles.num}>{v.ID}</div>
            //       <div className={styles.name}>{v.Name}</div>
            //       <div className={styles.state}>{v.value}</div>
            //     </div>
            //   )
            // })
            <ListView
            source = {POINTSDATA}
            scrollToId  = {this.state.scrollToId}
            renderItem = {({item,index,style})=>(
              <div className={(item.ID===activeId)? styles.row +' '+styles.active :styles.row} key={index}  id={item.id} style={{...style}}  onClick={() => this.click(item)}>
                <div className={styles.blank}></div>
                <div className={styles.num}>{item.ID}</div>
                <div className={styles.name} title={item.name}>{item.Name}</div>
                <div className={styles.state}>{item.value}</div>
              </div>
            )}
          ></ListView>
          }
        </div>
      </div>
      <div className={styles.colorBar}></div>
      </>
    );
  }
}

