let positionDistrict = {
  '坪山区': [114.3766, 22.6816],
  '龙华区': [114.0266, 22.6557],
  '龙岗区': [114.2399, 22.6571],
  '光明区': [113.9251, 22.7657],
  '罗湖区': [114.1565, 22.5577],
  '盐田区': [114.2852, 22.5936],
  '宝安区': [113.8596, 22.6444],
  '南山区': [113.9729, 22.5601],
  '大鹏新区': [114.4772, 22.5909],
  '福田区': [114.0553, 22.5381],
  // '深汕特别合作区':[115.07436999654784, 22.876217285747806]
}

export default {
  namespace: 'LayerManager',
  state: {
    positionDistrict:positionDistrict,
    checkedKeys: [], //选中项
  },
  effects: {
    *getParcelList({payload}, { call, put }){
      // const response = yield call(_,payload);
      // const { success, data } = response;
      // if (success) {
      //   yield put({
      //     type: 'setLandList',
      //     payload: { data }
      //   });
      // }
    }
  },
  reducers: {
    setCheckedKeys(state, { payload }) {
      return {
        ...state,
        checkedKeys: payload
      };
    }
  }
}