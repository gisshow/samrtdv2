
import { getParcelStatistics,getLandStatisticsBySpace,getRegion,getBuildStatistics,getBuildStatisticsBySpace,getRoomStatistics,getRoomList,getParcelList,getParcelById,
  getBuildList,getBuildById,getPopulationStatistics,getPopulationSchoolStat,getLegalPersonStatistic,getSelectionSchoolStat,getLegalPersonStatisticBySpace,search,searchPrev,getHouseByBuildingId,
  getPOIStat,getRoomStatisticsBySpace,getPOIList,getPOITree,getPOITypes,getPopulationByHouseId,getSchoolSearch,getLandBySpace,getSchoolInfoByCode } from '../service/house'
import ClearableLabeledInput from 'antd/lib/input/ClearableLabeledInput';

const moduleName = 'House';


let defaultState = {
  landStatistic: undefined,//地的统计信息
  buildStatistic: undefined,//楼的统计信息
  perpetualBuildStatistic:undefined,//永久建筑
  unperpetualBuildStatistic:undefined,//非永久建筑
  roomStatistic:undefined,//房的统计信息
  populationStatistic:undefined,//人口统计信息
  populationSchoolStat:undefined,//学龄人口统计信息
  legalPersonStatistic:undefined,//法人统计信息
  regionData:[],//行政区
  parcelId:undefined,//地块id
  basicBldgId:undefined,//楼id用于查房
  basicHouseId:undefined,//基础房ID
  landList:[],//基础地列表数据
  buildList:[],//基础楼列表数据
  roomList:[],//基础房列表数据
  buildEntityHash:{},//楼实体
  jdName:'',
  quName:'',
  activeLandListId:'',//用于列表高亮的objectid
  activeBuildListId:'',//用于列表高亮的objectid
  activeRoomListId:'',//用于列表高亮的basicHouseId,主要与basicHouseId进行区分，正反
  selected:{
    feature:undefined,
    originalColor:undefined,
  },
  landWMS:undefined,//基础地WMS图层
  buildWMS:undefined,//基础楼WMS图层
  buildSpecialWMS:undefined,//特殊楼WMS图层
  tileset:undefined,//全市倾斜图层
  extraSource:undefined,//其他数据集，方便移除
  houseHoldModel:false,//分层分户模式,用于禁止列表点击
  bldgKey:undefined,//楼栋类型（永久/非永久建筑）1 永久 0 非永久
  bldgNo:undefined,//楼栋编码--查询楼实体详情
  parcelCod:undefined,//地块编码--查询地实体详情
  houseId:undefined,//房ID--查询房实体详情
  buildingId:undefined,//查询分层分户模型相关接口的楼栋ID/编码 WGB-asd-A,1对多

  bldgHeight:110,//默认楼栋的高度，用于设置分层分户模型的高度。后面将地楼房的所有属性都放在这里管理

  landQueryStatistic: undefined,//空间查询地的统计信息
  buildQueryStatistic: undefined,//空间查询楼的统计信息
  // queryParam:undefined,//空间查询楼的参数
  roomQueryStatistic:undefined,//框选房统计
  POIQueryStatistics:undefined,// 框选查询POI的统计信息
  populationQueryStatistic:undefined,//框选人口统计信息
  legalPersonQueryStatistic:undefined,//框选法人统计信息

  statType:{//子统计页面的类型
    isRenderSubStat:false,
    type:"",
    title:"",
    info:undefined,
  },

  detailType:{//详情页面类型
    isRenderDetail:false,
    type:"",
    title:"",
    info:{},
  },

  treeSelectedKeys:undefined,//树形结构选中的key,用于高亮选中的项

  searchList:[],
  schoolSearch:[],//教育专题学校搜索结果
  landSearch:[],//教育专题学校归属地块
  schoolInfo:[],//教育专题学校基本信息
  pickMode:true,//直接选取模式和行政区切换；默认为直接选取模式
  isPick:false,//是否支持点选

  houseIdsByHold:[],// 分层分户模型对应的房屋id列表,用于房列表的过滤
  housesByHold:[],//分层分户模型对应的房屋列表信息
  rightActiveKey:undefined,//地楼房专题右侧菜单栏

  spaceQueryParam:undefined,//空间查询的参数，用于tree无节点的查询

  POIList:{ //poi列表
    list:[],
    tree:[],
    pageNo: 0,
    pageSize: 0,
    pageTotal: 0,
    total: 0,
    geo:undefined,
    allList:[],
    isFrist:true
  },

  POITypes:undefined,//poi类型枚举

  populationList:[],//房屋内人口列表
  
  hasHold:false,//是否包含分层分户模型

  isShowMainStat:false,// 是否显示行政区统计

  isShowHouseHoldStat:false,//是否显示分层分户标识
  panoramicViewdataSource:{},//全景对象
  isShowHouseBox:false,//是否弹出左侧box

  selectObj:{//全局点选对象信息（仅包含道路、水系等）
    type:undefined,
    name:undefined,
    address:undefined,
    show:false,
  },
  detailHeightset:false, //点击房屋详情高度控制
  isOpenImgWindow:false, //图形是否开启控制 
};

export default {
  namespace: moduleName,
  state: {
    ...defaultState
  },
  effects: {
    *getParcelList({payload}, { call, put }){
      const response = yield call(getParcelList,payload);
      const { success, data=[]} = response;
      let result=[];
      if(data!==null){
        result=data;
      }
      if (success) {
        yield put({
          type: 'setLandList',
          payload: {data:result}
        });
      }
    },
    *getParcelById({payload}, { call, put }){
      const response = yield call(getParcelById,payload);
      const { success, data} = response;
      let result=[];
      if(data!==null){
        result.push(data);
      }
      if (success) {
        yield put({
          type: 'setLandList',
          payload: {data:result}
        });
      }
    },
    *getParcelStatistics({payload}, { call, put }){
      const response = yield call(getParcelStatistics,payload);
      const { success, data } = response;
      if (success) {
        yield put({
          type: 'setLandStatistic',
          payload: { data }
        });
      }
    },
    *getParcelStatisticsBySpace({payload}, { call, put }){
      const response = yield call(getLandStatisticsBySpace,payload);
      const { success, data } = response;
      if (success) {
        yield put({
          type: 'setLandQueryStatistic',
          payload: { data }
        });
      }
    },
    *getBuildList({payload}, { call, put }){
      const response = yield call(getBuildList,payload);
      const { success, data } = response;
      if (success) {
        let result=[];
        if(data!==null){
          result=data;
        }
        yield put({
          type: 'setBuildList',
          payload: { data:result }
        });
      }
    },
    *getBuildById({payload}, { call, put }){
      const response = yield call(getBuildById,payload);
      const { success, data } = response;
      if (success) {
        let result=[];
        if(data!==null){
          result.push(data);
        }
        yield put({
          type: 'setBuildList',
          payload: { data:result }
        });
      }
    },
    *getBuildStatistics({payload}, { call, put }){
      const response = yield call(getBuildStatistics,payload);
      const { success, data } = response;
      if (success) {
        yield put({
          type: 'setBuildStatistic',
          payload: { data }
        });
      }
    },
    *getPerpetualBuildStatistics({payload}, { call, put }){
      const response = yield call(getBuildStatistics,payload);
      const { success, data } = response;
      if (success) {
        yield put({
          type: 'setPerpetualBuildStatistic',
          payload: { data }
        });
      }
    },
    *getUnperpetualBuildStatistics({payload}, { call, put }){
      const response = yield call(getBuildStatistics,payload);
      const { success, data } = response;
      if (success) {
        yield put({
          type: 'setUnperpetualBuildStatistic',
          payload: { data }
        });
      }
    },
    *getBuildStatisticsBySpace({payload}, { call, put }){
      const response = yield call(getBuildStatisticsBySpace,payload);
      const { success, data } = response;
      if (success) {
        yield put({
          type: 'setBuildQueryStatistic',
          payload: { data }
        });
      }
    },
    *getPerpetualBuildStatisticsBySpace({payload}, { call, put }){
      const response = yield call(getBuildStatisticsBySpace,payload);
      const { success, data } = response;
      if (success) {
        yield put({
          type: 'setPerpetualBuildQueryStatistic',
          payload: { data }
        });
      }
    },
    *getUnperpetualBuildStatisticsBySpace({payload}, { call, put }){
      const response = yield call(getBuildStatisticsBySpace,payload);
      const { success, data } = response;
      if (success) {
        if(data.quantity){
          yield put({
            type: 'setUnperpetualBuildQueryStatistic',
            payload: { data }
          });
        }else{
          data.quantity={
            stat:null,
            sum:0
          };
          data.area={
            stat:null,
            sum:0
          };
          yield put({
            type: 'setUnperpetualBuildQueryStatistic',
            payload: { data }
          });
        }
      }
    },
    *getPOIStatisticsBySpace({payload}, { call, put }){
      const response = yield call(getPOIStat,payload);
      const { success, data } = response;
      if (success) {
        yield put({
          type: 'setPOIQueryStatistic',
          payload: { data }
        });
      }
    },
    *getRoomList({payload}, { call, put }){
      const response = yield call(getRoomList,payload);
      const { success, data } = response;
      if (success) {
        let result=[];
        if(data!==null){
          result=data;
        }
        yield put({
          type: 'setRoomList',
          payload: { data:result}
        });
      }
    },
    *getHouseIdsByHold({payload}, { call, put }){
      const response = yield call(getHouseByBuildingId,payload);
      const { success, data } = response;
      if (success) {
        let result=[];
        if(data.length!==0){
          result=data.map(item=>{
            return item.houseId
          });
        }

        yield put({
          type: 'setHouseIdsByHold',
          payload: result
        });
        yield put({
          type: 'setHousesByHold',
          payload: data
        });
        
      }
    },
    *getRoomStatistics({payload}, { call, put }){
      const response = yield call(getRoomStatistics,payload);
      const { success, data } = response;
      if (success) {
        yield put({
          type: 'setRoomStatistic',
          payload: { data }
        });
      }
    },
    *getRoomStatisticsBySpace({payload}, { call, put }){
      const response = yield call(getRoomStatisticsBySpace,payload);
      const { success, data } = response;
      if (success) {
        yield put({
          type: 'setRoomQueryStatistic',
          payload: { data }
        });
      }
    },
    *getRegion({payload}, { call, put }){
      const response = yield call(getRegion);
      const { success, data } = response;
      if (success) {
        yield put({
          type: 'setRegion',
          payload: { data }
        });
      }
    },
    *getPopulationStatistics({payload}, { call, put }){
      const response = yield call(getPopulationStatistics,payload);
      const { success, data } = response;
      if (success) {
        yield put({
          type: 'setPopulationStatistic',
          payload: { data }
        });
      }
    },
    *getPopulationSchoolStat({payload}, { call, put }){
      const response = yield call(getPopulationSchoolStat,payload);
      const { success, data } = response;
      if (success) {
        yield put({
          type: 'setPopulationSchoolStat',
          payload: { data }
        });
      }
    },
    *getLegalPersonStatistic({payload}, { call, put }){
      const response = yield call(getLegalPersonStatistic,payload);
      const { success, data } = response;
      if (success) {
        yield put({
          type: 'setLegalPersonStatistic',
          payload: { data }
        });
      }
    },
    *getPopulationStatisticsBySpace({payload}, { call, put }){
      const response = yield call(getPopulationStatistics,payload);
      const { success, data } = response;
      if (success) {
        yield put({
          type: 'setPopulationQueryStatistic',
          payload: { data }
        });
      }
    },
    *getLegalPersonStatisticBySpace({payload}, { call, put }){
      const response = yield call(getLegalPersonStatisticBySpace,payload);
      const { success, data } = response;
      if (success) {
        yield put({
          type: 'setLegalPersonQueryStatistic',
          payload: { data }
        });
      }
    },
    *getSelectionSchoolStat({payload}, { call, put }){
      const response = yield call(getSelectionSchoolStat,payload);
      const { success, data } = response;
      if (success) {
        yield put({
          type: 'setSelectionSchoolStat',
          payload: { data }
        });
      }
    },
    *getSearchPrevList({payload},{ call,put}){
      if(payload.keyword.length===0){
        yield put({
          type: 'setSearchList',
          payload: { data:[]}
        });
        return
      }
      const response = yield call(searchPrev,payload);
      const {success,data} = response;
      if (success) {
        yield put({
          type: 'setSearchList',
          payload: { data }
        });
      }
    },
    *getSearchList({payload},{ call,put}){
      if(payload.keyword.length===0){
        yield put({
          type: 'setSearchList',
          payload: { data:[]}
        });
        return
      }
      const response = yield call(search,payload);
      const {success,data} = response;
      if (success) {
        yield put({
          type: 'setSearchList',
          payload: { data }
        });
      }
    },
    *getPOIList({payload},{call,put}){
      if(payload.poiType === "other"){
         yield put({
          type: 'setPOIList',
          payload: { ...payload }
        });
        return 
      }else{
        const response = yield call(getPOIList,payload);
        const {success,data} = response;
        if (success) {
          yield put({
            type: 'setPOIList',
            payload: { ...payload,...data }
          });
        }
      }
    },
    *getPOITypes({payload},{ call,put}){
      const response = yield call(getPOITypes,payload);
      const {success,data} = response;
      const arrId = ["080000","090000","130000","140000","150000","110000","200000"]; 
      let otherData = {
        code: "other",
        codeParent: null,
        name: "其他",
        children:[]
      }
      let newData = [];
      for(let i = 0; i<data.length;i++){
        if(arrId.includes(data[i].code)){
          newData.push(data[i])
        }
      }
      newData.push(otherData)
      if (success) {
        yield put({
          type: 'setPOITypes',
          // payload: {data }
          payload: {newData }
        });
      }
    },
    *getPopulationList({payload},{ call,put}){
      const response = yield call(getPopulationByHouseId,payload);
      const {success,data} = response;
      if (success) {
        yield put({
          type: 'setPopulationList',
          payload: {data }
        });
      }
    },
    *getSchoolSearch({payload},{ call,put}){
      const response = yield call(getSchoolSearch,payload);
      const {success,data} = response;
      if (success) {
        yield put({
          type: 'setSchoolSearch',
          payload: { data }
        });
      }
    },
    *getLandBySpace({payload},{ call,put}){
      const response = yield call(getLandBySpace,payload);
      const {success,data} = response;
      if (success) {
        yield put({
          type: 'setLandBySpaceSearch',
          payload: { data }
        });
      }
    },
    *getSchoolInfoByCode({payload},{ call,put}){
      const response = yield call(getSchoolInfoByCode,payload);
      const {success,data} = response;
      if (success) {
        yield put({
          type: 'setSchoolInfoByCode',
          payload: { data }
        });
      }
    },

  },
  reducers: {
    setLandStatistic(state, { payload }) {
      return {
        ...state,
        landStatistic: {
          icon: 'icon_earth',
          title: '土地',
          name: '地块',
          time: '2020-11-25 17:45',
          chartData:payload.data
        }
      };
    },
    setBuildStatistic(state, { payload }) {
      return {
        ...state,
        buildStatistic: {
          icon: 'icon_building2',
          title: '楼宇',
          name: '楼',
          time: '2020-11-19 09:35',
          sum:payload.data.sum,
          chartData:payload.data
        }
      };
    },
    setPerpetualBuildStatistic(state, { payload }) {
      return {
        ...state,
        perpetualBuildStatistic: {
          icon: 'icon_building2',
          title: '永久建筑',
          name: '永久建筑',
          time: '2020-11-19 09:35',
          sum:payload.data.sum,
          chartData:payload.data
        }
      };
    },
    setUnperpetualBuildStatistic(state, { payload }) {
      return {
        ...state,
        unperpetualBuildStatistic: {
          icon: 'icon_building2',
          title: '非永久建筑',
          name: '非永久建筑',
          time: '2020-11-19 09:35',
          sum:payload.data.sum,
          chartData:payload.data
        }
      };
    },
    setPopulationStatistic(state, { payload }) {
      return {
        ...state,
        populationStatistic: {
          icon: 'icon_house',
          title: '人口',
          name: '人口',
          time: '2020-10-27 16:20',
          chartData:payload.data
        }
      };
    },
    setPopulationSchoolStat(state, { payload }) {
      return {
        ...state,
        populationSchoolStat: {
          icon: 'icon_schoolAge',
          title: '学龄人口',
          name: '学龄人口',
          time: '2020-10-27 16:20',
          chartData:payload.data
        }
      };
    },
    setLegalPersonStatistic(state, { payload }) {
      return {
        ...state,
        legalPersonStatistic: {
          icon: 'icon_house',
          title: '法人',
          name: '法人单位',
          time: '2020-10-11 16:20',
          chartData:payload.data
        }
      };
    },
    setPopulationQueryStatistic(state, { payload }) {
      return {
        ...state,
        populationQueryStatistic: {
          icon: 'icon_house',
          title: '人口',
          name: '人口',
          time: '2020-10-27 16:20',
          chartData:payload.data
        }
      };
    },
    setLegalPersonQueryStatistic(state, { payload }) {
      return {
        ...state,
        legalPersonQueryStatistic: {
          icon: 'icon_house',
          title: '法人',
          name: '法人单位',
          time: '2020-10-25 16:20',
          chartData:payload.data
        }
      };
    },
    setSelectionSchoolStat(state, { payload }) {
      return {
        ...state,
        selectionSchoolStat: {
          icon: 'icon_house',
          title: '学校',
          name: '学校类型',
          time: '2020-10-25 16:20',
          chartData:payload.data
        }
      };
    },
    setRoomStatistic(state, { payload }) {
      return {
        ...state,
        roomStatistic: {
          icon: 'icon_room',
          title: '房屋',
          name: '房屋',
          time: '2020-11-09 13:08',
          chartData:payload.data
        }
      };
    },
    setRoomQueryStatistic(state, { payload }) {
      return {
        ...state,
        roomQueryStatistic: {
          icon: 'icon_room',
          title: '房屋',
          name: '房屋',
          time: '2020-11-09 13:08',
          chartData:payload.data
        }
      };
    },
    setRegion(state, { payload }) {
      return {
        ...state,
        regionData:payload.data
      };
    },
    setLandList(state, { payload }) {
      return {
        ...state,
        landList:payload.data
      };
    },
    setBuildList(state, { payload }) {
      return {
        ...state,
        buildList:payload.data
      };
    },
    setRoomList(state, { payload }) {
      return {
        ...state,
        roomList:payload.data
      };
    },
    setJdName(state, { payload }) {
      return {
        ...state,
        jdName:payload
      };
    },
    setQuName(state, { payload }) {
      return {
        ...state,
        quName:payload
      };
    },
    setRegionName(state, { payload }) {
      return {
        ...state,
        jdName:payload.jdName,
        quName:payload.quName,
      };
    },
    setBasicHouseId(state, { payload }){
      return {
        ...state,
        basicHouseId:payload,
      };
    },
    setParcelId(state, { payload }) {
      return {
        ...state,
        parcelId:payload
      };
    },
    setBuildEntities(state, { payload }) {
      return {
        ...state,
        buildEntityHash:payload
      };
    },
    setActiveLandListId(state, { payload }) {
      return {
        ...state,
        activeLandListId:payload
      };
    },
    setActiveBuildListId(state, { payload }) {
      return {
        ...state,
        activeBuildListId:payload
      };
    },
    setActiveRoomListId(state, { payload }) {
      return {
        ...state,
        activeRoomListId:payload
      };
    },
    setBasicBldgId(state, { payload }) {
      return {
        ...state,
        basicBldgId:payload
      };
    },
    setBuildSpecialWMS(state, { payload }) {
      return {
        ...state,
        buildSpecialWMS:payload
      };
    },
    setBuildWMS(state, { payload }) {
      return {
        ...state,
        buildWMS:payload
      };
    },
    setLandWMS(state, { payload }) {
      return {
        ...state,
        landWMS:payload
      };
    },
    setTileset(state, { payload }) {
      return {
        ...state,
        tileset:payload
      };
    },


    setSelected(state,{payload}){
      return {
        ...state,
        selected:{
          feature:payload.feature,
          originalColor:payload.originalColor
        }
      };
    },
    setExtraSource(state,{payload}){
      return {
        ...state,
        extraSource:payload
      };
    },
    setHouseHoldModel(state,{payload}){
      return {
        ...state,
        houseHoldModel:payload
      };
    },
    setBldgKey(state,{payload}){
      return {
        ...state,
        bldgKey:payload
      };
    },
    setBldgNo(state,{payload}){
      return {
        ...state,
        bldgNo:payload
      };
    },
    setParcelCod(state,{payload}){
      return {
        ...state,
        parcelCod:payload
      };
    },
    setHouseId(state,{payload}){
      return {
        ...state,
        houseId:payload
      };
    },
    setDetailHeightset(state,{payload}){
      return {
        ...state,
        detailHeightset:payload
      };
    },
    setBuildingId(state,{payload}){
      return {
        ...state,
        buildingId:payload
      };
    },
    setBldgHeight(state,{payload}){
      return {
        ...state,
        bldgHeight:payload
      };
    },

    setLandQueryStatistic(state, { payload }) {
      return {
        ...state,
        landQueryStatistic: {
          icon: 'icon_earth',
          title: '地块',
          name: '地块',
          time: '2020-11-25 17:45',
          chartData:payload.data
        }
      };
    },
    setBuildQueryStatistic(state, { payload }) {
      return {
        ...state,
        buildQueryStatistic: {
          icon: 'icon_building2',
          title: '楼栋',
          name: '楼',
          time: '2020-11-19 09:35',
          chartData:payload.data
        },
        // queryParam:payload.payload
      };
    },
    setPerpetualBuildQueryStatistic(state, { payload }) {
      return {
        ...state,
        perpetualBuildStatistic: {
          icon: 'icon_building2',
          title: '永久建筑',
          name: '永久建筑',
          time: '2020-11-19 09:35',
          chartData:payload.data
        }
      };
    },
    setUnperpetualBuildQueryStatistic(state, { payload }) {
      return {
        ...state,
        unperpetualBuildStatistic: {
          icon: 'icon_building2',
          title: '非永久建筑',
          name: '非永久建筑',
          time: '2020-11-19 09:35',
          chartData:payload.data
        }
      };
    },
    setPOIQueryStatistic(state, { payload }) {
      return {
        ...state,
        POIQueryStatistics: {
          icon: 'icon_building2',
          title: 'POI',
          name: 'POI',
          time: '2020-11-06 21:12',
          chartData:payload.data
        }
      };
    },

    setStatType(state,{payload}){
      return {
        ...state,
        statType:{
          isRenderSubStat:payload.isRenderSubStat,
          type:payload.type,
          title:payload.title,
          info:payload.info,
        },
        isShowHouseBox:payload.isRenderSubStat?true:(payload.isShowHouseBox && state.isShowHouseBox),
        isShowMainStat:payload.isRenderSubStat?false:state.isShowMainStat,//默认关闭主统计页面
      }
    },

    setDetailType(state,{payload}){
      return {
        ...state,
        detailType:{
          isRenderDetail:payload.isRenderDetail,
          type:payload.type,
          title:payload.title,
          info:payload.info,
        },
        isShowHouseBox:payload.isRenderDetail?true:(payload.isShowHouseBox && state.isShowHouseBox),//是否展开左侧box
        isShowMainStat:payload.isRenderDetail?false:state.isShowMainStat,//默认关闭主统计页面
      }
    },
    setHouseBox(state,{payload}){
      return {
        ...state,
        isShowHouseBox:payload
        
      }
    },
    SetTreeSelectedKeys(state,{payload}){
      return {
        ...state,
        treeSelectedKeys:payload,
      }
    },
    setSearchList(state,{payload}){

      return {
        ...state,
        searchList:payload.data,
      }
    },

    setSchoolSearch(state,{payload}){
      return {
        ...state,
        schoolSearch:payload.data,
      }
    },
    setSchoolInfoByCode(state,{payload}){
      return {
        ...state,
        schoolInfo:payload.data,
      }
    },
    setLandBySpaceSearch(state,{payload}){
      return {
        ...state,
        landSearch:payload.data,
      }
    },
    setPickMode(state,{payload}){

      return {
        ...state,
        pickMode:payload,
      }
    },

    setIsPick(state,{payload}){
      return {
        ...state,
        isPick:payload,
      }
    },

    setHouseIdsByHold(state,{payload}){
      return {
        ...state,
        houseIdsByHold:payload,
      }
    },
    setHousesByHold(state,{payload}){
      return {
        ...state,
        housesByHold:payload,
      }
    },
    //默认只激活一个菜单
    setRightActiveKey(state,{payload}){
      return {
        ...state,
        rightActiveKey:payload,
      }
    },

    
    setSpaceQueryParam(state,{payload}){
      return {
        ...state,
        spaceQueryParam:payload,
      }
    },

    setPOIList(state,{payload}){
      if(payload.poiType === "other"){
        const arrId = ["080000","090000","130000","140000","150000","110000","200000"]; 
        const arr = state.POIList.allList;
        let list = [];
        for(let i=0;i<arr.length;i++){
          if(!arrId.includes(arr[i].codeLarge)){
            // arr[i].nameLarge="其他";
            list.push(arr[i])
          }else{
            continue;
          }
        }
        return {
          ...state,
          POIList:{
            list:[...list],
            pageNo: payload.pageNo,
            pageSize: payload.pageSize,
            pageTotal: payload.pageTotal,
            total: payload.total,
            geo:payload.geo,
            isFrist:false,
            allList:state.POIList.allList,
          },
        }
      }else{
        if(state.POIList.isFrist){
          return {
            ...state,
            POIList:{
              list:payload.list,
              pageNo: payload.pageNo,
              pageSize: payload.pageSize,
              pageTotal: payload.pageTotal,
              total: payload.total,
              geo:payload.geo,
              isFrist:false,
              allList:payload.list,
            },
          }
        }else{
          return {
            ...state,
            POIList:{
              list:payload.list,
              pageNo: payload.pageNo,
              pageSize: payload.pageSize,
              pageTotal: payload.pageTotal,
              total: payload.total,
              geo:payload.geo,
              isFrist:false,
              allList:state.POIList.allList,
            },
          }
        }
      }
    },
    setPOITree(state,{payload}){
      return {
        ...state,
        POITree:payload,
      }
    },
    setPOITypes(state,{payload}){
      return {
        ...state,
        POITypes:[{name:"所有类型"},...payload.newData]
        // POITypes:[{name:"所有类型"},...payload.data]
      }
    },

    setPopulationList(state,{payload}){
      return {
        ...state,
        populationList:payload.data
      }
    },

    setHasHold(state,{payload}){
      return {
        ...state,
        hasHold:payload
      }
    },
    setMainStat(state,{payload}){
      return {
        ...state,
        isShowMainStat:payload
      }
    },
    setHouseHoldStat(state,{payload}){
      return {
        ...state,
        isShowHouseHoldStat:payload
      }
    },
    savePanoramicViewdataSource(state,{payload}){
      return {
        ...state,
        panoramicViewdataSource:payload
      }
    },
    setSelectObj(state,{payload}){
      return {
        ...state,
        selectObj:{
          name:payload.name,
          address:payload.name,
          type:payload.type,
          show:payload.show,
        },
      }
    },
    setIsOpenImgWindow(state,{payload}){
      return {
        ...state,
        isOpenImgWindow:payload.isOpenImgWindow,
      }
    },
    clearAll(state,{payload}){
      return {
        ...state,
        landStatistic: undefined,//地的统计信息
        buildStatistic: undefined,//楼的统计信息
        perpetualBuildStatistic:undefined,//永久建筑
        unperpetualBuildStatistic:undefined,//非永久建筑
        roomStatistic:undefined,//房的统计信息
        populationStatistic:undefined,//人口的统计
        populationSchoolStat:undefined,//适龄人口统计信息
        legalPersonStatistic:undefined,//法人的统计
        regionData:[],//行政区
        parcelId:undefined,//地块id
        basicBldgId:undefined,//楼id用于查房
        landList:[],//基础地列表数据
        buildList:[],//基础楼列表数据
        roomList:[],//基础房列表数据
        buildEntityHash:{},//楼实体
        jdName:'',
        quName:'',
        activeLandListId:'',//用于列表高亮的objectid
        activeBuildListId:'',//用于列表高亮的objectid
        selected:{
          feature:undefined,
          originalColor:undefined,
        },
        landWMS:undefined,//基础地WMS图层
        buildWMS:undefined,//基础楼WMS图层
        buildSpecialWMS:undefined,//特殊楼WMS图层
        tileset:undefined,//全市倾斜图层
        extraSource:undefined,
        houseHoldModel:false,//分层分户模式,用于禁止列表点击
        bldgKey:undefined,//楼栋类型（永久/非永久建筑）1 永久 0 非永久
        bldgNo:undefined,//楼栋编码--查询楼实体详情
        parcelCod:undefined,
        houseId:undefined,
        buildingId:undefined,
        landQueryStatistic: undefined,//空间查询地的统计信息
        buildQueryStatistic: undefined,//空间查询楼的统计信息
        // queryParam:undefined,//空间查询楼的参数
        populationQueryStatistic:undefined,//框选人口统计信息
        legalPersonQueryStatistic:undefined,//框选法人统计信息
        POIQueryStatistics:undefined,// 框选查询POI的统计信息
        detailType:{//详情页面类型
          isRenderDetail:false,
          type:"",
          title:'',
          info:{},
        },
        statType:{//子统计页面的类型
          isRenderSubStat:false,
          type:"",
          title:"",
          info:undefined,
        },
        treeSelectedKeys:undefined,
        pickMode:false,
        isPick:true,
        rightActiveKey:undefined,//地楼房专题右侧菜单栏
        spaceQueryParam:undefined,
        houseIdsByHold:[],// 分层分户模型对应的房屋id列表,用于房列表的过滤
        housesByHold:[],//分层分户模型对应的房屋列表信息
        POIList:{ //poi列表
          list:[],
          pageNo: 0,
          pageSize: 0,
          pageTotal: 0,
          total: 0,
          geo:undefined,
          allList:[],
          isFrist:true
        },
        POITree:[],
        // POITypes:undefined,//poi类型枚举
  
        populationList:[],//房屋内人口列表
        hasHold:false,//是否包含分层分户模型
        isShowMainStat:false,// 是否显示行政区统计
        isShowHouseHoldStat:false,//是否显示分层分户标识
        panoramicViewdataSource:{},//全景对象
        isShowHouseBox:false,//是否弹出左侧box
        selectObj:{//全局点选对象信息（仅包含道路、水系等）
          type:undefined,
          name:undefined,
          address:undefined,
          show:false,
        },
        detailHeightset:false,
        schoolSearch:[],//教育专题学校搜索结果
        landSearch:[],//教育专题学校归属地块
        schoolInfo:[],//教育专题学校基本信息
        isOpenImgWindow:false, //图形是否开启控制 
      };
    }

  }
}
