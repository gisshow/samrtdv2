import React, { Component } from 'react';
import style from './styles.less'
import FilterItem from './filterItem'
import { connect } from 'dva'
@connect(({ House }) => ({
  House
}))
class RegionFilter extends Component {
    constructor(props){
        super(props);
        this.state={
            isExpand:false,
            regionLabel:props.regionLabel,
            RegionData:[],
            secondNodeList: props.secondNodeList,
            activeIds:props.activeIds,
            activeNames:props.activeNames,  
        }
        this.timeId=null;
    }
    componentDidMount(){
      this.props.onRef(this)
      this.props.dispatch({
        type: 'House/getRegion'
      })
      // getRegion().then((res)=>{
      //   let data=res ? res.data : SZ_AREAS;
      //   this.setState({
      //     RegionData:data
      //   })
      // })
    }

    onRef=(res)=>{
      this.res = res
    }

    setLabel=(val,paramName,secondNodeList,activeIds,activeNames,topNode,secondNodeTow)=>{
      this.setState({
        regionLabel:val || '深圳市'
      })
        //   父函数回调
        if(secondNodeList || activeIds || activeNames){
          this.props.searchData(secondNodeList,activeIds,activeNames,val,topNode,secondNodeTow)
        }
    }

    setReset=(secondNodeList,activeIds,activeNames)=>{
      this.res.setReset(secondNodeList,activeIds,activeNames)
    }

    setExpand=(flag)=>{
        const {isExpand}= this.state;
        if(this.timeId){
          clearTimeout(this.timeId);
        }
        if(isExpand) {
          this.FilterItem && this.FilterItem.hide()
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
    render() {
        const {isExpand,regionLabel,secondNodeList,activeIds,activeNames}= this.state;
        const {tiaozhuan} =this.props;
        const {regionData,pickMode} =this.props.House;
        return (
            <div className={`${style.box} ${pickMode?style.disable:''}`}>
                <div className={style.searchBtn} onClick={this.setExpand}>
                    <span>{regionLabel}</span>
                    <span className={`iconfont icon_filter1 ${style.icon}`}></span>
                </div>

                <div className={style.content} style={{display:`${isExpand ? 'block':'none'}`}} onMouseLeave={this.onMouseLeave} onMouseEnter={this.onMouseEnter}>
                    {regionData && regionData.length!==0 && <FilterItem onRef={this.onRef} data={regionData}
                    secondNodeList={secondNodeList} activeIds={activeIds} activeNames={activeNames}
                    instan={(node) => this.FilterItem = node} getRegionLabel={this.setLabel.bind(this)}
                    />}
                </div>


            </div>
        );
    }
}

export default RegionFilter;
