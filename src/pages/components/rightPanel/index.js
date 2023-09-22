import React, { Component } from 'react';
import styles from './styles.less';
import { connect } from 'dva';
import Ztts from './components/ztts';
import Sqaq from './components/sqaq';
@connect(({ Home }) => ({
  Home
}))

class RightPanel extends Component {
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


  renderPannel = () => {
    let { leftActiveKey } = this.props.Home
    this.isKey = leftActiveKey;
    console.log(leftActiveKey)

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
    const { showLayersManage } = this.state;

    return (

      <>
        <div>
          {

            <div
              className={`${styles.rightPanel}  ${showLayersManage === true ? styles.LayersManageShow : styles.LayersManageHide}`}>
              {this.renderPannel()}

              {this.state.showLayersManage === true ?
                <div className={styles.hideBtn} onClick={this.toggleLayersManage}></div> :
                <div className={styles.text} onClick={this.toggleLayersManage}>信息面板</div>}
            </div>
          }

        </div>



      </>


    );


  }
}

export default RightPanel;
