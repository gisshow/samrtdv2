import {getUserInfo} from '@/service/global';
import {menuAuths} from '@/utils/config';
function authsLogic(authorities){
    let btnAuthsMap = {};
    menuAuths.map(el=>{
        if(!el.children){
            btnAuthsMap[el.authsKey] = {};
            btnAuthsMap[el.key] = authorities.includes(el.auths[0]);
            btnAuthsMap[el.authsKey]['init'] = authorities.includes(el.auths[0]);
            if(el.btnAuths){
                Object.keys(el.btnAuths).map(key=>{
                    if(typeof el.btnAuths[key] == 'string'){
                        btnAuthsMap[el.authsKey][key] = authorities.includes(el.btnAuths[key]);
                    }else{
                        btnAuthsMap[el.authsKey][key] = {}
                        btnAuthsMap[el.authsKey][key]['init'] = authorities.includes(`${el.auths[0]}.${key}`);
                        Object.keys(el.btnAuths[key]).map(akeys=>{
                            btnAuthsMap[el.authsKey][key][akeys] =authorities.includes(el.btnAuths[key][akeys]); 
                        })
                    }
                })
            } 
        }
    })
    return btnAuthsMap;
}
export default {
    namespace: 'Global',
    state:{
        authorities:[],
        pageAuths:null
    },
    effects: {
        *getUserInfo({ payload }, { call, put, all }) {
            // 获取初始化用户信息
            const response = yield call(getUserInfo);
            const { status } = response;
            if(status < 200 || status > 300){

            }else{
                const {success,data} = response.data
                // 返回，正常构建
                if (success) {
                    if (data) {
                        const { ownedFuncPermissionList } = data;
                        // 后端通过返回null来表达未登录。。。
                        if (
                            !ownedFuncPermissionList ||
                            ownedFuncPermissionList.indexOf('VisualizationSys') === -1
                        ) {
                            // history.push(`${PAGE_URL_PREFIX}/unauthorized`);
                            // return false;
                        }
                        let authorities = [];
                        ownedFuncPermissionList.map(item => {
                            if (item.indexOf('VisualizationSys.') !== -1) {
                                authorities.push(item);
                            }
                        });
                        // console.log('权限初始化',authorities)
                        let pageAuths = authsLogic(authorities)
                        // console.log('pageAuths',pageAuths)
                        // 权限初始化
                        yield put({
                            type: 'upData',
                            payload: { authorities,pageAuths },
                        });
                    } else {
                        // history.push(`${PAGE_URL_PREFIX}/unauthorized`);
                        return false;
                    }
                } else {
                //   history.push(`${PAGE_URL_PREFIX}/unauthorized`);
                return false;
                }
            return true;
            }

            
          },
    },
    reducers:{
        upData(state, action) {
            return {
              ...state,
              ...action.payload,
            };
          },
    }
}