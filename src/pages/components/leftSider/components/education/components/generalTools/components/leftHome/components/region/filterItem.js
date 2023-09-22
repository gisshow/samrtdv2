/* global Cesium */
/* global viewer */
/* global turf */
import React, { Component } from 'react';
import style from './styles.less'
import { connect } from 'dva'
import SZ_DISTINCT_POLYGON from './data/shenzhen_polygon2.geojson'
import SZ_DISTINCT_LINE from './data/sz_distinct_part_line3.geojson'
import {debounces} from '@/utils/index';
import { getStatAll } from '@/service/house';
const Ajax = require('axios');
const TEXT_ALL_VALUES = [{ name: '全选', id: '1-all' }, { name: '全选', id: '2-all' }];
const getColorRamp = (elevationRamp) => {
    if (elevationRamp == null) {
      elevationRamp = { 0.0: "blue", 0.1: "cyan", 0.37: "lime", 0.54: "yellow", 1: "red"};
    }
    var ramp = document.createElement('canvas');
    ramp.width = 1;
    ramp.height = 100;
    var ctx = ramp.getContext('2d');
    var grd = ctx.createLinearGradient(0, 0, 0, 100);
    for (var key in elevationRamp) {
      grd.addColorStop(1 - Number(key), elevationRamp[key]);
    }
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, 1, 100);
    return ramp;
  }
  @connect(({ House }) => ({
    House
  }))
class FilterItem extends Component {
    constructor(props) {
        super(props)
        this.state = {
          secondNodeList:props.secondNodeList,
          paramDataObjId:'',
          activeIds:props.activeIds,
          activeNames:props.activeNames,
          distinctBorderHash:{},
          regionItems:[],//区域判断
          topNode:{},
          secondNodeTow:{},
        }
        this.firstBbox=null;
        this.targetBbox=null;
        this.distinctEntity=[];//区实体
        this.streetEntityHash={};//区：街道实体线实体

        this.JdPolylineHash={};//街道名称：街道实体线

        this.handler=null;
        this.hightLightName=null;
        this.QuPolygonHash={};//区名称：区实体
        this.JdPolygonHash={};//街道名称：enity
        this.QuPolygonEntity={};//区名称:所有街道实体,add
    }

    componentWillReceiveProps(newPorps) {
        const {pickMode} =this.props.House;
        const {pickMode:newPickMode} =newPorps.House;
    

        if(newPickMode && newPickMode!==pickMode){
            //移除事件绑定
            this.unbindEvent();
        }
        if(!newPickMode && newPickMode!==pickMode){
            // this.bindEvent();//重新添加绑定
        }
        // newPorps.instan(this)
    }

    componentDidMount(){
        this.props.onRef(this)
        // this.bindEvent();
        this.getStatAll();
        // viewer.scene.camera.moveEnd.addEventListener(debounces(this.cameraChangeEvent,500), this);
    }

    // 获取行政区的所有统计信息
    getStatAll=async ()=>{
        let statAll= await getStatAll();
        if(statAll && statAll.success && statAll.data){
            this.statAll=new Map();
            statAll.data.forEach(item=>{
                this.statAll.set(item.name,item);
            })
        }
        this.loadDistinct(SZ_DISTINCT_LINE);
        this.loadDistinctPolygon(SZ_DISTINCT_POLYGON);
        this.creatEntity();
        // this.cameraChangeEvent();//执行区域计算
    }

    //初始状态就创建出所有的多边形实体
    creatEntity=()=>{
        const {data} = this.props;
        data.forEach(item=>{
            this.loadStreetPolygon(JSON.parse(item.geometryPlane),item.name);
            this.loadStreetDistinct(JSON.parse(item.geometry),item.name);
        })
    }

    cameraChangeEvent =()=>{
        // // 获取地图层级
        // let level = 0;
        // if (viewer.scene.globe._surface._tilesToRender.length) {
        //   level = viewer.scene.globe._surface._tilesToRender[0].level;
        // }
        // // 获取屏幕中心点坐标
        // let center=viewer.mars.getCenter();
        // const {activeNames} = this.state;
        // //判断层级--层级规则对应市-区-街道
        // let distinct=0;
        // // 判断中心点--区级--街道级  1-10(深圳市) 11-12（区） 13-16（街道）
        // if(level>10 && level<13){
        //   distinct=1;
        // }else if(level>12){
        //   distinct=2;
        // }
        // if(distinct==0) {
        //     if(activeNames.length!==0){
        //         this.topNodeClick({name:'1-all',id:'1-all'});
        //     }
        //     return;
        // }
        // var point=turf.point([center.x,center.y]);
        // this.hanlderDistinct().then(()=>{
        //     const {regionItems} = this.state;
        //     const {rightActiveKey:activeKey} =this.props.House;
        //     if(regionItems.length===0) return;

        //     for (let i = 0; i < regionItems.length; i++) {
        //         const element = regionItems[i];
        //         if(turf.booleanPointInPolygon(point,element.feature)){
        //             if(distinct===1){
        //                 console.log("区级",element.name);
        //                 if(!activeNames.includes(element.name)){
        //                         this.topNodeClick(element.item);
        //                 }else{
        //                     if(activeNames.length===2){
        //                         let secondNodes=element.item.children.filter(child=>{
        //                             return child.name===activeNames[1];
        //                         })
        //                         this.secondNodeClick(secondNodes[0]);
        //                     }
        //                 }
                            
        //                 return element.name;
        //             }
        //             if(distinct===2){
        //                 let children=element.children;
        //                 for (let j = 0; j < children.length; j++) {
        //                     const child = children[j];
        //                     if(turf.booleanPointInPolygon(point,child)){
        //                         if(!activeNames.includes(child.properties.name)){
        //                             this.secondNodeClick(child.properties);
        //                         }
                                
        //                         return child;
        //                     }
        //                 }
        //             }
        //         }
        //     } 
        // });   
      }
    
      //处理行政区划边界，用于判断点是否在多边形内
      hanlderDistinct=()=>{
        const {regionData} =this.props.House;
        const {regionItems} = this.state;
        if(!regionData) return Promise.resolve();
        if(regionItems.length!==0) return Promise.resolve();
        var regionObjs=[];
        return new Promise((resolve,reject)=>{
            Ajax(SZ_DISTINCT_POLYGON).then(res => {
                const {data} = res;
                regionData.forEach(element => {
                  let items=JSON.parse(element.geometry);
                  let features=items.features;
                  var polygons=[];
                  features.forEach(feature=>{
                  let options={properties:element.children.filter(item=>item.name===feature.properties.Name)[0]}
                    polygons.push(turf.lineToPolygon(feature,options));//街道
                  })
                  regionObjs.push({name:element.name,item:element,feature:data.features.filter(item=>item.properties.name===element.name)[0],children:polygons});
                  
                });
                this.setState({
                  regionItems:regionObjs
                },()=>{
                    resolve();
                })
              })
        })
        
      }

    bindEvent = () => {
         //相机移动事件监听
        
        // this.handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
        // this.handler.setInputAction((event)=> {
        //   const position = event.position;
        //   const pickedObject = viewer.scene.pick(position);
        //   if(pickedObject && pickedObject.id){
        //     const {data}=this.props;//区域列表
        //     const jdNames=this.state.secondNodeList;

        //     let name = pickedObject.id._name ? pickedObject.id._name : pickedObject.primitive._text;
        //     if(!name) return;
        //     data.map((item,index)=>{
        //         if(item.name===name){
        //             this.topNodeClick(item,true);
        //             return;
        //         }
        //     })

        //     jdNames.map((item,index)=>{
        //         if(item.name===name){
        //             this.secondNodeClick(item,true);
        //             return;
        //         }
        //     })
        //   }
        // }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
        
      }
    
      unbindEvent=()=>{
          if(this.handler){
            this.handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK);
            this.handler.removeInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE);
            this.handler = this.handler && this.handler.destroy();
            // 清除高亮
            if(this.hightLightName){
                if(this.QuPolygonHash[this.hightLightName]){
                    this.QuPolygonHash[this.hightLightName].polygon.material = Cesium.Color.WHITE.withAlpha(0.01)
                    this.QuPolygonHash[this.hightLightName].label.scale = 0.8;
                }
                if(this.JdPolygonHash[this.hightLightName]){
                    this.JdPolygonHash[this.hightLightName].polygon.material = Cesium.Color.WHITE.withAlpha(0.01)
                }
                this.hightLightName=null;
            }
          }          
         
      }
    
    componentWillUnmount=()=>{
        this.distinctEntity.map((item,index)=>{
            viewer.dataSources.remove(item);
        })


        if(this.QuPolygonEntity){
            for (let key in this.QuPolygonEntity) {
                let entity=this.QuPolygonEntity[key];
                viewer.dataSources.remove(entity);
            }
        }
        if(this.streetEntityHash){
            for (let key in this.streetEntityHash) {
                let entity=this.streetEntityHash[key];
                viewer.dataSources.remove(entity);
            }
        }
        
 
        this.unbindEvent();   
        let listenter=viewer.scene.camera.moveEnd._listeners.pop();
        viewer.scene.camera.moveEnd._scopes.pop();
        viewer.scene.camera.moveEnd.removeEventListener(listenter, this); 
    }
    hide=()=>{
        const {distinctBorderHash,activeNames} =this.state;
    }
    hideDistinct=()=>{
        this.distinctEntity.map((item,index)=>{
            item.show=false;
        })
        
    }
    showDistinct=()=>{
        this.distinctEntity.map((item,index)=>{
            item.show=true;
            let values=item.entities.values;
            values.forEach(element => {
                element.show=true;
            });
        })
    }

    setReset=(secondNodeList,activeIds,activeNames)=>{
        this.setState({
            secondNodeList:secondNodeList,
            activeIds:activeIds,
            activeNames:activeNames,  
        })
    }

    flyTo=(bbox,isSelfHand)=>{
        const {secondNodeList,activeIds,activeNames,paramDataObjId,topNode,secondNodeTow} =this.state;
        let regionLabel='';
        activeNames.map((item,index)=>{
            regionLabel+= item+"/";
        })
        regionLabel=regionLabel.substr(regionLabel,regionLabel.length-1);
        this.props.getRegionLabel(regionLabel,paramDataObjId,secondNodeList,activeIds,activeNames,topNode,secondNodeTow);
        if(!isSelfHand) return;
        // if(bbox){
        //     let rectangle=Cesium.Rectangle.fromDegrees(bbox[0],bbox[1],bbox[2],bbox[3]);
        //     viewer.camera.flyTo({
        //         destination:rectangle
        //     })
        // }else{
        //     const centeropt = {
        //         "x": 114.14347633526161,
        //         "y": 22.63403261589422,
        //         "z": 93996.87093563561,
        //         "heading": 360,
        //         "pitch": -90,
        //         "roll": 360
        //       };
        //     const height = centeropt.z || 2500;
        //     viewer.camera.flyTo({
        //         destination: Cesium.Cartesian3.fromDegrees(centeropt.x, centeropt.y, height), //经度、纬度、高度
        //         orientation: {
        //         heading: Cesium.Math.toRadians(centeropt.heading || 0), //绕垂直于地心的轴旋转
        //         pitch: Cesium.Math.toRadians(centeropt.pitch || -90), //绕纬度线旋转
        //         roll: Cesium.Math.toRadians(centeropt.roll || 0) //绕经度线旋转
        //         },
        //         duration: 2
        //     });
        // }
    }

    topNodeClick = (item, isSelfHand) => {
        const {pickMode,isPick}= this.props.House;
        // 选择的是全选，不可以被取消,paramDataObjId为一级目录id
        // 其他选择可以被取消，取消后则下级目录不显示，全部被选中1
        this.setState({
            topNode:item,
        })
        const { activeIds,distinctBorderHash,activeNames,secondNodeList} = this.state;
        let nextState = {};
        const menuActiveId = activeNames[0];
        if(this.streetEntityHash[menuActiveId]){
            this.streetEntityHash[menuActiveId].show=false;
        }
        if(this.QuPolygonEntity[menuActiveId]){
            this.QuPolygonEntity[menuActiveId].show=false;
        }
        isPick && this.props.dispatch({
            type: 'House/setIsPick',
            payload: false,
        });
        
        if (item.id === TEXT_ALL_VALUES[0].id || menuActiveId === item.name) {
            this.showDistinct();
            nextState.paramDataObjId = '';
            nextState.activeIds = [TEXT_ALL_VALUES[0].id];
            nextState.secondNodeList = [];
            nextState.activeNames=[];
            this.targetBbox=false;
            this.props.dispatch({
                type: 'House/setRegionName',
                payload:{
                    quName:'',
                    jdName:'',
                }
              })
        } else {
            this.hideDistinct();
            nextState.activeIds = [item.name, TEXT_ALL_VALUES[1].id];
            nextState.activeNames=[item.name];
            nextState.paramDataObjId = '';
            nextState.secondNodeList = item.children || [];
            this.targetBbox=item.minLongitude ? [item.minLongitude,item.minLatitude,item.maxLongitude,item.maxLatitude] : false;
            this.firstBbox=this.targetBbox;
            
            this.props.dispatch({
                type: 'House/setRegionName',
                payload:{
                    quName:item.name,
                    jdName:'',
                }
            })
            // 显示当前区所有街道
            if(this.streetEntityHash[item.name]){
                this.streetEntityHash[item.name].show=true;
                let entities=this.streetEntityHash[item.name].entities.values;
                entities.map((entity,index)=>{
                    entity.show=true;
                }) 
                this.QuPolygonEntity[item.name].show=true;
            }
            
        }
        
        this.setState(nextState,()=>{
            this.flyTo(this.targetBbox,isSelfHand);
        });
        //重新绑定
        if(!this.handler && !pickMode){
            // this.bindEvent();
        }
    }
    //区分主动点击、被动点击、搜索跳转
    secondNodeClick= (item, isSelfHand) => {
        // 选择的是全选，不可以被取消,paramDataObjId为top级目录id
        // 其他选择可以被取消，取消后则下级目录不显示，全部被选中
        this.setState({
            secondNodeTow:item,
        })
        const { activeIds ,activeNames,activeBboxs,distinctBorderHash,secondNodeList} = this.state;
        const {pickMode,isPick}= this.props.House;
        let nextState = {};
        const menuActiveId = activeIds[1];

        if(this.QuPolygonEntity[activeNames[0]]){
            this.QuPolygonEntity[activeNames[0]].show=false;
        }
        if(activeNames.length==0){
            this.hideDistinct();
        }
        // if(activeNames[0]!==item.belongDistrict){
        //     if(this.streetEntityHash[activeNames[0]]){
        //         let entities=this.streetEntityHash[activeNames[0]].entities.values;
        //         entities.forEach((entity,index)=>{
        //             entity.show=false;
        //         })
        //     }
        // }else{
        //     let entities=this.streetEntityHash[item.belongDistrict].entities.values;
        //     entities.forEach((entity,index)=>{
        //         entity.show=true;
        //     })
        // }
        if (item.id === TEXT_ALL_VALUES[1].id || menuActiveId === item.name) {
            nextState.paramDataObjId = '';
            nextState.activeIds = [activeIds[0], TEXT_ALL_VALUES[1].id];
            nextState.activeNames=[activeNames[0]];
            this.targetBbox=this.firstBbox;
            if(this.QuPolygonEntity[activeNames[0]]){
                this.QuPolygonEntity[activeNames[0]].show=true;
            }

            isPick && this.props.dispatch({
                type: 'House/setIsPick',
                payload: false,
            });

            this.props.dispatch({
                type: 'House/setJdName',
                payload:''
              })
            //重新绑定
            if(!this.handler && !pickMode){
                // this.bindEvent();
            }
        } else {
            nextState.activeIds = [activeIds[0], item.name];
            nextState.paramDataObjId = item.name;
            nextState.activeNames=[item.belongDistrict,item.name];
            this.targetBbox=item.minLongitude ? [item.minLongitude,item.minLatitude,item.maxLongitude,item.maxLatitude] : false;
            if(this.streetEntityHash[item.belongDistrict]){
                this.streetEntityHash[item.belongDistrict].show=true;
                let entities=this.streetEntityHash[item.belongDistrict].entities.values;
                entities.map((entity,index)=>{
                    if(entity.name!==item.name){
                        entity.show=false;
                    }
                })
            }
            
            this.props.dispatch({
                type: 'House/setJdName',
                payload:item.name,
            })
            !isPick && this.props.dispatch({
                type: 'House/setIsPick',
                payload: true,
            });
            //点击街道后清除绑定事件
            this.unbindEvent();
        }
        this.setState(nextState,()=>{
           this.flyTo(this.targetBbox,isSelfHand);
        });
        
    }
    //区边界line-geojson.1、初始隐藏；2、区定位时显示对应区
    loadDistinct= async (url)=>{
        const {distinctBorderHash} =this.state;
        let options = {
            clampToGround: true //开启贴地
        };
        let dataSource = await Cesium.GeoJsonDataSource.load(url, options);
        // geocachePromise.then(function(dataSource) {
        viewer.dataSources.add(dataSource);
        this.distinctEntity.push(dataSource);
        const entities = dataSource.entities.values;
        entities.forEach(entity => {
            const name = entity.name;
            if (!distinctBorderHash[name]) {
                distinctBorderHash[name] = entity;
                entity.hasSubDistinct=false;
            }
            entity.polyline.width = 3;
            entity.polyline.material = new Cesium.PolylineGlowMaterialProperty({
                glowPower: .6,
                color: Cesium.Color.fromCssColorString('#1694E7').withAlpha(.9)
            })
            // 添加Wall,循环坐标点
            let positions=entity.polyline.positions.getValue();
            let maximumHeights = [];
            let minimumHeights = [];
            if (positions) {
                positions.forEach((item, index) => {
                    // if (index % 2 === 0) {
                        maximumHeights.push(200);
                        minimumHeights.push(0);
                    // }
                });
            }
        })
        
    }

    loadStreetDistinct= async (url,quName)=>{
        const {distinctBorderHash} =this.state;
        let options = {
            clampToGround: true //开启贴地
        };
        let dataSource = await Cesium.GeoJsonDataSource.load(url, options);
        // dataSource.show=false;
        // geocachePromise.then(function(dataSource) {
        viewer.dataSources.add(dataSource);
        // this.streetEntity.push(dataSource);
        if(!this.streetEntityHash[quName]){
            this.streetEntityHash[quName]=dataSource;
        }
        const entities = dataSource.entities.values;
        entities.forEach(entity => {
            const name = entity.name;
            entity.show=false;
            entity.polyline.width = 3;
            entity.polyline.material = new Cesium.PolylineGlowMaterialProperty({
                glowPower: .6,
                color: Cesium.Color.fromCssColorString('#1694E7').withAlpha(.9)
            })
        })
        
    }

    //区边界polygon-geojson.1、初始隐藏；2、区定位时显示对应区
    loadDistinctPolygon= async (url)=>{
        let options = {
            clampToGround: true //开启贴地
        };
        let dataSource = await Cesium.GeoJsonDataSource.load(url, options);
        viewer.dataSources.add(dataSource);
        this.distinctEntity.push(dataSource);
        const entities = dataSource.entities.values;
        entities.forEach(entity => {
            let name=entity.name;
            if(!this.QuPolygonHash[name]){
                this.QuPolygonHash[name]=entity;
            }
            entity.polygon.material = Cesium.Color.WHITE.withAlpha(0.01);//测试用颜色 bule 0.7
            entity.polygon.outline = false;
            entity.polygon.clampToGround = true;
            // entity.polygon.extrudedHeight=10;
            entity.polygon.classificationType=Cesium.ClassificationType.BOTH;
            // 添加区名称，计算中心点坐标
            // let polyPositions = entity.polygon.hierarchy.getValue().positions;
            // let polyCenter = Cesium.BoundingSphere.fromPoints(polyPositions).center;
            // entity.position=polyCenter;
            // entity.label=new Cesium.LabelGraphics({
            //     text:name,
            //     scale:0.8,
            //     disableDepthTestDistance:Number.POSITIVE_INFINITY
            // });
        })   
    }

    //区边界polygon-geojson.1、初始隐藏；2、区定位时显示对应区
    loadStreetPolygon= async (url,quName)=>{
        let options = {
            clampToGround: true //开启贴地
        };
        let dataSource = await Cesium.GeoJsonDataSource.load(url, options);
        dataSource.show=false;
        viewer.dataSources.add(dataSource);
        // this.JdPolygonEntity.push(dataSource);
        if(!this.QuPolygonEntity[quName]){
            this.QuPolygonEntity[quName]=dataSource;
        }
        const entities = dataSource.entities.values;
        entities.forEach(entity => {
            let name=entity.name;
            if(!this.JdPolygonHash[name]){
                this.JdPolygonHash[name]=entity;
            }
            entity.polygon.material = Cesium.Color.WHITE.withAlpha(0.01);
            entity.polygon.outline = false;
            entity.polygon.clampToGround = true;
            // entity.polygon.extrudedHeight=11;
            entity.polygon.classificationType=Cesium.ClassificationType.BOTH;

            // 添加区名称，计算中心点坐标
            // let polyPositions = entity.polygon.hierarchy.getValue().positions;
            // let polyCenter = Cesium.BoundingSphere.fromPoints(polyPositions).center;
            // entity.position=polyCenter;
            // entity.label=new Cesium.LabelGraphics({
            //     text:name,
            //     scale:0.4,
            //     disableDepthTestDistance:Number.POSITIVE_INFINITY
            // });
        })   
    }



    render() {
        const {
            secondNodeList,
            activeIds,
            activeNames
        } = this.state
        const { data: dataTop} = this.props;
        const {jdName,quName} = this.props.House;
        return (
            <div className={style.filter}>
                <div className={style.title}>
                    <span>深圳市
                        {
                            activeNames.map((item,index)=>{
                                return '/'+item;
                            })
                        }
                </span>
                </div>
                <div className={style.group}>
                    <div className={`${style.topNode} ${!!secondNodeList.length ? style.borderRight: ''}`}>
                    {
                        [TEXT_ALL_VALUES[0], ...dataTop].map((item, index) => {
                        return (
                            <div className={(activeIds[0] === item.name || activeIds[0] === item.id) ? style.item + ' ' + style.active : style.item} onClick={() => this.topNodeClick(item,true)} key={index}>
                            <span style={{ marginRight: 6 }}>{item.name}</span>
                            </div>
                        )
                        })
                    }
                    </div>
                    {/* {
                        !!secondNodeList.length &&
                        (
                            <div className={style.secondNode}>
                            {
                                [TEXT_ALL_VALUES[1], ...secondNodeList].map((item, index) => {
                                return (
                                    <div className={(activeIds[1] === item.name || activeIds[1] === item.id) ? style.item + ' ' + style.active : style.item} onClick={() => this.secondNodeClick(item,true)}  key={index}>
                                    <span>{item.name}</span>
                                    </div>)
                                })
                            }
                            </div>
                        )
                    } */}
                </div>
            </div>
        );
    }
}

export default FilterItem;