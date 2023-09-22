/* global Cesium */
/* global viewer */
/* global mars3d */
/* global turf */
import React, { Component } from 'react'
import ModuleTitle from '@/components/moduleTitle'
import SplitLine from '@/components/splitLine'
import { connect } from 'dva'
import styles from './styles.less';
import ParcelInfo from './parcelInfo';
import BuildingInfo from './buildingInfo';
import RoomInfo from './roomInfo';
import OtherInfo from './otherInfo'
import HouseForBuilding from '../list/houseForBuilding';
import HouseForRoom from '../list/houseForRoom';
import ParcelMoreDetail from './parcelInfo/moreDetail'
import BuildingMoreDetail from './buildingInfo/moreDetail'
import RoomMoreDetail from './roomInfo/moreDetail'
import {coordinatesArrayToCartesianArray,locationToBuffer,locationToPolygon} from '@/utils/index';

@connect(({ Home, House,BaseMap }) => ({
  Home, House,BaseMap
}))
class DetailInfo extends Component {

  constructor(props) {
    super(props);
    this.state = {
      isShowMore:false,
    }
  }

  //退回到主统计页面
  goStat=()=>{
    this.props.goStat &&  this.props.goStat();
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
        return bldgNo && <BuildingInfo basicId={bldgNo} info={info} goPopulationStat={this.goPopulationStat} goPOIStat={this.goPOIStat.bind(this)} info={info}/>
      case 'room':
        return houseId && <RoomInfo houseId={houseId} goPOIStat={this.goPOIStat.bind(this)} info={info}/>
      case 'parcel':
      case 'land':
        return parcelCod && <ParcelInfo parcelCod={parcelCod} goPopulationStat={this.goPopulationStat} goPOIStat={this.goPOIStat.bind(this)} info={info}/>
      case 'other':
        return <OtherInfo goPopulationStat={this.goPopulationStat} goPOIStat={this.goPOIStat.bind(this)} info={info}/>
      default:
        return null
    }
  }

  goPOIStat=(location)=>{
    const {detailType} = this.props.House;
    if(detailType.isRenderDetail){
      this.props.dispatch({
        type:'House/setDetailType',
        payload:{
          ...detailType,
          isRenderDetail:false,
        }
      })
    }

    //显示相关统计信息
    this.props.dispatch({
      type:'House/setStatType',
      payload:{
        isRenderSubStat:true,
        type:"poi",
        title:"周边设施",
        info:location,//存储坐标信息
      }
    })

    
    let dataParam={"geo":"POLYGON(("+locationToPolygon(location,100)+"))"};
    // 更新poi统计数据，缓冲的计算
    this.props.dispatch({
      type: 'House/getPOIStatisticsBySpace',
      payload: dataParam
    })

    //更新poilist
    this.props.dispatch({
      type: 'House/getPOIList',
      payload: {
        geo:dataParam.geo,
        // limit: 10,
        // page: 1,
      }
    })

    let buffereGeo=locationToBuffer(location,100);
    this.showBuffereFeature(buffereGeo);
    // return coordinates.toString();
    // let buffere = turf.buffer(polygon, 100, { units: 'meters', steps: 64 });
    // console.log(location,buffere);
    // this.showLandFeature(buffere);
    // 地图上效果的展示
    // 页面跳转
    // 关闭分层分户模式
    // 关闭分层分户模式
    this.props.dispatch({
      type: 'House/setHouseHoldModel',
      payload: false,
    })
  }

  //点击跳转到周边人口信息
  goPopulationStat = (location)=>{
    const {detailType} = this.props.House;
    if(detailType.isRenderDetail){
      this.props.dispatch({
        type:'House/setDetailType',
        payload:{
          ...detailType,
          isRenderDetail:false,
        }
      })
    }

    //显示相关统计信息
    this.props.dispatch({
      type:'House/setStatType',
      payload:{
        isRenderSubStat:true,
        type:"population",
        title:"周边人口",
        info:location,//存储坐标信息
      }
    })

    
    let dataParam={"geo":"POLYGON(("+locationToPolygon(location,100)+"))"};

    // 更新人口数据信息
    this.props.dispatch({
      type: 'House/getPopulationStatistics',
      payload: dataParam
    })

    let buffereGeo=locationToBuffer(location,100);
    this.showBuffereFeature(buffereGeo);
    // return coordinates.toString();
    // let buffere = turf.buffer(polygon, 100, { units: 'meters', steps: 64 });
    // console.log(location,buffere);
    // this.showLandFeature(buffere);
    // 地图上效果的展示
    // 页面跳转
    // 关闭分层分户模式
    // 关闭分层分户模式
    this.props.dispatch({
      type: 'House/setHouseHoldModel',
      payload: false,
    })
  }

  showBuffereFeature=(location)=>{
    let dataSource=new Cesium.CustomDataSource('buffer');
    viewer.dataSources.add(dataSource);
    let positions=[];
    // let location={};
    // try {
        // location=JSON.parse(item.location);
        // hole=JSON.parse(holeGeometry);
      if(location.type==="MultiPolygon"){
          positions = location.coordinates[0][0];
      }else if(location.type==="Polygon"){
          positions = location.coordinates[0];
      }
    // } catch (error) {
    //     console.log(item.location);
    // }
    dataSource.entities.add({
      polyline:{
          positions : coordinatesArrayToCartesianArray(positions),
          material:Cesium.Color.fromCssColorString('#8EE0F8'),
          classificationType:Cesium.ClassificationType.BOTH,
          clampToGround:true,
          width:2,
      },
      polygon:{
        hierarchy : {
          positions : coordinatesArrayToCartesianArray(positions),
        },
        material:Cesium.Color.fromCssColorString("#13B7E9").withAlpha(0.5),
        classificationType:Cesium.ClassificationType.BOTH,
        clampToGround:true,
        width:2,
      },
      
    });
    this.setExtraSource(dataSource);
  }
  setExtraSource=(source)=>{
    
    const {extraSource}=this.props.House;
    let sources=(extraSource && extraSource.length!==0 ) ? extraSource.concat(source) : [source];
    
    this.props.dispatch({
      type: 'House/setExtraSource',
      payload: sources
    })
  }
  removeExtraSource=()=>{
    const {extraSource}=this.props.House;
    if(extraSource && extraSource.length!==0 ){
      extraSource.map((item)=>{
        viewer.dataSources.remove(item);
      })
    }
    
    this.props.dispatch({
      type: 'House/setExtraSource',
      payload: undefined,
    })
  }

  renderList=()=>{
    const {type} =this.props.data;
    // const {detailType:{type}} = this.props.House;
    switch (type) {
      case 'parcel':
      case 'land'://地块详情，加载楼栋列表
        return <HouseForBuilding/>;
      case 'building':
      case 'room':
        return <HouseForRoom/>;//楼栋详情，加载房屋列表
      // case 'room':
      //   return <HouseForRoom/>;
      default:
        return null;
    }
  }

  renderMore=()=>{
    const {type,info} =this.props.data;
    // const {detailType:{type,info}} = this.props.House;
    const {isShowMore} = this.state;
    switch (type) {
      case 'land':
      case 'parcel':
        return  info && <ParcelMoreDetail show={isShowMore} info={info} close={()=>this.setState({isShowMore:false,})}/>;
      case 'building':
          return  info && <BuildingMoreDetail show={isShowMore} info={info} close={()=>this.setState({isShowMore:false,})}/>;
      case 'room':
          return  info && <RoomMoreDetail show={isShowMore} info={info} close={()=>this.setState({isShowMore:false,})}/>;
      default:
        return null;
    }
  }

  goMore=()=>{
     this.setState({
      isShowMore:!this.state.isShowMore,
     });
  }

  render() {    
    const {title,type} =this.props.data;
    const {isShowMore} = this.state;
    const {rightActiveKey:activeKey} =this.props.House;
    return (
      <>
        <div className={styles.box}>
          <ModuleTitle title={`${type==="other"?title:`${title}详情`}`}>
            {
              type!=="other" &&  <div className={styles.btn} onClick={()=>this.goMore()}>
                <span>更多</span>
                <span className={`iconfont icon_unfold1 ${styles.icon}`}/>
              </div>
            }
            
          </ModuleTitle>        
        </div>
        <div className={styles.detail}>
          <div className={styles.detailInfo}>
            {
              this.renderDetail()
            }
            {
              type!=="other" && <SplitLine/>
            }
          </div>
          <div className={styles.detailList}>
            {
              this.renderList()
            }
          </div>
          <div className={styles.otherList}>
            {
              isShowMore && this.renderMore()
            }
            {
              activeKey==="mainStat" &&  <div className={styles.footer} onClick={()=>this.goStat()}><span>返回统计信息</span></div>
            }
            {
              activeKey==="query" && <div className={styles.footer} onClick={()=>this.goStat()}><span>返回空间统计信息</span></div>
            }
          </div>
        </div>
      </>
    );
  }
}

export default DetailInfo
