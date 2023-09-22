/* global Cesium */
/* global viewer */
/* global mars3d */

import React, { Component } from 'react'
import ListView from '@/components/listView'
import styles from './styles.less'
import { connect } from 'dva';
import RoomInfo from './components/roomInfo'
@connect(({ House }) => ({
  House
}))
class HouseForRoom extends Component {

  constructor(props){
    super(props);
    this.state={
      activeId:"",
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
    this.props.dispatch({
      type: 'House/setBasicHouseId',
      payload: properties.basicId,
    })
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

  render() {
    const {roomList,houseId} = this.props.House;
    const {activeId} = this.state;
    return (
      <>
        <div className={styles.box}>
          {/*<ModuleTitle title='房列表' />*/}
        <div className={styles.table} >
          <ListView
          ref={this.refList}
            source = {roomList}
            scrollToId  = {this.state.scrollToId}
            renderItem = {({item,index,style})=>(
              <div className={(item.id===activeId)? styles.row +' '+styles.active :styles.row} key={index}  id={item.id} style={{...style}}  onClick={() => this.click(item)}>
                <div className={styles.blank}></div>
                <div className={styles.num}>{index+1}</div>
                <div className={styles.name} title={item.attributes.roomName}>{item.attributes.roomName}</div>
                <div className={styles.state}>{item.attributes.houseUseName}</div>
                <div className={styles.state}>{item.attributes.houseArea ?parseFloat(item.attributes.houseArea).toFixed(2) : 0.0} m&sup2;</div>
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
