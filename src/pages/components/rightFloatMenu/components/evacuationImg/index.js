/* global Cesium */
/* global viewer */
/* global mars3d */
/* global haoutil */
import React, { Component } from 'react';
import styles from './style.less';   
import { connect } from 'dva';

//室内漫游面板
@connect((Map) => ({
    Map
  }))

class EvacuationImg extends Component{
    constructor(props){
        super(props);
        this.state = {
            zoomShow: true,
        }
    }
    
    componentDidMount(){       

    }
    //卸载
    componentWillUnmount(){
        
    }
 
    //显示或隐藏面板
    zoomPanel=()=>{
        const { zoomShow } = this.state;
        this.setState({
            zoomShow: !zoomShow
        })
    }
   
    render(){
        const {zoomShow} = this.state;
        return(
            <div className={`${styles.box} ${zoomShow === false ? styles.zoomShow:''}`}>
                <span className={"iconfont icon_multiselect" + ' ' + styles.icon} onClick={()=>{this.zoomPanel()}}></span>
                <div className={styles.imgDiv}>
                    <img src={require('@/assets/images/rightIndoorImg/mapImg.png')}/>
                    {/* <img className={`${styles.icon} ${zoomShow === false ? styles.pointerShow:''}`} src={require('@/assets/images/taosheng_point_l@2x.png')}/> */}
                </div>
            </div>
        )
    }
}

export default EvacuationImg;