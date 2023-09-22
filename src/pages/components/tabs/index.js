/* global Cesium */
/* global viewer */
import React, { Component } from 'react'
import styles from './styles.less'
import { connect } from 'dva'
import { TABS_KEY } from '@/utils/config'
import { PUBLIC_PATH } from '@/utils/config'
import { Modal, Button } from 'antd';


@connect(({ Home, RightFloatMenu, Global }) => ({
  Home, RightFloatMenu, Global
}))
class Tabs extends Component {
  click = (key) => {
    const mars3d = window.mars3d
    this.props.dispatch({
      type: 'Home/setTabsActiveKey',
      payload: key
    })

    var oceanUri = `${PUBLIC_PATH}widgets/zhuanTi/widget.js`;
    var oceanwave = `${PUBLIC_PATH}widgets/oceanwave/widget.js`;
    var oceansite = `${PUBLIC_PATH}widgets/oceansite/widget.js`;
    var oceanspeed = `${PUBLIC_PATH}widgets/oceanspeed/widget.js`;
    var iframeView = `${PUBLIC_PATH}widgets/iframeView/widget.js`;

    if (key==='cqzg' || key==='zylt1') {
      oceanUri =  `${PUBLIC_PATH}widgets/iframeView/widget.js`
      mars3d.widget.activate({
        uri: oceanUri,
        "autoDisable": false,
        "disableOhter": false,
        iframesrc:key==='cqzg'?'http://10.89.10.50:8080/changqiang/index.html':'http://172.16.133.216:8081/index.html'
      });
      return
    }
    if (key == "ocean") {
      mars3d.widget.activate({
        uri: oceanUri,
        "autoDisable": false,
        "disableOhter": false,
      });
    } else {
      mars3d.widget.disable(iframeView);
      if (mars3d.widget.isActivate(oceanUri)) {
        mars3d.widget.disable(oceanUri);
      }
      mars3d.widget.disableAll(oceanwave);
      mars3d.widget.disableAll(oceansite);
      mars3d.widget.disableAll(oceanspeed);
    }

    // this.hidedivorpolygon();

    const { isSearchActive } = this.props.RightFloatMenu
    const uri = `${PUBLIC_PATH}widgets/queryBaiduPOI/widget.js`

    if (isSearchActive) {
      this.props.dispatch({
        type: 'RightFloatMenu/toggleMenu',
        payload: 'isSearchActive'
      })
      if (mars3d.widget.isActivate(uri)) {
        mars3d.widget.disable(uri);
      }
    }
    // setTimeout(() => {
    //   this.props.dispatch({
    //     type: 'RightFloatMenu/setLayer',
    //     payload: {
    //       key: 'scence',
    //       value: key,
    //     }
    //   });
    // }, 500);
  }

  hidedivorpolygon = () => {
    var FParentpolygon = viewer.entities.getById("FParentpolygon")
    var CutParentpolygon = viewer.entities.getById("CutParentpolygon")
    if (FParentpolygon) {
      FParentpolygon.show = false;
    }
    if (CutParentpolygon) {
      CutParentpolygon.show = false;
    }
    if (window.T3DTilesetList) {
      for (var i = 0; i < window.T3DTilesetList.length; i++) {
        window.T3DTilesetList[i].divpoint.visible = false;
      }
    }
  }

  toggleNav = () => {
    this.props.dispatch({
      type: 'Home/toggleNav',
    })
  }

  render() {
    let { tabsActiveKey, isShowNav } = this.props.Home
    console.log(tabsActiveKey);
    
    let { pageAuths } = this.props.Global
    let showTabs = ['floor', 'cqzg', 'zylt1']
    return (
      <div className={`${styles.box} ${!isShowNav ? '' : styles.hide}`}>
        <div className={styles.tabs}>
          {
            TABS_KEY.map(item => {
              if (!showTabs.includes(item.key)) {
                if (pageAuths && pageAuths[item.key] && item.key !== "house") {//过滤掉地楼房的tab

                } else {
                  return null
                }
              }
              let isActive = (tabsActiveKey.includes("house") && item.key === 'floor') ? true : tabsActiveKey.includes(item.key);
              return (
                <div className={`${styles.item} ${isActive ? styles.active : ''}`}
                  key={item.key}
                  onClick={() => {
                    if (!tabsActiveKey.includes(item.key)) {
                      this.click(item.key)
                    }
                  }}
                >
                  <span>{item.name}</span>
                </div>
              )
            })
          }
        </div>
        {/* <div className={styles.opera} onClick={this.toggleNav} /> */}
      </div>
    );
  }
}

export default Tabs
