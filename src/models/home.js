export default {
  namespace: 'Home',

  state: {
    isShowNav: false,
    tabsActiveKey: ['ztts'],
    leftActiveKey: 'ztts',
    rightActiveKey: '',
    buildingInfo:null,
    PMindex:0,
    sampleLabel01:[],
    sampleLabel02:[],
    sampleLabel03:[]
  },

  effects: {},

  reducers: {
    toggleNav(state, action) {
      return {
        ...state,
        isShowNav: !state.isShowNav
      }
    },

    setActiveBannerKey(state,action)
    {
      let newKey =  action.payload
      return {
        ...state,
        leftActiveKey: newKey,
        rightActiveKey: ''
      }
    },

     
    setSampleLabe(state,action)
    {
      return {
        ...state,
        sampleLabel01: action.payload[0],
        sampleLabel01: action.payload[1],
        sampleLabel01: action.payload[2],
      }
    },



    setBuildingInfo(state,action){
      return {
        ...state,
        buildingInfo:action.payload
      }
    },
    setTabsActiveKey(state, action) {
   
      let tabsActiveKey = state.tabsActiveKey.slice()
      let leftActiveKey = state.leftActiveKey

      let index = tabsActiveKey.indexOf(action.payload)
      if (index > -1) {
        tabsActiveKey.splice(index, 1)
        leftActiveKey = action.payload === leftActiveKey ? '' : leftActiveKey
      } else {
        // tabsActiveKey = [...tabsActiveKey, action.payload]
        tabsActiveKey = [action.payload]
        leftActiveKey = action.payload
      }
      return {
        ...state,
        tabsActiveKey,
        leftActiveKey,
      }
    },
    setLeftActiveKey(state, action) {
      let newKey = action.payload === state.leftActiveKey ? '' : action.payload
      return {
        ...state,
        leftActiveKey: newKey,
        rightActiveKey: ''
      }
    },
    setRightActiveKey(state, action) {
     
      let newKey = action.payload === state.rightActiveKey ? '' : action.payload
      return {
        ...state,
        rightActiveKey: newKey
      }
    },
    setPMindex(state, action){
      //let index = action.payload === state.PMindex ? 0 : action.payload
      return {
        ...state,
        PMindex: action.payload
      }
    }
  },
};
