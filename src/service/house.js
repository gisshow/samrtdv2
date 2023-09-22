import { request } from '@/utils/request';

//行政区、街道、边界接口
export async function getRegion() {
  return request('/vb/district/list');
}

/**基础地相关接口 */

// 地块统计接口
export async function getParcelStatistics(param) {
  return request('/vb/parcel/stat', {
    method: 'GET',
    params: param,
  });
}

// 根据basicId查询指定地块
export async function getParcelById(param) {
  const ajax_response = await request('/gw/PARCEL/shenzhenS/DI', {
    method: 'POST',
    data: {
      operation: 'query',
      parcelCodeOrNo: param.basicId,
      parcelKey: '1',
    },
  });
  let ajax_response_data = ajax_response.data;
  // http://10.253.102.69/vb/parcel?basicId=440306404005GB00098
  if (ajax_response_data) {
    ajax_response.data = {
      id: ajax_response_data.id,
      basicId: ajax_response_data.basicId,
      type: ajax_response_data.type,
      name: ajax_response_data.name,
      location: ajax_response_data.location,
      attributes: {
        estateState: ajax_response_data.attributes.xtBusinessType.estateState,
        jdCode: ajax_response_data.attributes.xtBusinessType.jdCode,
        jdName: ajax_response_data.attributes.xtBusinessType.jdName,
        lamStage: ajax_response_data.attributes.xtBusinessType.lamStage,
        luArea: ajax_response_data.attributes.xtBusinessType.luArea,
        luFunction: ajax_response_data.attributes.xtBusinessType.luFunction,
        luLocation: ajax_response_data.attributes.xtBusinessType.luLocation,
        parLotNo: ajax_response_data.attributes.xtBusinessType.parLotNo,
        parcelCode: ajax_response_data.attributes.xtBusinessType.parcelCode,
        parcelNo: ajax_response_data.attributes.xtBusinessType.parLotNo,
        quCode: ajax_response_data.attributes.xtBusinessType.quCode,
        quName: ajax_response_data.attributes.xtBusinessType.quName,
        unit: '深圳龙滨亚麻纺织有限公司',
        statusEstate: 1,
        registerNo:
          ajax_response_data.attributes.xtRightsAttrs[0] &&
          ajax_response_data.attributes.xtRightsAttrs[0].registerNo,
        registerType:
          ajax_response_data.attributes.xtRightsAttrs[0] &&
          ajax_response_data.attributes.xtRightsAttrs[0].registerType,
        estateType: null,
        estateArea: null,
        estateStartdate: null,
        estateEnddate: null,
        registerDate:
          ajax_response_data.attributes.xtRightsAttrs[0] &&
          ajax_response_data.attributes.xtRightsAttrs[0].registerDate,
      },
    };
  }
  console.log('ajax_response', ajax_response);
  // return ajax_response;
  // http://10.253.102.69/vb/space/range/parcel_entity/searchj
  return Promise.resolve({
    success: true,
    code: 200,
    msg: '请求成功',
    data: ajax_response.data,
  });
  // return request('/vb/parcel', {
  //   method: 'GET',
  //   params: param,
  // });
}

// 根据行政区名称查询地块列表
export async function getParcelList(param) {
  return request('/vb/parcel/parcels', {
    method: 'GET',
    params: param,
  });
}

//根据楼栋编号，查询所属地块
export async function getParcelByBuildId(param) {
  return request('/vb/parcel/by-building', {
    method: 'GET',
    params: param,
  });
}

/**楼相关接口 */

// 根据行政区名称、地实体id查询楼列表
export async function getBuildList(param) {
  // /vb/building/buildings?parcelId=T103-0028
  const ajax_response = await request('/gw/BUILDING/shenzhenS/LOU', {
    method: 'POST',
    data: {
      operation: 'list',
      parcelCodeOrNo: param.parcelId,
      parcelKey: '1',
      pageNum: 1,
      pageSize: 2,
    },
  });
  let ajax_response_dataList = ajax_response.dataList;
  if (ajax_response_dataList) {
    ajax_response.data = ajax_response_dataList.map(function(ajax_response_data) {
      return {
        id: ajax_response_data.id,
        basicId: ajax_response_data.basicId,
        type: ajax_response_data.type,
        name: ajax_response_data.name,
        location: ajax_response_data.location,
        attributes: {
          jdCode: ajax_response_data.attributes.xtBusinessType.jdCode,
          jdName: ajax_response_data.attributes.xtBusinessType.jdName,
          quCode: ajax_response_data.attributes.xtBusinessType.quCode,
          quName: ajax_response_data.attributes.xtBusinessType.quName,
          bldaddr: ajax_response_data.attributes.xtBusinessType.bldaddr,
          bldgLdArea: ajax_response_data.attributes.xtBusinessType.bldgLdArea,
          bldgNo: ajax_response_data.attributes.xtBusinessType.bldgNo,
          bldgUsage: ajax_response_data.attributes.xtBusinessType.bldgUsage,
          floorArea: ajax_response_data.attributes.xtBusinessType.floorArea,
          nowname: ajax_response_data.attributes.xtBusinessType.nowname,
          remark: ajax_response_data.attributes.xtBusinessType.remark,
          sqCode: ajax_response_data.attributes.xtBusinessType.sqCode,
          sqName: ajax_response_data.attributes.xtBusinessType.sqName,
          upBldgFloor: ajax_response_data.attributes.xtBusinessType.upBldgFloor,
          basicBldgId: ajax_response_data.attributes.xtBusinessType.basicBldgId,
          bldcond: ajax_response_data.attributes.xtBusinessType.bldcond,
          bldcondName: ajax_response_data.attributes.xtBusinessType.bldcondName,
          bldgHeight: ajax_response_data.attributes.xtBusinessType.bldgHeight,
          bldstru: ajax_response_data.attributes.xtBusinessType.bldstru,
          bldstruName: ajax_response_data.attributes.xtBusinessType.bldstruName,
          bldyear: ajax_response_data.attributes.xtBusinessType.bldyear,
          bldgUsestate: ajax_response_data.attributes.xtBusinessType.bldgUsestate,
          beregion: ajax_response_data.attributes.xtBusinessType.beregion,
          registerNo: null,
          registerType: null,
          estateType: null,
          estateArea: null,
          estateStartdate: null,
          estateEnddate: null,
          registerDate: null,
          key: ajax_response_data.attributes.xtBldgType.key,
          value: ajax_response_data.attributes.xtBldgType.value,
        },
      };
    });
  } else {
    ajax_response.data = [];
  }
  console.log('ajax_response', ajax_response);
  // return ajax_response;
  // http://10.253.102.69/vb/space/range/parcel_entity/searchj
  return Promise.resolve({
    success: true,
    code: 200,
    msg: '请求成功',
    data: ajax_response.data,
  });
  // return request('/vb/building/buildings', {
  //   method: 'GET',
  //   params: param,
  // });
}

// 查询无地块信息的楼列表
export async function getBuildByNopacel(param) {
  return request('/vb/building/no-parcel', {
    method: 'POST',
    data: param,
  });
}

//根据楼实体id查询
export async function getBuildById(param) {
  // /vb/building/buildings?parcelId=T103-0028
  const ajax_response = await request('/gw/BUILDING/shenzhenS/LOU', {
    method: 'POST',
    data: {
      operation: 'query',
      buildingId: param.basicId,
      buildingKey: param.bldgKey,
    },
  });
  let ajax_response_data = ajax_response.data;
  // http://10.253.102.69/vb/building?basicId=4403060096010800301&bldgKey=1
  if (ajax_response_data) {
    ajax_response.data = {
      id: ajax_response_data.id,
      basicId: ajax_response_data.basicId,
      type: ajax_response_data.type,
      name: ajax_response_data.name,
      location: ajax_response_data.location,
      attributes: {
        jdCode: ajax_response_data.attributes.xtBusinessType.jdCode,
        jdName: ajax_response_data.attributes.xtBusinessType.jdName,
        quCode: ajax_response_data.attributes.xtBusinessType.quCode,
        quName: ajax_response_data.attributes.xtBusinessType.quName,
        bldaddr: ajax_response_data.attributes.xtBusinessType.bldaddr,
        bldgLdArea: ajax_response_data.attributes.xtBusinessType.bldgLdArea,
        bldgNo: ajax_response_data.attributes.xtBusinessType.bldgNo,
        bldgUsage: ajax_response_data.attributes.xtBusinessType.bldgUsage,
        floorArea: ajax_response_data.attributes.xtBusinessType.floorArea,
        nowname: ajax_response_data.attributes.xtBusinessType.nowname,
        remark: ajax_response_data.attributes.xtBusinessType.remark,
        sqCode: ajax_response_data.attributes.xtBusinessType.sqCode,
        sqName: ajax_response_data.attributes.xtBusinessType.sqName,
        upBldgFloor: ajax_response_data.attributes.xtBusinessType.upBldgFloor,
        basicBldgId: ajax_response_data.attributes.xtBusinessType.basicBldgId,
        bldcond: ajax_response_data.attributes.xtBusinessType.bldcond,
        bldcondName: ajax_response_data.attributes.xtBusinessType.bldcondName,
        bldgHeight: ajax_response_data.attributes.xtBusinessType.bldgHeight,
        bldstru: ajax_response_data.attributes.xtBusinessType.bldstru,
        bldstruName: ajax_response_data.attributes.xtBusinessType.bldstruName,
        bldyear: ajax_response_data.attributes.xtBusinessType.bldyear,
        bldgUsestate: ajax_response_data.attributes.xtBusinessType.bldgUsestate,
        beregion: ajax_response_data.attributes.xtBusinessType.beregion,
        registerNo: null,
        registerType: null,
        estateType: null,
        estateArea: null,
        estateStartdate: null,
        estateEnddate: null,
        registerDate: null,
        key: ajax_response_data.attributes.xtBldgType.key,
        value: ajax_response_data.attributes.xtBldgType.value,
      },
    };
  }
  console.log('ajax_response', ajax_response);
  // return ajax_response;
  // http://10.253.102.69/vb/space/range/parcel_entity/searchj
  return Promise.resolve({
    success: true,
    code: 200,
    msg: '请求成功',
    data: ajax_response.data,
  });
  // return request('/vb/building', {
  //   method: 'GET',
  //   params: param,
  // });
}

// 基础楼统计接口
export async function getBuildStatistics(param) {
  return request('/vb/building/stat', {
    method: 'GET',
    params: param,
  });
}

// 根据基础楼id去locus查询3dtiles.json
export async function getBuild3DUrl(param) {
  return request('/file_relation/search', {
    method: 'GET',
    params: param,
  });
}

// 根据基础楼id去查询树形结构
export async function getBuildTree(param) {
  return request('/datafusion/api/locus/bim/scene/bim/getBuildingTreeById', {
    method: 'GET',
    params: param,
  });
}

// 根据基础楼id和户ID获取房ID
export async function getHouseId(param) {
  return request('/datafusion/api/locus/bim/scene/bim/getHouseIdByBuildingIdAndHouseIntId', {
    method: 'GET',
    params: param,
  });
}

// 根据基础楼id和户Guid获取房ID
export async function getHouseIdByGuid(param) {
  return request('/datafusion/api/locus/bim/scene/bim/getHouseIdByBuildingIdAndHouseGuid', {
    method: 'GET',
    params: param,
  });
}

export async function getIntIdByHouseId(param) {
  return request('/datafusion/api/locus/bim/scene/bim/getHouseIntIdByBuildingIdAndHouseId', {
    method: 'GET',
    params: param,
  });
}

//根据楼的业务ID查询房列表（针对楼栋与分层分户模型多对一的问题）
export async function getHouseByBuildingId(param) {
  return request('/datafusion/api/locus/bim/scene/bim/getHouseByBuildingId', {
    method: 'GET',
    params: param,
  });
}

//根据houseId 查询所属楼栋
export async function getBuildByRoomId(param) {
  return request('/vb/building/by-house', {
    method: 'GET',
    params: param,
  });
}

/**房相关接口 */

// 基础房统计接口
export async function getRoomStatistics(param) {
  return request('/vb/house/stat', {
    method: 'GET',
    params: param,
  });
}

// 根据楼id查询房列表
export async function getRoomList(param) {
  return request('/vb/house/houses', {
    method: 'GET',
    params: param,
  });
}

export async function getRoomById(param) {
  return request('/vb/house', {
    method: 'GET',
    params: param,
  });
}

// 根据基础楼id去locus查询3dtiles.json
export async function getRoom3DUrl(param) {
  return request('/file_relation/search', {
    method: 'GET',
    params: param,
  });
}

// 查询房屋详情信息（根据3dtiles中关联id）
export async function getRoomInfo(param) {
  return request('portal/manager/basic/house/relation/house', {
    method: 'GET',
    params: param,
  });
}

export async function getElementIdByHouseId(param) {
  return request('portal/manager/basic/house/property/element-ids', {
    method: 'GET',
    params: param,
  });
}

// 查询basichouseid 查询构件id
export async function getElemetIds(param) {
  return request('portal/manager/basic/house/property/element-ids', {
    method: 'GET',
    params: param,
  });
}

// portal/manager/basic/house/property/element-ids

// 人口信息统计接口
export async function getPopulationStatistics(param) {
  const ajax_response = await request('/gw/COMMON/populationCount', {
    method: 'POST',
    data: {
      geo: 'POINT(114.022630 22.538336)',
      ...param,
    },
  });
  let ajax_response_data = ajax_response.result;
  if (ajax_response_data) {
    ajax_response.data = {
      age: {
        stat: [
          { label: '0-6岁', num: ajax_response_data.NUM06 },
          { label: '7-12岁', num: ajax_response_data.NUM612 },
          { label: '13-15岁', num: ajax_response_data.NUM1518 },
          { label: '16-18岁', num: ajax_response_data.NUM1518 },
          { label: '19-59岁', num: ajax_response_data.NUM1860 },
          { label: '60岁及以上', num: ajax_response_data.NUM60 },
        ],
        sum: ajax_response_data.NUM,
      },
      gender: {
        stat: [
          { label: '女性', num: ajax_response_data.NUMF },
          { label: '男性', num: ajax_response_data.NUMM },
        ],
        sum: ajax_response_data.NUM,
      },
    };
  }
  console.log('ajax_response', ajax_response);
  // return ajax_response;
  // http://10.253.102.69/vb/population/stat
  return Promise.resolve({
    success: true,
    code: 200,
    msg: '请求成功',
    data: ajax_response.data,
  });
  // return request('/vb/population/stat', {
  //   method: 'POST',
  //   data: param,
  // });
}

//适龄人口数量统计接口
export async function getPopulationSchoolStat(param) {
  return request('/vb/population/school/stat', {
    method: 'POST',
    data: param,
  });
}
//框选学校统计接口
export async function getSelectionSchoolStat(param) {
  return request('/education/web/schoolMatch/buildStatusList', {
    method: 'POST',
    data: param,
  });
}

// 法人信息统计接口
export async function getLegalPersonStatistic(param) {
  // console.log(param)
  return request('/vb/legal-person/stat', {
    method: 'GET',
    params: param,
  });
}

// 框选法人信息统计接口
export async function getLegalPersonStatisticBySpace(param) {
  return request('/vb/legal-person/stat/by-space', {
    method: 'POST',
    data: param,
  });
}

// 空间查询楼实体数据
export async function getBuildBySpace(param) {
  const ajax_response = await request('/gw/BUILDING/shenzhenS/LOU', {
    method: 'POST',
    data: {
      geo: 'POINT(114.022630 22.538336)',
      operation: 'query',
      buildingKey: '1',
      ...param,
    },
  });
  let ajax_response_data = ajax_response.data;
  if (ajax_response_data) {
    ajax_response.data = [
      {
        id: ajax_response_data.id,
        basicId: ajax_response_data.basicId,
        type: ajax_response_data.type,
        name: ajax_response_data.name,
        location: ajax_response_data.location,
        attributes: {
          jdCode: ajax_response_data.attributes.xtBusinessType.jdCode,
          jdName: ajax_response_data.attributes.xtBusinessType.jdName,
          quCode: ajax_response_data.attributes.xtBusinessType.quCode,
          quName: ajax_response_data.attributes.xtBusinessType.quName,
          bldaddr: ajax_response_data.attributes.xtBusinessType.bldaddr,
          bldgLdArea: ajax_response_data.attributes.xtBusinessType.bldgLdArea,
          bldgNo: ajax_response_data.attributes.xtBusinessType.bldgNo,
          bldgUsage: ajax_response_data.attributes.xtBusinessType.bldgUsage,
          floorArea: ajax_response_data.attributes.xtBusinessType.floorArea,
          nowname: ajax_response_data.attributes.xtBusinessType.nowname,
          remark: ajax_response_data.attributes.xtBusinessType.remark,
          sqCode: ajax_response_data.attributes.xtBusinessType.sqCode,
          sqName: ajax_response_data.attributes.xtBusinessType.sqName,
          upBldgFloor: ajax_response_data.attributes.xtBusinessType.upBldgFloor,
          basicBldgId: ajax_response_data.attributes.xtBusinessType.basicBldgId,
          bldcond: ajax_response_data.attributes.xtBusinessType.bldcond,
          bldcondName: ajax_response_data.attributes.xtBusinessType.bldcondName,
          bldgHeight: ajax_response_data.attributes.xtBusinessType.bldgHeight,
          bldstru: ajax_response_data.attributes.xtBusinessType.bldstru,
          bldstruName: ajax_response_data.attributes.xtBusinessType.bldstruName,
          bldyear: ajax_response_data.attributes.xtBusinessType.bldyear,
          bldgUsestate: ajax_response_data.attributes.xtBusinessType.bldgUsestate,
          beregion: ajax_response_data.attributes.xtBusinessType.beregion,
          registerNo: null,
          registerType: null,
          estateType: null,
          estateArea: null,
          estateStartdate: null,
          estateEnddate: null,
          registerDate: null,
          key: ajax_response_data.attributes.xtBldgType.key,
          value: ajax_response_data.attributes.xtBldgType.value,
        },
      },
    ];
  } else {
    ajax_response.data = [];
  }
  console.log('ajax_response', ajax_response);
  // return ajax_response;
  // http://10.253.102.69/vb/space/range/parcel_entity/searchj
  return Promise.resolve({
    success: true,
    code: 200,
    msg: '请求成功',
    data: ajax_response.data,
  });
}

// 空间查询地实体数据
export async function getLandBySpace(param) {
  const ajax_response = await request('/gw/PARCEL/shenzhenS/DI', {
    method: 'POST',
    data: {
      geo: 'POINT(114.022715 22.538360)',
      operation: 'query',
      parcelKey: '1',
      ...param,
    },
  });
  let ajax_response_data = ajax_response.data;
  if (ajax_response_data) {
    ajax_response.data = [
      {
        id: ajax_response_data.id,
        basicId: ajax_response_data.basicId,
        type: ajax_response_data.type,
        name: ajax_response_data.name,
        location: ajax_response_data.location,
        attributes: {
          estateState: ajax_response_data.attributes.xtBusinessType.estateState,
          jdCode: ajax_response_data.attributes.xtBusinessType.jdCode,
          jdName: ajax_response_data.attributes.xtBusinessType.jdName,
          lamStage: ajax_response_data.attributes.xtBusinessType.lamStage,
          luArea: ajax_response_data.attributes.xtBusinessType.luArea,
          luFunction: ajax_response_data.attributes.xtBusinessType.luFunction,
          luLocation: ajax_response_data.attributes.xtBusinessType.luLocation,
          parLotNo: ajax_response_data.attributes.xtBusinessType.parLotNo,
          parcelCode: ajax_response_data.attributes.xtBusinessType.parcelCode,
          parcelNo: ajax_response_data.attributes.xtBusinessType.parLotNo,
          quCode: ajax_response_data.attributes.xtBusinessType.quCode,
          quName: ajax_response_data.attributes.xtBusinessType.quName,
          unit: '深圳龙滨亚麻纺织有限公司',
          statusEstate: 1,
          registerNo:
            ajax_response_data.attributes.xtRightsAttrs[0] &&
            ajax_response_data.attributes.xtRightsAttrs[0].registerNo,
          registerType:
            ajax_response_data.attributes.xtRightsAttrs[0] &&
            ajax_response_data.attributes.xtRightsAttrs[0].registerType,
          estateType: null,
          estateArea: null,
          estateStartdate: null,
          estateEnddate: null,
          registerDate:
            ajax_response_data.attributes.xtRightsAttrs[0] &&
            ajax_response_data.attributes.xtRightsAttrs[0].registerDate,
        },
      },
    ];
  } else {
    ajax_response.data = [];
  }
  console.log('ajax_response', ajax_response);
  // return ajax_response;
  // http://10.253.102.69/vb/space/range/parcel_entity/searchj
  return Promise.resolve({
    success: true,
    code: 200,
    msg: '请求成功',
    data: ajax_response.data,
  });
}

//框选统计房数量
export async function getRoomStatisticsBySpace(param) {
  return request('/vb/space/range/house_entity/bldAttrj', {
    method: 'POST',
    data: param,
  });
}

// 空间统计地实体数据
export async function getLandStatisticsBySpace(param) {
  return request('/vb/space/range/parcel_entity/estateStatej', {
    method: 'POST',
    data: param,
  });
}

// 空间统计楼实体数据
export async function getBuildStatisticsBySpace(param) {
  return request('/vb/space/range/building_entity/usagej', {
    method: 'POST',
    data: param,
  });
}

// 学校查询
export async function getSchoolSearch(param) {
  return request('/education/web/schoolMatch/listPage', {
    method: 'POST',
    data: param,
  });
}
//根据schoolCode查询学校信息
export async function getSchoolInfoByCode(param) {
  return request('/education/web/schoolMatch/getSchool', {
    method: 'POST',
    data: param,
  });
}
// 传感器监测数据
export async function getMonitorSensor(param) {
  return request(
    `/de/sensor/store/getPlatFormDeviceData?deviceType=${param.sensorStore.deviceType}&platFormId=${param.sensorStore.platformId}`,
    {
      method: 'GET',
      //params:param.buildingId,
    },
  );
}
// 传感器数据
export async function getMonitor(param) {
  return request('/de/sensor/store/getPlatFormDeviceName', {
    method: 'GET',
    params: param,
  });
}
// 实体查询
export async function search(param) {
  return request('/vb/entity/search', {
    method: 'GET',
    params: param,
  });
}

// 实体查询
export async function searchPrev(param) {
  return request('/vb/entity/search/prev', {
    method: 'GET',
    params: param,
  });
}

// 按区域统计地楼房总数
export async function getStatAll(param) {
  return request('/vb/entity/pbh/stat', {
    method: 'GET',
    params: param,
  });
}

// 框选统计POI数量
export async function getPOIStat(param) {
  return request('/gw/COMMON/poiSearch/stat', {
    method: 'POST',
    data: param,
  });
}

// 框选POI列表
export async function getPOIList(param) {
  return request('/gw/COMMON/poiSearch/poi', {
    method: 'POST',
    data: param,
  });
}

// POI类型枚举
export async function getPOITypes(param) {
  return request('/gw/COMMON/poiSearch/types', {
    method: 'GET',
    params: param,
  });
}

// 按楼栋统计人口数
export async function getPopulationByBuildId(param) {
  return request('/vb/population/by-building', {
    method: 'GET',
    params: param,
  });
}

// 按楼栋统计法人数
export async function getLegalPersonBuildId(param) {
  return request(`/vb/legal-person/stat/by-building/${param.buildingId}`, {
    method: 'GET',
    //params:param.buildingId,
  });
}

// 查询房屋人口数据
export async function getPopulationByHouseId(param) {
  return request('/vb/population/by-house', {
    method: 'GET',
    params: param,
  });
}

//查询分层分户列表
export async function getHouseHoldList(param) {
  return request('/vb/stratified', {
    method: 'GET',
    params: param,
  });
}

//查询地理、建筑列表（水系、道路、植被等）--地图点选
//查询分层分户列表
export async function getGeoInfo(param) {
  return request('/vb/city/geo/by-point', {
    method: 'POST',
    data: param,
  });
}
