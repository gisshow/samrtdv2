/* global Cesium */
/* global viewer */
/* global mars */

import React, { Component } from 'react';
import styles from './style.less'
import { connect } from 'dva';
import {getBuildBySpace,getLandBySpace} from '@/service/house';
import RootContainer from '@/components/rootContainer'


//cesium笛卡尔空间坐标 转 经纬度坐标【用于转geojson】
function cartesian2lonlat(cartesian) {
    var carto = Cesium.Cartographic.fromCartesian(cartesian);
    if (carto == null) return null;

    var x = formatNum(Cesium.Math.toDegrees(carto.longitude), 6);
    var y = formatNum(Cesium.Math.toDegrees(carto.latitude), 6);
    var z = formatNum(carto.height, 2);

    return [x, y, z];
}

//数组，cesium笛卡尔空间坐标 转 经纬度坐标【用于转geojson】
function cartesians2lonlats(positions) {
    var coordinates = [];
    for (var i = 0, len = positions.length; i < len; i++) {
        var point = cartesian2lonlat(positions[i]);
        if (point) coordinates.push(point[0]+" "+point[1]);
    }
    //闭合坐标串
    var point = cartesian2lonlat(positions[0]);
    if (point) coordinates.push(point[0]+" "+point[1]);

    return coordinates.toString();
}

//格式化 数字 小数位数
function formatNum(num, digits) {
    return Number(Number(num).toFixed(digits || 0));
}

function coordinatesArrayToCartesianArray(coordinates) {
    var positions = new Array(coordinates.length);
    for (var i = 0; i < coordinates.length; i++) {
      var coord=coordinates[i];
    //   coord=coord.split(" ");
        positions[i] = Cesium.Cartesian3.fromDegrees(coord[0], coord[1])
    }
    return positions;
  }



  function polygonToGeojson(polygonStr){
    var geojson={};  
    if(polygonStr.startsWith('POLYGON')){
        geojson['type']='Polygon';
        var firstLeftIndex=polygonStr.indexOf('(');
        var lastRightIndex=polygonStr.indexOf(')');
        var str=polygonStr.substring(firstLeftIndex+1,polygonStr.length-1);
        var rArray=new Array();
        var ringsArray=str.split("),(");
        for (let j = 0; j < ringsArray.length; j++) {
            var ringStr= ringsArray[j];
            if(ringsArray.length===1){
                ringStr=ringStr.substring(1,ringStr.length-1);
            }else if(j===0){
                ringStr=ringStr.substring(1,ringStr.length);
            }else if(j===ringsArray.length-1){
                ringStr=ringStr.substring(0,ringStr.length-1);
            }
            var ptsArray=new Array();
            var pointArr=ringStr.split(",");
            for (let k = 0; k < pointArr.length; k++) {
                var pt_arr = pointArr[k].split(" ");
                // var proj_arr=
                ptsArray.push(pt_arr);
                
            }
            rArray.push(ptsArray);
            
        }
        geojson["coordinates"]=rArray;

    }else if(polygonStr.startsWith('MULTIPOLYGON')){
        //多面
        geojson['type']='MultiPolygon';
        var firstLeftIndex=polygonStr.indexOf('(');
        var lastRightIndex=polygonStr.indexOf(')');
        var str=polygonStr.substring(firstLeftIndex+1,polygonStr.length-1);
        var pArray=new Array();
        var polygonArray=str.split(")),((");
        for (let i = 0; i < polygonArray.length; i++) {
            var pStr= polygonArray[i];
            if(polygonArray.length===1){
                pStr=pStr.substring(1,pStr.length-1);
            }else if(i===0){
                pStr=pStr.substring(1,pStr.length)+")";
            }else if(i===polygonArray.length-1){
                pStr="("+pStr.substring(0,pStr.length-1);
            }else{
                pStr="("+pStr+")";
            }
            var rArray=new Array();
            var ringsArray=pStr.split("),(");
            for (let j = 0; j < ringsArray.length; j++) {
                var ringStr= ringsArray[j];
                if(ringsArray.length===1){
                    ringStr=ringStr.substring(1,ringStr.length-1);
                }else if(j===0){
                    ringStr=ringStr.substring(1,ringStr.length);
                }else if(j===ringsArray.length-1){
                    ringStr=ringStr.substring(0,ringStr.length-1);
                }
                var ptsArray=new Array();
                var pointArr=ringStr.split(",");
                for (let k = 0; k < pointArr.length; k++) {
                    var pt_arr = pointArr[k].split(" ");
                    // var proj_arr=
                    ptsArray.push(pt_arr);
                    
                }
                rArray.push(ptsArray);
                
            }
            pArray.push(rArray);
            
        }
        geojson["coordinates"]=pArray;
    }
    return geojson;
  }

@connect(({ House }) => ({
    House
  }))

class Query extends Component {
    constructor(props) {
        super(props);
        this.state = {
            activeKey:"rectangle"
        }
        this.dataSources=[];
    }
    
    drawPolygon = () => {

        this.clearDraw(true);
        viewer.mars.draw.startDraw({
            type: "polygon",
            style: {
                color: "#ffff00",
                opacity: 0.2,
                clampToGround: true,
            },
            success: (entity)=> {
                this.query(entity);
            }
        });
        this.setState({
            activeKey:'polygon',
        })
    }

    drawRectangle=()=> {
        this.clearDraw(true);
        viewer.mars.draw.startDraw({
            type: "rectangle",
            style: {
                color: "#ffff00",
                opacity: 0.2,
                clampToGround: true,
            },
            success: (entity)=> { 
                this.query(entity);
            }
        });
        this.setState({
            activeKey:'rectangle',
        })
    }

    drawCircle=()=> {
        this.clearDraw(true);
        viewer.mars.draw.startDraw({
            type: "circle",
            style: {
                color: "#ffff00",
                opacity: 0.2,
                clampToGround: true,
            },
            success: (entity)=> { 
                // console.log(entity);
                this.query(entity);
            }
        });
        this.setState({
            activeKey:'circle',
        })
    }

    clearDraw=(unPick)=>{
        
        viewer.mars.draw.clearDraw();
        this.dataSources.map((dataSource)=>{
            viewer.dataSources.remove(dataSource);
        })
        if(unPick){
            this.props.dispatch({
                type: 'House/setIsPick',
                payload: false,
            });
            this.setState({
                activeKey:'',
            })
        }

        this.props.dispatch({
            type:"House/setSpaceQueryParam",
            payload:undefined,
        })

        // 如果不是行政区统计面板，则退回到行政区统计面板
        this.reload();
    }

    reload=()=>{
        const {jdName} =this.props.House;
        if(!jdName) return;
        let param={
            "jdName":jdName
        };
        //重新刷新统计列表，实体列表
        // this.props.dispatch({
        //     type: 'House/getBuildList',
        //     payload: param
        // })
        this.props.dispatch({
            type: 'House/getParcelList',
            payload: param
        })
        // this.props.dispatch({
        //     type: 'House/getParcelStatistics',
        //     payload: param
        //   })
        // this.props.dispatch({
        //     type: 'House/getBuildStatistics',
        //     payload: param
        // })
        // this.props.dispatch({
        //     type: 'House/getRoomStatistics',
        //     payload: param
        // })

        //删除空间统计面板
        this.props.dispatch({
            type:'House/setStatType',
            payload:{
                isRenderSubStat:false,
            }
        })
    }

    query= async (entity)=>{
        const { detailType } = this.props.House;
        // 获取坐标串
        let position=[];
        let dataParam={};
        // let geoParam={}
        if (entity.rectangle) {
            let rectangle=entity.rectangle.coordinates.getValue();
            position.push(Cesium.Ellipsoid.WGS84.cartographicToCartesian(Cesium.Rectangle.northwest(rectangle)));
            position.push(Cesium.Ellipsoid.WGS84.cartographicToCartesian(Cesium.Rectangle.northeast(rectangle)));
            position.push(Cesium.Ellipsoid.WGS84.cartographicToCartesian(Cesium.Rectangle.southeast(rectangle)));
            position.push(Cesium.Ellipsoid.WGS84.cartographicToCartesian(Cesium.Rectangle.southwest(rectangle)));   
            let polygon=cartesians2lonlats(position);
            dataParam={"geo":"POLYGON(("+polygon+"))"}; 
        }else if(entity.polygon){
            position = entity.polygon.hierarchy.getValue().positions;
            let polygon=cartesians2lonlats(position);
            dataParam={"geo":"POLYGON(("+polygon+"))"}; 
        }else if(entity.ellipse){
            let radius= entity.ellipse.semiMajorAxis.getValue();
            let center=entity.position.getValue();
            let point=cartesian2lonlat(center);
            dataParam={"circle":`${point[0]} , ${point[1]} ,${radius}`};
        }

        // console.log(dataParam);
        this.props.dispatch({
            type:"House/setSpaceQueryParam",
            payload:dataParam,
        })
        // let polygon=cartesians2lonlats(position);
        // let dataParam=entity.ellipse ?:{
        //     "geo":"POLYGON(("+polygon+"))"
        // }
        let buildResult={};
        let landResult={};
        //获取data后，直接dispacth更新列表({
        //   type: 'setBuildList',
        //   payload: { data:result }
        // });
        // if(rightActiveKey==="building"){
            buildResult=await getBuildBySpace(dataParam);
            if(buildResult.success && buildResult.data){
                // console.log("Build空间查询记录条数："+buildResult.data.length+" 条");
                this.addBuild(buildResult.data);
                //更新列表
                this.props.dispatch({
                    type: 'House/setBuildList',
                    payload: { data:buildResult.data }
                })
            }
            // if(result.status==="ok"){
            //     console.log("Build空间查询记录条数："+result.result.data.length+" 条");
            //     this.addBuild(result.result.data);
            // }
        // }else if(rightActiveKey==="land"){
            landResult=await getLandBySpace(dataParam);
            if(landResult.success && landResult.data){
                // console.log("Land空间查询记录条数："+landResult.data.length+" 条");
                this.addLand(landResult.data);
                //更新列表
                this.props.dispatch({
                    type: 'House/setLandList',
                    payload: { data:landResult.data }
                })
            }
            // if(result.status==="ok"){
            //     console.log("Land空间查询记录条数："+result.result.data.length+" 条");
            //     this.addLand(result.result.data);
            // }
        // }

        this.props.dispatch({
            type: 'House/getParcelStatisticsBySpace',
            payload: dataParam
        })
        this.props.dispatch({
            type: 'House/getBuildStatisticsBySpace',
            payload: dataParam
        })
        this.props.dispatch({
            type: 'House/getRoomStatisticsBySpace',
            payload: dataParam
        })
        this.props.dispatch({
            type: 'House/getPopulationStatisticsBySpace',
            payload: dataParam
        })
        this.props.dispatch({
            type: 'House/getLegalPersonStatisticBySpace',
            payload: dataParam
        })

        // 行政区统计面板

        //详情面板隐藏
        if(detailType && detailType.isRenderDetail){
            this.props.dispatch({
                type:'House/setDetailType',
                payload:{
                  ...detailType,
                  isRenderDetail:false,
                }
            })
        }

        //显示相关统计信息
        this.props.dispatch({
            type:'House/setStatType',
            payload:{
              isRenderSubStat:true,
              type:"query",
              title:"空间",
            }
          })
        
        // 设置 可点选
        this.props.dispatch({
            type: 'House/setIsPick',
            payload: true,
        });
        
    }

    //加载楼数据--2个dataSource
    addBuild = (buildData) => {
        let dataSource=new Cesium.CustomDataSource('build_query');
        viewer.dataSources.add(dataSource);
        this.dataSources.push(dataSource);
        buildData.map((item,index)=>{
            // let positions=[];
            // let location=polygonToGeojson(item.xtSpaceLocation);
            let positions=[];
            let location={};
            try {
                location=JSON.parse(item.location);
                if(location.type==="MultiPolygon"){
                    positions = location.coordinates[0][0];
                }else if(location.type==="Polygon"){
                    positions = location.coordinates[0];
                }
            } catch (error) {
                console.log(item.location);
            }
            // try {
            //     // location=JSON.parse(item.location);
            //     if(location.type==="MultiPolygon"){
            //     positions = location.coordinates[0][0];
            //     }else if(location.type==="Polygon"){
            //     positions = location.coordinates[0];
            //     }
            // } catch (error) {
            //     console.log(item.location);
            // }
            let entity=dataSource.entities.add({
                // id:'build'+item.id,
                polygon:{
                    hierarchy : {
                        positions : coordinatesArrayToCartesianArray(positions),
                    },
                    material:Cesium.Color.fromCssColorString("#35EAA5").withAlpha(0.6),//Cesium.Color.SPRINGGREEN,//Cesium.Color.fromRandom({alpha:1.0}),
                    // extrudedHeight:parseFloat(item.bldgHeight) || 50,
                    classificationType:Cesium.ClassificationType.BOTH,
                    // width:3,
                    clampToGround:true,
                },
                
                // properties:new Cesium.PropertyBag({objectid:item.id,basicBldgId:item.basicId,buildingId:item.attributes.basicBldgId,bldgHeight:parseFloat(item.bldgHeight) || 50}),
            }) 
        })   
    }

    addLand =(landData)=>{
        
        let dataSource=new Cesium.CustomDataSource('land_query');
        viewer.dataSources.add(dataSource);
        this.dataSources.push(dataSource);
        landData.map((item,index)=>{
            let positions=[];
            let location={};
            try {
                location=JSON.parse(item.location);
                if(location.type==="MultiPolygon"){
                    positions = location.coordinates[0][0];
                }else if(location.type==="Polygon"){
                    positions = location.coordinates[0];
                }
            } catch (error) {
                console.log(item.location);
            }
          
          let entity=dataSource.entities.add({
            polyline:{
            //   hierarchy : {
                positions : coordinatesArrayToCartesianArray(positions),
            //   },
            //   material:Cesium.Color.RED.withAlpha(1.0),//Cesium.Color.DIMGRAY.withAlpha(0.8),//Cesium.Color.fromRandom({alpha:1.0})Cesium.Color.DARKGRAY.withAlpha(0.0)
              material: new Cesium.PolylineDashMaterialProperty({
                color: Cesium.Color.RED,
              }),
              classificationType:Cesium.ClassificationType.BOTH,
              clampToGround:true,
              width:3,
            },
          });
        })    
      }

    

    

    closePanel=()=>{
        this.props.onClose && this.props.onClose();
    }

    componentDidMount() {
        // viewer.scene.globe.depthTestAgainstTerrain = true;
        //开启点选模式--即屏蔽行政区的事件
        // 禁止点选
        this.props.dispatch({
            type: 'House/setPickMode',
            payload: true,
        });
        this.props.dispatch({
            type: 'House/setIsPick',
            payload: false,
        });
        this.drawRectangle();
    }

    componentWillUnmount() {
        const { statType } = this.props.House;
        // viewer.scene.globe.depthTestAgainstTerrain = false;
        this.clearDraw();
       this.reload();
       this.props.dispatch({
            type: 'House/setPickMode',
            payload: false,
        });
        this.props.dispatch({
            type: 'House/setIsPick',
            payload: true,
        });

        if(statType.isRenderSubStat){
            this.props.dispatch({
              type:'House/setStatType',
              payload:{
                ...statType,
                isRenderSubStat:false,
                isShowHouseBox:false,
              }
            })
        }
    }
    
    render() {
        const {activeKey}=this.state;
        return (
            <RootContainer>
                <div className={styles.PipePanel}>
                    <span className={styles.closeV} onClick={()=>this.closePanel()}>×</span>
                    <span className={`${styles.btn} ${activeKey==='rectangle'?styles.active:''}`} onClick={()=>this.drawRectangle()}>矩形</span>
                    <span className={`${styles.btn} ${activeKey==='polygon'?styles.active:''}`} onClick={()=>this.drawPolygon()}>多边形</span>
                    <span className={`${styles.btn} ${activeKey==='circle'?styles.active:''}`} onClick={()=>this.drawCircle()}>圆</span>
                    <span className={styles.btn} onClick={()=>this.clearDraw(true)}>清除</span>
                </div>
            </RootContainer>
        );
    }
}

export default Query;