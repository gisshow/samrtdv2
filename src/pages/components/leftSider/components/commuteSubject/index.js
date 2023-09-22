/* global Cesium */
/* global viewer */
/* global mars3d */
import React, { Component } from 'react'
import ModuleTitle from '@/components/moduleTitle'
import TimeLine from './components/timeLine'
import { connect } from 'dva';
import {DatePicker} from 'antd'
import styles from './styles.less'
import moment from 'moment';
import 'moment/locale/zh-cn';
import { request } from '@/utils/request';
import BorderPoint from '@/components/borderPoint'
import locale from 'antd/es/date-picker/locale/zh_CN';
import Board from './components/board';
moment.locale('zh-cn');
const MenuTYPE = [
  {
    name:"职住人口分析",
    key:"job",
  }
];

@connect(({ Commute,House }) => ({
  Commute,House
}))
class CommuteSubject extends Component {


  constructor(props) {
    super(props);
    this.state = {
      menuType:'job',//默认职住
      isShowBg:true,//是否显示背景
      startTime:'h1',
      endTime:'h24',
      currentTime:'h1',
      minRatio:0,
      maxRatio:1.0,
    };

  }
  componentDidMount() {
    // this.getCarData();
    // this.setTime();
    this.props.dispatch({
      type: 'House/setPickMode',
      payload: false
    })

    // 获取职住比统计信息--深圳市
    this.props.dispatch({
      type: 'Commute/getJobStat',
      payload:{
        area:'深圳市'
      }
    })
  }

  componentWillUnmount() {
    this.props.dispatch({
      type: 'Commute/clearAll',
    })
  }

  

  

  

  setTime=()=>{
    const {startTime,endTime}=this.state;
    let start = Cesium.JulianDate.fromIso8601(startTime.replace(/\s+/ig, 'T')).clone();
    let stop = Cesium.JulianDate.fromIso8601(endTime.replace(/\s+/ig, 'T')).clone();


    viewer.clock.startTime = start.clone();//{dayNumber: 2458755, secondsOfDay: 43237}
    viewer.clock.stopTime = start.clone.call(stop);
    viewer.clock.currentTime = start.clone();
    viewer.clock.clockRange = Cesium.ClockRange.LOOP_STOP;
    viewer.clock.multiplier = 5;

    viewer.clock.shouldAnimate = false;
  }

  setCurrentTime=(curTime)=>{
    // let currentTime=Cesium.JulianDate.fromIso8601(curTime).clone();
    // viewer.clock.currentTime = currentTime;
    this.setState({
      currentTime:curTime
    })
  }

  startTimeChange=(data,dataString)=>{
    // console.log(data,dataString);
    if(!data) return;
    // 比较大小
    const {startTime,endTime}=this.state;
    let start = Cesium.JulianDate.fromIso8601(dataString.replace(/\s+/ig, 'T')).clone();
    let stop = Cesium.JulianDate.fromIso8601(endTime.replace(/\s+/ig, 'T')).clone();
    if(Cesium.JulianDate.lessThan(start,stop)){
      this.setState({
        startTime:dataString+":00"
      },()=>{
        // this.getCarData();
      })
    }

  }

  endTimeChange=(data,dataString)=>{
    if(!data) return;
    // 比较大小
    const {startTime,endTime}=this.state;
    let start = Cesium.JulianDate.fromIso8601(startTime.replace(/\s+/ig, 'T')).clone();
    let stop = Cesium.JulianDate.fromIso8601(dataString.replace(/\s+/ig, 'T')).clone();
    if(Cesium.JulianDate.lessThan(start,stop)){
      this.setState({
        endTime:dataString+":00"
      },()=>{
        // this.getCarData();
      })
    }
  }


  setRatioNum=(minRatio,maxRatio)=>{
    this.setState({
      minRatio:Number(minRatio.toFixed(1)),
      maxRatio:Number(maxRatio.toFixed(1)),
    })
  }

  toggleBox = () => {
   
    this.setState({
      isShowBg: !this.state.isShowBg
    })
  }

  click =(key)=>{
    // const {jdName,quName} =this.props.House;
    // let param={};
    // if(jdName!==''){
    //   param.jdName=jdName;
    // }else if(quName!==''){
    //   param.quName=quName;
    // }
    // if(key=="job"){
    //   this.props.dispatch({
    //     type: 'Commute/getJobStat',
    //     payload: param,
    //   })
    // }else if(key=="fluid"){
    //   // 请求对应行政区的统计信息，不需要hover,默认时间点
    //   // this.props.dispatch({
    //   //   type: 'Commute/getFluidStat',
    //   //   payload: param,
    //   // })
    //   // 统计信息中包含了热力图的数据
    // }
    this.setState({
      menuType:key
    });
    // 按照当前的行政区，更新统计数据
  }

  render() {
    const {sum,startTime,endTime,currentTime,menuType,minRatio,maxRatio}=this.state;
    return (
        <>

          <div className={styles.menu}>
            {
              MenuTYPE.map(item=>{
                return  <div className={`${styles.item} ${item.key === menuType ? styles.active : ''}`} key={item.key} onClick={() => this.click(item.key)}>
                          {item.name}
                          {item.key === menuType && <BorderPoint/>}
                        </div>
              })
            }
          </div>
          {
            menuType==="fluid" && <>
              {/* <div className={styles.date}>
                <DatePicker onChange={this.startTimeChange.bind(this)} locale={locale} defaultValue={moment(startTime,'YYYY-MM-DD HH:mm')} showTime={{format:'HH'}} format="YYYY-MM-DD HH:mm" placeholder={"请选择开始日期"}/><span className={styles.line}>-</span><DatePicker onChange={this.endTimeChange.bind(this)} defaultValue={moment(endTime,'YYYY-MM-DD HH:mm')} locale={locale} showTime={{format:'HH'}} format="YYYY-MM-DD HH:mm" placeholder={"请选择结束日期"}/>
              </div> */}
              <TimeLine startTime={startTime} endTime={endTime} timeChange={(value)=>this.setCurrentTime(value)}/>
            </>
          }
          <div className={`${styles.board}  ${this.state.isShowBg? styles.bgShow : styles.bgHide}`}>
              {
                <Board type={menuType} hour={currentTime} setRatioNum={this.setRatioNum.bind(this)} title={menuType==="job"?'职住比排行看板':'人口数量排行看板'}/>
              }
              {
                this.state.isShowBg === true ?
                <div className={styles.hideBtn} onClick={this.toggleBox}></div> :
                <div className={styles.text} onClick={this.toggleBox}>通勤专题</div>
              }
              
          </div>
          {
            menuType==="job" && <div className={styles.legend}>
                <span className={styles.colorbox}></span>
                <span className={styles.item}>
                  <span className={styles.value}>{maxRatio}</span>
                  <span className={styles.value}>{((minRatio+maxRatio)/2).toFixed(1)}</span>
                  <span className={styles.value}>{minRatio}</span>
                </span>
            </div> 
          }
          
      </>      
    );
  }
}

export default CommuteSubject
