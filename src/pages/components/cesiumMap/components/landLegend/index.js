/* global Cesium */
/* global viewer */
import React, { Component } from 'react';
import {Row,Col} from 'antd'
import styles from './style.less'
import { connect } from 'dva'

@connect(({BaseMap,Map }) => ({
    BaseMap,Map
  }))
class LandLegend extends Component {
    constructor(props){
        super(props);
       
    }
   

    componentDidMount(){
       
    }
   
    close=()=>{
        this.props.dispatch({
            type: 'Map/setToolsActiveKey',
            payload: ''
        })
    }
    
    render() {
        return (
            <div className={styles.box}>
                <div className={styles.close} onClick={()=>{this.close()}}><span className="iconfont icon_add1"></span></div>
                <Row>
                    <Col span={12}>
                        <div className={styles.item}>
                            <span className={styles.color} style={{"background": "#4f91ee"}}></span>
                            <span className={styles.name}>已供已发证</span>
                        </div>
                    </Col>
                    <Col span={12}>
                        <div className={styles.item}>
                            <span className={styles.color} style={{"background": "#61f1c9"}}></span>
                            <span className={styles.name}>已供未发证</span>
                        </div>
                    </Col>
                </Row>
                {/* <Row>
                    <Col span={12}>
                        <div className={styles.item}>
                            <span className={styles.color} style={{"background": "#e29898"}}></span>
                            <span className={styles.name}>调查</span>
                        </div>
                    </Col>
                    <Col span={12}>
                        <div className={styles.item}>
                            <span className={styles.color} style={{"background": "#CDD93D"}}></span>
                            <span className={styles.name}>确权</span>
                        </div>
                    </Col>
                </Row> */}
               
               
            </div>
        );
    }
}

export default LandLegend;