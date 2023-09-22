/* global Cesium */
/* global viewer */
/* global mars3d */
import React, { Component } from 'react';
import featureViewer from './featureview.js'
import { Button } from 'antd';
import styles from './style.less'
import { request } from '@/utils/request';
import {getBuildTree,getBuild3DUrl,getRoomById,getElementIdByHouseId,getIntIdByHouseId} from '@/service/house';
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
        // let data = await Ajax.get(`${PUBLIC_PATH}sdk/buildConfig.js`);
        // data=(data.data)[0];
        // window.bimvid=data.bimvid;
        // this.addData("/f/q/sgjingmo/tileset.json");
        // // this.addData("/house/"+bimvid+"/interior/tileset.json");//interior  ,exterior
        // for (let i = 3; i < 34; i++) {
        //     this.addData(`/f/q/${i}/tileset.json`,true);
            
        // }
        this.addData("/data/test/tileset.json");
        
        // this.getBuildingTree("WGB_4403040070030400040-A");//"WGB_4403050050120300096"
        // this.getBuilding3DUrl("WGB_4403040070030400040-A");
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
        featureViewer.uninstall();
    }

    setStyleByIndex=(index,name)=>{
        if (this.tileset) {
            this.setState({
                activeId:name || '',
            })
            
            // 计算所处的页码
            // console.log(name);
            var floorTiles=this.tileset.root.children.filter(item=>{
                var url=item._request.url;
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
                var root=floorTiles[0].children[0];
                let mat=root.transform;
                Cesium.Matrix4.multiplyByTranslation(mat, new Cesium.Cartesian3(60,0,0), mat);
                root.transform=mat;
                featureViewer.selected.isExtract=true;
                featureViewer.selected.floorTile=root;//记录点击的楼层Tile
            }
            
            
        }
    }

    setGapColor=()=>{
        if (this.tileset) {
            // if(!ids || ids.length===0){
            //     this.tileset.style=new Cesium.Cesium3DTileStyle({});
            //     return;
            // }this.FloorItems
            var conditions = [];
            var propertyName="InternalElementId";
            this.FloorItems.map((item,k)=>{
                let ids=item.componentIds;
                for (var j = 0; j < ids.length; j++) {
                    var propertyVal = ids[j];
                    if(j%2!=0){
                        conditions.push(['${' + propertyName + '}===' + propertyVal, 'rgba(255, 255, 255,1.0)']);//rgba(28, 165, 232,1.0)
                    }else{
                        conditions.push(['${' + propertyName + '}===' + propertyVal, 'rgb(0, 0, 0,1.0)']);//'rgb(26, 202, 162,1.0)'
                    }
                }
            })

            // conditions.push(['${' + propertyName + '}===41', 'color("red")']);
            
            conditions.push(['true', 'rgba(255,255,255,1.0)']);

            let style = {
                color: {
                    conditions:conditions,
                }
            }
            // ["true","rgba(255,255,254,0.5)"]
            this.tileset.style = new Cesium.Cesium3DTileStyle(style);

        }
    }

    

    //显示整体
    getWholeHouse=()=>{
        this.setGapColor();
        // this.tileset.style=new Cesium.Cesium3DTileStyle({});
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
            let conditions_c = [];
            this.FloorItems.map((item, k) => {
                // if (k < this.startRow + index+1) {
                // if(k===0){

                  
                    let ids=item.basicHouseIds
                    let propertyName = "InternalElementId";
                    for (var j = 0; j < ids.length; j++) {
                        var propertyVal = ids[j];
                        conditions.push(['${' + propertyName + '}===' + propertyVal, 'true']);
                        var propertyVal = ids[j];
                        if(k%2!=0){
                            conditions_c.push(['${' + propertyName + '}===' + propertyVal, 'rgb(227,237,255,1.0)']);//楼层1墙面rgba(28, 165, 232,1.0)
                        }else{
                            conditions_c.push(['${' + propertyName + '}===' + propertyVal, 'rgb(156,156,156,1.0)']);//楼层2rgb(26, 202, 162,1.0)
                        }
                        
                    }
                // }     
                // }
            })
            // conditions.push(['${Floor} === "3"', 'true']);
           
            conditions.push(['true', 'false']);
            conditions_c.push(['true', 'rgba(255,255,255,1.0)']);
            let style = {
                show: {
                    conditions: conditions,
                },
                color: {
                    conditions:conditions_c,
                }

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
            // debugShowBoundingVolume: true,
            // debugColorizeTiles:true,
            // classificationType:Cesium.ClassificationType.BOTH
            // maximumScreenSpaceError:2,

        });
        // tileset.colorBlendMode=Cesium.Cesium3DTileColorBlendMode.R;
        viewer.scene.primitives.add(tileset);
        // let car3=new Cesium.Cartesian3();
        // let temp=new Cesium.Cartesian3();
        // 添加调试工具
        // viewer.extend(Cesium.viewerCesium3DTilesInspectorMixin);
        tileset.readyPromise.then((tileset)=> {
            // var position=Cesium.Cartesian3.fromDegrees(113.92217751880244, 22.467787692789734,0);
            // var mat = Cesium.Transforms.eastNorthUpToFixedFrame(position || this.position);
            //取模型中心点信息
            // var locParams = mars3d.tileset.getCenter(tileset, true);


            // var position=Cesium.Cartesian3.fromDegrees(113.92804, 22.490483, 130+locParams.z);
            // var rotation_z =Cesium.Math.toRadians(18.5);

            // var mat = Cesium.Transforms.eastNorthUpToFixedFrame(position || this.position);

            // //旋转 
            // var mx = Cesium.Matrix3.fromRotationX(0);
            // var my = Cesium.Matrix3.fromRotationY(0);
            // var mz = Cesium.Matrix3.fromRotationZ(rotation_z);
            // var rotationX = Cesium.Matrix4.fromRotationTranslation(mx);
            // var rotationY = Cesium.Matrix4.fromRotationTranslation(my);
            // var rotationZ = Cesium.Matrix4.fromRotationTranslation(mz);

            // //旋转、平移矩阵相乘
            // Cesium.Matrix4.multiply(mat, rotationX, mat);
            // Cesium.Matrix4.multiply(mat, rotationY, mat);
            // Cesium.Matrix4.multiply(mat, rotationZ, mat);

            // tileset._root.transform = mat;
            //记录模型原始的中心点
            // var boundingSphere = tileset.boundingSphere;
            // var position0 = boundingSphere.center;
            // Cesium.Matrix4.getTranslation(mat,temp);
            // console.log(temp);
            // // console.log(position0,position1);
            // // 计算原始点与目标点之间的偏差
            // Cesium.Cartesian3.subtract(position0,temp,car3);
            // var catographic = Cesium.Cartographic.fromCartesian(position1);
            // console.log(car3);
            // var height = Number(catographic.height.toFixed(2));
            // var longitude = Number(Cesium.Math.toDegrees(catographic.longitude).toFixed(6));
            // var latitude = Number(Cesium.Math.toDegrees(catographic.latitude).toFixed(6));
            // console.log(longitude,latitude,height);
            // 113.93048169164543 22.482258917624623 236.58330943758224
            // 114.018459,22.532647
            // let 
            // 先调整位置，在飞行
            // var position0 = Cesium.Cartesian3.fromDegrees(113.92217751880244, 22.467787692789734,0);//110,113.922418, 22.468220,0
            // var position1 = Cesium.Cartesian3.fromDegrees(114.018459, 22.532647);
            // let car3=new Cesium.Cartesian3(longitude,latitude,200); 
            // Cesium.Cartesian3.subtract(position0,position1,car3);
            // var mat = Cesium.Transforms.eastNorthUpToFixedFrame(position0);
            // var mat = Cesium.Transforms.eastNorthUpToFixedFrame(this.position);
            // var rotationX = Cesium.Matrix4.fromRotationTranslation(Cesium.Matrix3.fromRotationZ(Cesium.Math.toRadians(0)));
            // Cesium.Matrix4.multiply(mat, rotationX, mat);
            // var mat=tileset._root.transform;
            // Cesium.Matrix4.multiplyByUniformScale(mat, 0.001, mat);

            // return mat;
            // var rotationX = Cesium.Matrix4.fromRotationTranslation(Cesium.Matrix3.fromRotationZ(Cesium.Math.toRadians(
            //     0.000)));
            // Cesium.Matrix4.multiply(mat, rotationX, mat);
            // let mat4=new Cesium.Matrix4();
            // let mat=tileset._root.transform;
            
            // Cesium.Matrix4.setTranslation(mat,position1,mat4);
            // console.log(mat,mat4);
            
            // Cesium.Matrix4.getTranslation(mat,temp);
            // car3.z=200;
            // Cesium.Cartesian3.multiplyByScalar(car3,1000,car3);
            // Cesium.Matrix4.multiplyByScale(mat, new Cesium.Cartesian3(0.001,0.001,0.001), mat);
            // Cesium.Matrix4.multiplyByTranslation(mat, car3, mat4);
            // Cesium.Matrix4.multiplyByScalar(mat, this.scale, mat);

            // tileset._root.transform = mat;
            // let matSphere=mat.clone();
            // Cesium.Matrix4.multiplyByScalar(matSphere, 1000, matSphere);
            // Cesium.Matrix4.multiplyByTranslation(matSphere, new Cesium.Cartesian3(0,0,110000), matSphere);
            // let center=new Cesium.Cartesian3();
            // // Cesium.Matrix4.getTranslation(mat,center);//new Cesium.BoundingSphere();
            // Cesium.Ellipsoid.WGS84.geocentricSurfaceNormal(tileset.boundingSphere.center,center);
            // Cesium.Cartesian3.multiplyByScalar(center,bldgHeight,center);
            // Cesium.Cartesian3.add(tileset.boundingSphere.center.clone(),center,center);

            // Cesium.Matrix4.multiplyByTranslation(mat, new , mat4);
            // let bound=new Cesium.BoundingSphere(center,tileset.boundingSphere.radius);
            // bound.radius=bound.radius*2;
            // let radius=tileset.boundingSphere.radius;
            viewer.scene.camera.flyToBoundingSphere(tileset.boundingSphere, {
                duration: 2
            });
            // this.setTransform();
        })
        this.tileset = tileset;
        if(isPick){
            featureViewer.pickTiles.push(tileset);
        }
        // tileset.tileLoad.addEventListener((tile)=>{
        //     this.processElementMap(tile);
        // });
          
        // tileset.tileUnload.addEventListener((tile)=> {
        //     this.processElementMap(tile, unloadFeature);
        // });

        // tileset.allTilesLoaded.addEventListener(()=> {
        //     const bimvid=window.bimvid || "bbbf6091-4c61-49a7-8a04-940b5ecc61b1";
        //     this.getProjectBimTree(bimvid);
        // });

        tileset.tileFailed.addEventListener((tile)=> {
           console.log("failed",tile);
        });

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
                space.elementList.map((element, k) => {
                    let ifcType=element.ifcType;
                    switch (ifcType) {
                        case "BasicHouse":
                            // element.featureIdList.map((id)=>{
                                basicHouseIds.push(element.intId);
                            // })
                            break;
                    
                        case "PublicSpace":
                            // element.featureIdList.map((id)=>{
                                publicHouseIds.push(element.intId);
                            // })
                        break;
                    
                        default:
                            // element.featureIdList.map((id)=>{
                                otherIds.push(element.intId);
                            // })
                            break;
                    }
                    // group.elementNodes.map((element, j) => {
                        // element.featureIdList.map((id)=>{
                            componentList.push(element.intId);
                        // })
                        // if (this.elementMapGlobalId[element.globalId]) {
                        //     componentList.push(this.elementMapGlobalId[element.globalId].InternalElementId);
                        // }

                    // })
                })
                FloorItems.push({ Name: name, componentIds: componentList,basicHouseIds:basicHouseIds,publicHouseIds:publicHouseIds,otherIds:otherIds });
                // FloorItems.push({ Name: name});
            })
            // FloorItems.push({Name:"整体",componentIds:[]});

            if (FloorItems.length / this.pageSize > parseInt(FloorItems.length / this.pageSize)) {
                this.totalPage = parseInt(FloorItems.length / this.pageSize) + 1;
            } else {
                this.totalPage = parseInt(FloorItems.length / this.pageSize);
            }
            this.FloorItems = FloorItems;
            this.getFloorList();
            this.setGapColor();
            
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
            if(this.offSetHeight<bldgHeight+10){
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
        var featureObj=featureName.split('_');
        var name=featureObj[0];
        var guid=featureObj[1];
        var nameList=this.FloorItems.map(item=>{
            return item.Name
        })
        var index=nameList.indexOf(name);
        this.curPage=parseInt(index/this.pageSize)+1;
        this.goPage();
        this.setState({
            activeId:name || '',
        })
        this.transformFloor(pickedFeature);
        // let houseId= await getHouseId({buildingId:basicBldgId,houseIntId:internalElementId});
        // if(houseId.success && houseId.data && Object.keys(houseId.data).length!==0){
        //     this.props.dispatch({
        //         type: 'House/setHouseId',
        //         payload: houseId.data.houseId,
        //     })
        //     // //设置tree的高亮选项
        //     // this.props.dispatch({
        //     //     type:'House/SetTreeSelectedKeys',
        //     //     payload:{
        //     //       type:houseId.data.type,
        //     //       activeRoomId:houseId.data.id,
        //     //     }
        //     // })
        //     this.getHouseById(houseId.data.houseId);
            
        //     // this.showPop(houseId.data.houseId,cartesian,position);   
        // }
    }

    // 抽离楼层
    transformFloor =(pickedFeature)=>{
        // console.log(pickedFeature);
        if(!featureViewer.selected.isExtract){
            var root=pickedFeature.content.tile.parent.parent;
            // let mat=root.transform;
            let mat=root.children[0].transform;
            Cesium.Matrix4.multiplyByTranslation(mat, new Cesium.Cartesian3(60,0,0), mat);
            root.children[0].transform.transform=mat;
            featureViewer.selected.isExtract=true;
            featureViewer.selected.floorTile=root;//记录点击的楼层Tile
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
                }
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


    goBack=(num)=>{
        // console.log(Cesium.Cesium3DTileColorBlendMode)
        this.tileset.colorBlendMode=num;
        if(num==2){
            this.tileset.colorBlendAmount+=0.1
            if(this.tileset.colorBlendAmount>1){
                this.tileset.colorBlendAmount=0.0
            }
        }
        // const {close}=this.props;
        // if(close){
        //     close();
        //     viewer.camera.flyTo({
        //         destination : this.startView.position,
        //         orientation : {
        //             heading : this.startView.heading,
        //             pitch : this.startView.pitch,
        //             roll : this.startView.roll
        //         }
        //     });
        // }
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

    getExpend(){
        var tiles=this.tileset.root.children;
        for (let i = 0; i < tiles.length; i++) {
            const mat = tiles[i].children[0].transform;
            Cesium.Matrix4.multiplyByTranslation(mat, new Cesium.Cartesian3(0,0,3.5*i), mat);
            tiles[i].children[0].transform=mat;
        }
    }
    getExpendOff(){
        var tiles=this.tileset.root.children;
        for (let i = 0; i < tiles.length; i++) {
            const mat = tiles[i].children[0].transform;
            Cesium.Matrix4.multiplyByTranslation(mat, new Cesium.Cartesian3(0,0,-3.5*i), mat);
            tiles[i].children[0].transform=mat;
        }
    }

    render() {
        const { floorList,activeId} = this.state;
        return (
            <RootContainer>
            <div className={styles.box}>
                <div className={`${styles.item} ${activeId=== 'all' ? styles.active:''}`} title="整体" onClick={()=>{this.getExpendOff()}}>
                    <span className="iconfont icon_building1"></span>
                </div>
                <div className={`${styles.item} ${activeId=== 'basicHouse' ? styles.active:''}`} title="户" onClick={()=>{this.getBasicHouse()}}>
                    <span>户</span>
                </div>

                <div className={`${styles.item} ${activeId=== 'basicHouse' ? styles.active:''}`} title="户" onClick={()=>{this.getExpend()}}>
                    <span>展开</span>
                </div>
                
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