/* global Cesium */
/* global viewer */
/* global mars */
/* global $ */
/* global mars3d */
/* turf */
import React, { Component } from 'react';
import { Slider, Button, InputNumber, Tooltip, Icon } from 'antd'
import styles from './style.less'
import { connect } from 'dva';
import { PUBLIC_PATH } from '@/utils/config'
import BorderPoint from '../../../border-point'
const Ajax = require('axios');
//const haoutil = require('@haoutil/haoutil');
var  measureControl = null;
var lastVal= null;

@connect(({RightFloatMenu }) => ({
  RightFloatMenu
}))
class MeasurePanel extends Component {
  constructor(props) {
    super(props);   
  }
  componentDidMount() {
    measureControl = new mars3d.analysi.Measure({
        viewer: viewer,
        terrain: false
    })
  }
  componentWillUnmount() {
    if(measureControl){
      measureControl.clearMeasure();
      measureControl=null;
    }    

    lastVal=null;
  }
    MeasureLength = () => {
      measureControl.measuerLength({
          unit: "m",
          terrain: false,//true为贴地距离，false时为直线距离
          addHeight: 1,
          style: {
            color: "#FEC205",
            opacity: 0.6,
          },
          calback: this.onMeasureChange()
        }

      );
    }
    MeasureArea = () => {
        measureControl.measureArea({
          unit: "m",
          style: {
              color: "#FEC205",
              outline: false,
              opacity: 0.6,
              clampToGround: false //false为不贴地，true为贴地
          },
          calback: this.onMeasureChange()
        });
    }
    MeasureHeigth = () => {
        measureControl.measureHeight({
          unit: "m",
          isSuper: false,
          style: {
            color: "#FEC205",
            opacity: 0.6,
          },
          calback: this.onMeasureChange()
        });
    }
    clearwj = () => {
        measureControl.clearMeasure();
        lastVal=null;
        
    }
   onMeasureChange=(valstr, val) =>{
      if (val)
          lastVal = val;
      //$("#lbl_measure_result").html(valstr);
  } 
  
  
  showSectionResult=(param, val)=> {
      
      this.onMeasureChange(param.distancestr, param.distance);
      //thisWidget.showSectionChars(param);
  }
  
  //单个对象绘制完成结束后的回调
  onMeasureEnd=(entity)=> {
      // console.log('测量完成');
  }

  render() {

    
    return (

      <div className={styles.MeasurePanel}>
        <BorderPoint />
        <div className={styles.close} onClick={() => {
          this.props.dispatch({
            type: 'Map/setToolsActiveKey',
            payload: ""
          })
          this.props.dispatch({
            type:'RightFloatMenu/toggleMenu',
            payload:'isCountActive'
          })
        }}>
          <Tooltip title="关闭" >
            <Icon type="close"/>
          </Tooltip>
        </div>
       
        <div className={styles.divloukong}>
            &nbsp;&nbsp;&nbsp;
            <Button className={styles.pipbutton} onClick={this.MeasureLength}>距离测量</Button>&nbsp;&nbsp;&nbsp;
            <Button className={styles.dbxbutton} onClick={this.MeasureArea}>面积测量</Button>&nbsp;&nbsp;&nbsp;&nbsp;
            <Button className={styles.pipbutton} onClick={this.MeasureHeigth}>高度测量</Button>&nbsp;&nbsp;&nbsp;&nbsp;
            <Button className={styles.pipbutton} onClick={this.clearwj}>清除</Button>
        </div>        
      </div>
    );
  }
}

export default MeasurePanel;