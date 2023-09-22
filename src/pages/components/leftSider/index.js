import React, { Component } from 'react'
import styles from './styles.less'
import { TABS_KEY } from '@/utils/config'
import { connect } from 'dva'
import Ztts from './components/ztts';
import Sqaq from './components/sqaq';
@connect(({ Home, LayerManager, House }) => ({
  Home, LayerManager, House
}))
class LeftSider extends Component {

  constructor(props) {
    super(props);
    this.state = {
      isLeftShow: true,
      showLayersManage: true
    }
    this.isKey = 'layers'
  }

  toggleLayersManage = () => {
    this.setState({
      showLayersManage: !this.state.showLayersManage
    })
  }




  componentDidMount() {

  }
  componentWillReceiveProps(newPorps) {
    const { leftActiveKey } = this.props.Home;
    let newKey = newPorps.Home.leftActiveKey;
    if (newKey !== leftActiveKey) {
      this.setState({
        isLeftShow: true
      })
    }
  }



  filter = () => {
    let { tabsActiveKey, leftActiveKey } = this.props.Home;//只保留一个icon,做面板的显示隐藏
    let list = TABS_KEY.filter((v) => {
      return tabsActiveKey.includes(v.key)
    })
    return [
      // {
      //   key: 'layers',
      //   name: '图层管理',
      //   icon: 'icon_datalayer'
      // },
      // {
      //   key: 'bim_scene',
      //   name: 'BIM场景',
      //   icon: 'icon_bim_scene'
      // },
      ...list
    ]
  }

  renderPannel = () => {
    let { leftActiveKey } = this.props.Home
    this.isKey = leftActiveKey;
 

    switch (leftActiveKey) {
      case 'ztts':
        return <Ztts />
     case 'sqaq':
          return <Sqaq />
      default:
        return null
    }
  }


  render() {

    const { isLeftShow, showLayersManage } = this.state;
    return (
      <>
        <div>
          {

            <div
              className={`${styles.layerPosition} ${isLeftShow === true ? styles.show : styles.hide}  ${showLayersManage === true ? styles.LayersManageShow : styles.LayersManageHide}`}>
              {this.renderPannel()}
              {this.state.showLayersManage === true ?
                <div className={styles.hideBtn} onClick={this.toggleLayersManage}></div> :
                <div className={styles.text} onClick={this.toggleLayersManage}>地楼房专题</div>}
            </div>
          }

        </div>



      </>
    );
  }
}

export default LeftSider
