/* global Cesium */
/* global viewer */
/* global mars3d */
import React, { Component } from 'react';
import styles from './styles.less';
import ButtonSwitching from './components/buttonSwitching';
import GeneralTools from './components/generalTools';
import Schools from './components/school';
import Periphery from './components/schoolPeriphery';
import Massif from './components/schoolMassif';
import Region from './components/schoolregion';
import { connect } from 'dva'
import {locationToPolygon} from '@/utils/index';

@connect(({ House,RightFloatMenu }) => ({
  House,RightFloatMenu
}))
class Education extends Component {

  constructor(props) {
    super(props);
    this.state = {
      isShowBg:true,//是否显示背景
      titleName:'schools',
      schoolShow:false, 
      schooltype:'built',
      landLocation:null,
      test:1
    };

  }

  componentDidMount() {
    console.log('titleName1',this.state.titleName)
    const {isDistrictStatActive} = this.props.RightFloatMenu;
    if (isDistrictStatActive) {
      this.props.dispatch({
        type:'RightFloatMenu/toggleMenu',
        payload:'isDistrictStatActive'
      })
    }
  }

  componentWillUnmount() {
    console.log('titleName2',this.state.titleName)
    this.props.dispatch({
      type: 'House/clearAll',
      payload: ''
    })
    const {isDistrictStatActive} = this.props.RightFloatMenu;
    if (isDistrictStatActive) {
      this.props.dispatch({
        type:'RightFloatMenu/toggleMenu',
        payload:'isDistrictStatActive'
      })
    }
  }
  
  componentWillReceiveProps(newPorps) {
    const {isSearchActive} = newPorps.RightFloatMenu;
    if(!isSearchActive){
      viewer.dataSources._dataSources.map((itme,index)=>{
        if(itme._name==='school_point'){
          // school_point=itme
          itme.show = true
        }
      })
    }
  }

  toggleSchool = () => {
    this.setState({
      schoolShow: true,
      isShowBg:true,
      titleName:'schools',
    })
  }

  schoolShow= () => {
    this.setState({
      schoolShow:false
    })
 }
  toggleBox = () => {

    this.setState({
      isShowBg: !this.state.isShowBg
    })
  }

  changeName= (name) => {
      this.setState({
        titleName: name,
        test:1
      })
  }

  buildState=(buildState)=>{
    this.setState({
      schooltype: buildState
    })
  }
  
  getLandLocation=(landResult)=>{
    this.setState({
      landLocation: landResult
    })
  }

  handleGetMsg=(value)=>{
    this.setState({
      test: value
    })
  }

  render() {
    const { schoolShow, schooltype,landLocation} = this.state;
    const {statType} = this.props.House;
    return (
        <>
          <ButtonSwitching  buildState={this.buildState.bind(this)} schoolShows={this.toggleSchool.bind(this)} schoolShow={this.schoolShow.bind(this)} getLandLocation={this.getLandLocation.bind(this)}/>
          <GeneralTools />
          {schoolShow === true ?
           <div className={`${styles.board}  ${this.state.isShowBg? styles.bgShow : styles.bgHide} ${this.state.titleName ==='periphery' && this.state.test == 1 ? styles.botton : ''} `}>
              
              {
                this.state.titleName ==='schools' && <Schools type={schooltype} changeName={this.changeName.bind(this)} landLocation={landLocation}/>
              }
              {
                this.state.titleName ==='periphery' && <Periphery getMsg={this.handleGetMsg} data={statType} landLocation={landLocation} changeName={this.changeName.bind(this)}/>
              }
              {
                this.state.titleName ==='massif' && <Massif changeName={this.changeName.bind(this)}/>
              }
              {
                this.state.titleName ==='region' && <Region changeName={this.changeName.bind(this)}/>
              }
              {
                this.state.isShowBg === true ?
                <div className={styles.hideBtn} onClick={this.toggleBox}></div> :
                <div className={styles.text} onClick={this.toggleBox}>教育专题</div>
              }
              
           </div>:''
          }
      
      </>      
    );
  }
}

export default Education
