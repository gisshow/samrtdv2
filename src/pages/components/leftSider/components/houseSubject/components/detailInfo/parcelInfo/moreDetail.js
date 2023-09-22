/* global Cesium */
/* global viewer */
/* global mars */

import React, { Component } from 'react';
import { Slider, Button, InputNumber, Row, Col } from 'antd'
import styles from './moreDetail.less'
import { connect } from 'dva';

import RootContainer from '@/components/rootContainer'



@connect(({ Map,Home,House }) => ({
    Map,Home,House
  }))

class MoreDetail extends Component {
    constructor(props) {
        super(props);
    }

    close=()=>{
        this.props.close && this.props.close();
    }
   
    render() {
        const {show,info:{attributes}}=this.props;
        return (
            <>
            {
                show && <RootContainer>
                <div className={styles.detail}>
                    <div className={styles.header}>
                        <span className={styles.title}>地块扩展属性</span>
                        <span className={styles.time}>数据截止：2020-11-25 17:45</span>
                    </div>
                    <div className={styles.main}>
                        <div className={styles.left}>
                            <span className={`${styles.menu} ${styles.select}`}>基础属性数据库</span>
                        </div>
                        <div className={styles.right}>
                            <div className={styles.content}>
                                <div className={styles.subtitle}>基本属性</div>
                                <Row gutter={[16,16]}>
                                    <Col span={8}>
                                        <span className={styles.label}>宗地代码：</span>
                                        <span className={styles.value}>{attributes.parcelCode}</span>
                                    </Col>
                                    <Col span={8}>
                                        <span className={styles.label}>宗地序号：</span>
                                        <span className={styles.value}>{attributes.parLotNo}</span>
                                    </Col>
                                    <Col span={8}> 
                                        <span className={styles.label}>宗地号：</span>
                                        <span className={styles.value}>{attributes.parcelNo}</span>
                                    </Col>
                                </Row>
                                <Row gutter={[16,16]}>
                                    <Col span={8}>
                                        <span className={styles.label}>行政区名称：</span>
                                        <span className={styles.value}>{attributes.quName}</span>
                                    </Col>
                                    <Col span={8}>
                                        <span className={styles.label}>街道名称：</span>
                                        <span className={styles.value}>{attributes.jdName}</span>
                                    </Col>
                                    <Col span={8}>
                                        <span className={styles.label}>用途名称：</span>
                                        <span className={styles.value}>{attributes.luFunction}</span>
                                    </Col>
                                </Row>
                                <Row gutter={[16,16]}>
                                    <Col span={8}>
                                        <span className={styles.label}>基础地面积：</span>
                                        <span className={styles.value}>{attributes.luArea}m&sup2;</span>
                                    </Col>
                                    <Col span={8}>
                                        <span className={styles.label}>土地登记状态：</span>
                                        <span className={styles.value}>{attributes.estateState}</span>
                                    </Col>
                                    
                                </Row>
                                <Row gutter={[16,16]}>
                                    <Col span={16}>
                                        <span className={styles.label}>位置：</span>
                                        <span className={styles.value}>{attributes.luLocation}</span>
                                    </Col>
                                </Row>
                            </div>
                            <div className={styles.content}>
                                <div className={styles.subtitle}>权证属性</div>
                                <Row gutter={[16,16]}>
                                    <Col span={8}>
                                        <span className={styles.label}>业务号：</span>
                                        <span className={styles.value}>{attributes.registerNo}</span>
                                    </Col>
                                    <Col span={16}>
                                        <span className={styles.label}>业务类型：</span>
                                        <span className={styles.value}>{attributes.registerType}</span>
                                    </Col>
                                    
                                </Row>
                                <Row gutter={[16,16]}>
                                    <Col span={8}>
                                        <span className={styles.label}>权利开始时间：</span>
                                        <span className={styles.value}>{attributes.estateStartdate}</span>
                                    </Col>
                                    <Col span={8}>
                                        <span className={styles.label}>权利终止时间：</span>
                                        <span className={styles.value}>{attributes.estateEnddate}</span>
                                    </Col>
                                    <Col span={8}>
                                        <span className={styles.label}>登记时间：</span>
                                        <span className={styles.value}>{attributes.registerDate}</span>
                                    </Col>
                                </Row>
                                <Row gutter={[16,16]}>
                                    <Col span={8}>
                                        <span className={styles.label}>权利类型：</span>
                                        <span className={styles.value}>{attributes.estateType}</span>
                                    </Col>
                                    <Col span={8}>
                                        <span className={styles.label}>权利面积：</span>
                                        <span className={styles.value}>{attributes.estateArea} m&sup2;</span>
                                    </Col>
                                    
                                </Row>
                            </div>
                        </div>
                    </div>
                    <div className={styles.footer}>
                        <span onClick={()=>this.close()}>关闭</span>
                    </div>
                    
                </div>
                </RootContainer>
            }

            </>
            
        );
    }
}

export default MoreDetail;