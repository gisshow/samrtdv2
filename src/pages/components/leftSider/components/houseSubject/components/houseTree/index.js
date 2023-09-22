/* global Cesium */
/* global viewer */
/* global mars3d */
/* global turf */
import React, { Component,useRef } from 'react';
import { Tree,Icon } from 'antd'
import styles from './styles.less';
import { connect } from 'dva';
import {getRoomList,getBuildList,getParcelByBuildId,getBuildByNopacel} from '@/service/house'
import {computeSurfaceHeight,getGuidGenerator} from '@/utils/index'
import ModuleTitle from '@/components/moduleTitle'

const { TreeNode } = Tree;
const treeData = [
  {"id":927546,"title":"[地]  污水处理厂   [ 85759.6 m²]",children:[  
    {"id":927670,"title":"[楼]  力能加电站   [ 7500 m²]",children:[ 
      {"id":927670,"title":"[房]  东园路77号滨江新村50栋204null204   [ 500 m²]"},
      {"id":927670,"title":"[房]  东园路77号滨江新村50栋204null204   [ 500 m²]"},
      {"id":927670,"title":"[房]  东园路77号滨江新村50栋204null204   [ 500 m²]"},
      {"id":927670,"title":"[房]  东园路77号滨江新村50栋204null204   [ 500 m²]"},
      {"id":927670,"title":"[房]  东园路77号滨江新村50栋204null204   [ 500 m²]"},
     ]},
    {"id":927913,"title":"[楼]  工业仓储用地   [ 42841.5 m²]",children:[
      {"id":927670,"title":"[房]  东园路77号滨江新村50栋204null204   [ 500 m²]"},
      {"id":927670,"title":"[房]  东园路77号滨江新村50栋204null204   [ 500 m²]"},
      {"id":927670,"title":"[房]  东园路77号滨江新村50栋204null204   [ 500 m²]"},
      {"id":927670,"title":"[房]  东园路77号滨江新村50栋204null204   [ 500 m²]"},
      {"id":927670,"title":"[地] 东园路77号滨江新村50栋204null204   [ 500 m²]"},
    ]},
    {"id":928088,"title":"[楼] 地下室出口   [ 13715.9 m²]"},
    {"id":928094,"title":"[楼] 黄木岗社区垃圾中转   [ 57691.4 m²]"},
    {"id":928337,"title":"[楼] 教育产业用地   [ 11207.01 m²]"},
    {"id":928362,"title":"[楼] 莲花一村42栋   [ 5292.7 m²]"},
    {"id":928761,"title":"[楼] 九星门卫室   [ 11117 m²]"},
    {"id":929233,"title":"[楼] 公厕六   [ 7535.4 m²]"}
]},
  {"id":927670,"title":"[地]  住宅用地   [ 7500 m²]",children:[  
    {"id":927670,"title":"[地] 力能加电站   [ 7500 m²]"},
    {"id":927913,"title":"[地] 工业仓储用地   [ 42841.5 m²]"},
    {"id":928088,"title":"[地] 地下室出口   [ 13715.9 m²]"},
    {"id":928094,"title":"[地] 黄木岗社区垃圾中转   [ 57691.4 m²]"},
    {"id":928337,"title":"[地] 教育产业用地   [ 11207.01 m²]"},
    {"id":928362,"title":"[地] 莲花一村42栋   [ 5292.7 m²]"},
    {"id":928761,"title":"[地] 九星门卫室   [ 11117 m²]"},
    {"id":929233,"title":"[地] 公厕六   [ 7535.4 m²]"}
]},
  {"id":927913,"title":"[地]  工业仓储用地   [ 42841.5 m²]",children:[  
    {"id":927670,"title":"[地] 力能加电站   [ 7500 m²]"},
    {"id":927913,"title":"[地] 工业仓储用地   [ 42841.5 m²]"},
    {"id":928088,"title":"[地] 地下室出口   [ 13715.9 m²]"},
    {"id":928094,"title":"[地] 黄木岗社区垃圾中转   [ 57691.4 m²]"},
    {"id":928337,"title":"[地] 教育产业用地   [ 11207.01 m²]"},
    {"id":928362,"title":"[地] 莲花一村42栋   [ 5292.7 m²]"},
    {"id":928761,"title":"[地] 九星门卫室   [ 11117 m²]"},
    {"id":929233,"title":"[地] 公厕六   [ 7535.4 m²]"}
]},
  {"id":928088,"title":"[地] 工业用地   [ 13715.9 m²]",children:[  
    {"id":927670,"title":"[楼] 力能加电站   [ 7500 m²]"},
    {"id":927913,"title":"[楼] 工业仓储用地   [ 42841.5 m²]"},
    {"id":928088,"title":"[楼] 地下室出口   [ 13715.9 m²]"},
    {"id":928094,"title":"[楼] 黄木岗社区垃圾中转   [ 57691.4 m²]"},
    {"id":928337,"title":"[楼] 教育产业用地   [ 11207.01 m²]"},
    {"id":928362,"title":"[楼] 莲花一村42栋   [ 5292.7 m²]"},
    {"id":928761,"title":"[楼] 九星门卫室   [ 11117 m²]"},
    {"id":929233,"title":"[楼] 公厕六   [ 7535.4 m²]"}
]},
  {"id":928094,"title":"[地] 工业用地   [ 57691.4 m²]"},
  {"id":928337,"title":"[地] 教育产业用地   [ 11207.01 m²]"},
  {"id":928362,"title":"[地] 商业服务业设施用地   [ 5292.7 m²]",children:[  
    {"id":927670,"title":"[楼] 力能加电站   [ 7500 m²]"},
    {"id":927913,"title":"[楼] 工业仓储用地   [ 42841.5 m²]"},
    {"id":928088,"title":"[楼] 地下室出口   [ 13715.9 m²]"},
    {"id":928094,"title":"[楼] 黄木岗社区垃圾中转   [ 57691.4 m²]"},
    {"id":928337,"title":"[楼] 教育产业用地   [ 11207.01 m²]"},
    {"id":928362,"title":"[楼] 莲花一村42栋   [ 5292.7 m²]"},
    {"id":928761,"title":"[楼] 九星门卫室   [ 11117 m²]"},
    {"id":929233,"title":"[楼] 公厕六   [ 7535.4 m²]"}
]},
  {"id":928761,"title":"[地] 住宅类   [ 11117 m²]"},
  {"id":929233,"title":"[地] 供燃气用地   [ 7535.4 m²]"},{"id":929308,"title":"[地] 商业、住宅   [ 17213.4 m²]"},{"id":929720,"title":"[地] 商业性办公用地   [ 2239.17 m²]"},{"id":930424,"title":"[地] 仓储类   [ 347341.3 m²]"},{"id":931038,"title":"[地] 商业、住宅、工业、办公及配套幼托   [ 9054.9 m²]"},{"id":931212,"title":"[地] 物流   [ 18206.36 m²]"},{"id":931654,"title":"[地] 居住用地   [ 83534.7 m²]"},{"id":932252,"title":"[地] 厂房   [ 3523.43 m²]"},{"id":932919,"title":"[地] 邮电设施用地   [ 144.4 m²]"},{"id":933519,"title":"[地] 广场用地,商业用地   [ 12844.1 m²]"},{"id":933556,"title":"[地] 住宅用地   [ 1930.2 m²]"},{"id":933697,"title":"[地] 二类居住用地   [ 35228.27 m²]"}]

  const treeDataTest=[
    {"id":1,"title":"[地]  B304-0037   [ 85759.6 m²]"}, 
    {"id":2,"title":"[地]  B201-0022   [ 85759.6 m²]"}, 
  ];

  const sorTypes={
    up:{
      fn:(a,b) => a.attributes.luArea - b.attributes.luArea
    },
    down:{
      fn:(a,b) => b.attributes.luArea - a.attributes.luArea
    },
  };

  const sorType={
    up:{
      fn:(a,b) => a.attributes.floorArea - b.attributes.floorArea
    },
    down:{
      fn:(a,b) => b.attributes.floorArea - a.attributes.floorArea
    },
  };

  function coordinatesArrayToCartesianArray(coordinates) {
    var positions = new Array(coordinates.length);
    for (var i = 0; i < coordinates.length; i++) {
      var coord=coordinates[i];
        positions[i] = Cesium.Cartesian3.fromDegrees(coord[0], coord[1])
    }
    return positions;
  }

@connect(({ House }) => ({
  House
}))
class HouseTree extends Component {

  state = {
    selectedKeys: [],
    treeData:[],
    expandedKeys:[],
    scrollTop:0,
    POITreeData:[],
    currentSort:'up'
  }
  POIEntity=null;
  refList=React.createRef(); //这个指向list
  componentDidMount(){
    const {treeSelectedKeys} =this.props.House;
    this.generateList();
    this.generatePOIList();
    this.props.onRef && this.props.onRef(this);
    // ReactDOM.findDOMNode(this.refList)
    // if(treeSelectedKeys){
    //   this.scrollTo(treeSelectedKeys);
    // }
    
  }
  componentWillReceiveProps(newProps){
    if(!this.props && !this.props.House) return;
    const {landList,treeSelectedKeys} =this.props.House;
    const {landList:newLandList,treeSelectedKeys:newSelectedKeys}=newProps.House;
    if((newLandList !== landList) && newLandList.length!==0 ){
      // console.log(newLandList)
      this.generateList(newLandList);
    }
    if((newSelectedKeys !== treeSelectedKeys) && newSelectedKeys){
      this.scrollTo(newSelectedKeys);
    }
  }

  componentWillUnmount(){
    if(this.POIEntity){
      viewer.dataSources.remove(this.POIEntity);
      this.POIEntity=null;
    }
  }


  scrollTo=(newSelectedKeys)=>{
    const {landList} =this.props.House;
    const {expandedKeys} =this.state;
    if(newSelectedKeys===-1){
      this.setState({
        selectedKeys:[],
        expandedKeys:[],
      })
      return 
    }
    //通过索引计算滚动的高度值
    // 点击楼
    // 1、首先判断地块有没有展开（找到地块的key）
    // 2、先展开地
    // 2、如果展开了，直接scrollTo

    //点击地
    // 找到地的，计算高度，scrollTo
    // 楼
    if(newSelectedKeys.type==="building"){
      
      if(!expandedKeys.includes(`parcel${newSelectedKeys.activeLandId}`)){
          this.setState({
          //  expandedKeys:expandedKeys.concat(`parcel${newSelectedKeys.activeLandId}`)
           expandedKeys:newSelectedKeys.activeLandId===-1?[`noparcel`]:[`parcel${newSelectedKeys.activeLandId}`]
          });
      }
      // if(!expandedKeys.includes(`building${newSelectedKeys.activeBuildId}`)){
      //   this.setState({
      //    expandedKeys:expandedKeys.concat(`building${newSelectedKeys.activeBuildId}`)
      //   });
      // }
      let index=-1;
      if(newSelectedKeys.activeLandId===-1){
        index=landList.length;
      }else{
        index = landList.map(item=>item.id).indexOf(newSelectedKeys.activeLandId);
      }
      if(index===-1) return;
      this.getBuildIndexById(newSelectedKeys.parcelNo,newSelectedKeys.activeBuildId).then((buildIndex)=>{
        if(buildIndex===-1) return;
        this.setState({
          scrollTop:index*50+buildIndex*32,
        },()=>{
          this.scrollTop();
        });
        this.setState({
          selectedKeys:[`building${newSelectedKeys.activeBuildId}`],
        })
      });
      
     
    }
    if(newSelectedKeys.type==="parcel"){
      // if(!expandedKeys.includes(`parcel${newSelectedKeys.activeLandId}`)){
      //     this.setState({
      //      expandedKeys:expandedKeys.concat(`parcel${newSelectedKeys.activeLandId}`)
      //     });
      // }
      let index = landList.map(item=>item.id).indexOf(newSelectedKeys.activeLandId);
      if(index===-1) return;
      this.refList.current.firstChild.scrollTo(0,index*50);
      // console.log("parcel",index*50);
      this.setState({
        scrollTop:index*50,
      },()=>{
        this.scrollTop();
      });
      this.setState({
        selectedKeys:[`parcel${newSelectedKeys.activeLandId}`],
      })
    }
    //点击的房
    if(newSelectedKeys.type==="house"){
      let tempExpandedkKeys=[];
      // if(!expandedKeys.includes(`parcel${newSelectedKeys.activeLandId}`)){
        tempExpandedkKeys.push(`parcel${newSelectedKeys.activeLandId}`);
      // }
      // if(!expandedKeys.includes(`building${newSelectedKeys.activeBuildId}`)){
        tempExpandedkKeys.push(`building${newSelectedKeys.activeBuildId}`);
      // }
      this.setState({
        expandedKeys:tempExpandedkKeys,
       });
      var index = landList.map(item=>item.id).indexOf(newSelectedKeys.activeLandId);
      if(index===-1) return;
      this.getBuildIndexById(newSelectedKeys.parcelNo,newSelectedKeys.activeBuildId).then((buildIndex)=>{
        if(buildIndex===-1) return;
        this.getRoomIndexById(newSelectedKeys.bldgNo,newSelectedKeys.activeRoomId).then(roomIndex=>{
          if(roomIndex===-1) return;
          this.refList.current.firstChild.scrollTo(0,index*50+buildIndex*25+roomIndex*32);
          this.setState({
            scrollTop:index*50+buildIndex*32+roomIndex*32,
          },()=>{
            this.scrollTop();
          });
          // console.log("room",index*50+buildIndex*25+roomIndex*32);
          this.setState({
            selectedKeys:[`room${newSelectedKeys.activeRoomId}`],
          })
        })
        
      });
    }

    
  }

  scrollTop=()=>{
    if(this.props.hide) return;
    const {scrollTop} = this.state;
    if(this.refList.current && scrollTop!==this.refList.current.firstChild.scrollTop){
      this.refList.current.firstChild.scrollTo(0,scrollTop);
      // console.log("scrollTop1",this.refList.current.firstChild.scrollTop);
    }    
    
  }

  //获取build的索引
  getBuildIndexById= async (parcelNo,buildId)=>{
    const {jdName,rightActiveKey,spaceQueryParam} =this.props.House;
    let index=-1;
    let buildList=[]
    if(parcelNo){
      buildList=await getBuildList({parcelId:parcelNo});
    }else{
      let dataParam={jdName:jdName};
      if(rightActiveKey=="query" && spaceQueryParam){
        dataParam=spaceQueryParam;
      }
      buildList=await getBuildByNopacel(dataParam);
    }
     
    if(buildList.success && buildList.data && buildList.data.length!==0){
        index=buildList.data.map(item=>item.id).indexOf(buildId);
    }
    return Promise.resolve(index);
  }

  //获取room的索引
  getRoomIndexById= async (bldgNo,roomId)=>{
    let index=-1;
    // let buildList =await getBuildList({parcelId:parcelNo});
    let roomList =await getRoomList({buildingId:bldgNo});
    if(roomList.success && roomList.data && roomList.data.length!==0){
        index=roomList.data.map(item=>item.id).indexOf(roomId);
    }
    return Promise.resolve(index);
  }

  onSelect = (selectedKeys,info) => {
    // console.log('selected', selectedKeys,info);
    this.setState({ selectedKeys });
    // this.props.dispatch({
    //   type:'House/SetTreeSelectedKeys',
    //   payload:selectedKeys
    // })
    this.removeExtraSource();
    if(info.selected){
      this.showFeature(info.node.props.dataRef);
      // 打开详情页面
    }
  }

  //POI选中，展示POI图标
  onPOISelect=(selectedKeys,info)=>{
    if(info.selected && info.node.props.isLeaf){
      this.showPOIFeature(info.node.props.dataRef);
      // 打开详情页面
    }
  }

  showPOIFeature=(item,type)=>{
    let dataSource=new Cesium.CustomDataSource('point');
    viewer.dataSources.add(dataSource);
    let positions=[];
      let location={};
      try {
          location=JSON.parse(item.location);
          // hole=JSON.parse(holeGeometry);
          if(location.type==="MultiPolygon"){
              positions = location.coordinates[0][0];
          }else if(location.type==="Polygon"){
              positions = location.coordinates[0];
          }else if(location.type==="Point"){
            positions = location.coordinates;
          }
      } catch (error) {
          console.log(item.location);
      }
      var position = Cesium.Cartesian3.fromDegrees(positions[0],positions[1]);
      let height=viewer.scene.sampleHeight(Cesium.Cartographic.fromCartesian(position)) || 5;
      let entity=dataSource.entities.add({
        position: Cesium.Cartesian3.fromDegrees(positions[0],positions[1],height+5),
      // billboard:{
      //   image: encodeURI(iconameurl),//'./config/images/mark/250000.png',
      //   scale: 1, //原始大小的缩放比例
      //   horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
      //   verticalOrigin: Cesium.VerticalOrigin.CENTER,
      //   heightReference: Cesium.HeightReference.NONE,
      //   scaleByDistance: new Cesium.NearFarScalar(1.5e2, 1.0, 8.0e6, 0.2),
      //   distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0.0, 50000),
      //   disableDepthTestDistance: Number.POSITIVE_INFINITY
      // },
        point:{
          color: Cesium.Color.SKYBLUE, // default: WHITE
          pixelSize: 10, // default: 1
          outlineColor: Cesium.Color.WHITE, // default: BLACK
          outlineWidth: 2, // default: 0
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
        label:{
          text: item.name,
          font: 'normal small-caps normal 14px  微软雅黑',
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
          distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0.0, 50000)
        },
    });
    if(this.POIEntity){
      viewer.dataSources.remove(this.POIEntity);
    }
    
    this.POIEntity=dataSource;

  }

 
    //返回详情页面
    goDetail=(item)=>{
      // const {detailType,statType}=this.props.House;
      let title="土地";
      if(item.type==="building"){
        title='楼宇';
      }else if(item.type==="room"){
        title='房屋';
      }
      //需要同时更新parcelCod才能跳转，后面统一调整
      this.props.dispatch({
        type:'House/setDetailType',
        payload:{
          isRenderDetail:true,
          type:item.type,
          title:title,
          info:item,
        }
      })

      
    }
  

  onExpand=(expandedKeys,info)=>{
    this.setState({
      expandedKeys:expandedKeys,
    });
  }

  showFeature=(item)=>{
    this.goDetail(item);
    if(item.type==="parcel"){
      this.showLandFeature(item,true);
    }else if(item.type==="building"){
      this.showBuildFeature(item);
      // this.getLandVecByBuildId(item.attributes.bldgNo);
    }
    // this.flyTo(item.location);
  }

  flyTo=(positions,surfaceHeight,isWinding)=>{
    //精确计算高度
    var topPosition=mars3d.point.addPositionsHeight(positions,surfaceHeight);
    var sphere=Cesium.BoundingSphere.fromPoints(positions.concat(topPosition));
    // console.log(sphere.radius);
    // Cesium.BoundingSphere.transform(sphere, Cesium.Matrix4.fromScale(new Cesium.Cartesian3(3,3,3)), sphere);
    // console.log(sphere.radius);
    mars3d.point.windingPoint.stop();
    viewer.scene.camera.flyToBoundingSphere(new Cesium.BoundingSphere(sphere.center,sphere.radius*2), {
      duration: 2,
      complete:()=>{
        isWinding && mars3d.point.windingPoint.start(viewer, sphere.center);
      }
    });
  }

  //查询楼所在的地，并加载显示。
  getLandVecByBuildId= async (bldgNo,buildingSource)=>{
    // let buffere = turf.buffer(feature, 5, { units: 'meters', steps: 64 });
    // let holeGeometry=buffere.geometry;
    let result=await getParcelByBuildId({bldgNo:bldgNo});
    if(result.success && result.data){
        this.showLandFeature(result.data,false,buildingSource);
    }else{
      this.setExtraSource([buildingSource]);
    }
  }

  showBuildFeature=(item)=>{
    let dataSource=new Cesium.CustomDataSource('buildingt');
    viewer.dataSources.add(dataSource);
    let positions=[];
    let location={};
    try {
        location=JSON.parse(item.location);
        // hole=JSON.parse(holeGeometry);
        if(location.type==="MultiPolygon"){
            positions = location.coordinates[0][0];
        }else if(location.type==="Polygon"){
            positions = location.coordinates[0];
        }
    } catch (error) {
        console.log(item.location);
    }
    dataSource.entities.add({
      polygon:{
          hierarchy : {
            positions : coordinatesArrayToCartesianArray(positions),
          },
          material:Cesium.Color.fromCssColorString("#FEC205").withAlpha(0.6),//Cesium.Color.DIMGRAY.withAlpha(0.8),//Cesium.Color.fromRandom({alpha:1.0})Cesium.Color.DARKGRAY.withAlpha(0.0)
          classificationType:Cesium.ClassificationType.BOTH,
          clampToGround:true,
          width:2,
        },
    });

    this.props.dispatch({
      type: 'House/setBldgNo',
      payload: item.attributes.bldgNo
    })
    this.flyTo(coordinatesArrayToCartesianArray(positions),computeSurfaceHeight(item.location),true);

    this.getLandVecByBuildId(item.attributes.bldgNo,dataSource);
    // this.setExtraSource(dataSource);
  }

  showLandFeature =(item,isFly,buildingSource)=>{
      let dataSource=new Cesium.CustomDataSource('landt');
      viewer.dataSources.add(dataSource);
      let positions=[];
      let location={};
      try {
          location=JSON.parse(item.location);
          // console.log(location)
          if(location.type==="MultiPolygon"){
              positions = location.coordinates[0][0];
          }else if(location.type==="Polygon"){
              positions = location.coordinates[0];
          }
      } catch (error) {
          console.log(item.location);
      }
      dataSource.entities.add({
        polyline:{
            positions : coordinatesArrayToCartesianArray(positions),
            material:Cesium.Color.RED.withAlpha(1.0),//Cesium.Color.DIMGRAY.withAlpha(0.8),//Cesium.Color.fromRandom({alpha:1.0})Cesium.Color.DARKGRAY.withAlpha(0.0)
            classificationType:Cesium.ClassificationType.BOTH,
            clampToGround:true,
            width:3,
          },
      });
      if(isFly){
        this.flyTo(coordinatesArrayToCartesianArray(positions),computeSurfaceHeight(item.location));
      }

      this.props.dispatch({
        type: 'House/setParcelCod',
        payload: item.attributes.parcelCode || item.attributes.parcelNo
      })
      if(buildingSource){
        this.setExtraSource([dataSource,buildingSource]);
      }else{
        this.setExtraSource([dataSource]); 
      }
      
        
  }

  setExtraSource=(source)=>{
    
    const {extraSource}=this.props.House;
    let sources=(extraSource && extraSource.length!==0 ) ? extraSource.concat(...source) : [...source];
    
    this.props.dispatch({
      type: 'House/setExtraSource',
      payload: sources
    })
  }
  removeExtraSource=()=>{
    const {extraSource}=this.props.House;
    if(extraSource && extraSource.length!==0 ){
      extraSource.map((item)=>{
        viewer.dataSources.remove(item);
      })
    }
    
    this.props.dispatch({
      type: 'House/setExtraSource',
      payload: undefined,
    })
  }

  onLoadData= (treeNode)=>{
    const {jdName,rightActiveKey,spaceQueryParam}=this.props.House;
    // 查询
    return new Promise((resolve)=>{

      if(treeNode.props.children && treeNode.props.children.length!==0){
        resolve();
        return;
      }
      let type=treeNode.props.dataRef.type;
      if(type==="parcel"){
        // 地查楼
        getBuildList({parcelId:treeNode.props.dataRef.attributes.parcelNo}).then((buildList)=>{
          if(buildList.success && buildList.data && buildList.data.length!==0){
            if(treeNode.props.dataRef){
              if(!treeNode.props.dataRef.children){
                treeNode.props.dataRef.children=[];
              }
              treeNode.props.dataRef.children=buildList.data;
              this.setState({
                treeData:[...this.state.treeData]
              });
            }
          }
          resolve();
        },()=>{
          resolve();
        });
      }else if(type==="building"){
        //楼查房
        getRoomList({buildingId:treeNode.props.dataRef.attributes.bldgNo}).then(roomList=>{
          if(roomList.success && roomList.data && roomList.data.length!==0){
            if(treeNode.props.dataRef){
              if(!treeNode.props.dataRef.children){
                treeNode.props.dataRef.children=[];
              }
              treeNode.props.dataRef.children=roomList.data;
              this.setState({
                treeData:[...this.state.treeData]
              });
            }
          }
          resolve()
        },()=>{
          resolve();
        })
      }else if(type==="noparcel"){
        // 查无地块信息的楼列表
        let dataParam={jdName:jdName};
        if(rightActiveKey=="query" && spaceQueryParam){
          dataParam=spaceQueryParam;
        }
        getBuildByNopacel(dataParam).then((buildList)=>{
          if(buildList.success && buildList.data && buildList.data.length!==0){
            if(treeNode.props.dataRef){
              if(!treeNode.props.dataRef.children){
                treeNode.props.dataRef.children=[];
              }
              treeNode.props.dataRef.children=buildList.data;

              this.setState({
                treeData:[...this.state.treeData]
              });
            }
          }
          resolve();
        },()=>{
          resolve();
        });
      }
      else{
        resolve();
      }
      // resolve();
    })
    
  }

  renderTreeNodes = (data,right) => {
    return data.map(item => {
      let key = this.getKey(item);
      let title=this.getTitle(item,key,right);
      if (item.children) {
        let areaSort=[]
        let regionalRanking=[]
        const {currentSort} = this.state
        let nextSort
        if(currentSort==='down') nextSort='up'
        else if(currentSort==='up') nextSort='down'
        item.children.map((item,index)=>{
          item.attributes && item.attributes.floorArea && areaSort.push(item)
          item.attributes && item.attributes.floorArea === null && regionalRanking.push(item)
          !item.attributes && regionalRanking.push(item)
        })
        areaSort.sort(sorType[nextSort].fn)
        areaSort.push(...regionalRanking)
        if(areaSort.length !== 0){
          const {buildList}=this.props.House;
          item.children=areaSort
          item.children.map(items=>{
            if(buildList.find(target=>target.id === items.id)){
              items.right = true
            }else{
              items.right = false
            }
          })
        }
        return (
          <TreeNode title={title} key={key} dataRef={item} isLeaf={item.type==="house"}>
            {item.right ? this.renderTreeNodes(item.children,item.right) : this.renderTreeNodes(item.children)}
          </TreeNode>
        );
      }
      return <TreeNode key={key} {...item} title={title} dataRef={item} isLeaf={item.type==="house"?true:false}/>;
    });
  }

  renderPOITreeNodes = data => {
    return data.map(item => {
      let title=this.getTitle(item);
      if (item.children) {
        return (
          <TreeNode title={title} key={item.title} dataRef={item} isLeaf={!item.children}>
            {this.renderPOITreeNodes(item.children)}
          </TreeNode>
        );
      }
      return <TreeNode key={item.entityId} {...item} title={title} dataRef={item} isLeaf={true}/>;
    });
  }

  getTitle=(item,key,right)=>{
    switch (item.type) {
      case "parcel":
        return  <div className={styles.name}><span className={`iconfont icon_earth ${styles.icon}`} /><span>{item.basicId}</span><span>[{item.attributes.luArea}m&sup2;]</span></div>;
      case "noparcel":
        return  <div className={styles.name}><span className={`iconfont icon_earth ${styles.icon}`} /><span>未出让用地</span></div>;
      case "building":
        return  <div className={item.right ? styles.name : `${styles.name} ${styles.names}`}><span className={`iconfont icon_building2 ${styles.icon}`} /><span>{item.name}</span><span>[{item.attributes.floorArea}m&sup2;]</span></div>;//`[楼]${item.name}[${item.attributes.floorArea} m]`;
      case "house":
        return <div className={right ? styles.name : `${styles.name} ${styles.names}`}><span className={`iconfont icon_house ${styles.icon}`} style={{marginRight:"20px"}}/><span>{item.attributes.roomName}</span></div>;//`[房]${item.name}[${item.attributes.houseSoleArea} m]`;
      default:
        return <div className={styles.name}><span>{item.title || item.name}</span></div>;//
    }
  }
  getKey=(item)=>{
    switch (item.type) {
      case "parcel":
        return `parcel${item.id}`
      case "noparcel":
        return `noparcel${item.id}`
      case "building":
        return `building${item.id}`
      case "house":
        return `room${item.id}`
      default:
        return '';
    }
  }

  generateList=(landList)=>{
    landList = landList || this.props.House.landList;
    const {treeData}=this.state;
    const {treeSelectedKeys} =this.props.House;
    let data=[];
    if(landList && landList.length!==0){
      landList.map((item,index)=>{
        data.push({...item,
          children:[],
        });
      })
      data.push({type:"noparcel",id:getGuidGenerator(),
        children:[],
      });
      this.setState({
        treeData:[...data],
      },()=>{
        if(treeSelectedKeys){
          
          setTimeout(()=>{
            this.scrollTo(treeSelectedKeys);
          },500)
          
        }
      })
    }
  }

  generatePOIList=()=>{
    const {POIList:{list}} = this.props.House;
    // let POIData={};
    let level1={};
    let level1_data=[]
    let level2={};
    let level2_data=[]
    // let level3={};
    // let POITreeData=[];
    // list.forEach(item => {
    //   if(!POIData[item.nameLarge]){
    //     POIData[item.nameLarge]=[];
    //     POIData[item.nameLarge].push(item);
    //   }else{
    //     POIData[item.nameLarge].push(item);
    //   }
    // });
    list.forEach(item => {
      if(!level1[item.nameLarge]){
        level1[item.nameLarge]=item;
        level1_data.push({children:[],title:item.nameLarge,codeLarge:item.codeLarge});
      }
    });
    list.forEach(item => {
      if(!level2[item.nameMedium]){
        level2[item.nameMedium]=item;
        level2_data.push({children:[],title:item.nameMedium,codeLarge:item.codeLarge,codeMedium:item.codeMedium});
      }
    });
    list.forEach(item => {
      level2_data.forEach(item2=>{
        if(item.codeMedium==item2.codeMedium){
          item2.children.push(item)
        }
      })
    });

    level1_data.forEach(item1 => {

      level2_data.forEach(item2=>{
        if(item1.codeLarge==item2.codeLarge){
          item1.children.push(item2)
        }
      })
    });


    // list.forEach(item => {
      
    // });

    // list.forEach(item => {
    //   if(!POIData[item.nameLarge]){
    //     POIData[item.nameLarge]={};
    //     POIData[item.nameLarge].children=[];
    //     POIData[item.nameLarge].children.push(item);
    //     if(!POIData[item.nameLarge][item.nameMedium]){
    //       POIData[item.nameLarge][item.nameMedium]={};
    //       POIData[item.nameLarge][item.nameMedium].children=[];
    //       POIData[item.nameLarge][item.nameMedium].children.push(item);
    //       if(!POIData[item.nameLarge][item.nameMedium][item.nameSmall]){
    //         POIData[item.nameLarge][item.nameMedium][item.nameSmall]={}
    //         POIData[item.nameLarge][item.nameMedium][item.nameSmall].children=[];
    //         POIData[item.nameLarge][item.nameMedium][item.nameSmall].children.push(item);
    //       }else{
    //         POIData[item.nameLarge][item.nameMedium][item.nameSmall].children.push(item);
    //       }
    //     }else{
    //       POIData[item.nameLarge][item.nameMedium].children.push(item);
    //     }
    //   }else{
    //     POIData[item.nameLarge].children.push(item);
    //     if(!POIData[item.nameLarge][item.nameMedium]){
    //       POIData[item.nameLarge][item.nameMedium]={};
    //       POIData[item.nameLarge][item.nameMedium].children=[];
    //       POIData[item.nameLarge][item.nameMedium].children.push(item);
    //       if(!POIData[item.nameLarge][item.nameMedium][item.nameSmall]){
    //         POIData[item.nameLarge][item.nameMedium][item.nameSmall]={}
    //         POIData[item.nameLarge][item.nameMedium][item.nameSmall].children=[];
    //         POIData[item.nameLarge][item.nameMedium][item.nameSmall].children.push(item);
    //       }else{
    //         POIData[item.nameLarge][item.nameMedium][item.nameSmall].children.push(item);
    //       }
    //     }else{
    //       POIData[item.nameLarge][item.nameMedium].children.push(item);
    //     }
    //   }
    // });

    // for (const key in POIData) {
    //   if (POIData.hasOwnProperty(key)) {
    //     POITreeData.push({title:key,children:POIData[key]});
    //   }
    // }

    this.setState({
      POITreeData:[...level1_data],
    });


  }

  getAreaSort=()=>{
    const {treeData}=this.state;
    // console.log(this.state)
    let areaSort=[]
    let regionalRanking=[]
    const {currentSort} = this.state
    let nextSort
    if(currentSort==='down') nextSort='up'
    else if(currentSort==='up') nextSort='down'
    treeData.map((item,index)=>{
      item.attributes && item.attributes.luArea && areaSort.push(item)
      item.attributes && item.attributes.luArea === null && regionalRanking.push(item)
      !item.attributes && regionalRanking.push(item)
    })
    areaSort.sort(sorTypes[currentSort].fn)
    areaSort.push(...regionalRanking)
    this.setState({
      treeData:[...areaSort],
      currentSort:nextSort
    });
  }

  goBack=()=>{
    this.props.goBack &&  this.props.goBack();
  }

  render() {
    const {treeData,selectedKeys,expandedKeys,POITreeData}=this.state;
    const {rightActiveKey:activeKey,spaceQueryParam} =this.props.House;
    // console.log(treeData)
    return (
      <>
      <ModuleTitle title='列表'>
      </ModuleTitle>
      <div className={styles.box} style={{ color: '#fff' }} ref={this.refList}>
        <span className={styles.poiTitle}>地楼房</span>
        <div className={styles.specialTitle}>
          <button className={styles.button} onClick={()=>this.getAreaSort()}>按面积排序</button>
          <button className={styles.button}>按名称排序</button>
        </div>
        <Tree
          autoExpandParent={false}
          onSelect={this.onSelect}
          onExpand={this.onExpand}
          loadData={this.onLoadData}
          showIcon
          showLine
          switcherIcon={<Icon type="double-right" ></Icon>}
          selectedKeys={selectedKeys}
          expandedKeys={expandedKeys}
        >
          {this.renderTreeNodes(treeData)}
        </Tree>
        {
          (spaceQueryParam) && 
          <>
            <span className={styles.poiTitle}>公共服务设施</span>
            <Tree
              autoExpandParent={false}
              onSelect={this.onPOISelect}
              // onExpand={this.onExpand}
              // loadData={this.onLoadData}
              showIcon
              showLine
              switcherIcon={<Icon type="double-right" ></Icon>}
              // selectedKeys={selectedKeys}
              // expandedKeys={expandedKeys}
            >
              {this.renderPOITreeNodes(POITreeData)}
            </Tree>
          </>
        }
        <div className={styles.btn} onClick={()=>this.goBack()}><span>返回{(activeKey==="query" && spaceQueryParam)?'空间':''}统计信息</span></div>
      </div>
      </>
    );
  }
}

export default HouseTree