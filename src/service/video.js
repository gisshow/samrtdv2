import { request } from '@/utils/request';


//视频列表接口
export async function getVideoList(param) { 
    return request('/datafusion/api/video/all', { 
        method: 'GET',
        params: param,
    })
}

//开启视频流
export async function startVideoStream(param){
    return request('/datafusion/api/video/getIp',{
        method: 'GET',
        params: param,
    })
}

//保流
export async function stayVideoStream(param){
    return request('/datafusion/api/video/touch',{
        method: 'GET',
        params: param,
    })
}