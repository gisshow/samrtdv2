export default {
  'GET /vb/entity/paa/search': {
    code: 200,
    msg: '请求成功',
    success: true,
    data: {
      pageNo: 1,
      pageSize: 10,
      pateTotal: 1000,
      total: 10000,
      list: [
        {
          entityId: 12714744,
          geo: JSON.stringify({
            type: 'Point',
            coordinates: [114.23391200014802, 22.72115700019194],
          }),
          name: 'A&A',
          type: 'poi',
        },
      ],
    },
  },
};
