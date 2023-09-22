import React, { Component } from 'react'
import DataPanel from '@/components/dataPanel'
import {getRoomList,getBuildList} from '@/service/house'
import { connect } from 'dva'
@connect(({House }) => ({
  House
}))
class LandStat extends Component {
  constructor(props){
    super(props);
    this.state={
      populationStatistic: undefined,
      roomStatistic: undefined,
      buildStatistic:undefined,
      poiStatistic:undefined,
    }

  }
  componentDidMount(){
    const {bldgNo,parcelId} =this.props.House;
    // this.getRoomStat(bldgNo);
    // this.getBuildingStat(parcelId);
    let sum=200;
    this.setState({
      buildStatistic:{
        icon: 'icon_room',
        title: '楼宇',
        name: '楼',
        time: '2020/03/16 12:23:38',
        sum:sum*0.2,
        chartData:[{
          label:"已竣工",
          num:sum*0.04,
        },{
          label:"在建",
          num:sum*0.16,
        }]
      },
      roomStatistic:{
        icon: 'icon_room',
        title: '房屋',
        name: '房屋',
        time: '2020/03/16 12:23:38',
        sum:sum,
        chartData:[]
      },
      populationStatistic: {
        icon: 'icon_house',
        title: '人口',
        name: '人口',
        time: '2020/03/16 12:23:38',
        sum:1328,
        chartData:[{
          label:"0-10岁",
          num:28,
        },{
          label:"10-20岁",
          num:300,
        },{
          label:"20-30岁",
          num:400,
        },{
          label:"30-40岁",
          num:300,
        },{
          label:"40-50岁",
          num:100,
        },{
          label:"50-60岁",
          num:120,
        },{
          label:"60-70岁",
          num:80,
        }]
      },
      poiStatistic:{
        icon: 'icon_room',
        title: '周边POI',
        name: 'POI',
        time: '2020/03/16 12:23:38',
        sum:sum,
        chartData:[{
          label:"美食",
          num:sum*0.2,
        },{
          label:"酒店",
          num:sum*0.2,
        },{
          label:"购物",
          num:sum*0.3,
        },{
          label:"景点",
          num:sum*0.1,
        },{
          label:"教育",
          num:sum*0.2,
        }]
      },
    });
  }

  componentWillReceiveProps(newPorps){
    const {bldgNo,parcelId} =this.props.House;
    let newBldgNo=newPorps.House.bldgNo;
    let newParcelId=newPorps.House.parcelId;
    
    // if(newBldgNo && bldgNo!==newBldgNo){
    //   this.getRoomStat(newBldgNo);
    // }
    if(newParcelId && parcelId!==newParcelId){
      // this.getBuildingStat(newParcelId);
    }
  }

  
  //获取楼栋列表--自行统计
  getBuildingStat=async(parcelId)=>{
    if(!parcelId) return;
    let buildList= await getBuildList({parcelId:parcelId});
    if(buildList.success && buildList.data && buildList.data.length!==0){
      var sum=buildList.data.length;
      this.setState({
        buildStatistic:{
          icon: 'icon_room',
          title: '楼宇',
          name: '楼',
          time: '2020/03/16 12:23:38',
          sum:sum*2,
          chartData:[{
            label:"已竣工",
            num:sum*0.4,
          },{
            label:"在建",
            num:sum*1.6,
          }]
        },
        populationStatistic: {
          icon: 'icon_house',
          title: '人口',
          name: '人口',
          time: '2020/03/16 12:23:38',
          sum:1328,
          chartData:[{
            label:"0-10岁",
            num:28,
          },{
            label:"10-20岁",
            num:300,
          },{
            label:"20-30岁",
            num:400,
          },{
            label:"30-40岁",
            num:300,
          },{
            label:"40-50岁",
            num:100,
          },{
            label:"50-60岁",
            num:120,
          },{
            label:"60-70岁",
            num:80,
          }]
        },
      })
    }else{
      return;
    }
  }

  

  render (){
    const {populationStatistic,roomStatistic,buildStatistic,poiStatistic} =this.state;
    return (
      <>
        {buildStatistic && <DataPanel data={buildStatistic} type="Column" isExpand={false} padding={[0,0,30,0]}/>}
        {roomStatistic && <DataPanel data={roomStatistic} type="Column" isExpand={false} padding={[0,0,30,0]}/>}
        {populationStatistic && <DataPanel data={populationStatistic} type="Polar" isExpand={false}/>}
        {poiStatistic && <DataPanel data={poiStatistic} type="Column" isExpand={false} radius={true}/>}
      </>
    );
  }
}

export default LandStat