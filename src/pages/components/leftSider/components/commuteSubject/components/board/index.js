/* global Cesium */
/* global viewer */
/* global mars3d */
/* global turf */
import React, { Component } from 'react';
import ModuleTitle from '@/components/moduleTitle';
import Bar from '../chart/bar';
import { connect } from 'dva';
import styles from './styles.less';
import RegionFilter from '../region';
import Detail from '../detail';
import {getFluidStat,getJobStat} from '@/service/commute';

@connect(({ Commute,House }) => ({
  Commute,House
}))
class Board extends Component {

  constructor(props) {
    super(props);
    this.state = {
      isRenderDetail:false,
      fluidStat:undefined,
      // hour:'h1',
      detailData:[],
      ratio:{
        min:0,
        range:1,
      },
    }
    this.heatLayer=null;
    this.quFluidData=[];
    // this.allBboxs={};//记录每个行政区的区域的bbox
  }

  componentDidMount(){
    this.getJobStat();
  }

  componentWillReceiveProps(newProps){
      const {type:newType,hour:newHour}=newProps;
      const {type,hour}=this.props;
      
      if(newType=="fluid" && newType!==type){
        // if(JSON.stringify(this.allBboxs)=='{}'){
        //   this.hanlderDistinct(regionData || []);
        // }
        // 切换到流动人口时，请求新数据,并解析
        this.getFluidStat();
      }
      if(newType=="job" && newType!==type){
        if(this.heatLayer){
          viewer.imageryLayers.remove(this.heatLayer);
          this.heatLayer=null;
        }
      }
      if(newType=="fluid" && newHour!==hour){
        this.updateFluidStat(newHour);
      }
  }

  componentWillUnmount(){
    if(this.heatLayer){
      viewer.imageryLayers.remove(this.heatLayer);
      this.heatLayer=null;
    }
  }

  // hanlderDistinct=(regionData)=>{
  //   // const {regionData} =this.props.House;
  //   regionData.forEach(item => {
  //     if(!this.allBboxs[item.name]){
  //       item.geometry
  //       this.allBboxs[item.name]=[Number(item.minLongitude),Number(item.minLatitude),Number(item.maxLongitude),Number(item.maxLatitude)];
  //       if(item.children){
  //         this.hanlderDistinct(item.children);
  //       }
  //     }
  //   });
  // }


  updateFluidStat=(hour)=>{
    const {fluidStat:{chartData}}=this.state;
    chartData.forEach(item => {
        item.ratio=item.pn?item.pn[hour]:0;
    });
    this.updateHeatMap(chartData);
    this.setState({
        fluidStat:{
          chartData:chartData
        }
      })
  }

  //获取职住统计信息
  getJobStat=async (dataParam)=>{
    const {jdName,quName} =this.props.House;
    let param={area:"深圳市"};
    if(jdName){
      param.area=jdName;
    }else if(quName){
      param.area=quName;
    }
    let jobStatInfo= await getJobStat(dataParam || param);
    if(jobStatInfo.success && jobStatInfo.data && jobStatInfo.data.length!==0){
      // 获取最大最小值，区分颜色
      var max=Math.max.apply(Math,jobStatInfo.data.map(item=>item.ratio)) || 1;
      var min=Math.min.apply(Math,jobStatInfo.data.map(item=>item.ratio)) || 0;
      this.setState({
          jobStat:{
            chartData:jobStatInfo.data
          },
          ratio:{
            range:max-min,
            min:min,
            // max:Number(max.toFixed(1)),
          },
        })
      this.props.setRatioNum && this.props.setRatioNum(min,max);
      
    }
  }

  //获取人口统计信息
  getFluidStat=async (dataParam)=>{
    const {jdName,quName} =this.props.House;
    const {hour}=this.props;
    let param={area:'深圳市'};
    if(jdName){
      param.area=jdName;
    }else if(quName){
      param.area=quName;
    }
    let fluidStatInfo= await getFluidStat(dataParam || param);
    if(fluidStatInfo.success && fluidStatInfo.data && fluidStatInfo.data.length!==0){
        // 处理数据  
        fluidStatInfo.data.forEach(item => {
            item.ratio=item.pn?item.pn[hour]:0;
        });
      this.setState({
          fluidStat:{
            chartData:fluidStatInfo.data
          }
        })
        // if(!this.quFluidData){
        //   this.getQuFluidData();
        // }
        this.updateHeatMap(fluidStatInfo.data);
    }
  }

  getQuFluidData=async(param)=>{
    let fluidStatInfo= await getFluidStat({area:'深圳市'});
    if(fluidStatInfo.success && fluidStatInfo.data && fluidStatInfo.data.length!==0){
      this.quFluidData=fluidStatInfo.data;
      var detailData=[];
      for (let i = 0; i < this.quFluidData.length; i++) {
        const item = this.quFluidData[i];
        if(item.area==param.area){
          var pn=item.pn;
          for (const key in pn) {
            if (pn.hasOwnProperty(key)) {
              detailData.push({label:key,num:pn[key]});
            }
          }
          break;
        }
      }
      this.setState({
        detailData:detailData
      });
    }
    
  }

  //退回到主统计页面
  goStat=()=>{
    this.props.goStat &&  this.props.goStat();
  }

  // 更新热力图
  updateHeatMap=(arrdata)=>{

    if(this.heatLayer){
      viewer.imageryLayers.remove(this.heatLayer);
    }
    // const {data}=this.state;
    var heatLayer = new mars3d.HeatmapImageryProvider({
      //min: min, max: max, //可自定义热力值范围，默认为数据中的最大最小值
      data: this.handleHeatData(arrdata),
      heatmapoptions: {//参阅api：https://www.patrick-wied.at/static/heatmapjs/docs.html
          radius: 200,
          minOpacity: 0.2,
          xField: 'X',
          yField: 'Y',
          valueField: 'num'
      }
    });
    
    var layer = viewer.imageryLayers.addImageryProvider(heatLayer);
    this.heatLayer=layer;
  }

  handleHeatData=(arrdata)=>{
    const {regionItems} =this.props.Commute;
     var newData=[];
     arrdata.forEach(item=>{
       var location=regionItems[item.area];
       if(location){
        var centroid =this.getCentriod(location.geometry)
        var coord=turf.getCoord(centroid);
        newData.push({X:coord[0],Y:coord[1],num:item.ratio})
       }
      //  var centroid =this.getCentriod(location.geometry)
      //  var points= turf.randomPoint(5,{bbox:bbox});
      //  points.features.forEach(point=>{
          // var coord=turf.getCoord(centroid);
          // newData.push({X:coord[0],Y:coord[1],num:item.ratio})
      //  })
     })
     return newData
  }

  // 获取多边形质心
  getCentriod=(geo)=>{
    // let geo=JSON.parse(location);
    let polygon=undefined;
    if(geo.type==="Polygon"){
      polygon=turf.polygon(geo.coordinates);
    }else if(geo.type==="MultiPolygon"){
      polygon=turf.multiPolygon(geo.coordinates);
    }
    // var poly=turf.bboxPolygon(bbox);
    var centroid=turf.centroid(polygon);
    // var coord=turf.getCoord(point);
    // var center = turf.centerOfMass(polygon);
    // var points= turf.randomPoint(10,{bbox:bbox});
    return centroid;
  }


  searchDataByRegion=(value,paramObj)=>{
    // const {jdName,quName} =this.props.House;
    const {type}=this.props;
    // console.log(value,paramObj);
    // //获取对应行政区的统计信息
    let param={area:'深圳市'};
    if(paramObj.jdName){
      param.area=paramObj.jdName;
    }else if(paramObj.quName){
      param.area=paramObj.quName;
    }
    if(type=="job"){
      this.getJobStat(param);
      // this.props.dispatch({
      //   type: 'Commute/getJobStat',
      //   payload: param,
      // })
    }else if(type=="fluid"){
      // 跳转到具体的详情页面
      // 请求对应行政区的统计信息，不需要hover,默认时间点
      this.setState({
        isRenderDetail:param.area=='深圳市' ?false:true,
      })
      // 处理折线图数据
      var detailData=[];
      for (let i = 0; i < this.quFluidData.length; i++) {
        const item = this.quFluidData[i];
        if(item.area==param.area){
          var pn=item.pn;
          for (const key in pn) {
            if (pn.hasOwnProperty(key)) {
              detailData.push({label:key,num:pn[key]});
            }
          }
          break;
        }
      }
      
      this.setState({
        detailData:detailData
      });
      if(this.quFluidData.length==0){
        this.getQuFluidData(param);
      }
      this.getFluidStat(param);

    }
  }

  goDetail=()=>{
    this.setState({
      isRenderDetail:true,
    })
  }

  
  render() {  
    const {quName}=this.props.House;  
    const {title,type} =this.props;
    const {isRenderDetail,fluidStat,jobStat,detailData,ratio}=this.state;
    return (
      <>
        
        {
          (isRenderDetail && type === "fluid") && < Detail data={detailData} goStat = {() => this.setState({isRenderDetail: false})}/> 
        }
        <div className={`${styles.board} ${isRenderDetail && type==="fluid"?styles.hide:''}`}>
          <div className={styles.title}>
            <ModuleTitle title={title}>
              {jobStat && jobStat.chartData && <RegionFilter ratio={ratio}  type={type} chartData={jobStat.chartData} searchData={this.searchDataByRegion.bind(this)}/>}
            </ModuleTitle>        
          </div>
          <div className={styles.stat}>
            {
                type==="job" && jobStat && <Bar type="job" data={jobStat.chartData} height={380} padding={[0,50,20,80]}/>
            }
            {
                type==="fluid" && fluidStat && <Bar type="fluid" data={fluidStat.chartData} height={420} padding={[0,50,20,80]}/>
            }
            {
              type==="fluid" && quName!=='' && <div className={styles.footer} onClick={()=>this.goDetail()}><span>返回详情信息</span></div>
            } 
          </div>
          
        </div>
        
      </>
    );
  }
}

export default Board
