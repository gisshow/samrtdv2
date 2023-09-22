/* global Cesium */
/* global viewer */
/* global mars3d */
/* global $ */
/* global turf */
/* global Popup */

import React, { Component } from 'react';
import style from './index.less';
import { connect } from 'dva';
import {Tooltip, Statistic} from 'antd';
import LeftHome from './components/leftHome';
import WindowChart from '@/components/Chart/windowChart'
import StatisticHome from './components/statisticsHome';
import BorderPoint from '../../../../../border-point';
import FrameQuery from './components/frameSelectQuery';
import Selection from './components/selection';

@connect(({ Map, RightFloatMenu, Global, House }) => ({
  Map, RightFloatMenu, Global, House
}))

class GeneralTools extends Component {

  constructor(props) {
    super(props);
    this.state = {
      isShowBg:false,//是否显示背景
    }
  }

  componentWillReceiveProps(newPorps) {

  }
  componentDidMount() {
    const {isFrameQueryActive} = this.props.RightFloatMenu;
    isFrameQueryActive && this.toggleMenuActive()
  }
  componentWillUnmount() {
    const {isFrameQueryActive} = this.props.RightFloatMenu;
    isFrameQueryActive && this.toggleMenuActive()
  }

  toggleMenuActive(name) {
    this.props.dispatch({
      type: 'RightFloatMenu/toggleMenu',
      payload: name
    })
  }

  // handler = null;
  // removeSelectLayer = () => {
  //   this.entityModel && viewer.entities.remove(this.entityModel);
  //   this.selectObj.type = "";
  //   this.handler && this.handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK);
  // }

  //搜索开关
  toggleSearch = (isActive) => {
    var isHomekeystop;
    if (!isActive) {
      isHomekeystop = true;
      viewer.mars.keyboardRoam.unbind();
    } else {
      isHomekeystop = false;
      viewer.mars.keyboardRoam.bind()
    }

  }

  CloseFrameSelectQuery = () => {
    this.props.dispatch({
      type: 'RightFloatMenu/toggleMenu',
      payload: "isFrameQueryActive"
    })
  }

  //行政区统计
  toggleDistrictStat = () => {
    const { jdName, rightActiveKey: activeKey } = this.props.House;
    if (activeKey !== "mainStat") {
      // this.props.dispatch({
      //   type: 'House/setRightActiveKey',
      //   payload: "mainStat",
      // });
    } else {
      this.clearDistrictStat();
      return;
    }
    // this.props.dispatch({
    //   type: 'House/setMainStat',
    //   payload: true,
    // });

    this.switchPickMode(false);
    // 如果不是在街道级别则设置为不可点选
    if (jdName == "") {
      this.props.dispatch({
        type: 'House/setIsPick',
        payload: false,
      });
    }
  }

  clearDistrictStat = () => {
    const { isPick } = this.props.House;
    this.props.dispatch({
      type: 'House/setMainStat',
      payload: false,
    });
    this.props.dispatch({
      type: 'House/setIsPick',
      payload: false,
    });
    this.props.dispatch({
      type: 'House/setRightActiveKey',
      payload: '',
    });

    // 清除面板和地图标记
    // this.removeExtraSource();
    // this.clearHouseInfo();
  }

  switchPickMode = (flag) => {
    // const {pickMode}=this.props.House;
    this.props.dispatch({
      type: 'House/setPickMode',
      payload: flag,
    });

  }

  getAuths() {
    let obj = {
      MapQuery: false,
      DistrictStat: false,//行政区统计
      FrameSelectQuery: false,//框选查询
    }
    try {
      const {
        pageAuths: {
          CityDisplay: {
            MapQuery,
            DistrictStat,
            FrameSelectQuery,
            
          },
        }
      } = this.props.Global;

      return { ...obj, MapQuery,DistrictStat,FrameSelectQuery };
    } catch (err) {
      return obj;
    }
  }
  //框选开关
  toggleFrameQuery = () => {
    const { rightActiveKey: activeKey} = this.props.House;
    if (activeKey !== "query") {
      // this.props.dispatch({
      //   type: 'House/setRightActiveKey',
      //   payload: "query",
      // });
    } else {
      this.props.dispatch({
        type: 'House/setRightActiveKey',
        payload: '',
      });
      // return;
    }
  }
  toggleMenu = (name, isActive) => {
    this.props.dispatch({
      type: 'House/setRightActiveKey',
      payload: '',
    });
    this.toggleMenuActive(name)
    const { isSearchActive,isDistrictStatActive,isFrameQueryActive} = this.props.RightFloatMenu;
    const { isOpenImgWindow } = this.props.House;
    if (name !== 'isSearchActive' && isSearchActive) {
      this.toggleSearch()  //点击其他菜单时，如果打开了搜索菜单，就关闭搜索
    }
    if (name !== 'isDistrictStatActive' && isDistrictStatActive) {
      this.toggleDistrictStat()  //点击其他菜单时，如果打开了行政区统计菜单，就关闭点选
    }
    if (name !== 'isFrameQueryActive' && isFrameQueryActive) {
      this.toggleFrameQuery()  //点击其他菜单时，如果打开了框选菜单，就关闭点选
    }
    // this.removeSelectLayer();
    switch (name) {
      case 'isDistrictStatActive'://行政区统计开关
        this.toggleDistrictStat()
        if(isActive){
          this.props.dispatch({
            type: 'House/setIsOpenImgWindow',
            payload: { isOpenImgWindow: false }
          })
        }
        break;
      case 'isSearchActive': //搜索开关
        this.toggleSearch(isActive)
        break;
      case 'isFrameQueryActive': //框选开关
        this.toggleFrameQuery()
        break;
      default:
        break;
    }
  }

  goTree=()=>{
    const {detailType,statType}=this.props.House;
    // console.log(detailType,statType)
    this.setState({
      isRenderTree:true,
    },()=>{
      if(statType.isRenderSubStat){
        this.props.dispatch({
          type:'House/setStatType',
          payload:{
            ...statType,
            isRenderSubStat:false,
          }
        })
      }
      if(detailType.isRenderDetail){
        this.props.dispatch({
          type:'House/setDetailType',
          payload:{
            ...detailType,
            isRenderDetail:false,
          }
        })
      }
      
  
      this.props.dispatch({
        type: 'House/setMainStat',
        payload: false,
      });
      this.props.dispatch({
        type: 'House/setHouseBox',
        payload: true,
      });
      
    });
    
    
  }

  //返回详情页面
  goDetail=()=>{
    const {detailType,statType}=this.props.House;

    if(statType.isRenderSubStat){
      this.props.dispatch({
        type:'House/setStatType',
        payload:{
          ...statType,
          isRenderSubStat:false,
        }
      })
    }
    this.props.dispatch({
      type:'House/setDetailType',
      payload:{
        ...detailType,
        isRenderDetail:true,
      }
    })

  }

  goHome=()=>{
    const {detailType,statType}=this.props.House;
    const {isRenderTree}=this.state;
    if(detailType.isRenderDetail){
      this.props.dispatch({
        type:'House/setDetailType',
        payload:{
          ...detailType,
          isRenderDetail:false,
        }
      })
    }
    if(statType.isRenderSubStat){
      this.props.dispatch({
        type:'House/setStatType',
        payload:{
          ...statType,
          isRenderSubStat:false,
        }
      })
    }
    if(isRenderTree){
      this.setState({
        isRenderTree:false,
      });
    }
  }

  isAllRender=()=>{
    const {isRenderTree} = this.state;
    const {statType,detailType,isShowMainStat} = this.props.House;
    if(!isRenderTree && !statType.isRenderSubStat && !detailType.isRenderDetail && !isShowMainStat){
      return false
    }else{
      return true
    }
  }

  render() {
    const { showMenu,isSearchActive,isDistrictStatActive,isFrameQueryActive} = this.props.RightFloatMenu;
    const {statType,detailType,isShowMainStat,isOpenImgWindow} = this.props.House;
    const {MapQuery,DistrictStat,FrameSelectQuery} = this.getAuths();
    return (
        <>
          <div className={style.rightFloatMenu} style={{ display: showMenu ? 'block' : 'none' }}>
            <div className={style.menus}>
            {
              MapQuery ? (
                <Tooltip title="搜索" placement="left">
                  <div className={[style.item, isSearchActive ? style.active : ''].join(' ')} onClick={() => { this.toggleMenu('isSearchActive', isSearchActive) }}>
                    <BorderPoint />
                    <span className={"iconfont" + ' ' + style.icon}>&#xe658;</span>
                  </div>
                </Tooltip>
              ) : null
            }
            {
              FrameSelectQuery ? (
                <Tooltip title="框选" placement="left">
                  <div className={[style.item, isFrameQueryActive ? style.active : ''].join(' ')} onClick={() => { this.toggleMenu('isFrameQueryActive') }} >
                    <BorderPoint />
                    <span className={"iconfont icon_multiselect" + ' ' + style.icon}></span>
                  </div>
                </Tooltip>
              ) : null
            }
            {
              DistrictStat ? (
                <Tooltip title="行政区统计" placement="left">
                  <div className={[style.item, isDistrictStatActive ? style.active : ''].join(' ')} onClick={() => { this.toggleMenu('isDistrictStatActive', isDistrictStatActive) }} >
                    <BorderPoint />
                    <span className={"iconfont icon_directselect" + ' ' + style.icon}></span>
                  </div>
                </Tooltip>
              ) : null
            }
            </div>
          </div>
          {
            isSearchActive && <LeftHome type={'isSearchActive'}  />
          }
          {
            isOpenImgWindow&&<WindowChart/>
          }
          {
            isDistrictStatActive && <StatisticHome type={'isDistrictStatActive'}  />
          }
          {/* 将框选组件添加到这里 */}
          {
            isFrameQueryActive && <FrameQuery onClose={() => this.CloseFrameSelectQuery()} />
          }
          {
            isFrameQueryActive && <Selection type={'isFrameQueryActive'}/>
          }
      </>      
    );
  }
}

export default GeneralTools
