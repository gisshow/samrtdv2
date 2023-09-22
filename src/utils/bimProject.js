/* global Cesium */
/* global mars3d */
/**
 * BIM项目
 */
import { getCesiumUrl } from '@/utils/index';
import axios from 'axios';
import { PUBLIC_PATH } from '@/utils/config';
import '@/utils/TilesetFlat';
const md5 = require('js-md5');
/**
 * 加载 3DTileset 数据 隐藏状态
 * @param {Cesium.Viewer||Cesium.CesiumWidget} viewer
 * @param {string} url
 * @param {number} offsetHeight
 * @param {Cesium.Matrix4} modelMatrix
 * @returns Cesium.Cesium3DTileset
 */
export function add3DTileset(viewer, url, offsetHeight, modelMatrix) {
  //url不存在 返回undefined
  let cesium3DTileset = undefined;
  if (url !== undefined && url !== '') {
    var cur3Dtiles = getModelByURL(viewer, url);
    if (cur3Dtiles) {
      cur3Dtiles.show = true;
      return cur3Dtiles;
    }
    cesium3DTileset = new Cesium.Cesium3DTileset({
      url: getCesiumUrl(url, true),
      show: true,
    });
    viewer.scene.primitives.add(cesium3DTileset);
    cesium3DTileset.readyPromise.then(tileset => {
      tileset.show = true;
      if (offsetHeight) {
        //调整高度
        let origin = tileset.boundingSphere.center;
        let cartographic = Cesium.Cartographic.fromCartesian(origin);
        let surface = Cesium.Cartesian3.fromRadians(
          cartographic.longitude,
          cartographic.latitude,
          0.0,
        );
        let offset = Cesium.Cartesian3.fromRadians(
          cartographic.longitude,
          cartographic.latitude,
          offsetHeight,
        );
        let translation = Cesium.Cartesian3.subtract(offset, surface, new Cesium.Cartesian3());
        tileset.modelMatrix = Cesium.Matrix4.fromTranslation(translation);
      }
      // tileset._root.transform = modelMatrix == undefined ? tileset._root.transform : modelMatrix; //暂时 模型位置正确后 必须删除
    });
  }
  return cesium3DTileset;
}
/**
 * 根据路径 获取模型
 * @param {Cesium.Viewer||Cesium.CesiumWidget} viewer
 * @param {string} url
 * @returns
 */
export function getModelByURL(viewer, url) {
  return viewer.scene.primitives._primitives.filter(function(primitive) {
    return primitive.url === url || primitive._url === url;
  })[0];
}
/**
 * 请求geojson
 * @param {string} geojsonPath geojson的地址
 * @returns Promise
 */
export async function getGeojsonPath(geojsonPath) {
  return new Promise(async function(resolve, reject) {
    if (geojsonPath === undefined) {
      return;
    }
    // .geojson和.json
    if (geojsonPath.endsWith('json') === false) {
      return;
    }
    console.log('请求Geojson', geojsonPath);
    try {
      const response = await axios({
        method: 'GET',
        url: geojsonPath,
      });
      try {
        const { data } = response;
        // console.log('geojson', data);
        resolve(data);
      } catch (error) {}
    } catch (error) {
      console.log('error', error);
      reject(error);
    }
  });
}
/**
 * 请求geojsonPath，并缓存数据
 * @param {string} geojsonPath
 * @returns
 */
export async function getGeojsonPathAndCached(geojsonPath) {
  if (window.BIMProject) {
    // 请求红线
    const project = window.BIMProject.getBIMProjectById(
      window.BIMProject.rootThis.state.project_detail_id,
    );
    if (project === undefined) {
      return;
    }
    if (project.geojsonPathData === undefined) {
      project.geojsonPathData = {};
    }
    let data;
    if (project.geojsonPathData[geojsonPath]) {
      data = project.geojsonPathData[geojsonPath];
    } else {
      data = await getGeojsonPath(geojsonPath);
      project.geojsonPathData[geojsonPath] = data;
    }
    // console.log('geojsonPathData', data);
    return data;
  }
}
/**
 * 压平倾斜模型：行政区的倾斜模型和指定的倾斜模型。
 */
export async function flatten({
  viewer,
  geojsonPath,
  flatHeight = 0,
  Flat3DTilesets,
  GeoJSONDataSources,
  tiltAddress,
  tiltScope,
}) {
  // 1. 先压平行政区的倾斜模型，再压平指定的倾斜模型。
  if (tiltAddress && tiltScope) {
    console.log('先压平行政区的倾斜模型，再压平指定的倾斜模型。');
    // 显示tiltScope范围
    // await BIMProjectUtility.addRedline(
    //   await BIMProjectUtility.getGeojsonPathAndCached(tiltScope),
    //   viewer,
    //   window.BIMProject.GeoJSONDataSources,
    // );
    await flat(viewer, tiltScope, Math.min(0, flatHeight), Flat3DTilesets, GeoJSONDataSources); // 先压平行政区的倾斜模型：使用指定倾斜模型的范围压平行政区的倾斜模型。
    await flatWithURL({
      viewer,
      geojsonPath,
      flatURL: tiltAddress,
      flatHeight,
      Flat3DTilesets,
    }); // 压平指定的倾斜模型：使用BIM模型的范围压平指定的倾斜模型。
    return;
  }
  // 2. 只压平行政区的倾斜模型
  console.log('只压平行政区的倾斜模型');
  await flat(viewer, geojsonPath, flatHeight, Flat3DTilesets, GeoJSONDataSources);
}
/**
 * 压平倾斜模型
 * @param {string} geojsonPath
 */
export async function flat(viewer, geojsonPath, flatheight, Flat3DTilesets) {
  if (Cesium.PolygonTexture) {
    return flatByPolygonTexture(viewer, geojsonPath, flatheight, Flat3DTilesets);
  }
  let flatpolygon = [];

  const data = await getGeojsonPathAndCached(geojsonPath);
  data.features[0].geometry.coordinates[0].map(function(item) {
    const [longitude, latitude, height] = item;
    flatpolygon.push(longitude, latitude);
  });

  // 从geojson里解析得到polygon
  if (flatpolygon.length === 0) {
    return;
  }
  console.log('flatpolygon', flatpolygon[0], flatpolygon.length);

  if (flatheight === undefined) {
    flatheight = 0;
  }
  console.log('flatHeight', flatheight);

  let positions = new Cesium.Cartesian3.fromDegreesArray(flatpolygon);

  // 计算区域的中心点
  let coordinates = [];
  let total = flatpolygon.length;
  for (let c = 0; c < total; c = c + 2) {
    coordinates.push({ lng: flatpolygon[c], lat: flatpolygon[c + 1] });
  }
  const coordinate = getCenterPoint(coordinates);
  console.log('区域中心点', coordinate);

  const flatURL = await getFlatURLByCoordinate(Object.values(coordinate));
  // TODO 压平区域跨行政区时
  await flatByURL(viewer, flatURL, positions, flatheight, Flat3DTilesets);
  // window.BIMProject.flatURLs.forEach(async function(flatURL) {
  //   flatByURL(viewer, flatURL, positions, flatheight, Flat3DTilesets);
  // });
}
/**
 * 压平flaturl指向的模型
 * @param {Cesium.Viewer||Cesium.CesiumWidget} viewer
 * @param {string} flaturl
 * @param {array} positions
 * @param {number} flatheight
 * @param {array} Flat3DTilesets 缓存压平的模型
 * @returns
 */
export async function flatByURL(viewer, flaturl, positions, flatheight, Flat3DTilesets) {
  // return; // 停用压平模型
  let tileset = getModelByURL(viewer, flaturl);
  if (tileset === undefined) {
    console.log('flat tileset', undefined);
    return;
  }
  console.log('压平', flaturl);
  // Unhandled Rejection (TypeError): Cannot read properties of undefined (reading 'editOffset')
  if (tileset._config === undefined) {
    tileset._config = {};
  }
  if (tileset._config.editOffset === undefined) {
    tileset._config.editOffset = { x: 0, y: 0 };
  }

  tileset.readyPromise.then(function(tileset) {
    // console.log('压平模型', {
    //   viewer,
    //   tileset,
    //   positions,
    //   flatHeight: 0,
    // });
    const flat = new mars3d.tiles.TilesFlat({
      viewer,
      tileset,
      positions,
      flatHeight: flatheight,
    });
    Flat3DTilesets.push(flat);
  });
}

/**
 * 判断点是否在多边形内部（边上显示为在外部）
 * @param {object} point 形如{x:0,y:0}
 * @param {array} points 每个元素都类似point
 * @returns
 */
export function isPointInPolygon(point, points) {
  var n = points.length;
  var nCross = 0;
  for (let i = 0; i < n; i++) {
    var p1 = points[i];
    var p2 = points[(i + 1) % n];
    // 求解 y=p.y 与 p1 p2 的交点
    // p1p2 与 y=p0.y平行
    if (p1.y === p2.y) continue;
    // 交点在p1p2延长线上
    if (point.y < Math.min(p1.y, p2.y)) continue;
    // 交点在p1p2延长线上
    if (point.y >= Math.max(p1.y, p2.y)) continue;
    // 求交点的 X 坐标
    var x = ((point.y - p1.y) * (p2.x - p1.x)) / (p2.y - p1.y) + p1.x;
    // 只统计单边交点
    if (x > point.x) nCross++;
  }
  return nCross % 2 === 1;
}
/**
 * 根据经纬度得到压平模型的URL
 * @param {array} coordinate [x,y]
 * @param {string} [options.geojson] 行政区域，feature.properties.Name为“光明区”
 * @param {object} [options.name_cn] 行政区所对应的拼音，“光明区”为“guangming”
 * @param {object} [options.name_urls] 行政区对应的模型URL，“guangming”对应“guangming/tileset.json”
 * @param {object} [options.name_cn_urls] 与 options.name_cn和options.name_urls对立，如果存在，则忽略他们，直接通过行政区来对应模型URL，“光明区”对应“guangming/tileset.json
 */
export async function getFlatURLByCoordinate(
  coordinate,
  {
    geojson = PUBLIC_PATH + 'config/api/shenzhen.geojson',
    name_urls = window.BIMProject.flatURLs || {
      longgang: 'http://10.253.102.69/gw/TILE_3D_MODEL/sz/longgang/tileset.json',
      futian: 'http://10.253.102.69/gw/TILE_3D_MODEL/sz/futian/tileset.json',
      nanshan: 'http://10.253.102.69/gw/TILE_3D_MODEL/sz/nanshan/tileset.json',
      longhua: 'http://10.253.102.69/gw/TILE_3D_MODEL/sz/longhua/tileset.json',
      baoan: 'http://10.253.102.69/gw/TILE_3D_MODEL/sz/baoan/tileset.json',
      luohu: 'http://10.253.102.69/gw/TILE_3D_MODEL/sz/luohu/tileset.json',
      pingshan: 'http://10.253.102.69/gw/TILE_3D_MODEL/sz/pingshan/tileset.json',
      yantian: 'http://10.253.102.69/gw/TILE_3D_MODEL/sz/yantian/tileset.json',
      dapeng: 'http://10.253.102.69/gw/TILE_3D_MODEL/sz/dapeng/tileset.json',
      guangming: 'http://10.253.102.69/gw/TILE_3D_MODEL/3D/QX_GM_UPDATE_0813/tileset.json',
    },
    name_cn = {
      坪山区: 'pingshan',
      龙华区: 'longhua',
      龙岗区: 'longgang',
      光明区: 'guangming',
      罗湖区: 'luohu',
      盐田区: 'yantian',
      宝安区: 'baoan',
      南山区: 'nanshan',
      大鹏新区: 'dapeng',
      福田区: 'futian',
      // 深汕特别合作区: [115.07436999654784, 22.876217285747806],
    },
    name_cn_urls,
  } = {},
) {
  const response = await axios(geojson);
  console.log('response', response);
  const { features } = response.data;
  const feature = await isCoordinateInFeatures(coordinate, features);
  if (feature === undefined) {
    console.log('根据红线计算不出要压平区域', isCoordinateInFeatures, coordinate, features);
    return;
  }
  let name = feature.properties.Name;
  if (name_cn_urls) {
    return name_cn_urls[name];
  } else {
    return name_urls[name_cn[name]];
  }
}
/**
 * 判断经纬度所属于的feature
 * 当每个feature是一个闭合的区域时，可以更准确地判断所属于的feature
 * @param {array} coordinate [x,y]
 * @param {object} features
 * @returns
 */
export function isCoordinateInFeatures(coordinate, features) {
  const [x, y] = coordinate;
  const _features = features.map(function(feature) {
    // 经纬度转{x:x,y:y}
    return feature.geometry.coordinates.map(function(coordinates) {
      return coordinates.map(function(coordinate) {
        const [x, y] = coordinate;
        return {
          x,
          y,
        };
      });
    });
  });
  // console.log('features', _features);
  // 一个行政区有多块区域
  const _index = _features.map(function(_feature) {
    return _feature.map(function(feature) {
      // 某个经纬度是否在区域内
      return isPointInPolygon(
        {
          x,
          y,
        },
        feature,
      );
    });
  });
  // console.log('index', _index);
  const index = _index
    .map(function(item) {
      return item.includes(true);
    })
    .indexOf(true);
  return features[index];
}

/**
 * 显示红线
 * @param {object} data geojson数据
 * @param {Cesium.Viewer} viewer
 * @param {array} GeoJSONDataSources
 */
export async function addRedline(data, viewer, GeoJSONDataSources) {
  // return;
  // polygon 转成 线
  const dataSource = await Cesium.GeoJsonDataSource.load(
    {
      type: 'FeatureCollection',
      layer: { id: data.layer && data.layer.id, name: '' },
      features: data.features.map(function(feature) {
        return {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: feature.geometry.coordinates[0].concat([
              feature.geometry.coordinates[0][0],
            ]),
          },
        };
      }),
    },
    {
      clampToGround: true,
      stroke: new Cesium.Color.fromCssColorString('red'),
    },
  );
  viewer.dataSources.add(dataSource);
  GeoJSONDataSources.push(dataSource); // 缓存
}
/**
 * 删除项目红线
 * @param {Cesium.Viewer} viewer
 */
export function destroyProjectRedline(viewer) {
  if (window.BIMProject) {
    console.log('移除红线', window.BIMProject.GeoJSONDataSources.length);
    window.BIMProject.GeoJSONDataSources.forEach(function(dataSource) {
      viewer.dataSources.remove(dataSource);
    });
    window.BIMProject.GeoJSONDataSources = [];
  }
}
/**
 * 添加项目红线
 * @param {Cesium.Viewer} viewer
 */
export async function addProjectRedline(viewer) {
  if (window.BIMProject) {
    // 请求红线
    const project = window.BIMProject.getBIMProjectById(
      window.BIMProject.rootThis.state.project_detail_id,
    );
    if (project === undefined) {
      return;
    }
    const { geojsonPath } = project;
    if (geojsonPath === null) {
      return;
    }
    if (geojsonPath === undefined) {
      return;
    }
    const data = await getGeojsonPathAndCached(geojsonPath);
    await addRedline(data, viewer, window.BIMProject.GeoJSONDataSources);
  }
}
/**
 * 地点坐标计算中心点
 * @param geoCoordinateList {Array<Array<Object>>} [[{lat, lng}]]
 * @return { Object } {lat lng}
 * ————————————————
 * 版权声明：本文为CSDN博主「Faith-J」的原创文章，遵循CC 4.0 BY-SA版权协议，转载请附上原文出处链接及本声明。
 * 原文链接：https://blog.csdn.net/JCM_ZZ/article/details/119541749
 */
export function getCenterPoint(geoCoordinateList) {
  const geoCoordinateListFlat = geoCoordinateList.reduce((s, v) => {
    return (s = s.concat(v));
  }, []);
  const total = geoCoordinateListFlat.length;
  let X = 0;
  let Y = 0;
  let Z = 0;
  for (const g of geoCoordinateListFlat) {
    const lat = (g.lat * Math.PI) / 180;
    const lon = (g.lng * Math.PI) / 180;
    const x = Math.cos(lat) * Math.cos(lon);
    const y = Math.cos(lat) * Math.sin(lon);
    const z = Math.sin(lat);
    X += x;
    Y += y;
    Z += z;
  }

  X = X / total;
  Y = Y / total;
  Z = Z / total;
  const Lon = Math.atan2(Y, X);
  const Hyp = Math.sqrt(X * X + Y * Y);
  const Lat = Math.atan2(Z, Hyp);

  return { lng: (Lon * 180) / Math.PI, lat: (Lat * 180) / Math.PI };
}
/**
 * 从geojson数据里得到中心点的经纬度
 * @param {object} geojson
 * @returns
 */
export function getCenterPointFromGeojson(geojson) {
  return getCenterPoint(
    geojson.features
      .map(function({ geometry }) {
        return geometry.coordinates.map(function(coordinates) {
          return coordinates.map(function([longitude, latitude, height]) {
            return { lng: longitude, lat: latitude };
          });
        });
      })
      .flat(),
  );
}
/**
 * 从geojson里解析出压平区域
 * @params {object} geojson 形如：{"type":"FeatureCollection","layer":{"id":"M-9F09501E-C805-4208-8253-23594197BB42","name":""},"features":[{"type":"Feature","properties":{"id":"M-FA6B986F-D7C2-4980-B85B-43C713BF2C87","name":"","type":"polygon","style":{"color":"#3388ff","opacity":0.5,"outline":true,"outlineColor":"#ffffff","outlineWidth":2,"clampToGround":false,"materialType":"Color"},"edittype":"polygon"},"geometry":{"type":"Polygon","coordinates":[[[114.202274,22.68624,1.8],[114.202205,22.686322,0.4],[114.202162,22.686444,6.9],[114.202218,22.686472,0.8],[114.202175,22.686583,2.6],[114.202108,22.686693,0],[114.202046,22.68673,0],[114.202021,22.68679,0],[114.201966,22.686873,0],[114.201866,22.686921,0.2],[114.20182,22.686965,0],[114.201809,22.687016,0],[114.201767,22.687236,4.9],[114.201824,22.687261,9.8],[114.20185,22.687122,0],[114.20199,22.687055,0],[114.201947,22.687176,4.4],[114.201918,22.687255,0],[114.201833,22.687501,0],[114.201667,22.687825,0.9],[114.201362,22.687833,0],[114.201318,22.687717,0],[114.201357,22.687599,0.2],[114.201238,22.687548,0],[114.201115,22.687552,0.4],[114.201128,22.68769,0],[114.201012,22.687861,0],[114.200889,22.688017,4.5],[114.200667,22.688208,0],[114.200378,22.688332,0],[114.200194,22.688389,0],[114.200034,22.688335,0],[114.199704,22.688102,3.9],[114.199628,22.687974,0],[114.199517,22.688032,4.8],[114.199064,22.687904,0],[114.198981,22.687544,0],[114.198965,22.686974,0],[114.198975,22.686758,0.1],[114.199392,22.686739,0],[114.199986,22.686804,2.9],[114.200102,22.686772,2.8],[114.200174,22.686695,3],[114.20096,22.685371,0],[114.201189,22.685466,0],[114.201596,22.685689,1.4],[114.202303,22.686055,1.3],[114.202371,22.686134,1.5],[114.202335,22.686227,0]]]}}]}
 * @returns 形如：
 * [Cartesian3 {x: -2413675.6237268583, y: 5370101.792080898, z: 2444698.822888714}]
 */
export function getPositionsFromGeojson(geojson) {
  return geojson.features
    .map(function({ geometry }) {
      return geometry.coordinates
        .map(function(coordinates) {
          return coordinates
            .map(function(coordinate) {
              return Cesium.Cartesian3.fromDegrees.apply(null, coordinate);
            })
            .flat();
        })
        .flat();
    })
    .flat();
}
/**
 * 限高分析类
 * @param {string} options.color 颜色
 * @param {number} options.height 限高
 * @param {number} options.bottomHeight 模型地面的海拔高度（单位：米）
 * @param {Array} options.positions
 * @param {string} options.bottomColor 底部盒子的颜色
 * @example 模型距离地面32米，超高80米的模型显示为红色
viewer.scene.primitives.add(
  new LimitHeight({
    color: "rgba(255,0,0,0.5)",
    height: 80, // 限高
    bottomHeight: 32, // 模型地面的海拔高度（单位：米）
    positions: [
      [117.210446, 31.829032, 0],
      [117.226334, 31.826662, 0],      
      [117.226694, 31.807882, 0],
      [117.209776, 31.808359, 0],
      [117.209778, 31.808341, 0],
    ],
  })
);
 */
export class LimitHeight {
  constructor(options) {
    const { color, height, bottomHeight, positions, bottomColor } = options;
    Object.assign(this, options);
    Object.assign(this, { options });
    this.primitives = [
      this.createPrimitive({ color: bottomColor, height, bottomHeight, positions }),
      this.createClassificationPrimitive({ color, height, bottomHeight, positions }),
    ];
  }
  /**
   * 删除控高分析
   */
  destroy() {
    this.primitives.forEach(function(primitive) {
      const primitives = Object.values(primitive._external._composites)[0].collection;
      primitives.remove(primitive);
      primitive.destroy();
    });
    this.primitives.length = 0;
    const $this = this;
    Object.keys($this).forEach(function(key) {
      delete $this[key];
    });
  }
  /**
   * 添加到场景里
   * @param {Cesium.Viewer} viewer
   */
  addTo(viewer) {
    this.primitives.forEach(function(primitive) {
      viewer.scene.primitives.add(primitive);
    });
  }
  /**
   * 单体化模型
   * @param {string} options.color 颜色
   * @param {number} options.height 限高
   * @param {number} options.bottomHeight 模型地面的海拔高度（单位：米）
   * @param {Array} options.positions
   * @returns
   */
  createClassificationPrimitive({ color, height, bottomHeight, positions }) {
    return new Cesium.ClassificationPrimitive({
      allowPicking: false,
      asynchronous: false,
      classificationType: Cesium.ClassificationType.CESIUM_3D_TILE,
      geometryInstances: new Cesium.GeometryInstance({
        attributes: {
          color: Cesium.ColorGeometryInstanceAttribute.fromColor(
            Cesium.Color.fromCssColorString(color),
          ),
        },
        geometry: new Cesium.PolygonGeometry({
          height: height + bottomHeight, // 距离地面的高度 + 限高，即多边形平面离地面的高度
          extrudedHeight: Cesium.Ellipsoid.WGS84.radii.x, // 地球的半径
          polygonHierarchy: new Cesium.PolygonHierarchy(
            Cesium.Cartesian3.fromDegreesArray(
              positions
                .map(function(item) {
                  return item.slice(0, 2);
                })
                .flat(),
            ),
          ),
        }),
      }),
    });
  }
  /**
   * 创建多边形盒子
   * @param {string} options.color 颜色
   * @param {number} options.height 限高
   * @param {number} options.bottomHeight 模型地面的海拔高度（单位：米）
   * @param {Array} options.positions
   * @returns
   */

  createPrimitive({ color, height, bottomHeight, positions }) {
    return new Cesium.Primitive({
      allowPicking: false,
      asynchronous: false,
      appearance: new Cesium.PerInstanceColorAppearance(),
      geometryInstances: new Cesium.GeometryInstance({
        attributes: {
          color: Cesium.ColorGeometryInstanceAttribute.fromColor(
            Cesium.Color.fromCssColorString(color),
          ),
        },
        geometry: new Cesium.PolygonGeometry({
          height: bottomHeight, // 多边形平面离地面的高度
          extrudedHeight: bottomHeight + height, // 多边形顶部离地面的高度
          polygonHierarchy: new Cesium.PolygonHierarchy(
            Cesium.Cartesian3.fromDegreesArray(
              positions
                .map(function(item) {
                  return item.slice(0, 2);
                })
                .flat(),
            ),
          ),
        }),
      }),
    });
  }
}
/**
 * 删除项目的控高分析
 */
export function destoryProjectLimitHeight() {
  if (window.BIMProject) {
    const project = window.BIMProject.getBIMProjectById(
      window.BIMProject.rootThis.state.project_detail_id,
    );
    if (project === undefined) {
      return;
    }
    const { limitHeight } = project;
    if (limitHeight === undefined) {
      return;
    }
    limitHeight.destroy();
  }
}
/**
 * 给项目添加控高分析
 * @param {Cesium.Viewer} viewer
 * @returns
 */
export async function addProjectLimitHeight(viewer) {
  if (window.BIMProject) {
    // 请求红线
    const project = window.BIMProject.getBIMProjectById(
      window.BIMProject.rootThis.state.project_detail_id,
    );
    if (project === undefined) {
      return;
    }
    const { geojsonPath, height, controlHeight } = project;
    if (controlHeight === null) {
      return;
    }
    if (controlHeight === undefined) {
      return;
    }
    let data = await getGeojsonPathAndCached(geojsonPath);
    console.log('geojsonPathData', data);
    // 控高分析
    project.limitHeight = []; // 所有控高分析
    project.limitHeight.destroy = function() {
      project.limitHeight.forEach(function(item) {
        item.destroy();
      });
      project.limitHeight.length = 0;
      delete project.limitHeight;
    };
    data.features
      .map(function(feature) {
        return feature.geometry.coordinates[0];
      })
      .forEach(function(positions) {
        console.log('控高分析', positions.length);
        const limitHeight = new LimitHeight({
          color: 'rgba(255,0,0,0.5)',
          height: controlHeight, // 限高
          bottomHeight: height, // 模型地面的海拔高度（单位：米）
          positions,
          bottomColor: 'rgba(0,255,0,0.5)',
        });
        limitHeight.addTo(viewer);
        project.limitHeight.push(limitHeight); // 缓存
      });
  }
}
/**
 * 根据项目名称生成对应的md5值，因为项目名称是唯一的。
 * @param {string} projectName
 * @returns 形如 'f85c55e2aa2fa82b9cc29784151e977c'
 */
export function getProjectID(projectName) {
  return md5(projectName);
}
/**
 * 使用Cesium.CustomShader来压平模型
 */
export async function flatByCustomShader(viewer, geojsonPath, flatHeight, Flat3DTilesets) {
  const geojson = await getGeojsonPathAndCached(geojsonPath);
  const flatURL = await getFlatURLByCoordinate(Object.values(getCenterPointFromGeojson(geojson)));
  console.log('flatURL', flatURL);

  let tileset = getModelByURL(viewer, flatURL);
  if (tileset === undefined) {
    console.log('flat tileset', undefined);
    return;
  }
  const { TilesetFlat } = Cesium;
  TilesetFlat.applyFlat({
    tileset,
    flatHeight,
    polygons: TilesetFlat.getPolygonsFromGeojson(geojson),
  });
  // 所有压平的模型，便于删除。
  if (Flat3DTilesets) {
    Flat3DTilesets.push({
      destroy: function() {
        TilesetFlat.removeAllFlat(tileset);
      },
    });
  }
}
/**
 * 使用Cesium.PolygonTexture
 */
export async function flatByPolygonTexture(viewer, geojsonPath, flatHeight, Flat3DTilesets) {
  console.log('geojsonPath', geojsonPath);
  const geojson = await getGeojsonPathAndCached(geojsonPath);
  const coordinate = Object.values(getCenterPointFromGeojson(geojson));
  console.log('coordinate', coordinate);
  const flatURL = await getFlatURLByCoordinate(coordinate);
  console.log('flatURL', flatURL);

  await flatByPolygonTextureURL({
    viewer,
    geojsonPath,
    flatURL,
    flatHeight,
    Flat3DTilesets,
  });
}
/**
 * 使用压平范围geojsonPath来压平flatURL所对应的模型
 */
export async function flatWithURL({ viewer, geojsonPath, flatURL, flatHeight, Flat3DTilesets }) {
  if (Cesium.PolygonTexture) {
    return await flatByPolygonTextureURL({
      viewer,
      geojsonPath,
      flatURL,
      flatHeight,
      Flat3DTilesets,
    });
  }
}
/**
 * 使用Cesium.PolygonTexture和压平URL
 */
export async function flatByPolygonTextureURL({
  viewer,
  geojsonPath,
  flatURL,
  flatHeight,
  Flat3DTilesets,
}) {
  const geojson = await getGeojsonPathAndCached(geojsonPath);
  console.log('flatURL', flatURL);

  let tileset = getModelByURL(viewer, flatURL);
  if (tileset === undefined) {
    console.log('flat tileset', undefined);
    return;
  }
  const polygonTextureFlat = new PolygonTextureFlat({ viewer });
  polygonTextureFlat.applyFlat({
    tileset,
    flatHeight,
    polygons: getPolygonsFromGeojson(geojson),
  });
  // 所有压平的模型，便于删除。
  if (Flat3DTilesets) {
    Flat3DTilesets.push({
      destroy: function() {
        polygonTextureFlat.destroy({ tileset });
      },
    });
  }
}
/**
 * 使用Cesium.PolygonTexture来给tileset添加压平及移除压平效果
 */
export class PolygonTextureFlat {
  constructor({ viewer }) {
    const { PolygonTexture } = Cesium;
    this.polygonTexture = new PolygonTexture({ viewer: viewer });
  }
  applyFlat({ tileset, flatHeight, polygons }) {
    tileset.flattenedPolygonTexture = this.polygonTexture;
    polygons.forEach(function(polygon) {
      const _polygon = polygon.map(function([longitude, latitude, height]) {
        return new Cesium.Cartesian3.fromDegrees(longitude, latitude, flatHeight);
      });
      tileset.flattenedPolygonTexture.addPolygonFromPositions(_polygon, {
        material: Cesium.Color.ORANGE.withAlpha(0),
        outlineColor: Cesium.Color.ORANGE.withAlpha(0),
        fill: false,
      });
    });
  }
  destroy({ tileset }) {
    this.polygonTexture.destroy();
    if (tileset.flattenedPolygonTexture) {
      tileset.flattenedPolygonTexture.destroy();
      tileset.flattenedPolygonTexture = null;
    }
  }
}
/**
 * 项目标签
 * @param {object} BIMProject 存储BIM项目的数据
 * @param {Cesium.CesiumViewer}
 * @param {number} nearDistance 距离多近时隐藏标签
 */
export function labelShowHideListener(BIMProject, viewer, nearDistance) {
  if (BIMProject === undefined) {
    return;
  }
  const { project_detail_id } = BIMProject.rootThis.state;
  if (project_detail_id === undefined) {
    return;
  }
  if (project_detail_id === null) {
    return;
  }
  const project = BIMProject.getBIMProjectById(project_detail_id);
  const distance = getSpaceDistance([viewer.camera.position, project.label.position]);
  // console.log('distance', distance);
  if (distance <= nearDistance) {
    Object.values(BIMProject.projects).forEach(function(project) {
      if (project.label === undefined) {
        return;
      }
      project.label.visible = false;
    });
  } else {
    Object.values(BIMProject.projects).forEach(function(project) {
      if (project.label === undefined) {
        return;
      }
      project.label.visible = true;
    });
  }
}
// 版权声明：本文为CSDN博主「Alice爱俪丝」的原创文章，遵循CC 4.0 BY-SA版权协议，转载请附上原文出处链接及本声明。
// 原文链接：https://blog.csdn.net/qq_18144905/article/details/81938405
//空间两点距离计算函数
export function getSpaceDistance(positions) {
  var distance = 0;
  for (var i = 0; i < positions.length - 1; i++) {
    var point1cartographic = Cesium.Cartographic.fromCartesian(positions[i]);
    var point2cartographic = Cesium.Cartographic.fromCartesian(positions[i + 1]);
    /**根据经纬度计算出距离**/
    var geodesic = new Cesium.EllipsoidGeodesic();
    geodesic.setEndPoints(point1cartographic, point2cartographic);
    var s = geodesic.surfaceDistance;
    //console.log(Math.sqrt(Math.pow(distance, 2) + Math.pow(endheight, 2)));
    //返回两点之间的距离
    s = Math.sqrt(
      Math.pow(s, 2) + Math.pow(point2cartographic.height - point1cartographic.height, 2),
    );
    distance = distance + s;
  }
  return distance.toFixed(2);
}
/**
 * 从geojson里解析出压平区域
 * @params {object} geojson 形如：{"type":"FeatureCollection","layer":{"id":"M-9F09501E-C805-4208-8253-23594197BB42","name":""},"features":[{"type":"Feature","properties":{"id":"M-FA6B986F-D7C2-4980-B85B-43C713BF2C87","name":"","type":"polygon","style":{"color":"#3388ff","opacity":0.5,"outline":true,"outlineColor":"#ffffff","outlineWidth":2,"clampToGround":false,"materialType":"Color"},"edittype":"polygon"},"geometry":{"type":"Polygon","coordinates":[[[114.202274,22.68624,1.8],[114.202205,22.686322,0.4],[114.202162,22.686444,6.9],[114.202218,22.686472,0.8],[114.202175,22.686583,2.6],[114.202108,22.686693,0],[114.202046,22.68673,0],[114.202021,22.68679,0],[114.201966,22.686873,0],[114.201866,22.686921,0.2],[114.20182,22.686965,0],[114.201809,22.687016,0],[114.201767,22.687236,4.9],[114.201824,22.687261,9.8],[114.20185,22.687122,0],[114.20199,22.687055,0],[114.201947,22.687176,4.4],[114.201918,22.687255,0],[114.201833,22.687501,0],[114.201667,22.687825,0.9],[114.201362,22.687833,0],[114.201318,22.687717,0],[114.201357,22.687599,0.2],[114.201238,22.687548,0],[114.201115,22.687552,0.4],[114.201128,22.68769,0],[114.201012,22.687861,0],[114.200889,22.688017,4.5],[114.200667,22.688208,0],[114.200378,22.688332,0],[114.200194,22.688389,0],[114.200034,22.688335,0],[114.199704,22.688102,3.9],[114.199628,22.687974,0],[114.199517,22.688032,4.8],[114.199064,22.687904,0],[114.198981,22.687544,0],[114.198965,22.686974,0],[114.198975,22.686758,0.1],[114.199392,22.686739,0],[114.199986,22.686804,2.9],[114.200102,22.686772,2.8],[114.200174,22.686695,3],[114.20096,22.685371,0],[114.201189,22.685466,0],[114.201596,22.685689,1.4],[114.202303,22.686055,1.3],[114.202371,22.686134,1.5],[114.202335,22.686227,0]]]}}]}
 */
export function getPolygonsFromGeojson(geojson) {
  return geojson.features
    .map(function({ geometry }) {
      return geometry.coordinates;
    })
    .flat();
}
