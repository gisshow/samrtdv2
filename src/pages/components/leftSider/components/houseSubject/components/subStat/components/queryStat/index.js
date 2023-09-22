import React, { Component } from 'react'
import DataPanel from '@/components/dataPanel'
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
    const { landQueryStatistic, buildQueryStatistic,populationQueryStatistic,legalPersonQueryStatistic,roomQueryStatistic} = this.props.House;
    const {info}=this.props;
    return (
      <>
          {landQueryStatistic && <DataPanel data={landQueryStatistic} isExpand={false} />}
          <SplitLine/>
          {buildQueryStatistic && <DataPanel data={buildQueryStatistic} hasSecondBuild={true} type="Bar" isExpand={false} />}
          <SplitLine/>
          {roomQueryStatistic && <DataPanel data={roomQueryStatistic} type="Bar" isExpand={false}/>}
          <SplitLine/>
          {populationQueryStatistic && <DataPanel data={populationQueryStatistic} type="Pieslice" isExpand={false} />}
          <SplitLine/>
          {legalPersonQueryStatistic && <DataPanel data={legalPersonQueryStatistic} type="Bar"  isExpand={false} />}
          <SplitLine/>
          {<POIStat info={info} radius={false} isExpand={false}/>}

      </>
    );
  }
}

export default QueryStat