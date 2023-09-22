/* global Cesium */
/* global viewer */
/* global mars3d */

import React, { Component } from 'react'
import ListView from '@/components/listView'
import {Pagination} from 'antd'
import styles from './styles.less'
import { connect } from 'dva';
import { PUBLIC_PATH } from '@/utils/config'
import { updateCommaList } from 'typescript';

const POITYPE=[{
  name:"所有类型",
},{
  name:"汽车服务",
},{
  name:"汽车销售",
},{
  name:"汽车维修",
},{
  name:"摩托车服务",
},{
  name:"餐饮服务",
},{
  name:"购物服务",
},{
  name:"生活服务",
},{
  name:"体育休闲服务",
},{
  name:"临时医疗保健服务",
},{
  name:"住宿服务",
},{
  name:"风景名胜",
},{
  name:"商务住宅",
},{
  name:"政府机构和社会团体",
},{
  name:"科教文化服务",
},{
  name:"金融保险服务",
},{
  name:"临时公司企业",
},{
  name:"道路附属设施",
},{
  name:"地名地址信息",
},{
  name:"公共设施",
},{
  name:"消防设施",
},{
  name:"事件活动",
},{
  name:"室内设施",
},{
  name:"通行设施",
}]

@connect(({ House }) => ({
  House
}))
class POIList extends Component {

  constructor(props){
    super(props);
    this.state={
      activeId:"",
      poiType:'所有类型',
      secondTypeList:[],
      threeTypeList:[],

    }
    this.mouseEntity=null;
    this.refList=React.createRef(); //这个指向list

  }

  componentDidMount() {
    const {basicBldgId} =this.props.House;
    this.props.onRef && this.props.onRef(this);

    this.props.dispatch({
      type: 'House/getPOITypes',
    })
  }

  componentWillUnmount(){
    this.removeExtraSource();
  }



  componentWillReceiveProps(newPorps){
    const {POIList:{list}} =this.props.House;
    let newList=newPorps.House.POIList.list;
    // let newHouseId=newPorps.House.activeRoomListId;
    // if(newList && newList!==list){
    //   this.showItemsFeature(newList);
    // }
    // if(newHouseId !=='' && activeRoomListId!==newHouseId){
    //   this.handleScrollToElement(newHouseId);
    //   this.highLight(newHouseId);
    //   return;
    // }
  }

  click=(properties)=>{
    this.highLight(properties.entityId);
    this.flyTo(properties);
    this.showFeature(properties);
  }

  flyTo=(item)=>{
    let location=JSON.parse(item.location);
    let coordinates=[];
    if(location.type==="MultiPolygon"){
      coordinates = location.coordinates[0][0];
    }else if(location.type==="Polygon"){
      coordinates = location.coordinates[0];
    }else if(location.type==="Point"){
      coordinates = location.coordinates;
    }

    var position = Cesium.Cartesian3.fromDegrees(coordinates[0],coordinates[1]);
    let height=viewer.scene.sampleHeight(Cesium.Cartographic.fromCartesian(position)) || 5;
    if(height<50){
      height=50;
    }
   let center =Cesium.Cartesian3.fromDegrees(coordinates[0],coordinates[1],height);
    viewer.scene.camera.flyToBoundingSphere(new Cesium.BoundingSphere(center,height*2), {
      duration: 2
    });
  }

  showItemsFeature=(items)=>{
    this.removeExtraSource();
    if(items.length ===0){
      return;
    } 
    let dataSource=new Cesium.CustomDataSource('point');
    viewer.dataSources.add(dataSource);
    items.forEach(item => {      
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
        var iconame;
        switch (item.poiType) {
          case "宾馆酒楼": iconame = 180100; break;
          case "购物中心": iconame = 200100; break;
          case "基础地名": iconame = 110301; break;
          case "交通设施": iconame = 160500; break;
          case "金融机构": iconame = 210104; break;
          case "科技教育": iconame = 130101; break;
          case "餐饮连锁": iconame = 190300; break;
          case "旅游观光": iconame = 170100; break;
          case "日常服务": iconame = 231200; break;
          case "市政网点": iconame = 240100; break;
          case "文化体育": iconame = 150800; break;
          case "医疗卫生": iconame = 140100; break;
          case "邮政通信": iconame = 220100; break;
          case "政府机关": iconame = 120100; break;
          case "知名企事业": iconame = 250200; break;
          default: iconame = 231200; break;
        }
        var iconameurl = `${PUBLIC_PATH}config/images/mark/` + iconame + '.png';
        var position = Cesium.Cartesian3.fromDegrees(positions[0],positions[1]);
        let height=viewer.scene.sampleHeight(Cesium.Cartographic.fromCartesian(position));
        let entity=dataSource.entities.add({
          position: Cesium.Cartesian3.fromDegrees(positions[0],positions[1],height),
          billboard:{
            image: encodeURI(iconameurl),//'./config/images/mark/250000.png',
            scale: 1, //原始大小的缩放比例
            horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
            verticalOrigin: Cesium.VerticalOrigin.CENTER,
            heightReference: Cesium.HeightReference.NONE,
            scaleByDistance: new Cesium.NearFarScalar(1.5e2, 1.0, 8.0e6, 0.2),
            distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0.0, 50000),
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
            distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0.0, 50000)
          },
          // polyline:{
          //     positions : coordinatesArrayToCartesianArray(positions),
          //     material:Cesium.Color.RED.withAlpha(1.0),//Cesium.Color.DIMGRAY.withAlpha(0.8),//Cesium.Color.fromRandom({alpha:1.0})Cesium.Color.DARKGRAY.withAlpha(0.0)
          //     classificationType:Cesium.ClassificationType.BOTH,
          //     clampToGround:true,
          //     width:2,
          // },
          
        });
        entity.tooltip=this.createTooltip(item.name);
      });
    
    dataSource.clustering.pixelRange=1;
    dataSource.clustering.minimumClusterSize=5;
    dataSource.clustering.enabled = true;
    this.setExtraSource(dataSource);
  }

  removeFeature=()=>{
    this.mouseEntity && viewer.dataSources.remove(this.mouseEntity);
    this.mouseEntity=null;
  }

  showFeature=(item,type)=>{
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
          color: type ==="mouse" ? Cesium.Color.SKYBLUE :Cesium.Color.LIME, // default: WHITE
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
    if(type=="mouse"){
      this.removeFeature();
      this.mouseEntity=dataSource;
    }else{
      this.removeExtraSource();
      this.setExtraSource(dataSource);
    }

  }

  createTooltip=(name)=>{
    
    let html=`<div class="${styles.tooltip}">
            <div class="${styles.content}">
                <div class="${styles.item}">
                    <span class="${styles.name}">名称:</span>
                    <span class="${styles.value}">${name}</span>
                </div>
            </div>
          </div>`;
    return {
        html:html
    }
}

  setExtraSource=(source)=>{
    
    const {extraSource}=this.props.House;
    let sources=(extraSource && extraSource.length!==0 ) ? extraSource.concat(source) : [source];
    
    this.props.dispatch({
      type: 'House/setExtraSource',
      payload: sources
    })
  }

  removeExtraSource=()=>{
    const {extraSource}=this.props.House;
    if(extraSource && extraSource.length!==0 ){
      extraSource.forEach((item)=>{
        item.name==="point" && viewer.dataSources.remove(item);
      })
    }
  }

  highLight=(basicHouseId)=>{
    this.setState({
      scrollToId:basicHouseId || '',
    });
  }

  handleScrollToElement=(id)=> {
    if(!id){
      this.refList.current.listWrapper.scrollTop--;
      return;
    }
    this.setState({
      scrollToId : id
    })

  }

  updateList=(item,level)=>{
    const {POIList:{geo,pageSize,pageNo,pageTotal}}=this.props.House;
    this.setState({
      poiType:item.name,
      // isShowSelects:false,
    })
    let dataParam={
      geo:geo,
      poiType:item.code,
      queryType:level,
    }
    if(item.name==="所有类型"){
      dataParam={
        geo:geo,
      }
      this.setState({
        secondTypeList:[],
        threeTypeList:[],
        isShowSelects:false,
      })
    }
    if(item.children && item.children.length!==0){
      if(level==0){
        this.setState({
          secondTypeList:item.children,
          threeTypeList:[],
        })
      }
      if(level==1){
        this.setState({
          threeTypeList:item.children
        })
      }
      
    }else{
      if(level==0){
        this.setState({
          secondTypeList:[],
          threeTypeList:[],
        })
      }
      if(level==1){
        this.setState({
          threeTypeList:[],
        })
      }
    }

    //更新poilist
    this.props.dispatch({
      type: 'House/getPOIList',
      payload: dataParam
    })
      // this.setState({isShowSelects:!isShowSelects})}
    // }

  }

  onChangePage=(page)=>{
    const {POIList:{geo,pageSize,pageNo,pageTotal}}=this.props.House
    if(page===pageTotal){
      return;
    }
    if(page=="pre"){
      page=pageNo-1;
    }else if(page=="next"){
      page=pageNo+1;
    }
    if(page<1 || page >pageTotal){
      return;
    }
    //更新poilist
    this.props.dispatch({
      type: 'House/getPOIList',
      payload: {
        geo:geo,
        limit: pageSize,
        page: page,
      }
    })
  }

  render() {
    const {POIList:{list,total,pageNo,pageSize,pageTotal},POITypes} = this.props.House;
    const {poiType,isShowSelects,scrollToId,secondTypeList,threeTypeList}=this.state;
    const {isExpand} =this.props;
    const arrId = ["080000","090000","130000","140000","150000","110000","200000"]; 
    return (
      <>
        <div className={`${styles.poilist} ${isExpand?'':styles.expand}`}>
          <div className={styles.title}>
            <span>公共服务设施列表</span>
            <div className={styles.btn}>
              <span className={styles.options}>{poiType}</span>
              <span className={`iconfont icon_unfold1 ${styles.icon}`} onClick={()=>{this.setState({isShowSelects:!isShowSelects})}}/>
              <ul className={`${styles.selects} ${isShowSelects?'':styles.hide}`}>
                {
                  POITypes && POITypes.map((item,index)=>{
                    return <li key={index} onClick={()=>this.updateList(item,0)}>{item.name}</li>
                  })
                }
              </ul>
                {
                  secondTypeList.length!==0 &&  
                  <ul className={`${styles.selects} ${styles.second} ${isShowSelects?'':styles.hide}`}>
                    {
                      secondTypeList && secondTypeList.map((item,index)=>{
                        return <li key={index} onClick={()=>this.updateList(item,1)}>{item.name}</li>
                      })
                    }
                </ul>
                }
                {
                  threeTypeList.length!==0 &&  
                  <ul className={`${styles.selects} ${styles.three} ${isShowSelects?'':styles.hide}`}>
                    {
                      threeTypeList && threeTypeList.map((item,index)=>{
                        return <li key={index} onClick={()=>this.updateList(item,3)}>{item.name}</li>
                      })
                    }
                </ul>
                }
            </div>
          </div>
          {
            list.length!=0&&<div className={styles.totalNuM}>{`查找到 ${list.length} 条结果`}</div>
          }
          <div className={styles.table} >
            <ListView
              ref={this.refList}
              source = {list}
              rowHeight={68}
              // rowHeight={54}
              scrollToId  = {this.state.scrollToId}
              renderItem = {({item,index,style})=>(
                <div className={(item.entityId===scrollToId)? styles.row +' '+styles.active :styles.row} data={index} key={index} id={item.entityId} style={{...style}} onMouseEnter={()=>this.showFeature(item,"mouse")} onMouseLeave={()=>this.removeFeature("mouse")}  onClick={() => this.click(item)}>
                  <div className={styles.top}>
                    <span className={styles.name} title={item.name}>{item.name}</span>
                    {/* <span className={styles.status} style={{textAlign:arrId.includes(item.codeLarge)?"left":"center"}} title={item.nameLarge}>{item.nameLarge}</span> */}
                    <span className={styles.status} title={item.nameLarge}>{item.nameLarge}</span>
                  </div>
                  
                  <div className={styles.addr} title={item.address}>{item.address}</div>
                </div>
              )}
            ></ListView>
             {/* {
                list && list.map((item,index)=>{
                   
                return <div className={(item.entityId===activeId)? styles.row +' '+styles.active :styles.row} key={index}  id={item.entityId} onMouseEnter={()=>this.showFeature(item,"mouse")} onMouseLeave={()=>this.removeFeature("mouse")}  onClick={() => this.click(item)}>
                          <div className={styles.top}>
                            <span className={styles.name} title={item.name}>{item.name}</span>
                            <span className={styles.status}>{item.poiType}</span>
                          </div>
                          
                          <div className={styles.addr} title={item.address}>{item.address}</div>
                      </div>
                })
             }  */}
          </div>
          {/* <div className={styles.pagination}>
              <div className={styles.pagejump}>
                <input type="number" min={"1"} max={pageTotal.toString()} className={styles.pagetext} value={pageNo}  onChange={(event)=>this.onChangePage(event.target.value)}/>
                <div className={styles.pageCont}>/&nbsp;{pageTotal}&nbsp;页</div>
              </div>
              <div className={styles.pageoeder}>
                  <span className={`${styles.homepage} ${styles.pagebtn} ${pageNo==1?styles.disabledpage:''}`} onClick={this.onChangePage.bind(this,1)}>首页</span>
                  <span className={`${styles.lastpage} ${styles.pagebtn} ${pageNo==1?styles.disabledpage:''}`} onClick={this.onChangePage.bind(this,"pre")}><i className={"iconfont icon_arrow_down"} style={{transform:"rotate(90deg)"}}></i></span>
                  <span className={`${styles.nextpage} ${styles.pagebtn} ${pageNo==pageTotal?styles.disabledpage:''}`} onClick={this.onChangePage.bind(this,"next")}><i className={"iconfont icon_arrow_up"} style={{transform:"rotate(90deg)"}}></i></span>
                  <span className={`${styles.tailpage} ${styles.pagebtn} ${pageNo==pageTotal?styles.disabledpage:''}`} onClick={this.onChangePage.bind(this,pageTotal)}>尾页</span>
              </div>
          </div> */}
        </div>
      </>
    );
  }
}

export default POIList;
