import {listGj,
    fetchToken,shiplist } from '../service/fishing'

export default {
    namespace: 'Fishing',
    state: {
        token:'',
        shipData:null,
        
    },
    effects: {
        *initShip({ payload, callback }, { call, put, select }){
            const token = yield select(_=>_.Fishing.token)
            const response = yield call( shiplist,  {...payload,access_token:token});
            const {msg,code,page:data} = response
            if(msg === 'success' && code === 0){
                if(payload.flag == 0){
                    yield put({
                        type:'initShipData',
                        payload:data
                    })
                }
                return data
            }else{
                return null
            }
        },
        *getToken({ payload, callback }, { call, put }){
            const response = yield call( fetchToken,  payload);
            const {msg, code, token } = response
            if(msg === 'success' && code === 0){
                yield put({
                    type:'setToken',
                    payload:token
                })
            }
            return response
        },
        *shipmonitor({ payload, callback }, { call, put, select }){
            const token = yield select(_=>_.Fishing.token)
            const response = yield call( listGj,  {...payload,access_token:token});
            const {msg,code,list:data} = response
            if(msg === 'success' && code === 0){
                return data
            }else{
                return null
            }
        },
    },

    reducers: {
        setToken(state, action) {
            return {
                ...state,
                token: action.payload
            }
        },
        initShipData(state, action) {
            return {
                ...state,
                shipData: action.payload
            }
        },
    },
};
