/* global Cesium */
/* global viewer */
/* global mars3d */
/* global $ */
/* global turf */
import React, { Component } from 'react';
import ModuleTitle from '@/components/moduleTitle';
import DataPanel from '@/components/dataPanel';
import RegionFilter from './components/region';
import { connect } from 'dva';
import styles from './styles.less';
import {
  getBuildBySpace,
  getLandBySpace,
  getBuildList,
  getParcelByBuildId,
  getBuildById,
  getGeoInfo,
} from '@/service/house';
import HouseOld from './components/houseold';
import SubStat from './components/subStat';
import DetailInfo from './components/detailInfo';
import HouseTree from './components/houseTree';
import SplitLine from '@/components/splitLine';
import HouseHoldList from './components/list/houseHold';
function coordinatesArrayToCartesianArray(coordinates) {
  var positions = new Array(coordinates.length);
  for (var i = 0; i < coordinates.length; i++) {
    var coord = coordinates[i];
    positions[i] = Cesium.Cartesian3.fromDegrees(coord[0], coord[1]);
  }
  return positions;
}

@connect(({ Home, House, Map }) => ({
  Home,
  House,
  Map,
}))
class HouseSubject extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isShowBg: false, //是否显示背景
      isRenderTree: false, //是否渲染树结构
    };

    // this.depthTest=viewer.scene.globe.depthTestAgainstTerrain;
    // this.IndividualHouseInfo=
  }

  componentDidMount() {
    const { rightActiveKey } = this.props.Home;
    // this.props.dispatch({
    //   type: 'Home/setRightActiveKey',
    //   payload: 'land'
    // })
    // this.props.dispatch({
    //   type: 'House/getParcelStatistics',
    // })
    // this.props.dispatch({
    //   type: 'House/getBuildStatistics',
    // })
    // this.props.dispatch({
    //   type: 'House/getPerpetualBuildStatistics',
    //   payload: {
    //     bldgKey:1
    //   }
    // })
    // this.props.dispatch({
    //   type: 'House/getUnperpetualBuildStatistics',
    //   payload: {
    //     bldgKey:2
    //   }
    // })
    // this.props.dispatch({
    //   type: 'House/getRoomStatistics',
    // })
    // this.props.dispatch({
    //   type: 'House/getPopulationStatistics',
    // })
    // this.props.dispatch({
    //   type: 'House/getLegalPersonStatistic',
    // })
    //如果是默认基础楼列表，则加载倾斜+地形
    // if(rightActiveKey==="building"){
    // this.add3DTiles();//--2020.9.8 by pzw进入专题默认加载，隐藏
    // this.addLandWMS();
    // this.addTerrain();
    // }
    setTimeout(() => this.bindEvent(), 1000);
    // this.bindEvent();

    // 关闭深度检测
    // viewer.scene.globe.depthTestAgainstTerrain=false;
    // viewer.dataSources.dataSourceAdded.addEventListener(this.raiseBuild);
    // console.log(turf);

    // document.addEventListener("DOMNodeRemoved",function(e){
    //   console.log(e.target)
    //   if(e.target.id==="cesiumContainer-mars3d-tooltip-view"){
    //     console.log("k")
    //   }
    // })
  }

  clickHandle = event => {
    const { detailType } = this.props.House;
    let cartesian = mars3d.point.getCurrentMousePosition(viewer.scene, event.position);
    var carto = Cesium.Cartographic.fromCartesian(cartesian);
    var point = {};
    point.y = Cesium.Math.toDegrees(carto.latitude).toFixed(6);
    point.x = Cesium.Math.toDegrees(carto.longitude).toFixed(6);
    point.z = carto.height.toFixed(2);
    // 转经纬度并投影到地表
    let dataParam = {
      geo: 'POINT(' + point.x + ' ' + point.y + ')',
    };
    let promises = [];
    promises.push(this.getLandInfo(dataParam));
    promises.push(this.getBuildInfo(dataParam));
    promises.push(this.getGeoInfo(dataParam));
    Promise.all(promises).then(results => {
      let [land, building, geo] = results;
      if (land.show && building.show) {
        //查询出2个结果（楼和地）
        // 只显示楼栋
        this.showLandFeature(land, true);
        this.props.dispatch({
          type: 'House/SetTreeSelectedKeys',
          payload: {
            type: building.type,
            activeBuildId: building.id,
            activeLandId: land.id,
            parcelNo: land.attributes.parcelNo,
            bldgNo: building.attributes.bldgNo,
          },
          // [...treeSelectedKeys , `building${building.id}`]
        });
        this.setDetailAndStat('building', building);
        //地块切换到楼栋，先弹框再更新地块code,
        this.setParcelCode(land);
        this.setHouseBoxShow(true);
      } else if (land.show || building.show) {
        if (land.show && !geo.show) {
          this.showLandFeature(land);
          this.props.dispatch({
            type: 'House/SetTreeSelectedKeys',
            // payload:[...treeSelectedKeys , land.id]
            payload: {
              type: land.type,
              activeLandId: land.id,
            },
            //[...treeSelectedKeys , `parcel${land.id}`]
          });
          //高亮所在地的楼栋
          // this.getBuildListId(land.attributes.parcelNo);
          this.setParcelCode(land);
          this.setDetailAndStat('land', land);
        }
        if (building.show) {
          this.props.dispatch({
            type: 'House/SetTreeSelectedKeys',
            payload: {
              type: building.type,
              activeBuildId: building.id,
              activeLandId: land.id,
              bldgNo: building.attributes.bldgNo,
            },
            //[...treeSelectedKeys , `building${building.id}`]
          });
          this.setDetailAndStat('building', building);

          // 如果点选未查询到地块，则通过id查询地块
          if (land.id == -1) {
            this.getLandVecByBuildId(building);
          }
        }
        if (geo.show && !building.show) {
          this.showGeoFeature(geo);
          this.setDetailAndStat('other', geo, '详情信息');
        }
        this.setHouseBoxShow(true);
      } else if (geo.show) {
        this.showGeoFeature(geo);
        //更新点选对象属性
        this.setDetailAndStat('other', geo, '详情信息');
        // this.props.dispatch({
        //   type: 'House/setSelectObj',
        //   payload: {
        //     name:geo.name,
        //     address:geo.address,
        //     type:geo.type,
        //     show:true,
        //   }
        // })
      } else {
        // 此时关闭详情弹框
        this.props.dispatch({
          type: 'House/setDetailType',
          payload: {
            ...detailType,
            isRenderDetail: false,
          },
        });
        this.props.dispatch({
          type: 'House/setParcelCod',
          payload: undefined,
        });
        this.props.dispatch({
          type: 'House/setBldgNo',
          payload: undefined,
        });
        this.setHouseBoxShow(false);
        // if(geo.show){
        //   this.showGeoFeature(geo);
        //   //更新点选对象属性
        //   this.props.dispatch({
        //     type: 'House/setSelectObj',
        //     payload: {
        //       name:geo.name,
        //       address:geo.address,
        //       type:geo.type,
        //       show:true,
        //     }
        //   })
        //   return;
        // }
      }
    });
  };

  setHouseBoxShow = flag => {
    if (flag) {
      if (!this.state.isShowBg) {
        this.setState({
          isShowBg: true,
        });
      }
    } else {
      if (this.state.isShowBg) {
        this.setState({
          isShowBg: false,
        });
      }
    }
  };

  isOtherRender = props => {
    const { isRenderTree } = this.state;
    const { statType, detailType } = props ? props.House : this.props.House;
    if (statType.isRenderSubStat || detailType.isRenderDetail || isRenderTree) {
      return true;
    } else {
      return false;
    }
  };

  setParcelCode = land => {
    this.props.dispatch({
      type: 'House/setParcelCod',
      payload: land.attributes.parcelCode || land.attributes.parcelNo,
    });
    this.props.dispatch({
      type: 'House/setParcelId',
      payload: land.attributes.parcelNo,
    });
  };

  setDetailAndStat = (type, item, title) => {
    const { statType } = this.props.House;
    // 如果统计窗口未关闭，则关闭
    if (statType.isRenderSubStat) {
      this.props.dispatch({
        type: 'House/setStatType',
        payload: {
          ...statType,
          isRenderSubStat: false,
        },
      });
    }
    //显示楼栋详情
    this.props.dispatch({
      type: 'House/setDetailType',
      payload: {
        isRenderDetail: true,
        type: type,
        title: title || (type === 'building' ? '楼宇' : '土地'),
        info: item,
      },
    });
  };

  //查询楼所在的地，并加载显示。
  getLandVecByBuildId = async item => {
    let result = await getParcelByBuildId({ bldgNo: item.attributes.bldgNo });
    if (result.success && result.data) {
      this.showLandFeature(result.data, true);
      this.props.dispatch({
        type: 'House/setParcelCod',
        payload: result.data.attributes.parcelCode || result.data.attributes.parcelNo,
      });
      this.props.dispatch({
        type: 'House/setParcelId',
        payload: result.data.attributes.parcelNo,
      });
      this.props.dispatch({
        type: 'House/setActiveLandListId',
        payload: result.data.id,
      });
    } else {
      // 未查询到地块，清空地块code
      this.props.dispatch({
        type: 'House/setParcelCod',
        payload: undefined,
      });
    }
  };

  //获取build的索引
  getBuildListId = async parcelNo => {
    let buildList = await getBuildList({ parcelId: parcelNo });
    if (buildList.success && buildList.data && buildList.data.length !== 0) {
      let activeBuildIds = buildList.data.map(item => item.id);
      this.props.dispatch({
        type: 'House/setActiveBuildListId',
        payload: [...activeBuildIds],
      });
    }
  };

  // 点击地块后去查询
  getLandInfo = async dataParam => {
    let landInfo = await getLandBySpace(dataParam);
    if (landInfo.success && landInfo.data && landInfo.data.length !== 0) {
      let item = landInfo.data[0];
      // if(isLandShow || isBuildShow){
      // this.showLandFeature(item);
      // }

      // 先更新详情弹框的info
      // 再更新组件
      // this.props.dispatch({
      //   type: 'House/setParcelCod',
      //   payload: item.attributes.parcelCode || item.attributes.parcelNo
      // })
      // this.props.dispatch({
      //   type: 'House/setParcelId',
      //   payload: item.attributes.parcelNo
      // })
      this.props.dispatch({
        type: 'House/setActiveLandListId',
        payload: item.id,
      });
      // if(isLandShow && isBuildShow) return;
      // if(!isLandShow) {
      //   return Promise.resolve({"show":false,"type":"land","id":item.id,...item});
      // };
      return Promise.resolve({ show: true, type: 'land', id: item.id, ...item });
    } else {
      //选中地块数据为空时，列表索引为-1
      return Promise.resolve({ show: false, type: 'land', id: -1 });
    }
  };

  showLandFeature = (item, isRelated) => {
    let dataSource = new Cesium.CustomDataSource('landj');
    viewer.dataSources.add(dataSource);
    let positions = [];
    let location = {};
    try {
      location = JSON.parse(item.location);
      // hole=JSON.parse(holeGeometry);
      if (location.type === 'MultiPolygon') {
        positions = location.coordinates[0][0];
      } else if (location.type === 'Polygon') {
        positions = location.coordinates[0];
      }
    } catch (error) {
      console.log(item.location);
    }
    dataSource.entities.add({
      polyline: {
        positions: coordinatesArrayToCartesianArray(positions),
        material: isRelated
          ? Cesium.Color.fromCssColorString('#E1726F')
          : Cesium.Color.RED.withAlpha(1.0), //Cesium.Color.DIMGRAY.withAlpha(0.8),//Cesium.Color.fromRandom({alpha:1.0})Cesium.Color.DARKGRAY.withAlpha(0.0)
        classificationType: Cesium.ClassificationType.BOTH,
        clampToGround: true,
        width: 2,
      },
    });
    this.setExtraSource(dataSource);
  };

  getGeoInfo = async dataParam => {
    const { rightActiveKey: activeKey } = this.props.House;
    if (activeKey == 'query' || activeKey == 'mainStat') {
      return Promise.resolve({ show: false, type: 'geo' });
    }
    let geoInfo = await getGeoInfo(dataParam);
    if (geoInfo.success && geoInfo.data && geoInfo.data.length !== 0) {
      let item = geoInfo.data[0];
      // if(isBuildShow){
      // this.showGeoFeature(item);

      return Promise.resolve({ show: true, type: 'geo', ...item });
    }
    return Promise.resolve({ show: false, type: 'geo' });
  };

  showGeoFeature = data => {
    let dataSource = new Cesium.CustomDataSource('geoj');
    viewer.dataSources.add(dataSource);
    let positions = [];
    let location = {};
    try {
      location = JSON.parse(data.geom);
      if (location.type === 'MultiPolygon') {
        positions = location.coordinates[0][0];
      } else if (location.type === 'Polygon') {
        positions = location.coordinates[0];
      } else if (location.type === 'LineString') {
        positions = location.coordinates;
      }
    } catch (error) {
      console.log(data.geom);
    }
    positions = coordinatesArrayToCartesianArray(positions);
    if (data.type == 'LineString') {
      dataSource.entities.add({
        polyline: {
          positions: positions,
          material: Cesium.Color.fromCssColorString('#FEC205').withAlpha(0.6), //Cesium.Color.DIMGRAY.withAlpha(0.8),//Cesium.Color.fromRandom({alpha:1.0})Cesium.Color.DARKGRAY.withAlpha(0.0)
          classificationType: Cesium.ClassificationType.BOTH,
          clampToGround: true,
          outline: true,
          oultlineColor: Cesium.Color.BLACK,
          width: 5,
        },
      });
    } else {
      dataSource.entities.add({
        polygon: {
          hierarchy: {
            positions: positions,
          },
          material: Cesium.Color.fromCssColorString('#FEC205').withAlpha(0.6), //Cesium.Color.DIMGRAY.withAlpha(0.8),//Cesium.Color.fromRandom({alpha:1.0})Cesium.Color.DARKGRAY.withAlpha(0.0)
          classificationType: Cesium.ClassificationType.BOTH,
          clampToGround: true,
          width: 2,
        },
      });
    }
    this.setExtraSource(dataSource);
  };

  // 点击地块后去查询
  getBuildInfo = async dataParam => {
    // const {isBuildShow}=this.state;
    let buildInfo = await getBuildBySpace(dataParam);
    if (buildInfo.success && buildInfo.data && buildInfo.data.length !== 0) {
      let item = buildInfo.data[0];
      // if(isBuildShow){
      this.showBuildFeature(item);
      // }

      this.props.dispatch({
        type: 'House/setBldgKey',
        payload: item.attributes.key,
      });

      this.props.dispatch({
        type: 'House/setBldgNo',
        payload: item.attributes.bldgNo,
      });
      // 根据楼id联动房列表
      this.props.dispatch({
        type: 'House/setBasicBldgId',
        payload: item.attributes.bldgNo,
      });
      this.props.dispatch({
        type: 'House/setActiveBuildListId',
        payload: [item.id],
      });
      // if(!isBuildShow) {
      //   return Promise.resolve({"show":false,"type":"building","id":item.id,...item});
      // }

      return Promise.resolve({ show: true, type: 'building', id: item.id, ...item });
    }
    return Promise.resolve({ show: false, type: 'building' });
  };

  showBuildFeature = item => {
    let dataSource = new Cesium.CustomDataSource('buildingj');
    viewer.dataSources.add(dataSource);
    let positions = [];
    let location = {};
    try {
      location = JSON.parse(item.location);
      // hole=JSON.parse(holeGeometry);
      if (location.type === 'MultiPolygon') {
        positions = location.coordinates[0][0];
      } else if (location.type === 'Polygon') {
        positions = location.coordinates[0];
      }
    } catch (error) {
      console.log(item.location);
    }
    dataSource.entities.add({
      polygon: {
        hierarchy: {
          positions: coordinatesArrayToCartesianArray(positions),
        },
        material: Cesium.Color.fromCssColorString('#FEC205').withAlpha(0.6), //Cesium.Color.DIMGRAY.withAlpha(0.8),//Cesium.Color.fromRandom({alpha:1.0})Cesium.Color.DARKGRAY.withAlpha(0.0)
        classificationType: Cesium.ClassificationType.BOTH,
        clampToGround: true,
        width: 2,
      },
    });
    this.setExtraSource(dataSource);
  };

  componentWillUnmount() {
    // const {buildWMS,landWMS,tileset}=this.props.House;
    // viewer.dataSources.dataSourceAdded.removeEventListener(this.raiseBuild);
  //   this.props.dispatch({
  //     type: 'Home/setRightActiveKey',
  //     payload: '',
  //   });
  //   this.removeData();
  //   this.removeExtraSource();

  //  // viewer.scene.globe.depthTestAgainstTerrain = this.depthTest;
  //   this.unbindEvent();
  //   this.props.dispatch({
  //     type: 'House/clearAll',
  //     payload: '',
  //   });
  //   if (mars3d.point.windingPoint.isStart) {
  //     mars3d.point.windingPoint.stop();
  //   }
  }

  componentWillReceiveProps(newPorps) {
    const { houseHoldModel, isShowMainStat, isShowHouseBox } = this.props.House;
    const {
      houseHoldModel: newHouseHoldModel,
      isShowMainStat: newIsShowMainStat,
      isShowHouseBox: newIsShowHouseBox,
    } = newPorps.House;

    if (newHouseHoldModel && houseHoldModel !== newHouseHoldModel) {
      this.loadHousehold();
    }
    if (newIsShowHouseBox && newIsShowHouseBox !== isShowHouseBox) {
      if (!this.state.isShowBg) {
        this.setState({
          isShowBg: true,
        });
      }
    }
    if (!newIsShowHouseBox && newIsShowHouseBox !== isShowHouseBox) {
      if (this.state.isShowBg && !newIsShowMainStat) {
        this.setState({
          isShowBg: false,
        });
      }
    }
    if (newIsShowMainStat && isShowMainStat !== newIsShowMainStat) {
      if (!this.state.isShowBg) {
        this.setState({
          isShowBg: !this.state.isShowBg,
        });
      }
    }

    if (!newIsShowMainStat && isShowMainStat !== newIsShowMainStat) {
      if (this.state.isShowBg && !this.isOtherRender(newPorps)) {
        this.setState({
          isShowBg: !this.state.isShowBg,
        });
      }
    }
  }

  bindEvent = () => {
    //监听图层add事件，防止异步添加的图层，覆盖地楼房专题的WMS图层
    // viewer.imageryLayers.layerAdded.addEventListener(this.setMapMode);
    // viewer.imageryLayers.layerShownOrHidden.addEventListener(this.setMapMode);

    // //相机移动事件监听
    // viewer.scene.camera.moveEnd.addEventListener(debounces(this.cameraChangeEvent,500), this);

    //获取mars3d中统一的点击事件监听
    viewer.mars.popup.options.onLeftClick = event => {
      if (mars3d.point.windingPoint.isStart) {
        mars3d.point.windingPoint.stop();
        return;
      }
      if (this.holdIconhandler(event)) {
        return;
      }
      const { houseHoldModel, jdName, pickMode, isPick, detailType } = this.props.House;
      // const { toolsActiveKey } = this.props.Map;
      if (houseHoldModel) return;
      // if(!jdName) return;
      this.removeExtraSource();
      // 关闭属性框
      // this.props.dispatch({
      //   type: 'House/setParcelCod',
      //   payload: undefined
      // })
      // this.props.dispatch({
      //   type: 'House/setBldgNo',
      //   payload: undefined
      // })
      this.props.dispatch({
        type: 'House/setHouseId',
        payload: undefined,
      });
      // this.props.dispatch({
      //   type:'House/setStatType',
      //   payload:{
      //     isRenderSubStat:false,
      //   }
      // })

      // this.props.dispatch({
      //   type:'House/setDetailType',
      //   payload:{
      //     ...detailType,
      //     isRenderDetail:false,
      //   }
      // })
      //清空列表高亮选项
      this.props.dispatch({
        type: 'House/setActiveLandListId',
        payload: -1,
      });
      this.props.dispatch({
        type: 'House/setActiveBuildListId',
        payload: [-1],
      });
      this.props.dispatch({
        type: 'House/setActiveRoomListId',
        payload: -1,
      });
      //清空Tree列表高亮
      this.props.dispatch({
        type: 'House/SetTreeSelectedKeys',
        payload: -1,
      });
      //清空点选的geo信息
      this.props.dispatch({
        type: 'House/setSelectObj',
        payload: { show: false },
      });
      if (pickMode && isPick) {
        this.clickHandle(event);
        return;
      }
      // if(!jdName || !isPick) return;
      if (!isPick) return;
      this.clickHandle(event);
    };
  };

  holdIconhandler = event => {
    var position = event.position;
    var pickedObject;
    try {
      pickedObject = viewer.scene.pick(position);
    } catch (e) {
      return false;
    }
    if (
      Cesium.defined(pickedObject) &&
      Cesium.defined(pickedObject.id) &&
      pickedObject.id instanceof Cesium.Entity
    ) {
      var entity = pickedObject.id;
      // console.log(pickedObject);
      // 判定未分层分户标识
      if (
        pickedObject.primitive &&
        pickedObject.primitive instanceof Cesium.Billboard &&
        entity.name === 'household'
      ) {
        var bldgNo = entity.properties.getValue().bldgNo;
        var buildingId = entity.properties.getValue().buildingId;
        var bldgKey = entity.properties.getValue().key || 1; // 永久非永久
        bldgNo &&
          this.showFeature({
            type: 'building',
            bldgNo: bldgNo,
            bldgKey: bldgKey,
          });
        this.openHouseHold(buildingId);
        // 开启分层分户模式
        return true;
      }
    }
    return false;
  };

  showFeature = item => {
    this.removeExtraSource();
    switch (item.type) {
      case 'building':
        this.goDetailByHold(item);
        this.getBuildInfoByHold(item.bldgNo, item.bldgKey);
        break;
      default:
        break;
    }
  };

  //返回详情页面
  goDetailByHold = item => {
    const { detailType, statType } = this.props.House;
    let title = '土地';
    if (item.type === 'building') {
      title = '楼宇';
    } else if (item.type === 'room') {
      title = '房屋';
    }
    //需要同时更新parcelCod才能跳转，后面统一调整
    this.props.dispatch({
      type: 'House/setDetailType',
      payload: {
        ...detailType,
        isRenderDetail: true,
        type: item.type,
        title: title,
      },
    });
    if (statType.isRenderSubStat) {
      this.props.dispatch({
        type: 'House/setStatType',
        payload: {
          ...statType,
          isRenderSubStat: false,
        },
      });
    }
  };

  getBuildInfoByHold = async (bldgNo, bldgKey) => {
    let buildInfo = await getBuildById({ basicId: bldgNo, bldgKey: bldgKey });
    if (buildInfo.success && buildInfo.data) {
      //优先保存bldgKey的值 方便后续调用
      this.props.dispatch({
        type: 'House/setBldgKey',
        payload: buildInfo.data.attributes.key,
      });
      this.showBuildFeatureByHold(buildInfo.data);
    }
  };

  showBuildFeatureByHold = item => {
    let dataSource = new Cesium.CustomDataSource('buildingm');
    dataSource.show = false;
    viewer.dataSources.add(dataSource);
    let positions = [];
    let location = {};
    try {
      location = JSON.parse(item.location);
      // hole=JSON.parse(holeGeometry);
      if (location.type === 'MultiPolygon') {
        positions = location.coordinates[0][0];
      } else if (location.type === 'Polygon') {
        positions = location.coordinates[0];
      }
    } catch (error) {
      console.log(item.location);
    }
    dataSource.entities.add({
      polygon: {
        hierarchy: {
          positions: coordinatesArrayToCartesianArray(positions),
        },
        material: Cesium.Color.fromCssColorString('#FEC205').withAlpha(0.6), //Cesium.Color.DIMGRAY.withAlpha(0.8),//Cesium.Color.fromRandom({alpha:1.0})Cesium.Color.DARKGRAY.withAlpha(0.0)
        classificationType: Cesium.ClassificationType.BOTH,
        clampToGround: true,
        width: 2,
      },
    });
    // this.setExtraSource(dataSource);
    // let entity=dataSource.entities.values[0];
    let polyPositions = coordinatesArrayToCartesianArray(positions);
    let polyCenter = Cesium.BoundingSphere.fromPoints(polyPositions).center;
    // polyCenter = Cesium.Ellipsoid.WGS84.scaleToGeodeticSurface(polyCenter);
    let height = 150;
    viewer.scene.camera.flyToBoundingSphere(new Cesium.BoundingSphere(polyCenter, height * 3), {
      duration: 2,
    });
    //用于查询详情
    this.props.dispatch({
      type: 'House/setBldgNo',
      payload: item.attributes.bldgNo,
    });
    // 用于查询楼下面的列表--在详情页面中赋值
    this.getLandVecByHoldBuildId(item.attributes.bldgNo, dataSource);
  };
  //查询楼所在的地，并加载显示。
  getLandVecByHoldBuildId = async (bldgNo, buildSource) => {
    let result = await getParcelByBuildId({ bldgNo: bldgNo });
    if (result.success && result.data) {
      this.addLandVecByBuildHold(result.data, buildSource);
    } else {
      this.setExtraSource([buildSource]);
    }
  };
  addLandVecByBuildHold = (item, buildSource) => {
    // 设置地块code
    this.props.dispatch({
      type: 'House/setParcelCod',
      payload: item.attributes.parcelCode || item.attributes.parcelNo,
    });
    let dataSource = new Cesium.CustomDataSource('landByBuildId-m');
    dataSource.show = false;
    viewer.dataSources.add(dataSource);
    // this.dataSource=dataSource;
    // landData.map((item,index)=>{
    let positions = [];
    let location = {};
    let hole = {};
    try {
      location = JSON.parse(item.location);
      // hole=JSON.parse(holeGeometry);
      if (location.type === 'MultiPolygon') {
        positions = location.coordinates[0][0];
      } else if (location.type === 'Polygon') {
        positions = location.coordinates[0];
      }
    } catch (error) {
      console.log(item.location);
    }

    // var holes = [];
    // holes.push(
    //   new Cesium.PolygonHierarchy(
    //     coordinatesArrayToCartesianArray(holeGeometry.type==="MultiPolygon"?holeGeometry.coordinates[0][0]:holeGeometry.coordinates[0])
    //   )
    // );
    let entity = dataSource.entities.add({
      polyline: {
        //   hierarchy : {
        positions: coordinatesArrayToCartesianArray(positions),
        //   },
        material: Cesium.Color.RED.withAlpha(1.0), //Cesium.Color.DIMGRAY.withAlpha(0.8),//Cesium.Color.fromRandom({alpha:1.0})Cesium.Color.DARKGRAY.withAlpha(0.0)
        classificationType: Cesium.ClassificationType.BOTH,
        clampToGround: true,
        width: 3,
      },
    });
    this.setExtraSource([dataSource, buildSource]);
  };

  //开启分层分户模式
  openHouseHold = buildingId => {
    // this.setState({
    //   buildingId:buildingId
    // });
    this.props.dispatch({
      type: 'House/setBuildingId',
      payload: buildingId,
    });

    this.props.dispatch({
      type: 'House/setHouseHoldModel',
      payload: true,
    });

    // 查询对应的房列表
    this.props.dispatch({
      type: 'House/getHouseIdsByHold',
      payload: {
        buildingId: buildingId,
      },
    });
    // this.handleData(false);
  };

  //加载分层分户模型
  loadHousehold = id => {
    viewer.mars.popup.removeFeatureForImageryLayer(); //清除feature
    this.hideExtraSource();
  };

  setExtraSource = source => {
    const { extraSource } = this.props.House;
    let sources = [];
    if (extraSource && extraSource.length !== 0) {
      if (Object.prototype.toString.call(source) == '[object Array]') {
        //数组
        sources = extraSource.concat([...source]);
      } else {
        sources = extraSource.concat(source);
      }
    } else {
      if (Object.prototype.toString.call(source) == '[object Array]') {
        //数组
        sources = [...source];
      } else {
        sources = [source];
      }
    }
    // let sources=(extraSource && extraSource.length!==0 ) ? extraSource.concat(source) : [source];

    this.props.dispatch({
      type: 'House/setExtraSource',
      payload: sources,
    });
  };
  removeExtraSource = () => {
    const { extraSource } = this.props.House;
    if (extraSource && extraSource.length !== 0) {
      extraSource.map(item => {
        viewer.dataSources.remove(item);
      });
    }

    this.props.dispatch({
      type: 'House/setExtraSource',
      payload: undefined,
    });
  };

  hideExtraSource = () => {
    const { extraSource } = this.props.House;
    if (extraSource && extraSource.length !== 0) {
      extraSource.forEach(item => {
        item.show = false;
      });
    }
  };

  showExtraSource = () => {
    const { extraSource } = this.props.House;
    if (extraSource && extraSource.length !== 0) {
      extraSource.forEach(item => {
        item.show = true;
      });
    }
  };

  unbindEvent = () => {
    this.handler && this.handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK);
    // viewer.imageryLayers.layerAdded.removeEventListener(this.setMapMode);
    // viewer.imageryLayers.layerShownOrHidden.removeEventListener(this.setMapMode);
    viewer.mars.popup.options.onLeftClick = undefined;
  };

  //只加载街道范围的数据
  searchDataByRegion = name => {
    this.removeData();

    const { jdName, quName } = this.props.House;
    // 2、更新统计接口
    let param = {};
    if (jdName !== '') {
      param.jdName = jdName;
    } else if (quName !== '') {
      param.quName = quName;
    }
    this.props.dispatch({
      type: 'House/getParcelStatistics',
      payload: param,
    });
    this.props.dispatch({
      type: 'House/getBuildStatistics',
      payload: param,
    });
    this.props.dispatch({
      type: 'House/getPerpetualBuildStatistics',
      payload: {
        ...param,
        bldgKey: 1,
      },
    });
    this.props.dispatch({
      type: 'House/getUnperpetualBuildStatistics',
      payload: {
        ...param,
        bldgKey: 2,
      },
    });
    this.props.dispatch({
      type: 'House/getRoomStatistics',
      payload: param,
    });
    this.props.dispatch({
      type: 'House/getPopulationStatistics',
      payload: param,
    });
    this.props.dispatch({
      type: 'House/getLegalPersonStatistic',
      payload: param,
    });
    // 3、更新列表数据
    if (jdName === '') {
      return;
    }
    this.props.dispatch({
      type: 'House/getParcelList',
      payload: {
        jdName: jdName,
        // quName:quName
      },
    });
    // this.props.dispatch({
    //   type: 'House/getBuildList',
    //   payload: {
    //     jdName:jdName,
    //     // quName:quName
    //   }
    // })
  };

  removeData = () => {
    // 移除feature
   // viewer.mars.popup.removeFeatureForImageryLayer(); //
  };

  closeHouseOld = () => {
    this.showExtraSource();
    this.props.dispatch({
      type: 'House/setHouseHoldModel',
      payload: false,
    });
  };

  //子统计页面返回主统计页面的回调
  goBack = () => {
    // 加载主统计页面--销毁子统计页组件
    const { detailType } = this.props.House;
    this.props.dispatch({
      type: 'House/setDetailType',
      payload: {
        ...detailType,
        isRenderDetail: false,
      },
    });
  };

  //树结构返回统计信息
  switchTab = () => {
    const { isRenderTree } = this.state;
    if (!isRenderTree) {
      this.props.dispatch({
        type: 'House/setMainStat',
        payload: false,
      });
    }
    this.setState({
      isRenderTree: !isRenderTree,
    });
  };

  goTree = () => {
    const { detailType, statType } = this.props.House;
    // console.log(detailType,statType)
    this.setState(
      {
        isRenderTree: true,
      },
      () => {
        if (statType.isRenderSubStat) {
          this.props.dispatch({
            type: 'House/setStatType',
            payload: {
              ...statType,
              isRenderSubStat: false,
            },
          });
        }
        if (detailType.isRenderDetail) {
          this.props.dispatch({
            type: 'House/setDetailType',
            payload: {
              ...detailType,
              isRenderDetail: false,
            },
          });
        }

        this.props.dispatch({
          type: 'House/setMainStat',
          payload: false,
        });
        this.props.dispatch({
          type: 'House/setHouseBox',
          payload: true,
        });
      },
    );
  };

  //返回详情页面
  goDetail = () => {
    const { detailType, statType } = this.props.House;

    if (statType.isRenderSubStat) {
      this.props.dispatch({
        type: 'House/setStatType',
        payload: {
          ...statType,
          isRenderSubStat: false,
        },
      });
    }
    this.props.dispatch({
      type: 'House/setDetailType',
      payload: {
        ...detailType,
        isRenderDetail: true,
      },
    });
  };

  //返回统计页面--主页或者空间统计页面
  goStat = () => {
    // 如果是在空间统计模式下，返回空间的统计面板；否则返回全局统计页面
    const { detailType, rightActiveKey, spaceQueryParam } = this.props.House;
    const { isRenderTree } = this.state;

    if (detailType.isRenderDetail) {
      this.props.dispatch({
        type: 'House/setDetailType',
        payload: {
          ...detailType,
          isRenderDetail: false,
        },
      });
    }
    if (isRenderTree) {
      this.setState({
        isRenderTree: false,
      });
    }
    if (rightActiveKey !== 'query') {
      this.props.dispatch({
        type: 'House/setMainStat',
        payload: true,
      });
    }
    if (rightActiveKey === 'query' && spaceQueryParam) {
      //显示相关统计信息
      this.props.dispatch({
        type: 'House/setStatType',
        payload: {
          isRenderSubStat: true,
          type: 'query',
          title: '空间',
        },
      });
    }
  };

  goHome = () => {
    const { detailType, statType } = this.props.House;
    const { isRenderTree } = this.state;
    if (detailType.isRenderDetail) {
      this.props.dispatch({
        type: 'House/setDetailType',
        payload: {
          ...detailType,
          isRenderDetail: false,
        },
      });
    }
    if (statType.isRenderSubStat) {
      this.props.dispatch({
        type: 'House/setStatType',
        payload: {
          ...statType,
          isRenderSubStat: false,
        },
      });
    }
    if (isRenderTree) {
      this.setState({
        isRenderTree: false,
      });
    }
  };

  // goTree=()=>{
  //   this.setState({
  //     isRenderTree:true,
  //   });
  //   this.props.dispatch({
  //     type:'House/setStatType',
  //     payload:{
  //       isRenderSubStat:false,
  //     }
  //   })
  // }

  toggleHouseBox = () => {
    const { isRenderTree } = this.state;
    const { statType, detailType, isShowMainStat } = this.props.House;
    this.setState({
      isShowBg: !this.state.isShowBg,
    });
    if (!statType.isRenderSubStat && !detailType.isRenderDetail & !isRenderTree) {
      if (!isShowMainStat) {
        this.props.dispatch({
          type: 'House/setMainStat',
          payload: true,
        });
      }
    }
  };

  isAllRender = () => {
    const { isRenderTree } = this.state;
    const { statType, detailType, isShowMainStat } = this.props.House;
    if (
      !isRenderTree &&
      !statType.isRenderSubStat &&
      !detailType.isRenderDetail &&
      !isShowMainStat
    ) {
      return false;
    } else {
      return true;
    }
  };

  render() {
    const {
      landStatistic,
      buildStatistic,
      roomStatistic,
      populationStatistic,
      legalPersonStatistic,
      houseHoldModel,
      buildingId,
      statType,
      jdName,
      detailType,
      isShowMainStat,
    } = this.props.House;
    const { isRenderTree } = this.state;
    const {
      parcelCod,
      bldgNo,
      houseId,
      rightActiveKey: activeKey,
      spaceQueryParam,
    } = this.props.House;
    return (
      <div
        className={`${styles.houseBox} ${
          detailType.isRenderDetail && detailType.type === 'other' ? styles.other : ''
        }  ${this.state.isShowBg && this.isAllRender() ? styles.bgShow : styles.bgHide}`}
      >
        <>
          {statType.isRenderSubStat && !isShowMainStat && (
            <SubStat
              data={statType}
              goHome={() => this.goHome()}
              goDetail={() => this.goDetail()}
              goTree={() => this.goTree()}
            />
          )}
          {detailType.isRenderDetail && !isShowMainStat && (
            <DetailInfo data={detailType} goStat={() => this.goStat()} />
          )}
          {!detailType.isRenderDetail &&
            !isShowMainStat &&
            !statType.isRenderSubStat &&
            isRenderTree && <HouseTree goBack={() => this.goStat()} />}
          {activeKey === 'mainStat' && (
            <>
              <div className={`${styles.mainStatBox} ${isShowMainStat ? '' : styles.hide}`}>
                <ModuleTitle title="地楼房专题">
                  <RegionFilter searchData={this.searchDataByRegion.bind(this)} />
                </ModuleTitle>
                <div className={styles.scrollBox}>
                  {landStatistic && (
                    <DataPanel data={landStatistic} isExpand={false} hasExpand={true} />
                  )}
                  <SplitLine />
                  {buildStatistic && (
                    <DataPanel
                      data={buildStatistic}
                      hasSecondBuild={true}
                      type="Bar"
                      isExpand={false}
                    />
                  )}
                  <SplitLine />
                  {roomStatistic && <DataPanel data={roomStatistic} type="Bar" isExpand={false} />}
                  <SplitLine />
                  {populationStatistic && (
                    <DataPanel data={populationStatistic} type="Pieslice" isExpand={false} />
                  )}
                  <SplitLine />
                  {legalPersonStatistic && (
                    <DataPanel data={legalPersonStatistic} type="Bar" isExpand={false} />
                  )}
                  <SplitLine />
                </div>
                <div className={styles.footer}>
                  {jdName && (
                    <div className={styles.btn} onClick={() => this.goTree()}>
                      <span>查看列表</span>
                    </div>
                  )}
                  {activeKey === 'query' && spaceQueryParam && (
                    <div className={styles.btn} onClick={() => this.goStat()}>
                      <span>返回空间统计信息</span>
                    </div>
                  )}
                  {(parcelCod || bldgNo || houseId) && (
                    <div className={styles.btn} onClick={() => this.goDetail()}>
                      <span>返回详情信息</span>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
          {houseHoldModel && <HouseOld basicBldgId={buildingId} close={this.closeHouseOld} />}
          {activeKey === 'houseHoldStat' && <HouseHoldList />}
        </>
        {this.state.isShowBg === true ? (
          <div className={styles.hideBtn} onClick={this.toggleHouseBox}></div>
        ) : (
          (activeKey === 'mainStat' ||
            statType.isRenderSubStat ||
            detailType.isRenderDetail ||
            isRenderTree) && (
            <div className={styles.text} onClick={this.toggleHouseBox}>
              地楼房专题
            </div>
          )
        )}
      </div>
    );
  }
}

export default HouseSubject;
