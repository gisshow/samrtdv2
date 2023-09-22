/* global Cesium */
/* global viewer */
/* global mars3d */

import React, { Component } from 'react';
import styles from './style.less';
import { connect } from 'dva';
import HouseSearch from './components/house';
import CoordinateSearch from './components/coordinate';
import { PUBLIC_PATH } from '@/utils/config';

import BIMProject from '../../../BIMProjectManager/components/ProjectSearch';
import { act } from 'react-test-renderer';

const POIWidgetURL = `${PUBLIC_PATH}widgets/queryBaiduPOI/widget.js`;

/**
 * 下拉选项
 * 按顺序依次显示
 */
const OPTIONS = [
  { name: 'BIM项目', key: 'BIMProject' },
  { name: '地址', key: 'address' },
  // { name: '地楼房', key: 'house' },
  // { name: '坐标反查', key: 'coordinate' },
];
@connect(({ House }) => ({
  House,
}))
class SearchSider extends Component {
  constructor(props) {
    super(props);
    this.state = {
      activeKey: OPTIONS[0].key,
      activeValue: OPTIONS[0].name,
      openSelect: false, //搜索是否类别展开
    };
    // this.dataSources=[];
  }

  closePanel = () => {
    this.props.onClose && this.props.onClose();
  };

  componentDidMount() {
    if (OPTIONS[0].key === 'address') {
      this.activateWidget({
        name: '搜索',
        uri: POIWidgetURL,
      });
    }
  }

  componentWillUnmount() {
    if (mars3d.widget.isActivate(POIWidgetURL)) {
      mars3d.widget.disable(POIWidgetURL);
    }
  }

  activateWidget = item => {
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

  handleChange = item => {
    this.setState({
      activeKey: item.key,
      activeValue: item.name,
      openSelect: false,
    });
    if (item.key === 'address') {
      if (!mars3d.widget.isActivate(POIWidgetURL)) {
        mars3d.widget.activate({
          name: '搜索',
          uri: POIWidgetURL,
        });
      }
    } else {
      if (mars3d.widget.isActivate(POIWidgetURL)) {
        mars3d.widget.disable(POIWidgetURL);
      }
    }
  };

  toggleSelect = () => {
    const { openSelect } = this.state;
    this.setState({
      openSelect: !openSelect,
    });
  };

  render() {
    const { activeKey, openSelect, activeValue } = this.state;
    return (
      // <RootContainer>
      <>
        <div className={styles.searchSider}>
          <div className={styles.select}>
            <div className={styles.head}>
              <span className={styles.type}>{activeValue}</span>
              <span
                className={`iconfont  ${openSelect ? 'icon_fold2' : 'icon_unfold2'} ${styles.icon}`}
                onClick={() => this.toggleSelect()}
              ></span>
            </div>
            {openSelect && (
              <>
                <div className={styles.content}>
                  {OPTIONS.map(item => {
                    return (
                      <span key={item.key} onClick={() => this.handleChange(item)}>
                        {item.name}
                      </span>
                    );
                  })}
                </div>
              </>
            )}
          </div>
          {activeKey === 'house' && <HouseSearch />}
          {activeKey === 'coordinate' && <CoordinateSearch />}
          {activeKey === 'BIMProject' && <BIMProject></BIMProject>}
        </div>
      </>
      // </RootContainer>
    );
  }
}

export default SearchSider;
