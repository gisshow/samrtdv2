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

  // 点击地块后去查询
  getLandInfo= async(basicId,viewerPoint)=>{
    const {info} =this.props;
    if(info && info.attributes && info.attributes.parcelCode===basicId){
      info.attributes.location=info.location;
      this.setState({
        parcelInfo:info.attributes,
      });
    }else{
        let landInfo= await getParcelById({"basicId":basicId});
        if(landInfo.success && landInfo.data){
          //根据objectid联动列表
          this.props.dispatch({
            type: 'House/setActiveLandListId',
            payload: landInfo.data.id
          })
          // 将坐标赋值到attributes,后面同意放到model中
          landInfo.data.attributes.location=landInfo.data.location;
          this.setState({
            parcelInfo:landInfo.data.attributes,
          });
          this.props.dispatch({
            type: 'House/setParcelId',
            payload: landInfo.data.basicId
          })
          const {detailType} = this.props.House;
          if(detailType.type=="land" || detailType.type=="parcel"){
            if(detailType.info && detailType.info.basicId ===landInfo.data.basicId) return;
            this.props.dispatch({
              type:'House/setDetailType',
              payload:{
                ...detailType,
                info:landInfo.data,
              }
            })
          }
        }else{
          this.setState({
            parcelInfo:{},
          });
        }
      }
  }
  
  close=()=>{
    this.props.dispatch({
      type: 'House/setParcelCod',
      payload: ""
    })
  }

  //查看周围公共设施
  goPOIStat=(location)=>{
    this.props.goPOIStat && this.props.goPOIStat(location);
  }

  goPopulationStat=(location)=>{
    this.props.goPopulationStat && this.props.goPopulationStat(location);
  }

  getAllFloorArea=()=>{
    const {buildList} = this.props.House;
    let sum=0;
    if(buildList){
      sum=buildList.reduce((prev,cur)=>{
        return prev+cur.attributes.floorArea
      },0)
    }
    sum=sum.toFixed(2);
    return sum;
  }

  render() {
    const {parcelInfo}=this.state;
    // console.log('parcelInfo','parcelInfo........')
    let sumFloorArea=this.getAllFloorArea();
    return (
      <>
        <div className={styles.box}>
          {/* <div className={styles.close} onClick={()=>{this.close()}}>+</div> */}
          {/* <div className={styles.scrollBox}> */}
            <div className={styles.content}>
              <div className={styles.group}>
                <div className={styles.item}>
                  <span className={styles.name}>宗地代码:</span>
                  <span className={styles.value}>{parcelInfo.parcelCode}</span>
                </div>
                <div className={styles.item}>
                  <span className={styles.name}>宗地号:</span>
                  <span className={styles.value}>{parcelInfo.parcelNo}</span>
                </div>
              </div>
              
              {/* <div className={styles.item}>
                <span className={styles.value}>{parcelInfo.luLocation}</span>
                <span className={styles.name}>地址:</span>
                
              </div>  */}
              {/* <div className={styles.divider}></div> */}
              <div className={styles.group}>
                <div className={styles.item}>
                  <span className={styles.name}>基础地面积:</span>
                  <span className={styles.value}>{parcelInfo.luArea} m&sup2;</span>
                </div>
                
                <div className={styles.item}>
                  <span className={styles.name}>总建筑面积:</span>
                  <span className={styles.value}>{sumFloorArea} m&sup2;</span>
                </div>
              </div>
              <div className={styles.group}>
                <div className={styles.item}>
                  <span className={styles.name}>用途名称:</span>
                  <span className={styles.value}>{parcelInfo.luFunction}</span>
                </div>
                <div className={styles.item}>
                  <span className={styles.name}>登记状态:</span>
                  <span className={styles.value}>{parcelInfo.estateState}</span>
                </div>
              </div>
              <div className={styles.item}>
                <span className={styles.name}>位置:</span>
                <span className={styles.full} title={parcelInfo.luLocation}>{parcelInfo.luLocation}</span>
              </div>
            </div>
            <div className={styles.btn}>
              <span onClick={()=>this.goPOIStat(parcelInfo.location)}>查看周边设施</span>
              <span onClick={()=>this.goPopulationStat(parcelInfo.location)} >查看周边人口</span>
            </div>
          </div>
        {/* </div> */}
      </>
    );
  }
}

export default ParcelInfo;
