/* global Cesium */
/**
 * 压平3DTileset
 * @example 倾斜摄影模型tileset，BIM模型tileset1
TilesetFlat.applyFlat({
  tileset,
  flatHeight: Cesium.Cartographic.fromCartesian(
    TilesetFlat.getOrientedBoundingBoxLBRTPoints(
      tileset1.root._boundingVolume._orientedBoundingBox,
    )[0],
  ).height,
  polygons: [
    [
      [113.880316, 22.551337, -2.7],
      [113.880231, 22.548729, -2],
      [113.880134, 22.548602, -2],
      [113.879992, 22.548562, -1.8],
      [113.879366, 22.548645, -0.2],
      [113.878606, 22.548687, -0.7],
    ],
  ],
});
 */
Cesium.TilesetFlat = {};
const { TilesetFlat } = Cesium;
/**
 * 世界坐标转局部坐标
 */
TilesetFlat.worldPositionToLocalPosition = function(origin, worldPosition) {
  return Cesium.Matrix4.multiplyByPoint(
    Cesium.Matrix4.inverse(Cesium.Transforms.eastNorthUpToFixedFrame(origin), new Cesium.Matrix4()),
    worldPosition,
    new Cesium.Cartesian3(),
  );
};
/**
 * 世界坐标转换到tileset内部的局部坐标
 */
TilesetFlat.worldPositionToLocalPosition_tileset = function(tileset, worldPosition) {
  return TilesetFlat.worldPositionToLocalPosition(tileset.boundingSphere.center, worldPosition);
};
/**
   * 多个经纬度区域转换成多个局部区域
   * @returns 形如：
      [
        [
          [0, 0],
          [300, 0],
          [300, 300],
          [0, 300],
          [150, 150],
        ],
        [
          [-150, 0],
          [-150, -150],
          [-300, -150],
          // [-200, -75],
          [-300, 0],
        ],
      ]
   */
TilesetFlat.degreesPolygonsToLocal = function(tileset, polygons) {
  return polygons.map(function(polygon) {
    return polygon.map(function(coordinate) {
      const worldPosition = Cesium.Cartesian3.fromDegrees.apply(null, coordinate);
      return Object.values(
        TilesetFlat.worldPositionToLocalPosition_tileset(tileset, worldPosition),
      ).slice(0, 2);
    });
  });
};
/**
 * Shader字符串，生成一个函数，判断点是否在n个元素的数组的多边形里
 */
TilesetFlat.shaderSource_isPointInPolygon_n = function(n) {
  return `
// ${n}个元素的数组
vec2 points_${n}[${n}];
bool isPointInPolygon_${n}(vec2 point){
int nCross = 0; // 交点数
const int n = ${n}; // Loop index cannot be compared with non-constant expression
for(int i = 0; i < n; i++){
vec2 p1 = points_${n}[i];
vec2 p2 = points_${n}[int(mod(float(i+1),float(n)))];
// 求解 y=p.y 与 p1 p2 的交点
// p1p2 与 y=p0.y平行
if(p1[1] == p2[1]){
  continue;
}
// 交点在p1p2延长线上
if(point[1] < min(p1[1], p2[1])){
  continue;
}
if(point[1] >= max(p1[1], p2[1])){
  continue;
}
float x = p1[0] + ((point[1] - p1[1]) * (p2[0] - p1[0])) / (p2[1] - p1[1]);
if(x > point[0]){
  nCross++;
}
}
return int(mod(float(nCross), float(2))) == 1;
}
          `;
};
/**
 * 生成Shader字符串，拼接所有isPointInPolygon函数
 */
TilesetFlat.shaderSource_isPointInPolygon_set = function(polygons) {
  return TilesetFlat.getUniqueArray(
    polygons.map(function(polygon) {
      return polygon.length;
    }),
  )
    .map(function(n) {
      return TilesetFlat.shaderSource_isPointInPolygon_n(n);
    })
    .join('\n');
};
/**
 * 数组去重
 * 不能处理嵌套的数组
 */
TilesetFlat.getUniqueArray = function(arr) {
  return arr.filter(function(item, index, arr) {
    //当前元素，在原始数组中的第一个索引==当前索引值，否则返回当前元素
    return arr.indexOf(item, 0) === index;
  });
};
/**
   * Shader字符串，设置变量“_isPointInPolygon”为true
   * 存在变量：_isPoingInPolygon，points_n，point
   * @returns 所生成的字符串，形如：
      if(_isPointInPolygon == false){
        // 区域1
        points_5[0]=vec2(0.0,0.0);
        points_5[1]=vec2(300.0,0.0);
        points_5[2]=vec2(300.0,300.0);
        points_5[3]=vec2(0.0,300.0);
        points_5[4]=vec2(150.0,150.0);
        if(isPointInPolygon_5(point)){
          _isPointInPolygon = true;
        }
      }
   */
TilesetFlat.shaderSource__isPointInPolygon = function(polygon) {
  const n = polygon.length;
  return `
if (_isPointInPolygon == false) {
${polygon
  .map(function(point, index) {
    return `    points_${n}[${index}] = vec2(${point[0]}, ${point[1]});`;
  })
  .join('\n')}
if (isPointInPolygon_${n}(point)) {
  _isPointInPolygon = true;
}
}`;
};
/**
 * Shader字符串，生成多个多边形区域判断的内容，来设置全局变量“_isPointInPolygon”为true
 */
TilesetFlat.shaderSource__isPointInPolygon_set = function(polygons) {
  return polygons
    .map(function(polygon) {
      return TilesetFlat.shaderSource__isPointInPolygon(polygon);
    })
    .join('\n');
};
/**
 * 给Tileset创建压平区域
 */
TilesetFlat.applyFlat = async function({ tileset, flatHeight, polygons } = {}) {
  await tileset.readyPromise;
  tileset.enableModelExperimental = true;
  const origin = tileset.boundingSphere.center; // 以3DTileset的包围的中心点为局部坐标系原点
  const matrix = Cesium.Transforms.eastNorthUpToFixedFrame(origin);
  let polygons_local = TilesetFlat.degreesPolygonsToLocal(tileset, polygons);
  tileset.customShader = new Cesium.CustomShader({
    uniforms: {
      u_tileset_localToWorldMatrix: {
        type: Cesium.UniformType.MAT4,
        value: matrix,
      },
      u_tileset_worldToLocalMatrix: {
        type: Cesium.UniformType.MAT4,
        value: Cesium.Matrix4.inverse(matrix, new Cesium.Matrix4()),
      },
      u_flatHeight: {
        type: Cesium.UniformType.FLOAT,
        value: flatHeight,
      },
      u_tilesetHeight: {
        type: Cesium.UniformType.FLOAT,
        value: Cesium.Cartographic.fromCartesian(tileset.boundingSphere.center).height,
      },
      u_MinimalBoundingRectangle: {
        type: Cesium.UniformType.VEC4,
        value: Cesium.Cartesian4.fromArray(
          TilesetFlat.getMinimalBoundingRectangle(polygons_local.flat()),
        ),
      },
    },
    vertexShaderText: `
// 所有isPointInPolygon函数
${TilesetFlat.shaderSource_isPointInPolygon_set(polygons_local)}            
void vertexMain(VertexInput vsInput, inout czm_modelVertexOutput vsOutput){
vec3 modelMC = vsInput.attributes.positionMC;
vec4 model_local_position = vec4(modelMC.x, modelMC.y, modelMC.z, 1.0);
vec4 tileset_local_position = u_tileset_worldToLocalMatrix * czm_model * model_local_position;

// 在外包矩形内
if(tileset_local_position.x < u_MinimalBoundingRectangle[0]){
return;
}
if(tileset_local_position.y < u_MinimalBoundingRectangle[1]){
return;
}  
if(tileset_local_position.x > u_MinimalBoundingRectangle[2]){
return;
}
if(tileset_local_position.y > u_MinimalBoundingRectangle[3]){
return;
}  

vec4 tileset_local_position_transformed = vec4(tileset_local_position.x, tileset_local_position.y, 0.0 + (- u_tilesetHeight) + u_flatHeight, 1.0);
vec4 model_local_position_transformed = czm_inverseModel * u_tileset_localToWorldMatrix * tileset_local_position_transformed;

vec2 point = vec2(tileset_local_position.x,tileset_local_position.y);

bool _isPointInPolygon = false;

// 多个多边形区域判断
${TilesetFlat.shaderSource__isPointInPolygon_set(polygons_local)}

if(_isPointInPolygon){
vsOutput.positionMC.x = model_local_position_transformed.x;
vsOutput.positionMC.y = model_local_position_transformed.y;
vsOutput.positionMC.z = model_local_position_transformed.z;
}  
}
`,
  });
};
/**
 * 删除所有压平的部分
 */
TilesetFlat.removeAllFlat = function(tileset) {
  tileset.customShader = undefined;
};
/**
 * 从geojson里解析出压平区域
 * @params {object} geojson 形如：{"type":"FeatureCollection","layer":{"id":"M-9F09501E-C805-4208-8253-23594197BB42","name":""},"features":[{"type":"Feature","properties":{"id":"M-FA6B986F-D7C2-4980-B85B-43C713BF2C87","name":"","type":"polygon","style":{"color":"#3388ff","opacity":0.5,"outline":true,"outlineColor":"#ffffff","outlineWidth":2,"clampToGround":false,"materialType":"Color"},"edittype":"polygon"},"geometry":{"type":"Polygon","coordinates":[[[114.202274,22.68624,1.8],[114.202205,22.686322,0.4],[114.202162,22.686444,6.9],[114.202218,22.686472,0.8],[114.202175,22.686583,2.6],[114.202108,22.686693,0],[114.202046,22.68673,0],[114.202021,22.68679,0],[114.201966,22.686873,0],[114.201866,22.686921,0.2],[114.20182,22.686965,0],[114.201809,22.687016,0],[114.201767,22.687236,4.9],[114.201824,22.687261,9.8],[114.20185,22.687122,0],[114.20199,22.687055,0],[114.201947,22.687176,4.4],[114.201918,22.687255,0],[114.201833,22.687501,0],[114.201667,22.687825,0.9],[114.201362,22.687833,0],[114.201318,22.687717,0],[114.201357,22.687599,0.2],[114.201238,22.687548,0],[114.201115,22.687552,0.4],[114.201128,22.68769,0],[114.201012,22.687861,0],[114.200889,22.688017,4.5],[114.200667,22.688208,0],[114.200378,22.688332,0],[114.200194,22.688389,0],[114.200034,22.688335,0],[114.199704,22.688102,3.9],[114.199628,22.687974,0],[114.199517,22.688032,4.8],[114.199064,22.687904,0],[114.198981,22.687544,0],[114.198965,22.686974,0],[114.198975,22.686758,0.1],[114.199392,22.686739,0],[114.199986,22.686804,2.9],[114.200102,22.686772,2.8],[114.200174,22.686695,3],[114.20096,22.685371,0],[114.201189,22.685466,0],[114.201596,22.685689,1.4],[114.202303,22.686055,1.3],[114.202371,22.686134,1.5],[114.202335,22.686227,0]]]}}]}
 */
TilesetFlat.getPolygonsFromGeojson = function(geojson) {
  return geojson.features
    .map(function({ geometry }) {
      return geometry.coordinates;
    })
    .flat();
};
/**
 * @see https://segmentfault.com/a/1190000041397890
 * @returns
 */
TilesetFlat.getMinimalBoundingRectangle = function(polygon) {
  let [minX, minY] = polygon[0];
  let [maxX, maxY] = [minX, minY];
  const length = polygon.length;
  for (let m = 0; m < length; m++) {
    let point = polygon[m];
    const x = point[0];
    const y = point[1];
    if (x > maxX) {
      maxX = x;
    }
    if (y > maxY) {
      maxY = y;
    }
    if (x < minX) {
      minX = x;
    }
    if (y < minY) {
      minY = y;
    }
  }
  return [minX, minY, maxX, maxY];
};
/**
 * 获取包围盒两个角的点的坐标
 * @see https://blog.csdn.net/qq_38830351/article/details/124597950
 */
TilesetFlat.getOrientedBoundingBoxLBRTPoints = function(orientedBoundingBox) {
  var a = orientedBoundingBox.halfAxes;
  var center = orientedBoundingBox.center;
  var x = new Cesium.Cartesian3();
  var y = new Cesium.Cartesian3();
  var z = new Cesium.Cartesian3();

  Cesium.Matrix3.getColumn(a, 0, x);
  Cesium.Matrix3.getColumn(a, 1, y);
  Cesium.Matrix3.getColumn(a, 2, z);

  var temp1 = new Cesium.Cartesian3();
  var temp2 = new Cesium.Cartesian3();
  var temp3 = new Cesium.Cartesian3();

  Cesium.Cartesian3.subtract(center, x, temp1);
  Cesium.Cartesian3.subtract(temp1, y, temp2);
  Cesium.Cartesian3.subtract(temp2, z, temp3);

  // console.log("temp3为：", temp3);

  var temp4 = new Cesium.Cartesian3();
  var temp5 = new Cesium.Cartesian3();
  var temp6 = new Cesium.Cartesian3();

  Cesium.Cartesian3.add(center, x, temp4);
  Cesium.Cartesian3.add(temp4, y, temp5);
  Cesium.Cartesian3.add(temp5, z, temp6);

  // console.log("temp6：", temp6);
  return [temp3, temp6];
};
/**
 *
 * @param {Cesium.Cesium3DTileset} tileset0 被压平的倾斜摄影模型
 * @param {Cesium.Cesium3DTileset} tileset1 位于倾斜影像模型上面的BIM模型
 * @param {Array} polygons 压平区域
 */
TilesetFlat.applyFlatToRelativeTilesets = function(tileset0, tileset1, polygons) {
  tileset1.readyPromise.then(function(tileset1) {
    TilesetFlat.applyFlat({
      tileset0,
      flatHeight: TilesetFlat.getFlatHeightByTileset(tileset1),
      polygons,
    });
  });
};
/**
 *
 * @param {Cesium.Cesium3DTileset} tileset0 被压平的倾斜摄影模型
 * @param {Cesium.Cesium3DTileset} tileset1 位于倾斜影像模型上面的BIM模型
 * @param {Array} polygons 压平区域
 */
TilesetFlat.applyFlatToRelativeTilesetsFromGeojson = function(tileset0, tileset1, geojson) {
  TilesetFlat.applyFlatToRelativeTilesets(
    tileset0,
    tileset1,
    TilesetFlat.getPolygonsFromGeojson(geojson),
  );
};
/**
 * 从orientedBoundingBox里计算压平高度
 * @param {object} orientedBoundingBox
 * @returns
 */
TilesetFlat.getFlatHeightByOrientedBoundingBox = function(orientedBoundingBox) {
  return Cesium.Cartographic.fromCartesian(
    TilesetFlat.getOrientedBoundingBoxLBRTPoints(orientedBoundingBox)[0],
  ).height;
};
/**
 * 从tileset里计算压平高度
 * @param {Cesium.Cesium3DTileset} tileset
 * @returns
 */
TilesetFlat.getFlatHeightByTileset = function(tileset) {
  return TilesetFlat.getFlatHeightByOrientedBoundingBox(
    tileset.root._boundingVolume._orientedBoundingBox,
  );
};
