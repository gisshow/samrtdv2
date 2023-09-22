/* global Cesium */
/* global viewer */
/* global mars3d */
/* global $ */
/* global turf */
/* global Popup */
import React, { Component } from 'react';
import styles from './index.less';
import EdAddTo from './components/edAddTo';
import SearchPanel from './components/searchPanel';
import { connect } from 'dva'
import imageList from './img/img.json';
const TEXT_ALL_VALUES = [{ name: '全选', id: '1-all' }, { name: '全选', id: '2-all' }];
@connect(({ House }) => ({
  House
}))

class LeftHome extends Component {

  constructor(props) {
    super(props);
    this.state = {
      isAddTo:false,//是否筛选条件
      addCondition:[],//添加条件
      begin:null,
      finish:null,
      selectKey:["幼儿园",'小学','初中','高中', "已建", "在建", "待建", "公办", "民办",'普惠'],
      selectAllKey:["学校类型", "学校状态", "学校性质"],
      historyList:[],

      schoolType:["幼儿园",'小学','初中','高中'],
      buildStatus:["已建", "在建", "待建"],
      schoolProperty:["公办", "民办",'普惠'],

      regionLabel:"深圳市",
      secondNodeList: [],
      paramDataObjId:'',
      activeIds: [TEXT_ALL_VALUES[0].id],
      activeNames:[],
      distinctBorderHash:{},
      regionItems:[],//区域判断
      changeValue:'',
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
    this.mouseEntity=null;
    this.mouseClickEntity=null;
  }

  componentWillReceiveProps(newPorps) {
    const {schoolSearch} = newPorps.House;
    if(schoolSearch && schoolSearch.list){
      this.addordinaryMarker(schoolSearch.list)
    }
  }

  componentDidMount(){
    this.AllParentMarker = [];
  }

  onRef=(res)=>{
    this.res = res
  }

  cameraChangeEvent =()=>{
    // 获取地图层级  
  }

  bindEvent = () => {

  }

  componentWillUnmount=()=>{
    this.clearList();//删除搜索历史
    this.removeAllbillboard();
    this.showStreetDistinct();
    this.hideDistinct();
  }

  hideDistinct=()=>{
    this.distinctEntity.map((item,index)=>{
        viewer.dataSources.remove(item);
    })
  }

  flyTos=(bbox,isSelfHand)=>{
    if(!isSelfHand) return;
    if(bbox){
        let rectangle=Cesium.Rectangle.fromDegrees(bbox[0],bbox[1],bbox[2],bbox[3]);
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

  loadStreetDistinct= async (url,quName)=>{
    this.hideDistinct();
    let options = {
        clampToGround: true //开启贴地
    };
    let dataSource = await Cesium.GeoJsonDataSource.load(url, options);
    viewer.dataSources.add(dataSource);
    this.distinctEntity.push(dataSource);
    if(!this.streetEntityHash[quName]){
        this.streetEntityHash[quName]=dataSource;
    }
    const entities = dataSource.entities.values;
    entities.forEach(entity => {
        const name = entity.name;
        entity.show=true;
        entity.polyline.width = 3;
        entity.polyline.material = new Cesium.PolylineGlowMaterialProperty({
            glowPower: .6,
            color: Cesium.Color.fromCssColorString('#1694E7').withAlpha(.9)
        })
    })    
  }

  //隐藏全市边界线
  hideStreetDistinct =()=>{
    this.props.dispatch({
      type: 'House/setRightActiveKey',
      payload: "mainStat",
    });
    this.props.dispatch({
      type: 'House/setMainStat',
      payload: true,
    });
  }

  //展示全市边界线
  showStreetDistinct =()=>{
    this.props.dispatch({
      type: 'House/setRightActiveKey',
      payload: "",
    });
    this.props.dispatch({
      type: 'House/setMainStat',
      payload: false,
    });
  }

  //条件选择
  edAddTo = () => {
    this.setState({
      isAddTo: !this.state.isAddTo,
      historyList:[],
    },()=>{
      this.removeAllbillboard()
    })
    this.props.dispatch({
      type:"House/setSchoolSearch",
      payload:{
        data:[],
      }
    })
  }

  //条件确定传回的条件
  getAddCondition= (selectKey,selectAllKey,begin,finish,secondNode,activeId,activeName,regionLabel,secondNodeTow,value) => {
    this.setState({
      selectKey:selectKey,
      selectAllKey:selectAllKey,
      begin:begin,
      finish:finish,
      secondNodeList:secondNode,
      activeIds:activeId,
      activeNames:activeName,
      regionLabel:regionLabel,
      isAddTo:false,
    },()=>{
      this.onClickSearch(value||this.state.changeValue)
      let topNode
      const {regionData} =this.props.House;
      regionData.map((item, index) => {
        if(item.name===regionLabel){
          topNode=item
        }
      })
      if(topNode && topNode.name){
        this.loadStreetDistinct(JSON.parse(topNode.geometry),topNode.name);
        this.targetBbox=topNode.minLongitude ? [topNode.minLongitude,topNode.minLatitude,topNode.maxLongitude,topNode.maxLatitude] : false;
        this.flyTos(this.targetBbox,true)
        this.hideStreetDistinct()
      }else{
        this.showStreetDistinct()
        this.targetBbox=false;
        this.flyTos(this.targetBbox,true)
        this.hideDistinct();
      }
      
    })
  }

  //删除历史
  clearList=()=>{
    this.setState({
      historyList:[],
    })
    this.props.dispatch({
      type:"House/setSchoolSearch",
      payload:{
        data:[],
      }
    })
    localStorage.removeItem('searchHistorys');
  }

  onChange=(value)=>{
    if (value==='') {
      this.onFocus()
    }else{
      // 清除历史列表
      this.setState({
        ...this.state,
        historyList:[],
        changeValue:value
      })
      
      // let schoolTypes = [] ;
      // let buildStatuss = [] ;
      // let schoolPropertys = [] ;
      // this.transformation(schoolTypes,buildStatuss,schoolPropertys)
      // const {regionLabel,begin,finish} =this.state;
      // // 执行查询
      // this.props.dispatch({
      //   type:'House/getSchoolSearch',
      //   payload:{
      //     pageSize:8,
      //     pageNo:1,
      //     schoolName:value,//搜索框内容
      //     schoolType:schoolTypes.join(','),//已建学校类型
      //     buildStatus:buildStatuss.join(','),//建设状态
      //     schoolProperty:schoolPropertys.join(','),//已建学校性质
      //     county:regionLabel==='深圳市'?'深圳市':regionLabel,//行政区
      //     // startDate:(begin===null ? begin : new Date(begin).getFullYear()),//建校开始时间
      //     // endTime:(finish===null ? finish : new Date(finish).getFullYear()),//建校结束时间
      //   }
      // })
    }
  }
  //显示历史
  onFocus=()=>{
    this.props.dispatch({
      type:"House/setSchoolSearch",
      payload:{
        data:[],
      }
    })
    this.removeAllbillboard();
    let history=window.localStorage.getItem('searchHistorys');
    if(!history)return;
    history=JSON.parse(history);
    history=Array.from(new Set(history.reverse()));//数组去重
    this.setState({
      ...this.state,
      historyList:history,
    })
  }

  search =(value) => {
    if(this.state.isAddTo){
      this.res.onClickdetermine(value)
    }else{
      this.onClickSearch(value)
    }
  };

  onClickSearch=(value)=>{
    if(value !== '' && value !== undefined ){
      // 记录搜索历史，存储在localStorage中
      let result=[];
      let history=window.localStorage.getItem('searchHistorys');
      if(history){
        result=JSON.parse(history);
        result.push(value);
      }else{
        result.push(value);
      }
      result=result.slice(-10);
      result=JSON.stringify(result);
      window.localStorage.setItem('searchHistorys',result);
    }

    // 清除历史列表
    this.setState({
      ...this.state,
      historyList:[],
    })
    
    let schoolTypes = [] ;
    let buildStatuss = [] ;
    let schoolPropertys = [] ;
    this.transformation(schoolTypes,buildStatuss,schoolPropertys)
    const {regionLabel,begin,finish} =this.state;
    console.log(regionLabel,begin)
    // 执行查询
    let data = this.props.dispatch({
      type:'House/getSchoolSearch',
      payload:{
        pageSize:8,
        pageNo:1,
        schoolName:value,//搜索框内容
        schoolType:schoolTypes.join(','),//已建学校类型
        buildStatus:buildStatuss.join(','),//建设状态
        schoolProperty:schoolPropertys.join(','),//已建学校性质
        county:regionLabel==='深圳市'?'深圳市':regionLabel.replace('区','').replace('新',''),//行政区
        // startDate:(begin===null ? begin : new Date(begin).getFullYear()),//建校开始时间
        // endTime:(finish===null ? finish : new Date(finish).getFullYear()),//建校结束时间
      }
    })
    let school_point
    viewer.dataSources._dataSources.map((itme,index)=>{
      if(itme._name==='school_point'){
        // school_point=itme
        itme.show = false
      }
    })
    // viewer.dataSources.remove(school_point);
  }

  //页码change回调
  onPageChange=(page)=>{
    const {schoolSearch:{pageNo,pageTotal}} = this.props.House;
    if(page=="pre"){
      page=pageNo-1;
    }else if(page=="next"){
      page=pageNo+1;
    }
    if(page<1 || page >pageTotal){
      return;
    }

    let schoolTypes = [] ;
    let buildStatuss = [] ;
    let schoolPropertys = [] ;
    this.transformation(schoolTypes,buildStatuss,schoolPropertys)
    const {regionLabel,begin,finish} =this.state;
    // 执行查询
    this.props.dispatch({
      type:'House/getSchoolSearch',
      payload:{
        pageSize:8,
        pageNo:page,
        schoolName:this.searchPanel.state.text,//搜索框内容
        schoolType:schoolTypes.join(','),//已建学校类型
        buildStatus:buildStatuss.join(','),//建设状态
        schoolProperty:schoolPropertys.join(','),//已建学校性质
        county:regionLabel==='深圳市'?'深圳市':regionLabel,//行政区
        // startDate:(begin===null ? begin : new Date(begin).getFullYear()),//建校开始时间
        // endTime:(finish===null ? finish : new Date(finish).getFullYear()),//建校结束时间
      }
    })
  }

  // 点击历史记录，回填搜索关键字
  clickSearch=(value)=>{
    this.searchPanel && this.searchPanel.searchIng(value);
  }

  //
  transformation=(schoolTypes,buildStatuss,schoolPropertys)=>{
    const {selectKey,schoolType,buildStatus,schoolProperty} =this.state;
    schoolType.map((itme,index)=>{
      if(selectKey.indexOf(itme)>-1){
        schoolTypes.push(index+1)
      }
    })
    buildStatus.map((itme,index)=>{
      if(selectKey.indexOf(itme)>-1){
        buildStatuss.push(index+1)
      }
    })
    schoolProperty.map((itme,index)=>{
      if(selectKey.indexOf(itme)>-1){
        schoolPropertys.push(index+1)
      }
    })
    return schoolTypes,buildStatuss,schoolPropertys
  }

  //点击搜索列表跳转
  schoolSearchClick=(properties)=>{
    this.highLight(properties.id);
    this.flyTo(properties);
    this.showFeature(properties);
  }
  
  removeFeature=()=>{
    if(this.mouseEntity){
      this.mouseEntity.pagemarker.billboard.image = this.mouseEntity.pagemarkerImage // viewer.dataSources.remove(this.mouseEntity);
    }
    this.mouseEntity=null;

  }

  showFeature=(item,type)=>{
    const {redicon,blueicon} =imageList
    var pagemarker;
    var pagemarkerImage;
    var inde ;
    this.AllParentMarker.map((entitys,index)=>{
      if(entitys.id==="Bat"+item.id){
        var cato = Cesium.Cartographic.fromDegrees(Number(item.xgeomPt),Number(item.ygeomPt));
        var height = viewer.scene.sampleHeight(cato);
        if(height<0){
          height=25;
        }
        // var height = viewer.scene.globe.getHeight(cato);
        pagemarker = viewer.entities.getById(entitys.id);
        pagemarker.position= Cesium.Cartesian3.fromDegrees(Number(item.xgeomPt),Number(item.ygeomPt),height);
        pagemarkerImage = pagemarker.billboard.image
        pagemarker.billboard.image=redicon[index] //`${PUBLIC_PATH}config/images/education/location_map.png`;
        inde = index
      }
    })
    if(type=="mouse"){
      this.removeFeature();
      this.mouseEntity={pagemarker,pagemarkerImage};
    }else{
      this.mouseEntity=null;
      this.removeExtraSource(pagemarker);
      this.mouseClickEntity={pagemarker,inde};
    }

  }

  highLight=(id)=>{
    this.setState({
      scrollToId:id || '',
    });
  }

  flyTo=(item)=>{
    var position = Cesium.Cartesian3.fromDegrees(item.xgeomPt,item.ygeomPt);
    let height=viewer.scene.sampleHeight(Cesium.Cartographic.fromCartesian(position)) || 5;
    if(height<50){
      height=50;
    }
   let center =Cesium.Cartesian3.fromDegrees(item.xgeomPt,item.ygeomPt);
    viewer.scene.camera.flyToBoundingSphere(new Cesium.BoundingSphere(center,height*2), {
      duration: 2
    });
  }


  removeExtraSource=(pagemarker)=>{
    const {redicon,blueicon} =imageList
    if(this.mouseClickEntity && pagemarker.id!==this.mouseClickEntity.pagemarker.id ){
      this.mouseClickEntity.pagemarker.billboard.image = blueicon[this.mouseClickEntity.inde] //`${PUBLIC_PATH}config/images/education/location_map@1x.png`;
    }
    this.mouseClickEntity=null;
  }

  //添加所有的地址标记  mark1.png
  addordinaryMarker=(dataList)=>{
    const {redicon,blueicon} =imageList
    this.removeAllbillboard();
    for(var i=0;i<dataList.length;i++){
      var marker = dataList[i];
      var cato = Cesium.Cartographic.fromDegrees(Number(marker.xgeomPt),Number(marker.ygeomPt));
      var height = viewer.scene.sampleHeight(cato);
      height = isNaN(height) ? (70+0.001*(i+1)) : (height +0.001*(i+1))
      if(height<0){
        height=0;
      }
      var entity = viewer.entities.add({  
          id:"Bat"+marker.id,            
          name: marker.schoolName,
          position: Cesium.Cartesian3.fromDegrees(Number(marker.xgeomPt),Number(marker.ygeomPt), height),
          billboard: {
              image: blueicon[i],//`${PUBLIC_PATH}config/images/education/location_map@1x.png`,
              scaleByDistance: new Cesium.NearFarScalar(1000, 1.0, 50000, 0.5),
              horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
              verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
              disableDepthTestDistance: Number.POSITIVE_INFINITY, //一直显示，不被地形等遮挡 
          },
          option:{
            latitude:marker.ygeomPt,
            longitude:marker.xgeomPt,
          },
          tooltip: `<span style='color:#ffffff;'>${marker.schoolName?marker.schoolName:marker.projectName?marker.projectName:"无学校名称"}</span>`,
      });
      this.AllParentMarker.push(entity);
    }
  }

  //删除列表里的
  removeAllbillboard=()=>{
    for(var i=0;i<this.AllParentMarker.length;i++){
      var entity = this.AllParentMarker[i];
      viewer.entities.remove(entity);
    } 
    this.AllParentMarker=[];
  }
  
  renderHistory=()=>{
    const {historyList,scrollToId} =this.state;
    const {schoolSearch} = this.props.House;
    if(historyList && historyList.length>0){
      return (
      <>
        <div className={styles.searchList}>
          <div className={styles.list}>
            {historyList && historyList.map((item,index) => {
              return <div className={styles.item} key={index} onClick={()=>this.clickSearch(item)}>
                  <span className={`iconfont icon_editbeifen ${styles.icon}`} />
                <span className={styles.name}>{item}</span></div>;
            })}
          </div>
          <div className={styles.close} onClick={()=>this.clearList()}>删除历史</div>
        </div>
      </>
      )
    }else if(schoolSearch && schoolSearch.list && schoolSearch.list.length !== 0 ){
      return (
        <>
          <div className={styles.searchList}>
            <div className={styles.list}>
              { schoolSearch.list.map((item,index) => {
                return <div className={(item.id===scrollToId)?styles.item+' '+styles.active:styles.item} key={index} onClick={() => this.schoolSearchClick(item)}
                  onMouseEnter={()=>this.showFeature(item,"mouse")} onMouseLeave={()=>this.removeFeature("mouse")} >
                    <div style={{'display':'flex'}}>
                      <div style={{'width':'24px','height':'48px','padding':'10px 0px','marginRight':'10px'}} >
                        <span className={(item.id===scrollToId)?styles.icons+' '+styles.actives:styles.icons} >{index+1}</span>
                      </div>
                      <div className={styles.schoolAddress}>
                        <span className={styles.name}>{item.schoolName?item.schoolName:item.projectName?item.projectName:"无学校名称"}</span><br/>
                        {item.schoolProperty ?<span style={{'marginRight':'10px'}} >已建</span>:''}
                        <span >{item.schoolType==='1'?
                        '幼儿园':item.schoolType==='2'?'小学':item.schoolType==='3'?'初中':item.schoolType==='4'?'高中':''}</span>
                      </div>
                    </div>
                    <div className={styles.schoolAddress} ><span >{item.schoolAddress?item.schoolAddress:'无地址记录'}</span></div>
                  </div>
              })}
            </div>
            {
              schoolSearch.total !== '' && schoolSearch.list.length!==0  && <div className={styles.pagination}>
                  <span className={styles.total}>{schoolSearch.pageNo}/{schoolSearch.pageTotal}页</span>
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
    }else if(schoolSearch && schoolSearch.list){
      return (
        <>
          <div className={styles.searchList} >
            <div className={styles.list} >
              <div className={styles.item} style={{'textAlign':'center'}} >
                  <span className={styles.tanHao}></span><span>无数据</span>
                </div>
            </div>
              
          </div>
        </>
      )
    }
    return null;
  }

  render() {
    const { type} = this.props;
    const { addCondition,selectKey,selectAllKey,begin,finish,secondNodeList,activeIds,activeNames,regionLabel} = this.state;
    return (
        <>
          <div className={`${styles.houseBox} `}>
            <SearchPanel placeholder="请输入学校搜索" onSearch={this.search} onChange={(value)=>this.onChange(value)} onFocus={this.onFocus} onRefs={node=>this.searchPanel=node} />
            <button className={`${styles.edCondition} ${(this.state.isAddTo === true ? styles.edConditionHover:'')} `} onClick={this.edAddTo} >+</button>
            {
              this.state.isAddTo === true && <EdAddTo onRef={this.onRef} edAddCondition={this} selectKey={selectKey} selectAllKey={selectAllKey} begin={begin} finish={finish} 
              secondNodeList={secondNodeList} activeIds={activeIds} activeNames={activeNames} regionLabel={regionLabel} />
            }
            {
            this.renderHistory()
            }
          </div>
      </>      
    );
  }
}

export default LeftHome
