/* global Cesium */
/* global viewer */
/* global mars3d */

import React, { Component } from 'react'
import Bar from '@/components/Chart/Bar';
import styles from './styles.less'
import { connect } from 'dva';

@connect(({ House }) => ({
  House
}))
class PopulationList extends Component {

  constructor(props){
    super(props);
    this.state={
        statField: "age",//默认统计字段
    }
  }

  componentDidMount() {
  }

  componentWillUnmount(){
    
  }

 //获取面积单位
 getAreaScale=(num)=>{
    let scale=1;
    if(num>10000 && num<1000000){
        scale=10000;
    }else if(num>1000000){
        scale=1000000;
    }
    return scale;
 }

  render() {
    const { statField } = this.state;
    const { House,isExpand }=this.props;
    const { populationStatistic} = House;
    let chartData =undefined;
    if(populationStatistic){
      chartData = populationStatistic.chartData
    }
    return (
      <>
        {
           chartData ? <div className={`${styles.population} ${isExpand?'':styles.expand}`}>
            <div className={styles.title}>
              <span>年龄分布</span>
            </div>
            <div className={styles.content} >
              {
                  chartData && <Bar data={chartData[statField].stat} step={this.getAreaScale(chartData[statField].sum)} type={statField} height={240} padding={[0 ,20 ,15 ,80]}/>
              }
            </div>
          </div>:null
        }
      </>
    );
  }
}

export default PopulationList;
