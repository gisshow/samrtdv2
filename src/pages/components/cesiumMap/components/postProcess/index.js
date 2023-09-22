/* global Cesium */
/* global viewer */
import React, { Component } from 'react';
import {Slider, Icon} from 'antd'
import styles from './style.less'
import colorPost from './post'
import { connect } from 'dva'
import BorderPoint from '../../../border-point'
@connect(({BaseMap,Map }) => ({
    BaseMap,Map
  }))
class PostProcess extends Component {
    constructor(props){
        super(props);
        const {checkedKey} =this.props.BaseMap || 'postProcessValue';
        this.checkedKey = checkedKey
        let storage = window.localStorage;
        let info=storage.getItem(checkedKey) || '{}';
        info=JSON.parse(info);
        this.postProcessValue = info
        this.state={
            brightness:info.brightness || 1.02,
            saturation: info.saturation || 1.0,
            contrast: info.contrast || 1.2,
        }
    }
    componentWillReceiveProps(newPorps){
        const {checkedKey} =this.props.BaseMap;
        let newMapKey=newPorps.BaseMap.checkedKey;
       
        //切换底图（实景和电子）
        if(newMapKey && checkedKey!==newMapKey){
            let storage = window.localStorage;
            let info=storage.getItem(newMapKey) || '{}';
            info=JSON.parse(info);
            this.setState({
                brightness:info.brightness || 1.0,
                saturation: info.saturation || 1.0,
                contrast: info.contrast || 1.0,
            });
            this.stage.uniforms.brightness= info.brightness || 1.0;
            this.stage.uniforms.saturation= info.saturation || 1.0;
            this.stage.uniforms.contrast= info.contrast || 1.0;
        }
      }

    componentDidMount(){
        const {brightness,saturation,contrast} =this.state;
        let stage=undefined;
        if(!viewer.scene.postProcessStages.contains(colorPost)){
            stage=viewer.scene.postProcessStages.add(colorPost);
        }else{
            stage=colorPost;
        }
        this.stage=stage;
        this.stage.enabled=true;
        this.stage.uniforms.brightness= brightness;
        this.stage.uniforms.saturation= saturation;
        this.stage.uniforms.contrast= contrast;
    }
    init=()=>{

    }
    
    onChange=(value,type)=>{
        this.stage.uniforms[type]= value;
        // console.log(type,'---',value);
        this.postProcessValue[type] = value
        let parem={};
        parem[type]=value;

        this.setState(parem);
    }

    //保存参数到缓存localStorage
    saveUniforms=()=>{
        const {checkedKey} =this.props.BaseMap;
        // key==='DIGITAL'
        var storage = window.localStorage;
        storage.removeItem(checkedKey);
        let info={
            "brightness":this.stage.uniforms.brightness,
            "saturation":this.stage.uniforms.saturation,
            "contrast":this.stage.uniforms.contrast
        };
        storage.setItem(checkedKey, JSON.stringify(info));
        this.props.dispatch({
            type: 'Map/setToolsActiveKey',
            payload: ''
          })
    }
    close=()=>{
        const {checkedKey} =this.props.BaseMap || 'postProcessValue';
        let storage = window.localStorage;
        let info=storage.getItem(checkedKey) || null;
        info=JSON.parse(info);
        if(info){
            this.stage.uniforms.brightness= info.brightness||1.02;
            this.stage.uniforms.saturation= info.saturation||1.0;
            this.stage.uniforms.contrast= info.contrast||1.2;
            this.setState({
                brightness:info.brightness||1.02,
                saturation:info.saturation||1.0,
                contrast:info.contrast||1.2,
            },()=>{
                this.props.dispatch({
                    type: 'Map/setToolsActiveKey',
                    payload: ''
                })
            });
        }else{
            this.stage.uniforms.brightness= 1.02;
            this.stage.uniforms.saturation= 1.0;
            this.stage.uniforms.contrast= 1.2;
            this.setState({
                brightness:1.02,
                saturation:1.0,
                contrast:1.2,
            },()=>{
                this.props.dispatch({
                    type: 'Map/setToolsActiveKey',
                    payload: ''
                })
            });
        }
    }
    reset=()=>{
        const {checkedKey} =this.props.BaseMap || 'postProcessValue';
        this.stage.uniforms.brightness= 1.02;
        this.stage.uniforms.saturation= 1.0;
        this.stage.uniforms.contrast= 1.2;
        var storage = window.localStorage;
        storage.removeItem(checkedKey);
        this.setState({
            brightness:1.02,
            saturation:1.0,
            contrast:1.2,
        });
    }
    render() {
        const {brightness,saturation,contrast} =this.state;
        return (
            <div className={styles.box}>
                <BorderPoint/>
                <div className={styles.close} onClick={()=>{this.close()}}>
                    <Icon type="close"/>
                </div>
                <div className={styles.item}>
                    <span>亮度</span>
                    <Slider tooltipVisible={false} min={0} max={3} step={0.01}  value={brightness} onChange={(value)=>{this.onChange(value,"brightness")}}/>
                </div>
                <div className={styles.item}>
                    <span>饱和度</span>
                    <Slider tooltipVisible={false} min={0} max={3} step={0.01}  value={saturation}  onChange={(value)=>{this.onChange(value,"saturation")}}/>
                </div>
                <div className={styles.item}>
                    <span>对比度</span>
                    <Slider tooltipVisible={false} min={0} max={3} step={0.01}  value={contrast} onChange={(value)=>{this.onChange(value,"contrast")}}/>
                </div>
                <div className={styles.btn}>
                    <span onClick={()=>{this.saveUniforms()}}>保存</span>
                    <span onClick={()=>{this.reset()}}>重置</span>
                </div>
            </div>
        );
    }
}

export default PostProcess;