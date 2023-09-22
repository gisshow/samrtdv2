/**
 * 楼宇详情
 */
export default {
  // /vb/parcel/by-building?bldgNo=4403040040100400006
  'GET /vb/parcel/by-building': {
    success: true,
    code: 200,
    msg: '请求成功',
    data: {
      id: 1664169,
      basicId: 'B107-0023(1)',
      type: 'parcel',
      name: '1440304007002GB00038DST1100129160',
      location:
        '{"type":"Polygon","coordinates":[[[114.02315924335647,22.538134278462927],[114.02218377489032,22.53796894004743],[114.02207157826994,22.538540233820903],[114.02304704964503,22.538705572901744],[114.02315924335647,22.538134278462927]]]}',
      attributes: {
        estateState: '备案',
        jdCode: null,
        jdName: '沙头街道',
        lamStage: '合同',
        luArea: 6559.51,
        luFunction: '商业性办公用地,市政公用设施用地',
        luLocation: '福田区深南大道南香蜜湖路西',
        parLotNo: '3000022741',
        parcelCode: '440304007002GB00038',
        parcelNo: 'B107-0023(1)',
        quCode: null,
        quName: '福田区',
        unit: '深圳市地铁集团有限公司',
        statusEstate: 0,
        registerNo: '3000866302',
        registerType: '首次登记（初始登记）',
        estateType: null,
        estateArea: 6559.51,
        estateStartdate: '2014-02-28',
        estateEnddate: '2054-02-28',
        registerDate: '2014-07-21',
      },
    },
  },
};
