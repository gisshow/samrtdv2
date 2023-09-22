/* global Cesium */
/* global viewer */
/* global mars3d */
/* global $ */
/* global turf */
/* global Popup */

import React, { Component } from 'react';
import styles from './index.less';
import moment from 'moment'
import {DatePicker,Space} from 'antd';
import 'moment/locale/zh-cn';
import locale from 'antd/es/date-picker/locale/zh_CN';
import { connect } from 'dva'
const TEXT_ALL_VALUES = [{ name: '全选', id: '1-all' }, { name: '全选', id: '2-all' }];
@connect(({ House }) => ({
  House
}))

class edAddTo extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isopenList:false,
      isopenRight:false,
      begin:props.begin,
      finish:props.finish,
      selectKey:props.selectKey,
      selectAllKey:props.selectAllKey,
      regionLabel:props.regionLabel,
      secondNodeList: props.secondNodeList,
      activeIds:props.activeIds,
      activeNames:props.activeNames,
      secondNode:props.secondNodeList,
      activeId:props.activeIds,
      activeName:props.activeNames,
      secondNode:{},
      isExpand:false,
    }
    this.timeId=null;
  }

  componentDidMount(){
    this.props.onRef(this)
    this.props.dispatch({
      type: 'House/getRegion'
    })
  }

  componentWillUnmount() {
    
  }


  //点击选中单个
  onClickAddCondition=(itme,itmes)=>{
    const{selectKey,selectAllKey}=this.state
    if(selectAllKey.indexOf(itme.name)>-1){
      selectAllKey.splice(selectAllKey.indexOf(itme.name),1)
      itme.chartData.map(itme=>{
        selectKey.splice(selectKey.indexOf(itme),1)
      })
      selectKey.push(itmes)
    }else{
      if(selectKey.indexOf(itmes)>-1){
        selectKey.splice(selectKey.indexOf(itmes),1)
        if(selectAllKey.indexOf(itme.name)>-1){
          selectAllKey.splice(selectAllKey.indexOf(itme.name),1)
        }
      }else{
        selectKey.push(itmes)
        const status = itme.chartData.every(item=>{
          return selectKey.indexOf(item)>=0
        })
        if(status){
          selectAllKey.push(itme.name)
        }
      }
    }
    const nuwSelectKey = selectKey
    const nuwSelectAllKey = selectAllKey
    this.setState({
      selectKey:nuwSelectKey,
      selectAllKey:nuwSelectAllKey,
    })

  }

  //点击选中全部
  onClickAddAllCondition=(itme)=>{
    const{selectKey,selectAllKey}=this.state
    const status = itme.chartData.every(item=>{
      return selectKey.indexOf(item)>=0
    })
    if(status){
      itme.chartData.map(itme=>{
        selectKey.splice(selectKey.indexOf(itme),1)
      })
      selectAllKey.splice(selectAllKey.indexOf(itme.name),1)
    }else{
      itme.chartData.map(itme=>{
        if(selectKey.indexOf(itme)>-1){

        }else{
          selectKey.push(itme)
        }
      })
      selectAllKey.push(itme.name)
    }
    const nuwSelectKey = selectKey
    const nuwSelectAllKey = selectAllKey
    this.setState({
      selectKey:nuwSelectKey,
      selectAllKey:nuwSelectAllKey,
    })
  }

  onPanelChangeList=(v)=>{
    const{finish}=this.state
    if(finish){
      var lift = new Date(v).getFullYear()
      var right = new Date(finish).getFullYear()
      if(lift>right){
        this.setState({
          begin:finish,
          finish:v,
          isopenList:false,
        })
      }else{
        this.setState({
          begin:v,
          isopenList:false,
        })
      }
    }else{
      this.setState({
        begin:v,
        isopenList:false,
      })
    }
  }

  onPanelChangeRight=(v)=>{
    const{begin}=this.state
    if(begin){
      var lift = new Date(begin).getFullYear()
      var right = new Date(v).getFullYear()
      if(lift>right){
        this.setState({
          finish:begin,
          begin:v,
          isopenRight:false,
        })
      }else{
        this.setState({
          finish:v,
          isopenRight:false,
        })
      }
    }else{
      this.setState({
        finish:v,
        isopenRight:false,
      })
    }
  }
  
  // searchData=(secondNodeList,activeIds,activeNames,val,topNode,secondNodeTow)=>{
  //   this.setState({
  //     secondNode:secondNodeList,
  //     activeId:activeIds,
  //     activeName:activeNames,
  //     regionLabel:val,
  //     topNode:topNode,
  //     secondNodeTow:secondNodeTow,
  //   })
  // }

  //确定
  onClickdetermine=(value)=>{
    const{selectKey,selectAllKey,begin,finish,secondNode,activeId,activeName,regionLabel,secondNodeTow}=this.state
    this.props.edAddCondition.getAddCondition(selectKey,selectAllKey,begin,finish,secondNode,activeId,activeName,regionLabel,secondNodeTow,value)
  }

  //重置
  onClickreset=(itme)=>{
    const nuwSelectKey = []
    const nuwSelectAllKey = []
    itme.map(itme=>{
      nuwSelectAllKey.push(itme.name);
      itme.chartData.map(itme=>{
        nuwSelectKey.push(itme)
      })
    })
    let regionLabels = '深圳市';
    let secondNodeLists = [];
    let activeIdss = [TEXT_ALL_VALUES[0].id];
    let activeNamess = [];
    this.setState({
      begin:null,
      finish:null,
      selectKey:nuwSelectKey,
      selectAllKey:nuwSelectAllKey,
      regionLabel:regionLabels,
      secondNodeList:secondNodeLists,
      activeIds:activeIdss,
      activeNames:activeNamess,
    })
  }

  onClickTimeFrame=()=>{
    this.setState({
      begin:null,
      finish:null,
    })
  }

  setExpand=(flag)=>{
    console.log(1234)
    const {isExpand}= this.state;
    if(this.timeId){
      clearTimeout(this.timeId);
    }
    this.setState({
        isExpand:flag||!isExpand
    })
  }

  onMouseLeave=()=>{
    if(this.timeId){
      clearTimeout(this.timeId);
    }
    this.timeId=setTimeout(this.setExpand(false),3000);
  }
  onMouseEnter=()=>{
    if(this.timeId){
      clearTimeout(this.timeId);
    }
  }

  topNodeClick=(i,t)=>{
    console.log(i,t)
    this.setState({
      regionLabel:i.name,
    })
  }

  render() {
    const{selectKey,selectAllKey,isopenList,isopenRight,begin,finish,regionLabel,secondNodeList,activeIds,activeNames,isExpand}=this.state
    const screenData = [
      {name:"学校类型",chartData:['幼儿园','小学','初中','高中']},
      {name:"学校状态",chartData:['已建','在建','待建']},
      {name:"学校性质",chartData:['公办','民办','普惠']}
    ]
    const {regionData,pickMode} =this.props.House;
    console.log(regionData)
    return (
        <>
          <div className={`${styles.houseBox} `}>
            <div>
              <span>地理位置</span><br />
              <div className={`${styles.box}`}>
                <div className={styles.searchBtn} onClick={this.setExpand}>
                    <span>{regionLabel}</span>
                    <span className={`iconfont icon_filter1 ${styles.icon}`}></span>
                </div>
                <div className={styles.content} style={{display:`${isExpand ? 'block':'none'}`}} onMouseLeave={this.onMouseLeave} onMouseEnter={this.onMouseEnter} >
                  <div className={styles.filter}>
                    {/* <div className={styles.title}>
                      <span>深圳市
                            {
                                activeNames.map((item,index)=>{
                                    return '/'+item;
                                })
                            }
                      </span>
                    </div> */}
                    <div className={styles.group}>
                        <div className={`${styles.topNode} ${!!secondNodeList.length ? styles.borderRight: ''}`}>
                        {
                            regionData.map((item, index) => {
                            return (
                                <div className={(activeIds[0] === item.name || activeIds[0] === item.id) ? styles.item + ' ' + styles.active : styles.item} onClick={() => this.topNodeClick(item,true)} key={index}>
                                <span style={{ marginRight: 6 }}>{item.name}</span>
                                </div>
                            )
                            })
                        }
                        </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {
              screenData && screenData.map((itme,index)=>{
                return <div key={index} >
                  <span>{itme.name}</span><br />
                  <button className={selectAllKey.indexOf(itme.name)>-1?styles.bgShow:''} onClick={()=>{this.onClickAddAllCondition(itme)}} >全部</button>
                  {
                    itme.chartData && itme.chartData.map((itmes,index)=>{
                      return <button className={selectKey.indexOf(itmes)>-1?selectAllKey.indexOf(itme.name)>-1?'':styles.bgShow:''} onClick={()=>{this.onClickAddCondition(itme,itmes)}} key={index} >{itmes}</button>
                    })
                  }
                </div>
              })
            }
            {/* <div className={styles.timeFrame} >
              <span style={{marginBottom:'10px',display:'inline-block',}} >建校年份</span><br/>
              <DatePicker className={styles.datePicker} locale={locale} value={begin}
              open={isopenList} format={"YYYY"} placeholder={"请选择年份"} mode={'year'} 
              onOpenChange={(status)=>{
                if(status)this.setState({isopenList:true})
                else this.setState({isopenList:false})
              }}
              onPanelChange={(v)=>{this.onPanelChangeList(v)}}
              onChange={()=>{
                this.setState({
                  begin:null,
                })
              }} />
              <span className={styles.timeFrameSpan} >-</span>
              <DatePicker  className={styles.datePicker} locale={locale} value={finish}
              open={isopenRight} format={"YYYY"} placeholder={"请选择年份"} mode={'year'} 
              onOpenChange={(status)=>{
                if(status)this.setState({isopenRight:true})
                else this.setState({isopenRight:false})
              }}
              onPanelChange={(v)=>{this.onPanelChangeRight(v)}}
              onChange={()=>{
                this.setState({
                  finish:null,
                })
              }} />
              <button className={styles.timeFrameButton} onClick={()=>{this.onClickTimeFrame()}} >🔄</button>
            </div> */}
            <div className={styles.tail}>
              <button onClick={()=>{this.onClickdetermine()}} >确定</button><button onClick={()=>{this.onClickreset(screenData)}} >重置</button> 
            </div>
          </div>
      </>      
    );
  }
}

export default edAddTo
