import React, { Component } from 'react'
import style from './index.less'
import { connect } from 'dva'

@connect(({ House }) => ({
  House
}))

class Massif extends Component {
  constructor(props) {
    super(props);
    this.state= {
      model:'left'
    }
  }

  handleModeChange = val => {
    const mode = val.target.value;
    this.setState({ mode });
  }

  render() {
    const {title, mode} =this.props;
    const {schoolInfo}=this.props.House;
    console.log('收到',schoolInfo) 
    return (
      <div>
        <div>
          { 
            <div>
                <div className={style.reshearde}>所属地块</div>
                <div className={style.resle}>
                    <div className={style.resw}>
                      <div>学校</div>
                      <div>{schoolInfo.schoolName}</div>  
                    </div>
                    <div className={style.lines}>
                      <div className={style.rows}>
                        <div>宗地代码</div><div>{schoolInfo.projectCode}</div>
                      </div>
                    <div className={style.rows}>
                        <div>宗地号</div><div>{schoolInfo.parcelNo}</div>
                    </div>
                    </div>
                    <div className={style.lines}>
                      <div className={style.rows}>
                          <div>基础地面积</div><div>基础地面积</div>
                      </div>
                      <div className={style.rows}>
                          <div>总建筑面积总和</div><div>{schoolInfo.buildArea}</div>
                      </div>
                    </div>
                    <div className={style.lines}>
                      <div className={style.rows}>
                          <div>用途名称</div><div>用途名称</div>
                      </div>
                      <div className={style.rows}>
                          <div>登记状态</div><div>登记状态</div>
                      </div>
                    </div>
                    <div className={style.resw}>
                      <div>位置</div>
                      <div>{schoolInfo.schoolAddress}</div>  
                    </div>
                </div>
                <div className={style.feters} onClick={()=>{this.props.changeName('schools')}}>
                    返回学校信息
                </div>
            </div>
          }
        </div>
      </div>
    );
  }
}

export default Massif