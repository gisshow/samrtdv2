/* global viewer */
import React, { Component } from 'react';
import styles from './styles.less';
import { connect } from 'dva';
import RootContainer from '@/components/rootContainer';
import { PUBLIC_PATH } from '@/utils/config';
import { Icon } from 'antd';
import BorderPoint from '../border-point';
const Ajax = require('axios');

const ToolItems = [
  {
    name: '光照模拟',
    key: 'sunAnalys',
    icon: 'icon_light',
  },
  // {
  //   name:'漫游',
  //   key:'roam',
  //   icon: 'icon_huabanbeifen2'
  // },
  // {
  //   name:'自动漫游',
  //   key:'automaticroam',
  //   icon: 'icon_navigation'
  // },
  {
    name: '后处理',
    key: 'postProcess',
    icon: 'icon_adjust',
  },
  // {
  //   name:'空间标记',
  //   key:'spaceMark',
  //   icon: 'icon_space-mark'
  // },
  // {
  //   name:'视角书签',
  //   key:'perBookmark',
  //   icon: 'icon_visual-angle'
  // },
  {
    name: '天气',
    key: 'weather',
    icon: 'icon_weather1',
    type: 'widget',
    uri: `${PUBLIC_PATH}widgets/weather/widget.js`,
  },
  {
    name: '鹰眼',
    key: 'hawkeye',
    icon: 'icon_eagleeye',
    type: 'widget',
    uri: `${PUBLIC_PATH}widgets/hawkeye/widget.js`,
  },
  // {
  //   name:'搜索',
  //   key:'search',
  //   icon: 'icon_search1',
  //   type:'widget',
  //   uri:`${PUBLIC_PATH}widgets/queryBaiduPOI/widget.js`
  // },
  // {
  //   name: '分层分户测试',
  //   key: 'houseHold',
  //   icon: 'icon_space-mark',
  // },
  //  {
  //   name:'地下工具',
  //   key:'pipeline',
  //   icon: 'icon_underground',
  // },
  // {
  //   name:'测量工具',
  //   key:'measure',
  //   icon: 'icon_measure',
  // },
  {
    name: '可视域',
    key: 'visualAnalys',
    icon: 'icon_range',
  },
  {
    name: '时序播放',
    key: 'timelinePlay',
    icon: 'icon_underground',
  },
  {
    name: '性能评测',
    key: 'performanceMonitor',
    icon: 'icon_underground',
  },

  {
    name: '量测',
    key: 'measure',
    icon: 'icon_measure1',
  },
  {
    name: '空间标记',
    key: 'spaceMark',
    icon: 'icon_spacamark',
  },
  {
    name: '分层分户标注',
    key: 'houseHoldStat',
    icon: 'icon_showmark',
  },
  {
    name: 'VR',
    key: 'vr',
    icon: 'icon_vr',
  },
  {
    name: '剖切',
    key: 'landCutting',
    icon: 'icon_rolling-shutter',
  },
  {
    name: '压平',
    key: 'flattening',
    icon: 'icon_rolling-shutter',
  },
  {
    name: '全景',
    key: 'panoramicView',
    icon: 'icon_showmark',
  },
  {
    name: 'BIM项目',
    key: 'addbim',
    icon: 'icon_huabanbeifen3',
  },
  {
    name: '天际线',
    key: 'skyline',
    icon: 'icon_underground',
  },
  {
    name: '坐标转换',
    key: 'coordinateConvert',
    icon: 'icon_spacamark',
  },
  {
    name: 'BIM模型展开',
    key: 'Fcfh',
    icon: 'icon_layers',
  },


];
@connect(({ Map, RightFloatMenu, Global, House }) => ({
  Map,
  RightFloatMenu,
  Global,
  House,
}))
class Tools extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isOpen: false,
    };
  }

  click = (key, item) => {
    if (item.type == 'widget') {
      this.activeItem(item);
    } else {
      this.props.dispatch({
        type: 'Map/setToolsActiveKey',
        payload: key,
      });
      if (key == 'houseHoldStat') {
        const { rightActiveKey: activeKey } = this.props.House;
        if (activeKey !== 'houseHoldStat') {
          this.props.dispatch({
            type: 'House/setRightActiveKey',
            payload: 'houseHoldStat',
          });
        } else {
          this.clearHoldStat();
          return;
        }
        this.props.dispatch({
          type: 'House/setHouseHoldStat',
          payload: true,
        });
      }
      if (key == 'panoramicView') {
        this.clearPanoramicView();
      }
    }
  };

  clearHoldStat = () => {
    this.props.dispatch({
      type: 'House/setHouseHoldStat',
      payload: false,
    });
    this.props.dispatch({
      type: 'House/setRightActiveKey',
      payload: '',
    });
  };

  clearPanoramicView = () => {
    const { panoramicViewdataSource } = this.props.House;
    if (Object.keys(panoramicViewdataSource).length > 0) {
      viewer.dataSources.remove(panoramicViewdataSource, true);
      this.props.dispatch({
        type: 'House/setRightActiveKey',
        payload: '',
      });
      this.props.dispatch({
        type: 'House/savePanoramicViewdataSource',
        payload: {},
      });
    } else {
      return;
    }
  };

  activeItem = item => {
    const uri = item.uri;
    /*global mars3d*/
    if (mars3d.widget.isActivate(uri)) {
      mars3d.widget.disable(uri);
    } else {
      var opt = {};
      opt.uri = uri;
      opt.name = item.name;
      mars3d.widget.activate(opt);
    }
  };

  openPannel = () => {
    const { isOpen } = this.state;
    this.setState({
      isOpen: !isOpen,
    });
  };
  getAuths() {
    let obj = {
      init: true,
      sunAnalys: true,
      postProcess: true,
      weather: true,
      hawkeye: false,
      visualAnalys: false,
      MapMark: false,
      MapMeasure: true,
      houseHoldStat: false,
      houseHold: true,
      vr: true,
      landCutting: false,
      Fcfh:true,

    };
    try {
      const {
        pageAuths: {
          CityDisplay: { MapTools },
        },
      } = this.props.Global;
      return { ...obj, ...MapTools };
    } catch (err) {
      return obj;
    }
  }
  render() {
    const { toolsActiveKey } = this.props.Map;
    const auths = this.getAuths();
    const { isOpen } = this.state;
    return (
      <>
        {auths.init ? (
          <div className={`${styles.box} ${isOpen ? styles.select : ''}`}>
            <div className={styles.btn} onClick={() => this.openPannel()}>
              <BorderPoint />
              <span className={`iconfont icon_tools ${styles.icon}`} />
              <span>工具</span>
              <span className="icon iconfont icon_unfold1"></span>
            </div>
            <div className={styles.pannel}>
              {ToolItems.map((item, index) => {
                if (auths[item.key]) {
                  return (
                    <div
                      className={`${styles.item} ${
                        item.key === toolsActiveKey ? styles.select : ''
                      }`}
                      key={item.key}
                      onClick={() => this.click(item.key, item)}
                    >
                      <span className={`iconfont ${item.icon} ${styles.icon}`} />
                      <span>{item.name}</span>
                    </div>
                  );
                } else {
                  return null;
                }
              })}
            </div>
          </div>
        ) : null}
      </>
    );
  }
}
export default Tools;
