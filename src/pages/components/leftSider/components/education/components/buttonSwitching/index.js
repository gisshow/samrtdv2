/* global Cesium */
/* global viewer */
/* global mars3d */
/* global $ */
import React, { Component } from 'react';
import styles from './styles.less';
import {Switch} from 'antd';
import { message } from 'antd';
import { PUBLIC_PATH } from '@/utils/config';
import {getBuildBySpace,getLandBySpace} from '@/service/house';
import { connect } from 'dva'
import {locationToPolygon} from '@/utils/index';
import { request } from '@/utils/request';

const Ajax = require('axios');
let education;
let imgname;
let iconameImg;
let pointObj;
let school_point;
let featureCollect={};


//格式化 数字 小数位数
function formatNum(num, digits) {
  return Number(Number(num).toFixed(digits || 0));
}
//cesium笛卡尔空间坐标 转 经纬度坐标【用于转geojson】
function cartesian2lonlat(cartesian) {
  var carto = Cesium.Cartographic.fromCartesian(cartesian);
  if (carto == null) return null;

  var x = formatNum(Cesium.Math.toDegrees(carto.longitude), 6);
  var y = formatNum(Cesium.Math.toDegrees(carto.latitude), 6);
  var z = formatNum(carto.height, 2);

  return [x, y, z];
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

@connect(({ House }) => ({
  House
}))

class buttonSwitching extends Component {

  constructor(props) {
    super(props);
    this.state = {
      schoolConstruction : ['已建学校','在建学校','待建学校'],
      schoolType : ['幼儿园','小学','初中','高中'],
      schoolState : false,
    };
    this.dataSources=[];
    this.projectLands=[];
  }
  componentWillMount() {
    //加载后台学校数据
    this.getSchoolData()
    //加载WFS图层格式的学校数据
    // this.getSchoolLayer()
  }
  // async componentDidMount() {
  //   let data1 = await Ajax.get(`${PUBLIC_PATH}config/education.json`);
  //   education = data1.data;  
  // }

  componentWillUnmount() {
    if(school_point){
      //移除图层
      viewer.dataSources.remove(school_point);
    }
    //清除学校所属地块边界
    this.removeLand();
    //清除规划待建学校所属地块
    this.removeProjectLand();
  }
  getSchoolData=async() =>{
    var that = this;
    //获取数据
    let data =await request('/education/web/schoolMatch/getSelect',{
        method: 'POST',
    });
    if(data){
      if(data.code==200 && data.success){
        //featureCollect存储后在onchange图层切换按钮中调用
        featureCollect=data.data;
        that.addSchoolLayer(featureCollect)
      }else{
        var msg = "请求出错：" + data.msg
        console.log(msg);
      }
    } 
  }
  getSchoolLayer= async() => {
    var that = this;
    //请求的wfs参数
    var parameters = {
      service: "WFS",
      request: "GetFeature",
      typeName: "JYZT:school_point",
      version: "1.0.0",
      outputFormat: "application/json",
      // bbox: opts.rectangle.xmin + "," + opts.rectangle.ymin + "," + opts.rectangle.xmax + "," + opts.rectangle.ymax
    };
    $.ajax({
      url: "/geoserver/JYZT/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=JYZT%3Aschool_point&outputFormat=application%2Fjson",
      type: "get",
      data: parameters,
      success: function (featureCollection) {
        featureCollect=featureCollection;
        that.addSchoolLayer(featureCollection)
      },
      error: function (data) {
          var msg = "请求出错(" + data.status + ")：" + data.statusText
          console.log(msg);
      }
    });
  }
  addSchoolLayer=(featureCollection)=>{
    let that = this;
    const {schoolState}=this.state;
    school_point = new Cesium.CustomDataSource("school_point");
    viewer.dataSources.add(school_point);
    if(!school_point){
      school_point= viewer.dataSources.getByName("school_point")[0];
      if(!school_point) return;
    }
    let entities = featureCollection.features;
    var level = 0
    if (viewer.scene.globe._surface._tilesToRender.length) {
      level = viewer.scene.globe._surface._tilesToRender[0].level
    }
    let lastEntity;
    function clearLastEntity(){   
       //恢复图标初始化大小
      if(lastEntity){
        lastEntity.billboard.scale._value=0.6;
        lastEntity=null
      }
    }
    if (entities.length > 0) {
      entities.map(item=>{
        let lng = JSON.parse(item.geometry).coordinates[0]
        let lat = JSON.parse(item.geometry).coordinates[1]
        var iconame;
        if(schoolState){
          switch (item.properties.school_type) {
            case "1": iconame = "icon_youeryuan24"; break;
            case "2": iconame = "icon_xiaoxue24"; break;
            case "3": iconame = "icon_chuzhong24"; break; 
            case "4": iconame = "icon_gaozhong24"; break;   
            case "2,3": iconame = "icon_xiaoxue24"; break; 
            case "3,4": iconame = "icon_chuzhong24"; break; 
            case "2,3,4": iconame = "icon_xiaoxue24"; break; 
            default: iconame = "icon_youeryuan24"; break;
          }     
        }else{
          switch (item.properties.build_status) {
            case "1": iconame = "yijianxuexiao1x"; break;
            case "2": iconame = "zaijianxuexiao1x"; break;
            case "3": iconame = "daijianxuexiao1x"; break;      
            default: iconame = "yijianxuexiao1x"; break;
          }
        }
        var iconameurl = `${PUBLIC_PATH}config/images/education/` + iconame + '.png';
        if (school_point.entities.getById(item.id)) return;
        school_point.entities.add({
          id: item.id,
          name: item.properties.school_name,
          // position: Cesium.Cartesian3.fromDegrees(item.geometry.coordinates[0], item.geometry.coordinates[1],0),
          position: Cesium.Cartesian3.fromDegrees(lng, lat, 0),
          billboard: {
            image: iconameurl,
            scale: 0.6,  //原始大小的缩放比例
            horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
            verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND, //贴地
            scaleByDistance: new Cesium.NearFarScalar(1.5e2, 1.0, 8.0e6, 0.2),
            disableDepthTestDistance: Number.POSITIVE_INFINITY, //一直显示，不被地形等遮挡
          },
          // label: {
          //   text: item.properties.school_name,
          //   font: 'normal small-caps normal ' + (level<13?14:12) + 'px  微软雅黑',
          //   style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          //   fillColor: Cesium.Color.AZURE,
          //   outlineColor: Cesium.Color.BLACK,
          //   outlineWidth: 2,
          //   horizontalOrigin: Cesium.HorizontalOrigin.LEFT,
          //   verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          //   pixelOffset: new Cesium.Cartesian2(10, -4), //偏移量
          //   // heightReference: Cesium.HeightReference.CLAMP_TO_GROUND, //贴地
          //   distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0.0, 100000)
          // },
          data: item,
          // flagIndex:`${level}_${i}_${j}`,
          click: function (entity) {//单击       
            clearLastEntity();
            //点击更改图标大小
            entity.billboard.scale._value=1.0
            lastEntity=entity;
            that.entityClick(entity);
            //切换学校建设状态面板
            let buildStatus=entity.data.properties.build_status;
            let buildType;
            switch(buildStatus){
              case "1": buildType="built";break;
              case "2": buildType="construction";break;
              case "3": buildType="notbuilt";break;
              default: buildType="built";break;
            }
            that.constructionSwitch(buildType);
            //高于5000米跳转
            if (viewer.camera.positionCartographic.height > 5000) {
              // viewer.mars.popup.close();//关闭popup
              var position = entity.position._value;
              viewer.mars.centerPoint(position, {
                radius: 2000,   //距离目标点的距离
                pitch: -50,     //相机方向
                duration: 4,
                complete: function (e) {//飞行完成回调方法
                  // viewer.mars.popup.show(entity);//显示popup
  
                }
              });
            }
          }
        });           
      })
    }
  }
  constructionSwitch=(buildType)=>{
    const{buildState}=this.props
    buildState(buildType) 
  }
  entityClick = (entity) =>{
    let that = this;
    if (entity.data.properties.school_code || entity.data.properties.school_name || entity.data.properties.project_code || entity.data.properties.project_name){
      let sch_code=entity.data.properties.school_code
      let sch_name=entity.data.properties.school_name
      let proj_code=entity.data.properties.project_code
      let proj_name=entity.data.properties.project_name
      // 根据学校名称和ID查询学校信息
      that.getSchoolInfoByCode(sch_code,sch_name,proj_code,proj_name)
      .then(() => {
        const {schoolInfo}=this.props.House;
        if(schoolInfo) {
          return this.addProjectLand(schoolInfo.jgeomPy)
        }  
      })
    }else{
      message.error("学校编号和名称，项目编号和名称都为空");
    }
    let cartesian=entity.position._value
    //笛卡尔空间坐标转经纬度     
    let latlonObj=cartesian2lonlat(cartesian);
    let pointX=JSON.stringify(latlonObj[0])
    let pointY=JSON.stringify(latlonObj[1])
    pointObj= {"geo": "POINT("+ pointX + " " + pointY +")"}
    //学校归属地实体数据渲染
    that.addLandBySpaceQuery(pointObj)
    //展开学校信息面板
    that.toggleSchool()
  }
  toggleSchool = () => {
   this.props.schoolShows()
  }
  schoolShowBg= () => {
    this.props.schoolShowBg()
  }
  //学校归属地实体数据渲染
  addLandBySpaceQuery= async(pointObj) => {
  
    // this.getLandBySpaceQuery(pointObj)
    // .then(() => {
    //   const {landSearch}=this.props.House;
    //   if(landSearch){
    //     if(landSearch[0]){
    //       this.goPOISchool(landSearch[0].location)
    //       this.addLand(landSearch)
    //     } 
    //   }    
    // })
    let landResult= await getLandBySpace(pointObj);
    if(landResult.data){
      this.addLand(landResult.data)
      const{getLandLocation}=this.props
      if(landResult.data[0]&&landResult.data[0].location){
        this.goPOISchool(landResult.data[0].location)
        getLandLocation(landResult.data[0].location)  
      }else{
        getLandLocation(null)
        this.goPOISchool(null)
      }
    }
  }
  //空间查询地实体数据
  getLandBySpaceQuery= async(pointObj) => {   
    return new Promise((resolve, reject) => {
      this.props.dispatch({//取得地块
        type:'House/getLandBySpace',
        payload:pointObj,
      }).then(res => {
        resolve(res)
      })
    })
  }
  // 根据学校名称和ID查询学校信息
  getSchoolInfoByCode= async(schoolCode,schoolName,projectCode,projectName) => {   
    return new Promise((resolve, reject) => {
      this.props.dispatch({//取得学校详情
        type:'House/getSchoolInfoByCode',
        payload:{
          schoolCode:schoolCode,
          schoolName:schoolName,
          projectCode:projectCode,
          projectName:projectName,
        }
      }).then(res => {
        resolve(res)
      })
    })
  }
  //存储地块坐标信息，显示相关统计信息
  goPOISchool=(landSearch)=>{
    let location = landSearch;
    let dataParam;
    let geo;
    this.props.dispatch({
      type:'House/setStatType',
      payload:{
        isRenderSubStat:true,
        type:"poi",
        title:"周边设施",
        info:location,//存储坐标信息
      }
    })
    if(landSearch){   
      dataParam={"geo":"POLYGON(("+locationToPolygon(location,100)+"))"};
      geo=dataParam.geo;
    }else{//landSearch地块为空
      dataParam={};
      geo={};
    }

    // 更新poi统计数据，缓冲的计算
     this.props.dispatch({
      type: 'House/getPOIStatisticsBySpace',
      payload: dataParam
    })
    //更新poilist
    this.props.dispatch({
      type: 'House/getPOIList',
      payload: {
        geo:geo,
      }
    }) 
    // 更新人口数据信息
    this.props.dispatch({
      type: 'House/getPopulationStatistics',
      payload: dataParam
    })
    // 更新人口数据信息
    this.props.dispatch({
      type: 'House/getPopulationSchoolStat',
      payload: dataParam
    })
  }

  addLand =(landData)=>{
    this.removeLand();
    let dataSource=new Cesium.CustomDataSource('schoolLand_query');
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
  removeLand=()=>{
    viewer.mars.draw.clearDraw();
    this.dataSources.map((dataSource)=>{
        viewer.dataSources.remove(dataSource);
    })  
  }
  //规划待建学校地块渲染
  addProjectLand =(projLand)=>{
    this.removeProjectLand();
    let dataSource=new Cesium.CustomDataSource('projectLand_query');
    viewer.dataSources.add(dataSource);
    this.projectLands.push(dataSource);
    let positions=[];
    let location={};
    try {
        location=JSON.parse(projLand);
        if(location.type==="MultiPolygon"){
            positions = location.coordinates[0][0];
        }else if(location.type==="Polygon"){
            positions = location.coordinates[0];
        }
    } catch (error) {
        console.log(projLand);
    }
  
    let entity=dataSource.entities.add({
      // polyline:{
      // //   hierarchy : {
      //     positions : coordinatesArrayToCartesianArray(positions),
      // //   },
      // //   material:Cesium.Color.RED.withAlpha(1.0),//Cesium.Color.DIMGRAY.withAlpha(0.8),//Cesium.Color.fromRandom({alpha:1.0})Cesium.Color.DARKGRAY.withAlpha(0.0)
      //   material: new Cesium.PolylineDashMaterialProperty({
      //     color: Cesium.Color.BLUE,
      //   }),
      //   classificationType:Cesium.ClassificationType.BOTH,
      //   clampToGround:true,
      //   width:2,
      // },
      polygon: {
        hierarchy: new Cesium.PolygonHierarchy(coordinatesArrayToCartesianArray(positions)),
        material:Cesium.Color.fromCssColorString("#FEC205").withAlpha(0.6),//Cesium.Color.fromCssColorString("#35EAA5").withAlpha(0.6),//Cesium.Color.SPRINGGREEN,//Cesium.Color.fromRandom({alpha:1.0}),
        classificationType: Cesium.ClassificationType.BOTH,
        outline: true,
        outlineWidth: 1,
        outlineColor: Cesium.Color.BLUE,
      },
    });   
  }
  removeProjectLand=()=>{
    viewer.mars.draw.clearDraw();
    this.projectLands.map((dataSource)=>{
        viewer.dataSources.remove(dataSource);
    })  
  }
  onChange=(isChecked,val)=>{
    const {schoolState}=this.state;
    //切换按钮关闭学校详情面板
    this.props.schoolShow();
    //移除图层
    viewer.dataSources.remove(school_point);
    //清除学校所属地块边界
    this.removeLand();
    //清除规划待建学校所属地块
    this.removeProjectLand();
    this.setState({
      schoolState:!schoolState
    },()=>{
      //添加新图层
      this.addSchoolLayer(featureCollect);
    })
  }

  render() {
    const {schoolConstruction,schoolType,schoolState}=this.state;
    return (
        <>
          <div className={styles.switching}>
              <span>学校建设状态</span><Switch onChange={this.onChange}/><span>学校类型</span>
          </div>
          <div className={styles.type}>
            {!schoolState && schoolConstruction.map((item,index)=>{
                return  <div className={styles.build} key={index}>
                  <span className={index === 0 ? styles.blue : index === 1 ? styles.green : index === 2 ? styles.yellow :''}></span>
                  <span>{item}</span>
                </div>
              })
            }
            {schoolState && schoolType.map((item,index)=>{
                return  <div className={styles.build} key={index}>
                  <span className={index === 0 ? styles.circle : index === 1 ? styles.rectangle : index === 2 ? styles.triangle :index === 3 ? styles.other :''}></span>
                  <span>{item}</span>
                </div>
              })
            }
          </div>        
      </>      
    );
  }
}

export default buttonSwitching
