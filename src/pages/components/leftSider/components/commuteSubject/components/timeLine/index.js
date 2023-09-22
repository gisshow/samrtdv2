/* global Cesium */
/* global viewer */
/* global mars3d */
import React, { Component } from 'react';
import styles from './style.less'
import RootContainer from '@/components/rootContainer'
import {Slider} from 'antd'
let marksLabel={};
for (let i = 1; i < 25; i++) {
    marksLabel[i]='';
}
class TimeLine extends Component {

    constructor(props) {
        super(props);
        this.state={
            currentTime:'',
            percent:0,
            marks:marksLabel,
        }
    }

    onTimeChange=(val)=>{
        const { startTime,endTime } = this.props;
        // console.log(val,100*val/24)
        this.setState({
            percent:100*val/24,
        })
        // let start = Cesium.JulianDate.fromIso8601(startTime.replace(/\s+/ig, 'T')).clone();
        // let stop = Cesium.JulianDate.fromIso8601(endTime.replace(/\s+/ig, 'T')).clone();
        // let detalSeconds=Cesium.JulianDate.secondsDifference(stop,start);
        // let currentTime= new Cesium.JulianDate();
        // Cesium.JulianDate.addSeconds(start,detalSeconds*val*0.01,currentTime);
        // Cesium.JulianDate.addHours(currentTime, 8, currentTime);
        // currentTime=currentTime.toString().substr(0,currentTime.toString().lastIndexOf(":"));
        this.setState({
            currentTime:'h'+val,
        })
        this.props.timeChange && this.props.timeChange('h'+val);
    }

    render() {
        const {percent,currentTime,marks}=this.state;
        const {startTime,endTime}=this.props;
        return (
            <RootContainer>
                <div className={styles.timeline}>
                    <div className={styles.timeContral}>
                        <Slider tooltipVisible={false} min={1} max={24} marks={marks}  onChange={this.onTimeChange}/>
                        <div className={styles.timeLabel}><span>{startTime}</span><span>{endTime}</span></div>
                        {/* <div className={styles.ruler}><span/><span/><span/><span/><span/></div> */}
                    </div>
                    {
                       percent>5 && percent!==100 && <div className={styles.timeBox} style={{left:`${percent}%`}}><span>{currentTime}</span></div>
                    }
                </div>
                
            
            </RootContainer>

        )
    }
}

export default TimeLine;