import React, { Component } from 'react';
import styles from './styles.less';
import { Tooltip, Progress ,Slider, InputNumber} from 'antd';
import { connect } from 'dva'
import Bar from '@/components/Chart/Bar';
import Column from '@/components/Chart/Column'
import Polar from '@/components/Chart/Polar'
import Pieslice from '@/components/Chart/Pieslice'
import BuildStatisticCom from '@/components/buildStatisticCom/index'
const statFields=[{
  name:'数量',
  field:"quantity",
},{
  name:'面积',
  field:"area",
},{
  name:'年龄',
  field:"age",
},{
  name:'性别',
  field:"gender",
},{
  name:'行业类型',
  field:"hyml",
},{
  name:'商事主体',
  field:"sszt",
}]

const formatNum=(num,field,isFormat)=>{
  let unit="平方米"
  if(field==="quantity"){
    if(isFormat){
      num=(num+"").replace(/(\d)(?=(\d{3})+$)/g,"$1,");
    }
    return num
  }
  if(num>10000 && num<1000000){
    num=num/10000;
    unit="万平方米";
  }else if(num>1000000){
    num=num/1000000;
    unit="百万平方米";
  }
  num=num.toFixed(2);
  var numArr=num.split('.');
  if(isFormat){
    num=(numArr[0]+"").replace(/(\d)(?=(\d{3})+$)/g,"$1,")+'.'+numArr[1];
  }
  return {
    num:num,
    unit:unit,
  };
  
}

@connect(({House}) => ({House}))

class DataPanel extends Component {
  constructor(props){
    super(props);
    this.state={
      isExpand:props.isExpand===true ? true : false,
      hasEye:props.hasEye===true ? true : false,
      isShow: props.isShow=== true ? true : false,
      statField: props.data.chartData.quantity ? "quantity" : props.data.chartData.hyml ? "hyml" : "age",//默认统计字段
      range:this.props.gap ? this.props.gap:100,
    }
  }

  setExpand=()=>{
    const {isExpand}=this.state;
    this.props.onExpand && this.props.onExpand(!isExpand);
    this.setState({
      isExpand:!isExpand
    })
  }

  handleData=()=>{
    const {isShow}=this.state;
    this.setState({
      isShow:!isShow
    },()=>{
      this.props.handleData && this.props.handleData(this.state.isShow);
    })

  }

  computePercent=(data)=>{
    // const {statField} =this.state;
    var length=data.stat.length;
    var currentPercent=0;
    data && data.stat.map(function(item,index) {
      if(length-1!==index){
        item.percent=parseFloat(((item.num / data.sum) * 100).toFixed(2));
        currentPercent+=item.percent;
      }else{
        item.percent=parseFloat((100-currentPercent).toFixed(2));
      }
    });
    return true;
    // return (num / sum).toFixed(2) * 100;
  }

  switchStat=(field)=>{
    this.setState({
      statField:field,
    })
  }

  //缓冲距离更新
  onChangeBoundary=(value)=>{
    this.props.onChangeBoundary && this.props.onChangeBoundary(value);
    this.props.getGapvalue && this.props.getGapvalue(value);
    this.setState({
      range:value,
    })
  }

  //生活圈只当半径
  setRing=(value)=>{
    this.onChangeBoundary(value);
  }

  //获取面积单位
  getAreaScale=(num)=>{
    let scale=1;
    if(num>10000 && num<1000000){
      scale=10000;
    }else if(num>1000000){
      scale=1000000;
    }
    return scale;
  }

  //筛选出法人中的类型为空的数据
  screenOut=(stat)=>{
    let hyml =[];
    // console.log(stat)
    for(var i=0;i<stat.length;i++){
      if(stat[i].label===''){
        // console.log(i)
        stat.splice(i,1);
      }
    }
    hyml = stat
    // console.log(hyml)
    return hyml;
  }

  //点击图形按钮弹出图片汇总弹框
  imgCLickOpenWindow=()=>{
    const {isOpenImgWindow} = this.props.House;
    this.props.dispatch({
      type: 'House/setIsOpenImgWindow',
      payload: { isOpenImgWindow: !isOpenImgWindow }
    })
  }

  render() {
    const { data,data: { icon, title, name, time,chartData},hasSecondBuild,type,typeData,hasEye,padding,radius,radii,isShow,hasExpand,height=260} = this.props;
    const {isExpand,statField,range} =this.state;
    // if(chartData["age"]){
    //   this.switchStat("age");
    // }
    return (
      <div className={`${styles.box} ${isExpand===true ? styles.active:''}`}>
        <div className={styles.title}>
          <div className={styles.name}>
            <span style={{marginRight:"10px"}}>{title}</span>
            {
              hasEye &&  <span className={`iconfont ${isShow===true ? 'icon_see-on':'icon_see'} ${styles.icon}`} onClick={this.handleData}></span>
            }
            {
              radius &&  <>
                  <span className={styles.radius} onClick={this.handleData}>缓冲半径</span><Slider min={1} max={2000} defaultValue={100} value={range} onChange={(value)=>this.onChangeBoundary(value)}/><span className={styles.radius}>{range}m</span>
                </>
            }
            {
              radii &&  <>
                  <span className={styles.radius} onClick={this.handleData}>缓冲半径</span><Slider min={1} max={2000} defaultValue={100} value={range} onChange={(value)=>this.onChangeBoundary(value)}/><span className={styles.radius}>{range}m</span>
                </>
            }
          </div>
          {/* {
            hasExpand && <div className={styles.operate}  onClick={this.setExpand}>
              {
                isExpand? <Icon type="double-right"  ></Icon>:
                  <span className={`iconfont ${icon} ${styles.icon}`} />
              }
            </div>
          } */}
        </div>
        {
          radius &&  <div className={styles.ring}><span onClick={()=>this.setRing(360)}>5分钟步行生活圈</span><span onClick={()=>this.setRing(1000)}>15分钟步行生活圈</span></div>
        }
        <div className={styles.content}>
          <div className={styles.head} onClick={()=>this.setExpand()}>
            {
              chartData.quantity && 
              (
                <div className={styles.item}>
                  <span className={styles.sum} data-text={(chartData.quantity.sum+"").replace(/(\d)(?=(\d{3})+$)/g,"$1,")}></span>
                  <span className={styles.name}>{name}总数</span>
                </div>
              )
            }
            {
              chartData.area && (
                <>
                  <div className={styles.item}>
                    <span className={styles.sum} data-text={formatNum(chartData.area.sum,"area",true).num}></span>
                    <span className={styles.name}>总面积({formatNum(chartData.area.sum,"area",true).unit})</span>
                  </div>
                </>
              )
            }
            {
              chartData.age && 
              (
                <div className={styles.item}>
                  <span className={styles.sum} data-text={(chartData.age.sum+"").replace(/(\d)(?=(\d{3})+$)/g,"$1,")}></span>
                  <span className={styles.name}>{name}总数</span>
                </div>
              )
            }
            {
              chartData.hyml && 
              (
                <div className={styles.item}>
                  <span className={styles.sum} data-text={(chartData.hyml.sum+"").replace(/(\d)(?=(\d{3})+$)/g,"$1,")}></span>
                  <span className={styles.name}>{name}总数</span>
                </div>
              )
            }
          </div>
            
          {
            isExpand  &&
              <>
                {
                  // Object.keys(chartData).map((key,index)=>{
                  //   return <span key={index} className={statField===key ?styles.select:''} onClick={()=>this.switchStat(key)}>{item.name}</span> ;
                  // })
                  // chartData.area && (
                    icon !== 'icon_schoolAge' && !hasSecondBuild &&<div className={styles.switch}>
                    {statFields.map((item,index)=>{
                      if(item.field=="quantity"){
                        //只有数量时，不显示
                        return chartData.quantity &&  chartData.area &&  <span key={index} className={statField===item.field ?styles.select:''} onClick={()=>this.switchStat(item.field)}>{item.name}</span> ;
                      }else if(item.field=="sszt"){
                        //商事主体不显示
                        return 
                      }else{
                        return chartData[item.field] &&  <span key={index} className={statField===item.field ?styles.select:''} onClick={()=>this.switchStat(item.field)}>{item.name}</span> ;
                      }
                    })}
                  </div>
                  // )
                }
                {
                  typeData==="queryPopulation"&&<div className={styles.btnDiv}><span className={styles.btn} onClick={()=>{this.imgCLickOpenWindow()}}>更多图例</span></div>
                }
                <div className={styles.dashboard}>
                  {
                    (type==="Bar" && chartData[statField])&& (hasSecondBuild ?
                    <BuildStatisticCom  data={data} type="Bar" isExpand={false}/>: chartData[statField].stat&&<Bar data={this.screenOut(chartData[statField].stat)} step={this.getAreaScale(chartData[statField].sum)} type={statField} height={300} padding={padding}/>)
                  }
                  {
                    type==="Column" && chartData[statField] && <Column data={chartData[statField].stat} type={statField} height={height} padding={padding}/>
                  }
                  {
                    type==="Polar" && chartData[statField] && <Polar data={chartData[statField].stat} type={statField} height={height} padding={padding}/>
                  }
                  {
                    type==="Pieslice" && chartData[statField] && <Pieslice data={chartData[statField].stat} type={statField} isShowLabel={true} height={height} padding={padding}/>
                  }
                  {
                    type===undefined && (chartData[statField].stat &&  this.computePercent(chartData[statField]) && chartData[statField].stat.map((item,key)=>{
                      return  <div className={styles.dashboardItem} key={key}><Tooltip>
                              <Progress type="dashboard"
                                percent={item.percent}
                                width={70}
                                strokeWidth={10}
                                strokeColor={'#36C4DF'}
                                trailColor='rgba(255,255,255,0.3)'
                                format={(percent) => {
                                  return (
                                    <div className={styles.percent}>{percent}%</div>
                                  )
                                }}
                              />
                            </Tooltip>
                            <span className={styles.label}>{item.label}</span>
                            {
                              statField==="area" ? <span className={styles.num}>{formatNum(item.num,statField).num}</span>:
                              <span className={styles.num}>{item.num}</span>
                            }
                            
                          </div>
                    }))
                  }
                </div>
                {
                  !hasSecondBuild&&<div className={styles.time}>数据更新 {time}</div>
                }
              </>
          }
        </div>
      </div>
    );
  }
}

export default DataPanel