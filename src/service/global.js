import { request } from '@/utils/request';
import qs from 'qs';
import axios from 'axios';
import { PUBLIC_PATH } from '@/utils/config'

export function getUserInfo() {
  return axios(`${PUBLIC_PATH}config/api/logged_user_info.json`,{
    method: 'GET',
  })
    // const token = localStorage.getItem('token');
    // return axios(`/om/auth/logged_in_user_info?_t=`+new Date().getTime(), {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    //   data: qs.stringify({ token }),
    // });
  }

  // 获取空间底板的key
export async function getBaseMapKey(param) {
  return request(`${PUBLIC_PATH}config/api/db_licensekey.json`,{
    method: 'GET',
  })
  // return request('/vb/diban/licensekey',{
  //   method: 'GET',
  //   params:param,
  // })
}

// 获取当前用户key
export function getUserLicenseKey() {
  return request(`${PUBLIC_PATH}config/api/om_licensekey.json`,{
    method: 'GET',
  })
  // const token =localStorage.getItem('token') ;
  // return axios(`/om/auth/my/licensekey`, {
  //   method: 'POST',
  //   data: { token : token }
  // });
}


//自定义图层子集保存至我的做工作台
export function saveCustom(param){
  return request('/portal/web/competenceFile/save',{
    method: 'POST',
    data:param,
  })
}