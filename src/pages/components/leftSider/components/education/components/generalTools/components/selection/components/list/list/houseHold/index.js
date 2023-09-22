/* global Cesium */
/* global viewer */
/* global mars3d */

import { Component } from 'react'
import { connect } from 'dva';
import {getHouseHoldList} from '@/service/house';
import iconUrl from './mark@1x.png';
import iconUrlOne from './mark2@1x.png'
import mark from './mark.png';
import mark2 from './mark2.png';
import mark3 from './mark3.png';
import {debounces} from '@/utils/index';

const ICONS=[
  {number:10,url:mark},
  {number:100,url:mark2},
  {number:1000,url:mark3},
  {number:10000,url:mark3},
]

@connect(({ House }) => ({
  House
}))
class HouseHoldList extends Component {

  constructor(props){
    super(props);
    this.dataSource=null;
    this.count=0;
  }

  componentDidMount() {
    this.getHouseHoldList();
    viewer.scene.camera.moveEnd.addEventListener(debounces(this.cameraChangeEvent,500), this);
  }

  componentWillReceiveProps(newPorps){
    const {houseHoldModel} = this.props.House;
    const {houseHoldModel:newHouseHoldModel} = newPorps.House;
    if(newHouseHoldModel && houseHoldModel!==newHouseHoldModel){
      this.setDataSourceVisible(false);
    }

    if(!newHouseHoldModel && houseHoldModel!==newHouseHoldModel){
      this.setDataSourceVisible(true);
    }
  }

  setDataSourceVisible=(flag)=>{
    if(this.dataSource){
      this.dataSource.show=flag;
    }
    
  }

  componentWillUnmount(){
    
    if(this.dataSource){
      this.dataSource.clustering.clusterEvent.removeEventListener(this.clusterEvent);
      this.dataSource.changedEvent.addEventListener(this.changedEvent);
    }
    this.removeExtraSource();
    let listenter=viewer.scene.camera.moveEnd._listeners.pop();
    viewer.scene.camera.moveEnd._scopes.pop();
    viewer.scene.camera.moveEnd.removeEventListener(listenter, this); 
    
  }

  // 获取当前分层分户列表
  getHouseHoldList=async ()=>{
    // 根据行政区街道参数
    let holdInfo = await getHouseHoldList();
    // if (buildholdInfoUrl.success && holdInfo.data) {
    //   this.showItemsFeature(holdInfo.data);
    // };
    if (holdInfo && holdInfo.success && holdInfo.data) {
      // this.test(holdInfo);
      this.showFeature(holdInfo.data);
    };
  }

  test=(holdInfo)=>{
    console.time("Feature");
    var dataSourcePromise = viewer.dataSources.add(
      Cesium.GeoJsonDataSource.load(
        holdInfo
      )
    );
    dataSourcePromise.then((dataSource)=> {
      console.timeEnd("Feature");
      dataSource.clustering.pixelRange=50;
    dataSource.clustering.minimumClusterSize=5;
    dataSource.clustering.enabled = true;
    dataSource.name='household';
      this.dataSource=dataSource;
    })
    
  }

  showFeature=(items)=>{
    // this.removeExtraSource();
    if(items.length ===0){
      return;
    } 
    let dataSource=new Cesium.CustomDataSource('household');
    
    console.time("Feature");
    items.forEach(item => {      
        // let positions=[];
        // // let location={};
        // try {
        //     // location=JSON.parse(item.location);
        //     // hole=JSON.parse(holeGeometry);
          //  if(item.geometry.type==="Point"){
          //     positions = item.geometry.coordinates;
          //   }
        // } catch (error) {
        //     console.log(item.geometry);
        // }
        
        // var position = Cesium.Cartesian3.fromDegrees(positions[0],positions[1]);
        // let height=viewer.scene.sampleHeight(Cesium.Cartographic.fromCartesian(position)) || 0;//同步的很耗时
        let entity=dataSource.entities.add({
          position: Cesium.Cartesian3.fromDegrees(item.x,item.y,item.z),
          name:"household",
          billboard:{
            image: item.type === 0 ?iconUrl:iconUrlOne,//'./config/images/mark/250000.png',
            scale: 0.5, //原始大小的缩放比例
            horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
            verticalOrigin: Cesium.VerticalOrigin.CENTER,
            heightReference: Cesium.HeightReference.NONE,
            width:42,
            height:59,
            scaleByDistance: new Cesium.NearFarScalar(1.5e2, 1.0, 8.0e6, 0.2),
            // distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0.0, 50000),
            disableDepthTestDistance: Number.POSITIVE_INFINITY
          },
          properties:{
            bldgNo:item.bldgNo,
            buildingId:item.code
          },
          tooltip: "<span style='color:#ffffff;'>"+item.name+"</span>",
          // label:{
          //   // position: Cesium.Cartesian3.fromDegrees(positions[0],positions[1],250),//Cesium.Cartesian3.fromDegrees(entity.position[0], entity.position[1],250),//entity.position.getValue(),//Cesium.Cartesian3.fromDegrees(cartOld.longitude, cartOld.longitude,newHeight),
          //   text: item.properties.OBJECTID
            
          // },          
        });
      });
    viewer.dataSources.add(dataSource);
      console.timeEnd("Feature");
    dataSource.clustering.pixelRange=50;
    dataSource.clustering.minimumClusterSize=5;
    dataSource.clustering.enabled = true;
    // this.setExtraSource(dataSource);
    this.dataSource=dataSource;
    dataSource.clustering.clusterEvent.addEventListener(this.clusterEvent);
    dataSource.changedEvent.addEventListener(this.changedEvent);
  }

  cameraChangeEvent=()=>{
    if(!this.dataSource){
      return;
    }
    // 获取当前视域范围内的标注点，并设置高度
    // console.log(a,b);
    let billboards=this.dataSource.clustering._billboardCollection;
    let blen = billboards.length;
    let con=0;
    let promises=[];
    for (let i = 0; i < blen; ++i) {
      var b = billboards.get(i);
      if(b.clusterShow){
        // b.position
        // var positions = [Cesium.Cartographic.fromCartesian(b.position)];
        // var promise = viewer.scene.sampleHeightMostDetailed(positions);
        // let height=viewer.scene.sampleHeight(Cesium.Cartographic.fromCartesian(b.position)) || 0;//同步的很耗时
        // if(height>0){
        //   con++
        //   // console.log(height);
        // }
        // promises.push(promise);
        // promise.then(function(updatedPosition) {
        //   console.log(updatedPosition);
        //     // positions[0].height and positions[1].height have been updated.
        //     // updatedPositions is just a reference to positions.
        // })

      }
    }
    // Promise.all(promises).then((positions)=>{
    //   console.log(positions);
    // })

    // console.log(con);
  }

  //聚合处理函数
  clusterEvent=(clusteredEntities, cluster)=>{
    // 更新高度
    // console.log(clusteredEntities,cluster);
    cluster.label.show = false;
    if(!cluster.billboard.disableDepthTestDistance){
      cluster.billboard.disableDepthTestDistance=Number.POSITIVE_INFINITY;
    }
    this.getIcon({text: cluster.label.text}).then((canvas)=>{

      cluster.billboard.show = true;
      cluster.billboard.id = cluster.label.id;
      cluster.billboard.verticalOrigin =Cesium.VerticalOrigin.BOTTOM;
      if(cluster.billboard._billboardCollection){
        cluster.billboard.image = canvas;
      }
    });
    
    // this.count++;
    // console.log(this.count);
  //   var positions = [
  //     new Cesium.Cartographic(-1.31968, 0.69887),
  //     new Cesium.Cartographic(-1.10489, 0.83923)
  // ];
  //   var promise = viewer.scene.sampleHeightMostDetailed(positions);
  //   promise.then(function(updatedPosition) {
  //       // positions[0].height and positions[1].height have been updated.
  //       // updatedPositions is just a reference to positions.
  //   }
    // var position = Cesium.Cartesian3.fromDegrees(positions[0],positions[1]);
    // let height=viewer.scene.sampleHeight(Cesium.Cartographic.fromCartesian(position)) || 0;//同步的很耗时
    // if (clusteredEntities.length >= 30) {
    //   // cluster.billboard.image = pin50;
    // } else if (clusteredEntities.length >= 10) {
    //   // cluster.billboard.image = pin40;
    // } else{
    //   // cluster.billboard.image = pin40;
    // }
      
  }

  getIcon=async(option)=>{
    let result = ICONS.find(item=>Number(option.text.replace(",",""))<item.number);
    let image=await this.loadIcon(result.url);
    let canvas=this.combineNewIcon(image,option.text);
    return canvas;
  }

  loadIcon=async (url)=>{
    let image =await Cesium.Resource.fetchImage(url);
    return Promise.resolve(image);
  }

  combineNewIcon=(image,text)=>{
    var canvas = document.createElement("canvas");
    const W=image.width;
    const H=image.height;
    canvas.width = image.width;
    canvas.height = image.height;
    var ctx = canvas.getContext("2d");
    ctx.fillStyle="rgb(255,255,255)";
    ctx.textAlign="center";
    ctx.textBaseline="middle";
    ctx.font=`bold 16px Arial`;
    ctx.drawImage(image,0,0,W,H);
    ctx.fillText(text,W/2,H/2+1);
    let result=canvas.toDataURL("image/png");
    return result;
  }

  showItemsFeature=(items)=>{
    // this.removeExtraSource();
    if(items.length ===0){
      return;
    } 
    let dataSource=new Cesium.CustomDataSource('household');
    viewer.dataSources.add(dataSource);
    items.forEach(item => {      
        let positions=[];
        let location={};
        try {
            location=JSON.parse(item.location);
            // hole=JSON.parse(holeGeometry);
           if(location.type==="Point"){
              positions = location.coordinates;
            }
        } catch (error) {
            console.log(item.location);
        }
        
        var position = Cesium.Cartesian3.fromDegrees(positions[0],positions[1]);
        let height=viewer.scene.sampleHeight(Cesium.Cartographic.fromCartesian(position)) || 0;
        let entity=dataSource.entities.add({
          position: Cesium.Cartesian3.fromDegrees(positions[0],positions[1],height),
          billboard:{
            image: item.type === 0 ? iconUrl:iconUrlOne,//'./config/images/mark/250000.png',
            scale: 1, //原始大小的缩放比例
            horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
            verticalOrigin: Cesium.VerticalOrigin.CENTER,
            heightReference: Cesium.HeightReference.NONE,
            scaleByDistance: new Cesium.NearFarScalar(1.5e2, 1.0, 8.0e6, 0.2),
            // distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0.0, 50000),
            disableDepthTestDistance: Number.POSITIVE_INFINITY
          },
          label:{
            // position: Cesium.Cartesian3.fromDegrees(positions[0],positions[1],250),//Cesium.Cartesian3.fromDegrees(entity.position[0], entity.position[1],250),//entity.position.getValue(),//Cesium.Cartesian3.fromDegrees(cartOld.longitude, cartOld.longitude,newHeight),
            text: item.name,
            font: 'normal small-caps normal 12px  微软雅黑',
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            fillColor: Cesium.Color.WHITE,
            outlineColor: Cesium.Color.BLACK,
            outlineWidth: 5,
            showBackground: false,
            horizontalOrigin: Cesium.HorizontalOrigin.LEFT,
            verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
            pixelOffset: new Cesium.Cartesian2(13, 5), //偏移量  
            heightReference: Cesium.HeightReference.NONE,
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
            // scaleByDistance:new Cesium.NearFarScalar(20000,1,50000,0),
            // distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0.0, 50000)
          },          
        });
      });
    
    // dataSource.clustering.pixelRange=1;
    // dataSource.clustering.minimumClusterSize=5;
    // dataSource.clustering.enabled = true;
    // this.setExtraSource(dataSource);
  }

 

  setExtraSource=(source)=>{
    
    // const {extraSource}=this.props.House;
    // let sources=(extraSource && extraSource.length!==0 ) ? extraSource.concat(source) : [source];
    
    // this.props.dispatch({
    //   type: 'House/setExtraSource',
    //   payload: sources
    // })
  }

  removeExtraSource=()=>{
    if(this.dataSource){
      viewer.dataSources.remove(this.dataSource);
      this.dataSource=null;
    }
    // const {extraSource}=this.props.House;
    // if(extraSource && extraSource.length!==0 ){
    //   extraSource.forEach((item)=>{
    //     item.name==="household" && viewer.dataSources.remove(item);
    //   })
    // }
  }

  setExtraSourceVisible=(flag)=>{
    if(this.dataSource){
      this.dataSource.show=flag;
    }
  }

  

  updateList=(item)=>{
    const {HouseHold:{geo,pageSize,pageNo,pageTotal}}=this.props.House;
    this.setState({
      poiType:item.name,
      isShowSelects:false,
    })
    let dataParam={
      geo:geo,
      poiType:item.code,
    }
    if(item.name==="所有类型"){
      dataParam={
        geo:geo,
      }
    }

    //更新HouseHold
    this.props.dispatch({
      type: 'House/getHouseHold',
      payload: dataParam
    })
    // this.setState({isShowSelects:!isShowSelects})}
  }

  

  render() {
    return null;
  }
}

export default HouseHoldList;
