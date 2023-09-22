/* global Cesium */
/* global viewer */
/* global mars3d */
/* global $ */
import React, { Component } from 'react'
import ModuleTitle from '@/components/moduleTitle'
import TimeLine from './components/timeLine'
import TimeLineFZ from './components/timeLineFZ'
import { connect } from 'dva';
import {DatePicker,Switch, Tabs, Radio} from 'antd'
import styles from './styles.less'
import moment from 'moment';
import 'moment/locale/zh-cn';
import { request } from '@/utils/request';
import CarURL from './qiche.gltf';
import locale from 'antd/es/date-picker/locale/zh_CN';
import {message } from 'antd';
import { PUBLIC_PATH } from '@/utils/config';
const startColor=Cesium.Color.fromCssColorString('#21c53c'); 
const endColor=Cesium.Color.fromCssColorString('#ca1821'); 
let  roadFT;
let  roadFTFZ;
let entityFTFZ=[];
const Ajax = require('axios');

moment.locale('zh-cn');
const data = {
  icon: 'icon_bus',
  title: '公交车',
  name: '车辆',
  time: '2020/03/16 12:23:38',
  sum:1327,
  chartData:[
    {
      label:'已建',
      num:232
    },
    {
      label:'在建',
      num:963
    },
    {
      label:'未建',
      num:132
    }
  ]
}

@connect(({ Home }) => ({
  Home
}))
class TrafficSubject extends Component {


  constructor(props) {
    super(props);
    this.state = {
      isShowBg:true,//是否显示背景
      sum:0,
      startTime:'2019-09-25 20:00:00',
      endTime:'2019-09-25 22:00:00',
      currentTime:'2019-09-25 20:00:00',
      ratio:{
        min:0,
        max:1.0,
        range:1,
      },
      roadState:true,
      roadStateFZ:false,
      statusFZ:1,
      timeFZ:"00:00:00",
      roadData:undefined,
    };
    this.carDataSource=null;
    this.roadFTBZ=null;
    this.carInfo={};
  }
  componentDidMount() {
    this.getCarData();
    this.setTime();
    // this.props.dispatch({
    //   type: 'Home/setRightActiveKey',
    //   payload: 'car'
    // })
    this.getRoadData();
  }

  componentWillUnmount() {
    this.removeData();
    this.carInfo={};
    // this.props.dispatch({
    //   type: 'Home/setRightActiveKey',
    //   payload: ''
    // })
    this.removeRoadBZ();
    //清空地形
    this.removeDem();
  }

  removeDem = () => {
    return new Promise((resolve, reject) => {
      if(!(viewer.scene.terrainProvider instanceof  Cesium.EllipsoidTerrainProvider)){
        viewer.scene.terrainProvider = new Cesium.EllipsoidTerrainProvider({}) //置空地形
      }
      resolve()
    })
  }
  getRoadData= async ()=>{
    let data1 = await Ajax.get(`${PUBLIC_PATH}config/trafficSubject.json`);
    let trafficSubject = data1.data.trafficSubject
    var that = this;
    //请求的wfs参数
    // var parameters = {
    //   service: "WFS",
    //   request: "GetFeature",
    //   typeName: "JYZT:dlzxx_pl_50000_4490",
    //   version: "1.0.0",
    //   outputFormat: "application/json",
    //   // bbox: opts.rectangle.xmin + "," + opts.rectangle.ymin + "," + opts.rectangle.xmax + "," + opts.rectangle.ymax
    // };
    $.ajax({
      url:trafficSubject.url,
      type: "get",
      data: trafficSubject.parameters,
      beforeSend:function(request){
        const key=window.localStorage.getItem('baseMapLicenseKey');
        key && request.setRequestHeader("szvsud-license-key",key);
      },
      success: function (featureCollection) {
        that.addRoadLayer(featureCollection)
      },
      error: function (data) {
          var msg = "请求出错(" + data.status + ")：" + data.statusText
          console.log(msg);
      }
    });
  }
  addRoadLayer=(featureCollection)=>{
    roadFT = new Cesium.CustomDataSource("roadFT");
    roadFTFZ = new Cesium.CustomDataSource("roadFTFZ");
    // viewer.dataSources.add(roadFT);
    var roadFTBZ = new Cesium.CustomDataSource("roadFTBZ");
    viewer.dataSources.add(roadFTBZ);
    let entities = featureCollection.features;
    if (entities.length > 0) {
      let promise_line = Cesium.GeoJsonDataSource.load(featureCollection, {
        // clampToGround: true
      });
      promise_line.then(data => {
        let entities = data.entities.values;
        // 获取最大最小值，区分颜色
        var max=Math.max.apply(Math,entities.map(entity=>entity.properties.getValue().width)) || 1;
        var min=Math.min.apply(Math,entities.map(entity=>entity.properties.getValue().width)) || 0;
        this.setState({
          ratio:{
            range:max-min,
            min:Number(min.toFixed(1)),
            max:Number(max.toFixed(1)),
          },
        },()=>{
          this.ratioFT=this.state.ratio;
        })
        entities.map(item => {
          var num = Math.floor(item.polyline.positions._value.length / 2);
          var midpoint = mars3d.pointconvert.cartesian2lonlat(item.polyline.positions._value[num]);
          // if (roadFT.entities.getById(item.id)) return;
          roadFTBZ.entities.add({
            id: item.id,
            name: item._properties._name._value,
            position: Cesium.Cartesian3.fromDegrees(midpoint[0], midpoint[1], 60),
            label: {
              text: item._properties._name._value,
              font: 'normal small-caps normal 12px 黑体',
              scale: 1,
              style: Cesium.LabelStyle.FILL_AND_OUTLINE,
              fillColor: new Cesium.Color.fromCssColorString("#ffc881"),
              outlineColor: Cesium.Color.BLACK,
              outlineWidth: 3,
              showBackground: false,
              horizontalOrigin: Cesium.HorizontalOrigin.LEFT,
              verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
              distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0.0, 10000)
            },
            data: item,
          });
        });
        this.roadFTBZ=roadFTBZ;
        entities.map(entity => {
          const {min,range}=this.state.ratio;
          let color=new Cesium.Color();
          var ratio=entity.properties.getValue().width?(entity.properties.getValue().width-min) / range:0;
          Cesium.Color.lerp(startColor,endColor,ratio,color);
          roadFT.entities.add({        
            name: entity.properties.getValue().name,
            polyline: {
              positions: entity.polyline.positions,
              width: entity.properties.getValue().width != null ? parseFloat(entity.properties.getValue().width / 4) : 0,
              followSurface: false,
              clampToGround: true,
              material:  new Cesium.PolylineOutlineMaterialProperty({
                color: color.withAlpha(0.6),
                outlineColor: Cesium.Color.fromCssColorString('#DDDDDD').withAlpha(.5),
                outlineWidth: 1
              })
            },
            mouseover:function (entity) {
              entity.polyline.material = new Cesium.PolylineOutlineMaterialProperty({
                color: Cesium.Color.fromCssColorString('#E0B24A').withAlpha(.8),
                outlineColor: Cesium.Color.fromCssColorString('#DDDDDD').withAlpha(.5),
                outlineWidth: 1
              })
            },
            mouseout:function (entity) {
              entity.polyline.material = new Cesium.PolylineOutlineMaterialProperty({
                color: color.withAlpha(0.6),
                outlineColor: Cesium.Color.fromCssColorString('#DDDDDD').withAlpha(.5),
                outlineWidth: 1
              })
            },
            popup: {
              html:`<div style="margin-top:25px;">
              <div ><span style="margin-right:20px;">名称:</span><span>${entity.properties.getValue().name}</span></div>
              </div>`,
              anchor: [0, 0],//定义偏移像素值 [x, y]
            },
            // tooltip:{
            //   html:`<div style="margin-top:25px;">
            //   <div ><span style="margin-right:20px;">名称:</span><span>${entity.properties.getValue().name}</span></div>
            //   </div>`,
            //   anchor: [0, 0],//定义偏移像素值 [x, y]
            // },
          })
          // entity.polyline.width = entity.properties.getValue().width != null ? parseFloat(entity.properties.getValue().width / 4) : 0;
          // entity.polyline.material = new Cesium.PolylineOutlineMaterialProperty({
          //   color: Cesium.Color.fromCssColorString('#E0B24A').withAlpha(.5),
          //   outlineColor: Cesium.Color.fromCssColorString('#DDDDDD').withAlpha(.5),
          //   outlineWidth: 1
          // });
          // roadFT.entities.add(entity)
        })
        entities.map(entity => {
          const {min,range}=this.state.ratio;
          let randomNum = parseFloat(Math.random()*10);
          let color=new Cesium.Color();
          let ratio=entity.properties.getValue().width?(entity.properties.getValue().width-min) / range:0;
          Cesium.Color.lerp(startColor,endColor,ratio+randomNum*0.0333,color);
          let entityFZ=roadFTFZ.entities.add({
            // id:entity.properties.getValue().objectid,
            name: entity.properties.getValue().name,
            data:{
              width:entity.properties.getValue().width,
              id:entity.properties.getValue().objectid
            },
            polyline: {
              positions: entity.polyline.positions,
              // width: entity.properties.getValue().width != null ? parseFloat(entity.properties.getValue().width / 4)+randomNum : 0,
              width: 0,
              followSurface: false,
              clampToGround: true,
              material:  new Cesium.PolylineOutlineMaterialProperty({
                color: color.withAlpha(0.6),
                outlineColor: Cesium.Color.fromCssColorString('#DDDDDD').withAlpha(.5),
                outlineWidth: 1
              })
            },
            mouseover:function (entity) {
              entity.polyline.material = new Cesium.PolylineOutlineMaterialProperty({
                color: Cesium.Color.fromCssColorString('#E0B24A').withAlpha(.8),
                outlineColor: Cesium.Color.fromCssColorString('#DDDDDD').withAlpha(.5),
                outlineWidth: 1
              })
            },
            mouseout:function (entity) {
              if (entity.data.color) {
                entity.polyline.material.color = entity.data.color
              }else{
                entity.polyline.material = new Cesium.PolylineOutlineMaterialProperty({
                  color: color.withAlpha(0.6),
                  outlineColor: Cesium.Color.fromCssColorString('#DDDDDD').withAlpha(.5),
                  outlineWidth: 1
                })
              }
            },
            popup: {
              html:`<div style="margin-top:25px;">
              <div ><span style="margin-right:20px;">名称:</span><span>${entity.properties.getValue().name}</span></div>
              </div>`,
              anchor: [0, 0],//定义偏移像素值 [x, y]
            },
          })
          entityFTFZ.push(entityFZ)
        }) 
      })
    }
  }

  setEntityColor=(entities,ratio)=>{
    const {min,range}=ratio || this.state.ratio;
    let color=new Cesium.Color();
    entities.forEach(entity => {
      var ratio=entity.properties.getValue().width?(entity.properties.getValue().width-min) / range:0;
      Cesium.Color.lerp(startColor,endColor,ratio,color);
      entity.polyline.material=color.withAlpha(0.6);
    });
  }
  getCarData= async ()=>{
    const {startTime,endTime}=this.state;
    let carInfo = await request(`/vb/sensor/taxi/list?startTime=${startTime}&endTime=${endTime}&interval=1`, {
      method: 'GET',
    });
    this.removeData();
    if(carInfo && carInfo.success && carInfo.data){
        this.setState({
          sum:carInfo.data.length,
        });
        this.addCarEntity(carInfo.data);
    }
  }

  addCarEntity=(data)=>{
    var carDataSource=new Cesium.CustomDataSource('car');//运动的点
    for (var i = 0, len = data.length; i < len; i++) {
        var carData=data[i];
        var start;
        var stop;
        var property = new Cesium.SampledPositionProperty();
        var vec1Property=new Cesium.SampledProperty(Number);//速度
        var vec3Property=new Cesium.SampledProperty(Number);//里程
        if (carData.properties.length <= 6) continue;

        for (var j = 0; j < carData.properties.length; j++) {
          let item = carData.properties[j];
  
          if (!item && item.lon) return;
  
          var lng = Number(item.lon.toFixed(6));
          var lat = Number(item.lat.toFixed(6));
          var hei = 0;
          var time = item.createTime;
          // console.log(time)
  
          // linePosition.push(Cesium.Cartesian3.fromDegrees(lng, lat, hei));
          // lineColor.push(Cesium.Color.fromRandom({ alpha: 1.0 }));
          
          var position = null;
          if (lng && lat) position = Cesium.Cartesian3.fromDegrees(lng, lat, hei);
          var juliaDate = null;
          if (time){
            juliaDate = Cesium.JulianDate.fromIso8601(time.replace(/\s+/ig, 'T'));
            vec1Property.addSample(juliaDate,item.vec1);
            vec3Property.addSample(juliaDate,item.vec3);
          }
            
          if (position && juliaDate)
            property.addSample(juliaDate, position);
            
          if (j == 0) {
            start = Cesium.JulianDate.fromIso8601(time.replace(/\s+/ig, 'T')).clone();
          }else if(j == (carData.properties.length-1)){
            stop = Cesium.JulianDate.fromIso8601(time.replace(/\s+/ig, 'T')).clone();
          }
        }
        this.carInfo[carData.name]={
          vec1Property:vec1Property,
          vec3Property:vec3Property
        }
        carDataSource.entities.add({
          start,
          stop,
          id:carData.name,
          position: property,
          orientation: new Cesium.VelocityOrientationProperty(property),
          // label: {
          //   text: carData.name,
          //   font: 'normal small-caps normal 19px 楷体',
          //   style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          //   fillColor: Cesium.Color.AZURE,
          //   outlineColor: Cesium.Color.BLACK,
          //   outlineWidth: 2,
          //   horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
          //   verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          //   pixelOffset: new Cesium.Cartesian2(10, -25), //偏移量
          // },
          model: {
            uri: CarURL,
            color:Cesium.Color.RED,
            minimumPixelSize: 30,
          },
          // path: {
          //   resolution: 1,
          //   leadTime: 0,
          //   trailTime: 3600,
          //   material: new Cesium.PolylineGlowMaterialProperty({
          //     glowPower: 0.5,
          //     color: Cesium.Color.YELLOW.withAlpha(0.8),
          //   }),
          //   width: 5,
          // },
          mouseover: function (entity) {//移入
            // haoutil.msg('你鼠标移入到billboard：' + entity._name);

          },
          tooltip:{
            html:(entity, cartesian)=>{
              var time = viewer.clock.currentTime;
              var info=this.carInfo[entity.id];
              var vec1=info.vec1Property.getValue(time);
              var vec3=info.vec3Property.getValue(time);
              return this.creatTipHtml(vec1,vec3);
            }
          },
        });
    }

    viewer.dataSources.add(carDataSource);
    this.carDataSource=carDataSource;
  }

  creatTipHtml=(vec1,vec3)=>{
    const {currentTime}=this.state;
    let html=`<div class="${styles.tooltip}">
                <div class="${styles.content}">
                    <div class="${styles.item}">
                        <span class="${styles.name}">速度:</span>
                        <span class="${styles.value}">${vec1.toFixed(2)}km/h</span>
                    </div>
                  <div class="${styles.item}">
                    <span class="${styles.name}">里程:</span>
                    <span class="${styles.value}">${vec3.toFixed(2)}km</span>
                  </div>
                  <div class="${styles.item}">
                    <span class="${styles.name}">时间:</span>
                    <span class="${styles.value}">${currentTime}</span>
                  </div>
 
                </div>
              </div>`;
      return html
  }

  
  
  removeData = () => {
    if(this.carDataSource){
      viewer.dataSources.remove(this.carDataSource);
      this.carDataSource=null;
    }
  };

  removeRoadBZ = () => {
    if(roadFT){
      //移除图层
      viewer.dataSources.remove(roadFT);
    }
    if(roadFTFZ){
      //移除图层
      viewer.dataSources.remove(roadFTFZ);
    }
    if(this.roadFTBZ){
      viewer.dataSources.remove(this.roadFTBZ);
      this.roadFTBZ=null;
    }
  };

  setTime=()=>{
    const {startTime,endTime}=this.state;
    let start = Cesium.JulianDate.fromIso8601(startTime.replace(/\s+/ig, 'T')).clone();
    let stop = Cesium.JulianDate.fromIso8601(endTime.replace(/\s+/ig, 'T')).clone();


    viewer.clock.startTime = start.clone();//{dayNumber: 2458755, secondsOfDay: 43237}
    viewer.clock.stopTime = start.clone.call(stop);
    viewer.clock.currentTime = start.clone();
    viewer.clock.clockRange = Cesium.ClockRange.LOOP_STOP;
    viewer.clock.multiplier = 5;

    viewer.clock.shouldAnimate = false;
  }

  setCurrentTime=(curTime)=>{
    let currentTime=Cesium.JulianDate.fromIso8601(curTime).clone();
    viewer.clock.currentTime = currentTime;
    this.setState({
      currentTime:curTime.replace('T'," ")
    })
  }

  startTimeChange=(data,dataString)=>{
    // console.log(data,dataString);
    if(!data) return;
    // 比较大小
    const {startTime,endTime}=this.state;
    let start = Cesium.JulianDate.fromIso8601(dataString.replace(/\s+/ig, 'T')).clone();
    let stop = Cesium.JulianDate.fromIso8601(endTime.replace(/\s+/ig, 'T')).clone();
    if(Cesium.JulianDate.lessThan(start,stop)){
      this.setState({
        startTime:dataString+":00"
      },()=>{
        this.getCarData();
      })
    }else{
      message.warning('开始时间与结束时间间隔小于5min!');
      this.reset();
    }


  }

  endTimeChange=(data,dataString)=>{
    if(!data) return;
    // 比较大小
    const {startTime,endTime}=this.state;
    let start = Cesium.JulianDate.fromIso8601(startTime.replace(/\s+/ig, 'T')).clone();
    let stop = Cesium.JulianDate.fromIso8601(dataString.replace(/\s+/ig, 'T')).clone();
    if(Cesium.JulianDate.lessThan(start,stop)){
      this.setState({
        endTime:dataString+":00"
      },()=>{
        this.getCarData();
      })
    }else{
      message.warning('开始时间与结束时间间隔小于5min!');
      this.reset();
    }
  }

  reset=()=>{
    const {startTime}=this.state;
    this.removeData();
    this.carInfo={};
    this.setState({
      sum:0,
      currentTime:startTime,
    })
  }


  flyTo=(entity)=>{
    // console.log(entity);
    this.setTime(entity._start,entity._stop);



    //视角切换下
    viewer.clock.shouldAnimate = false;
    setTimeout(() => {
      var time = viewer.clock.currentTime
      var position = Cesium.Property.getValueOrUndefined(entity.position, time, new Cesium.Cartesian3());

      var hpr = mars3d.model.getHeadingPitchRoll(entity, time);
      var heading = Cesium.Math.toDegrees(hpr.heading) + 90

      viewer.trackedEntity = entity;
      viewer.mars.centerPoint(position, {
        radius: 500,   //距离目标点的距离
        heading: heading,
        pitch: -50,
        duration: 0.1,
        complete: function () {
          viewer.clock.shouldAnimate = true;
        }
      });
    }, 500)


  }

  toggleBox = () => {
   
    this.setState({
      isShowBg: !this.state.isShowBg
    })
  }
  onChange=(checked)=>{
    this.setState({
      roadState: checked,
      statusFZ:1
    },()=>{
      //控制图层显示隐藏
      this.roadLayerSwitch();
    }) 
  }
  roadLayerSwitch=()=>{
    const {roadState}=this.state;
    if(roadFT || roadFTFZ){
      if(roadState){
        viewer.dataSources.remove(roadFT);
        viewer.dataSources.remove(roadFTFZ);
      }else{
        viewer.dataSources.remove(roadFTFZ);
        viewer.dataSources.add(roadFT);
      }
    }
  }
  //Tabs切换
  tabsChange=(key)=>{
    if (key === '1') {
      this.onChange(true);
      if (this.carDataSource) {
        viewer.dataSources.add(this.carDataSource);
      }
    }else{
      this.setState({
        roadStateFZ: false
      }) 
      this.onChange(false);
      if (this.carDataSource) {
        viewer.dataSources.remove(this.carDataSource);
      }
    }
  }
  //交通流量下的redio切换
  trafficFlow=async(e)=>{
    if (e.target.value === 1) {
      this.onChangeFZ(false);
      console.log(this.ratioFT);
      this.setState({
        ratio:this.ratioFT
      }) 
    }else{
      this.onChangeFZ(true);
      let roadInfo = await request(`/vb/emulator/indoor`, {
        method: 'GET',
      });
      
      if(roadInfo && roadInfo.success && roadInfo.data){
        this.setState({
          roadData: roadInfo.data
        }) 
        this.colorTime(this.getTimeFZ(true))
      }
    }
    this.setState({statusFZ:e.target.value})
  }
  onChangeFZ=(checked)=>{
    this.setState({
      roadStateFZ: checked
    },()=>{
      //控制图层显示隐藏
      this.trafficFlowFZ();
    }) 
  }
  trafficFlowFZ=()=>{
    const {roadStateFZ}=this.state;
    if(!roadStateFZ){
      viewer.dataSources.remove(roadFTFZ);
      viewer.dataSources.add(roadFT);
    }else{
      viewer.dataSources.remove(roadFT);
      viewer.dataSources.add(roadFTFZ);
    }
  }
  //获取当天日期（注意系统时间是否正确）
  getTimeFZ = (status)=>{
    let a = new Date();
    let str = `${a.getFullYear().toString()}-${(a.getMonth()+1).toString().length === 1?'0'+(a.getMonth()+1).toString():(a.getMonth()+1).toString()}-${(a.getDate()).toString().length === 1?'0'+(a.getDate()).toString():(a.getDate()).toString()} `;
    return status?str+='00:00:00':str+='23:45:00';
  }
  setCurrentTimeFZ=(val)=>{
    console.log(val);
  }
  changeTimeFZ=(val)=>{
    this.setState({timeFZ:val})  
    this.colorTime(val) 
  }

  colorTime=(val)=>{
    const {min,max,range}=this.state.ratio;
    const {roadData}=this.state;
    let matchData=[];
    let matchEntity=[];
    let time=val.substr(11);

    var maxSpeed=Math.max.apply(Math,roadData.map(item=>item.traffic)) || 1;
    var minSpeed=Math.min.apply(Math,roadData.map(item=>item.traffic)) || 0;
   
    this.setState({
      ratio:{
        range:maxSpeed-minSpeed,
        min:Number(minSpeed.toFixed(1)),
        max:Number(maxSpeed.toFixed(1)),
      },
    })
    roadData.map(item=>{
      let timeStr=item.date.substr(11)
      if(timeStr===time){
        // let entity = entityFTFZ.find(ele=>ele.data.id === item.id)
        entityFTFZ.map(entity=>{
          if(entity.data.id===item.id){
            matchData.push(item); 
            matchEntity.push(entity);
          }
        })    
      }
    })

    matchData.map(item=>{
      // let entity = matchEntity.find(ele=>ele.data.id === item.id)
      matchEntity.map(entity=>{
        if(entity.data.id===item.id){
          let color=new Cesium.Color();  
          var ratio=item.traffic?(item.traffic-min) / range:0;
          Cesium.Color.lerp(startColor,endColor,ratio,color);
          entity.polyline.width =  entity.data.width != null ? parseFloat(entity.data.width / 4) : 0;
          entity.polyline.material.color = color.withAlpha(0.6);
          entity.data.color = color.withAlpha(0.6);
          entity.data.traffic = 1;
        }
      })

    })

  }

  render() {
    const {sum,startTime,endTime,currentTime,roadState,roadStateFZ,statusFZ}=this.state;
    const {min,max}=this.state.ratio;
    return (
        <>
          <div className={styles.newTabs}>
            <Tabs defaultActiveKey='1' size='large' onChange={this.tabsChange}>
                <Tabs.TabPane tab='车辆轨迹' key='1'>
                  <div className={styles.date}>
                    <DatePicker onChange={this.startTimeChange.bind(this)} locale={locale} defaultValue={moment(startTime,'YYYY-MM-DD HH:mm')} showTime={{format:'HH:mm'}} format="YYYY-MM-DD HH:mm" placeholder={"请选择开始日期"}/><span className={styles.line}>-</span><DatePicker onChange={this.endTimeChange.bind(this)} defaultValue={moment(endTime,'YYYY-MM-DD HH:mm')} locale={locale} showTime={{format:'HH:mm'}} format="YYYY-MM-DD HH:mm" placeholder={"请选择结束日期"}/>
                  </div>
                  <div className={styles.tabsBox}>
                    <Radio.Group value={1}>
                      <Radio value={1}>出租车</Radio>
                    </Radio.Group>
                  </div>
                  <div className={`${styles.stat}  ${this.state.isShowBg? styles.bgShow : styles.bgHide}`}>
                    <div className={styles.info}>
                      <span className={styles.sum} data-text={(sum+"").replace(/(\d)(?=(\d{3})+$)/g,"$1,")}></span>
                      <span className={styles.subtile}>总车辆数</span>   
                    </div>
                    <div className={styles.time}>当前时间: {currentTime}</div>                  
                    {/* {
                      this.state.isShowBg === true ?
                      <div className={styles.hideBtn} onClick={this.toggleBox}></div> :
                      <div className={styles.text} onClick={this.toggleBox}>交通专题</div>
                    } */}
                  </div>
                </Tabs.TabPane>
                <Tabs.TabPane tab='交通流量' key='2'>
                  <div className={styles.tabsBox}>
                    <Radio.Group value={statusFZ} onChange={this.trafficFlow}>
                      <Radio value={1}>实时交通</Radio><br /><br />
                      <Radio value={2}>仿真交通模拟</Radio>
                    </Radio.Group><br /><br />
                    {/* {statusFZ===2&&<Switch checkedChildren='流量' unCheckedChildren='速度' defaultChecked onChange={this.statusFZ}/>} */}
                  </div>
                </Tabs.TabPane>
            </Tabs>
          </div>
          {
            roadState&&<TimeLine startTime={startTime} endTime={endTime} timeChange={(value)=>this.setCurrentTime(value)}/>
          }
          {
            statusFZ===2&&<TimeLineFZ startTime={this.getTimeFZ(true)} endTime={this.getTimeFZ()} timeChange={(value)=>this.changeTimeFZ(value)}/>
          }
          {/* <div className={styles.switch}>
            <span>路网显示隐藏</span><Switch defaultChecked={true} onChange={this.onChange}/>
          </div> */}
          {
            (!roadState)&&<div className={styles.legend}>
              <span className={styles.colorbox}></span>
              <span className={styles.item}>
              <span className={styles.value}>{max}{(statusFZ===2)?'万辆':''}</span>
                <span className={styles.value}>{((min+max)/2).toFixed(1)}{(statusFZ===2)?'万辆':''}</span>
                <span className={styles.value}>{min}{(statusFZ===2)?'万辆':''}</span>
              </span>
            </div> 
          }     
      </>      
    );
    // return (
    //   <div style={{width: '300px'}}>
    //     <DatePicker placeholder={"请选择日期"}/>
      //   <div>
      //     <p>全市出租车统计信息</p>
      //     <p>出租车</p>
      //     <p>31000 总车辆数</p>
      //     <p>12000（行驶状态）  19000（未行驶状态）</p>
      //   </div>
      // </div>
    // );
  }
}

export default TrafficSubject
