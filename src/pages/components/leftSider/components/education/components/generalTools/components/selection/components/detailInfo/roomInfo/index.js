/* global Cesium */
/* global viewer */
/* global mars3d */

import React, { Component } from 'react'

import styles from './styles.less';
import { connect } from 'dva';
import {getRoomById} from '@/service/house';
let count = 0;//点击次数

@connect(({ House }) => ({
  House
}))
class RoomInfo extends Component {

  constructor(props){
    super(props);
    this.state = {
      roomInfo :{},
    }
  }

  componentDidMount() {
    const {houseId}=this.props;
    this.getRoomInfo(houseId);
    // this.getBuilding3DUrl();
    this.props.dispatch({
      type:'House/setHasHold',
      payload:false,
    })
  }

  componentWillReceiveProps(newPorps){
    const {houseId} =this.props.House;
    let newHouseId=newPorps.House.houseId;
    
    if(newHouseId && houseId!==newHouseId){
      this.getRoomInfo(newHouseId);
    }
  }
  getRoomInfo= async(houseId)=>{
    const {info} =this.props;
    if(info && info.attributes && info.attributes.houseId===houseId){
      if(!info.attributes.houseId){
        info.attributes.houseId=info.basicId;
      }
      this.setState({
        roomInfo:info.attributes,
      });
    }else{
      let roomInfo= await getRoomById({basicId:houseId});
      if(roomInfo.success && roomInfo.data){
        // 高亮列表中的记录，basichouseid
        this.props.dispatch({
            type: 'House/setActiveRoomListId',
            payload: roomInfo.data.id,
        })
        if(!roomInfo.data.attributes.houseId){
          roomInfo.data.attributes.houseId=roomInfo.data.basicId;
        }
        this.setState({
          roomInfo:roomInfo.data.attributes,
        });
      }else{
        this.setState({
          roomInfo:{},
        });
        // this.close();
      }
    }
    
  }

  
  close=()=>{
    this.props.dispatch({
      type: 'House/setHouseId',
      payload: '',
    })
  }
  goBuilding=()=>{
    //点击房屋信息进入房屋详情
    this.props.dispatch({
      type: 'House/setDetailHeightset',
      payload: false,
    })
    //弹出地块详情，清除列表高亮效果，清空地图高亮效果
    this.props.dispatch({
      type:'House/setDetailType',
      payload:{
        isRenderDetail:true,
        type:"building",
        title:"楼栋",
      }
    })
    this.props.dispatch({
      type: 'House/setActiveRoomListId',
      payload: -1,
    })
    this.showExtraSource();
    this.props.dispatch({
      type: 'House/setHouseHoldModel',
      payload: false,
    })
  }
  goParcel=()=>{
    //弹出地块详情，清除列表高亮效果，清空地图高亮效果
    this.props.dispatch({
      type:'House/setDetailType',
      payload:{
        isRenderDetail:true,
        type:"land",
        title:"土地",
      }
    })
    this.props.dispatch({
      type: 'House/setActiveBuildListId',
      payload: [-1],
    })
    this.removeBuildingExtraSource();
    this.props.dispatch({
      type: 'House/setHouseHoldModel',
      payload: false,
    })
  }

  removeBuildingExtraSource=()=>{
    const {extraSource}=this.props.House;
    if(extraSource && extraSource.length!==0 ){
      extraSource.forEach(item => {
        item.show=true;
        if(item.name.substr(0,5)=="build"){
          viewer.dataSources.remove(item);
        }
      })
    }
  }
  showExtraSource=()=>{
    const {extraSource}=this.props.House;
    if(extraSource && extraSource.length!==0 ){
      extraSource.forEach(item => {
        item.show=true;
      });
    }    
  }

  render() {
    const {roomInfo={}}=this.state;
    const {parcelCod} = this.props.House;
    return (
      <>
        <div className={styles.box}>
        {/* <div className={styles.close} onClick={()=>{this.close()}}>+</div> */}
          {/* <div className={styles.scrollBox}> */}
            <div className={styles.content}>
                <div className={styles.item}>
                  <span className={styles.name}>房屋编码:</span>
                  <span className={styles.value}>{roomInfo.houseId}</span>
                </div>
                <div className={styles.group}>
                  <div className={styles.item}>
                    <span className={styles.name}>房号:</span>
                    <span className={styles.value}>{roomInfo.roomName}</span>
                  </div>
                
                  <div className={styles.item}>
                    <span className={styles.name}>楼层:</span>
                    <span className={styles.value}>{roomInfo.houseFl}</span>
                  </div>

                </div>
                
                {/* <div className={styles.item}>
                  <span className={styles.name}>房屋地址:</span>
                  <span className={styles.value}>{roomInfo.certAddr}</span>
                </div> */}
                {/* <div className={styles.divider}></div> */}
                <div className={styles.group}>
                  <div className={styles.item}>
                    <span className={styles.name}>房屋性质:</span>
                    <span className={styles.value}>{roomInfo.bldattrName}</span>
                  </div>  
                  <div className={styles.item}>
                    <span className={styles.name}>建筑面积:</span>
                    <span className={styles.value}>{roomInfo.houseArea} m&sup2;</span>
                  </div> 
                </div>
                {/* <div className={styles.item}>
                  <span className={styles.name}>户型:</span>
                  <span className={styles.value}>{roomInfo.houseType}房</span>
                </div>   */}
                
            </div>
          {/* </div> */}
          <div className={styles.footer}>
            <span className={styles.btn} onClick={()=>this.goBuilding()}>查看所在楼宇信息</span>
            { parcelCod && <span className={styles.btn} onClick={()=>this.goParcel()}>查看所在地块信息</span>}
          </div>
          
        </div>
      </>
    );
  }
}

export default RoomInfo;
