import { request } from '@/utils/request';

let pass = 'e10adc3949ba59ab'
let word = 'be56e057f20f883e'

//token
export async function fetchToken(param){
    return request(`/ship/sys/login`,{
        method: 'post',
        data: {
            username:'kshpt',password:pass.concat(word)
        },
    })
}
export async function shiplist(param){
    return request(`/ship/yg/shipposition/list`,{
        method: 'GET',
        params: param,
    })
}
//获取船只轨迹
export async function listGj(param){
    return request(`/ship/yg/shipmonitor/locus`,{
        method: 'GET',
        params: param,
    })
}