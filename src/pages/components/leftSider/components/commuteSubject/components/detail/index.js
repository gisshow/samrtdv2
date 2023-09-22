/* global Cesium */
/* global viewer */
/* global mars3d */
/* global turf */
import React, { Component } from 'react'
import ModuleTitle from '@/components/moduleTitle'
import Line from '../chart/line'
import { connect } from 'dva'
import styles from './styles.less';

@connect(({ House }) => ({
  House
}))
class Detail extends Component {

  constructor(props) {
    super(props);
    this.state = {
      data:[
        {
          label:'南山区',
          num:232,
          num1:22,
        },
        {
          label:'福田区',
          num:431,
          num1:33,
        },
        {
          label:'宝安区',
          num:12,
          num1:44,
        },
        {
          label:'光明区',
          num:36,
          num1:55,
        },
        {
          label:'罗湖区',
          num:52,
          num1:66,
        },
        {
          label:'大鹏区',
          num:26,
          num1:77,
        }
      ]
    }
  }

  //退回到主统计页面
  goStat=()=>{
    this.props.goStat &&  this.props.goStat();
  }

  renderTitle=()=>{
    const {quName}=this.props.House;
    let label="";
    if(quName){
      label+=quName;
    }
    return <span>{label}</span>
  }

  
  
  render() {  
    const {data}=this.props;  
    return (
      <>
        <div className={styles.title}>
          <ModuleTitle title="详情信息">
            {
              this.renderTitle()
            }
          </ModuleTitle>        
        </div>
        <div className={styles.stat}>
        {
            <Line data={data} height={320} padding={[10,10,30,50]}/>
        }

        </div>
        
        <div className={styles.footer} onClick={()=>this.goStat()}><span>返回统计信息</span></div>
        
        
      </>
    );
  }
}

export default Detail
