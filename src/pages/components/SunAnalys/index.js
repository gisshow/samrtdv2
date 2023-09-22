/* global Cesium */
import { Component } from 'react';
import { DatePicker, Slider, Icon } from 'antd';
import styles from './style.less';
import colorPost from '../cesiumMap/components/postProcess/post.js'; //颜色调整是后处理
import { connect } from 'dva';
import BorderPoint from '../border-point';
// import zhCN from 'antd/es/locale/zh_CN';
import moment from 'moment';
import 'moment/locale/zh-cn';
moment.locale('zh-cn');

function getNowFormatDate(newDate) {
  let date;
  if (newDate) {
    date = newDate;
  } else {
    date = new Date();
  }
  let seperator1 = '-';
  let month = date.getMonth() + 1;
  let strDate = date.getDate();
  if (month >= 1 && month <= 9) {
    month = '0' + month;
  }
  if (strDate >= 0 && strDate <= 9) {
    strDate = '0' + strDate;
  }
  let currentdate = date.getFullYear() + seperator1 + month + seperator1 + strDate;
  let number =
    (date.getHours() * 60 * 60 + date.getMinutes() * 60 + date.getSeconds()) / (24 * 60 * 60);
  return {
    nowData: date,
    number: number,
    secound: date.getHours() * 60 * 60 + date.getMinutes() * 60 + date.getSeconds(),
    currentDate: currentdate,
  };
}
function computesJulianDay(now) {
  let month = now.getUTCMonth() + 1;
  let day = now.getUTCDate();
  let year = now.getUTCFullYear();
  let extra = 100.0 * year + month - 190002.5;
  let rjd = 367.0 * year;
  rjd -= Math.floor((7.0 * (year + Math.floor((month + 9.0) / 12.0))) / 4.0);
  rjd += Math.floor((275.0 * month) / 9.0);
  rjd += day;
  rjd += 1721013.5;
  rjd -= (0.5 * extra) / Math.abs(extra);
  rjd += 0.5;
  return rjd;
}

@connect(({ Map }) => ({
  Map,
}))
class SunAnalys extends Component {
  constructor(props) {
    super(props);
    this.JulianDay = null;
    this.julianSecound = null;
    this.state = {
      time: '00 : 00',
      currentDate: getNowFormatDate().currentDate,
      rangeValue: getNowFormatDate().number * 1000000000,
    };
  }

  componentDidMount() {
    const viewer = window.viewer;
    let stage = undefined;
    if (!viewer.scene.postProcessStages.contains(colorPost)) {
      stage = viewer.scene.postProcessStages.add(colorPost);
    } else {
      stage = colorPost;
    }
    this.stage = stage;
    this.onTimeChange(this.state.rangeValue);
    viewer.shadows = true;
  }

  componentWillUnmount() {
    const viewer = window.viewer;
    viewer.shadows = false;
    if (this.stage) {
      this.stage.enabled = false;
    }
  }

  onTimeChange = val => {
    // const { viewer } = this.props;
    let value = val / 1000000000; //event.target.value/100;
    let hour = Math.floor(24 * value);
    hour = hour >= 10 ? hour : '0' + hour;
    let minute = Math.floor((24 * value - hour) * 60);
    minute = minute >= 10 ? minute : '0' + minute;
    let secound = Math.floor(((24 * value - hour) * 60 - minute) * 60);
    secound = secound >= 10 ? secound : '0' + secound;
    this.setState({
      time: hour + ' : ' + minute,
    });
    this.julianSecound = parseInt(hour) * 60 * 60 + parseInt(minute) * 60 + parseInt(secound);
    this.startAnalys(parseInt(hour));
  };

  startAnalys = hour => {
    if (!this.julianDay) {
      let nowCalender = getNowFormatDate().nowData;
      this.julianDay = computesJulianDay(nowCalender);
    }
    const viewer = window.viewer;
    // console.log(viewer);
    //console.log(julianSecound);
    if (this.julianSecound >= 28800) {
      viewer.clock.currentTime = new Cesium.JulianDate(this.julianDay, this.julianSecound - 28800);
    } else {
      viewer.clock.currentTime = new Cesium.JulianDate(
        this.julianDay - 1,
        this.julianSecound + 57600,
      );
    }
    if (hour < 6 || hour > 18) {
      this.stage.uniforms.brightness = 0.5;
    } else {
      this.stage.uniforms.brightness = 1.0;
    }
  };

  onDateChange = (date, dataString) => {
    // console.log(date, dataString);
    // const { viewer } = this.props;
    if (date) {
      this.julianDay = computesJulianDay(date._d); //计算得到日期
      this.startAnalys();
      // viewer.clock.currentTime= new Cesium.JulianDate(this.julianDay,this.julianSecound-28800);
    }
  };
  close = () => {
    this.props.dispatch({
      type: 'Map/setToolsActiveKey',
      payload: '',
    });
  };

  render() {
    const { time, currentDate, rangeValue } = this.state;
    // console.log(time, currentDate, rangeValue);
    return (
      <>
        <div className={styles.sunAnalys}>
          <BorderPoint />
          <div
            className={styles.close}
            onClick={() => {
              this.close();
            }}
          >
            <Icon type="close" />
          </div>
          {/* <span className={styles.play}></span> */}
          {/* <DatePicker defaultValue={moment(currentDate)} dropdownClassName={styles.dropdown} format='YYYY-MM-DD' onChange={this.onDateChange} /> */}
          <div className={styles.dayContral}>
            <DatePicker
              defaultValue={moment(currentDate)}
              dropdownClassName={styles.dropdown}
              format="YYYY-MM-DD"
              onChange={this.onDateChange}
            />
          </div>
          <div className={styles.timeContral}>
            <div className={styles.timeLabel}>
              <span>00 : 00 : 00</span>
              <span className="iconfont icon_sunrise"></span>
              <span className="iconfont icon_sunset"></span>
              <span>23 : 59 : 59</span>
            </div>
            <div className={styles.ruler}></div>
            <Slider
              tooltipVisible={false}
              max={1000000000}
              defaultValue={rangeValue}
              onChange={this.onTimeChange}
            />
            {/* <input className="slider" type="range" defaultValue={rangeValue} max={1} min={0} step={0.0000000001} onInput={this.onTimeChange} onChange={this.onTimeChange} /> */}
          </div>
          <div className={styles.timeBox}>
            <span>{time}</span>
          </div>
        </div>
      </>
    );
  }
}
export default SunAnalys;
