import { request } from '@/utils/request';
import { PUBLIC_PATH } from '@/utils/config'
export async function getTree() {
  return request('/vb/layers/tree')
}

export async function getHomeResources() {
  return request(`${PUBLIC_PATH}config/api/getTreeAndResource.json`,{
    method: 'GET',
  })
  // return request('/portal/web/gisDataobj/getTreeAndResource')
}

export async function getLayerDetail(id) {
  return request(`/portal/web/resource/detail/${id}`)
}
