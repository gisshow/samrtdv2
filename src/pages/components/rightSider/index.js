import React, { Component } from 'react';
import styles from './styles.less';
import { connect } from 'dva';
import { TABS_KEY } from '@/utils/config';
import TrafficForBus from './components/trafficForBus';
// import NewTrafficForCar from './components/newTrafficForCar';
import SafeForVideo from './components/safeForVideo';
import OceanForSea from './components/OceanForSea';

import HouseMenu from './components/houseMenu';

@connect(({ Home, House }) => ({
  Home, House,
}))

class RightSider extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isRightShow: true,
      showLayersManage: true,
    };
  }

  toggleLayersManage = () => {
    this.setState({
      showLayersManage: !this.state.showLayersManage,
    });
  };

  click = (key) => {
    const { rightActiveKey } = this.props.Home;
    const { isRightShow } = this.state;
    if (rightActiveKey === key) {
      if (isRightShow) {
        this.setState({
          isRightShow: false,
        });
      } else {
        this.setState({
          isRightShow: true,
        });
      }
      return;
    }
    this.setState({
      isRightShow: true,
    });
    this.props.dispatch({
      type: 'Home/setRightActiveKey',
      payload: key,
    });
  };

  filter = () => {
    let { leftActiveKey } = this.props.Home;
    let list = [];
    // console.log(TABS_KEY);
    
    TABS_KEY.forEach((v) => {
      leftActiveKey === v.key && list.push(...v.children);
    });
    return list;
  };

  search = (value) => {
    const { rightActiveKey } = this.props.Home;
    const { jdName } = this.props.House;
    if (!jdName || rightActiveKey === 'room') {
      return;
    }
    let typeFunName = (rightActiveKey === 'land' ? 'getParcelList' : 'getBuildList');

    if (value === '') {
      this.props.dispatch({
        type: 'House/' + typeFunName,
        payload: {
          jdName: jdName,
        },
      });
      return;
    }

    // let param=undefined;
    if (rightActiveKey === 'land') {
      this.props.dispatch({
        type: 'House/' + typeFunName,
        payload: {
          'basicId': value,
        },
      });
      // param= {
      //   "basicId":value,
      // }
    } else {
      this.props.dispatch({
        type: 'House/' + typeFunName,
        payload: {
          'jdName': jdName,
          'name': value,
        },
      });
      // param={
      //   "jdName":jdName,
      //   "name":value
      // }
    }
    // 数据过滤
    // this.props.dispatch({
    //   type: 'House/'+typeFunName,
    //   payload: param
    // })
  };

  OpenSpaceQuery = () => {
    this.props.dispatch({
      type: 'Map/setToolsActiveKey',
      payload: 'query',
    });
  };

  renderPannel = () => {
    let { rightActiveKey,leftActiveKey } = this.props.Home;
    const { jdName } = this.props.House;
    switch (rightActiveKey) {
      case 'bus':
        return <TrafficForBus/>;
      // case 'car':
      //   return <NewTrafficForCar/>;
      case 'video':
        return <SafeForVideo/>;
      case 'sea':
        return <OceanForSea/>;
      case 'land':
        // return <HouseForLand/>;
      case 'building':
        // return <HouseView/>;
        // if(jdName!==""){
        //   return <HouseForBuilding/>;
        // }else{
        //   return null;
        // }

      case 'room':
        // if(jdName!==""){
          // return <HouseMenu/>;
        // }else{
          return null;
        // }
      default:
        return null;
    }
  };

  render() {
    let { rightActiveKey, leftActiveKey } = this.props.Home;
    const { isRightShow, showLayersManage } = this.state;
    const { jdName } = this.props.House;
    let list = this.filter();
    return (
      <div
        className={`${styles.rightPanel}  ${(this.state.showLayersManage === true)  ? styles.LayersManageShow : styles.LayersManageHide}`}>
        {
          rightActiveKey && list.length &&
          <div className={`${styles.pannel} ${isRightShow === true ? '' : styles.hide}`}>
            {this.renderPannel()}
          </div>
        }
        {/* {
          leftActiveKey === 'house' && <div className={styles.searchBox}><SearchPanel onSearch={this.search}>
            <div className={styles.spaceQuery}><span className={`iconfont icon_multiselect ${styles.icon}`} title='框选'
                                                     onClick={() => this.OpenSpaceQuery()}/></div>
          </SearchPanel></div>
        } */}
        {/* {leftActiveKey !== 'floor' && leftActiveKey !== 'ocean' && leftActiveKey !== 'layers' && leftActiveKey !== 'house' && leftActiveKey !== 'traffic' && <div className={styles.box}>
          {
            list.map(item => {
              return (
                <div className={`${styles.item} ${item.key === rightActiveKey ? styles.active : ''}`}
                     key={item.key}
                     onClick={() => this.click(item.key)}
                >
                  <span>{item.name}</span>
                </div>
              );
            })
          }
        </div>} */}
        {leftActiveKey === 'house' && (showLayersManage ?
          <div className={styles.hideBtn} onClick={this.toggleLayersManage}></div> :
          <div className={styles.text} onClick={this.toggleLayersManage}>地楼房专题</div>)} 
      </div>
    );
  }
}

export default RightSider;
