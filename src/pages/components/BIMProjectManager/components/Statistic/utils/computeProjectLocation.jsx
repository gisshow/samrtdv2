import { isCoordinateInFeatures } from '@/utils/bimProject';
/**
 * 根据经纬度计算行政区的名称
 * @param {number} options.longitude 经度
 * @param {number} options.latitude 纬度
 * @param {array} options.features geojson里的所有features
 * @returns 行政区的名称
 */
export function computeProjectLocation({ longitude, latitude, features }) {
  // 行政区边界 /puglic/config/api/shenzhen.geojson
  // 经纬度是否在行政区边界里
  const feature = isCoordinateInFeatures([longitude, latitude], features);
  if (feature === undefined) {
    return;
  }
  let name = feature.properties.Name;
  // '福田区'
  return name;
}
