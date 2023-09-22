import React, { Component } from 'react'
import ModuleTitle from '@/components/moduleTitle'
import DataPanel from '@/components/dataPanel'
import { connect } from 'dva';

const data = {
  icon: 'icon_monitor',
  title: '固定监控位',
  name: '摄像头',
  time: '2020/03/16 12:23:38',
  sum:378,
  chartData:[
    {
      label:'已建',
      num:201
    },
    {
      label:'在建',
      num:45
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
class SafeSubject extends Component {

  componentDidMount() {
    this.props.dispatch({
      type: 'Home/setRightActiveKey',
      payload: 'video'
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
        <ModuleTitle title='安防专题' />
        {data && <DataPanel data={data} isExpand={true}/>}
      </div>
    );
  }
}

export default SafeSubject
