/* global Cesium */
/* global viewer */
/* global mars3d */

import React, { Component } from 'react'
import ListView from '@/components/listView'
import styles from './styles.less'
import { connect } from 'dva';
import { list } from 'postcss';
// import RoomInfo from './components/roomInfo'
@connect(({ House }) => ({
  House
}))
class HouseForRoom extends Component {

  constructor(props){
    super(props);
    this.state={
      activeId:"",
      isAscOrder:true,//默认升序
      // detailHeightset:false
    }
    this.refList=React.createRef(); //这个指向list

  }

  componentDidMount() {
    const {basicBldgId} =this.props.House;
    this.props.onRef && this.props.onRef(this);
    // this.handleData(true);
    // this.addBuildWMS();
    if(basicBldgId && basicBldgId!==''){
      this.props.dispatch({
        type: 'House/getRoomList',
        payload: {
          buildingId:basicBldgId
        }
      })
    }
  }

  componentWillUnmount(){
    this.handleData(false);
  }

  handleData=(flag)=>{
    const {buildWMS}=this.props.House;
    if(buildWMS){
      // buildWMS.setVisible(flag);
    }
    // if(buildSpecialWMS){
    //   buildSpecialWMS.setVisible(flag);
    // }
  }

  componentWillReceiveProps(newPorps){
    const {basicBldgId,activeRoomListId} =this.props.House;
    let newBidgId=newPorps.House.basicBldgId;
    let newHouseId=newPorps.House.activeRoomListId;
    if(newBidgId && basicBldgId!==newBidgId){
      this.props.dispatch({
        type: 'House/getRoomList',
        payload: {
          buildingId:newBidgId
        }
      })
      return;
    }
    if(newHouseId !=='' && activeRoomListId!==newHouseId){
      this.handleScrollToElement(newHouseId);
      this.highLight(newHouseId);
      return;
    }
  }

  click=(properties)=>{
    this.highLight(properties.id);
    //点击房屋信息进入房屋详情
    this.props.dispatch({
      type: 'House/setDetailHeightset',
      payload: true,
    })
    this.props.dispatch({
      type: 'House/setBasicHouseId',
      payload: properties.basicId,
    })
    this.props.dispatch({
      type: 'House/setHouseId',
      payload: properties.basicId,
    })
    // 上面2个id是同一个，后面需要统一管理
    this.goDetail(properties);
  }

  goDetail=(properties)=>{
    // 如果是在楼栋/房屋详情都跳转到房屋的详情
    const {detailType} = this.props.House;
    if(detailType.isRenderDetail){
      this.props.dispatch({
        type:'House/setDetailType',
        payload:{
          ...detailType,
          type:"room",
          title:"房屋",
          info:properties,
        }
      })
    }
  }


  highLight=(basicHouseId)=>{
    this.setState({
      activeId:basicHouseId || '',
    });

    //根据basicHouseId 查询 house_bdc  在跟据house_bdc 查询构件elemetid
    // 根据构件elemetid 查询 house_bdc 再根据house_bdc 查询根据basicHouseId 已经有了
  }

  handleScrollToElement=(id)=> {
    if(!id){
      this.refList.current.listWrapper.scrollTop--;
      return;
    }
    this.setState({
      scrollToId : id
    })

  }

  filter=()=>{
    const {roomList,houseIdsByHold} = this.props.House;
    if(!houseIdsByHold || houseIdsByHold.length===0) return roomList;
    let list=roomList.filter(item=>{
      return houseIdsByHold.indexOf(item.basicId)!==-1;
    })
    return list;
  }

  orderList=()=>{
    const {isAscOrder}=this.state;
    const {roomList} = this.props.House; 
    

    roomList && roomList.sort((a,b)=>{
      return isAscOrder ? b.attributes.houseArea-a.attributes.houseArea : a.attributes.houseArea-b.attributes.houseArea;
    })

    this.setState({
      isAscOrder:!isAscOrder,
    })
    this.props.dispatch({
      type: 'House/setRoomList',
      payload: {
        data:roomList
      }
    })
  }

  render() {
    // const {hasHold,detailHeightset,houseHoldModel} = this.props.House;
    const {activeId,isAscOrder} = this.state;
    let roomList=this.filter();
    return (
      <>
        <div className={styles.box}>
        <div className={styles.title}>
          <span>房屋列表</span>
          <span className={`iconfont ${isAscOrder?'icon_sequence':'icon_reverse'}  ${styles.icon}`} title='按面积排序' onClick={()=>this.orderList()}/>
        </div>
        {
          roomList.length>0&&<div className={styles.totalHouse}>{`查找到 ${roomList.length} 条结果`}</div>
        }
        <div className={styles.table} >
          <ListView
          ref={this.refList}
            source = {roomList}
            scrollToId  = {this.state.scrollToId}
            renderItem = {({item,index,style})=>(
              <div className={(item.id===activeId)? styles.row +' '+styles.active :styles.row} key={index}  id={item.id} style={{...style}}  onClick={() => this.click(item)}>
                <div className={styles.left}>
                    <div className={styles.name} title={item.attributes.roomName}>{item.attributes.roomName}</div>
                    <div className={styles.addr} title={item.attributes.certAddr}>{item.attributes.certAddr}</div>
                    <div className={styles.status}>
                      <span>{item.attributes.houseType}室</span>
                      <span>/</span>
                      <span>{item.attributes.houseSource}</span>
                    </div>
                </div>
                <div className={styles.right}>
                  <span className={styles.state}>{item.attributes.houseArea}m&sup2;</span>
                </div>
                {/* <div className={styles.blank}></div>
                <div className={styles.num}>{index+1}</div>
                <div className={styles.name} title={item.attributes.roomName}>{item.attributes.roomName}</div>
                <div className={styles.state}>{item.attributes.houseUseName}</div>
                <div className={styles.state}>{item.attributes.houseArea ?parseFloat(item.attributes.houseArea).toFixed(2) : 0.0} m&sup2;</div> */}
              </div>
            )}
          ></ListView>

         </div>
        </div>
        {/* {
          houseId && <RoomInfo houseId={houseId}/>
        } */}
      </>
    );
  }
}

export default HouseForRoom;
