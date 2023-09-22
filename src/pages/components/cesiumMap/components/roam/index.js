import React, { Component } from 'react';
import {Slider} from 'antd';
import firstperson from './firstperson';
import styles from './style.less'
import { connect } from 'dva'

const Cesium = window.Cesium;
let Monomerizationshow,moveStep=100,$this;
@connect(({Map }) => ({
    Map
}))
class Roam extends Component {
    constructor(props){
        super(props);
        const {viewer} =window;  
        this.state={
            moveStep:moveStep
          }  
        Monomerizationshow= new Cesium.ScreenSpaceEventHandler(viewer.canvas);
        $this=this;
      }

    componentDidMount() {
        const {viewer} =window;
        if(!viewer.mars.keyboardRoam.enable){
            viewer.mars.keyboardRoam.bind({
                speedRatio: 100,    //平移步长，值越大步长越小。
                dirStep: 5,        //相机原地旋转步长，值越大步长越小。
                rotateStep: 1.0,    //相机围绕目标点旋转速率，0.3 - 2.0
                minPitch: 0.1,      //最小仰角  0 - 1
                maxPitch: 0.95,     //最大仰角  0 - 1
            });
        }else{
            viewer.mars.keyboardRoam.bind();
            viewer.mars.keyboardRoam.moveStep=Number(100);
        }
        window.keyboardRoam=true;
        //滚轮监听事件
        //Monomerizationshow.setInputAction(this.WheellEvent, Cesium.ScreenSpaceEventType.WHEEL);
    }
    
    componentWillUnmount() {
        const {viewer} =window;
        //firstperson.uninstall(viewer);
        viewer.mars.keyboardRoam.unbind();
        window.keyboardRoam=false;
        //取消滚轮监听事件
        //Monomerizationshow.removeInputAction(Cesium.ScreenSpaceEventType.WHEEL);
    }
    onChange=value=>{
        const {viewer} =window;
        value=Number(value)
        if(value<0){
            value=(1+value/100).toFixed(2);
            if(value==0){
                value=0.01;
            }
        }
        if(value==0){
            value=1.0;
        }
        // console.log(value);
        //firstperson.setSpeedRatio(value);
        let newmoveStep=value;
        if(value<1){
           newmoveStep=(1-value)*(-100);
        }        
        viewer.mars.keyboardRoam.moveStep=Number(value);
        this.setState({
            moveStep:newmoveStep
        })
    }
    WheellEvent(){
        const {viewer} =window;  
        let newmoveStep=150;  
        var level = 0;//层级
        if (viewer.scene.globe._surface._tilesToRender.length) {
            level = viewer.scene.globe._surface._tilesToRender[0].level
        }
        let levelList=[10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25];
        let newmoveStepList=[100,90,80,70,60,50,40,30,20,10,0,-10,-20,-30,-40,-50]
        let index=levelList.indexOf(level);
        newmoveStep=newmoveStepList[index];
        $this.onChange(newmoveStep);      
       
    }
    close=()=>{
        this.props.dispatch({
            type: 'Map/setToolsActiveKey',
            payload: ''
        })
    }
    render() {
        const {moveStep} =this.state
        return (
            <div className={styles.roam}>
                <div className={styles.close} onClick={()=>{this.close()}}><span className="iconfont icon_add"></span></div>
                <span className={styles.name}>漫游速率：</span>
                <span className={styles.label}>0.01</span>
            <Slider tooltipVisible={false} min={-100} max={100} step={1} value={moveStep} onChange={this.onChange}/>
                <span className={styles.label}>100</span>
            </div>
        );
    }
}

export default Roam;