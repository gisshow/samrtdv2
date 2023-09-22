import { request } from '@/utils/request';


/**通勤专题接口 */

//职住比统计
export async function getJobStat(param) {
  return request('/vb/geo/data/working-resident-population',{
    method: 'GET',
    params:param,
  })
}

//流动人口统计
export async function getFluidStat(param) {
  return request('/vb/geo/data/fluid-population',{
    method: 'GET',
    params:param,
  })
}


// 流动详情
export async function getFluidDetail(param) {
  return request('/vb/commute/fluidDetail',{
    method: 'GET',
    params:param,
  })
}

