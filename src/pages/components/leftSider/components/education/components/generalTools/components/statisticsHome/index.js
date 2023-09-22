/* global Cesium */
/* global viewer */
/* global mars3d */
/* global $ */
/* global turf */
import React, { Component } from 'react'
import ModuleTitle from '@/components/moduleTitle'
import DataPanel from '@/components/dataPanel'
import RegionFilter from '../../../../../houseSubject/components/region'
import { connect } from 'dva'
import styles from './styles.less'
import {getBuildBySpace,getLandBySpace,getBuildList,getParcelByBuildId,getBuildById,getGeoInfo} from '@/service/house'
import SplitLine from '@/components/splitLine'
import { async } from 'q';

@connect(({ Home, House,Map }) => ({
  Home, House,Map
}))
class StatiscsHome extends Component {

  constructor(props) {
    super(props);
    this.state = {
      isShowBg:true,//是否显示背景
    }
  }

  componentDidMount() {
    this.props.dispatch({
      type: 'House/getParcelStatistics',
    })
    this.props.dispatch({
      type: 'House/getBuildStatistics',
    })
    this.props.dispatch({
      type: 'House/getRoomStatistics',
    })
    this.props.dispatch({
      type: 'House/getPopulationSchoolStat',
    })
    this.props.dispatch({
      type: 'House/getLegalPersonStatistic',
    })
    this.hideStreetDistinct()
  }


  componentWillUnmount() {
    this.showStreetDistinct()
  }

  componentWillReceiveProps(newPorps){

  }

  //隐藏全市边界线
  hideStreetDistinct =()=>{
    this.props.dispatch({
      type: 'House/setRightActiveKey',
      payload: "mainStat",
    });
    this.props.dispatch({
      type: 'House/setMainStat',
      payload: true,
    });
  }

  //展示全市边界线
  showStreetDistinct =()=>{
    this.props.dispatch({
      type: 'House/setRightActiveKey',
      payload: "",
    });
    this.props.dispatch({
      type: 'House/setMainStat',
      payload: false,
    });
  }

  // removeData = () => {
  //   // 移除feature
  //   viewer.mars.popup.removeFeatureForImageryLayer();
  // }

  toggleHouseBox = () => {
    this.setState({
      isShowBg: !this.state.isShowBg
    })
  }

  //只加载街道范围的数据
  searchDataByRegion=(name)=>{
    // this.removeData();
    const {jdName,quName} =this.props.House;
    // 2、更新统计接口
    let param={};
    if(jdName!==''){
      param.jdName=jdName;
    }else if(quName!==''){
      param.quName=quName;
    }
    this.props.dispatch({
      type: 'House/getParcelStatistics',
      payload: param
    })
    this.props.dispatch({
      type: 'House/getBuildStatistics',
      payload: param
    })
    this.props.dispatch({
      type: 'House/getRoomStatistics',
      payload: param
    })
    this.props.dispatch({
      type: 'House/getPopulationSchoolStat',
      payload: param
    })
    this.props.dispatch({
      type: 'House/getLegalPersonStatistic',
      payload: param
    })
    // 3、更新列表数据
    if(jdName===""){
      return;
    }
    this.props.dispatch({
      type: 'House/getParcelList',
      payload: {
        jdName:jdName,
        // quName:quName
      }
    })
  }

  render() {
    const {isShowMainStat,landStatistic,buildStatistic,roomStatistic,populationSchoolStat,legalPersonStatistic} = this.props.House;
    return (
      <div className={`${styles.houseBox} ${this.state.isShowBg ? styles.bgShow : styles.bgHide}`}>
        <>
          {<div className={`${styles.mainStatBox}`} >
              <ModuleTitle title='教育专题'>
                <RegionFilter searchData={this.searchDataByRegion.bind(this)}/>
              </ModuleTitle>
              <div className={styles.scrollBox}>
                {landStatistic && <DataPanel data={landStatistic} isExpand={false} hasExpand={true}/>}
                <SplitLine/>
                {buildStatistic && <DataPanel data={buildStatistic} type="Bar" isExpand={false}/>}
                <SplitLine/>
                {roomStatistic && <DataPanel data={roomStatistic} type="Bar" isExpand={false}/>}
                <SplitLine/>
                {populationSchoolStat && <DataPanel data={populationSchoolStat} type="Pieslice" typeData="queryPopulation" isExpand={false}/>}
                <SplitLine/>
                {legalPersonStatistic && <DataPanel data={legalPersonStatistic} type="Bar" isExpand={false}/>}
                <SplitLine/>
              </div>
            </div>
          } 
        </>
        {
          this.state.isShowBg === true ? <div className={styles.hideBtn} onClick={this.toggleHouseBox}></div> :
          <div className={styles.text} onClick={this.toggleHouseBox}>教育专题</div>
        }
      </div>
    );
  }
}

export default StatiscsHome
