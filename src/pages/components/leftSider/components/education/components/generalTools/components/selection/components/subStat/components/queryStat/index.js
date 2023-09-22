import React, { Component } from 'react'
import DataPanel from '../../../../../../../dataPanel'
import SplitLine from '@/components/splitLine'
import POIStat from '../poiStat'
import { connect } from 'dva'

@connect(({House }) => ({
  House
}))
class QueryStat extends Component {
  constructor(props){
    super(props);
  }
  
  render (){
    const { landQueryStatistic, buildQueryStatistic,populationQueryStatistic,legalPersonQueryStatistic,selectionSchoolStat,roomQueryStatistic} = this.props.House;
    let selectionSchool
    if(selectionSchoolStat){
      let schools = selectionSchoolStat.chartData.map(v=>{
        if(v.buildStatus==='1'){v.buildStatus='已建学校'}
        else if(v.buildStatus==='2'){v.buildStatus='在建学校'}
        else if(v.buildStatus==='3'){v.buildStatus='待建学校'}
        return {label:v.buildStatus,num:v.count}
      })
      let list = {}
      list['stat']=schools
      selectionSchool={
        icon: selectionSchoolStat.icon,
        title: selectionSchoolStat.title,
        name: selectionSchoolStat.name,
        time: selectionSchoolStat.time,
        chartData:{},
      }
      selectionSchool.chartData['schoollists']=list
    }
    const {info}=this.props;
    return (
      <>
          {landQueryStatistic && <DataPanel data={landQueryStatistic} isExpand={false} />}
          <SplitLine/>
          {buildQueryStatistic && <DataPanel data={buildQueryStatistic} hasSecondBuild={true} type="Bar" isExpand={false} />}
          <SplitLine/>
          {roomQueryStatistic && <DataPanel data={roomQueryStatistic} type="Bar" isExpand={false}/>}
          <SplitLine/>
          {/* {populationQueryStatistic && <DataPanel data={populationQueryStatistic} type="Pieslice"  isExpand={false} />} */}
          {selectionSchoolStat && <DataPanel data={selectionSchool} type="Pieslice"  isExpand={false} />}
          <SplitLine/>
          {legalPersonQueryStatistic && <DataPanel data={legalPersonQueryStatistic} type="Bar"  isExpand={false} />}
          <SplitLine/>
          {<POIStat info={info} radius={false} isExpand={false}/>}

      </>
    );
  }
}

export default QueryStat