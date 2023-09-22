import React, { Component } from 'react'
import ModuleTitle from '@/components/moduleTitle'
import DataPanel from '@/components/dataPanel'
import { connect } from 'dva';

const data = {
  icon: 'icon_bus',
  title: '公交车',
  name: '车辆',
  time: '2020/03/16 12:23:38',
  sum:1327,
  chartData:[
    {
      label:'已建',
      num:232
    },
    {
      label:'在建',
      num:963
    },
    {
      label:'未建',
      num:132
    }
  ]
}

@connect(({ Home }) => ({
  Home
}))
class TrafficSubject extends Component {

  componentDidMount() {
    this.props.dispatch({
      type: 'Home/setRightActiveKey',
      payload: 'bus'
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
      <div style={{width: '300px'}}>
        <ModuleTitle title='交通专题' />
        { data && <DataPanel data={data} isExpand={true} />}
      </div>
    );
  }
}

export default TrafficSubject
