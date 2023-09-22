/* global Cesium */
/* global viewer */
/* global mars */

import React, { Component } from 'react';
import { Slider, Button, InputNumber, Row, Col } from 'antd'
import styles from './moreDetail.less'
import { connect } from 'dva';

import RootContainer from '@/components/rootContainer'



@connect(({House ,Global}) => ({
    House,Global
  }))

class MoreDetail extends Component {
    constructor(props) {
        super(props);
    }

    close=()=>{
        this.props.close && this.props.close();
    }

    componentDidMount(){
        const {info}=this.props;
        this.getPopulationList(info.basicId);
    }

    componentWillReceiveProps(newPorps){
        const {basicId:houseId} =this.props.info;
        const {basicId:newHouseId}=newPorps.info;
        
        if(newHouseId && houseId!==newHouseId){
        this.getPopulationList(newHouseId);
        }
    }

    getPopulationList=(houseId)=>{
        const {populationList}=this.props.House;
        //判断是否有查询权限
        let HousePopulationInfo=this.props.Global.pageAuths && this.props.Global.pageAuths.ParcelBldgHouse && this.props.Global.pageAuths.ParcelBldgHouse.HousePopulationInfo;
        if(!HousePopulationInfo){
            if(populationList && populationList.length!=0){
                this.props.dispatch({
                    type: 'House/setPopulationList',
                    payload: {
                        data:null
                    },
                })
            }
            
            return;
        }
        // 获取住户列表
        houseId && this.props.dispatch({
            type: 'House/getPopulationList',
            payload: {
                houseId:houseId
            },
        })
    }

   
    render() {
        const {show,info:{attributes}}=this.props;
        const {populationList}=this.props.House;
        return (
            <>
            {
                show && <RootContainer>
                <div className={styles.detail}>
                    <div className={styles.header}>
                        <span className={styles.title}>房屋扩展属性</span>
                        <span className={styles.time}>数据截止：2020-11-09 13:08</span>
                    </div>
                    <div className={styles.main}>
                        <div className={styles.left}>
                        <span className={`${styles.menu} ${styles.select}`}>基础属性数据库</span>
                        </div>
                        <div className={styles.right}>
                            <div className={styles.content}>
                                <div className={styles.subtitle}>基本属性</div>
                                <Row gutter={[16,16]}>
                                    <Col span={16}>
                                        <span className={styles.label}>房屋编码：</span>
                                        <span className={styles.value}>{attributes.houseId}</span>
                                    </Col>
                                    <Col span={8}> 
                                        <span className={styles.label}>登记用途：</span>
                                        <span className={styles.value}>{attributes.houseUseName}</span>
                                    </Col>
                                </Row>
                                <Row gutter={[16,16]}>
                                    <Col span={8}>
                                        <span className={styles.label}>门牌地址：</span>
                                        <span className={styles.value}>{attributes.certAddr}</span>
                                    </Col>
                                    <Col span={8}>
                                        <span className={styles.label}>房号：</span>
                                        <span className={styles.value}>{attributes.roomName}</span>
                                    </Col>
                                    <Col span={8}>
                                        <span className={styles.label}>单元号：</span>
                                        <span className={styles.value}>{attributes.unitName}</span>
                                    </Col>
                                </Row>
                                <Row gutter={[16,16]}>
                                    <Col span={8}>
                                        <span className={styles.label}>房屋性质：</span>
                                        <span className={styles.value}>{attributes.bldattrName}</span>
                                    </Col>
                                    <Col span={8}>
                                        <span className={styles.label}>建筑面积：</span>
                                        <span className={styles.value}>{attributes.houseArea}m&sup2;</span>
                                    </Col>
                                    <Col span={8}>
                                        <span className={styles.label}>套内建筑面积：</span>
                                        <span className={styles.value}>{attributes.houseSoleArea}m&sup2;</span>
                                    </Col>
                                    
                                </Row>
                                <Row gutter={[16,16]}>
                                    <Col span={8}>
                                        <span className={styles.label}>分摊建筑面积：</span>
                                        <span className={styles.value}>{attributes.housePubArea}m&sup2;</span>
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
                            {
                                populationList && populationList.length!=0 && 
                            
                                <div className={styles.content}>
                                    <div className={styles.subtitle}>住户信息</div>
                                    <div className={styles.table}>
                                    {
                                        populationList && populationList.map((item,index)=>{
                                            return <div className={styles.row} key={index}>
                                                <span>住户{index+1}</span>
                                                <span>{item.sex}</span>
                                                <span>{item.age}岁</span>
                                                <span>{item.birthDay}</span>
                                            </div>
                                        })
                                    }
                                    </div>
                                </div>
                            }
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