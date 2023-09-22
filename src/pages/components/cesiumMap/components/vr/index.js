/* global Cesium */
/* global viewer */
/* global mars */
/* global mars3d */

import React, { Component } from 'react';
import { connect } from 'dva';

class VR extends Component {
  constructor(props) {
    super(props);  
  }
  componentDidMount() {
   //这句话打开VR
   viewer.scene.useWebVR = true;
   //WebVR相关参数: 眼镜的视角距离（单位：米）
   viewer.scene.eyeSeparation = 100.0
   //WebVR相关参数: 焦距
   viewer.scene.focalLength = 5.0

   var viewModel = new Cesium.VRButtonViewModel(viewer.scene);

   viewModel.command();

  }
  componentWillUnmount() {
    viewer.scene.useWebVR = false;
    // if(this.viewModel){
    //   this.viewModel.command();
    // }

  }

  render(){
    return null;
  }

}

export default VR;