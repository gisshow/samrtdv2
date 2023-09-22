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
  }

  componentWillReceiveProps(newPorps){
    const {houseId} =this.props.House;
    let newHouseId=newPorps.House.houseId;
    
    if(newHouseId && houseId!==newHouseId){
      this.getRoomInfo(newHouseId);
    }
  }
  getRoomInfo= async(houseId)=>{
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

  
  close=()=>{
    this.props.dispatch({
      type: 'House/setHouseId',
      payload: '',
    })
  }
  render() {
    const {roomInfo={}}=this.state;
    return (
      <>
        <div className={styles.box}>
        {/* <div className={styles.close} onClick={()=>{this.close()}}>+</div> */}
          <div className={styles.scrollBox}>
            <div className={styles.content}>
            <div className={styles.item}>
                  <span className={styles.name}>房屋编码:</span>
                  <span className={styles.value}>{roomInfo.houseId}</span>
                </div>
                <div className={styles.item}>
                  <span className={styles.name}>房号:</span>
                  <span className={styles.value}>{roomInfo.roomName}</span>
                </div>
               
                <div className={styles.item}>
                  <span className={styles.name}>所属楼层:</span>
                  <span className={styles.value}>{roomInfo.houseFl}</span>
                </div>
                <div className={styles.item}>
                  <span className={styles.name}>房屋地址:</span>
                  <span className={styles.value}>{roomInfo.certAddr}</span>
                </div>
                <div className={styles.divider}></div>
                <div className={styles.item}>
                  <span className={styles.name}>房屋性质:</span>
                  <span className={styles.value}>{roomInfo.houseUseName}</span>
                </div>  
                <div className={styles.item}>
                  <span className={styles.name}>户型:</span>
                  <span className={styles.value}>{roomInfo.houseType}房</span>
                </div>  
                <div className={styles.item}>
                  <span className={styles.name}>房屋面积:</span>
                  <span className={styles.value}>{roomInfo.houseArea} m&sup2;</span>
                </div> 
            </div>
          </div>
        </div>
      </>
    );
  }
}

export default RoomInfo;
