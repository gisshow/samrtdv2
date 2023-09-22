/* global Cesium */
/* global viewer */
/* global mars3d */
/* global turf */
import { message } from 'antd';
import { getBaseMapKey } from '@/service/global';
//对象深拷贝
export const deepClone = obj => {
  let cloneObj = Array.isArray(obj) ? [] : {};
  for (let k in obj) {
    cloneObj[k] = typeof obj[k] === 'object' && obj[k] !== null ? deepClone(obj[k]) : obj[k];
  }
  return cloneObj;
};

//根据边界线计算，地表实际高度
export const computeSurfaceHeight = location => {
  let geo = JSON.parse(location);
  let polygon = undefined;
  if (geo.type === 'Polygon') {
    polygon = turf.polygon(geo.coordinates);
  } else if (geo.type === 'MultiPolygon') {
    polygon = turf.multiPolygon(geo.coordinates);
  }
  let bbox = turf.bbox(polygon);
  let points = turf.randomPoint(10, { bbox: bbox });
  // console.log(points);
  let features = points.features;
  let heights = [];
  for (let i = 0; i < features.length; i++) {
    const coordinates = features[i].geometry.coordinates;
    var position = Cesium.Cartesian3.fromDegrees(coordinates[0], coordinates[1]);
    let height = viewer.scene.sampleHeight(Cesium.Cartographic.fromCartesian(position));
    heights.push(height);
  }
  let surfaceHeight = Math.max(...heights);
  return surfaceHeight;
  // 1、根据多边形计算边界bbox（确保精度，判断点十分在多边形内）
  // 2、随机生成10个点，看效率
  // 3、遍历获取点位处的高度
};

// geojson坐标转框选坐标串
export const locationToPolygon = (location, distance) => {
  let geo = {};
  if (distance) {
    geo = locationToBuffer(location, distance);
  } else {
    geo = JSON.parse(location);
  }
  let coordinates = undefined;
  let polygons = [];
  if (geo.type === 'Polygon') {
    coordinates = geo.coordinates[0];
  } else if (geo.type === 'MultiPolygon') {
    coordinates = geo.coordinates[0][0];
  }
  for (let i = 0; i < coordinates.length; i++) {
    const point = coordinates[i];
    if (point) polygons.push(point[0] + ' ' + point[1]);
  }
  //闭合坐标串,判断是否需要闭合
  let firstPoint = coordinates[0];
  let lastPoint = coordinates[coordinates.length - 1];

  if (firstPoint[0] !== lastPoint[0] && firstPoint[1] !== lastPoint[1]) {
    polygons.push(firstPoint[0] + ' ' + firstPoint[1]);
  }
  return polygons.toString();
};

export const locationToBuffer = (location, distance) => {
  let geo = JSON.parse(location);
  let polygon = undefined;
  if (geo.type === 'Polygon') {
    polygon = turf.polygon(geo.coordinates);
  } else if (geo.type === 'MultiPolygon') {
    polygon = turf.multiPolygon(geo.coordinates);
  }
  let buffere = turf.buffer(polygon, distance || 100, { units: 'meters', steps: 64 });
  return buffere.geometry;
};

//geojosn坐标转笛卡尔坐标
export const coordinatesArrayToCartesianArray = coordinates => {
  var positions = new Array(coordinates.length);
  for (var i = 0; i < coordinates.length; i++) {
    var coord = coordinates[i];
    positions[i] = Cesium.Cartesian3.fromDegrees(coord[0], coord[1]);
  }
  return positions;
};

// 防抖
export const debounces = (func, delay) => {
  var timeouts = null;

  return function() {
    if (timeouts) {
      clearTimeout(timeouts);
    }
    timeouts = setTimeout(() => {
      func.apply(this, arguments);
    }, delay);
  };
};

// 随机guid
export const getGuidGenerator = (func, delay) => {
  var S4 = function() {
    return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
  };
  return S4() + S4() + '_' + S4();
};

export const getCesiumUrl = (url, needKey) => {
  // return url;
  return new Cesium.Resource({
    url: url,
    headers: needKey
      ? {
          'szvsud-license-key': window.localStorage.getItem('baseMapLicenseKey'),
        }
      : {},
    retryCallback: (resource, error) => {
      if (error) {
        if (error.statusCode === 401) {
          message.error('当前数据预览接口您无访问权限');
          // return  getBaseMapKey().then((mapkeyInfo)=>{
          //   // console.log(1111,mapkeyInfo)
          //   if(mapkeyInfo && mapkeyInfo.success){
          //     mapkeyInfo.data && window.localStorage.setItem('baseMapLicenseKey',mapkeyInfo.data);//更新key
          //     resource.headers["szvsud-license-key"]= mapkeyInfo.data;
          //     return true;
          //   }
          // })
          // .otherwise(()=>{
          //   return false;
          // })
        } else if (error.statusCode === 404) {
          message.error('当前数据预览接口已暂停服务或被删除');
        }
        return false;
        // else this.errorHandler('当前数据预览接口访问错误');
      }
      return false;
    },
    retryAttempts: 1,
  });
};

//获取url中的参数
export const getQueryString = name => {
  let reg = new RegExp('(^|&)' + name + '=([^&]*)(&|$)', 'i');
  let r = window.location.search.substr(1).match(reg);
  if (r != null) {
    return unescape(r[2]);
  }
  return null;
};

//location 参数校验方法
export const locationReplaceStr = a => {
  const locationStr = a
    .replace(/(<br[^>]*>||\s*)/g, '')
    .replace(/\&/g, '&amp;')
    .replace(/\"/g, '&quot;')
    .replace(/\'/g, '&#39;')
    .replace(/\</g, '&lt;')
    .replace(/\>/g, '&gt;');
  return locationStr;
};
