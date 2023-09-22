import React, { Component } from 'react'
import ModuleTitle from '@/components/moduleTitle';
import { Tabs, Slider, Row, Col } from 'antd'
import style from './index.less'
import Bar from '../chart';

let data = {
    add: "龙东方的说法华区",
    num: 54,
    arr:[{
      add: "龙东方的说法华区",
      num: 45,
      three: 1424,
      six: 1554,
      ele: 5814,
      fiexc:565,
    },{
      add: "龙东方的说法华区",
      num: 45,
      three: 1424,
      six: 1554,
      ele: 5814,
      fiexc:565,
    },{
      add: "龙东方的说法华区",
      num: 45,
      three: 1424,
      six: 1554,
      ele: 5814,
      fiexc:565,
    },{
      add: "龙东方的说法华区",
      num: 45,
      three: 1424,
      six: 1554,
      ele: 5814,
      fiexc:565,
    },{
      add: "龙东方的说法华区",
      num: 45,
      three: 1424,
      six: 1554,
      ele: 5814,
      fiexc:565,
    },{
      add: "龙东方的说法华区",
      num: 45,
      three: 1424,
      six: 1554,
      ele: 5814,
      fiexc:565,
    },{
      add: "龙东方的说法华区",
      num: 45,
      three: 1424,
      six: 1554,
      ele: 5814,
      fiexc:565,
    }
  ],
    letarr:[{
      add:"大概多少瓜分德国法国",
      name:"电饭锅电饭锅地方个人更地方",
      type:"幼儿园",
      form:"已建",
    },{
      add:"大概多少瓜分德国法国",
      name:"电饭锅电饭锅地方个人更地方",
      type:"幼儿园",
      form:"已建",
    },{
      add:"大概多少瓜分德国法国",
      name:"电饭锅电饭锅地方个人更地方",
      type:"幼儿园",
      form:"已建",
    },{
      add:"大概多少瓜分德国法国",
      name:"电饭锅电饭锅地方个人更地方",
      type:"幼儿园",
      form:"已建",
    },{
      add:"大概多少瓜分德国法国",
      name:"电饭锅电饭锅地方个人更地方",
      type:"幼儿园",
      form:"已建",
    },{
      add:"大概多少瓜分德国法国",
      name:"电饭锅电饭锅地方个人更地方",
      type:"幼儿园",
      form:"已建",
    },{
      add:"大概多少瓜分德国法国",
      name:"电饭锅电饭锅地方个人更地方",
      type:"幼儿园",
      form:"已建",
    },{
      add:"大概多少瓜分德国法国",
      name:"电饭锅电饭锅地方个人更地方",
      type:"幼儿园",
      form:"已建",
    }
  ]
};


class Periphery extends Component {
  constructor(props) {
    super(props);
    this.state= {
      inputValue: 1,
    }
  }
  
 
  onChange = value => {
    this.setState({
        inputValue:value
     });
  }

  handleModeChange = val => {
    const mode = val.target.value;
    this.setState({ mode });
  }

  render() {
    const {title, mode} =this.props;
    return (
      <div>
        <div>
          {
            <div>
                <Tabs defaultActiveKey='1' type="line" centered size="large" tabBarGutter="2">
                    <Tabs.TabPane tab='楼宇列表' key='1'>
                      <div className={style.concent}>
                        <div className={style.headertop}>
                            <span>&nbsp;&nbsp;{data.add}</span><span>&nbsp;&nbsp;{data.num}条</span>
                        </div>
                        <div className={style.listcengt}> 
                          {
                            data.arr && data.arr.map((item,index)=>{
                              return <div className={style.list}>
                                        <div className={style.listtop}><div>{item.add}</div><div>共&nbsp;&nbsp;<span className={style.peculiar}>{item.num}</span>人</div></div>
                                        <div className={style.listcont}>
                                          <div className={style.listss}><div className={style.peculiar}>{item.three}</div><div>3岁</div></div>
                                          <div className={style.listss}><div className={style.peculiar}>{item.six}</div><div>6岁</div></div>
                                          <div className={style.listss}><div className={style.peculiar}>{item.ele}</div><div>12岁</div></div>
                                          <div className={style.listss}><div className={style.peculiar}>{item.fiexc}</div><div>15岁</div></div>
                                        </div>
                                      </div>
                            })
                          }
                        </div>
                        <div className={style.feters} onClick={()=>{this.props.changeName('schools')}}>
                              返回学校信息
                        </div>
                      </div>  
                    </Tabs.TabPane>
                    <Tabs.TabPane tab='学校列表' key='2'>
                    <div className={style.concent}>
                        <div className={style.headertop}>
                            <span>&nbsp;&nbsp;{data.add}</span><span>&nbsp;&nbsp;{data.num}条</span>
                        </div>
                        <div className={style.listcengt}> 
                          {
                            data.letarr && data.letarr.map((item,index)=>{
                              return <div className={`${style.list}  ${style.listmou}`} onClick={()=>{this.props.changeName('schools')}}>
                                        <div className={style.lettop}>{item.add}</div>
                                        <div className={style.letcont}>{item.name}</div>
                                        <div className={style.letcont}><span>{item.type}&nbsp;</span>/<span>&nbsp;{item.form}</span></div>
                                      </div>
                            })
                          }
                        </div>
                        <div className={style.feters} onClick={()=>{this.props.changeName('schools')}}>
                              返回学校信息
                        </div>
                      </div>  
                    </Tabs.TabPane>
                </Tabs>
            </div>
          }
        </div>
      </div>
    );
  }
}

export default Periphery