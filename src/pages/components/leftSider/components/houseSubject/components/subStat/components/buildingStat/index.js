import React, { Component } from 'react'
import DataPanel from '@/components/dataPanel'
import {getRoomList} from '@/service/house'
import { connect } from 'dva'

@connect(({House }) => ({
  House
}))
class BuildingStat extends Component {
  constructor(props){
    super(props);
    this.state={
      populationStatistic: undefined,
      roomStatistic: undefined,
      poiStatistic:undefined,
    }

  }
  componentDidMount(){
    const {bldgNo} =this.props.House;
    if(!bldgNo) return;
    this.getRoomStat(bldgNo);
    let sum=200;
    this.setState({
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
    const {bldgNo} =this.props.House;
    let newBldgNo=newPorps.House.bldgNo;
    
    if(newBldgNo && bldgNo!==newBldgNo){
      this.getRoomStat(newBldgNo);
    }
  }

  //获取房屋列表--自行统计
  getRoomStat=async(bldgNo)=>{
    
    let roomList= await getRoomList({buildingId:bldgNo});
    if(roomList.success && roomList.data && roomList.data.length!==0){
      var sum=roomList.data.length;
      this.setState({
        roomStatistic:{
          icon: 'icon_room',
        title: '房间',
        name: '楼',
        time: '2020/03/16 12:23:38',
        sum:roomList.data.length,
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
      })
    }else{
      return;
    }
  }

  render (){
    const {populationStatistic,roomStatistic,poiStatistic} =this.state;
    return (
      <>
        {roomStatistic && <DataPanel data={roomStatistic} type="Column" isExpand={false} padding={[0,0,30,0]}/>}
        {populationStatistic && <DataPanel data={populationStatistic} type="Polar" isExpand={false}/>}
        {poiStatistic && <DataPanel data={poiStatistic} type="Column" isExpand={false} radius={true}/>}
      </>
    );
  }
}

export default BuildingStat