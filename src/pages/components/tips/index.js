/* global Cesium */
/* global viewer */
/* global $ */
import React, { Component } from 'react';
import styles from './style.less'
import { connect } from 'dva'
import RootContainer from '@/components/rootContainer'

@connect(({ House }) => ({
  House
}))
class Tips extends Component {

    constructor(props) {
        super(props);
        this.state={
            tipNo:undefined,
        }
    }

    componentDidMount(){
        document.addEventListener("keydown",this.handleKeyDown)
    }

    componentWillUnmount(){
        document.removeEventListener("keydown",this.handleKeyDown);
    }

    handleKeyDown=(e)=>{
        const {tipNo}=this.state;
        var key= e.key;
        var altKey=e.altKey;
        if(!altKey) return;
        var tipNum=tipNo;
        switch (key) {
            case "1"://1
                tipNum=1;
                break;
            case "2"://2
                tipNum=2;
                break;
            case "3"://3
                tipNum=3;
                break;
            case "4":
                tipNum=4;
                break;
            case "5"://5
                tipNum=5;
                break;
            case "0"://3
                tipNum=undefined;
                break;
            default:
                // tipNo=undefined;
                break;
        }

        this.setState({
            tipNo:tipNum,
        })
    }

    renderTips=()=>{
        const {tipNo}=this.state;
        switch (tipNo) {
            case 1:
                return     <><span>我国首个</span>海陆一体化的三维时空基准体系</>
            case 2:
                return     <><span>我国率先</span>实现<span>全市域覆盖</span>优于<span>5cm</span>分辨率的倾斜摄影实景三维空间底板，率先在政府部分推广应用</>
            case 3:
                return     <><span>190平方公里</span>的单体化模型、<span>118万平方米</span>的室内三维模型、<span>300平方公里</span>的地下三维管线和<span>1.2万</span>钻孔的三维地质体</>
            case 4:
                return     <><span>全市地楼房权人数据底板：15万</span>宗土地，<span>65万</span>栋建（构）筑物，<span>1300万</span>套（间）房屋，<span>2100万</span>实有人口，<span>1200万</span>语义地址</>
            case 5:
                return     <><span>10期</span>电子地图、<span>50期</span>遥感影像、<span>125类150万</span>个公共设施及兴趣点、<span>6级</span>基础网格以及多类别规划和自然资源数据</>
            
            default:
                return null
        }
    }

    render() {
        const {tipNo}=this.state;
        return (
            <>
            { tipNo && 
                <RootContainer>
                <div className={styles.tips}>
                    
                    <div className={styles.item}>
                        {this.renderTips()}
                    </div>
                </div>
                </RootContainer>
            }
            </>
            

        )
    }
}

export default Tips;