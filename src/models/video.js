import {getVideoList,startVideoStream,stayVideoStream } from '../service/video'

export default {
    namespace: 'Video',

    state: {
        videoList:[],

    },

    effects: {
        *videoStay({ payload, callback }, { call, put }){
            const response = yield call( stayVideoStream,  payload);
            return response
        },
        *videoStream({ payload, callback }, { call, put }){
            const response = yield call( startVideoStream,  payload);
            return response
        },
        *videoList({ payload, callback }, { call, put }) {
            const response = yield call( getVideoList,  payload);
            const { success, data } = response;
            if (success) {
                yield put({
                    type: 'setVideoList',
                    payload:  data.list 
                });
            }

            return response
        },
    },

    reducers: {
        setVideoList(state, action) {
            return {
                ...state,
                videoList: action.payload
            }
        }
    },
};
