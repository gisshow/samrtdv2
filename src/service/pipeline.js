import { request } from '@/utils/request';

//管网查询接口,等后台接口完成后调成调用方法
export async function getPineline(param) {
    return request('/portal/manager/basicHouseAttinf/list',{
      method: 'GET',
      params:param,
    })
  };
