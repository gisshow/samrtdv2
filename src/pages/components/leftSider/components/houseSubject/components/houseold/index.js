/* global Cesium */
/* global viewer */
/* global mars3d */
/* global $ */
import React, { Component } from 'react';
import featureViewer from './featureview.js'
import styles from './style.less'
import {getBuildTree,getBuild3DUrl,getHouseId,getRoomById,getIntIdByHouseId} from '@/service/house';
import modelEditor from './modelEditor.js';
import { connect } from 'dva'
import RootContainer from '@/components/rootContainer'
import Clip from '../clip'
const oddColor='rgba(148, 214, 255,1.0)';
const evenColor='rgba(234 ,242 ,255,1.0)';
const lightColor='rgba(255,211,118,0.5)';
const SlabColor="color('#CCE0F2')";//楼板
const StairColor="color('#777776')";//楼梯
const WallColor="color('#BBC2E9')";//墙体
const DoorColor="color('#747891')";//门
const WindowColor="color('#E9EAFC')";//窗
const ColumnColor="color('#BBC2E9')";//柱  ///D4D4D4
const RoofColor="color('#9FC7E0')";//屋顶
const HouseColor="color('#BBC2E9')";//户
const HouseColorAlpha="color('#BBC2E9',0.01)";//户

const floorNameMap={
    "SBC":"设备层",
    "GDC":"管道层",
    "JC":"夹层",
    "WMC":"屋面层",
    "WJC":"屋架层",
    "JFC":"机房层",
    "BDXC":"半地下层"
};

@connect(({ House }) => ({
  House
}))
class HouseOld extends Component {

    constructor(props) {
        super(props);
        this.tileset = null;
        this.state = {
            floorList: [],
            activeId:'',
        }
        this.activeType="all";//basicHouse
        this.FloorItems=[];
        this.elementMapInternalId={};
        this.startView={};
        this.totalPage=1;//总页码
        this.pageSize=10;//每页显示条数
        this.startRow=0;
        this.endRow=9;
        this.curPage=1;
        this.offSetHeight=0;
        this.isDetailModel=true;//是否为精细模型
        this.clipDiv = React.createRef();
    }

    componentDidMount() {
        const {rightActiveKey:activeKey} =this.props.House;
        const {basicBldgId}=this.props;
        // const bimvid="bbbf6091-4c61-49a7-8a04-940b5ecc61b1";
        this.startView={
            position:viewer.camera.position.clone(),
            heading:viewer.camera.heading,
            pitch:viewer.camera.pitch,
            roll:viewer.camera.roll

        }
        // let data = await Ajax.get(`${PUBLIC_PATH}sdk/buildConfig.js`);
        // data=(data.data)[0];
        // window.bimvid=data.bimvid;

        // this.addData("/house/"+bimvid+"/interior/tileset.json");//interior  ,exterior
        // this.addData("/test/tileset.json");
        this.getBuildingTree(basicBldgId);//"WGB_4403050050020800001-B"
        this.getBuilding3DUrl(basicBldgId);
        // this.addData("/9a3b89ec-643f-4713-a13b-d9a7f13b08a1/tileset.json");
        featureViewer.install(viewer,this.getHouseId);
        // this.getProjectBimTree(bimvid);
        // 关闭右侧工具条
        if(activeKey!=="houseHoldStat"){
            this.props.dispatch({
                type: 'House/setRightActiveKey',
                payload: '',
            });
        }
        
    }

    componentWillReceiveProps(newPorps){
        const {basicHouseId} =this.props.House;
        const {basicBldgId}=this.props;
        const {basicBldgId:newBasicBldgId}=newPorps;
        let newHouseId=newPorps.House.basicHouseId;
        if(newHouseId !=='' && basicHouseId!==newHouseId){
          this.getComponentIds(newHouseId);
          return;
        }
        if(newBasicBldgId !=='' && newBasicBldgId!==basicBldgId){
            this.getBuildingTree(newBasicBldgId);
            this.getBuilding3DUrl(newBasicBldgId);
            return;
          }
      }

    componentWillUnmount() {
        
        // this.tileset && this.tileset.des
        viewer.scene.primitives.remove(this.tileset);
        this.tileset = this.tileset && this.tileset.destroy();
        this.tileset=null;
        featureViewer.uninstall();
        this.showExtraSource();
        this.flyToStart();
        // 清空分层分户列表
        this.props.dispatch({
            type: 'House/setHouseIdsByHold',
            payload: [],
        })
    }
     
    showExtraSource=()=>{
        const {extraSource}=this.props.House;
        if(extraSource && extraSource.length!==0 ){
          extraSource.forEach(item => {
            item.show=true;
          });
        }    
      }

    setStyleByIndex=(index,name)=>{
        if (this.tileset) {
            this.setState({
                activeId:name || '',
            })
            let colorConditions = [];
            let showConditions=[];
            let propertyName = "InternalElementId";
            for (let k = 0; k < this.startRow + index+1; k++) {
                const item = this.FloorItems[k];
                const elementList=item.elementList;
                elementList.forEach((element) => {
                    let ifcType=element.ifcType;
                    let propertyVal=element.intId;
                    switch (ifcType) {
                        case "BasicHouse"://户--简单模型
                            colorConditions.push(['${' + propertyName + '}===' + propertyVal,this.isDetailModel?HouseColorAlpha:HouseColor]);//'rgba(235 ,242 ,255,1.0)'  "color('#E4D557',0.5)"
                            showConditions.push(['${' + propertyName + '}===' + propertyVal, 'true']);
                            break;
                        case "IfcWallStandardCase"://外墙
                        case "IfcCurtainWall"://外墙
                            colorConditions.push(['${' + propertyName + '}===' + propertyVal, WallColor]);
                            showConditions.push(['${' + propertyName + '}===' + propertyVal, 'true']);
                            break;
                        case "IfcSlab"://楼板
                            colorConditions.push(['${' + propertyName + '}===' + propertyVal, SlabColor]);
                            showConditions.push(['${' + propertyName + '}===' + propertyVal, 'true']);
                            break;
                        case "IfcRoof"://整栋楼的屋顶
                            colorConditions.push(['${' + propertyName + '}===' + propertyVal, RoofColor]);
                            showConditions.push(['${' + propertyName + '}===' + propertyVal, 'true']);
                            break;
                        case "IfcStairFlight"://楼梯
                            colorConditions.push(['${' + propertyName + '}===' + propertyVal, StairColor]);
                            showConditions.push(['${' + propertyName + '}===' + propertyVal, 'true']);
                            break;
                        case "IfcWindow"://窗
                            colorConditions.push(['${' + propertyName + '}===' + propertyVal, WindowColor]);
                            showConditions.push(['${' + propertyName + '}===' + propertyVal, 'true']);
                            break;
                        case "IfcDoor"://门
                            colorConditions.push(['${' + propertyName + '}===' + propertyVal, DoorColor]);
                            break;
                        case "IfcColumn"://柱子
                            colorConditions.push(['${' + propertyName + '}===' + propertyVal, ColumnColor]);
                            showConditions.push(['${' + propertyName + '}===' + propertyVal, 'true']);
                            break;
                        case "IfcSpace"://公共空间
                            this.isDetailModel && showConditions.push(['${' + propertyName + '}===' + propertyVal, 'false']);
                            break;
                    }
                    // componentList.push(element.intId);
                })
                
            }
            // this.FloorItems.map((item, k) => {
            //     if (k < this.startRow + index+1) {
                    
            //         let ids=this.activeType ==="all" ?item.componentIds:item.basicHouseIds
            //         let propertyName = "InternalElementId";
            //         for (var j = 0; j < ids.length; j++) {
            //             var propertyVal = ids[j];
            //             if (typeof propertyVal === 'number') {
            //                 showConditions.push(['${' + propertyName + '}===' + propertyVal, 'true']);
            //             } else if (typeof propertyVal === 'string') {
            //                 showConditions.push(['${' + propertyName + '}==="' + propertyVal + '"', 'true']);
            //             }
            //             if(item.basicHouseIds.indexOf(propertyVal)!=-1){
            //                 colorConditions.push(['${' + propertyName + '}===' + propertyVal, 'rgba(235 ,242 ,255,.1)']);
            //             }
            //             //隔层设置颜色
            //             if(k%2!=0){
            //                 colorConditions.push(['${' + propertyName + '}===' + propertyVal, oddColor]);
            //             }else{
            //                 colorConditions.push(['${' + propertyName + '}===' + propertyVal, evenColor]);
            //             }
            //         }
                    
            //     }
            // })
            showConditions.push(['true', 'false']);
            colorConditions.push(['true', 'rgba(255,255,255,1.0)']);
            let style = {
                show: {
                    conditions: showConditions,
                },
                color:{
                    conditions:colorConditions,
                }
            }
            this.tileset.style = new Cesium.Cesium3DTileStyle(style);
        }
    }

    setStyle = (index,name,intId) => {
        if (this.tileset) {
            this.setState({
                activeId:name || '',
            })
            let showConditions = [];
            let colorConditions=[];

            let propertyName = "InternalElementId";
            for (let k = 0; k < this.startRow + index+1; k++) {
                const item = this.FloorItems[k];
                const elementList=item.elementList;
                elementList.forEach((element) => {
                    let ifcType=element.ifcType;
                    let propertyVal=element.intId;
                    switch (ifcType) {
                        case "BasicHouse"://户--简单模型
                            if(propertyVal!=intId){
                                colorConditions.push(['${' + propertyName + '}===' + propertyVal, HouseColor]);
                            }
                            
                            showConditions.push(['${' + propertyName + '}===' + propertyVal, 'true']);
                            break;
                        case "IfcWallStandardCase"://外墙
                        case "IfcCurtainWall"://外墙
                            colorConditions.push(['${' + propertyName + '}===' + propertyVal, WallColor]);
                            showConditions.push(['${' + propertyName + '}===' + propertyVal, 'true']);
                            break;
                        case "IfcSlab"://楼板
                            colorConditions.push(['${' + propertyName + '}===' + propertyVal, SlabColor]);
                            showConditions.push(['${' + propertyName + '}===' + propertyVal, 'true']);
                            break;
                        case "IfcRoof"://整栋楼的屋顶
                            colorConditions.push(['${' + propertyName + '}===' + propertyVal, RoofColor]);
                            showConditions.push(['${' + propertyName + '}===' + propertyVal, 'true']);
                            break;
                        case "IfcStairFlight"://楼梯
                            colorConditions.push(['${' + propertyName + '}===' + propertyVal, StairColor]);
                            showConditions.push(['${' + propertyName + '}===' + propertyVal, 'true']);
                            break;
                        case "IfcWindow"://窗
                            colorConditions.push(['${' + propertyName + '}===' + propertyVal, WindowColor]);
                            showConditions.push(['${' + propertyName + '}===' + propertyVal, 'true']);
                            break;
                        case "IfcDoor"://门
                            colorConditions.push(['${' + propertyName + '}===' + propertyVal, DoorColor]);
                            break;
                        case "IfcColumn"://柱子
                            colorConditions.push(['${' + propertyName + '}===' + propertyVal, ColumnColor]);
                            showConditions.push(['${' + propertyName + '}===' + propertyVal, 'true']);
                            break;
                        case "IfcSpace"://公共空间
                            this.isDetailModel && showConditions.push(['${' + propertyName + '}===' + propertyVal, 'false']);
                            break;
                    }
                    // componentList.push(element.intId);
                })
                
            }
            // this.FloorItems.map((item, k) => {
            //     if (k < this.startRow + index+1) {
                    
            //         let ids=item.componentIds;//basicHouseIds;
            //         let propertyName = "InternalElementId";
            //         for (var j = 0; j < ids.length; j++) {
            //             var propertyVal = ids[j];
            //             if (typeof propertyVal === 'number') {
            //                 showConditions.push(['${' + propertyName + '}===' + propertyVal, 'true']);
            //             } else if (typeof propertyVal === 'string') {
            //                 showConditions.push(['${' + propertyName + '}==="' + propertyVal + '"', 'true']);
            //             }
            //             //隔层设置颜色
            //             if(propertyVal==intId) continue;
            //             if(item.basicHouseIds.indexOf(propertyVal)!=-1){
            //                 colorConditions.push(['${' + propertyName + '}===' + propertyVal, 'rgba(235 ,242 ,255,.1)']);
            //             }
            //             if(k%2!=0){
            //                 colorConditions.push(['${' + propertyName + '}===' + propertyVal, oddColor]);
            //             }else{
            //                 colorConditions.push(['${' + propertyName + '}===' + propertyVal, evenColor]);
            //             }
            //         }
                    
            //     }
            // })

            showConditions.push(['true', 'false']);
            // let temp=[];
            colorConditions.push(['${InternalElementId}===' + intId, lightColor]);
            colorConditions.push(['true', 'rgb(255,255,255)']);
            this.tileset.style = new Cesium.Cesium3DTileStyle({
                color:{
                    conditions:colorConditions,
                },
                show:{
                    conditions:showConditions,
                }
            });                

        }
    }

    getFloorNameByHouseId=(baseHouseId,intId)=>{
        const {housesByHold} = this.props.House;
        if(!housesByHold || housesByHold.length===0) return;
        let list=housesByHold.filter(item=>{
            return item.houseId==baseHouseId;
        })
        var name=list[0].floor;
        var nameList=this.FloorItems.map(item=>{
            return item.Name
        })
        var index=nameList.indexOf(name);
        this.curPage=parseInt(index/this.pageSize)+1;
        this.goPage(name,intId);
    }

    //显示整体
    getWholeHouse=()=>{
        // this.setGapColor();
        this.setWholeColor();
        // this.tileset.style=new Cesium.Cesium3DTileStyle({});
        this.setState({
            activeId:'all',
        })
        this.activeType="all";
    }

    getWallHouse=()=>{
        if (this.tileset) {
            // this.setState({
            //     activeId:name || '',
            // })
            let showConditions = [];
            let colorConditions=[];
            this.FloorItems.map((item, k) => {
                let ids=item.publicHouseIds;
                let propertyName = "InternalElementId";
                for (var j = 0; j < ids.length; j++) {
                    var propertyVal = ids[j];
                    showConditions.push(['${' + propertyName + '}===' + propertyVal, 'true']);
                    //隔层设置颜色
                    if(k%2!=0){
                        colorConditions.push(['${' + propertyName + '}===' + propertyVal, oddColor]);
                    }else{
                        colorConditions.push(['${' + propertyName + '}===' + propertyVal, evenColor]);
                    }
                }
            })
            showConditions.push(['true', 'false']);
            colorConditions.push(['true', 'rgba(255,255,255,1.0)']);
            let style = {
                show: {
                    conditions: showConditions,
                },
                color:{
                    conditions:colorConditions
                }
            }

            this.tileset.style = new Cesium.Cesium3DTileStyle(style);
        }
    }

    //只显示户
    getBasicHouse=()=>{
        const { floorList,activeId} = this.state;
        let index=floorList.map((item)=>{
            return item.Name
        }).indexOf(activeId);
        if(index==-1){
            index=this.FloorItems.length-1;
        }
        if (this.tileset) {
            let showConditions = [];
            let colorConditions = [];
            this.FloorItems.map((item, k) => {
                if (k < this.startRow + index+1) {
                    let ids=item.basicHouseIds
                    let propertyName = "InternalElementId";
                    for (var j = 0; j < ids.length; j++) {
                        var propertyVal = ids[j];
                        showConditions.push(['${' + propertyName + '}===' + propertyVal, 'true']);
                        //隔层设置颜色
                        if(k%2!=0){
                            colorConditions.push(['${' + propertyName + '}===' + propertyVal, oddColor]);
                        }else{
                            colorConditions.push(['${' + propertyName + '}===' + propertyVal, evenColor]);
                        }
                        
                    }
                }
            })           
            showConditions.push(['true', 'false']);
            colorConditions.push(['true', 'rgba(255,255,255,1.0)']);
            let style = {
                show: {
                    conditions: showConditions,
                },
                color:{
                    conditions:colorConditions
                }

            }

            this.tileset.style = new Cesium.Cesium3DTileStyle(style);
        }
        this.setState({
            activeId:activeId,
        })
        this.activeType="basicHouse";
    }

    // 不同构件着色
    setWholeColor=()=>{
        if (this.tileset) {
            var colorConditions = [];
            var showConditions=[];
            var propertyName="InternalElementId";
            this.FloorItems.map((item,k)=>{
                let elementList=item.elementList;
                // for (var j = 0; j < ids.length; j++) {

                    elementList.map((element, k) => {
                        let ifcType=element.ifcType;
                        let propertyVal=element.intId;
                        switch (ifcType) {
                            case "BasicHouse"://户--简单模型
                                colorConditions.push(['${' + propertyName + '}===' + propertyVal, HouseColor]);//  "color('#E4D557',0.5)"
                                break;
                            case "IfcWallStandardCase"://外墙
                            case "IfcCurtainWall"://外墙
                                colorConditions.push(['${' + propertyName + '}===' + propertyVal, WallColor]);
                                break;
                            case "IfcSlab"://楼板
                                colorConditions.push(['${' + propertyName + '}===' + propertyVal, SlabColor]);
                                break;
                            case "IfcRoof"://整栋楼的屋顶
                                colorConditions.push(['${' + propertyName + '}===' + propertyVal, RoofColor]);
                                break;
                            case "IfcStairFlight"://楼梯
                                colorConditions.push(['${' + propertyName + '}===' + propertyVal, StairColor]);
                                break;
                            case "IfcWindow"://窗
                                colorConditions.push(['${' + propertyName + '}===' + propertyVal, WindowColor]);
                                break;
                            case "IfcDoor"://门
                                colorConditions.push(['${' + propertyName + '}===' + propertyVal, DoorColor]);
                                break;
                            case "IfcColumn"://柱子
                                colorConditions.push(['${' + propertyName + '}===' + propertyVal, ColumnColor]);
                                break;
                            case "IfcSpace"://公共空间
                                this.isDetailModel && showConditions.push(['${' + propertyName + '}===' + propertyVal, 'false']);
                                break;
                        
                            default:
                                // otherIds.push(element.intId);
                                // publicHouseIds.push(element.intId);
                                // componentList.push(element.intId);
                                break;
                        }
                        // componentList.push(element.intId);
                    })
                    // var propertyVal = ids[j];
                    // showConditions.push(['${' + propertyName + '}===' + propertyVal, 'true']);
                    // if(k%2!=0){
                    //     colorConditions.push(['${' + propertyName + '}===' + propertyVal, oddColor]);
                    // }else{
                    //     colorConditions.push(['${' + propertyName + '}===' + propertyVal, evenColor]);
                    // }
                // }
            })
            
            colorConditions.push(['true', 'rgba(255,255,255,1.0)']);
            showConditions.push(['true','true'])
            let style = {
                color: {
                    conditions:colorConditions,
                },
                show:{
                    conditions:showConditions,
                }
            }
            this.tileset.style = new Cesium.Cesium3DTileStyle(style);

        }else{
            setTimeout(this.setWholeColor,2000);
        }
    }

    setGapColor=()=>{
        if (this.tileset) {
            var colorConditions = [];
            var showConditions=[];
            var propertyName="InternalElementId";
            this.FloorItems.map((item,k)=>{
                let ids=item.componentIds;
                for (var j = 0; j < ids.length; j++) {
                    var propertyVal = ids[j];
                    showConditions.push(['${' + propertyName + '}===' + propertyVal, 'true']);
                    if(k%2!=0){
                        colorConditions.push(['${' + propertyName + '}===' + propertyVal, oddColor]);
                    }else{
                        colorConditions.push(['${' + propertyName + '}===' + propertyVal, evenColor]);
                    }
                }
            })
            
            colorConditions.push(['true', 'rgba(255,255,255,1.0)']);
            showConditions.push(['true','false'])
            let style = {
                color: {
                    conditions:colorConditions,
                },
                show:{
                    conditions:showConditions,
                }
            }
            this.tileset.style = new Cesium.Cesium3DTileStyle(style);

        }
    }


    setShow = () => {
        let feature = featureViewer.selected.feature;
        feature.show = !feature.show
    }

    

    addData = (tileurl) => {
        const {bldgHeight=110} = this.props.House;
        if(this.tileset){
            viewer.scene.primitives.remove(this.tileset);
            this.tileset=null;
        }
        // const {position:position1}=this.props;
        // console.log(position1);
        // var tileurl="/house/test/tileset.json";
        // var tileurl="/house/0ff76d1a-6f28-4398-a70e-1cd0230e5240/exterior/tileset.json";//interior  exterior
        var tileset = new Cesium.Cesium3DTileset({
            url: tileurl,
            imageBasedLightingFactor:new Cesium.Cartesian2(1.5,1.5),
            maximumMemoryUsage: 1024,
            // classificationType:Cesium.ClassificationType.BOTH
            // maximumScreenSpaceError:2,

        });
        viewer.scene.primitives.add(tileset);
        // let car3=new Cesium.Cartesian3();
        // let temp=new Cesium.Cartesian3();
        // 添加调试工具
        // viewer.extend(Cesium.viewerCesium3DTilesInspectorMixin);
        tileset.readyPromise.then(()=> {
            // 调整高度
            var locParams = mars3d.tileset.getCenter(tileset, true);
            // console.log(locParams);
            var catographic = Cesium.Cartographic.fromCartesian(tileset.boundingSphere.center);
            var surface = Cesium.Cartesian3.fromRadians(catographic.longitude, catographic.latitude, 0.0);
            var offset = Cesium.Cartesian3.fromRadians(catographic.longitude, catographic.latitude, -locParams.z);

            var translation = Cesium.Cartesian3.subtract(offset, surface, new Cesium.Cartesian3());
            var matrix = Cesium.Matrix4.fromTranslation(translation);

            tileset.modelMatrix = matrix;
            
            // let mat=tileset._root.transform ;
            // // let scale=new Cesium.Cartesian3(1000,1000,1000);
            // let mat1=new Cesium.Matrix4();
            // var center = Cesium.Cartesian3.fromDegrees(locParams.x, locParams.y,locParams.z);
            // var heading = Cesium.Math.toRadians(locParams.heading);
            
            // var hpr = new Cesium.HeadingPitchRoll(heading, 0, 0);
            // var transform = Cesium.Transforms.headingPitchRollToFixedFrame(center, hpr);
            // // Cesium.Matrix4.multiplyByScalar(mat, 1000, mat1);
            // tileset.modelMatrix = mat;
            // console.log(mat,transform);
            // var b = new Cesium.Matrix3();
            // var result=new Cesium.Cartesian3();

            // Cesium.Matrix4.getMatrix3(mat, b);

            // Cesium.Matrix3.multiplyByScale(b, new Cesium.Cartesian3(1000,1000,1000), b)

            // Cesium.Matrix4.getTranslation(mat, result)

            // var mm=Cesium.Matrix4.fromRotationTranslation(b,result);

            // Cesium.Matrix4.inverseTransformation(mat, mat)
            // Cesium.Matrix4.inverseTransformation(mat1, mat1)
            // console.log(mat,mm);
            viewer.scene.camera.flyToBoundingSphere(tileset.boundingSphere, {
                duration: 2,
                complete:()=>{
                    // setTimeout(viewer.camera.moveForward(0.01),1500) 
                    viewer.camera.moveEnd.raiseEvent();
                    // 触发camera事件
                }
            });
            // this.setTransform();
        })
        this.tileset = tileset;
        tileset.tileFailed.addEventListener((tile)=> {
           console.log("failed",tile);
        });

    }

   
    
    //获取目录结构树
    getBuildingTree = async (basicBldgId) => {
        let buildTree = await getBuildTree({ buildingId: basicBldgId });
        if (buildTree && buildTree.success && buildTree.data) {

            let FloorItems = [];
            let allBasicHouseIds=[];
            let otherIds = [];
            buildTree.data.storeyList && buildTree.data.storeyList.map((space, index) => {
                let name = space.storeyName;
                // let componentList = [];
                let basicHouseIds = [];
                // let publicHouseIds = [];
                
                space.elementList.map((element, k) => {
                    let ifcType=element.ifcType;
                    switch (ifcType) {
                        case "BasicHouse"://户--简单模型
                            // element.featureIdList.map((id)=>{
                                basicHouseIds.push(element.intId);
                                // componentList.push(element.intId);
                            // })
                            break;
                        // case "IfcWallStandardCase"://外墙
                        // case "IfcCurtainWall"://外墙
                        // case "IfcSlab"://楼板
                        // case "IfcRoof"://整栋楼的屋顶
                        // case "IfcStairFlight"://楼梯
                        // case "IfcWindow"://窗
                        // case "IfcDoor"://门
                        // case "IfcColumn"://柱子
                        case "IfcSpace"://公共空间
                        //         publicHouseIds.push(element.intId);
                        //         componentList.push(element.intId);
                            break;
                    
                        default:
                            otherIds.push(element.intId);
                        //     publicHouseIds.push(element.intId);
                        //     // componentList.push(element.intId);
                        //     break;
                    }
                    // componentList.push(element.intId);
                })
                basicHouseIds.length!==0 && allBasicHouseIds.push(...basicHouseIds);
                FloorItems.push({ Name: name, elementList: space.elementList});
            })
            // FloorItems.push({Name:"整体",componentIds:[]});
            featureViewer.setBasicHouseIds(allBasicHouseIds);
            if (FloorItems.length / this.pageSize > parseInt(FloorItems.length / this.pageSize)) {
                this.totalPage = parseInt(FloorItems.length / this.pageSize) + 1;
            } else {
                this.totalPage = parseInt(FloorItems.length / this.pageSize);
            }
            if(otherIds.length==0){
                this.isDetailModel=false;// 简单模型
            }
            this.FloorItems = FloorItems;
            this.getFloorList();
            // this.setGapColor();
            this.setWholeColor();
            
        }
    }
    //获取build的3dtile的url
    getBuilding3DUrl=async (basicBldgId)=>{
        let buildUrl = await getBuild3DUrl({ buildingId: basicBldgId });
        if (buildUrl && buildUrl.status==="ok" && buildUrl.result.total!==0) {
            let item=buildUrl.result.data[0];
            buildUrl="/tile_data/"+item.target_dataset_id+"/"+item.target_url;
            this.addData(buildUrl);
        }
    }

    
    setTransform=()=>{
        const {bldgHeight=110} = this.props.House;
        if(this.tileset){
            let mat=this.tileset._root.transform ;
            let scale=new Cesium.Cartesian3();
            Cesium.Matrix4.getScale (mat, scale);
            if(scale.z===0.001 || scale.z<0.0011){
                Cesium.Matrix4.multiplyByTranslation(mat, new Cesium.Cartesian3(0,0,1000), mat);
            }else{
                Cesium.Matrix4.multiplyByTranslation(mat, new Cesium.Cartesian3(0,0,1), mat);
            }
            
            // Cesium.Matrix4.multiplyByScalar(mat, this.scale, mat);
            this.tileset._root.transform=mat;
            this.offSetHeight++;
            if(this.offSetHeight<bldgHeight+10){
                requestAnimationFrame(this.setTransform);
            }
        }
    } 
    getFloorList=(floorName,intId)=>{
        let floorList=[];
        this.FloorItems.map((item, index) => {
            if(this.startRow<=index  && index<=this.endRow){
                floorList.push(item);
            }
        })
        this.setState({
            floorList: floorList,
        })
        if(floorName){
            for (let j = 0; j < floorList.length; j++) {
                const item = floorList[j];
                if(item.Name===floorName){
                    this.setStyle(j,item.Name,intId)
                }
                
            }
        }
        // 设置层样式
        


    }
    //页面跳转
    goPage=(name,intId)=>{
        // const {floorList} = this.state;
        if(this.curPage<1){
            this.curPage++
            return;
        }
        if(this.curPage>this.totalPage){
            this.curPage--
            return;
        }
        // 判断当前页和总页码的关系

        let startRow = (this.curPage - 1) * this.pageSize; 
        let endRow = this.curPage * this.pageSize-1;
        endRow = (endRow > this.FloorItems.length)? this.FloorItems.length : endRow; 
        this.startRow=startRow;
        this.endRow=endRow;
        // this.curPage=currentPage
        this.getFloorList(name,intId);
    }

    getHouseId=async(internalElementId,cartesian,position)=>{
        const {basicBldgId}=this.props;
        let houseId= await getHouseId({buildingId:basicBldgId,houseIntId:internalElementId});
        if(houseId.success && houseId.data && Object.keys(houseId.data).length!==0){
            this.props.dispatch({
                type: 'House/setHouseId',
                payload: houseId.data.houseId,
            })
            // //设置tree的高亮选项
            // this.props.dispatch({
            //     type:'House/SetTreeSelectedKeys',
            //     payload:{
            //       type:houseId.data.type,
            //       activeRoomId:houseId.data.id,
            //     }
            // })
            this.getHouseById(houseId.data.houseId);
            
            // this.showPop(houseId.data.houseId,cartesian,position);   
        }
    }

    //根据houseid查询
    getHouseById= async (houseId)=>{
        const {treeSelectedKeys} =this.props.House;
        let roomInfo=await getRoomById({basicId:houseId});
        if(roomInfo.success && roomInfo.data){
            //设置tree的高亮选项
            this.props.dispatch({
                type:'House/SetTreeSelectedKeys',
                payload:{
                    type:roomInfo.data.type,
                    activeRoomId:roomInfo.data.id,
                    activeLandId: treeSelectedKeys ? treeSelectedKeys.activeLandId : -1,
                    activeBuildId:treeSelectedKeys ? treeSelectedKeys.activeBuildId : -1,
                    parcelNo:treeSelectedKeys ? treeSelectedKeys.parcelNo : -1,
                    bldgNo:treeSelectedKeys ? treeSelectedKeys.bldgNo : -1,
                }
            })
            // list高亮
            this.props.dispatch({
                type: 'House/setActiveRoomListId',
                payload: roomInfo.data.id,
            })
            //显示楼栋详情
            this.props.dispatch({
                type:'House/setDetailType',
                payload:{
                  isRenderDetail:true,
                  type:"room",
                  title:"房屋",
                  info:roomInfo.data,
                }
            })
        }else{
            // list高亮
            this.props.dispatch({
                type: 'House/setActiveRoomListId',
                payload: -1,
            })
        }
    }


    

    // 根据HouseId查询IntId
    getComponentIds=async (baseHouseId)=>{
        const {basicBldgId}=this.props;
        let result =await getIntIdByHouseId({houseId:baseHouseId,buildingId:basicBldgId});
        if(result.success && result.data){
            // let ids=result.data;
            // let componentIds=[];
            // if(result.data.houseIntId){
            //     componentIds.push(result.data.houseIntId);
            // }
            // 1、设置当前户高亮
            // 2、层样式设置
            this.getFloorNameByHouseId(baseHouseId,result.data.houseIntId);

            

        }        
    }

    getClipTool=()=>{
        this.setState({
            activeId:'clip',
        })
        this.activeType='clip';
    }

    

    goBack=()=>{
        const {close}=this.props;
        viewer.mars.draw.deleteAll();
        close && close();
    }

    flyToStart=()=>{
        viewer.camera.flyTo({
            destination : this.startView.position,
            orientation : {
                heading : this.startView.heading,
                pitch : this.startView.pitch,
                roll : this.startView.roll
            }
        });
    }
    
    getTool=()=>{
        this.editor = modelEditor({
            viewer: viewer,
            onPosition: (pos)=> {
                this.tileset._root.transform = this.editor.modelMatrix();

                var wpos = Cesium.Cartographic.fromCartesian(pos);
                var location={
                    x : Cesium.Math.toDegrees(wpos.longitude),
                    y : Cesium.Math.toDegrees(wpos.latitude),
                    z : wpos.height
                }
                // console.log(location);

                // self.toView();
            },
            onHeading: function (heading) {
                // self.tileset._root.transform = self.editor.modelMatrix();

                // self.location.heading = Cesium.Math.toDegrees(heading);
                // self.toView();
            }
        });
        if(this.tileset){
            //如果tileset自带世界矩阵矩阵，那么计算放置的经纬度和heading
            var mat = Cesium.Matrix4.fromArray(this.tileset._root.transform);
            var pos = Cesium.Matrix4.getTranslation(mat, new Cesium.Cartesian3());
            var wpos = Cesium.Cartographic.fromCartesian(pos);
            var result={};
            result.x = Number(Cesium.Math.toDegrees(wpos.longitude).toFixed(6));
            result.y = Number(Cesium.Math.toDegrees(wpos.latitude).toFixed(6));
            result.z = Number(wpos.height.toFixed(2));
            this.editor.setPosition({
                position: Cesium.Cartesian3.fromDegrees(result.x, result.y, result.z),
                // heading: Cesium.Math.toRadians(self.location.heading),
                range: this.tileset.boundingSphere.radius * 0.9,
                scale: 0.001
            });
        }
        
        this.editor.setEnable(true);
    }

    render() {
        const { floorList,activeId} = this.state;
        return (
            <RootContainer>
            <div className={styles.box}>
                <div className={styles.item} title="返回" onClick={()=>{this.goBack()}}>
                    <span className="iconfont icon_back"></span>
                </div>
                <div className={`${styles.item} ${this.activeType=== 'all' ? styles.active:''}`} title="整体" onClick={()=>{this.getWholeHouse()}}>
                    <span className="iconfont icon_building1"></span>
                </div>
                <div className={`${styles.item} ${activeId=== 'clip' ? styles.active:''}`} title="剖切" onClick={()=>{this.getClipTool()}}>
                    <span>剖切</span>
                </div>
                {
                    (activeId=== 'clip' && this.tileset) ?<Clip  ref={this.clipDiv} tileset={this.tileset}/>:
                    <>
                        <div className={styles.item} title="上一页" onClick={()=>{this.goPage(this.curPage--)}}>
                            <span className="iconfont icon_page_up"></span>
                        </div>
                        
                        {
                            floorList.map((item, index) => {
                                    return <div key={index} className={ `${styles.item} ${item.Name === activeId ? styles.active : ''}`} onClick={()=>{this.setStyleByIndex(index,item.Name)}}><span>{floorNameMap[item.Name] || item.Name}</span></div>
                                
                            })
                        }
                        
                        <div className={styles.item} title="下一页" onClick={()=>{this.goPage(this.curPage++)}}>
                            <span className="iconfont icon_page_down"></span>
                        </div>
                    
                    </>
                }
                
                
                
            </div>
            </RootContainer>
            
        )
    }
}

export default HouseOld;