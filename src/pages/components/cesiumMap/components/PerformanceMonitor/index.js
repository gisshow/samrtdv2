/* global Cesium */
/* global viewer */
/* global mars3d */
/* global haoutil */
import React, { Component } from 'react';
import { Tooltip, Icon, Popconfirm, message, Button, InputNumber, Input, Row, Col, Select, Slider, Modal } from 'antd';
import BorderPoint from '../../../border-point'
import styles from './style.less';
import { request } from '@/utils/request';
import { connect } from 'dva';
import { PUBLIC_PATH } from '@/utils/config'
const Ajax = require('axios');

const { Option } = Select;
let speedmul = 1, motherBoard;

// const layer_data = require('./testlayerdata.json')

@connect(({ RightFloatMenu, Timeline }) => ({
  RightFloatMenu, Timeline
}))
class PerformanceMonitor extends Component {
  state = {
    visible: false,
    value_yc: 0, //网络延迟
    value_zl: 0, //网络帧率
    value_sd: 0, //下载速度
    yc_zlHandler: null, 
    downHandler:null,
  };

  async componentDidMount() {
    viewer.scene.debugShowFramesPerSecond = true
    this.getYC_ZL()
    this.getDown_sd()

  }

  componentWillUnmount() {
    viewer.scene.debugShowFramesPerSecond = false
    this.setState = () => false;
    this.state.yc_zlHandler && window.clearInterval(this.state.yc_zlHandler)
    this.state.downHandler && window.clearInterval(this.state.downHandler)

  }

  //获取网络延迟和帧率
  getYC_ZL = () => {
    let handler = setInterval(() => {
      let ychtml = document.getElementsByClassName('cesium-performanceDisplay-ms')[0]
      let fpshtml = document.getElementsByClassName('cesium-performanceDisplay-fps')[0]
      let yc = ychtml && ychtml.textContent
      let fps = fpshtml && fpshtml.textContent
      this.setState({
        value_yc: yc && yc.split(" ")[0],
        value_zl: fps && fps.split(" ")[0]
      })
    }, 1000)

    this.setState({
      yc_zlHandler:handler
    })
  }

  //下载速度
  getDown_sd = () => {
    let handler = setInterval(() => {
      // var st = new Date();
      // this.excuteRequest().then((data)=>{
      //   var filesize = 445;  //measured in KB  
      //   var et = new Date();
      //   var speed = (Math.round(filesize * 1000) / (et - st)).toFixed(2);
      //   if(isFinite(speed)){
      //     this.setState({
      //       value_sd: speed
      //     })
      //   }
      // })

      this.getNetSpeed(5).then(speed=>{
        this.setState({
          value_sd: speed
        })
      }).catch(err=>{
        this.setState({
          value_sd: 0
        })
      })
      
    }, 2500)

    this.setState({
      downHandler:handler
    })
  }

  //记录名称
  excuteRequest = async() => {
     return await fetch('./media/2_-3_1_0.b3dm?t='+new Date().getTime(),{headers:{}})
  }

  getNetSpeed=(times)=>{
    const arr=[];
    for (let i = 0; i < times; i++) {
      arr.push(this.getSpeedWithAjax());
      
    }
    return Promise.all(arr).then(speeds=>{
      let sum=0;
      speeds.forEach(speed=>{
        sum+=speed;
      })
      return (sum / times).toFixed(2);
    })
  }

  getSpeedWithAjax= async ()=>{
    let start = new Date().getTime();
    let end=null;
    return await fetch('./media/data31.b3dm?t='+new Date().getTime()).then(res=>{
      end = new Date().getTime();
      const filesize = 3.1*1024;  //measured in KB  
      const speed = Number((Math.round(filesize * 1000) / (end - start)).toFixed(2));
      return Promise.resolve(speed);
    })
  }

  

  //关闭
  close = () => {
    const { palyHandler } = this.state
    // window.clearInterval(palyHandler);

    // viewer.scene.preRender.removeEventListener(this.Listener);

    this.props.dispatch({
      type: 'Map/setToolsActiveKey',
      payload: ""
    })

    this.props.dispatch({
      type: 'RightFloatMenu/toggleMenu',
      payload: 'isFlyActive'
    })

    this.componentWillUnmount();
  }

  render() {
    const { value_yc, value_zl, value_sd } = this.state;
    return (
      <>
        {
          <div className={styles.box} >
            <BorderPoint />
            <div className={styles.boxTitle}>
              <div >
                性能评测
              </div>
              <div className={styles.titleControl} >
                <Tooltip title="关闭" onClick={this.close}>
                  <div className={styles.iconWrap}>
                    <Icon type="close" />
                  </div>
                </Tooltip>
              </div>
            </div>
            <div className={styles.titleContent}>
              <Row className={styles.parameter}>
                <Col span={12}>网络延迟：</Col>
                <Col span={8}>{value_yc}</Col>
                <Col span={4}>MS</Col>
              </Row>
              <Row className={styles.parameter}>
                <Col span={12}>帧率：</Col>
                <Col span={8}>{value_zl}</Col>
                <Col span={4}>FPS</Col>
              </Row>
              <Row className={styles.parameter}>
                <Col span={12}>下载速度：</Col>
                <Col span={8}>{value_sd}</Col>
                <Col span={4}>KB/S</Col>
              </Row>
            </div>
          </div>
        }
      </>
    );
  }
}

export default PerformanceMonitor;
