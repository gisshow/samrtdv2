/* global Cesium */
/* global viewer */
/* global mars3d */
import React, { Component } from 'react'
import styles from './styles.less'
import { connect } from 'dva';
import SearchPanel from '@/components/searchPanel';
import { TABS_KEY } from '@/utils/config';
import HouseForLand from '../houseForLand';
import HouseForBuilding from '../houseForBuilding';
import HouseForRoom from '../houseForRoom';
import DetailInfo from './components/detailInfo';
import HouseTree from '../houseTree';

const TabKeys=[{
  name:"列表",
  key:"list",
},{
  name:"树状",
  key:"tree",
}]

@connect(({ House,Home }) => ({
  House,Home
}))
class HouseView extends Component {

  constructor(props){
    super(props);
    this.state={
      tabKey:"tree",//tree 列表形式
      showPanel:true,//伸缩面板
    }
    // this.treeList=React.createRef();

  }


  componentWillReceiveProps(newPorps){
    const {detailType:{isRenderDetail}} =this.props.House;
    let newIsRender=newPorps.House.detailType.isRenderDetail;

    if(!newIsRender && isRenderDetail!==newIsRender){
      this.reRenderList();
    }
  }

  search = (value) => {
    const { rightActiveKey } = this.props.Home;
    const { jdName } = this.props.House;
    if (!jdName || rightActiveKey === 'room') {
      return;
    }
    let typeFunName = (rightActiveKey === 'land' ? 'getParcelById' : 'getBuildList');

    if (value === '') {
      this.props.dispatch({
        type: 'House/getParcelList',
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
          'jdName': jdName,
        },
      });
    } else {
      this.props.dispatch({
        type: 'House/' + typeFunName,
        payload: {
          'jdName': jdName,
          'name': value,
        },
      });
    }

  };

  OpenSpaceQuery = () => {
    this.props.dispatch({
      type: 'Map/setToolsActiveKey',
      payload: 'query',
    });
  };

  filter = () => {
    let { leftActiveKey } = this.props.Home;
    let list = [];
    TABS_KEY.forEach((v) => {
      leftActiveKey === v.key && list.push(...v.children);
    });
    return list;
  };

  click = (key) => {
    const { rightActiveKey } = this.props.Home;
    // const { isRightShow } = this.state;
    if (rightActiveKey === key) {
    //   if (isRightShow) {
    //     this.setState({
    //       isRightShow: false,
    //     });
    //   } else {
    //     this.setState({
    //       isRightShow: true,
    //     });
    //   }
      return;
    }
    // this.setState({
    //   isRightShow: true,
    // });
    this.props.dispatch({
      type: 'Home/setRightActiveKey',
      payload: key,
    });
  };

  renderPannel = () => {
    let { rightActiveKey } = this.props.Home;
    const { jdName } = this.props.House;
    switch (rightActiveKey) {

      case 'land':
        return <HouseForLand onRef={node=>this.tableList=node}/>;
      case 'building':
        return <HouseForBuilding onRef={node=>this.tableList=node}/>;
      case 'room':
        return <HouseForRoom onRef={node=>this.tableList=node}/>;
      default:
        return null;
    }
  };

  switchTab=(key)=>{
    const {tabKey} =this.state;
    if(tabKey!==key){
      this.setState({
        tabKey:key,
      });
    }
  }

  //详情页面返回列表页
  goBack=()=>{
    const { rightActiveKey } = this.props.Home;
    const {detailType:{type}} =this.props.House;

    // 默认返回对应的tab
    // const {type} =this.props.data;
    if (rightActiveKey !== type && this.state.tabKey==="list") {
      this.props.dispatch({
        type: 'Home/setRightActiveKey',
        payload: type,
      });
    }
    this.props.dispatch({
      type:'House/setDetailType',
      payload:{
        isRenderDetail:false,
      }
    })
    // this.reRenderList();

  }

  //重新刷一下列表--display:none scrollTo不生效
  reRenderList=()=>{
    const {tabKey} =this.state;
    setTimeout(()=>{
      tabKey==="tree" && this.treeList && this.treeList.scrollTop();
      tabKey==="list" && this.tableList && this.tableList.handleScrollToElement();
    },500)
  }

  togglePanel = () => {
    this.setState({
      showPanel: !this.state.showPanel,
    });
  };

  switchIcon = (type)=>{
    switch (type) {
      case "parcel":
        return  <span className={`iconfont icon_earth ${styles.icon}`} />;
      case "noparcel":
        return  <span className={`iconfont icon_earth ${styles.icon}`} />;
      case "building":
        return  <span className={`iconfont icon_building2 ${styles.icon}`} />;
      case "house":
        return <span className={`iconfont icon_house ${styles.icon}`} style={{marginRight:"20px"}}/>;
      default:
        return <span className={`iconfont icon_earth ${styles.icon}`} />;
    }
  }


  render() {
    let { rightActiveKey, leftActiveKey } = this.props.Home;
    const {detailType,searchList} = this.props.House;
    const {tabKey,showPanel} =this.state;
    let list = this.filter();
    return (
      <>
        <div className={`${styles.panel} ${showPanel ? '' : styles.hide}`}>
          {/* <div className={styles.searchBox}>
            <SearchPanel onSearch={this.search}>
              <div className={styles.spaceQuery}>
                <span className={`iconfont icon_multiselect ${styles.icon}`} title='框选'
                      onClick={() => this.OpenSpaceQuery()}/>
              </div>
            </SearchPanel>
          </div> */}
          {searchList.length ? <>
              <div className={styles.searchList}>
                <div className={styles.close} onClick={()=>{    this.props.dispatch({
                  type:'House/getSearchList',
                  payload:{
                    keyword:"",
                  }
                })}}>【关闭】</div>
                <ul>{searchList && searchList.map((item) => {
                  return <li><span className={styles.name}> {this.switchIcon(item.type)}</span> <span
                    className={styles.address}>{item.address || '-----'}</span></li>;
                })}</ul>
              </div>
              }
            </>
            : <>
              {detailType.isRenderDetail && <DetailInfo data={detailType} goBack={() => this.goBack()}/>}
              <div className={`${styles.box} ${detailType.isRenderDetail ? styles.hide : ''}`}>
                <div className={styles.tab}>
                  {tabKey == 'list' &&
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
                  {tabKey == 'tree' &&
                  <div className={`${styles.item} ${styles.active}`}>
                    <span>{'树状'}</span>
                  </div>
                  }
                  <div className={styles.operate}>
                    {
                      TabKeys.map(item => {
                        return (<span className={`${item.key === tabKey ? styles.active : ''}`} key={item.key}
                                      onClick={() => this.switchTab(item.key)}>{item.name}</span>);
                      })
                    }
                  </div>
                </div>
                {tabKey == 'list' &&
                this.renderPannel()
                }
                {tabKey == 'tree' && <HouseTree onRef={(node) => {
                  this.treeList = node;
                }} hide={detailType.isRenderDetail}></HouseTree>}
                {showPanel &&
                <div className={styles.hideBtn} onClick={() => this.togglePanel()}></div>
                }
              </div>
              {
                !showPanel && <div className={styles.text} onClick={() => this.togglePanel()}>地楼房专题</div>
              }

            </>}

        </div>

      </>


    );
  }
}

export default HouseView;
