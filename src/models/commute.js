
import {getJobStat,getFluidStat,getFluidDetail} from '../service/commute'

const moduleName = 'Commute';


let defaultState = {
  jobStat: undefined,//职住比统计信息
  fluidStat: undefined,//流动人口统计信息
  fluidDetail:undefined,//流动人口详情
  regionItems:undefined,//用于存储行政区polygon
};

export default {
  namespace: moduleName,
  state: {
    ...defaultState
  },
  effects: {
    
    *getJobStat({payload}, { call, put }){
      const response = yield call(getJobStat,payload);
      const { success, data } = response;
      if (success) {
        yield put({
          type: 'setJobStat',
          payload: { data }
        });
      }
    },
    *getFluidStat({payload}, { call, put }){
      const response = yield call(getFluidStat,payload);
      const { success, data } = response;
      if (success) {
        yield put({
          type: 'setFluidStat',
          payload: { data }
        });
      }
    },

    *getFluidDetail({payload}, { call, put }){
      const response = yield call(getFluidDetail,payload);
      const { success, data } = response;
      if (success) {
        yield put({
          type: 'setFluidDetail',
          payload: { data }
        });
      }
    },
  },
  reducers: {
    setJobStat(state, { payload }) {
      return {
        ...state,
        jobStat: {
          title: '职住',
          chartData:payload.data
        }
      };
    },
    
    setFluidStat(state, { payload }) {
      return {
        ...state,
        fluidStat: {
          title: '流动',
          chartData:payload.data
        }
      };
    },
    setFluidDetail(state, { payload }) {
      return {
        ...state,
        fluidDetail:payload.data
      };
    },
    setRegionItems(state, { payload }) {
      return {
        ...state,
        regionItems:payload
      };
    },

    
    
    clearAll(state,{payload}){
      return {
        ...state,
        jobStat: undefined,
        fluidStat: undefined,
        fluidDetail:undefined,
        regionItems:undefined,
      };
    }

  }
}
