/* global Cesium */
/* global viewer */
/* global mars3d */
/* global $ */
import React, { Component } from 'react'
import ModuleTitle from '@/components/moduleTitle'
import BuildingStat from './components/buildingStat'
import LandStat from './components/landStat'
import RoomStat from './components/roomStat'
import QueryStat from './components/queryStat'
import POIStat from './components/poiStat'
import PopulationStat from './components/populationStat'
import { connect } from 'dva'
import styles from './styles.less';
import POIList from '../list/poi';
import PopulationList from '../list/population';

@connect(({House }) => ({
  House
}))
class SubStat extends Component {

  constructor(props) {
    super(props);
    this.state = {
      isdDataExpand:true,
    }
    
  }

  //退回到主统计页面
  goBack=()=>{
    this.props.goBack &&  this.props.goBack();
  }

  renderStat=()=>{
    const {type,info} =this.props.data;
    switch (type) {  
      case 'building':
        return <BuildingStat/>
      case 'room':
        return <RoomStat />
      case 'land':
        return <LandStat />
      case 'query':
        return <QueryStat info={info}/>
      case 'poi':
        return <POIStat info={info} radius={true} onExpand={(value)=>this.setState({isdDataExpand:value})}/>
      case 'population':
        return <PopulationStat info={info} radius={true} goDetail={()=>{this.goDetail()}} onExpand={(value)=>this.setState({isdDataExpand:value})}/>
      default:
        return null
    }
  }

  renderList=()=>{
    const {type,info} =this.props.data;
    const {isdDataExpand} =this.state;
    switch (type) {
      case 'poi'://地块详情，加载楼栋列表
        return <POIList isExpand={isdDataExpand}/>;
      case 'population':
        return <PopulationList info={info} isExpand={isdDataExpand}/>
      default:
        return null;
    }
  }

  goHome=()=>{
    this.props.goHome && this.props.goHome();
  }

  goDetail=()=>{
    this.props.goDetail && this.props.goDetail();
  }

  goTree=()=>{
    this.props.goTree && this.props.goTree();
  }


  render() {    
    const {title,type} =this.props.data;
    const {parcelCod,bldgNo,rightActiveKey:activeKey} =this.props.House;
    return (
      <div className={`${styles.stat} ${type==="poi"?styles.poi:''}`}>
        <ModuleTitle title={`${title}--统计信息`}>
          {/* <span style={{cursor: "pointer"}} onClick={()=>this.goBack()}>返回</span> */}
        </ModuleTitle>
        <div className={`${styles.scrollBox} ${type==="query"?styles.query:''}`}>
          {
            this.renderStat()
          }
        </div>
       
            
        {
          this.renderList()
        }
        <div className={styles.footer}>
          {
            (type==="poi"||type==="population") &&  <div className={styles.btn} onClick={()=>this.goDetail()}><span>返回详情信息</span></div>
          }
          {
            type==="query" && 
            <>
              <div className={styles.btn} onClick={()=>this.goTree()}><span>查看列表</span></div>
              {activeKey==="mainStat" && <div className={styles.btn} onClick={()=>this.goHome()}><span>返回统计信息</span></div>}
              { (parcelCod || bldgNo) &&  <div className={styles.btn} onClick={()=>this.goDetail()}><span>返回详情信息</span></div>}
            </>
          }
        </div>
        
      </div>
    );
  }
}

export default SubStat
