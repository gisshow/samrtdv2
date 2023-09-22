const path = require('path');

export default {
  treeShaking: true,
  hash: true,
  base: 'samrtdv2',
  publicPath: '/samrtdv2/',
  outputPath: './dist/samrtdv2',
  lessLoaderOptions: {},
  // devtool: 'source-map',
  proxy: {
    // '/om/auth': {
    //   target: 'http://10.89.10.50:8080/',
    //   changeOrigin: true,
    // },
    
    '/data': {
      target: 'http://192.168.10.41:3000',
      changeOrigin: true,
    },

    '/file_relation': {
      target: 'http://10.253.102.69/',
      changeOrigin: true,
    },
    '/datafusion': {
      target: 'http://10.253.102.69/',
      changeOrigin: true,
    },
    '/query': {
      target: 'http://168.4.0.3:8831',
      changeOrigin: true,
    },
    '/tile_data': {
      target: 'http://168.4.0.3:8831',
      changeOrigin: true,
    },
    '/building_entity': {
      target: 'http://168.4.0.3:8831',
      changeOrigin: true,
    },
    '/parcel_entity': {
      target: 'http://168.4.0.3:8831',
      changeOrigin: true,
    },
    '/f/q': {
      target: 'http://168.4.0.26:8098',
      changeOrigin: true,
    },
    '/map': {
      target: 'http://168.4.0.26:8098',
      changeOrigin: true,
    },
    '/TILE_3D_MODEL': {
      target: 'http://168.4.0.3:8842',
      changeOrigin: true,
    },
    '/geoserver': {
      target: 'http://10.89.9.234:8080',
      changeOrigin: true,
    },
    '/OceanServer': {
      target: 'http://168.4.0.3:8080',
      // target: "http://192.168.58.39:8080",
      changeOrigin: true,
    },
    // '/portal': {
    //   target:'http://168.4.0.3',
    //   changeOrigin: true,
    // },
    '/arcgis_js_api': {
      target: 'http://192.168.58.86:8083',
      changeOrigin: true,
    },
    '/vb': {
      // target: 'http://10.179.66.18:9658',
      // target: 'http://10.179.66.15:9660',
      target: 'http://10.253.102.69/',
      changeOrigin: true,
      // headers: {
      //   Accept: 'application/json, text/plain, */*',
      //   'Accept-Encoding': 'gzip, deflate',
      //   'Accept-Language': 'zh-CN,zh;q=0.9',
      //   'Content-Type': 'application/json;charset=utf-8',
      //   Host: 'szvusd-platform.an2.anhouse.cn',
      //   'Proxy-Connection': 'keep-alive',
      //   Referer: 'http://szvusd-platform.an2.anhouse.cn',
      //   'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/66.0.3359.170 Safari/537.36'
      // },
    },
    '/gw/': {
      target: 'http://10.253.102.69/',
      changeOrigin: true,
    },
    '/education': {
      target: 'http://168.4.0.3',
      changeOrigin: true,
    },
    '/de': {
      // target:'http://168.4.0.3',
      // target:'http://192.168.58.94:8878',
      target: 'http://168.4.0.3:8878',
      changeOrigin: true,
    },
    //模型
    '/lg3dtiles': {
      target: 'http://10.89.10.50:8080',
      // target:'http://192.168.58.52:8012',
      changeOrigin: true,
      // pathRewrite:{'^/video':''}
    },
    '/ship': {
      target: 'http://192.168.86.52:8085',
      changeOrigin: true,
      pathRewrite: { '^/ship': '' },
    },
    // 工务署API
    '/gws': {
      target: 'http://192.168.10.41:8081',
      changeOrigin: true,
    },
    // 工务署API-免登录
    '/gongwushu': {
      target: 'http://192.168.10.41:8081',
      changeOrigin: true,
    },
  },
  // alias: {
  //   '@ant-design/icons/lib/dist$': path.resolve(__dirname, './src/icons.js')
  // },
  chainWebpack(config, { webpack }) {
    config.plugin('IgnorePlugin').use(new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/));

    process.env.REPORT &&
      config.plugin('analyzer').use(require('webpack-bundle-analyzer').BundleAnalyzerPlugin);
  },
  plugins: [
    // ref: https://umijs.org/plugin/umi-plugin-react.html
    [
      'umi-plugin-react',
      {
        antd: true,
        dva: true,
        dynamicImport: { webpackChunkName: true },
        title: 'szvsud-platform-visualization-front',
        dll: true,
        routes: {
          exclude: [
            /models\//,
            /services\//,
            /model\.(t|j)sx?$/,
            /service\.(t|j)sx?$/,
            /components\//,
          ],
        },
      },
    ],
  ],
};
