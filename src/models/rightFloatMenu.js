export default {
  namespace: 'RightFloatMenu',

  state: {
    isLayerActive: false,
    isSearchActive: false,
    isFishingActive: false,
    isClickActive: false,
    isFrameQueryActive:false,
    isCountActive: false,
    isFlyActive: false,
    isBookMarkActive: false,
    isSpaceActive: false,
    isIndoorActive: false,
    isUndergroundActive: false,
    isVideoActive: false,
    isOceanActive:false,
    showMenu:true,
    scence:"all",
    isHomekeystop:false,
    isDistrictStatActive:false,
  },

  effects: {},

  reducers: {
    toggleMenu(state, action) {
      let data = {
        isLayerActive: false,
        isSearchActive: false,
        isClickActive: false,
        isFrameQueryActive:false,
        isCountActive: false,
        isFlyActive: false,
        isBookMarkActive: false,
        isSpaceActive: false,
        isDistrictStatActive:false,
      }
     
      let name = action.payload
      
      if (!state[name]) {
        data[name] = true
      }
      return {
        ...state,
        ...data,
      }
    },
    toggleLayerBtn(state,action){
      let data = {
        isIndoorActive: false,
        isVideoActive: false,
        isDantihuaActive:false,
        isUndergroundActive: false,
        isFishingActive:false,
        isOceanActive:false
      }
      let name = action.payload
      
      if (!state[name]) {
        data[name] = true
      }
      return {
        ...state,
        ...data,
      }
    },
    setLayer(state,action){
      const data = {...state}
      data[action.payload.key] = action.payload.value;
      return {
        ...state,
        ...data,
      }
    },
    showHide(state,action){
      return{
        ...state,
        showMenu:action.payload
      }
    },
    setisHomekeystop(state,action){
      return{
        ...state,
        isHomekeystop:action.payload
      }
    }
  },
};
