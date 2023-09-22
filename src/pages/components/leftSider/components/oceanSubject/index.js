import React, { Component } from 'react'
import ModuleTitle from '@/components/moduleTitle'
import DataPanel from '@/components/dataPanel'
import { connect } from 'dva';

const data = {
  icon: 'icon_ocean',
  title: '潮位预报点',
  name: '监测点',
  time: '2020/03/16 12:23:38',
  // sum:132,
  chartData:{
    quantity:{
      stat:[
        {
          label:'红色预警(100-170)',
          num:23
        },
        {
          label:'黄色预警(30-100)',
          num:96
        }
      ],
      sum:119,
    }
  }
}

@connect(({ Home }) => ({
  Home
}))
class OceanSubject extends Component {

  componentDidMount() {
    this.props.dispatch({
      type: 'Home/setRightActiveKey',
      payload: 'sea'
    })
  }

  componentWillUnmount() {
    this.props.dispatch({
      type: 'Home/setRightActiveKey',
      payload: ''
    })
  }

  render() {
    return (
      <div>
        <ModuleTitle title='海洋专题' />
        {data && <DataPanel data={data} isExpand={true}/>}
      </div>
    );
  }
}

export default OceanSubject
