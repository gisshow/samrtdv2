import { timelineSave, timelineList, timelineInfo, timelineUpdate, timelineDelete ,getMyResourceList } from '../service/timeline';

export default {
    namespace: 'Timeline',

    state: {
        timelineList:[],
        myResourceList:[],
    },

    effects: {
        *saveTimeline({ payload, callback }, { call, put }){
            const response = yield call( timelineSave,  payload);
            return response
        },
        *updateTimeline({ payload, callback }, { call, put }){
            const response = yield call( timelineUpdate,  payload);
            return response
        },
        *deleteTimeline({ payload, callback }, { call, put }){
            const response = yield call( timelineDelete,  payload);
            return response
        },
        *infoTimeline({ payload, callback }, { call, put }){
            const response = yield call( timelineInfo,  payload);
            return response
        },
        *listTimeline({ payload, callback }, { call, put }) {
            const response = yield call( timelineList,  payload);
            const { success, data } = response;
            if (success) {
                yield put({
                    type: 'setList',
                    payload:  data 
                });
            }
            return response
        },
        *myResourceList({payload, callback },{call, put}){
            const response = yield call( getMyResourceList,  payload);
            const { success, data } = response;
            if (success) {
                yield put({
                    type: 'setMyResourceList',
                    payload:  data 
                });
            }
            return response
        }

    },

    reducers: {
        setList(state, action) {
            return {
                ...state,
                timelineList: action.payload
            }
        },
        setMyResourceList(state, action) {
            return {
                ...state,
                myResourceList: action.payload
            }
        }
    },
};
