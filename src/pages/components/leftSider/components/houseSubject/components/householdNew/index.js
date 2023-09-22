/* global Cesium */
/* global viewer */
/* global mars3d */
import React, { Component } from 'react';
import featureViewer from './featureview.js'
import { Button } from 'antd';
import styles from './style.less'
import { request } from '@/utils/request';
import {getRoomInfo,getElemetIds,getBuildTree,getBuild3DUrl,getHouseIdByGuid,getRoomById,getElementIdByHouseId,getIntIdByHouseId} from '@/service/house';
import modelEditor from './modelEditor.js';
import { connect } from 'dva'
import { PUBLIC_PATH } from '@/utils/config'
import RootContainer from '@/components/rootContainer'
const Ajax = require('axios');
@connect(({ House }) => ({
  House
}))
class HouseHold extends Component {

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
        this.elementMapGlobalId={};
        this.startView={};
        this.totalPage=1;//总页码
        this.pageSize=10;//每页显示条数
        this.startRow=0;
        this.endRow=9;
        this.curPage=1;
        this.offSetHeight=0;
    }

    componentDidMount() {
        const {basicBldgId}=this.props;
        // const bimvid="bbbf6091-4c61-49a7-8a04-940b5ecc61b1";
        this.startView={
            position:viewer.camera.position.clone(),
            heading:viewer.camera.heading,
            pitch:viewer.camera.pitch,
            roll:viewer.camera.roll

        }
        this.addData("/f/q/sgjingmo/tileset.json");
        for (let i = 3; i < 34; i++) {
            this.addData(`/f/q/${i}/tileset.json`,true);
        }
        // this.addData("/f/q/skggjianmo/tileset.json");
        this.getBuildingTree("WGB_4403050050120300096");//"WGB_4403050050120300096"
        // this.getBuilding3DUrl(basicBldgId);
        featureViewer.install(viewer,this.getHouseId);
        // this.getProjectBimTree(bimvid);
    }

    componentWillReceiveProps(newPorps){
        const {basicHouseId} =this.props.House;
        let newHouseId=newPorps.House.basicHouseId;
        if(newHouseId !=='' && basicHouseId!==newHouseId){
          this.getComponentIds(newHouseId);
          return;
        }
      }

    componentWillUnmount() {
        
        // this.tileset && this.tileset.des
        viewer.scene.primitives.remove(this.tileset);
        this.tileset = this.tileset && this.tileset.destroy();
        this.tileset=null;
        featureViewer.pickTiles.forEach((item)=>{
            viewer.scene.primitives.remove(item);
            item = item && item.destroy();
            item=null;
        })
        featureViewer.uninstall();
    }

    setStyleByIndex=(index,name)=>{
        if (this.tileset) {
            this.setState({
                activeId:name || '',
            })
            
            // 计算所处的页码
            // console.log(name);
            // var floorTiles=this.tileset.root.children.filter(item=>{
            var floorTiles=featureViewer.pickTiles.filter(item=>{
                var url=item.url;
                var urlName=url.substr(url.lastIndexOf('/',url.lastIndexOf('/')-1)+1).replace('/tileset.json','');
                return urlName===name;
            })
            // console.log(floorTiles);
            if(!floorTiles[0]) return;
            //1、如果有选中项，则还原
            //2、设置偏移层
            if(featureViewer.selected.floorTile){
                var root=featureViewer.selected.floorTile;
                let mat=root.transform;
                Cesium.Matrix4.multiplyByTranslation(mat, new Cesium.Cartesian3(-60,0,0), mat);
                root.transform=mat;
                featureViewer.selected.isExtract=false;
                featureViewer.selected.floorTile=undefined;//记录点击的楼层Tile
            }
            if(!featureViewer.selected.isExtract){
                var root=floorTiles[0].root;
                let mat=root.transform;
                Cesium.Matrix4.multiplyByTranslation(mat, new Cesium.Cartesian3(60,0,0), mat);
                root.transform=mat;
                featureViewer.selected.isExtract=true;
                featureViewer.selected.floorTile=root;//记录点击的楼层Tile
            }
            
            
        }
    }

    

    //显示整体
    getWholeHouse=()=>{
        // this.setGapColor();
        this.tileset.style=new Cesium.Cesium3DTileStyle({});
        this.setState({
            activeId:'all',
        })
        this.activeType="all";
    }

    //只显示户
    getBasicHouse=(name)=>{
        if (this.tileset) {
            // this.setState({
            //     activeId:name || '',
            // })
            let conditions = [];
            this.FloorItems.map((item, k) => {
                // if (k < this.startRow + index+1) {
                // if(k===0){

                  
                    let ids=item.basicHouseIds
                    let propertyName = "InternalElementId";
                    for (var j = 0; j < ids.length; j++) {
                        var propertyVal = ids[j];
                        conditions.push(['${' + propertyName + '}===' + propertyVal, 'true']);
                        
                    }
                // }     
                // }
            })
            // conditions.push(['${Floor} === "3"', 'true']);
           
            conditions.push(['true', 'false']);
            let style = {
                show: {
                    conditions: conditions,
                },

            }

            this.tileset.style = new Cesium.Cesium3DTileStyle(style);
        }
        this.setState({
            activeId:'basicHouse',
        })
        this.activeType="basicHouse";
    }

    setShow = () => {
        let feature = featureViewer.selected.feature;
        feature.show = !feature.show
    }

    

    addData = (tileurl,isPick) => {
        const {bldgHeight=110} = this.props.House;
        // const {position:position1}=this.props;
        // console.log(position1);
        // var tileurl="/house/test/tileset.json";
        // var tileurl="/house/0ff76d1a-6f28-4398-a70e-1cd0230e5240/exterior/tileset.json";//interior  exterior
        var tileset = new Cesium.Cesium3DTileset({
            url: tileurl,
            imageBasedLightingFactor:new Cesium.Cartesian2(5,5),
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
            var locParams = mars3d.tileset.getCenter(tileset, true);


            var position=Cesium.Cartesian3.fromDegrees(113.92804, 22.490483, 130+locParams.z);
            var rotation_z =Cesium.Math.toRadians(18.5);

            var mat = Cesium.Transforms.eastNorthUpToFixedFrame(position || this.position);

            //旋转 
            var mx = Cesium.Matrix3.fromRotationX(0);
            var my = Cesium.Matrix3.fromRotationY(0);
            var mz = Cesium.Matrix3.fromRotationZ(rotation_z);
            var rotationX = Cesium.Matrix4.fromRotationTranslation(mx);
            var rotationY = Cesium.Matrix4.fromRotationTranslation(my);
            var rotationZ = Cesium.Matrix4.fromRotationTranslation(mz);

            //旋转、平移矩阵相乘
            Cesium.Matrix4.multiply(mat, rotationX, mat);
            Cesium.Matrix4.multiply(mat, rotationY, mat);
            Cesium.Matrix4.multiply(mat, rotationZ, mat);

            tileset._root.transform = mat;
            // let matSphere=mat.clone();
            // Cesium.Matrix4.multiplyByScalar(matSphere, 1000, matSphere);
            // Cesium.Matrix4.multiplyByTranslation(matSphere, new Cesium.Cartesian3(0,0,110000), matSphere);
            let center=new Cesium.Cartesian3();
            // Cesium.Matrix4.getTranslation(mat,center);//new Cesium.BoundingSphere();
            Cesium.Ellipsoid.WGS84.geocentricSurfaceNormal(tileset.boundingSphere.center,center);
            // Cesium.Cartesian3.multiplyByScalar(center,bldgHeight,center);
            Cesium.Cartesian3.add(tileset.boundingSphere.center.clone(),center,center);

            // Cesium.Matrix4.multiplyByTranslation(mat, new , mat4);
            let bound=new Cesium.BoundingSphere(center,tileset.boundingSphere.radius);
            bound.radius=bound.radius*0.5;
            // let radius=tileset.boundingSphere.radius;
            viewer.scene.camera.flyToBoundingSphere(bound, {
                duration: 2
            });
            // this.setTransform();
        })
        
        if(isPick){
            featureViewer.pickTiles.push(tileset);
        }else{
            this.tileset = tileset;
        }
    }

    

    //获取目录结构树
    getBuildingTree = async (basicBldgId) => {
        let buildTree = await getBuildTree({ buildingId: basicBldgId });
        if (buildTree.success && buildTree.data) {

            let FloorItems = [];
            buildTree.data.storeyList.map((space, index) => {
                let name = space.storeyName;
                let componentList = [];
                let basicHouseIds = [];
                let publicHouseIds = [];
                let otherIds = [];
                // space.elementList.map((element, k) => {
                //     let ifcType=element.ifcType;
                //     switch (ifcType) {
                //         case "BasicHouse":
                //             // element.featureIdList.map((id)=>{
                //                 basicHouseIds.push(element.intId);
                //             // })
                //             break;
                    
                //         case "PublicSpace":
                //             // element.featureIdList.map((id)=>{
                //                 publicHouseIds.push(element.intId);
                //             // })
                //         break;
                    
                //         default:
                //             // element.featureIdList.map((id)=>{
                //                 otherIds.push(element.intId);
                //             // })
                //             break;
                //     }
                //     // group.elementNodes.map((element, j) => {
                //         // element.featureIdList.map((id)=>{
                //             componentList.push(element.intId);
                //         // })
                //         // if (this.elementMapGlobalId[element.globalId]) {
                //         //     componentList.push(this.elementMapGlobalId[element.globalId].InternalElementId);
                //         // }

                //     // })
                // })
                // FloorItems.push({ Name: name, componentIds: componentList,basicHouseIds:basicHouseIds,publicHouseIds:publicHouseIds,otherIds:otherIds });
                FloorItems.push({ Name: name});
            })
            // FloorItems.push({Name:"整体",componentIds:[]});

            if (FloorItems.length / this.pageSize > parseInt(FloorItems.length / this.pageSize)) {
                this.totalPage = parseInt(FloorItems.length / this.pageSize) + 1;
            } else {
                this.totalPage = parseInt(FloorItems.length / this.pageSize);
            }
            this.FloorItems = FloorItems;
            this.getFloorList();
            // this.setGapColor();
            
        }
    }
    //获取build的3dtile的url
    getBuilding3DUrl=async (basicBldgId)=>{
        let buildUrl = await getBuild3DUrl({ buildingId: basicBldgId });
        if (buildUrl.status==="ok" && buildUrl.result.total!==0) {
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
            if(this.offSetHeight<bldgHeight+100){
                requestAnimationFrame(this.setTransform);
            }
        }
    } 
    getFloorList=()=>{
        let floorList=[];
        this.FloorItems.map((item, index) => {
            if(this.startRow<=index  && index<=this.endRow){
                floorList.push(item);
            }
        })
        this.setState({
            floorList: floorList,
        })


    }
    //页面跳转
    goPage=()=>{
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
        this.getFloorList();
    }

    getHouseId=async(pickedFeature,featureName,cartesian,position)=>{
        const {basicBldgId}=this.props;
        var index=featureName.indexOf('_');
        // var featureObj=featureName.split('_');
        var name=featureName.substring(0,index);
        var guid=featureName.substring(index+1);
        var nameList=this.FloorItems.map(item=>{
            return item.Name
        })
        var index=nameList.indexOf(name);
        this.curPage=parseInt(index/this.pageSize)+1;
        this.goPage();
        this.setState({
            activeId:name || '',
        })
        let flag=this.transformFloor(pickedFeature);
        // console.log(flag);
        // return;
        if(!flag) return;
        let houseId= await getHouseIdByGuid({buildingId:basicBldgId,houseGuid:guid});
        if(houseId.success && houseId.data && Object.keys(houseId.data).length!==0){

            this.getHouseById(houseId.data.houseId);
            
        }
    }

    // 抽离楼层
    transformFloor =(pickedFeature)=>{
        // console.log(pickedFeature);
        if(!featureViewer.selected.isExtract){
            // var root=pickedFeature.content.tile.parent.parent;
            var root=pickedFeature.primitive.root;
            let mat=root.transform;
            Cesium.Matrix4.multiplyByTranslation(mat, new Cesium.Cartesian3(60,0,0), mat);
            root.transform=mat;
            featureViewer.selected.isExtract=true;
            featureViewer.selected.floorTile=root;//记录点击的楼层Tile
            return false;
        }
        return true;
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
                    activeLandId:treeSelectedKeys.activeLandId,
                    activeBuildId:treeSelectedKeys.activeBuildId,
                    parcelNo:treeSelectedKeys.parcelNo,
                    bldgNo:treeSelectedKeys.bldgNo,
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
            this.props.dispatch({
                type: 'House/setHouseId',
                payload: roomInfo.data.basicId,
            })
        }
    }

    

    //根据houseId查询构件intID
    getElementIdByHouseId= async (baseHouseId)=>{
        let result =await getElementIdByHouseId({houseId:baseHouseId});
        if(result.success && result.data){
            let ids=result.data;
            let componentIds=[];
            ids.map((item,index)=>{
                if(this.elementMapGlobalId[item]){
                    componentIds.push(this.elementMapGlobalId[item].InternalElementId);
                }
            })
            this.setStyle(componentIds);
        }  
    }

    // 根据HouseId查询IntId
    getComponentIds=async (baseHouseId)=>{
        const {basicBldgId}=this.props;
        let result =await getIntIdByHouseId({houseId:baseHouseId,buildingId:basicBldgId});
        if(result.success && result.data){
            // let ids=result.data;
            let componentIds=[];
            if(result.data.houseIntId){
                componentIds.push(result.data.houseIntId);
            }
            // ids.map((item,index)=>{
            //     if(this.elementMapGlobalId[item]){
            //         componentIds.push(this.elementMapGlobalId[item].InternalElementId);
            //     }
            // })
            this.setStyle(componentIds);
        }        
    }


    goBack=()=>{
        const {close}=this.props;
        if(close){
            close();
            viewer.camera.flyTo({
                destination : this.startView.position,
                orientation : {
                    heading : this.startView.heading,
                    pitch : this.startView.pitch,
                    roll : this.startView.roll
                }
            });
        }
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
                {/* <div className={`${styles.item} ${activeId=== 'all' ? styles.active:''}`} title="整体" onClick={()=>{this.getWholeHouse()}}>
                    <span className="iconfont icon_building1"></span>
                </div>
                <div className={`${styles.item} ${activeId=== 'basicHouse' ? styles.active:''}`} title="户" onClick={()=>{this.getBasicHouse()}}>
                    <span>户</span>
                </div> */}
                
                <div className={styles.item} title="上一页" onClick={()=>{this.goPage(this.curPage--)}}>
                    <span className="iconfont icon_page_up"></span>
                </div>
                
                {/* <div className={styles.floorList}> */}
                    {
                        floorList.map((item, index) => {
                                return <div key={index} className={ `${styles.item} ${item.Name === activeId ? styles.active : ''}`} onClick={()=>{this.setStyleByIndex(index,item.Name)}}><span>{item.Name}</span></div>
                            
                        })
                    }
                    
                {/* </div> */}
                
                {/* <div className={styles.floorList}>
                    {
                        floorList.map((item, index) => {
                            return <Button key={index} onClick={()=>{this.setStyle(item.componentIds)}}>{item.Name}</Button>
                        })
                    }
                    <Button onClick={()=>{this.goBack()}}>返回</Button>
                    
                </div> */}
                
                <div className={styles.item} title="下一页" onClick={()=>{this.goPage(this.curPage++)}}>
                    <span className="iconfont icon_page_down"></span>
                </div>
                {/* <div className={styles.item} title="下一页" onClick={()=>{this.getTool()}}>
                    <Button>工具条</Button>
                </div> */}
            </div>
            </RootContainer>

        )
    }
}

export default HouseHold;