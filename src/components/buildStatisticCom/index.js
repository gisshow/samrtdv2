import React, { Component } from 'react'
import { connect } from 'dva'
import DataPanel from '@/components/dataPanel'
import SplitLine from '@/components/splitLine'
import styles from './styles.less'

@connect(({House}) => ({House}))

class BuildStatisticCom extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isShowBg:false,//是否显示背景
      isRenderTree:false,//是否渲染树结构
    }
  }

  componentDidMount() {
    
  }

  render() {
    const { perpetualBuildStatistic, unperpetualBuildStatistic } = this.props.House;
    return (
        <div className={styles.mainStatBox} >
            <div className={styles.scrollBox}>
                {perpetualBuildStatistic && <DataPanel data={perpetualBuildStatistic} type="Bar" isExpand={false}/>}
                <SplitLine/>
                {unperpetualBuildStatistic && <DataPanel data={unperpetualBuildStatistic} type="Bar" isExpand={false}/>}
            </div>
        </div>
    );
  }
}

export default BuildStatisticCom
