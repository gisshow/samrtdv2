/* global Cesium */
/* global viewer */
/* global mars3d */
import React, { Component } from 'react';
import styles from './style.less'
import RootContainer from '@/components/rootContainer'
import {Slider} from 'antd'

class TimeLine extends Component {

    constructor(props) {
        super(props);
        this.state={
            currentTime:'',
            percent:0,
            marks:{
                0:'',
                20:'',
                40:'',
                60:'', 
                80:'',             
                96:'',
            }
        }
    }

    onTimeChange=(val)=>{
        const { startTime,endTime } = this.props;
        // console.log(val)
        this.setState({
            percent:val,
        })
        let start = Cesium.JulianDate.fromIso8601(startTime.replace(/\s+/ig, 'T')).clone();
        let stop = Cesium.JulianDate.fromIso8601(endTime.replace(/\s+/ig, 'T')).clone();
        let detalSeconds=Cesium.JulianDate.secondsDifference(stop,start);
        let currentTime= new Cesium.JulianDate();
        Cesium.JulianDate.addSeconds(start,val*15*60,currentTime);
        Cesium.JulianDate.addHours(currentTime, 8, currentTime);
        currentTime=currentTime.toString().substr(0,currentTime.toString().lastIndexOf("Z"));
        this.setState({
            currentTime:currentTime.toString().replace('T'," "),
        })
        this.props.timeChange && this.props.timeChange(currentTime.toString());
    }

    render() {
        const {percent,currentTime,marks}=this.state;
        const {startTime,endTime}=this.props;
        return (
            <RootContainer>
                <div className={styles.timeline}>
                    <div className={styles.timeContral}>
                        <Slider tooltipVisible={false} marks={marks} max={95}  onChange={this.onTimeChange}/>
                        <div className={styles.timeLabel}><span>{startTime}</span><span>{endTime}</span></div>
                        {/* <div className={styles.ruler}><span/><span/><span/><span/><span/></div> */}
                    </div>
                    {
                       percent!==0 && percent!==95 && <div className={styles.timeBox} style={{left:`${percent}%`}}><span>{currentTime}</span></div>
                    }
                </div>
                
            
            </RootContainer>

        )
    }
}

export default TimeLine;