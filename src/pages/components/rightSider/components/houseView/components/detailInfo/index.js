/* global Cesium */
/* global viewer */
/* global mars3d */
/* global $ */
import React, { Component } from 'react'
import ModuleTitle from '@/components/moduleTitle'
import { connect } from 'dva'
import styles from './styles.less';
import ParcelInfo from './parcelInfo';
import BuildingInfo from './buildingInfo';
import RoomInfo from './roomInfo';

@connect(({ Home, House,BaseMap }) => ({
  Home, House,BaseMap
}))
class DetailInfo extends Component {

  constructor(props) {
    super(props);
    this.state = {
      isLandShow: true,
      isLandLoaded:false,
      isBuildShow: true,
      isBuildLoaded:false,
    }
  }

  componentDidMount() {

  }

  //退回到主统计页面
  goBack=()=>{
    // const { rightActiveKey } = this.props.Home;
    // // 默认返回对应的tab
    // const {type} =this.props.data;
    // if (rightActiveKey !== type) {
    //   this.props.dispatch({
    //     type: 'Home/setRightActiveKey',
    //     payload: type,
    //   });
    // }

    this.props.goBack &&  this.props.goBack();
  }

  //退回到楼详情列表
  goBackBuild=()=>{
    //显示楼栋详情
    this.props.dispatch({
      type:'House/setDetailType',
      payload:{
        isRenderDetail:true,
        type:"building",
        title:"房屋",
      }
  })
  }

  renderDetail=()=>{
    const {type,info} =this.props.data;
    const {parcelCod,bldgNo,houseId} = this.props.House;
    switch (type) {  
      case 'building':
        return <BuildingInfo basicId={bldgNo} info={info}/>
      case 'room':
        return <RoomInfo houseId={houseId}/>
      case 'land':
        return <ParcelInfo parcelCod={parcelCod}/>
      default:
        return null
    }
  }


  render() {    
    const {title,type} =this.props.data;
    return (
      <>
        <div className={styles.box}>
          <ModuleTitle title={`${title}详情`}>
            { type==="room" && <span className={styles.btn} onClick={()=>this.goBackBuild()}>返回楼</span>}
            <span className={styles.btn} onClick={()=>this.goBack()}>返回列表</span>
          </ModuleTitle>        
        </div>
        <div className={styles.detail}>
        {
            this.renderDetail()
        }
        </div>

      </>
    );
  }
}

export default DetailInfo
