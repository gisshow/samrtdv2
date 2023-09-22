/**
 * 周边人口--统计信息
 */
export default {
  'POST /vb/population/stat': {
    success: true,
    code: 200,
    msg: '请求成功',
    data: {
      age: {
        stat: [
          { label: '0-6岁', num: 5.0 },
          { label: '7-12岁', num: 9.0 },
          { label: '13-15岁', num: 4.0 },
          { label: '16-18岁', num: 4.0 },
          { label: '19-59岁', num: 391.0 },
          { label: '60岁及以上', num: 6.0 },
        ],
        sum: 419.0,
      },
      gender: {
        stat: [
          { label: '女性', num: 126.0 },
          { label: '男性', num: 293.0 },
        ],
        sum: 419.0,
      },
    },
  },
};
