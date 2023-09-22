/* global Cesium */
/* global viewer */
/* global mars */
/* global $ */
/* global mars3d */
/* turf */

import React, { Component } from 'react';
import { Slider, Button, InputNumber, Row, Col, Icon } from 'antd';
import styles from './style.less';
import { connect } from 'dva';
import { PUBLIC_PATH } from '@/utils/config';
import BorderPoint from '../../../border-point';

const Ajax = require('axios');

@connect(({ Map }) => ({
  Map,
}))
class VisualAnalys extends Component {
  constructor(props) {
    super(props);
    this.state = {
      horizontalAngle: 120,
      verticalAngle: 45,
      distance: 100,
      translationX: 0,
      translationY: 0,
      translationZ: 0,
    };
  }
  addKsy = () => {
    //console.log("添加可视域");
    if (this.lastViewField) {
      this.deleteKsy();
    }
    let that = this;
    let thisViewField = new mars3d.analysi.ViewShed3D(viewer, {
      horizontalAngle: that.state.horizontalAngle,
      verticalAngle: that.state.verticalAngle,
      distance: that.state.distance,
      calback: function(distance) {
        that.lastViewPosition = new Cesium.Cartesian3(
          that.lastViewField.viewPosition.x,
          that.lastViewField.viewPosition.y,
          that.lastViewField.viewPosition.z,
        );
        that.setState({
          distance: distance,
        });
      },
    });
    this.lastViewField = thisViewField;
  };

  deleteKsy = () => {
    //console.log("删除可视域");
    if (this.lastViewField) {
      this.lastViewField.destroy();
      this.lastViewField = undefined;
    }
  };

  changeHA = value => {
    //console.log("改变水平视角"+value);
    this.setState({
      horizontalAngle: value,
    });
    if (this.lastViewField) {
      this.lastViewField.horizontalAngle = value;
    }
  };

  changeVA = value => {
    //console.log("改变垂直视角"+value);
    this.setState({
      verticalAngle: value,
    });
    if (this.lastViewField) {
      this.lastViewField.verticalAngle = value;
    }
  };

  changeDis = value => {
    //console.log("改变可视距离"+value);
    this.setState({
      distance: value,
    });
    if (this.lastViewField) {
      this.lastViewField.distance = value;
    }
  };

  changeDestination = options => {
    let that = this;
    let viewPositionX = this.lastViewPosition.x + options.x;
    let viewPositionY = this.lastViewPosition.y + options.y;
    let viewPositionZ = this.lastViewPosition.z + options.z;
    let viewPosition = new Cesium.Cartesian3(viewPositionX, viewPositionY, viewPositionZ);
    let cameraPosition = new Cesium.Cartesian3(
      this.lastViewField.cameraPosition.x,
      this.lastViewField.cameraPosition.y,
      this.lastViewField.cameraPosition.z,
    );
    let distance = this.lastViewField.distance;
    let horizontalAngle = this.lastViewField.horizontalAngle;
    let verticalAngle = this.lastViewField.verticalAngle;
    let lastViewField = new mars3d.analysi.ViewShed3D(viewer, {
      horizontalAngle: horizontalAngle,
      verticalAngle: verticalAngle,
      distance: distance,
      cameraPosition: cameraPosition || undefined,
      viewPosition: viewPosition || undefined,
      calback: function(distance) {
        that.setState({
          distance: distance,
        });
      },
    });
    //this.currentControl.position=viewPosition;
    this.lastViewField.destroy();
    this.lastViewField = lastViewField;
  };

  changeDes = value => {
    if (value.x) {
      //console.log("改变视点x"+value.x);
      this.setState({
        translationX: value.x,
      });
    } else if (value.y) {
      //console.log("改变视点y"+value.y);
      this.setState({
        translationY: value.y,
      });
    } else if (value.z) {
      //console.log("改变视点z"+value.z);
      this.setState({
        translationZ: value.z,
      });
    }
    if (this.lastViewField) {
      this.changeDestination({
        x: this.state.translationX,
        y: this.state.translationY,
        z: this.state.translationZ,
      });
    }
  };

  closePanel = () => {
    //console.log("关闭窗口");
    this.props.dispatch({
      type: 'Map/setToolsActiveKey',
      payload: 'visualAnalys',
    });
  };

  componentDidMount() {
    viewer.scene.globe.depthTestAgainstTerrain = true;
    viewer.scene.postProcessStages.fxaa.enabled = true;
    // // 打开可视域分析时，调整视角位置。
    // viewer.camera.setView({
    //   destination: new Cesium.Cartesian3.fromDegrees(113.926543, 22.494429, 415.42),
    //   orientation: {
    //     heading: Cesium.Math.toRadians(1.8),
    //     pitch: Cesium.Math.toRadians(-32.4),
    //     roll: Cesium.Math.toRadians(0),
    //   },
    // });
  }

  componentWillUnmount() {
    viewer.scene.globe.depthTestAgainstTerrain = false;
    viewer.scene.postProcessStages.fxaa.enabled = false;
    this.deleteKsy();
  }
  render() {
    return (
      <div className={styles.PipePanel}>
        <BorderPoint />
        <div className={styles.closeV} onClick={this.closePanel}>
          <Icon type="close" />
        </div>
        <div>
          <Row>
            <span>提示：点击添加按钮后，在地图区域左键点击确定可视域的起点与目标点</span>
          </Row>
          <Row>
            <Col span={4}>
              <div style={{ margin: '10px' }}>
                <span>水平张角：</span>
              </div>
            </Col>
            <Col span={15}>
              <Slider
                min={0}
                max={180}
                step={1}
                defaultValue={120}
                onChange={value => {
                  this.changeHA(value);
                }}
                value={
                  typeof this.state.horizontalAngle === 'number' ? this.state.horizontalAngle : 0
                }
              ></Slider>
            </Col>
            <Col span={3}>
              <InputNumber
                min={0}
                max={180}
                step={1}
                defaultValue={120}
                onChange={value => {
                  this.changeHA(value);
                }}
                value={this.state.horizontalAngle}
              ></InputNumber>
            </Col>
          </Row>
          <Row>
            <Col span={4}>
              <div style={{ margin: '10px' }}>
                <span>垂直张角：</span>
              </div>
            </Col>
            <Col span={15}>
              <Slider
                min={0}
                max={180}
                step={1}
                defaultValue={45}
                onChange={value => {
                  this.changeVA(value);
                }}
                value={typeof this.state.verticalAngle === 'number' ? this.state.verticalAngle : 0}
              ></Slider>
            </Col>
            <Col span={3}>
              <InputNumber
                min={0}
                max={180}
                step={1}
                defaultValue={45}
                onChange={value => {
                  this.changeVA(value);
                }}
                value={typeof this.state.verticalAngle === 'number' ? this.state.verticalAngle : 0}
              ></InputNumber>
            </Col>
          </Row>
          <Row>
            <Col span={4}>
              <div style={{ margin: '10px' }}>
                <span>可视距离：</span>
              </div>
            </Col>
            <Col span={15}>
              <Slider
                min={0}
                max={500}
                step={1}
                onRef={ref => (this.distanceDom = ref)}
                defaultValue={100}
                value={this.state.distance}
                onChange={value => {
                  this.changeDis(value);
                }}
              ></Slider>
            </Col>
            <Col span={3}>
              <InputNumber
                min={0}
                max={500}
                defaultValue={100}
                onChange={value => {
                  this.changeDis(value);
                }}
                value={typeof this.state.distance === 'number' ? this.state.distance : 0}
              ></InputNumber>
            </Col>
          </Row>
        </div>
        {/* <div>
                <div>
                    <span>视点移动：</span>
                </div>
                <div>
                    <span>X：</span>
                </div>
                    <Slider min={0} max={500} step={1} defaultValue={0} onChange={(value)=>{this.changeDes({x:value})}}></Slider>
                <div>
                    <span>Y：</span>
                </div>
                    <Slider min={0} max={500} step={1} defaultValue={0} onChange={(value)=>{this.changeDes({y:value})}}></Slider>
                <div>
                    <span>Z：</span>
                </div>
                    <Slider min={0} max={500} step={1} defaultValue={0} onChange={(value)=>{this.changeDes({z:value})}}></Slider>
            </div>  */}
        <div>
          <Button onClick={this.addKsy}>添加可视域</Button>
          &nbsp;&nbsp;&nbsp;
          <Button onClick={this.deleteKsy}>删除可视域</Button>
        </div>
      </div>
    );
  }
}

export default VisualAnalys;
