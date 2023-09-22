/* global Cesium */
/* global viewer */
/* global mars3d */
/* global turf */
import React, { Component } from 'react'

import styles from './styles.less';
import { connect } from 'dva';
import {getBuild3DUrl,getBuildById} from '@/service/house';
let count = 0;//点击次数

@connect(({ House }) => ({
  House
}))
class BuildingInfo extends Component {

  constructor(props){
    super(props);
    this.state = {
      buildingInfo :{},
      houseHoldInfo:[],
      buildingId:undefined,
    }
  }

  componentDidMount() {
    const {basicId}=this.props;
    this.getBuildInfo(basicId);
    // this.getBuilding3DUrl();
  }

  // componentWillUnmount(){
  //   this.handleData(true);
  // }

  componentWillReceiveProps(newPorps){
    const {bldgNo} =this.props.House;
    let newBldgNo=newPorps.House.bldgNo;
    
    if(newBldgNo && bldgNo!==newBldgNo){
      this.getBuildInfo(newBldgNo);
    }
  }
  // 点击地块后去查询
  getBuildInfo= async(basicId)=>{
    const {info} =this.props;
    const { bldgKey } = this.props.House;
    if(info){
      this.getBuilding3DUrl(info);
      this.setState({
        buildingInfo:info.attributes,
      });
    }else{
      let buildInfo= await getBuildById({"basicId":basicId,bldgKey:bldgKey});
      if(buildInfo.success && buildInfo.data){
        //根据objectid联动列表
        this.props.dispatch({
          type: 'House/setActiveBuildListId',
          payload: [buildInfo.data.id]
        })
        this.props.dispatch({
          type: 'House/setBldgHeight',
          payload: buildInfo.data.attributes.bldgHeight || 110
        })
        
        this.setState({
          buildingInfo:buildInfo.data.attributes,
        });
        this.getBuilding3DUrl(buildInfo.data);
      }else{
        this.setState({
          buildingInfo:{},
          houseHoldInfo:[]
        });
        // this.close();
      }
    }
    
    
  }

  getBuilding3DUrl=async (data)=>{
    let basicBldgId=data.attributes.basicBldgId;
    let buildUrl = await getBuild3DUrl({ buildingId:basicBldgId});
    if (buildUrl.status==="ok" && buildUrl.result.total!==0) {
      let subBuildIds=[];
      buildUrl.result.data.map((item,index)=>{
        let buildingId=item.attributes.buildingId;
        let name=buildingId.split('-');
        
        if(name.length>1){
          name=name[1]+"栋";
        }else{
          let name1=buildingId.split('_');
          name=name1[2] ? name1[2]+"栋" : "主楼";
        }
        subBuildIds.push({"name":name,"buildingId":buildingId});
      })
      this.setState({
        houseHoldInfo:subBuildIds
      });
      this.computeBldgHeight(data.location);
    }else{
      this.setState({
        houseHoldInfo:[]
      });
    }
  }

  // 计算倾斜模型的高度--根据矢量面采样取最大高度
  computeBldgHeight=(location)=>{
    let geo=JSON.parse(location);
    let polygon=undefined;
    if(geo.type==="Polygon"){
      polygon=turf.polygon(geo.coordinates);
    }else if(geo.type==="MultiPolygon"){
      polygon=turf.multiPolygon(geo.coordinates);
    }
    let bbox=turf.bbox(polygon);
    let points=turf.randomPoint(10,{bbox:bbox});
    // console.log(points);
    let features=points.features;
    let heights=[];
    for (let i = 0; i < features.length; i++) {
      const coordinates = features[i].geometry.coordinates;
      var position = Cesium.Cartesian3.fromDegrees(coordinates[0],coordinates[1]);
      let height=viewer.scene.sampleHeight(Cesium.Cartographic.fromCartesian(position));
      heights.push(height);
    }
    let bldgHeight=Math.max(...heights);
    this.props.dispatch({
      type: 'House/setBldgHeight',
      payload: bldgHeight || 110
    })
    // 1、根据多边形计算边界bbox（确保精度，判断点十分在多边形内）
    // 2、随机生成10个点，看效率
    // 3、遍历获取点位处的高度

  }
//开启分层分户模式
  openHouseHold=(buildingId)=>{
    // this.setState({
    //   buildingId:buildingId
    // });
    this.props.dispatch({
      type: 'House/setBuildingId',
      payload: buildingId,
    })
    
    this.props.dispatch({
      type: 'House/setHouseHoldModel',
      payload: true,
    })
    // this.handleData(false);
  }
//关闭分层分户模型
  closeHouseOld=()=>{
    
    this.props.dispatch({
      type: 'House/setHouseHoldModel',
      payload: false,
    })
    // this.handleData(true);
  }

  handleData=(flag)=>{
    const {buildWMS,buildSpecialWMS,landWMS}=this.props.House;
    if(buildWMS){
      buildWMS.setVisible(flag);
    }
    if(buildSpecialWMS){
      buildSpecialWMS.setVisible(flag);
    }
    if(landWMS){
      landWMS.setVisible(flag);
    }
  }
  close=()=>{
    this.props.dispatch({
      type: 'House/setBldgNo',
      payload: ""
    })
  }
  render() {
    const {buildingInfo={},houseHoldInfo=[],buildingId}=this.state;
    const {houseHoldModel} =this.props.House;
    return (
      <>
        <div className={styles.box}>
        {/* <div className={styles.close} onClick={()=>{this.close()}}>+</div> */}
          <div className={styles.scrollBox}>
            <div className={styles.content}>
              <div className={styles.item}>
                <span className={styles.name}>楼宇编码:</span>
                <span className={styles.value}>{buildingInfo.bldgNo}</span>
              </div>
              <div className={styles.item}>
                <span className={styles.name}>楼宇名称:</span>
                <span className={styles.value}>{buildingInfo.nowname}</span>
              </div>
              <div className={styles.item}>
                <span className={styles.name}>楼宇地址:</span>
                <span className={styles.value}>{buildingInfo.bldaddr}</span>
              </div>
              <div className={styles.divider}></div>
              <div className={styles.item}>
                <span className={styles.name}>楼宇面积:</span>
                <span className={styles.value}>{buildingInfo.floorArea} m&sup2;</span>
              </div>
              {/* <div className={styles.item}>
                <span className={styles.name}>性质/用途:</span>
                <span className={styles.value}>{buildingInfo.bldgUsageName}</span>
              </div> */}
              <div className={styles.item}>
                <span className={styles.name}>建设状态:</span>
                <span className={styles.value}>{buildingInfo.bldcondName}</span>
              </div>
              <div className={styles.item}>
                <span className={styles.name}>楼宇高度:</span>
                <span className={styles.value}>{buildingInfo.bldgHeight}</span>
              </div>
              <div className={styles.item}>
                <span className={styles.name}>楼宇结构:</span>
                <span className={styles.value}>{buildingInfo.bldstruName}</span>
              </div>
              
            </div>
          </div>
          {
            houseHoldInfo && (
                <div className={styles.footer}>
                  {
                    (houseHoldInfo.length===1) && (<button onClick={() => this.openHouseHold(houseHoldInfo[0].buildingId)}>加载分层分户模型</button>)
                    
                  }
                  {
                     houseHoldInfo.length!==1 && (houseHoldInfo.map((item,index)=>{
                      return <span key={index} onClick={() => this.openHouseHold(item.buildingId)}>{item.name}</span>
                    }))
                    
                  }
                </div>
            )
          }
          
        </div>
        {/* {houseHoldModel && <HouseOld basicBldgId={buildingId} close={this.closeHouseOld}/>} */}
      </>
    );
  }
}

export default BuildingInfo;
