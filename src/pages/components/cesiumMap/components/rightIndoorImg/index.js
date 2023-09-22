import React, { Component } from 'react';
import style from './index.less';
// import { connect } from 'dva';

// @connect(({ Map, RightFloatMenu, Global, House }) => ({
//   Map, RightFloatMenu, Global, House
// }))

class RightIndoorImg extends Component {
  constructor(props) {
    super(props);
    this.state = {
      displayType: 0,
      startIndoor: false,
      videoScale: 0,
      undergroundOn: false, //开关 0，关闭，1开启,
      selectOn: false,//点选开关
      showLayer: false
    }
  }

  componentDidMount(){
    // 获取初始图片以及初始位置
  }



  render() {
    const { top ,left ,transform } = this.props;
    return (
       <div className={style.rightIndoorImg}>
           <img src={require('@/assets/images/rightIndoorImg/mapImg.png')} alt="" />
           <div className={style.sector} style={{top:top,left:left,transform:transform}}>
              <div className={style.porint}></div>
           </div>
       </div>
    );
  }
}

RightIndoorImg.defaultProps = {
  top:90,
  left: 120,
  transform: 'rotate(30deg)'
}

export default RightIndoorImg