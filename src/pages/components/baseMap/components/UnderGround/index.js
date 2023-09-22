/* global mars3d */
import React, { Component } from 'react';
import {Slider,InputNumber} from 'antd'
import styles from './style.less'
// import UnderGround from './Underground.js'

class Underground extends Component {
    constructor(props){
        super(props);
        this.state={
            inputValue:1
        }
        this.underGround=null;
    }
    onChange = value => {
        this.setState({
          inputValue: value,
        });
        if(!this.underGround){
            let {viewer,Cesium}=window;
            viewer.scene.globe.depthTestAgainstTerrain = true;
            viewer.scene.globe.baseColor = new Cesium.Color(0, 0, 0, 0);
            this.underGround = new mars3d.analysi.Underground(viewer, {
                alpha: 1.0,
                // enable: true
              });
        }
        this.underGround.alpha=value;
        this.underGround.enable=true;
        if(value===1){
            this.underGround.enable=false;
        }
      };
    render() {
        const {inputValue} =this.state;
        return (
            <div className={styles.under}>
                <span>地表透明度</span>
                <Slider tooltipVisible={false} min={0} max={1} step={0.01} value={typeof inputValue === 'number' ? inputValue : 0} onChange={this.onChange}/>
                <InputNumber min={0} max={1} style={{ marginLeft: 16 }} step={0.01} value={inputValue} formatter={value => `${value*100}`} onChange={this.onChange}/>
                <span>%</span>
            </div>
        );
    }
}

export default Underground;