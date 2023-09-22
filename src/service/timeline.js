import { request } from '@/utils/request';
import { PUBLIC_PATH } from '@/utils/config'
// let data1 = await Ajax.get(`${PUBLIC_PATH}config/motherBoard.json`);
//list接口
export async function timelineList(param) {
    return request(`${PUBLIC_PATH}config/timelineList.json`, {
        method: 'GET',
        params: param,
    })
    // return request('/vb/time-seq', {
    //     method: 'GET',
    //     params: param,
    // })
}

//保存时序
export async function timelineSave(param) {
    return request('/vb/time-seq', {
        method: 'POST',
        data: param,
    })
}

//时序详情
export async function timelineInfo(param) {
    return request(`${PUBLIC_PATH}config/timelineInfo${param.id}.json`, {
        method: 'GET'
    })
    // return request(`/vb/time-seq/${param.id}`, {
    //     method: 'GET'
    // })
}

//修改时序
export async function timelineUpdate(param) {
    return request(`/vb/time-seq/${param.id}`, {
        method: 'PUT',
        data: param,
    })
}

//删除时序
export async function timelineDelete(param) {
    return request(`/vb/time-seq/${param.id}`, {
        method: 'DELETE',
        data: param,
    })
}

//获取我的资源列表
export async function getMyResourceList(param) {
    return request(`${PUBLIC_PATH}config/timelinResource.json`, {
        method: 'GET',
    })
    // return request(`/portal/web/gisDataobj/getMyResourceList`, {
    //     method: 'GET',
    // })
}