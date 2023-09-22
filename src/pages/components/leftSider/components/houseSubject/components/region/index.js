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
            regionLabel:'深圳市',
            RegionData:[]
        }
        this.timeId=null;
    }
    componentDidMount(){
      this.props.dispatch({
        type: 'House/getRegion'
      }).then(()=>{
        const {regionData} =this.props.House;
        let data=regionData ? regionData : [];
        this.setState({
          RegionData:data
        })
      })
      // getRegion().then((res)=>{
      //   let data=res ? res.data : SZ_AREAS;
      //   this.setState({
      //     RegionData:data
      //   })
      // })
    }
    componentWillUnmount=()=>{
      this.setState = (state,callback)=>{
          return
      }
    }

    setLabel=(val,paramName)=>{
      this.setState({
        regionLabel:val || '深圳市'
      })
        //   父函数回调
      this.props.searchData &&  this.props.searchData(paramName);
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
        const {isExpand,regionLabel,RegionData}= this.state;
        const {regionData,pickMode} =this.props.House;
        return (
            <div className={`${style.box} ${pickMode?style.disable:''}`}>
                <div className={style.searchBtn} onClick={this.setExpand}>
                    <span>{regionLabel}</span>
                    <span className={`iconfont icon_filter1 ${style.icon}`}></span>
                </div>

                <div className={style.content} style={{display:`${isExpand ? 'block':'none'}`}} onMouseLeave={this.onMouseLeave} onMouseEnter={this.onMouseEnter}>
                    {RegionData && RegionData.length!==0 && <FilterItem isShow={RegionData} data={RegionData} instan={(node) => this.FilterItem = node} getRegionLabel={this.setLabel.bind(this)}/>}
                </div>


            </div>
        );
    }
}

export default RegionFilter;
