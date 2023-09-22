/**
 * 周边设施--统计信息
 */
export default {
  'POST /vb/poi/stat': {
    success: true,
    code: 200,
    msg: '请求成功',
    data: {
      quantity: {
        stat: [
          { label: '政府机构及社会团体', num: 2.0 },
          { label: '临时医疗保健服务', num: 3.0 },
          { label: '风景名胜', num: 1.0 },
          { label: '金融保险服务', num: 14.0 },
          { label: '生活服务', num: 34.0 },
          { label: '科教文化服务', num: 19.0 },
          { label: '体育休闲服务', num: 13.0 },
          { label: '餐饮服务', num: 44.0 },
          { label: '商务住宅', num: 5.0 },
          { label: '汽车维修', num: 3.0 },
          { label: '汽车服务', num: 5.0 },
          { label: '购物服务', num: 36.0 },
          { label: '交通设施服务', num: 4.0 },
          { label: '临时公司企业', num: 135.0 },
          { label: '地名地址信息', num: 3.0 },
        ],
        sum: 321.0,
      },
      area: null,
    },
  },
};
