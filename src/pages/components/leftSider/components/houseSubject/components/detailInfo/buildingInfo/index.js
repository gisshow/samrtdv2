/* global Cesium */
/* global viewer */
/* global mars3d */
/* global turf */
import React, { Component } from 'react';

import styles from './styles.less';
import { connect } from 'dva';
import { getBuild3DUrl, getBuildById } from '@/service/house';
let count = 0; //点击次数

@connect(({ House }) => ({
  House,
}))
class BuildingInfo extends Component {
  constructor(props) {
    super(props);
    this.state = {
      buildingInfo: {},
      houseHoldInfo: [],
      buildingId: undefined,
    };
  }

  componentDidMount() {
    const { basicId } = this.props;
    this.getBuildInfo(basicId);
    // this.getBuilding3DUrl();
  }

  // componentWillUnmount(){
  //   this.handleData(true);
  // }

  componentWillReceiveProps(newPorps) {
    const { bldgNo } = this.props.House;
    let newBldgNo = newPorps.House.bldgNo;

    if (newBldgNo && bldgNo !== newBldgNo) {
      this.getBuildInfo(newBldgNo);
    }
  }
  // 点击地块后去查询
  getBuildInfo = async basicId => {
    const { info } = this.props;
    const { bldgKey } = this.props.House;
    if (info && info.attributes && info.attributes.bldgNo === basicId) {
      this.getBuilding3DUrl(info);
      info.attributes.location = info.location;
      this.setState({
        buildingInfo: info.attributes,
      });
    } else {
      let buildInfo = await getBuildById({ basicId: basicId, bldgKey: bldgKey || 1 });
      if (buildInfo.success && buildInfo.data) {
        //根据objectid联动列表
        this.props.dispatch({
          type: 'House/setActiveBuildListId',
          payload: [buildInfo.data.id],
        });
        this.props.dispatch({
          type: 'House/setBldgHeight',
          payload: buildInfo.data.attributes.bldgHeight || 110,
        });
        // 根据楼id联动房列表
        this.props.dispatch({
          type: 'House/setBasicBldgId',
          payload: buildInfo.data.attributes.bldgNo,
        });

        // 将坐标赋值到attributes,后面同意放到model中
        buildInfo.data.attributes.location = buildInfo.data.location;
        // 永久与非永久建筑
        // buildInfo.data.attributes.bldgKey = 1;
        this.setState({
          buildingInfo: buildInfo.data.attributes,
        });
        this.getBuilding3DUrl(buildInfo.data);
        const { detailType } = this.props.House;
        if (detailType.type == 'building') {
          this.props.dispatch({
            type: 'House/setDetailType',
            payload: {
              ...detailType,
              info: buildInfo.data,
            },
          });
        }
      } else {
        this.setState({
          buildingInfo: {},
          houseHoldInfo: [],
        });
        // this.close();
      }
    }
  };

  getBuilding3DUrl = async data => {
    let basicBldgId = data.attributes.basicBldgId;
    let buildUrl = await getBuild3DUrl({ buildingId: basicBldgId });
    if (buildUrl.status === 'ok' && buildUrl.result.total !== 0) {
      let subBuildIds = [];
      buildUrl.result.data.map((item, index) => {
        let buildingId = item.attributes.buildingId;
        let name = buildingId.split('-');

        if (name.length > 1) {
          name = name[1] + '栋';
        } else {
          let name1 = buildingId.split('_');
          name = name1[2] ? name1[2] + '栋' : '主楼';
        }
        subBuildIds.push({ name: name, buildingId: buildingId });
      });
      this.setState({
        houseHoldInfo: subBuildIds,
      });
      this.props.dispatch({
        type: 'House/setHasHold',
        payload: true,
      });
      this.computeBldgHeight(data.location);
    } else {
      this.setState({
        houseHoldInfo: [],
      });
      this.props.dispatch({
        type: 'House/setHasHold',
        payload: false,
      });
    }
  };

  // 计算倾斜模型的高度--根据矢量面采样取最大高度
  computeBldgHeight = location => {
    let geo = JSON.parse(location);
    if (!geo) return;
    let polygon = undefined;
    if (geo.type === 'Polygon') {
      polygon = turf.polygon(geo.coordinates);
    } else if (geo.type === 'MultiPolygon') {
      polygon = turf.multiPolygon(geo.coordinates);
    }
    let bbox = turf.bbox(polygon);
    let points = turf.randomPoint(10, { bbox: bbox });
    // console.log(points);
    let features = points.features;
    let heights = [];
    for (let i = 0; i < features.length; i++) {
      const coordinates = features[i].geometry.coordinates;
      var position = Cesium.Cartesian3.fromDegrees(coordinates[0], coordinates[1]);
      let height = viewer.scene.sampleHeight(Cesium.Cartographic.fromCartesian(position));
      heights.push(height);
    }
    let bldgHeight = Math.max(...heights);
    this.props.dispatch({
      type: 'House/setBldgHeight',
      payload: bldgHeight || 110,
    });
    // 1、根据多边形计算边界bbox（确保精度，判断点十分在多边形内）
    // 2、随机生成10个点，看效率
    // 3、遍历获取点位处的高度
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
  //关闭分层分户模型
  closeHouseOld = () => {
    this.props.dispatch({
      type: 'House/setHouseHoldModel',
      payload: false,
    });
    // 清空分层分户列表
    this.props.dispatch({
      type: 'House/setHouseIdsByHold',
      payload: [],
    });
    // this.handleData(true);
  };

  handleData = flag => {
    const { buildWMS, buildSpecialWMS, landWMS } = this.props.House;
    if (buildWMS) {
      buildWMS.setVisible(flag);
    }
    if (buildSpecialWMS) {
      buildSpecialWMS.setVisible(flag);
    }
    if (landWMS) {
      landWMS.setVisible(flag);
    }
  };
  close = () => {
    this.props.dispatch({
      type: 'House/setBldgNo',
      payload: '',
    });
  };

  goParcel = () => {
    //弹出地块详情，清除列表高亮效果，清空地图高亮效果
    this.props.dispatch({
      type: 'House/setDetailType',
      payload: {
        isRenderDetail: true,
        type: 'land',
        title: '土地',
      },
    });
    this.props.dispatch({
      type: 'House/setActiveBuildListId',
      payload: [-1],
    });
    this.removeBuildingExtraSource();

    // 关闭分层分户模式
    this.props.dispatch({
      type: 'House/setHouseHoldModel',
      payload: false,
    });
  };

  removeBuildingExtraSource = () => {
    const { extraSource } = this.props.House;
    if (extraSource && extraSource.length !== 0) {
      extraSource.forEach(item => {
        item.show = true;
        if (item.name.substr(0, 5) == 'build') {
          viewer.dataSources.remove(item);
        }
      });
    }
  };

  goPOIStat = location => {
    this.props.goPOIStat && this.props.goPOIStat(location);
  };

  goPopulationStat = location => {
    this.props.goPopulationStat && this.props.goPopulationStat(location);
  };

  render() {
    const { buildingInfo = {}, houseHoldInfo = [], buildingId } = this.state;
    const { parcelCod } = this.props.House;
    return (
      <>
        <div className={styles.box}>
          {/* <div className={styles.close} onClick={()=>{this.close()}}>+</div> */}
          {/* <div className={styles.scrollBox}> */}
          <div className={styles.content}>
            <div className={styles.item}>
              <span className={styles.name}>楼宇编码:</span>
              <span className={styles.value}>{buildingInfo.bldgNo}</span>
            </div>

            {/* <div className={styles.item}>
                <span className={styles.name}>楼宇地址:</span>
                <span className={styles.value}>{buildingInfo.bldaddr}</span>
              </div> */}
            <div className={styles.group}>
              <div className={styles.item}>
                <span className={styles.name}>楼宇名称:</span>
                <span className={styles.value}>{buildingInfo.nowname}</span>
              </div>
              <div className={styles.item}>
                <span className={styles.name}>建筑占地面积:</span>
                <span className={styles.value}>{buildingInfo.bldgLdArea} m&sup2;</span>
              </div>
            </div>
            {/* <div className={styles.divider}></div> */}

            {/* <div className={styles.item}>
                <span className={styles.name}>性质/用途:</span>
                <span className={styles.value}>{buildingInfo.bldgUsageName}</span>
              </div> */}
            <div className={styles.group}>
              <div className={styles.item}>
                <span className={styles.name}>建设状态:</span>
                <span className={styles.value}>{buildingInfo.bldcondName}</span>
              </div>
              <div className={styles.item}>
                <span className={styles.name}>楼宇高度:</span>
                <span className={styles.value}>{buildingInfo.bldgHeight} m</span>
              </div>
            </div>
            <div className={styles.group}>
              <div className={styles.item}>
                <span className={styles.name}>详情地址:</span>
                <span className={styles.value} title={buildingInfo.bldaddr}>
                  {buildingInfo.bldaddr}
                </span>
              </div>
              <div className={styles.item}>
                <span className={styles.name}>是否永久建筑:</span>
                <span
                  className={styles.value}
                  title={
                    buildingInfo.key === 1 ? '永久建筑' : buildingInfo.key === 2 ? '非永久建筑' : ''
                  }
                >
                  {buildingInfo.key === 1 ? '永久建筑' : buildingInfo.key === 2 ? '非永久建筑' : ''}
                </span>
              </div>
            </div>

            {/* </div> */}
            <div className={styles.btn}>
              {parcelCod && <span onClick={() => this.goParcel()}>查看所在地块信息</span>}
            </div>
            <div className={styles.btn}>
              <span onClick={() => this.goPOIStat(buildingInfo.location)}>查看周边设施</span>
              <span onClick={() => this.goPopulationStat(buildingInfo.location)}>查看周边人口</span>
            </div>
          </div>
          {/* {houseHoldInfo && (
            <div className={styles.footer}>
              {houseHoldInfo.length === 1 && (
                <div
                  className={styles.btn}
                  style={{ marginRight: '10px' }}
                  onClick={() => this.openHouseHold(houseHoldInfo[0].buildingId)}
                >
                  查看分层分户
                </div>
              )}
              {houseHoldInfo.length !== 1 &&
                houseHoldInfo.map((item, index) => {
                  return (
                    <span key={index} onClick={() => this.openHouseHold(item.buildingId)}>
                      {item.name}
                    </span>
                  );
                })}
            </div>
          )} */}
        </div>
        {/* {houseHoldModel && <HouseOld basicBldgId={buildingId} close={this.closeHouseOld}/>} */}
      </>
    );
  }
}

export default BuildingInfo;
