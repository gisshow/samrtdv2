export default {
  // http://localhost:8000/gw/COMMON/search/prev?keyword=A%26
  'GET /gw/COMMON/search/prev': {
    code: 200,
    msg: '请求成功',
    success: true,
    data: [
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
};
