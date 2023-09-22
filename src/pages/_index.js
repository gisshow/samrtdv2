import React, { Component } from 'react';
import styles from './styles.less';
import Header from './components/header';
import Tabs from './components/tabs';
import BaseMap from './components/baseMap';
import RightFloatMenu from './components/rightFloatMenu/index';
import Tools from './components/tools';
import LeftSider from './components/leftSider';
import RightSider from './components/rightSider';
import Undermessage from './components/undermessage';
import { getUserLicenseKey } from '@/service/global';
import { connect } from 'dva';
import CesiumMap from './components/cesiumMap';
import LayersManage from '@/pages/components/leftSider/components/layersManage';
import RightPanel from './components/rightPanel';
import BIMProjectManager from './components/BIMProjectManager';

@connect(({ Home }) => ({
  Home,
  Map,
}))
class Home extends Component {
  constructor(props) {
    super(props);
    this.state = {
      showLayersManage: false,
    };
    const { token } = props.location.query;
    token && window.localStorage.setItem('token', token);
  }

  async componentWillMount() {
    try {
      const licensekeyData = await getUserLicenseKey();
      const {
        data: {
          success,
          data: { licenseKey },
        },
      } = licensekeyData;
      if (success) {
        licenseKey && window.localStorage.setItem('userLicenseKey', licenseKey);
      }
    } catch (err) {
      console.log(err);
    }
  }

  componentDidMount() {
    const { dispatch } = this.props;
    dispatch({
      type: 'Global/getUserInfo',
    });
  }
  toggleLayersManage = () => {
    this.setState({
      showLayersManage: !this.state.showLayersManage,
    });
  };

  render() {
    let { leftActiveKey, buildingInfo } = this.props.Home;
    return (
      <div className={styles.container}>
        <CesiumMap />
        <Header  >
          <Tools />
        </Header>
        {/* <BaseMap /> */}
        {/* {leftActiveKey == 'floor' && <RightFloatMenu />} */}

        {/*{*/}
        {/*  <div className={`${styles.layerPosition} ${this.state.showLayersManage === true ? styles.LayersManageShow : styles.LayersManageHide}`}  style={{zIndex:2}}>*/}
        {/*    /!*<LayersManage show={leftActiveKey} />*!/*/}
        {/*    {this.state.showLayersManage === true ? <div className={styles.hideBtn} onClick={this.toggleLayersManage}></div>: <div className={styles.text} onClick={this.toggleLayersManage}>数据图层</div>}*/}
        {/*  </div>*/}
        {/*}*/}

        <LeftSider     />
        {leftActiveKey && <RightSider />}
        {buildingInfo && <Undermessage />}
        <RightPanel />
        {/* BIM项目管理器 */}
        <BIMProjectManager></BIMProjectManager>
      </div>
    );
  }
}

export default Home;
