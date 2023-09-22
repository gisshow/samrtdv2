/* global Cesium */
/* global viewer */
/* global mars3d */
import React, { Component } from 'react'
import styles from './styles.less'
import { connect } from 'dva';
import SearchPanel from '@/components/searchPanel';
import {getParcelByBuildId} from '@/service/house'
import {coordinatesArrayToCartesianArray} from '@/utils/index';

@connect(({ House,Home }) => ({
  House,Home
}))
class HouseSearch extends Component {

  constructor(props){
    super(props);
    this.state={
      activeKey:"",
      historyList:[],
      isFocus:false
    }
    // this.treeList=React.createRef();

  }

  componentWillUnmount(){
    this.clearList();
  }


  search = (value) => {
    // 记录搜索历史，存储在localStorage中
    let result=[];
    let history=window.localStorage.getItem('searchHistory');
    if(history){
      result=JSON.parse(history);
      result.push(value);
    }else{
      result.push(value);
    }
    result=result.slice(-10);
    result=JSON.stringify(result);
    window.localStorage.setItem('searchHistory',result);

    // 清除历史列表
    this.setState({
      ...this.state,
      historyList:[],
    })

    // 执行查询
    this.props.dispatch({
      type:'House/getSearchList',
      payload:{
        keyword:value,
        limit:10,
        page:1,
      }
    })
  };

    //页码change回调
  onPageChange=(page)=>{
    const {searchList:{pageNo,pageSize,pageTotal}} = this.props.House;
    // if(page===pageTotal){
    //   return;
    // }
    if(page=="pre"){
      page=pageNo-1;
    }else if(page=="next"){
      page=pageNo+1;
    }
    if(page<1 || page >pageTotal){
      return;
    }
    // 执行查询
    this.props.dispatch({
      type:'House/getSearchList',
      payload:{
        keyword:this.searchPanel.state.text,
        limit:pageSize,
        page:page,
      }
    })
  }
  // 点击历史记录，回填搜索关键字
  clickSearch=(value)=>{
    this.searchPanel && this.searchPanel.search(value);
  }
  onChange=(value)=>{
    if (value==='') {
      this.onFocus()
    }else{
      // 清除历史列表
      this.setState({
        ...this.state,
        historyList:[],
      })
      // 执行查询
      this.props.dispatch({
        type:'House/getSearchPrevList',
        payload:{
          keyword:value,
        }
      })
    }
  }
  //显示历史
  onFocus=()=>{
    // console.log('onfocus')
    // 记录搜索历史，存储在localStorage中
    let history=window.localStorage.getItem('searchHistory');
    if(!history) return;
    // if(history){
    history=JSON.parse(history);
    // }
    history=Array.from(new Set(history.reverse()));//数组去重
    this.setState({
      ...this.state,
      isFocus:true,
      historyList:history,
    })
    // let result=history.slice(-10);
    // result=JSON.stringify(result);
    // window.localStorage.setItem('searchHistory',result);
  }
  onBlur=()=>{
    this.setState({
      ...this.state,
      isFocus:false,
    })
  }
  
  switchIcon = (type)=>{
    switch (type) {
      case "parcel":
        return  <span className={`iconfont icon_earth ${styles.icon}`} />;
      case "noparcel":
        return  <span className={`iconfont icon_earth ${styles.icon}`} />;
      case "building":
        return  <span className={`iconfont icon_building2 ${styles.icon}`} />;
      case "house":
        return <span className={`iconfont icon_house ${styles.icon}`} style={{marginRight:"20px"}}/>;
      default:
        return <span className={`iconfont icon_editbeifen ${styles.icon}`} />;
    }
  }



  showExtraSource=()=>{
    const {extraSource}=this.props.House;
    if(extraSource && extraSource.length!==0 ){
      extraSource.forEach(item => {
        item.show=true;
      });
    }    
  }




  clearList=()=>{
    this.setState({
      historyList:[],
    })
    this.props.dispatch({
      type:"House/setSearchList",
      payload:{
        data:[],
      }
    })
    localStorage.removeItem('searchHistory')
    this.removeExtraSource();
  }

  renderHistory=()=>{
    const {historyList, isFocus} =this.state;
    const {searchList} = this.props.House;
    if(historyList && historyList.length>0){
      return (
      <>
        <div className={styles.searchList}>
          <div className={styles.list}>
            {historyList && historyList.map((item,index) => {
              return <div className={styles.item} key={index} onClick={()=>this.clickSearch(item)}>{this.switchIcon(item.type)}<span
                className={styles.name}>{item}</span></div>;
            })}
          </div>
          <div className={styles.close} onClick={()=>this.clearList()}>删除历史</div>
        </div>
      </>
      )
    }else if(searchList && (searchList.total>0 || searchList.length>0)){
      return (
        <>
          <div className={styles.searchList}>
            <div className={styles.list}>
              {searchList.list && searchList.list.map((item,index) => {
                return <div className={styles.item} key={index} onClick={()=>this.showFeature(item)}>{this.switchIcon(item.type)}<span
                  className={styles.name}>{item.name}</span>
                  <span className={styles.address} title={item.address}>{item.address}</span></div>;
              })}
              {searchList.length && searchList.map((item,index) => {
                return <div className={styles.item} key={index} onClick={()=>this.showFeature(item)}>{this.switchIcon(item.type)}<span
                  className={styles.name}>{item.name}</span>
                  <span className={styles.address} title={item.address}>{item.address}</span></div>;
              })}
            </div>
            {/* <div className={styles.close} onClick={()=>this.clearList("")}>删除历史</div> */}
            {/* {
              searchList.total && 
              // <div className={styles.pagetation}>
                <Pagination size='small' total={searchList.total} onChange={(page,pageSize)=>this.onPageChange(page,pageSize)}></Pagination>
              // </div>
            } */}
            {
              searchList.total && <div className={styles.pagination}>
                  <span className={styles.total}>{searchList.pageNo}/{searchList.pageTotal}页</span>
                  <div className={styles.jump}>
                    <span className={styles.pagebtn} onClick={this.onPageChange.bind(this,1)}>首页</span>
                    <span className={`iconfont icon_arrow_down ${styles.icon}`} onClick={this.onPageChange.bind(this,"pre")}></span>
                    <span className={`iconfont icon_arrow_up ${styles.icon}`} onClick={this.onPageChange.bind(this,"next")}></span>
                  </div>                  
              </div> 
            }
          </div>
          
        </>
        )
    }
    return null;
    return
    
  }
  showFeature=(item)=>{
    console.log(item)
    this.removeExtraSource();
    switch (item.type) {
      case "building":
        this.props.dispatch({
          type: 'House/setBldgKey',
          payload: item.typeKey
        })
        this.goDetail(item);
        this.showBuildFeature(item);
        
        break;
        case "parcel":
          this.goDetail(item);
          this.showLandFeature(item);
          
          break;
      default:
        break;
    }
  }

  //返回详情页面
  goDetail=(item)=>{
    const {detailType,statType}=this.props.House;
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
        ...detailType,
        isRenderDetail:true,
        type:item.type,
        title:title,
      }
    })
    if(statType.isRenderSubStat){
      this.props.dispatch({
        type:'House/setStatType',
        payload:{
          ...statType,
          isRenderSubStat:false,
        }
      })
    }
  }

  showLandFeature=(item)=>{
    let dataSource=new Cesium.CustomDataSource('landm');
    viewer.dataSources.add(dataSource);
    let positions=[];
    let location={};
    try {
        location=JSON.parse(item.geo);
        // hole=JSON.parse(holeGeometry);
        if(location.type==="MultiPolygon"){
            positions = location.coordinates[0][0];
        }else if(location.type==="Polygon"){
            positions = location.coordinates[0];
        }
    } catch (error) {
        console.log(item.geo);
    }
    dataSource.entities.add({
      polyline:{
          positions : coordinatesArrayToCartesianArray(positions),
          material:Cesium.Color.RED.withAlpha(1.0),//Cesium.Color.DIMGRAY.withAlpha(0.8),//Cesium.Color.fromRandom({alpha:1.0})Cesium.Color.DARKGRAY.withAlpha(0.0)
          classificationType:Cesium.ClassificationType.BOTH,
          clampToGround:true,
          width:2,
      },
      
    });
    this.setExtraSource([dataSource]);
    let polyPositions = coordinatesArrayToCartesianArray(positions);
    let polyCenter = Cesium.BoundingSphere.fromPoints(polyPositions).center;
    // polyCenter = Cesium.Ellipsoid.WGS84.scaleToGeodeticSurface(polyCenter);
    let height=150;
    viewer.scene.camera.flyToBoundingSphere(new Cesium.BoundingSphere(polyCenter,height*3), {
      duration: 2
    });
    this.props.dispatch({
      type: 'House/setParcelCod',
      payload: item.code || item.no
    })
    
  }

  showBuildFeature=(item)=>{
    let dataSource=new Cesium.CustomDataSource('buildingm');
    viewer.dataSources.add(dataSource);
    let positions=[];
    let location={};
    try {
        location=JSON.parse(item.geo);
        // hole=JSON.parse(holeGeometry);
        if(location.type==="MultiPolygon"){
            positions = location.coordinates[0][0];
        }else if(location.type==="Polygon"){
            positions = location.coordinates[0];
        }
    } catch (error) {
        console.log(item.geo);
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
    // this.setExtraSource(dataSource);
    // let entity=dataSource.entities.values[0];
    let polyPositions = coordinatesArrayToCartesianArray(positions);
    let polyCenter = Cesium.BoundingSphere.fromPoints(polyPositions).center;
    // polyCenter = Cesium.Ellipsoid.WGS84.scaleToGeodeticSurface(polyCenter);
    let height=150;
    viewer.scene.camera.flyToBoundingSphere(new Cesium.BoundingSphere(polyCenter,height*3), {
      duration: 2
    });
    //用于查询详情
    this.props.dispatch({
      type: 'House/setBldgNo',
      payload: item.no
    })
    // 用于查询楼下面的列表--在详情页面中赋值
    this.getLandVecByBuildId(item.no,dataSource);
  }
  //查询楼所在的地，并加载显示。
  getLandVecByBuildId= async (bldgNo,buildSource)=>{
    
    let result=await getParcelByBuildId({bldgNo:bldgNo});
    if(result.success && result.data){
        this.addLandVecByBuild(result.data,buildSource);
        
    }else{
      this.setExtraSource([buildSource]);
    }
  }
  addLandVecByBuild =(item,buildSource)=>{
    // 设置地块code
    this.props.dispatch({
      type: 'House/setParcelCod',
      payload: item.attributes.parcelCode || item.attributes.parcelNo
    })
    let dataSource=new Cesium.CustomDataSource('landByBuildId-m');
    viewer.dataSources.add(dataSource);
    // this.dataSource=dataSource;
    // landData.map((item,index)=>{
        let positions=[];
        let location={};
        let hole={};
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

        // var holes = [];
        // holes.push(
        //   new Cesium.PolygonHierarchy(
        //     coordinatesArrayToCartesianArray(holeGeometry.type==="MultiPolygon"?holeGeometry.coordinates[0][0]:holeGeometry.coordinates[0])
        //   )
        // );
      let entity=dataSource.entities.add({
        polyline:{
          //   hierarchy : {
              positions : coordinatesArrayToCartesianArray(positions),
          //   },
            material:Cesium.Color.fromCssColorString("#E1726F"),//Cesium.Color.DIMGRAY.withAlpha(0.8),//Cesium.Color.fromRandom({alpha:1.0})Cesium.Color.DARKGRAY.withAlpha(0.0)
            classificationType:Cesium.ClassificationType.BOTH,
            clampToGround:true,
            width:3,
          },
      });
      this.setExtraSource([dataSource,buildSource]);
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


  render() {
    return (
      <>
        <div className={styles.searchBox}>
          <SearchPanel onSearch={this.search} onRefs={node=>this.searchPanel=node}  onFocus={this.onFocus} onChange={(value)=>this.onChange(value)}></SearchPanel>
          {
            this.renderHistory()
          }
        </div>
      </>
    );
  }
}

export default HouseSearch;
