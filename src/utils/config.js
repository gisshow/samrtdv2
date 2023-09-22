export const TABS_KEY = [
  // {
  //   key: 'traffic',
  //   name: '交通专题',
  //   icon: 'icon_traffic',
  //   children: [
  //     {
  //       key: 'bus',
  //       name: '巴士',
  //       parent: 'traffic',
  //       icon: 'icon_bus',
  //     },
  //   ],
  // },

  // {
  //   key: 'safe',
  //   name: '安防专题',
  //   icon: 'icon_security',
  //   children: [
  //     {
  //       key: 'video',
  //       name: '固定视频',
  //       parent: 'safe',
  //       icon: 'icon_monitor',
  //     },
  //   ],
  // },
  {
    key: 'floor',
    name: '空间底板',
    icon: 'icon_ocean',
    children: [
      {
        key: 'sea',
        name: '海洋监测',
        parent: 'ocean',
        icon: 'icon_ocean',
      },
    ],
  },
  // {
  //   key: 'cqzg',
  //   name: '昌强重工',
  //   icon: 'icon_ocean',
  //   children: [
  //     {
  //       key: 'sea',
  //       name: '海洋监测',
  //       parent: 'ocean',
  //       icon: 'icon_ocean',
  //     },
  //   ],
  // },
  // {
  //   key: 'zylt1',
  //   name: '中运量T1线',
  //   icon: 'icon_ocean',
  //   children: [
  //     {
  //       key: 'sea',
  //       name: '海洋监测',
  //       parent: 'ocean',
  //       icon: 'icon_ocean',
  //     },
  //   ],
  // },
  {
    key: 'education',
    name: '教育专题',
    icon: 'icon_ocean',
    children: [],
  },
  {
    key: 'house',
    name: '地楼房专题',
    icon: 'icon_diloufang',
    children: [
      {
        key: 'land',
        name: '土地',
        parent: 'house',
        icon: 'icon_land',
      },
      {
        key: 'building',
        name: '楼宇',
        parent: 'house',
        icon: 'icon_building2',
      },
      {
        key: 'room',
        name: '房屋',
        parent: 'house',
        icon: 'icon_room',
      },
    ],
  },
  {
    key: 'ocean',
    name: '海洋专题',
    icon: 'icon_ocean',
    children: [
      {
        key: 'sea',
        name: '海洋监测',
        parent: 'ocean',
        icon: 'icon_ocean',
      },
    ],
  },
  // {
  //   key: 'newTraffic',
  //   name: '交通专题',
  //   icon: 'icon_ocean',
  //   children: [
  //     {
  //       key: 'car',
  //       name: '车辆搜索',
  //       parent: 'newTraffic',
  //       icon: 'icon_ocean',
  //     },
  //   ],
  // },
  {
    key: 'traffic',
    name: '交通专题',
    icon: 'icon_ocean',
    children: [
      {
        key: 'car',
        name: '车辆搜索',
        parent: 'traffic',
        icon: 'icon_ocean',
      },
    ],
  },
  {
    key: 'commute',
    name: '通勤专题',
    icon: 'icon_diloufang',
    children: [],
  },
  {
    key: 'monitoring',
    name: '监测专题',
    icon: 'icon_monitor',
    children: [],
  },
];

export const PUBLIC_PATH = process.env.NODE_ENV === 'production' ? '/samrtdv2/' : '/';

export const SERVER_TYPE = [
  {
    type: '3dTiles',
    name: '3dTiles',
  },
  {
    type: 'geojson_local',
    name: 'Geojson',
  },
  {
    type: 'WMS',
    name: 'WMS',
  },
  {
    type: 'wfs',
    name: 'WFS',
  },
];

export const menuAuths = [
  {
    key: 'floor',
    name: '国际创新协同区',
    icon: 'icon_ocean',
    authsKey: 'CityDisplay',
    auths: ['VisualizationSys.CityDisplay'],
    btnAuths: {
      CityMap: 'VisualizationSys.CityDisplay.CityMap',
      MapTools: {
        // 光照模拟
        sunAnalys: 'VisualizationSys.CityDisplay.MapTools.LightSimulate',
        // 后处理
        postProcess: 'VisualizationSys.CityDisplay.MapTools.PostProcess',
        // 天气模拟
        weather: 'VisualizationSys.CityDisplay.MapTools.WeatherSimu',
        // 鹰眼
        hawkeye: 'VisualizationSys.CityDisplay.MapTools.EagleEyeMap',
        // 可视域
        visualAnalys: 'VisualizationSys.CityDisplay.MapTools.VisualAnalysis',
        // 时序播放
        timelinePlay: 'VisualizationSys.CityDisplay.MapTools.TimeLinePlay',
        // 性能评测
        performanceMonitor: 'VisualizationSys.CityDisplay.MapTools.PerformanceMonitor',
        //空间标记
        spaceMark: 'VisualizationSys.CityDisplay.MapTools.MapMark',
        //量算
        measure: 'VisualizationSys.CityDisplay.MapTools.MapMeasure',
        //分层分户标注
        houseHoldStat: 'VisualizationSys.CityDisplay.MapTools.HouseHoldStat',
        //剖切
        landCutting: 'VisualizationSys.CityDisplay.MapTools.LandCutting',
        //压平
        flattening: 'VisualizationSys.CityDisplay.MapTools.Flattening',
        //全屏
        panoramicView: 'VisualizationSys.CityDisplay.MapTools.PanoramicView',
        //添加BIM项目
        addbim: 'VisualizationSys.CityDisplay.MapTools.AddBIM',
        // 天际线
        skyline: 'VisualizationSys.CityDisplay.MapTools.SkyLine',
        // 坐标转换
        coordinateConvert: 'VisualizationSys.CityDisplay.MapTools.CoordinateConvert',
      },
      LayerOperate: {
        // 图层管理
        LayerManage: 'VisualizationSys.CityDisplay.LayerOperate.LayerManage',
        // 专题展示（室内）
        IndoorDisplay: 'VisualizationSys.CityDisplay.LayerOperate.IndoorDisplay',
        // 专题展示（地下空间）
        UnderDisplay: 'VisualizationSys.CityDisplay.LayerOperate.UnderDisplay',
        // 专题展示（视频）
        VideoDisplay: 'VisualizationSys.CityDisplay.LayerOperate.VideoDisplay',
        // 专题展示（单体化）
        MonoDisplay: 'VisualizationSys.CityDisplay.LayerOperate.MonoDisplay',
        // 专题展示（渔港GPS）
        Fishing: 'VisualizationSys.CityDisplay.LayerOperate.Fishing',
        // 专题展示（海洋）
        OceanDisplay: 'VisualizationSys.CityDisplay.LayerOperate.OceanDisplay',
      },
      MapQuery: 'VisualizationSys.CityDisplay.MapQuery', //全局查询
      MapClick: 'VisualizationSys.CityDisplay.MapClick', //点选
      // MapMeasure:'VisualizationSys.CityDisplay.MapMeasure',
      // MapFly: 'VisualizationSys.CityDisplay.MapFly', // 飞行漫游
      MapBookmark: 'VisualizationSys.CityDisplay.MapBookmark', //视角书签
      // MapMark:'VisualizationSys.CityDisplay.MapMark',
      FrameSelectQuery: 'VisualizationSys.CityDisplay.FrameSelectQuery', //框选查询
      DistrictStat: 'VisualizationSys.CityDisplay.DistrictStat', //行政区统计
    },
  },
  {
    key: 'house',
    name: '地楼房专题',
    icon: 'icon_diloufang',
    authsKey: 'ParcelBldgHouse',
    auths: ['VisualizationSys.ParcelBldgHouse'],
    btnAuths: {
      HousePopulationInfo: 'VisualizationSys.ParcelBldgHouse.HousePopulationInfo',
    },
  },
  {
    key: 'ocean',
    name: '海洋专题',
    icon: 'icon_ocean',
    authsKey: 'OceanModule',
    auths: ['VisualizationSys.OceanModule'],
  },
  {
    key: 'traffic',
    name: '交通专题',
    icon: 'icon_ocean',
    authsKey: 'TrafficModule',
    auths: ['VisualizationSys.TrafficModule'],
  },
  {
    key: 'education',
    name: '教育专题',
    icon: 'icon_ocean',
    authsKey: 'EducationProject',
    auths: ['VisualizationSys.EducationProject'], //EducationProject
  },
  {
    key: 'monitoring',
    name: '监测专题',
    icon: 'icon_ocean',
    authsKey: 'MonitoringItems',
    auths: ['VisualizationSys.MonitoringItems'], //MonitoringItems
  },
  {
    key: 'commute',
    name: '通勤专题',
    icon: 'icon_ocean',
    authsKey: 'CommutingTopics',
    auths: ['VisualizationSys.CommutingTopics'],
  },
];
