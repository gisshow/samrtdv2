/* global Cesium */
/* global viewer */
/* global mars3d */

import React, { Component } from 'react'

import styles from './styles.less';
import { connect } from 'dva';
import {getRoomById} from '@/service/house';

@connect(({ House }) => ({
  House
}))
class OtherInfo extends Component {

  constructor(props){
    super(props);
    this.state = {
      OtherInfo :{},
    }
  }

  componentDidMount() {
    const {houseId}=this.props;
    // this.getOtherInfo(houseId);
    // this.getBuilding3DUrl();
    // this.props.dispatch({
    //   type:'House/setHasHold',
    //   payload:false,
    // })
  }

  componentWillReceiveProps(newPorps){
    // const {houseId} =this.props.House;
    // let newHouseId=newPorps.House.houseId;
    
    // if(newHouseId && houseId!==newHouseId){
    //   this.getOtherInfo(newHouseId);
    // }
  }
  getOtherInfo= async(houseId)=>{
    const {info} =this.props;
    if(info && info.attributes && info.attributes.houseId===houseId){
      if(!info.attributes.houseId){
        info.attributes.houseId=info.basicId;
      }
      this.setState({
        OtherInfo:info.attributes,
      });
    }else{
      let OtherInfo= await getRoomById({basicId:houseId});
      if(OtherInfo.success && OtherInfo.data){
        // 高亮列表中的记录，basichouseid
        this.props.dispatch({
            type: 'House/setActiveRoomListId',
            payload: OtherInfo.data.id,
        })
        if(!OtherInfo.data.attributes.houseId){
          OtherInfo.data.attributes.houseId=OtherInfo.data.basicId;
        }
        this.setState({
          OtherInfo:OtherInfo.data.attributes,
        });
      }else{
        this.setState({
          OtherInfo:{},
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

  goPOIStat=(location)=>{
    this.props.goPOIStat && this.props.goPOIStat(location);
  }

  goPopulationStat=(location)=>{
    this.props.goPopulationStat && this.props.goPopulationStat(location);
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
    const {info={}}=this.props;
    // const {parcelCod} = this.props.House;
    return (
      <>
        <div className={styles.box}>
            <div className={styles.content}>
                <div className={styles.item}>
                  <span className={styles.name}>名称:</span>
                  <span className={styles.value}>{info.name}</span>
                </div>
                <div className={styles.item}>
                  <span className={styles.name}>类型:</span>
                  <span className={styles.value}>{info.type}</span>
                </div>
            </div>
            <div className={styles.btn}>
              {/* <span >查看周边设施</span> */}
              <span onClick={()=>this.goPOIStat(info.geom)} >查看周边设施</span>
              <span onClick={()=>this.goPopulationStat(info.geom)} >查看周边人口</span>
            </div>
        </div>
      </>
    );
  }
}

export default OtherInfo;
