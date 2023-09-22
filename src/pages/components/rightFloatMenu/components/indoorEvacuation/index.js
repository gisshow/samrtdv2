/* global Cesium */
/* global viewer */
/* global mars3d */
/* global haoutil */
import React, { Component } from 'react';
import { Collapse } from 'antd';
import styles from './style.less';
import { request } from '@/utils/request';
import { connect } from 'dva';
import { PUBLIC_PATH } from '@/utils/config'
import RootContainer from '@/components/rootContainer'
import PersonURL from './walk.glb';
// const dataURL =require('./data.json');
const Ajax = require('axios');
var datacutover;
const { Panel } = Collapse

//室内漫游面板
@connect((Map) => ({
    Map
  }))

class IndoorEvacuation extends Component{
    constructor(props){
        super(props);
        this.state = {
          panelshow: true,
          evacuationType:true,
          optimalcamera:{}
        }
        this.personDataSource=null;

        this.cache={};
        this.startTime=Cesium.JulianDate.now();
        this.scatchTime=new Cesium.JulianDate();
        this.clipTileset=null;
        this.startPosition=null;
    }
    
     componentDidMount(){       
        // 获取数据并加载人物模型
        // let data1 = await Ajax.get(dataURL);
        // var result = data1.data;
        this.setTime();
        // this.handlerData(dataURL.features);
        this.getData();
        this.init();//初始化相关模型及状态
    }
    //卸载
    componentWillUnmount(){
        if(this.personDataSource){
            viewer.dataSources.remove(this.personDataSource);
            this.personDataSource=null;
        }
        if(this.clipTileset){
            this.clipTileset.clear();
            this.clipTileset=null;
        }

        //回到默认位置，还原参数配置
        if(this.startPosition){
            viewer.camera.flyTo({
                destination : Cesium.Cartesian3.fromDegrees(this.startPosition.x, this.startPosition.y, this.startPosition.z),
                orientation: {
                    heading: Cesium.Math.toRadians(this.startPosition.heading),
                    pitch: Cesium.Math.toRadians(this.startPosition.pitch),
                    roll: Cesium.Math.toRadians(this.startPosition.roll)
                },
                complete:()=>{
                    viewer.mars.keyboardRoam.applyCollision=true;
                    viewer.mars.keyboardRoam.applyGravity=true;
                }
            });
        }
    }

    //获取疏散数据
    getData=async ()=>{
        let result =await request("/vb/emulator/emulate-indoor");
        if(result && result.success){
            this.addPersonEntity(result.data);
        }
        
    }

    //目前默认固定书城的疏散模型
    init=()=>{
        this.startPosition=viewer.mars.getCameraView();
        let tileset=this.props.tileset;
        // 设置为顶视视角，
        // 裁剪掉模型顶部，
        // 关掉碰撞检测
        let position= {"y":22.548704,"x":114.054451,"z":168.06,"heading":359.7,"pitch":-88.6,"roll":0};
        viewer.camera.flyTo({
            destination : Cesium.Cartesian3.fromDegrees(position.x, position.y, position.z),
            orientation: {
            heading: Cesium.Math.toRadians(position.heading),
            pitch: Cesium.Math.toRadians(position.pitch),
            roll: Cesium.Math.toRadians(position.roll)
            }
        });

        viewer.mars.keyboardRoam.applyCollision=false;
        viewer.mars.keyboardRoam.applyGravity=false;

        if(tileset){
            var clipTileset = new mars3d.tiles.TilesClipPlan(tileset);
            this.clipTileset=clipTileset;
            clipTileset.type=mars3d.tiles.TilesClipPlan.Type.ZR;
            clipTileset.distance = 5.4;
        }
    }

    handlerData=(datas)=>{
        for (let i = 0; i < datas.length; i++) {
            var data=datas[i];
            if(!this.cache[data.properties.pedesreian]){
                this.cache[data.properties.pedesreian]=[];
            }
            this.cache[data.properties.pedesreian].push(data.properties);
            // if(this.cache[data.properties.pedesreian]){
            //     this.cache[data.properties.pedesreian].push(data.properties);
            // }else{
            //     this.cache[data.properties.pedesreian]=[];
            //     this.cache[data.properties.pedesreian].push(data.properties);
            // }
            
        }
        this.addPersonEntity(this.cache);

    }

    //添加人物模型
    addPersonEntity=(datas)=>{
        var personDataSource=new Cesium.CustomDataSource('person');//运动的点
        // for (const key in datas) {
        for (let k = 0; k < datas.length; k++) {

            // if (datas.hasOwnProperty(key)) {
                const items = datas[k].data;
                // let position=null;
                let property = new Cesium.SampledPositionProperty();
                for (let i = 0; i < items.length; i++) {
                    const item = items[i];
                    let position = Cesium.Cartesian3.fromDegrees(Number(item.xcoord84), Number(item.ycoord84), 12.3);
                    let time=Cesium.JulianDate.addSeconds(this.startTime,item.ms/1000,new Cesium.JulianDate());
                    property.addSample(time, position);
                }

                personDataSource.entities.add({
                    // id:carData.name,
                    position: property,
                    orientation: new Cesium.VelocityOrientationProperty(property),
                    // label: {
                    //   text: key,
                    // //   font: 'normal small-caps normal 19px 楷体',
                    //   style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                    //   fillColor: Cesium.Color.AZURE,
                    //   outlineColor: Cesium.Color.BLACK,
                    //   outlineWidth: 2,
                    //   horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
                    //   verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                    // //   pixelOffset: new Cesium.Cartesian2(10, -25), //偏移量
                    // },
                    // point:{
                    //     show:true,
                    //     color:Cesium.Color.WHITE,
                    // }
                    model: {
                      uri: PersonURL,
                    //   color:Cesium.Color.RED,
                    //   scale:0.01,
                    //   minimumPixelSize: 30,
                    },
                    path: {
                      show: true,
                      resolution: 1,
                      leadTime: 0,
                      trailTime: 3600,
                      material: new Cesium.PolylineGlowMaterialProperty({
                        glowPower: 0.5,
                        color: Cesium.Color.YELLOW.withAlpha(0.8),
                      }),
                      width: 2,
                    },
                    // mouseover: function (entity) {//移入
                    //   // haoutil.msg('你鼠标移入到billboard：' + entity._name);
          
                    // },
                  });
                
            // }
        }
    
        viewer.dataSources.add(personDataSource);
        this.personDataSource=personDataSource;

        // viewer.clock.currentTime = this.startTime;
    }

    setTime=()=>{
        // const {startTime,endTime}=this.state;
        let start =this.startTime.clone();
        let stop = Cesium.JulianDate.addSeconds(start,3600,this.scatchTime);
    
    
        viewer.clock.startTime = start.clone();//{dayNumber: 2458755, secondsOfDay: 43237}
        viewer.clock.stopTime = start.clone.call(stop);
        viewer.clock.currentTime = start.clone();
        viewer.clock.clockRange = Cesium.ClockRange.LOOP_STOP;
        viewer.clock.multiplier = 3;
    
        viewer.clock.shouldAnimate = false;
      }
 
    //显示或隐藏面板
    hideshowpanel=()=>{
        const { panelshow } = this.state;
        this.setState({
            panelshow: !panelshow
        })
    }

    //关闭面板,退回到室内模式
    closepanel=()=>{
        this.props.dispatch({
            type: 'Map/setIndoorKey',
            payload: "indoorroam"
        })
    }

    //开始模拟
    startEvacuation=()=>{
        this.setState({
            evacuationType:false
        })

        viewer.clock.shouldAnimate = true;
    }
    //暂停模拟
    stopEvacuation=()=>{
        this.setState({
            evacuationType:true
        })
        viewer.clock.shouldAnimate = false;
    }

    reset=()=>{
        viewer.clock.currentTime = this.startTime.clone();
        viewer.clock.shouldAnimate = false;
        this.setState({
            evacuationType:true
        })
    }

    //返回室内漫游
    backToIndoorroam=()=>{
        this.props.dispatch({
            type: 'Map/setIndoorKey',
            payload: "indoorroam"
        })
    }
   
    render(){
        const { panelshow,evacuationType } = this.state;
        return(
            <RootContainer>
                <div  className={`${styles.box} ${panelshow === true ? styles.panelShow : styles.panelHide}`}  id={"nihaoss"} >
                    <div>
                        <div className={styles.lefttop}></div>
                        <div className={styles.righttop}></div>
                        <div className={styles.rightbottom}></div>
                        <div className={styles.leftbottom}></div>
                    </div>
                    <div className={styles.headertxts}>
                        <div className={styles.tiliecontent}>室内疏散</div>
                        <div className={styles.operation}>
                            <div className={styles.closebut} title="关闭" onClick={()=>{this.closepanel()}}>X</div>
                            <div className={styles.minimize} title="最小化" onClick={()=>{this.hideshowpanel()}}>
                                <div className={styles.minline}></div>
                                <div className={styles.minline}></div>
                                <div className={styles.minline}></div>
                            </div>
                        </div>
                    </div>
                    <div className={styles.zconnect}>
                        <div>
                            {
                                evacuationType === true ? <div className={styles.Keyplace} onClick={()=>{this.startEvacuation()}}>开始模拟</div> : <div className={styles.Keyplace} onClick={()=>{this.stopEvacuation()}}>暂停模拟</div>
                            }
                        </div>
                        <div className={styles.backplace}>
                            <div className={styles.Keyplace} onClick={()=>{this.reset()}}>重置</div>
                            <div className={styles.Keyplace} onClick={()=>{this.backToIndoorroam()}} >返回</div>
                        </div>
                    </div>
                </div>
            </RootContainer>
        )
    }
}

export default IndoorEvacuation;