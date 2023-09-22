/* global Cesium */
/* global viewer */
/* global turf */
import React, { Component } from 'react';
import style from './styles.less'
import { connect } from 'dva'
// import SZ_DISTINCT_LINE from './data/shenzhen.geojson'
import SZ_DISTINCT_POLYGON from './data/shenzhen_polygon2.geojson'
import SZ_DISTINCT_LINE from './data/sz_distinct_part_line3.geojson'
import {debounces} from '@/utils/index';
import { getStatAll } from '@/service/house';
const Ajax = require('axios');
const TEXT_ALL_VALUES = [{ name: '全选', id: '1-all' }, { name: '全选', id: '2-all' }];
const startColor=Cesium.Color.fromCssColorString('#3AEFF0'); 
const endColor=Cesium.Color.fromCssColorString('#347ADF'); 
  @connect(({ House }) => ({
    House
  }))
class FilterItem extends Component {
    constructor(props) {
        super(props)
        this.state = {
          secondNodeList: [],
          paramDataObjId:'',
          activeIds: [TEXT_ALL_VALUES[0].id],
          activeNames:[],
          distinctBorderHash:{},
          regionItems:[],//区域判断
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
        // this.JdPolygonEntity={};//区名称：
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
            this.bindEvent();//重新添加绑定
        }
        // newPorps.instan(this)
    }

    componentDidMount(){
        this.props.instan && this.props.instan(this);
        // this.loadDistinct(SZ_DISTINCT_LINE);
        // this.loadDistinctPolygon(SZ_DISTINCT_POLYGON);
        this.bindEvent();
        // this.creatEntity();
        this.getStatAll();
        this.hanlderNewDistinct();
        viewer.scene.camera.moveEnd.addEventListener(debounces(this.cameraChangeEvent,500), this);
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
        // this.hanlderDistinct();
        // 获取地图层级
        let level = 0;
        if (viewer.scene.globe._surface._tilesToRender.length) {
          level = viewer.scene.globe._surface._tilesToRender[0].level;
        }
        // 获取屏幕中心点坐标
        let center=viewer.mars.getCenter();
        const {activeNames} = this.state;
        //判断层级--层级规则对应市-区-街道
        let distinct=0;
        // 判断中心点--区级--街道级  1-10(深圳市) 11-12（区） 13-16（街道）
        if(level>10 && level<13){
          distinct=1;
        }else if(level>12){
          distinct=2;
        }
        if(distinct==0) {
            if(activeNames.length!==0){
                this.topNodeClick({name:'1-all',id:'1-all'});
            }
            return;
        }
        var point=turf.point([center.x,center.y]);
        this.hanlderDistinct().then(()=>{
            const {regionItems} = this.state;
            const {rightActiveKey:activeKey} =this.props.House;
            if(regionItems.length===0) return;

            // const {regionData} =this.props.House;
            
            for (let i = 0; i < regionItems.length; i++) {
                const element = regionItems[i];
                if(turf.booleanPointInPolygon(point,element.feature)){
                    if(distinct===1){
                        // console.log("区级",element.name);
                        if(!activeNames.includes(element.name)){
                                this.topNodeClick(element.item);
                        }else{
                            // if(activeNames.length===1 || activeNames.length===0){
                            //     this.topNodeClick(element.item);
                            // }
                            if(activeNames.length===2){
                                let secondNodes=element.item.children.filter(child=>{
                                    return child.name===activeNames[1];
                                })
                                this.secondNodeClick(secondNodes[0]);
                            }
                        }
                            
                        return element.name;
                    }
                    // if(distinct===2){
                    //     let children=element.children;
                    //     for (let j = 0; j < children.length; j++) {
                    //         const child = children[j];
                    //         if(turf.booleanPointInPolygon(point,child)){
                    //             if(!activeNames.includes(child.properties.name)){
                    //                 //   if(activeNames && activeNames[0]!==child.properties.belongDistrict){
                    //                 //     this.setState({
                    //                 //         activeNames:[child.properties.belongDistrict]
                    //                 //     })
                    //                 //   }
                    //                 this.secondNodeClick(child.properties);
                    //             }
                                
                    //             return child;
                    //         }
                    //     }
                    // }
                }
            } 
        });   
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
                // console.log(data);
                // data.features.filter(item=>item.properties.name==="龙华区")
                regionData.forEach(element => {
                  let items=JSON.parse(element.geometry);
                  let features=items.features;
                  var polygons=[];
                  features.forEach(feature=>{
                  let options={properties:element.children.filter(item=>item.name===feature.properties.Name)[0]}
                    polygons.push(turf.lineToPolygon(feature,options));//街道
                  })
                  // var QuPolygon=turf.union(...polygons)//合并成区
                  // regionItems.push({name:element.name,feature:QuPolygon,children:polygons});
                  regionObjs.push({name:element.name,item:element,feature:data.features.filter(item=>item.properties.name===element.name)[0],children:polygons});
                  
                });
                // console.log(regionObjs)
                this.setState({
                  regionItems:regionObjs
                },()=>{
                    resolve();
                })
              })
        })
        
      }

      hanlderNewDistinct=()=>{
        const {regionData} =this.props.House;
        // const {regionItems} = this.state;
        if(!regionData) return Promise.resolve();
        // if(regionItems.length!==0) return Promise.resolve();
        var regionObjs={};
        return new Promise((resolve,reject)=>{
            Ajax(SZ_DISTINCT_POLYGON).then(res => {
                const {data} = res;
                // console.log(data);
                // data.features.filter(item=>item.properties.name==="龙华区")
                regionData.forEach(element => {
                  let items=JSON.parse(element.geometry);
                  let features=items.features;
                  var polygons=[];
                  features.forEach(feature=>{
                    let options={properties:element.children.filter(item=>item.name===feature.properties.Name)[0]}
                    // polygons.push(turf.lineToPolygon(feature,options));//街道
                    if(!regionObjs[feature.properties.Name]){
                        regionObjs[feature.properties.Name]=turf.lineToPolygon(feature,options);
                      }
                  })
                  // var QuPolygon=turf.union(...polygons)//合并成区
                  if(!regionObjs[element.name]){
                    regionObjs[element.name]=data.features.filter(item=>item.properties.name===element.name)[0];
                  }
                //   regionObjs.push({name:element.name,item:element,feature:data.features.filter(item=>item.properties.name===element.name)[0],children:polygons});
                  
                });
                // console.log(regionObjs)
                this.props.dispatch({
                    type: 'Commute/setRegionItems',
                    payload:regionObjs
                  })
              })
        })
        
      }

    bindEvent = () => {
         //相机移动事件监听
        
        this.handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
        this.handler.setInputAction((event)=> {
          const position = event.position;
          const pickedObject = viewer.scene.pick(position);
          if(pickedObject && pickedObject.id){
            const {data}=this.props;//区域列表
            const jdNames=this.state.secondNodeList;

            let name = pickedObject.id._name ? pickedObject.id._name : pickedObject.primitive._text;
            if(!name) return;
            data.map((item,index)=>{
                if(item.name===name){
                    this.topNodeClick(item,true);
                    return;
                }
            })

            // jdNames.map((item,index)=>{
            //     if(item.name===name){
            //         this.secondNodeClick(item,true);
            //         return;
            //     }
            // })
          }
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
        this.handler.setInputAction((movement) => {
            const pickedObject = viewer.scene.pick(movement.endPosition);
            if(pickedObject && pickedObject.id){
                let name = pickedObject.id._name ? pickedObject.id._name : pickedObject.primitive._text
                
                if(this.hightLightName){
                    if(this.QuPolygonHash[this.hightLightName]){
                        let originColor=this.QuPolygonHash[this.hightLightName].polygon.material.color.getValue();
                        this.QuPolygonHash[this.hightLightName].polygon.material = originColor.withAlpha(0.6);//Cesium.Color.WHITE.withAlpha(0.01)
                        this.QuPolygonHash[this.hightLightName].label.scale = 0.8;
                    }
                    // if(this.JdPolygonHash[this.hightLightName]){
                    //     let originColor=this.JdPolygonHash[this.hightLightName].polygon.material.color.getValue();
                    //     this.JdPolygonHash[this.hightLightName].polygon.material = originColor.withAlpha(0.6);//Cesium.Color.WHITE.withAlpha(0.01)
                    // }
                    
                    // console.log(1,this.hightLightName);
                }
                if(this.QuPolygonHash[name]){
                    let originColor=this.QuPolygonHash[name].polygon.material.color.getValue();
                    this.QuPolygonHash[name].polygon.material = originColor.withAlpha(0.9);//Cesium.Color.BLANCHEDALMOND.withAlpha(0.3)
                    this.QuPolygonHash[name].label.scale = 1.0;
                    this.hightLightName=name;
                    // console.log(2,this.hightLightName);
                }
                // if(this.JdPolygonHash[name]){
                //     let originColor=this.JdPolygonHash[name].polygon.material.color.getValue();
                //     this.JdPolygonHash[name].polygon.material = originColor.withAlpha(0.9);//Cesium.Color.BLANCHEDALMOND.withAlpha(0.3)
                //     this.hightLightName=name;
                //     // console.log(2,this.hightLightName);
                // }
            }else{
                if(this.hightLightName){
                    if(this.QuPolygonHash[this.hightLightName]){
                        let originColor=this.QuPolygonHash[this.hightLightName].polygon.material.color.getValue();
                        this.QuPolygonHash[this.hightLightName].polygon.material = originColor.withAlpha(0.6);//Cesium.Color.WHITE.withAlpha(0.01)
                        this.QuPolygonHash[this.hightLightName].label.scale = 0.8;
                    }
                    // if(this.JdPolygonHash[this.hightLightName]){
                    //     let originColor=this.JdPolygonHash[this.hightLightName].polygon.material.color.getValue();
                    //     this.JdPolygonHash[this.hightLightName].polygon.material = originColor.withAlpha(0.6);//Cesium.Color.WHITE.withAlpha(0.01)
                    // }
                    
                    // console.log(3,this.hightLightName);
                    this.hightLightName=null;
                }
            }

        },Cesium.ScreenSpaceEventType.MOUSE_MOVE)
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
        if(this.QuPolygonHash){
            for (let key in this.QuPolygonHash) {
                let entity=this.QuPolygonHash[key];
                entity.show=false;
            }
        }
        // this.QuPolygonEntity[quName]
        if(this.QuPolygonEntity){
            for (let key in this.QuPolygonEntity) {
                let entity=this.QuPolygonEntity[key];
                entity.show=false;
            }
        }

        
    }

    setEntityColor=(chartData,ratio)=>{
        const {min,range}=ratio || this.props.ratio;
        let color=new Cesium.Color();
        chartData.forEach(item => {
            if(this.QuPolygonHash[item.area]){
                var ratio=item.ratio?(item.ratio-min) / range:0;
                Cesium.Color.lerp(startColor,endColor,ratio,color);
                this.QuPolygonHash[item.area].polygon.material=color.withAlpha(0.6);
            }
            if(this.JdPolygonHash[item.area]){
                var ratio=item.ratio?(item.ratio-min) / range:0;
                Cesium.Color.lerp(startColor,endColor,ratio,color);
                this.JdPolygonHash[item.area].polygon.material=color.withAlpha(0.6);
            }
        });
    }

    startPlay=()=>{
        const {quName,jdName}=this.props.House;
        if(quName=="" && jdName==""){
            // this.bindEvent();   
            if(this.QuPolygonHash){
                for (let key in this.QuPolygonHash) {
                    let entity=this.QuPolygonHash[key];
                    entity.show=true;
                }
            }
        }
        if(quName && jdName==''){
            // this.bindEvent(); 
            // if(this.QuPolygonHash){
                // this.QuPolygonHash[quName].show=true;
                this.QuPolygonEntity[quName].show=true;
                var entities=this.QuPolygonEntity[quName].entities.values;
                entities.forEach(entity => {
                    entity.show=true;
                });

            // }

        }
    }
    hideDistinct=()=>{
        this.distinctEntity.map((item,index)=>{
            item.show=false;
        })
        // this.JdPolygonEntity.map((item,index)=>{
        //     item.show=true;
        // })
        
    }
    showDistinct=()=>{
        const {type}=this.props;
        this.distinctEntity.map((item,index)=>{
            item.show=true;
            let values=item.entities.values;
            type!=='fluid' && values.forEach(element => {
                element.show=true;
            });
        })
        // this.JdPolygonEntity.map((item,index)=>{
        //     item.show=false;
        // })
    }

    flyTo=(bbox,isSelfHand)=>{
        const {activeNames,paramDataObjId} =this.state;
        let regionLabel='';
        let param={};
        activeNames.map((item,index)=>{
            regionLabel+= item+"/";
            if(index==0) param.quName=item;
            if(index==1) param.jdName=item;
        })
        regionLabel=regionLabel.substr(regionLabel,regionLabel.length-1);
        this.props.getRegionLabel(regionLabel,param);
        if(!isSelfHand) return;
        if(bbox){
            let rectangle=Cesium.Rectangle.fromDegrees(bbox[0],bbox[1],bbox[2],bbox[3]);
            // Cesium.computeFlyToLocationForRectangle(rectangle,viewer.scene);
            viewer.camera.flyTo({
                destination:rectangle
            })
        }else{
            const centeropt = {
                "x": 114.14347633526161,
                "y": 22.63403261589422,
                "z": 93996.87093563561,
                "heading": 360,
                "pitch": -90,
                "roll": 360
              };
            const height = centeropt.z || 2500;
            viewer.camera.flyTo({
                destination: Cesium.Cartesian3.fromDegrees(centeropt.x, centeropt.y, height), //经度、纬度、高度
                orientation: {
                heading: Cesium.Math.toRadians(centeropt.heading || 0), //绕垂直于地心的轴旋转
                pitch: Cesium.Math.toRadians(centeropt.pitch || -90), //绕纬度线旋转
                roll: Cesium.Math.toRadians(centeropt.roll || 0) //绕经度线旋转
                },
                duration: 2
            });
        }
    }

    topNodeClick = (item, isSelfHand) => {
        const {pickMode,isPick}= this.props.House;
        const {type}=this.props;
        // 选择的是全选，不可以被取消,paramDataObjId为一级目录id
        // 其他选择可以被取消，取消后则下级目录不显示，全部被选中1
        const { activeIds,distinctBorderHash,activeNames } = this.state;
        let nextState = {};
        const menuActiveId = activeNames[0];
        // if(distinctBorderHash[menuActiveId]){
        //     distinctBorderHash[menuActiveId].show=false;
        // }
        // if(activeNames[1] && distinctBorderHash[activeNames[1]]){
        //     distinctBorderHash[activeNames[1]].show=false;
        // }
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
            nextState.paramDataObjId = item.name;
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
            // if(distinctBorderHash[item.name]){
            //     // distinctBorderHash[item.name].show=true;
            //     // 请求街道区域
            //     if(!distinctBorderHash[item.name].hasSubDistinct){
            //         this.loadStreetDistinct(JSON.parse(item.geometry),item.name);
            //         this.loadStreetPolygon(JSON.parse(item.geometryPlane),item.name);
            //         distinctBorderHash[item.name].hasSubDistinct=true;
            //     } else{
            //         // 显示当前区所有街道
                    if(this.streetEntityHash[item.name]){
                        this.streetEntityHash[item.name].show=true;
                        let entities=this.streetEntityHash[item.name].entities.values;
                        entities.map((entity,index)=>{
                            entity.show=true;
                        }) 
                        if(type=='job'){
                            this.QuPolygonEntity[item.name].show=true;
                        }
                    }
                // }               
            // }
            
        }
        
        this.setState(nextState,()=>{
            this.flyTo(this.targetBbox,isSelfHand);
            
        });

        //重新绑定
        if(!this.handler && !pickMode){
            this.bindEvent();
        }
        
    }
    //区分主动点击、被动点击、搜索跳转
    secondNodeClick= (item, isSelfHand) => {
        // 选择的是全选，不可以被取消,paramDataObjId为top级目录id
        // 其他选择可以被取消，取消后则下级目录不显示，全部被选中
        const { activeIds ,activeNames,activeBboxs,distinctBorderHash} = this.state;
        const {pickMode,isPick}= this.props.House;
        let nextState = {};
        const menuActiveId = activeIds[1];

        if(this.QuPolygonEntity[activeNames[0]]){
            this.QuPolygonEntity[activeNames[0]].show=false;
        }
        if(activeNames.length==0){
            this.hideDistinct();
            // this.QuPolygonEntity[activeNames[0]].show=false;
        }

        // if(this.streetEntityHash[activeNames[0]]){
            if(activeNames[0]!==item.belongDistrict){
                if(this.streetEntityHash[activeNames[0]]){
                    let entities=this.streetEntityHash[activeNames[0]].entities.values;
                    entities.forEach((entity,index)=>{
                        entity.show=false;
                    })
                }
            }
            let entities=this.streetEntityHash[item.belongDistrict].entities.values;
            entities.forEach((entity,index)=>{
                entity.show=true;
            })
        // }
        
        // if(this.JdPolygonHash[menuActiveId]){
        //     this.JdPolygonHash[menuActiveId].show=true;
            
        // }
        // distinctBorderHash[activeNames[0]] && distinctBorderHash[activeNames[0]].show=false;
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
                this.bindEvent();
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
            // 隐藏当前区下属街道的所有实体//多边形，去除街道多边形的点击事件
            // if(this.QuPolygonEntity[activeNames[0]]){
            //     this.QuPolygonEntity[activeNames[0]].show=false;
            // }
            
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
            // if(!distinctEntityHash[name]){
            //     distinctEntityHash[name]=entity;
            //     entity.hasSubDistinct=false;
            // }
            // entity.show=false;
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
            // entity.wall=new Cesium.WallGraphics({
            //     positions: positions,
            //     maximumHeights,
            //     minimumHeights,
            //     material: new Cesium.ImageMaterialProperty({
            //         transparent: true,
            //         image: getColorRamp({
            //         0.0: 'rgba(68, 157, 247, 1.0)',
            //         0.045: 'rgba(68, 157, 247, 0.8)',
            //         0.1: 'rgba(68, 157, 247, 0.6)',
            //         0.15: 'rgba(68, 157, 247, 0.4)',
            //         0.37: 'rgba(68, 157, 247, 0.2)',
            //         0.54: 'rgba(68, 157, 247, 0.1)',
            //         1.0: 'rgba(68, 157, 247, 0)'
            //         })
            //     }),
            // });
        })

        // let polygon=dataSource.
        
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
            // if (!this.JdPolylineHash[name]) {
            //     this.JdPolylineHash[name] = entity;
            //     entity.hasSubDistinct=false;
            // }
            entity.show=false;
            entity.polyline.width = 3;
            entity.polyline.material = new Cesium.PolylineGlowMaterialProperty({
                glowPower: .6,
                color: Cesium.Color.fromCssColorString('#1694E7').withAlpha(.9)
            })
            // //添加Wall,循环坐标点
            // let positions=entity.polyline.positions.getValue();
            // let maximumHeights = [];
            // let minimumHeights = [];
            // if (positions) {
            //     positions.forEach((item, index) => {
            //         // if (index % 2 === 0) {
            //             maximumHeights.push(200);
            //             minimumHeights.push(0);
            //         // }
            //     });
            // }
            // entity.wall=new Cesium.WallGraphics({
            //     positions: positions,
            //     maximumHeights,
            //     minimumHeights,
            //     material: new Cesium.ImageMaterialProperty({
            //         transparent: true,
            //         image: getColorRamp({
            //         0.0: 'rgba(68, 157, 247, 1.0)',
            //         0.045: 'rgba(68, 157, 247, 0.8)',
            //         0.1: 'rgba(68, 157, 247, 0.6)',
            //         0.15: 'rgba(68, 157, 247, 0.4)',
            //         0.37: 'rgba(68, 157, 247, 0.2)',
            //         0.54: 'rgba(68, 157, 247, 0.1)',
            //         1.0: 'rgba(68, 157, 247, 0)'
            //         })
            //     }),
            // });
        })
        
    }

    //区边界polygon-geojson.1、初始隐藏；2、区定位时显示对应区
    loadDistinctPolygon= async (url)=>{
        const {chartData}=this.props;
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
            // let color=new Cesium.Color();
            // Cesium.Color.lerp(startColor,endColor,Math.random(),color);
            entity.polygon.material = Cesium.Color.WHITE.withAlpha(0.01);//color.withAlpha(0.6);//Cesium.Color.WHITE.withAlpha(0.01);//测试用颜色 bule 0.7
            entity.polygon.outline = false;
            entity.polygon.clampToGround = true;
            // entity.polygon.extrudedHeight=10;
            entity.polygon.classificationType=Cesium.ClassificationType.BOTH;
            // 添加区名称，计算中心点坐标
            let polyPositions = entity.polygon.hierarchy.getValue().positions;
            let polyCenter = Cesium.BoundingSphere.fromPoints(polyPositions).center;
            entity.position=polyCenter;
            entity.label=new Cesium.LabelGraphics({
                text:name,
                scale:0.8,
                disableDepthTestDistance:Number.POSITIVE_INFINITY
            });
            // entity.tooltip=this.createTooltip(name);
        })  
        this.setEntityColor(chartData); 
    }

    createTooltip=(name)=>{
        if(!this.statAll){
            return null;
        }
        let item=this.statAll.get(name);
        if(!item){
            return null;
        }
        let html=`<div class="${style.tooltip}">
                <div class="${style.content}">
                    <div class="${style.item}">
                        <span class="${style.name}">名称:</span>
                        <span class="${style.value}">${item.name}</span>
                    </div>
                  <div class="${style.item}">
                    <span class="${style.name}">地块:</span>
                    <span class="${style.value}">${item.parcel}</span>
                  </div>
                  <div class="${style.item}">
                    <span class="${style.name}">楼栋:</span>
                    <span class="${style.value}">${item.building}</span>
                  </div>
                  <div class="${style.item}">
                    <span class="${style.name}">房屋:</span>
                    <span class="${style.value}">${item.house}</span>
                  </div>
                </div>
              </div>`;
        return {
            html:html
        }
    }
    //区边界polygon-geojson.1、初始隐藏；2、区定位时显示对应区
    loadStreetPolygon= async (url,quName)=>{
        const {chartData}=this.props;
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
            // let color=new Cesium.Color();
            // Cesium.Color.lerp(startColor,endColor,Math.random(),color);

            if(name==="粤海街道" || name==="航城街道"){
                let position=entity.polygon.hierarchy.getValue().holes[0];
                entity.polygon.hierarchy.setValue(position);
            }
            entity.polygon.material = Cesium.Color.WHITE.withAlpha(0.01);//color.withAlpha(0.6);//Cesium.Color.WHITE.withAlpha(0.01);
            entity.polygon.outline = false;
            entity.polygon.clampToGround = true;
            // entity.polygon.extrudedHeight=11;
            entity.polygon.classificationType=Cesium.ClassificationType.BOTH;

            
            
            // 添加区名称，计算中心点坐标
            let polyPositions = entity.polygon.hierarchy.getValue().positions;
            let polyCenter = Cesium.BoundingSphere.fromPoints(polyPositions).center;
            entity.position=polyCenter;
            entity.label=new Cesium.LabelGraphics({
                text:name,
                scale:0.4,
                disableDepthTestDistance:Number.POSITIVE_INFINITY
            });
            // entity.tooltip=this.createTooltip(name);
        })   
        this.setEntityColor(chartData);
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