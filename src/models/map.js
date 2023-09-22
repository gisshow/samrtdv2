export default {
  namespace: 'Map',

  state: {//indoorroam
    toolsActiveKey: '',
    IndoorKey:'',
    IndoorID:'',
    depthTest:true,
    isexcavation:true,
    TilesList:[],
    startroller:false,
    marsBasemap:null,
  },

  effects: {},

  reducers: {
    setMarsBasemap(state,action){
      let s = action.payload
      return {
        ...state,
        marsBasemap:s
      }
    },
    cleanToolsKey(state, action) {
      return {
        ...state,
        toolsActiveKey: '',
      }
    },
    setToolsActiveKey(state, action) {
      let newKey = action.payload === state.toolsActiveKey ? '' : action.payload
      return {
        ...state,
        toolsActiveKey: newKey,
      }
    },
    setDepthTest(state, action) {
      let depth = action.payload === state.depthTest ? '' : action.payload
      return {
        ...state,
        depthTest: depth,
      }
    },
    setisExcavation(state, action){
      //let isexcavation = action.payload === state.isexcavation ? '' : action.payload
      return {
        ...state,
        isexcavation: action.payload ,
      }
    },
    setstartroller(state, action){
      let setstartroller = action.payload === state.setstartroller ? false : action.payload
      return {
        ...state,
        startroller: setstartroller,
      }
    },
    setIndoorKey(state, action){
      //let newKey = action.payload === state.IndoorKey ? '' : action.payload
      return {
        ...state,
        IndoorKey: action.payload,
      }
    },
    setIndoorID(state, action){
      return {
        ...state,
        IndoorID: action.payload,
      }
    }

  },
};
