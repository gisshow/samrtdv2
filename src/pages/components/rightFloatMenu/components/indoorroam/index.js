/* global Cesium */
/* global viewer */
/* global mars3d */
/* global haoutil */
import React, { Component } from 'react';
import { Collapse } from 'antd';
import styles from './style.less';
import { request } from '@/utils/request';
import { connect } from 'dva';
import { PUBLIC_PATH } from '@/utils/config'
import RootContainer from '@/components/rootContainer'
const Ajax = require('axios');
var datacutover;


const { Panel } = Collapse
//室内漫游面板
@connect((Map) => ({
    Map
  }))
class IndoorRoam extends Component{
    constructor(props){
        super(props);
        this.state = {
          panelshow: true,
          roamdataList:[],
          placedataList:[],
          optimalcamera:{}
        }
    }
    async componentDidMount(){       

        let data2 = await Ajax.get(`${PUBLIC_PATH}config/datacutover.json`);
        datacutover = data2.data.dataswicth["bimIcon"]
        this.getdataLisr(datacutover)
        this.showhidepoiandroad(false)
    }
    //卸载
    componentWillUnmount(){
        // this.props.dispatch({
        //     type: 'Map/setIndoorKey',
        //     payload: ""
        // })
        this.showhidepoiandroad(true)
        setTimeout(function(){
            viewer.scene.screenSpaceCameraController.enableInputs=true;
        },1000)
    }
    //隐藏道路注记
    showhidepoiandroad=(bol)=>{             
        var data = viewer.dataSources.getByName("poi")[0];
        var lhzkpoidata = viewer.dataSources.getByName("lhzkpoi")[0];
        var dl_labeldata = viewer.dataSources.getByName("dl_label")[0];//道路注记隐藏

        //显示或隐藏        
        if(data){
            data.show = bol;
        }
        if(lhzkpoidata){
            lhzkpoidata.show = bol;
        }
        if(dl_labeldata){
            dl_labeldata.show = bol;
        }
        
        //室内标注
        for(var i= 0;i<window.T3DTilesetList.length;i++){
            var divPOI = window.T3DTilesetList[i];
            divPOI.divpoint.visible=bol;
        }
        //删除道路标记
        // for(var r= 0;r<viewer.scene.primitives.length;r++){
        //     var p = viewer.scene.primitives.get(r);
        //       }                  
        //  }
    }
    //获取数据
    getdataLisr=(datacutover)=>{
        const { IndoorID } = this.props.Map.Map
        var roamdataList=[],placedataList=[],optimalcamera;
        //根据ID获取场景信息
        for(var i=0;i<datacutover.length;i++){
           if(datacutover[i]["id"]== IndoorID){
               var data =datacutover[i];
               //路线高度累加
              var newroamdataList =  this.getheightdata(data["Indoorroam"]) || [];
              roamdataList=newroamdataList;              

              placedataList=data["Keyplace"];
              optimalcamera=data["optimalcamera"];
            break;
           }
        }
        this.setState({
            roamdataList: roamdataList,
            placedataList:placedataList,
            optimalcamera:optimalcamera
        })
    }
    //显示或隐藏面板
    hideshowpanel=()=>{
        const { panelshow } = this.state;
        this.setState({
            panelshow: !panelshow
          })
    }
    //关闭面板
    closepanel=()=>{
        //释放飞行
        if( this.flyLine){
            this.flyLine.stop()
        }
        
        //退出室内
       const {optimalcamera} =this.state
       viewer.mars.centerAt(optimalcamera)
        this.props.dispatch({
            type: 'Map/setIndoorKey',
            payload: ""
        })
        //注销压平恢复倾斜
        viewer.mars.keyboardRoam.applyCollision=false;
        viewer.mars.keyboardRoam.applyGravity=false;
        
        this.props.close && this.props.close();

        setTimeout(function(){
            viewer.scene.screenSpaceCameraController.enableInputs=true;
        },1000)

    }
    //路线高度处理
    getheightdata=(data)=>{
        if(!data) return;
       for(var i=0;i<data.length;i++){
          if(!data[i].accheight){continue}
          var RoamLineData=data[i].RoamLineData;
          var accheight = Number(data[i].accheight);//需累加的高度
          for(var j=0;j<RoamLineData.length;j++){
              var position =RoamLineData[j];
              var newheight = Number(position[2]) + accheight;
              position[2] =newheight;
              RoamLineData[j]=position;
          }          
       }
       return data;
    }
    Flyroamstart=(item,index)=>{
        // console.log("执行漫游")
        if( this.flyLine){
            this.flyLine.start();
        }else{
            var $this=this;
            var flydata = {
                "id": "flyline"+index,
                "name": item.name,
                "clockLoop": false,      //是否循环播放
                "clockRange": Cesium.ClockRange.CLAMPED,   //CLAMPED 到达终止时间后停止
                //"points": positions,
                "points": item.RoamLineData,
                "speed": 8,
                "camera": { "type": "dy", "followedX": 5.5, "followedZ": 1.5, "heading": 359.1,"distance": 8,"pitch":-8.8,"roll":360 },  
                "path": { "show": false, "color": "#ffff00", "opacity": 0.8, "width": 1, "isAll": false },
                "onStop": function (isstop) {
                    //console.log("是否停止:"+isstop)
                    if(isstop){
                        //$this.Keyplace(item.endCamera)
                        //最终场景跳转
                        let cartesian = Cesium.Cartesian3.fromDegrees(item.endCamera.x, item.endCamera.y, item.endCamera.z);
                        viewer.camera.setView({
                            destination : cartesian,
                            orientation: {
                            heading: Cesium.Math.toRadians(item.endCamera.heading),
                            pitch: Cesium.Math.toRadians(item.endCamera.pitch),
                            roll: Cesium.Math.toRadians(item.endCamera.roll)
                            }
                        });
                        $this.flyLine.stop()
                    }
                },
            };
            this.flyLine = new mars3d.FlyLine(viewer, flydata);
            this.flyLine.start();
        }
    }
    Flyroamdelete=()=>{
        // console.log("释放漫游");
        if( this.flyLine){
            this.flyLine.stop()
        }
        
    }
    //绘画漫游路线
    drawline=()=>{
       var  drawControl = new mars3d.Draw(viewer, {
            hasEdit: true,
        });
        drawControl.startDraw({
            type: "polyline",
            // config: { maxPointNum: 2 },  //限定最大点数，可以绘制2个点的线，自动结束
            style: {
                color: "#55ff33",
                width: 3,
                clampToGround: true,
            },
            success: function (entity) {
                var firstpoint = drawControl.getPositions(entity);
                var firstpoints = mars3d.pointconvert.cartesians2lonlats(firstpoint);
                // console.log(firstpoints)
            }
        });
    }
    //重要展厅定位
    Keyplace=(position)=>{
       // console.log("重要展厅定位")
        //var position=item.position;
        let cartesian = Cesium.Cartesian3.fromDegrees(position.x, position.y, position.z);
        viewer.camera.flyTo({
            destination : cartesian,
            orientation: {
            heading: Cesium.Math.toRadians(position.heading),
            pitch: Cesium.Math.toRadians(position.pitch),
            roll: Cesium.Math.toRadians(position.roll)
            }
        });
    }

    //打开室内疏散
    openIndoorEvacuation=()=>{
        
        this.props.dispatch({
            type: 'Map/setIndoorKey',
            payload: "indoorEvacuation"
        })

    }


    render(){
        const { panelshow,roamdataList,placedataList } = this.state;
        const { IndoorID } = this.props.Map.Map
        return(
            <RootContainer>
                <div  className={`${styles.box} ${panelshow === true ? styles.panelShow : styles.panelHide}`}  id={"nihaoss"} >
                    <div>
                        <div className={styles.lefttop}></div>
                        <div className={styles.righttop}></div>
                        <div className={styles.rightbottom}></div>
                        <div className={styles.leftbottom}></div>
                    </div>
                    <div className={styles.headertxts}>
                        <div className={styles.tiliecontent}>室内漫游</div>
                        <div className={styles.closebut} title="关闭" onClick={this.closepanel}>X</div>
                        <div className={styles.minimize} title="最小化" onClick={this.hideshowpanel}>
                            <div className={styles.minline}></div>
                            <div className={styles.minline}></div>
                            <div className={styles.minline}></div>
                        </div>
                        <div className={styles.buttonline}></div>
                    </div>
                    <div className={styles.zconnect}>
                        <Collapse defaultActiveKey={['1','2']} >
                            <Panel showArrow={false} header="路线列表" key="1">
                                {
                                    roamdataList && roamdataList.map((item,index)=>{
                                        return <div className={styles.Flyroam} key={index}>
                                                <div className={styles.Flyroamname}>{item.name}</div>
                                                <div className={styles.Flyroamstart} onClick={this.Flyroamstart.bind(this,item,index)} title="执行漫游"><div className={"iconfont icon_landing"} ></div></div>
                                                <div className={styles.Flyroamdelete} onClick={this.Flyroamdelete} title="释放漫游"><div className={"iconfont icon_navigation"} ></div></div>
                                            </div>
                                    })
                                } 
                            </Panel>
                            <Panel showArrow={false} header="重要展厅" key="2" className={placedataList.length>6?styles.panelStyle:''} >
                                {
                                placedataList && placedataList.map((item,index)=>{
                                        return  <div className={styles.Keyplace} key={index} onClick={this.Keyplace.bind(this,item.position)}>{item.name}</div>
                                    })
                                }
                            </Panel>
                            {
                                IndoorID==='WGB_4403050050120305125605' && <div className={styles.evacuation}> 
                                    <div className={styles.Keyplace}  onClick={()=>{this.openIndoorEvacuation()}}>室内疏散</div>
                                </div>
                            }
                            
                        </Collapse> 
                    </div>
                </div>

                <div className={`${styles.showorhide} ${panelshow === false ? styles.panelShow : styles.panelHide}`}  onClick={this.hideshowpanel}>
                    <div className={styles.spanline}>
                        <div className={styles.hline}></div>
                        <div className={styles.hline}></div>
                        <div className={styles.hline}></div>
                    </div>
                </div>
            </RootContainer>
        )
    }
}

export default IndoorRoam;