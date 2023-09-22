/* global Cesium */
/* global viewer */
/* global mars */

import React, { Component } from 'react';
import { Slider, Button, InputNumber, Row, Col } from 'antd'
import styles from './moreDetail.less'
import { connect } from 'dva';
import Pieslice from '@/components/Chart/Pieslice'
import Bar from '@/components/Chart/Bar'
import RootContainer from '@/components/rootContainer'
import {getPopulationStatistics,getLegalPersonBuildId} from '@/service/house'

@connect(({House }) => ({
    House
  }))

class MoreDetail extends Component {
    constructor(props) {
        super(props);
        this.state={
            gender:undefined,
            age:undefined,
            distinction:undefined,
            years:undefined,
        }
        
    }

    componentDidMount(){
        const {info}=this.props;
        // 获取人口统计
        // this.props.dispatch({
        //     type: 'House/getPopulationStatistics',
        //     payload: {
        //         "getPopulationStatistics": info.attributes.bldgNo,
        //     }
        // })
        // 查询楼栋人口总数
        info.attributes.bldgNo && this.getPopulationStatistics(info.attributes.bldgNo) && this.getLegalPersonBuildId(info.attributes.bldgNo);
    }

    componentWillReceiveProps(newPorps){
        const {attributes:{bldgNo}} =this.props.info;
        let newBldgNo=newPorps.info.attributes ? newPorps.info.attributes.bldgNo:undefined;
        
        if(newBldgNo && bldgNo!==newBldgNo){
            this.getPopulationStatistics(newBldgNo);
            this.getLegalPersonBuildId(newBldgNo);
        }
        
    }

    getPopulationStatistics=async(buildingId)=>{
        
        let stat= await getPopulationStatistics({buildingId:buildingId});
        if(stat && stat.success){
            // console.log(stat.data,stat)
            this.setState({
                gender:stat.data.gender,
                age:stat.data.age,
            })
        }
    }

    getLegalPersonBuildId=async(buildingId)=>{
        
        let stat= await getLegalPersonBuildId({buildingId:buildingId});
        if(stat && stat.success){
            this.setState({
                distinction:stat.data.hyml,
                years:stat.data.sszt,
            })
        }
    }

    close=()=>{
        this.props.close && this.props.close();
    }
   
    render() {
        const {show,info:{attributes}}=this.props;
        const {gender,age,distinction,years}=this.state;
        // console.log(gender,distinction)
        return (
            <>
            {
                show && <RootContainer>
                <div className={styles.detail}>
                    <div className={styles.header}>
                        <span className={styles.title}>楼宇扩展属性</span>
                        <span className={styles.time}>数据截止：2020-11-19 09:35</span>
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
                                        <span className={styles.label}>建筑物编码：</span>
                                        <span className={styles.value}>{attributes.bldgNo}</span>
                                    </Col>
                                    <Col span={8}>
                                        <span className={styles.label}>现状名称：</span>
                                        <span className={styles.value}>{attributes.nowname}</span>
                                    </Col>
                                    <Col span={8}> 
                                        <span className={styles.label}>结构类型：</span>
                                        <span className={styles.value}>{attributes.bldstruName}</span>
                                    </Col>
                                </Row>
                                <Row gutter={[16,16]}>
                                    <Col span={16}>
                                        <span className={styles.label}>详情地址：</span>
                                        <span className={styles.value}>{attributes.bldaddr}</span>
                                    </Col>
                                    
                                    <Col span={8}>
                                        <span className={styles.label}>建设状态：</span>
                                        <span className={styles.value}>{attributes.bldcondName}</span>
                                    </Col>
                                </Row>
                                <Row gutter={[16,16]}>
                                    
                                    <Col span={8}>
                                        <span className={styles.label}>建筑高度：</span>
                                        <span className={styles.value}>{attributes.bldgHeight} m</span>
                                    </Col>
                                    <Col span={8}>
                                        <span className={styles.label}>建设时间：</span>
                                        <span className={styles.value}>{attributes.time}</span>
                                    </Col>
                                    <Col span={8}>
                                        <span className={styles.label}>使用用途：</span>
                                        <span className={styles.value}>{attributes.bldgUsageName}</span>
                                    </Col>
                                    
                                </Row>
                                <Row gutter={[16,16]}>
                                    <Col span={8}>
                                        <span className={styles.label}>建筑占地面积：</span>
                                        <span className={styles.value}>{attributes.bldgLdArea} m&sup2;</span>
                                    </Col>
                                    <Col span={8}>
                                        <span className={styles.label}>总建筑面积：</span>
                                        <span className={styles.value}>{attributes.floorArea} m&sup2;</span>
                                    </Col>
                                   
                                </Row>
                                <Row gutter={[16,16]}>
                                    <Col span={8}>
                                        <span className={styles.label}>所属区：</span>
                                        <span className={styles.value}>{attributes.quName}</span>
                                    </Col>
                                    <Col span={8}>
                                        <span className={styles.label}>所属街道：</span>
                                        <span className={styles.value}>{attributes.jdName}</span>
                                    </Col>
                                    <Col span={8}>
                                        <span className={styles.label}>所属社区：</span>
                                        <span className={styles.value}>{attributes.sqName}</span>
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
                                gender && gender.sum!=0 && 
                            
                                <div className={styles.content}>
                                    <div className={styles.subtitle}>住户统计</div>
                                    <Row gutter={[16,16]}>
                                        <Col span={10}>
                                            <div className={styles.gender}>
                                                <div className={styles.num}>
                                                    <div className={styles.item}>
                                                        <span className={styles.value}>{gender ? gender.sum : 0}</span>
                                                        <span className={styles.label}>住户总人数（人）</span>
                                                    </div>
                                                    {
                                                        gender && gender.stat.map((item,index)=>{
                                                            return <div className={styles.item} key={index}>
                                                            <span className={styles.value}>{item.num}</span>
                                                            <span className={styles.label}>{item.label}人数（人）</span>
                                                        </div>
                                                        }) 
                                                    }
                                                </div>
                                                
                                                <div className={styles.chart}>
                                                    {
                                                        gender && <Pieslice data={gender.stat} isShowLegned={ gender.sum!==0}/>
                                                    }
                                                </div>
                                            </div>
                                        </Col>
                                        <Col span={14}>
                                            <div className={styles.age}>
                                                <div className={styles.num}>
                                                    {
                                                            age && age.stat.map((item,index)=>{
                                                                return <div className={styles.item} key={index}>
                                                                <span className={styles.value}>{item.num}</span>
                                                                <span className={styles.label}>{item.label}</span>
                                                            </div>
                                                            })
                                                    }
                                                </div>
                                                <div className={styles.chart}>
                                                {age && age.stat &&  <Pieslice data={age.stat} isShowLabel={age.sum!==0} padding={[5,40,5,35]}/>}
                                                </div>
                                            </div>
                                        </Col>
                                    </Row>
                                    
                                    
                                </div>
                            }
                            {
                                distinction && distinction.sum!=0 && 
                                <div className={styles.content}>
                                    <div className={styles.subtitle}>
                                        法人属性
                                        <div className={styles.gender}>
                                            <span className={styles.value}>{distinction ? distinction.sum : 0}</span>
                                            <span className={styles.label}>法人单位总数</span>
                                        </div>
                                    </div>
                                    <Row gutter={[16,16]}>
                                        <Col span={24}>
                                            <div className={styles.age}>
                                                <div className={styles.num}>
                                                    {
                                                            distinction && distinction.stat.map((item,index)=>{
                                                                return item.label !== '' && <div className={styles.item} key={index}>
                                                                <span className={styles.value}>{item.num}</span>
                                                                <span className={styles.label}>{item.label}</span>
                                                            </div>
                                                            })
                                                    }
                                                </div>
                                                <div className={styles.chart}>
                                                {distinction && distinction.stat &&  <Bar data={distinction.stat} height={200}/>}
                                                </div>
                                            </div>
                                        </Col>
                                    </Row>
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