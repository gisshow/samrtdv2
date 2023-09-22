/* global Cesium */
/* global viewer */
/* global mars3d */

import React, { Component } from 'react'
import styles from './styles.less';
import { connect } from 'dva';
import {getParcelById} from '@/service/house';

@connect(({ House }) => ({
  House
}))
class ParcelInfo extends Component {

  constructor(props){
    super(props);
    this.state = {
      parcelInfo :{},
    }
  }

  componentDidMount() {
    const {parcelCod}=this.props;
    this.getLandInfo(parcelCod);
  }

  componentWillReceiveProps(newPorps){
    const {parcelCod} =this.props.House;
    let newParcelCod=newPorps.House.parcelCod;
    
    if(newParcelCod && parcelCod!==newParcelCod){
      this.getLandInfo(newParcelCod);
    }
  }
  componentWillUnmount(){
    this.setState({
      parcelInfo:{},
    });
  }

  // 点击地块后去查询
  getLandInfo= async(basicId,viewerPoint)=>{
    let landInfo= await getParcelById({"basicId":basicId});
    if(landInfo.success && landInfo.data){
      //根据objectid联动列表
      this.props.dispatch({
        type: 'House/setActiveLandListId',
        payload: landInfo.data.id
      })
      this.setState({
        parcelInfo:landInfo.data.attributes,
      });
      this.props.dispatch({
        type: 'House/setParcelId',
        payload: landInfo.data.basicId
      })
    }else{
      this.setState({
        parcelInfo:{},
      });
    }
  }
  
  close=()=>{
    this.props.dispatch({
      type: 'House/setParcelCod',
      payload: ""
    })
  }
  render() {
    const {parcelInfo={}}=this.state;
    return (
      <>
        <div className={styles.box}>
          {/* <div className={styles.close} onClick={()=>{this.close()}}>+</div> */}
          {/* <div className={styles.scrollBox}> */}
            <div className={styles.content}>
              <div className={styles.item}>
                <span className={styles.name}>土地编码:</span>
                <span className={styles.value}>{parcelInfo.parcelNo}</span>
              </div>
              <div className={styles.item}>
                <span className={styles.name}>宗地代码:</span>
                <span className={styles.value}>{parcelInfo.parcelCode}</span>
              </div>
              <div className={styles.item}>
                <span className={styles.name}>地址:</span>
                <span className={styles.value}>{parcelInfo.luLocation}</span>
              </div> 
              <div className={styles.divider}></div>
              <div className={styles.item}>
                <span className={styles.name}>地块面积:</span>
                <span className={styles.value}>{parcelInfo.luArea} m&sup2;</span>
              </div>
              <div className={styles.item}>
                <span className={styles.name}>性质/用途:</span>
                <span className={styles.value}>{parcelInfo.luFunction}</span>
              </div>
              <div className={styles.item}>
                <span className={styles.name}>登记状态:</span>
                <span className={styles.value}>{parcelInfo.estateState}</span>
              </div>
            </div>
          </div>
        {/* </div> */}
      </>
    );
  }
}

export default ParcelInfo;
