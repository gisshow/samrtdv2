/* global Cesium */
/* global viewer */
/* global mars */
/* global $ */
/* global mars3d */
/* turf */
/* echarts */
/* haoutil */

import React, { Component } from 'react';
import { message, Slider, Button, InputNumber, Table, Switch, Radio, Checkbox, Row, Col, Tree, Icon, Select, Tabs, Skeleton, Spin, Progress, Input, DatePicker } from 'antd'
import styles from './style.less'
import { connect, connectAdvanced } from 'dva';
import { PUBLIC_PATH } from '@/utils/config'
import { request } from '@/utils/request';
import Sider from 'antd/lib/layout/Sider';
import Item from 'antd/lib/list/Item';
import BorderPoint from '@/pages/components/border-point'
import { getCesiumUrl } from '@/utils/index';
import { PieChart, Axis, Tooltip, Legend, Coordinate, Interaction, Interval, registerShape } from 'bizcharts';
import moment from 'moment';
import 'moment/locale/zh-cn';
import locale from 'antd/es/date-picker/locale/zh_CN';
import list1 from './list1.json';
import list2 from './list2.json';
import locus from './locus.json';
moment.locale('zh-cn');


const Ajax = require('axios');

let shipVideo;
let handler;
let dataSource_gj, dataSource_gj_point, dataSource_ship;
const MenuTYPE = [
  {
    name: "渔船设备",
    key: "ship",
  }, {
    name: "渔港视频",
    key: "video"
  }
];

@connect((Fishing) => ({
  Fishing
}))
class FishingPort extends Component {
  constructor(props) {
    super(props);
    this.state = {
      shipDataList: null,
      menuType: 'ship',//默认职住
      isShowBg: true,

      shipSpinning: true,
      videoSpinning: true,
      ship_statistics: {
        ais: 0, beidou: 0, zaiku: 0, chuku: 0, zhengchang: 0, zhuxiao: 0
      },
      pageSize: 1, //
      preSelected: null,
      selectGJItem: null,//轨迹item
      highLightItem:null,//高亮item
      startTime: null,//moment('2020-05-06 12:00:00','YYYY-MM-DD HH:mm')
      endTime: null //moment('2021-05-08 00:00:00','YYYY-MM-DD HH:mm'),
    }
  }
  //进入
  async componentDidMount() {
    const { dispatch } = this.props
    const { pageSize } = this.state
    let data = await Ajax.get(`${PUBLIC_PATH}config/ship.json`);
    shipVideo = data.data
    dataSource_gj = new Cesium.CustomDataSource('shipgj');
    dataSource_gj_point = new Cesium.CustomDataSource('shipgj_point');
    dataSource_ship = new Cesium.CustomDataSource('ship');
    viewer.dataSources.add(dataSource_ship);
    viewer.dataSources.add(dataSource_gj);
    viewer.dataSources.add(dataSource_gj_point);

    // await this.getToken();  //临时屏蔽
    setTimeout(() => {
      //第一个请求先拿totalsize,然后取所有数据的列表
      this.initTable({ limit: pageSize }).then((res) => {
        return res && this.initStatistics(res)
      }).then(res => {
        res && this.initMap(res)
        // start new by zwpeng 2021.9.18
        // const { shipData } = this.props.Fishing.Fishing
        this.setState({
          shipDataList: res.list
        })
        // end new by zwpeng 2021.9.18
        // const { shipData } = this.props.Fishing.Fishing
        // this.setState({
        //   shipDataList: shipData.list
        // })
      })
    }, 1000)
  }
  //卸载
  componentWillUnmount() {
    dataSource_ship.entities.removeAll();
    dataSource_gj.entities.removeAll();
    dataSource_gj_point.entities.removeAll();
    viewer.dataSources.remove(dataSource_ship);
    viewer.dataSources.remove(dataSource_gj);
    viewer.dataSources.remove(dataSource_gj_point);
    handler && window.clearInterval(handler)
  }
  getToken = async () => {
    this.props.dispatch({
      type: 'Fishing/getToken',
    })
  }
  initStatistics = (res) => {
    const { totalCount } = res
    const { dispatch } = this.props
    return new Promise((resolve, reject) => {
     // start new by zwpeng 2021.9.18
      Promise.resolve(list2).then(res => {
        const { list } = res.page;
        let zaiku = list.filter((device) => device.deviceStatus == 0).length
        let chuku = list.filter((device) => device.deviceStatus == 1).length
        let zhengchang = list.filter((device) => device.deviceStatus == 2).length
        let zhuxiao = list.filter((device) => device.deviceStatus == 3).length
        // console.log(zaiku, chuku, zhengchang, zhuxiao)

        this.setState({
          shipSpinning: false,
          ship_statistics: {
            zaiku, chuku, zhengchang, zhuxiao
          }
        })
        resolve(res.page)
      })
      // end new by zwpeng 2021.9.18
      // dispatch({//取得分页表格数据
      //   type: 'Fishing/initShip',
      //   payload: { limit: totalCount, flag: 0 }
      // }).then(res => {
      //   const { list } = res
      //   let zaiku = list.filter((device) => device.deviceStatus == 0).length
      //   let chuku = list.filter((device) => device.deviceStatus == 1).length
      //   let zhengchang = list.filter((device) => device.deviceStatus == 2).length
      //   let zhuxiao = list.filter((device) => device.deviceStatus == 3).length
      //   // console.log(zaiku, chuku, zhengchang, zhuxiao)

      //   this.setState({
      //     shipSpinning: false,
      //     ship_statistics: {
      //       zaiku, chuku, zhengchang, zhuxiao
      //     }
      //   })
      //   resolve(res)
      // })
    })

  }

  initTable = (param) => {
    // start new by zwpeng 2021.9.18
    return  Promise.resolve(list1);
    // end new by zwpeng 2021.9.18
    // return new Promise((resolve, reject) => {
    //   this.props.dispatch({//取得分页表格数据
    //     type: 'Fishing/initShip',
    //     payload: { ...param }
    //   }).then(res => {
    //     resolve(res)
    //   })
    // })
  }

  initMap = (res) => {
    const { list: data } = res
    // console.log(data)
    dataSource_ship.entities.removeAll();

    data.forEach((item, index) => {
      //添加实体
      let position = JSON.parse(item.position)
      var entity = dataSource_ship.entities.add({
        id: item.id,
        name: item.shipName,
        position: Cesium.Cartesian3.fromDegrees(position.lng, position.lat, 5),
        billboard: {
          image: encodeURI(`${PUBLIC_PATH}config/images/ship_default.png`),
          scale: 0.5,  //原始大小的缩放比例
          horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          // heightReference: Cesium.HeightReference.CLAMP_TO_GROUND, //贴地
          scaleByDistance: new Cesium.NearFarScalar(1.5e2, 1.0, 8.0e6, 0.2),
          // disableDepthTestDistance: Number.POSITIVE_INFINITY, //一直显示，不被地形等遮挡 
        },
        label: {
          text: item.shipName,
          show: false,
          font: "normal small-caps normal 19px 楷体",
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          fillColor: Cesium.Color.AZURE,
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 2,
          horizontalOrigin: Cesium.HorizontalOrigin.LEFT,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          pixelOffset: new Cesium.Cartesian2(10, 0), //偏移量
          // heightReference: Cesium.HeightReference.CLAMP_TO_GROUND, //贴地
          distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0.0, 80000)
        },
        data: item,
        click: (entity) => {//单击
          // console.log(entity)
          this.showShipInfo(entity.id)
        },
        popup: {
          html: `<table style="width: 220px;margin: 20px 0 0 0;font-family: PingFangSC-Regular;height: 80px;
          font-size: 14px;
          color: #979FB0;
          font-weight: 400;"><tr>
          <td >渔船编号：</td><td >${item.shipCode}</td></tr><tr>
          <td >渔船名称：</td><td >${item.shipName}</td></tr><tr>
          <td >渔港编号：</td><td >${item.orgId}</td></tr><tr>
          <td >渔港名称：</td><td >${item.orgName}</td></tr><tr>
          <td >设备编码：</td><td >${item.deviceCode}</td></tr><tr>
          <td >设备状态：</td><td >${item.deviceStatus==0?'在库':(item.deviceStatus==1?'出库':(item.deviceStatus==2?'正常':'注销'))}</td></tr><tr>
          <td >设备类型：</td><td >${item.deviceType==0?'AIS':'北斗'}</td></tr><tr>
          <td >最后时间：</td><td >${item.lastPositionTime}</td></tr><tr>`,
          anchor: [100, -50],
        }
      });
    })
    viewer.flyTo(dataSource_ship.entities, { duration: 3 })

  }

  //船只点击弹框
  showShipInfo = (entityId) => {
    const { preSelected,shipDataList } = this.state

    let datasources = viewer.dataSources.getByName('ship')
    let datasource = datasources[0]
    let entities = datasource.entities
    let selected = entities.getById(entityId)
    viewer.mars.popup.show(selected, selected.position._value);
    selected.billboard.image = encodeURI(`${PUBLIC_PATH}config/images/ship_select.png`)
    if (preSelected !== null)
      preSelected.billboard.image = encodeURI(`${PUBLIC_PATH}config/images/ship_default.png`)

    let highLightItem = shipDataList.filter(s=>s.id===entityId)[0]
    this.setState({
      preSelected: selected,
      highLightItem,
    })
  }

  handgj = (item, idx) => {
    this.setState({
      selectGJItem: item,
      highLightItem:item,
    })
  }

  handdw = (item, idx) => {
    // console.log(item, idx)
    this.showShipInfo(item.id)

    let pos = JSON.parse(item.position)
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(pos.lng, pos.lat, 1000),
    })
    this.setState({
      highLightItem: item
    })
  }
  onInputFocus = ()=>{
    //关闭键盘事件
    this.doKeyEvent(false)
  }

  
  search_device = value => {
    // start new by zwpeng 2021.9.18
    const { list } = list2;
    Promise.resolve(list2).then((res)=>{
      const { list } = res.page;
      let arr_shipCode = list.filter(l => ((l.shipCode+'').indexOf(value) > -1))
      let arr_name = list.filter(l => ((l.shipName+'').indexOf(value) > -1))
      let arr_code = list.filter(l => ((l.deviceCode+'').indexOf(value) > -1))
      let arrs = [...arr_shipCode, ...arr_name, ...arr_code]
      //去重
      function arrDistinctByProp(arr, prop) {
        return arr.filter(function(item,index,self){
          return self.findIndex(el=>el[prop]==item[prop])===index
        })
      }
      let newArr = arrDistinctByProp(arrs,'id')
      this.setState({
        shipDataList:newArr
      },()=>{
          newArr.length===0 && message.warning('没有查询到结果！')
      })
    });
    
    // end new by zwpeng 2021.9.18
    // const { shipData:{list} } = this.props.Fishing.Fishing
    // let arr_shipCode = list.filter(l => ((l.shipCode+'').indexOf(value) > -1))
    // let arr_name = list.filter(l => ((l.shipName+'').indexOf(value) > -1))
    // let arr_code = list.filter(l => ((l.deviceCode+'').indexOf(value) > -1))
    // let arrs = [...arr_shipCode, ...arr_name, ...arr_code]
    // //去重
    // function arrDistinctByProp(arr, prop) {
    //   return arr.filter(function(item,index,self){
    //     return self.findIndex(el=>el[prop]==item[prop])===index
    //   })
    // }
    // let newArr = arrDistinctByProp(arrs,'id')
    // this.setState({
    //   shipDataList:newArr
    // },()=>{
    //     newArr.length===0 && message.warning('没有查询到结果！')
    // })
  }

  onInputBlur = () =>{
    // setTimeout(() => {
        //打开键盘事件
        this.doKeyEvent(true)
    // }, 2000)
  }

  //键盘事件开关
  doKeyEvent = (isActive) => {
    var isHomekeystop;
    if (!isActive) {
      isHomekeystop = true;
      viewer.mars.keyboardRoam.unbind();
    } else {
      isHomekeystop = false;
      viewer.mars.keyboardRoam.bind()
    }
    //控制键盘漫游是否开启
    this.props.dispatch({
      type: 'RightFloatMenu/setisHomekeystop',
      payload: isHomekeystop
    })
  }


  startTimeChange = (data) => {
    const { endTime } = this.state;
    let current = data
    if (endTime && endTime.isBefore(current)) {
      message.warning('起始时间大于终止时间，请重新选择！')
      this.setState({
        startTime: null
      })
    }else{
      this.setState({
        startTime: data
      })
    }

  }

  endTimeChange = (data) => {
    const { startTime } = this.state;
    let current = data
    if (startTime && current.isBefore(startTime)) {
      message.warning('终止时间小于起始时间，请重新选择！')
      this.setState({
        endTime: null
      })
    }else{
      this.setState({
        endTime: data
      })
    }
  }

  showGj = (flag) => {
    const { startTime, endTime, selectGJItem } = this.state;
    const { dispatch } = this.props
    // console.log(startTime, endTime, selectGJItem)
    if (!startTime || !endTime) {
      message.warning('请先设置起始时间');
    } else {
      let startDate = startTime.format("YYYY-MM-DD h:mm:ss")
      // startDate = startDate.replace('+',' ')
      let endDate = endTime.format("YYYY-MM-DD h:mm:ss")
      // endDate = endDate.replace('+',' ')
      // start new by zwpeng 2021.9.18
      Promise.resolve(locus).then(data => {
          data=data.list;
          if (data) {
            dataSource_gj.entities.removeAll()
            dataSource_gj_point.entities.removeAll()
            handler && window.clearInterval(handler)
            if(flag){
              this.addJtGj(data)
            }else{
              this.addDtGj(data)
            }
          } else {
            message.error('渔港GPS服务器错误');
          }
        })
      
      // end new by zwpeng 2021.9.18
      // dispatch({
      //   type: 'Fishing/shipmonitor',
      //   payload: { shipCode: selectGJItem.shipCode, startDate, endDate }
      // }).then(data => {
      //   if (data) {
      //     dataSource_gj.entities.removeAll()
      //     dataSource_gj_point.entities.removeAll()
      //     handler && window.clearInterval(handler)
      //     if(flag){
      //       this.addJtGj(data)
      //     }else{
      //       this.addDtGj(data)
      //     }
      //   } else {
      //     message.error('渔港GPS服务器错误');
      //   }
      // })
    }
  }

  addJtGj = data=>{
    const {selectGJItem} = this.state
    let pos = [];
    if(data.length===0){
      message.info('当前时间内无轨迹！')
      return
    }
    data.forEach((element,index) => {
      let ele = JSON.parse(element.position)
      pos.push(ele.lng, ele.lat, 10)
    });

    dataSource_gj.entities.removeAll()
    dataSource_gj.entities.add({
      id: 'line9999999999999',
      polyline: {
        positions: Cesium.Cartesian3.fromDegreesArrayHeights(pos),
        width: 3,
        material: new Cesium.PolylineDashMaterialProperty({
            color: Cesium.Color.YELLOW,
            dashPattern: parseInt("1010101010101010", 2)
        })
      },
    })
  }


  addDtGj = (data) => {
    const {selectGJItem} = this.state
    let pos = [], count = 0;
    if(data.length===0){
      message.info('当前时间内无轨迹！')
      return
    }
    data.forEach((element,index) => {
      let ele = JSON.parse(element.position)
      if(index%10==0){
        pos.push([ele.lng, ele.lat, ele.height])
      }
    });

    message.success('轨迹开始')
    handler = setInterval(() => {
      //加点
      dataSource_gj_point.entities.removeAll()
      let entity = dataSource_gj_point.entities.add({
        id: 'point'+count,
        position: Cesium.Cartesian3.fromDegrees(pos[count][0],pos[count][1],5),
        billboard: {
          image: encodeURI(`${PUBLIC_PATH}config/images/ship_select.png`),
          scale: 0.7,  //原始大小的缩放比例
          horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          // heightReference: Cesium.HeightReference.CLAMP_TO_GROUND, //贴地
          scaleByDistance: new Cesium.NearFarScalar(1.5e2, 1.0, 8.0e6, 0.2),
          // disableDepthTestDistance: Number.POSITIVE_INFINITY, //一直显示，不被地形等遮挡 
        },
        label: {
          text: selectGJItem.positionTime,
          show: true,
          font: "normal small-caps normal 19px 楷体",
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          fillColor: Cesium.Color.AZURE,
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 2,
          horizontalOrigin: Cesium.HorizontalOrigin.LEFT,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          pixelOffset: new Cesium.Cartesian2(10, 0), //偏移量
          // heightReference: Cesium.HeightReference.CLAMP_TO_GROUND, //贴地
          distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0.0, 80000)
        },
        data: selectGJItem,
        click: (entity) => {//单击
          // this.showShipInfo(entity.id)
        },
        popup: {
          html: `<table style="width: 220px;margin: 20px 0 0 0;font-family: PingFangSC-Regular;height: 80px;
          font-size: 14px;
          color: #979FB0;
          font-weight: 400;"><tr>
          <td >渔船编号：</td><td >${selectGJItem.shipCode}</td></tr><tr>
          <td >渔船名称：</td><td >${selectGJItem.shipName}</td></tr><tr>
          <td >渔港编号：</td><td >${selectGJItem.orgId}</td></tr><tr>
          <td >渔港名称：</td><td >${selectGJItem.orgName}</td></tr><tr>
          <td >设备编码：</td><td >${selectGJItem.deviceCode}</td></tr><tr>
          <td >设备状态：</td><td >${selectGJItem.deviceStatus==0?'在库':(selectGJItem.deviceStatus==1?'出库':(selectGJItem.deviceStatus==2?'正常':'注销'))}</td></tr><tr>
          <td >设备类型：</td><td >${selectGJItem.deviceType==0?'AIS':'北斗'}</td></tr><tr>
          <td >最后时间：</td><td >${selectGJItem.lastPositionTime}</td></tr><tr>`,
          anchor: [100, -50],
        }
      })
      //加线
      if(count!=0){
        dataSource_gj.entities.add({
          id: 'line'+count,
          polyline: {
            positions: Cesium.Cartesian3.fromDegreesArrayHeights([pos[count-1][0],pos[count-1][1],10,pos[count][0],pos[count][1],10]),
            width: 3,
            material: new Cesium.PolylineDashMaterialProperty({
                color: Cesium.Color.YELLOW,
                dashPattern: parseInt("1010101010101010", 2)
            })
          },
        })
      }
      viewer.mars.flyTo(entity,{radius:500})

      if(count >= pos.length-1){
        message.success('轨迹结束')
        window.clearInterval(handler)
      }
      count++;
    }, 4000);
  }

  closeGj = () => {
    this.setState({
      selectGJItem: null,//置空，去掉面板
      highLightItem:null,
    })
    dataSource_gj.entities.removeAll()
    dataSource_gj_point.entities.removeAll()
    handler && window.clearInterval(handler)
  }

  rebackGj = () =>{
    // start new by zwpeng 2021.9.18
    Promise.resolve(list2).then((res)=>{
      const { list } = res.page;
      this.setState({
        shipDataList:list
      })
    })
    // end new by zwpeng 2021.9.18
    // const { shipData:{list} } = this.props.Fishing.Fishing
    // this.setState({
    //   shipDataList:list
    // })
  }
  rebackDate = () => { //重置日期选择
    this.setState({
      startTime:null,
      endTime:null
    })
  }

  //渔港视频模块
  videoPosition = () => {

  }

  toggleBox = () => {
    this.setState({
      isShowBg: !this.state.isShowBg
    })
  }

  click = (key) => {
    this.setState({
      menuType: key
    });
  }

  render() {
    const { shipDataList, menuType, isShowBg, shipSpinning, videoSpinning, ship_statistics, preSelected, selectGJItem,highLightItem
      , startTime, endTime } = this.state
    const { zaiku, chuku, zhengchang, zhuxiao } = ship_statistics
    const { shipData } = this.props.Fishing.Fishing
    return (
      <>
        {/* <div className={styles.menu}>
          {
            MenuTYPE.map(item => {
              return <div className={`${styles.item} ${item.key === menuType ? styles.active : ''}`} key={item.key} onClick={() => this.click(item.key)}>
                {item.name}
                {item.key === menuType && <BorderPoint />}
              </div>
            })
          }
        </div> */}

        {
          menuType == 'ship' &&
          <div className={`${styles.board}  ${styles.panel}  ${this.state.isShowBg ? styles.bgShow : styles.bgHide}`} >
            <Spin spinning={shipSpinning} size="large">
              <div className={styles.shipdivce}><div className={styles.title}>渔船设备信息<BorderPoint /></div></div>
              <div className={styles.statistics}>
                <div className={`${styles.title}`}>渔船</div>
                <div className={`${styles.sub} ${styles.subFirst}`}>
                  <div span={8} className={`${styles.num} ${styles.firstNum}`}>{shipData && shipData.totalCount}</div>
                  <div className={styles.title}>渔船数量（艘）</div>
                </div>
                <div className={styles.sub}>
                  <div span={8} className={styles.num}>{zaiku}</div>
                  <div className={styles.title}>在库</div>
                </div>
                <div className={styles.sub}>
                  <div span={8} className={styles.num}>{chuku}</div>
                  <div className={styles.title}>出库</div>
                </div>
                <div className={styles.sub}>
                  <div span={8} className={styles.num}>{zhengchang}</div>
                  <div className={styles.title}>正常</div>
                </div>
                <div className={styles.sub}>
                  <div span={8} className={styles.num}>{zhuxiao}</div>
                  <div className={styles.title}>注销</div>
                </div>

                <div className={styles.split}>
                  <div className={styles.left}></div>
                  <div className={styles.bar}></div>
                  <div className={styles.right}></div>
                </div>

                <div className={styles.devicesearch}>
                  <div className={styles.title}>设施列表</div>
                  <div className={styles.search}><Input.Search placeholder={'请输入名称或编码'} onFocus={this.onInputFocus} onSearch={value => this.search_device(value)} onBlur={this.onInputBlur} /></div>
                  <div className={styles.reback} onClick={this.rebackGj}><span className={"iconfont" + ' ' + styles.icon}>&#xe61f;</span></div>
                </div>

                <div className={styles.shipList}>
                  {
                    shipDataList && shipDataList.map((item, idx) => {
                      return <div key={idx} className={styles.item}>
                        <div className={`${styles.num} ${highLightItem && (highLightItem.id == item.id) ?styles.selected:''}`}>{item.shipCode}</div>
                        <div className={`${styles.iteminfo} ${highLightItem && (highLightItem.id == item.id) ?styles.selected:''}`}>
                          <div className={styles.name}>{item.shipName}</div>
                          <div className={styles.code}>{item.deviceCode}</div>
                        </div>
                        <div className={`${styles.hand} ${highLightItem && (highLightItem.id == item.id) ?styles.selected:''}`}>
                          <div className={`${styles.liu} ${styles.gj}`}>
                            <div className={styles.one}></div>
                            <div className={styles.two}></div>
                            <div className={styles.three}></div>
                            <div className={styles.four} onClick={() => this.handgj(item, idx)}><span className={"iconfont" + ' ' + styles.icon + ' ' + `${item.id == '' ? styles.select : ''}`}>&#xe66d;</span></div>

                          </div>
                          <div className={`${styles.liu} ${styles.dw}`}>
                            <div className={styles.one}></div>
                            <div className={styles.two}></div>
                            <div className={styles.three}></div>
                            <div className={styles.five} onClick={() => this.handdw(item, idx)}><span className={"iconfont" + ' ' + styles.icon + ' ' + `${item.id == '' ? styles.select : ''}`}>&#xe65c;</span></div>
                          </div>
                        </div>
                      </div>
                    })
                  }
                </div>

                {selectGJItem &&
                  <div className={styles.gjPanel}>
                    <BorderPoint />
                    <div className={styles.one}>
                      <div className={styles.title}>历史轨迹</div>
                      <div className={styles.reback} onClick={this.rebackDate}><span className={"iconfont" + ' ' + styles.icon}>&#xe61f;</span></div>
                    </div>
                    <div className={styles.two}>
                      <DatePicker onChange={this.startTimeChange.bind(this)} locale={locale} showTime={{ format: 'HH:mm' }} format="YYYY-MM-DD HH:mm" placeholder={"请选择开始日期"} allowClear={false} value={startTime}/><span className={styles.line}>-</span><DatePicker onChange={this.endTimeChange.bind(this)} locale={locale} showTime={{ format: 'HH:mm' }} format="YYYY-MM-DD HH:mm" placeholder={"请选择结束日期"} allowClear={false} value={endTime}/>
                    </div>
                    <div className={styles.three}>
                      <div className={styles.showGj} onClick={()=> this.showGj(0)}>查看动态轨迹</div>
                      <div className={styles.showGj2} onClick={()=> this.showGj(1)}>查看静态轨迹</div>
                      <div className={styles.close} onClick={this.closeGj}>关闭</div>
                    </div>
                  </div>
                }
              </div>
            </Spin>
            {
              this.state.isShowBg === true ?
                <div className={styles.hideBtn} onClick={this.toggleBox}></div> :
                <div className={styles.text} onClick={this.toggleBox}>渔港GPS</div>
            }
          </div>
        }

        {
          menuType == 'video' &&
          shipVideo.map((item, idx) => {
            return <Row key={idx} className={styles.v_row}>
              <Col span={4}>{item.mum}</Col>
              <Col span={14}>{item.name}</Col>
              <Col span={6}><Icon type='right-circle' onClick={this.videoPosition} /></Col>
            </Row>
          })

        }

      </>
    );
  }
}

export default FishingPort;