/* global Cesium */
/* global viewer */
/* global mars3d */
/* global $ */

/* 0630 $ */

import React, { Component } from 'react';
import { Tree, Icon,message } from 'antd';
import styles from './styles.less';
import FormModal from './formModal';
import {saveCustom} from '@/service/global';
import { deepClone,getQueryString } from '@/utils';
// import ModuleTitle from '@/components/moduleTitle';
// import TilesFlatten from '../../../baseMap/js/TilesFlatten';
import { hidemodelanddivpoint, publicretracement, request } from '@/utils/request';
import { connect } from 'dva';
import { getTree, getHomeResources ,getLayerDetail } from './service';
import { PUBLIC_PATH } from '@/utils/config';

const Ajax = require('axios');
const { TreeNode } = Tree;

window.gridWidget = {
  disable: () => {
  },
};
//降维、把key转成下标
const flat = (list) => {
  let obj = {};
  list.forEach((v) => {
    obj[v.id] = v;
    if (v.children && v.children.length) {
      obj = { ...obj, ...flat(v.children) };
    }
  });
  return obj;
};
const homeResourceConvert = (arr, totalArr, indexTag = []) => {
  arr.forEach((item, index) => {
    let _indexTag = indexTag.map(i => i);
    _indexTag.push(index);
    item.key = item.uid;
    item.id = item.uid;
    item.title = item.name;
    if (item.gisApi) {
      item.url = item.gisApi.apiUrl||item.gisApi.exposedRelUrl;
      item.type = item.dataFormatDesc;
      item.children = [];
    }
    if (item.children && item.children.length) {//中间层
      homeResourceConvert(item.children, totalArr, _indexTag);
    }
    if (item.resourceList && item.resourceList.length) {//resourceList层
      item.children = item.resourceList;
      homeResourceConvert(item.children, totalArr, _indexTag);
    }
    if (_indexTag.length == 1) {//第一层强制显示
      item.keep = true;
    }
    if (item.dataFormatDesc) {//真正需要保留的曾层
      //给父级都打上不要删除的tag
      let len = _indexTag.length;
      for (let i = 0; i < len; i++) {
        eval('totalArr[' + _indexTag.join('].children[') + ']').keep = true;
        _indexTag.pop();
      }
    }
  });
};
const deleteNotKeep = (arr) => {
  let len = arr.length;
  for (let i = len - 1; i >= 0; i--) {
    if (!arr[i].keep) {
      arr.splice(i, 1);
    }
  }
  arr.forEach(item => {
    if (item.children && item.children.length) {
      deleteNotKeep(item.children);
    }
  });

};

const coordinatesArrayToCartesianArray=(coordinates)=>{
  var positions = new Array(coordinates.length);
  for (var i = 0; i < coordinates.length; i++) {
    var coord=coordinates[i];
  //   coord=coord.split(" ");
      positions[i] = Cesium.Cartesian3.fromDegrees(coord[0], coord[1])
  }
  return positions;
}

let flatLayersData = [];
let addfin3dTilestime = 0;
let motherBoard;

@connect(({ props,Map, LayerManager, Home }) => ({
  Map, LayerManager, Home,
}))

class LayersManage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      layersData: [], //目录
      isShowModal: false,
      cesiumData: {}, //记录添加到cesium的图层数据
      wfsCesiumData:{},//wfs情况下数据保存
      zhuji_handler: null, //鼠标滚轮监听
      szdlx_handler: null, //深圳道路线
      toggleExpand:false,
      saveControlObj:{} //控制自定义图层子集保存按钮的显示
    };
  }

  async componentDidMount() {
    const { layers } = this.props.LayerManager;
    this.props.onRef && this.props.onRef(this);
    let data = await Ajax.get(`${PUBLIC_PATH}config/motherBoard.json`);

    let homeResource = await getHomeResources();

    this.getIdDisplay()

    let d = [];
    motherBoard = data.data;
    if (homeResource && homeResource.success) {
      homeResourceConvert(homeResource.data, homeResource.data);
      deleteNotKeep(homeResource.data);
      // console.log(1111, homeResource.data);
      d.push(...homeResource.data);
    }
    d.push({
      'id': 75,
      'title': '自定义图层',
      'key': '75',
      'type': null,
      'url': null,
      'parentId': 0,
      'custom': true,
      'children': [],
    });
    flatLayersData = flat(d);
    this.setState({
      layersData: d,
    });

    // getTree().then((res) => {
    //   let d = res.data
    //   flatLayersData = flat(d)
    //   this.setState({
    //     layersData: d
    //   })
    // })
  }

  getIdDisplay=async ()=>{
    // let id =window.location.search.replace("?id=","")
    let id =getQueryString("id");
    if(id){
      let data = await getLayerDetail(id)
      if(data && data.code === 200){
        let layerData = data.data;
        layerData.type = layerData.dataFormat;
        layerData.url = layerData.gisApi.apiUrl||layerData.gisApi.exposedRelUrl;;
        this.addLayer(layerData)
      }
    }
  }


  componentWillUnmount() {
    const { cesiumData } = this.state;
    for (let k in cesiumData) {
      if (k) {
        this.delLayer(flatLayersData[k]);
      }
    }
    this.props.dispatch({
      type: 'LayerManager/setCheckedKeys',
      payload: [],
    });
  }

  componentWillReceiveProps(props) {
    if (!props.warn) {
      return null;
    }
  }

  renderTreeNodes = data => {
    const { saveControlObj } = this.state;
    return data.map((item, index) => {
      if (item.children && item.children.length) {
        return (
          <TreeNode
            Icon={<Icon type="right"></Icon>}
            title={item.title}
            key={item.id}
            disabled={item.custom && item.children && !item.children.length}
            // disableCheckbox={true}
            checkable={false}
          >
            {this.renderTreeNodes(item.children)}
          </TreeNode>
        );
      }else{
        if(item.fileDTO){
            const title = (<div>
              <span>{item.title}</span>
              {
                saveControlObj[item.id]&&<span 
                  className="iconfont" 
                  style={{cursor:'pointer',color:'#64A8C5',fontSize:"20px",position:'absolute',top:'33%',right:'18px'}} 
                  onClick={(e)=>{this.saveNewCustom(item,e)}}>&#xe676;</span> 
              }     
          </div>);
          const content ={...item,title}
          return <TreeNode key={item.id} {...content} disabled={!item.url}/>
        }else{
          return <TreeNode key={item.id} {...item} disabled={!item.url}/>;
        }
      }
    });

  };

  //保存自定义图层内容
  saveNewCustom = async (item,e) =>{
    e.stopPropagation();
    const { saveControlObj } = this.state;
    const {title,fileDTO,fileTypeId} = item;
    let param = {
      title,
      fileDTO,
      fileTypeId,
    }
    const saveData = await saveCustom(param);
    if(saveData.success){
      let obj = Object.assign({},saveControlObj,{[item.id]:false});
      this.setState({
        saveControlObj:obj
      })
      message.success('保存成功')
    }else{
      message.error('保存失败，请稍后再试')
    }
  }

  //获取新增/删除的叶节点
  compareData = (prevData, curData) => {

    let addData = curData.filter((v) => {
      return !prevData.some((vv) => {
        return v === vv;
      }) && flatLayersData[v] && flatLayersData[v].children && !flatLayersData[v].children.length;
    });
    let delData = prevData.filter((v) => {
      return !curData.some((vv) => {
        return v === vv;
      }) && flatLayersData[v] && flatLayersData[v].children && !flatLayersData[v].children.length;
    });
    return {
      addData,
      delData,
    };
  };

  getprimitivebyid = (id) => {
    var primitive = null;
    var primitives = viewer.scene.primitives;
    var length = primitives.length;
    for (var i = 0; i < length; i++) {
      var p = primitives.get(i);
      if (p._guid === id) {
        primitive = p;
      }
    }
    //为空创建
    if (!primitive) {
      primitive = new Cesium.PrimitiveCollection();
      primitive._guid = 'dirlling';
    }
    return primitive;
  };

  getArcgisUrl = (url) => {
    return new Cesium.Resource({
      url: url,
      queryParameters:  {
          'szvsud-license-key': window.localStorage.getItem('userLicenseKey'),
        }
    });
  };

  //在cesium图层里面添加license-key
  getCesiumUrl = (url, needKey) => {
    // return url;
    return new Cesium.Resource({
      url: url,
      headers:
        {
          'szvsud-license-key': window.localStorage.getItem('baseMapLicenseKey'),
        }      
    });
  };

  //自定义添加wfs 通过url获取数据
  getWfsDataFromUrl= async (v)=>{
    let data = null;
    await $.ajax({
      url: v.url,
      type: "get",
      // data: parameters,
      success:(featureCollection)=>{
        let dataSource= new Cesium.CustomDataSource(v.id);
        viewer.dataSources.add(dataSource);
        let features =  featureCollection.features;
        let wfsCesiumData = [];//wfs flyto 数据保存
        features = features.map(item=>{
           let positions=[];
           let pointPositions=[];
           let LineStringPositions=[];
          let geometry = item.geometry;
          let properties = item.properties;
          try {    
            if(geometry.type==="MultiPolygon"){
                positions = geometry.coordinates[0][0];
            }else if(geometry.type==="Polygon"){
                positions = geometry.coordinates[0];
            }else if(geometry.type==="Point"){
              pointPositions=Cesium.Cartesian3.fromDegrees(item.geometry.coordinates[0], item.geometry.coordinates[1],0);
            }else if(geometry.type==="LineString"){
              LineStringPositions=coordinatesArrayToCartesianArray(geometry.coordinates);
            }
          } catch (error) {
              console.log(geometry);
          }
          
          if(positions.length>0){
            let entity= dataSource.entities.add({
              polygon: {
                hierarchy: new Cesium.PolygonHierarchy(coordinatesArrayToCartesianArray(positions)),
                material:Cesium.Color.fromCssColorString("#D05555").withAlpha(0.6),//Cesium.Color.fromCssColorString("#35EAA5").withAlpha(0.6),//Cesium.Color.SPRINGGREEN,//Cesium.Color.fromRandom({alpha:1.0}),
                classificationType: Cesium.ClassificationType.BOTH,
                outline: true,
                outlineWidth: 1,
                outlineColor: Cesium.Color.RED,
              },
              popup: { 
                html:this.getPropertiesContent(properties), 
                anchor: [120, -20],//定义偏移像素值 [x, y] }, 
              }
            });   
            wfsCesiumData.push(entity)
          }
          if(Object.keys(pointPositions).length>0){
            var iconameurl = `${PUBLIC_PATH}config/images/location_list@Rx.png`;
            let entity= dataSource.entities.add({
              id: item.id,
              name: item.properties.school_name,
              position: pointPositions,
              // position: Cesium.Cartesian3.fromDegrees(lng, lat, 0),
              billboard: {
                image: iconameurl,
                scale: 0.6,  //原始大小的缩放比例
                horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
                verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                heightReference: Cesium.HeightReference.CLAMP_TO_GROUND, //贴地
                scaleByDistance: new Cesium.NearFarScalar(1.5e2, 1.0, 8.0e6, 0.2),
                disableDepthTestDistance: Number.POSITIVE_INFINITY, //一直显示，不被地形等遮挡
              },
              data: item,
              popup: { 
                html:this.getPropertiesContent(properties), 
                anchor: [120, -20],//定义偏移像素值 [x, y] }, 
              }
            });   
            wfsCesiumData.push(entity)
          }
          if(LineStringPositions.length>0){
            let entity= dataSource.entities.add({
              polyline:{
                positions : LineStringPositions,
                material: new Cesium.PolylineDashMaterialProperty({
                  color: Cesium.Color.RED,
                }),
                classificationType:Cesium.ClassificationType.BOTH,
                  clampToGround:true,
                  width:3,
              },
              popup: { 
                html:this.getPropertiesContent(properties), 
                anchor: [120, -20],//定义偏移像素值 [x, y] }, 
              }
            }); 
            wfsCesiumData.push(entity)  
          }
          this.setState({
            wfsCesiumData:{
              [v.id]:wfsCesiumData
            }
          })
          data = dataSource;
        })
      },
      error:(data)=>{
          var msg = "请求出错(" + data.status + ")：" + data.statusText
          console.log(msg);
      }
    });
    return data;
  } 

  getPropertiesContent = (properties)=>{
    let html='';
    const contentDiv = `display: flex;flex-direction: row;justify-content: space-between`;
    const popup = `width:220px;padding: 15px 5px 0`;
    for(let key in properties){
      html+=`<div style="${contentDiv}">
                <div class="${styles.name}">${key}:</div>
                <div class="${styles.info}">${properties[key]}</div>
            </div>`;
    }
    html=`<div style="${popup}">${html}</div>`;
    return html
  }

  addProjectPolygon = (projLand,id)=>{
    let dataSource=new Cesium.CustomDataSource(id);
    viewer.dataSources.add(dataSource);
    let features =  projLand.features;
    features = features.map(item=>{
       let positions=[];
      let geometry = item.geometry;
      try {    
        if(geometry.type==="MultiPolygon"){
            positions = geometry.coordinates[0][0];
        }else if(geometry.type==="Polygon"){
            positions = geometry.coordinates[0];
        }
      } catch (error) {
          console.log(geometry);
      }
    
      let entity=dataSource.entities.add({
        polygon: {
          hierarchy: new Cesium.PolygonHierarchy(coordinatesArrayToCartesianArray(positions)),
          material:Cesium.Color.fromCssColorString("#FEC205").withAlpha(0.6),//Cesium.Color.fromCssColorString("#35EAA5").withAlpha(0.6),//Cesium.Color.SPRINGGREEN,//Cesium.Color.fromRandom({alpha:1.0}),
          classificationType: Cesium.ClassificationType.BOTH,
          outline: true,
          outlineWidth: 1,
          outlineColor: Cesium.Color.BLUE,
        },
      });   
      return dataSource
    })
    
  }

  //添加cesium图层数据
  addLayer = async (v) => {
    const { positionDistrict } = this.props.LayerManager;
    const { cesiumData, Buttonshow } = this.state;
    const { reality: { sz_osgb } } = motherBoard;
    let data = null;
    let $that = this;
    let realUrl;
    if(!v)return;
    v.type = v && v.type && v.type.toLowerCase();
    if(v.type==="geojson_local" || v.type==="shapefile_local"||(!v.gisApi&&v.type==='wfs') ){
      return this.addCustomLayer(v);
    }
    switch (v.type) {
      case 'terrain':
        let terrain = new Cesium.CesiumTerrainProvider({
          url: v.url,
        });
        viewer.terrainProvider = terrain;
        data = terrain;
        break;
      case '3dtiles':
        realUrl = this.getCesiumUrl(v.url, true);

        let cesium3DTileset;
        if (v.datatype && v.datatype.includes('pipeline')) {
          //var modleMatrix=new Cesium  undefined

          mars3d.layer.createLayer({
            'name': '地下管网',
            'type': '3dtiles',
            'url': realUrl, //定义在 config\marsUrl.js
            'maximumScreenSpaceError': 2,
            'maximumMemoryUsage': 1024,
            'showClickFeature': true,
            'offset': {
              'z': v.offsetHeight,
            },
            'visible': true,
            'asset': {
              'dataType': v.datatype,
              'selectColor': v.selectColor,
            },
            // "flyTo":true,
            'click': function(e) {//单击
              // console.log(e);
              e.feature.color = Cesium.Color.fromCssColorString(e.feature.primitive._config.asset.selectColor).withAlpha(0.5);
              var dataType = e.feature.primitive._config.asset.dataType;
              if (dataType.includes('pipeline-line')) {
                //给水 排水 排污 天然气 管线
                var name = e.feature.getProperty('name');
                var newname = wrap(name);
                var obj = new Object();
                obj.type = 'wpipelinedata';

                if (e.feature.primitive.asset.guid.includes('0F53C7FBDA8247FFAF15171414E07C73')) {//给水
                  obj.holename = '给水管线信息';
                  obj.dataList = { PIPELINECODE: 'JS_SSG', OBJECTID: newname };
                } else if (e.feature.primitive.asset.guid.includes('18CF9FE7A02B46C0B540173F70A58A5D')) {//排污
                  obj.holename = '排污管线信息';
                  obj.dataList = { PIPELINECODE: 'PS_WSG', OBJECTID: newname };
                } else if (e.feature.primitive.asset.guid.includes('33B7A8FA0E3A436D9CE0B5B662BD2616')) {//排水
                  obj.holename = '排水管线信息';
                  obj.dataList = { PIPELINECODE: 'PS_QTX', OBJECTID: newname };
                } else if (e.feature.primitive.asset.guid.includes('80B5C0E75799435B8CB084F48CF51ED1')) {//天然气
                  obj.holename = '天然气管线信息';
                  obj.dataList = { PIPELINECODE: 'RQ_TRQ', OBJECTID: newname };
                }
                $that.getjpstpipelinebyid(obj);
              } else if (dataType.includes('pipeline-point')) {
                //井
                var name = e.feature.getProperty('name');
                var newname = wrap(name);
                var obj = new Object();
                obj.type = 'jiwelldata';
                if (e.feature.primitive.asset.guid.includes('6E844E0A9655451D8D5E9290B8CC6E09')) {//电力检修井井盖
                  obj.holename = '电力检修井井盖信息';
                  obj.dataList = { OBJECTID: newname };
                } else if (e.feature.primitive.asset.guid.includes('B50F0E8D2A0A4B9CBE27B6627B904FFA')) {//电力检修井
                  obj.holename = '电力检修井信息';
                  obj.dataList = { OBJECTID: newname };
                } else if (e.feature.primitive.asset.guid.includes('7263FC02367F4E8A94A9F8DF37B69131')) {//电力人孔井井盖
                  obj.holename = '电力人孔井井盖信息';
                  obj.dataList = { OBJECTID: newname };
                } else if (e.feature.primitive.asset.guid.includes('3D856724C6E341319CB1550952E53628')) {//电力人孔井
                  obj.holename = '电力人孔井信息';
                  obj.dataList = { OBJECTID: newname };
                } else if (e.feature.primitive.asset.guid.includes('A320EE43E8F543A980C64B7C71F18350')) {//电力手孔井井盖
                  obj.holename = '电力手孔井井盖信息';
                  obj.dataList = { OBJECTID: newname };
                } else if (e.feature.primitive.asset.guid.includes('233AE28A3413460899CA889EA9C66F43')) {//电力手孔井
                  obj.holename = '电力手孔井信息';
                  obj.dataList = { OBJECTID: newname };
                } else if (e.feature.primitive.url.includes('1B98BC3817C74644967A6BAD22EA3A43')) {//给水检修井井盖
                  obj.holename = '给水检修井井盖信息';
                  obj.dataList = { OBJECTID: newname };
                } else if (e.feature.primitive.asset.guid.includes('96CE4E607AB44B41B81897A5409F7CFB')) {//给水检修井
                  obj.holename = '给水检修井信息';
                  obj.dataList = { OBJECTID: newname };
                } else if (e.feature.primitive.asset.guid.includes('453E19E78AE1460DBE2C6200973E7E7A')) {//排污检修井 井盖
                  obj.holename = '排污检修井井盖信息';
                  obj.dataList = { OBJECTID: newname };
                } else if (e.feature.primitive.asset.guid.includes('3594577468F942FCABA6B06E05A69C96')) {//排污检修井
                  obj.holename = '排污检修井信息';
                  obj.dataList = { OBJECTID: newname };
                } else if (e.feature.primitive.asset.guid.includes('CAE6AB06C3FB4AE28D6165E72A6B7015')) {//排水检修井 井盖
                  obj.holename = '排水检修井井盖信息';
                  obj.dataList = { OBJECTID: newname };
                } else if (e.feature.primitive.asset.guid.includes('8FD1ED809C004C02B94C4A7A0006A784')) {//排水检修井
                  obj.holename = '排水检修井信息';
                  obj.dataList = { OBJECTID: newname };
                } else if (e.feature.primitive.asset.guid.includes('098E4016FC3340E48FEB7D22E08B3FAB')) {//通讯检修井 井盖
                  obj.holename = '通讯检修井井盖信息';
                  obj.dataList = { OBJECTID: newname };
                } else if (e.feature.primitive.asset.guid.includes('1398A518639B4EAEBBF0A28F12ED02AA')) {//通讯检修井
                  obj.holename = '通讯检修井信息';
                  obj.dataList = { OBJECTID: newname };
                }
                $that.getwellbyid(obj);
              } else if (dataType.includes('dtpipeline-line')) {
                //电力 通讯 管线
                var name = e.feature.getProperty('name');
                var newname = wrap(name);
                var obj = new Object();
                obj.type = 'dpipelinedata';

                if (e.feature.primitive.asset.guid.includes('64414E0B6FEE40219BB5391ACF99AFBC')) {//电力
                  obj.holename = '电力管线信息';
                  obj.dataList = { PIPELINECODE: 'DL_GDX', OBJECTID: newname };
                }
                this.getjpstpipelinebyid(obj);
              }
            },
            'calback': function(tileset) {
              $that.setState({
                cesiumData: {
                  ...cesiumData,
                  [v.id]: tileset,
                },
              });
            },
          }, viewer);

        } else if (v.datatype && v.datatype.includes('dizhi')) {
          //地质模型
          mars3d.layer.createLayer({
            'name': '地质模型',
            'type': '3dtiles',
            'url': realUrl, //定义在 config\marsUrl.js
            'maximumScreenSpaceError': 2,
            'maximumMemoryUsage': 1024,
            'showClickFeature': true,
            'offset': {
              'z': v.offsetHeight,
            },
            'visible': true,
            'asset': {
              'dataType': v.datatype,
            },
            'click': function(e) {
              var dataType = e.feature.primitive._config.asset.dataType;
              if (dataType == 'dizhi-zk') {
                var primitive = $that.getprimitivebyid('dirlling');
                if (primitive.length > 0) {
                  primitive.removeAll();
                }
                var name = e.feature.getProperty('name');
                var id = strsplit(name);
                $that.getholedatabyid(id, primitive);
              } else if (dataType == 'dizhi-dz') {
                //地质
                var name = e.feature.getProperty('name');
                var id = strsplit(name);
                $that.getgeoatabyid(id);
              } else if (dataType == 'dizhi-pm') {
                //console.log("剖面");

                var name = e.feature.getProperty('name');
                var objectid = strsplit(name);
                $that.props.dispatch({
                  type: 'Home/setPMindex',
                  payload: objectid,
                });
                var contenturl = e.feature.content.url;
                var list = contenturl.split('/');
                var id = list[list.length - 2];
                $that.getgeoatabylayerid(id);

              } else if (dataType == 'dizhi-jk') {
                //console.log("基坑");
                var name = e.feature.getProperty('name');
                var id = strsplit(name.toString());
                $that.getgeoatabyid(id);
              }
            },
            'calback': function(tileset) {
              if (v.datatype === 'dizhi-pm') {
                tileset.shadows = 0;
                tileset.imageBasedLightingFactor = new Cesium.Cartesian2(3.0, 3.0);
              }

              $that.setState({
                cesiumData: {
                  ...cesiumData,
                  [v.id]: tileset,
                },
              });
            },
          }, viewer);


        } else {
            console.log(33333)
          if (!Cesium.defined(cesium3DTileset)) {
            cesium3DTileset = new Cesium.Cesium3DTileset({
              url: realUrl,
              modelMatrix: v.modelMatrix || Cesium.Matrix4.IDENTITY,
              maximumScreenSpaceError: 14,
              preferLeaves: true,
              skipLevelOfDetail: true,
              skipLevels: 1,
              skipScreenSpaceErrorFactor: 16,
              immediatelyLoadDesiredLevelOfDetail: false,
              loadSiblings: true,
              cullWithChildrenBounds: false,
              cullRequestsWhileMoving: false,
              cullRequestsWhileMovingMultiplier: 0.01,
              preloadWhenHidden: true,
              progressiveResolutionHeightFraction: 0.1,
              dynamicScreenSpaceErrorDensity: 500,
              dynamicScreenSpaceErrorFactor: 1,
              dynamicScreenSpaceError: true,
            
            });
         
            cesium3DTileset._name="demomodel";
            viewer.scene.primitives.add(cesium3DTileset);
            cesium3DTileset.readyPromise.then(function(tileset) {
              if (v.offsetHeight) {//调整高度
                let origin = tileset.boundingSphere.center;
                let cartographic = Cesium.Cartographic.fromCartesian(origin);
                let surface = Cesium.Cartesian3.fromRadians(cartographic.longitude, cartographic.latitude, 0.0);
                let offset = Cesium.Cartesian3.fromRadians(cartographic.longitude, cartographic.latitude, v.offsetHeight);
                let translation = Cesium.Cartesian3.subtract(offset, surface, new Cesium.Cartesian3());
                tileset.modelMatrix = Cesium.Matrix4.fromTranslation(translation);
              }
              // viewer.flyTo(cesium3DTileset)
            });
          }

        }

      function strsplit(name) {
        var nameList = name.split('_');
        var id = Number(nameList[nameList.length - 1].replace(/[^0-9]/ig, ''));
        return id;
      }

        //换行
      function wrap(name) {
        var onename = name.substring(0, 25) + '\n';
        var twoname = name.substring(25, name.length - 1);
        return onename + twoname;
      }

        // viewer.flyTo(cesium3DTileset)
        data = cesium3DTileset;
        break;
      case 'zhuji_district':
        let big_dataSource = new Cesium.CustomDataSource('zhuji_district');
        viewer.dataSources.add(big_dataSource);
        Object.keys(positionDistrict).forEach(item => {
          // this.addLabel({
          //   position: positionDistrict[item],
          //   name: item,
          //   size: 24,
          //   height: 150,
          //   type: 'district'
          // })
          const label = big_dataSource.entities.add({
            position: Cesium.Cartesian3.fromDegrees(...positionDistrict[item], 150),
            label: {
              id: item,
              text: item,
              font: 24 + 'px PingFangSC-Medium',
              fillColor: Cesium.Color.WHITE,
              translucencyByDistance: new Cesium.NearFarScalar(1.5e5, 1.0, 1.5e6, 0.0),
              scaleByDistance: new Cesium.NearFarScalar(1.5e5, 1.0, 1.5e6, 0.1),
              outlineWidth: 2,
              backgroundPadding: new Cesium.Cartesian2(12, 8),
              backgroundColor: Cesium.Color.fromCssColorString('#1694E7').withAlpha(.1),
              pixelOffset: new Cesium.Cartesian2(-30, -30),
              horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
            },
          });
        });
        // viewer.flyTo(big_dataSource)
        data = big_dataSource;
        break;
      case 'zhuji_street':
        // var prefixUrl = `/portal/manager/poiNs/range`;
        // const markImg = require('')
        var prefixUrl = `/portal/manager/poi/range`;
        let zhuji_dataSource18 = new Cesium.CustomDataSource('zhuji18');
        let zhuji_dataSource19 = new Cesium.CustomDataSource('zhuji19');
        let zhuji_dataSource20 = new Cesium.CustomDataSource('zhuji20');
        zhuji_dataSource18.show = false;
        zhuji_dataSource19.show = false;
        zhuji_dataSource20.show = false;
        viewer.dataSources.add(zhuji_dataSource18, { clampToGround: true });
        viewer.dataSources.add(zhuji_dataSource19, { clampToGround: true });
        viewer.dataSources.add(zhuji_dataSource20, { clampToGround: true });

      function addFeature(url, dataSource) {
        $.ajax({
          url: url,
          type: 'get',
          dataType: 'json',
          contentType: 'application/json;charset=UTF-8',
          success: function(data) {
            if (data.code == 200) {
              // let list = data.data === null ? [] : data.data.list
              // console.log(list)
              data.data && data.data.forEach((item, index) => {
                //添加实体
                var entitie = dataSource.entities.add({
                  name: item.textString,
                  position: Cesium.Cartesian3.fromDegrees(item.x, item.y),
                  // billboard: {
                  //   image: './config/images/mark1.png',
                  //   scale: 0.8,  //原始大小的缩放比例
                  //   horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
                  //   verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                  //   heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
                  //   scaleByDistance: new Cesium.NearFarScalar(1.5e2, 1.0, 8.0e6, 0.2)
                  // },
                  label: {
                    text: item.textString,
                    font: 'normal small-caps normal 12px 宋体',
                    style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                    fillColor: Cesium.Color.WHITE,
                    outlineColor: Cesium.Color.BLACK,
                    outlineWidth: 2,
                    showBackground: true,
                    backgroundColor: Cesium.Color.fromAlpha(Cesium.Color.fromCssColorString('#000000'), .9),
                    backgroundPadding: new Cesium.Cartesian2(8, 3),
                    horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
                    verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                    pixelOffset: new Cesium.Cartesian2(0, -24),   //偏移量  
                    heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
                    distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0.0, 2000000),
                  },
                  data: item,
                });
              });
            }
          },
          error: function(data) {
            console.log('请求出错(' + data.status + ')：' + data.statusText);
          },
        });
      }

        addFeature(prefixUrl + `/${18}`, zhuji_dataSource18);
        addFeature(prefixUrl + `/${19}`, zhuji_dataSource19);
        addFeature(prefixUrl + `/${20}`, zhuji_dataSource20);
        //监听鼠标滚动事件
        var zhuji_handler = new Cesium.ScreenSpaceEventHandler(viewer.canvas);
        zhuji_handler.setInputAction((event) => {
          var level = 0;
          if (viewer.scene.globe._surface._tilesToRender.length) {
            level = viewer.scene.globe._surface._tilesToRender[0].level;
          }
          if (level > 15 && level < 17) {
            zhuji_dataSource18.show = true;
            zhuji_dataSource19.show = false;
            zhuji_dataSource20.show = false;
          } else if (level >= 17 && level < 19) {
            zhuji_dataSource18.show = false;
            zhuji_dataSource19.show = true;
            zhuji_dataSource20.show = false;
          } else if (level >= 19 && level < 21) {
            zhuji_dataSource18.show = false;
            zhuji_dataSource19.show = false;
            zhuji_dataSource20.show = true;
          } else {
            zhuji_dataSource18.show = false;
            zhuji_dataSource19.show = false;
            zhuji_dataSource20.show = false;
          }
        }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
        data = [zhuji_dataSource20, zhuji_dataSource19, zhuji_dataSource20];
        this.setState({
          zhuji_handler,
        });
        break;
      case 'wms':
        realUrl = this.getCesiumUrl(v.url, true);
        var RectangleMaxValue = Cesium.Rectangle.fromDegrees(113.66180419921875,22.346878051757812,114.71649169921875,22.914047241210938);
        var dataDetail = JSON.parse(v.dataDetail);
        var rectangle = dataDetail.find((i) => i.paramName === "rectangle") || {};
        var rectangleNums = [];
        if (rectangle.value&&Object.values(rectangle).length>0){
          rectangleNums = rectangle.value.split(',').map(i => parseFloat(i));
        } 
        var rectangleObj = {};
        if(rectangleNums.length>0){
          rectangleObj= Cesium.Rectangle.fromDegrees(...rectangleNums);
        }
        var layerName = dataDetail.find((i) => i.paramName === "layer") || {};
        let provider = new Cesium.WebMapServiceImageryProvider({
          url: realUrl,
          layers: layerName.value,
          crs: 'EPSG:4490',
          parameters: {
            transparent: true,
            format: 'image/png',
          },
          rectangle:Object.values(rectangleObj).length>0?rectangleObj:RectangleMaxValue
        });
        let imageryLayer = viewer.imageryLayers.addImageryProvider(provider);
        // viewer.camera.flyTo({
        //   destination: {
        //     x: -2455009.579833841,
        //     y: 5462458.593463376,
        //     z: 2392774.6950951326,
        //   },
        //   orientation: {
        //     direction: {
        //       x: 0.37770042545634724,
        //       y: -0.8403930280909273,
        //       z: 0.3886926124153328,
        //     },
        //     up: {
        //       x: -0.1593385555179573,
        //       y: 0.3545323281052194,
        //       z: 0.9213674907732223,
        //     },
        //   },
        // });
        data = imageryLayer;
        break;
      case 'wmts':
        var imageslayers = window.viewer.imageryLayers;
        var RectangleMaxValue = Cesium.Rectangle.fromDegrees(113.66180419921875,22.346878051757812,114.71649169921875,22.914047241210938);
        var dataDetail = JSON.parse(v.dataDetail);
        var rectangle = dataDetail.find((i) => i.paramName === "rectangle") || {};
        var rectangleNums = [];
        if (rectangle.value&&Object.values(rectangle).length>0){
          rectangleNums = rectangle.value.split(',').map(i => parseFloat(i));
        } 
        var rectangleObj = {};
        if(rectangleNums.length>0){
          rectangleObj= Cesium.Rectangle.fromDegrees(...rectangleNums);
        }
        var gridsetName = dataDetail.find((i) => i.paramName === 'tileMatrixSetID') || {};
        var mapName = dataDetail.find((i) => i.paramName === "layer") || {};
        var url = v.url;//.replace("gatewayoms","168.4.0.3");
        var source,imageLayer;
        if(gridsetName.value.indexOf("4490")!==-1){//如果是4490坐标系
          url=`${url}rest/${mapName.value}/${gridsetName.value}/${gridsetName.value}:{sz}/{y}/{x}?format=image/png`;
          source = new Cesium.Resource({
            url: url,
            // headers:
            //   {
            //     'szvsud-license-key':  window.localStorage.getItem('userLicenseKey'),
            //   },
          });
          imageLayer=new Cesium.UrlTemplateImageryProvider({
            url: source,
            tilingScheme : new Cesium.GeographicTilingScheme(),
            minimumLevel:0,
            customTags:{
                sz:function(imageryProvider,x,y,level){
                    return level-9
                }
            },
            rectangle:Object.values(rectangleObj).length>0?rectangleObj:RectangleMaxValue
          })
          
        }else{
          url=`${url}rest/${mapName.value}/${gridsetName.value}/${gridsetName.value}:{TileMatrix}/{TileRow}/{TileCol}?format=image/png`;
          source = new Cesium.Resource({
            url: url,
            // headers:
            //   {
            //     'szvsud-license-key':  window.localStorage.getItem('userLicenseKey'),
            //   },
          });

          imageLayer = new Cesium.WebMapTileServiceImageryProvider({
            url: source,
            rectangle:Object.values(rectangleObj).length>0?rectangleObj:RectangleMaxValue
          });
        }


        data  = window.data= imageslayers.addImageryProvider(imageLayer);

        break
      case 'shenzhen_dl1':
        let shenzhen_dl1000 = new Cesium.CustomDataSource('shenzhen_dl1000');
        let shenzhen_dl10000 = new Cesium.CustomDataSource('shenzhen_dl10000');
        let shenzhen_dl250000 = new Cesium.CustomDataSource('shenzhen_dl250000');
        shenzhen_dl1000.show = false;
        shenzhen_dl10000.show = false;
        shenzhen_dl250000.show = false;
        viewer.dataSources.add(shenzhen_dl1000);
        viewer.dataSources.add(shenzhen_dl10000);
        viewer.dataSources.add(shenzhen_dl250000);

      function addSz_dl(url, dataSource) {
        let promise_line = Cesium.GeoJsonDataSource.load(url);
        promise_line.then(data => {
          let entities = data.entities.values;
          entities.map(entity => {
            entity.polyline.width = entity.properties.getValue().WIDTH != null ? parseFloat(entity.properties.getValue().WIDTH / 3) : 0;
            dataSource.entities.add(entity);
          });
        });
      }

        addSz_dl(v.url['250000'], shenzhen_dl250000);
        addSz_dl(v.url['10000'], shenzhen_dl10000);
        addSz_dl(v.url['1000'], shenzhen_dl1000);
        //监听鼠标滚动事件
        var handler = new Cesium.ScreenSpaceEventHandler(viewer.canvas);
        handler.setInputAction((event) => {
          var level = 0;
          if (viewer.scene.globe._surface._tilesToRender.length) {
            level = viewer.scene.globe._surface._tilesToRender[0].level;
          }
          // console.log(level);
          if (level > 5 && level < 10) {
            shenzhen_dl1000.show = false;
            shenzhen_dl10000.show = false;
            shenzhen_dl250000.show = true;
          } else if (level >= 10 && level < 13) {
            shenzhen_dl1000.show = false;
            shenzhen_dl10000.show = true;
            shenzhen_dl250000.show = false;
          } else if (level >= 13 && level < 21) {
            shenzhen_dl1000.show = true;
            shenzhen_dl10000.show = false;
            shenzhen_dl250000.show = false;
          } else {
            shenzhen_dl1000.show = false;
            shenzhen_dl10000.show = false;
            shenzhen_dl250000.show = false;
          }
        }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
        data = [shenzhen_dl1000, shenzhen_dl10000, shenzhen_dl250000];
        this.setState({
          handler,
        });
        break;
      case 'shenzhen_dl':
        let dlx_1000 = new Cesium.CustomDataSource('dlx_1000');
        let dlx_10000 = new Cesium.CustomDataSource('dlx_10000');
        let dlx_250000 = new Cesium.CustomDataSource('dlx_250000');

        viewer.dataSources.add(dlx_1000);
        viewer.dataSources.add(dlx_10000);
        viewer.dataSources.add(dlx_250000);

      function addlx(url, dataSource, param) {
        $.ajax({
          url: `${url}&bbox=${param.minx}%2C${param.miny}%2C${param.maxx}%2C${param.maxy}`,
          type: 'get',
          dataType: 'json',
          contentType: 'application/json;charset=UTF-8',
          success: function(data) {
            if (data && data.features && data.features.length) {
              dataSource.entities.removeAll();
              let promise_line = Cesium.GeoJsonDataSource.load(data, {
                clampToGround: true,
              });
              promise_line.then(data => {
                let entities = data.entities.values;
                entities.map(entity => {
                  entity.polyline.width = entity.properties.getValue().WIDTH != null ? parseFloat(entity.properties.getValue().WIDTH / 3) : 0;
                  dataSource.entities.add(entity);
                });
              });
            }
          },
          error: function(data) {
            console.log('请求出错(' + data.status + ')：' + data.statusText);
          },
        });
      }

        // 处理函数
        const that = this;

      function handle() {
        var level = 0;
        if (viewer.scene.globe._surface._tilesToRender.length) {
          level = viewer.scene.globe._surface._tilesToRender[0].level;
        }
        // console.log(level)
        let param = that.getViewExtend();//获取当前视域范围
        if (level > 9 && level < 12) {
          dlx_1000.show = false;
          dlx_10000.show = false;
          dlx_250000.show = true;
          addlx(v.url['250000'], dlx_250000, param);
        } else if (level >= 12 && level < 14) {
          dlx_1000.show = false;
          dlx_10000.show = true;
          dlx_250000.show = false;
          addlx(v.url['10000'], dlx_10000, param);
        } else if (level >= 14 && level < 20) {
          dlx_1000.show = true;
          dlx_10000.show = false;
          dlx_250000.show = false;
          addlx(v.url['1000'], dlx_1000, param);
        } else {
          dlx_1000.show = false;
          dlx_10000.show = false;
          dlx_250000.show = false;
        }
      }

        // 防抖
      function debounce(fn, wait) {
        var timeout = null;
        return function() {
          if (timeout !== null) clearTimeout(timeout);
          timeout = setTimeout(fn, wait);
        };
      }
        // 滚动事件
        var szdlx_handler = window.addEventListener('mousemove', debounce(handle, 1000));
        data = [dlx_1000, dlx_10000, dlx_250000];
        this.setState({
          szdlx_handler,
        });
        break;
      case 'tian_vec':
        let imageryLayer1 = viewer.imageryLayers.addImageryProvider(new Cesium.WebMapTileServiceImageryProvider({
          url: 'http://{s}.tianditu.gov.cn/vec_c/wmts?service=wmts&request=GetTile&version=1.0.0' +
            '&LAYER=vec&tileMatrixSet=c&TileMatrix={TileMatrix}&TileRow={TileRow}&TileCol={TileCol}' +
            '&style=default&format=tiles&tk=6e179266b26b2e2c5c4cce2c91823f40',
          layer: 'vec',
          style: 'default',
          format: 'tiles',
          tileMatrixSetID: 'c',
          subdomains: ['t0', 't1', 't2', 't3', 't4', 't5', 't7'],
          tilingScheme: new Cesium.GeographicTilingScheme(),
          tileMatrixLabels: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19'],
          maximumLevel: 50,
          show: true,
        }));
        data = imageryLayer1;
        break;
      case 'tian_img':
        let imageryLayer2 = viewer.imageryLayers.addImageryProvider(new Cesium.WebMapTileServiceImageryProvider({
          url: 'http://{s}.tianditu.gov.cn/img_c/wmts?service=wmts&request=GetTile&version=1.0.0' +
            '&LAYER=img&tileMatrixSet=c&TileMatrix={TileMatrix}&TileRow={TileRow}&TileCol={TileCol}' +
            '&style=default&format=tiles&tk=6e179266b26b2e2c5c4cce2c91823f40',
          layer: 'img',
          style: 'default',
          format: 'tiles',
          tileMatrixSetID: 'c',
          subdomains: ['t0', 't1', 't2', 't3', 't4', 't5', 't7'],
          tilingScheme: new Cesium.GeographicTilingScheme(),
          tileMatrixLabels: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19'],
          maximumLevel: 50,
          show: true,
        }));
        data = imageryLayer2;
        break;
      case 'fin3dtiles':
        //精细模型加载
        // document.getElementById("Maskb").style.display="block";
        cesium3DTileset = this.getModelbyurl(v.url);
        window.szlayer && (window.szlayer.show = true);
        if (cesium3DTileset) {
          cesium3DTileset.show = true;
        } else {
          cesium3DTileset = new Cesium.Cesium3DTileset({
            url: realUrl,
          });
          viewer.scene.primitives.add(cesium3DTileset);
          cesium3DTileset.readyPromise.then(function(tileset) {
            tileset.asset.dataType = v.datatype;
            if (v.offsetHeight) {//调整高度
              let origin = tileset.boundingSphere.center;
              let cartographic = Cesium.Cartographic.fromCartesian(origin);
              let surface = Cesium.Cartesian3.fromRadians(cartographic.longitude, cartographic.latitude, 0.0);
              let offset = Cesium.Cartesian3.fromRadians(cartographic.longitude, cartographic.latitude, v.offsetHeight);
              let translation = Cesium.Cartesian3.subtract(offset, surface, new Cesium.Cartesian3());
              tileset.modelMatrix = Cesium.Matrix4.fromTranslation(translation);
            }
          });
        }
        if (cesium3DTileset.asset.loaded) {
          // document.getElementById("Maskb").style.display="none";
        } else {
          cesium3DTileset.allTilesLoaded.addEventListener(function() {
            cesium3DTileset.asset.loaded = true;
            // document.getElementById("Maskb").style.display="none";


          });
        }


        addfin3dTilestime++;
        //隐藏 倾斜摄影
        // console.log('各大行政区倾斜摄影已隐藏');
        var List = ['dapeng', 'baoan', 'futian', 'guangming', 'lingdingdao', 'longgang', 'longhua', 'luohu', 'nanshan', 'pingshan', 'yantian'];
        List.forEach((element) => {
          let url = sz_osgb.children[element];
          let primitives = this.getModelbyurl(url);
          if (primitives.show) {
            primitives.show = false;
          } else {
            return;
          }
        });

        // let primitives = this.getModelbyurl(sz_osgb.url);
        // if(primitives.show){
        //   primitives.show = false;
        // }
        data = cesium3DTileset;
        break;
      case 'geojson':
        realUrl = this.getCesiumUrl(v.url, true);
        var dataSource = await viewer.dataSources.add(Cesium.GeoJsonDataSource.load(realUrl, {
          clampToGround: true,
        }));

        data = dataSource;
        break;
      case 'mapserver':
        realUrl = this.getCesiumUrl(v.url, true);
        data = this.loadMapServer(realUrl);
        break;
      case 'kml':
        realUrl = this.getCesiumUrl(v.url, true);
        data = this.loadKMLKMZ(realUrl);
        break;
      case 'kmz':
        realUrl = this.getCesiumUrl(v.url, true);
        data =  this.loadKMLKMZ(realUrl);
        break;
      case 'wfs':
        // console.log(v)
        var requestParams =v.gisApi.requestParams||[];
        var dataDetail = JSON.parse(v.dataDetail);
        var layerName = dataDetail.find((i) => i.label === "typeName") || {};
        var url = v.gisApi.apiUrl||v.gisApi.exposedRelUrl
        realUrl = this.getCesiumUrl(url+`?service=WFS&request=GetFeature&typeName=${layerName.value}&outputFormat=application/json`, true);
        data =  await viewer.dataSources.add(Cesium.GeoJsonDataSource.load(realUrl,{clampToGround:true}));
        break;
      case 'arcgis-imageserver':
        var dataDetail = JSON.parse(v.dataDetail);
        var rectangle = dataDetail.find((i) => i.paramName === "rectangle") || {};
        realUrl = this.getArcgisUrl(v.url+"exportImage", true);
        data = this.loadArcgisServer(realUrl, rectangle.value);
        break;
      case 'arcgis-mapserver':
        realUrl = this.getArcgisUrl(v.url, true);
        var dataDetail = JSON.parse(v.dataDetail);
        var rectangle = dataDetail.find((i) => i.paramName === "rectangle") || {};
        data = this.loadArcgisServer(realUrl, rectangle.value);
        break;
      case 'arcgis-featureserver':
        realUrl = this.getArcgisUrl(v.url, true);
        var dataDetail = JSON.parse(v.dataDetail);
        var rectangle = dataDetail.find((i) => i.paramName === "rectangle") || {};
        var layer  = dataDetail.find(i => i.paramName === 'layer') || {};
        data = this.loadArcgisServer(realUrl, rectangle.value, layer.value);
        break;
    }
    return data;
    // this.setState({
    //   cesiumData: {
    //     ...cesiumData,
    //     [v.id]: data
    //   }
    // })
  };

  //添加/删除图层
  check = async (checkedKeys) => {
    const { cesiumData } = this.state;
    // if (checkedKeys.indexOf("75") !== -1) {
    //   window.gridWidget.activate()
    // } else {
    //   window.gridWidget.disable()
    // }
    let { addData, delData } = this.compareData(this.props.LayerManager.checkedKeys, checkedKeys);
    if (addData.length) {
      let cesiumDataTemp = {};
      let addCount = 0;
      addData.forEach((v, index) => {
        this.addLayer(flatLayersData[v]).then((data) => {
          cesiumDataTemp[v] = data;
          addCount++;
          if (addCount === addData.length) {
            this.setState({
              cesiumData: {
                ...cesiumData,
                ...cesiumDataTemp,
              },
            });
          }
        });
      });
    }
    if (delData.length) {
      delData.forEach((v, index) => {
        this.delLayer(flatLayersData[v]);
      });
    }
    this.props.dispatch({
      type: 'LayerManager/setCheckedKeys',
      payload: checkedKeys,
    });
  };

  //删除cesium图层数据
  delLayer =  (v) => {
    if(!v)return;
    v.type = v && v.type && v.type.toLowerCase();

    const { cesiumData, zhuji_handler, szdlx_handler } = this.state;
    switch (v.type) {
      case 'terrain':
        viewer.terrainProvider = new Cesium.EllipsoidTerrainProvider();
        break;
      case 'fin3dtiles':
        //隐藏
        cesiumData[v.id].show = false;
        window.szlayer && (window.szlayer.show = false);
        addfin3dTilestime--;
        break;
      case '3dtiles':
        if (v.specialmark == undefined) {
          if (v.id == '10284') {
            var data = viewer.dataSources.getByName('lhzkpoi')[0];
            data.entities.removeAll();
          }
          viewer.scene.primitives.remove(cesiumData[v.id]);
        } else {

        }
        break;
      case 'geojson':
        viewer.dataSources.remove(cesiumData[v.id], true);
        break;
      case 'geojson_local':
        viewer.dataSources.remove(cesiumData[v.id], true);
        viewer.mars.draw.clearDraw();
        break;
      case 'shapefile_local':
        viewer.dataSources.remove(cesiumData[v.id], true);
        viewer.mars.draw.clearDraw();
          break;
      case 'point':
        viewer.dataSources.remove(cesiumData[v.id], true);
        break;
      case 'wms':
        viewer.imageryLayers.remove(cesiumData[v.id], true);
        break;
      case 'wmts':
        viewer.imageryLayers.remove(cesiumData[v.id], true);
        break;
      case 'wfs':
        viewer.dataSources.remove(cesiumData[v.id], true)
        break;
      case 'zhuji_street':
        cesiumData[v.id] && cesiumData[v.id].forEach((item) => {
          viewer.dataSources.remove(item, true);
        });
        zhuji_handler && zhuji_handler.destroy();
        break;
      case 'zhuji_district':
        viewer.dataSources.remove(cesiumData[v.id], true);
        break;
      case 'shenzhen_dl':
        cesiumData[v.id].forEach((item) => {
          viewer.dataSources.remove(item, true);
        });
        szdlx_handler && szdlx_handler.destroy();
        break;
      case 'tian_vec':
        viewer.imageryLayers.remove(cesiumData[v.id], true);
      case 'tian_img':
        viewer.imageryLayers.remove(cesiumData[v.id], true);
        break;
      case 'arcgis-imageserver':
        viewer.imageryLayers.remove(cesiumData[v.id], true);
        break;
      case 'arcgis-mapserver':
        viewer.imageryLayers.remove(cesiumData[v.id], true);
        break;
      case 'arcgis-featureserver':
        viewer.imageryLayers.remove(cesiumData[v.id], true);
        break;
      default:
        break;
    }
    // console.log(viewer.imageryLayers);
  };

  loadKMLKMZ = url => {
    viewer.dataSources.add(
        Cesium.KmlDataSource.load(url, { camera: viewer.scene.camera, canvas: viewer.scene.canvas })
      )
      .then(dataSource => {
        viewer.dataSources.add(dataSource);
        viewer.flyTo(dataSource, {
          offset: {
            heading: Cesium.Math.toRadians(0),
            pitch: Cesium.Math.toRadians(-90.0), //l从上往下看为-90
            roll: 0,
          },
        });
        return  dataSource
      });
    // viewer.imageryLayers.addImageryProvider(provider);
    // this.setState({ obj: provider, type: 'wms' })
  };

  loadGeoJSON = (url, style = {}) => {
    Cesium.GeoJsonDataSource.load(url, style).then(dataSource => {
      viewer.dataSources.add(dataSource);
      viewer.flyTo(dataSource, {
        offset: {
          heading: Cesium.Math.toRadians(0),
          pitch: Cesium.Math.toRadians(-90.0), //从上往下看为-90
          roll: 0,
        },
      });
     return dataSource
    });
  };

  loadArcgisServer = (url, rectangle, layer) => {
    var RectangleMaxValue = Cesium.Rectangle.fromDegrees(113.66180419921875,22.346878051757812,114.71649169921875,22.914047241210938);
    let rectangleNums = [];
    if (rectangle) rectangleNums = rectangle.split(',').map(i => parseFloat(i));
    var rectangleObj = {};
    if(rectangleNums.length>0){
      rectangleObj= Cesium.Rectangle.fromDegrees(...rectangleNums);
    }
    let imageLayer = viewer.imageryLayers.addImageryProvider(
      new Cesium.ArcGisMapServerImageryProvider({
        url: url,
        layers: layer,
        rectangle:Object.values(rectangleObj).length>0?rectangleObj:RectangleMaxValue
      })
    );
    if (rectangleNums.length) {
      viewer.camera.flyTo({
        offset: {
          heading: Cesium.Math.toRadians(0),
          pitch: Cesium.Math.toRadians(-90.0), //从上往下看为-90
          roll: 0,
        },
        destination: Cesium.Rectangle.fromDegrees(...rectangleNums),
        duration: 1.0,
      });
    }
    return imageLayer;
  };

  loadMapServer = url => {
    let layer = viewer.imageryLayers.addImageryProvider(
      new Cesium.ArcGisMapServerImageryProvider({
        url: url,
      })
    );
    layer._imageryProvider._readyPromise.then(
      res => {},
      rej => {
        // this.errorHandler(`获取数据错误，请检查数据地址是否正确:${url}`)
      }
    );
    viewer.flyTo(layer, {
      offset: {
        heading: Cesium.Math.toRadians(0),
        pitch: Cesium.Math.toRadians(-90.0), //从上往下看为-90
        roll: 0,
      },
    });
    return layer
  };


  //根据路径 获取模型
  getModelbyurl = (url) => {
    let primitives = viewer.scene.primitives._primitives;
    let Ftileset = undefined;
    primitives.forEach((data) => {
      let newurl = data.url;
      if (newurl === url) {
        Ftileset = data;
        return;
      }
    });
    return Ftileset;
  };
  //给水 排水 排污 天然气 管线请求暂时
  getjpstpipelinebyid = async (object) => {
    this.props.dispatch({
      type: 'Home/setBuildingInfo',
      payload: object,
    });
  };
  //井盖 检修井 请求暂时
  getwellbyid = async (object) => {
    this.props.dispatch({
      type: 'Home/setBuildingInfo',
      payload: object,
    });
  };
//钻孔请求
  getholedatabyid = async (id, p) => {
    let data = await request(`/vb/hole/model/prop/${id}`);
    if (data.success) {
      let holeid = data.data.HOLEID;
      let holedata = await request(`/vb/hole/model/prop/hole/${holeid}`);
      if (holedata.success) {
        //添加贴地圆
        var X4490 = Number(holedata.data[0].X4490), Y4490 = Number(holedata.data[0].Y4490);
        var position = Cesium.Cartesian3.fromDegrees(X4490 + 0.000001, Y4490 + 0.00000385, -20);
        //var position = Cesium.Cartesian3(entity.option.X, entity.option.Y, 0);
        var circleinstance = new Cesium.GeometryInstance({
          geometry: new Cesium.CircleGeometry({
            center: position,
            radius: 0.634,
            /* extrudedHeight:1000000//拉申高度 */
          }),
          attributes: {
            color: new Cesium.ColorGeometryInstanceAttribute(0.53, 0.90, 0.09, 0.5),
          },
        });
        p.add(new Cesium.GroundPrimitive({
          geometryInstances: [circleinstance],
          appearance: new Cesium.PerInstanceColorAppearance(),
        }));
        viewer.scene.primitives.add(p);
        var obj = new Object();
        obj.type = 'zkholedata';
        obj.holename = '钻孔地层信息';
        obj.holedataList = holedata.data;
        this.props.dispatch({
          type: 'Home/setBuildingInfo',
          payload: obj,
        });
      }
    } else {
      console.log('hole请求失败');
    }
  };
//转世纪
  gettimeyear = () => {
    let dates = new Date();
    let year = dates.getFullYear();
    let century = Math.floor(year / 100);
    if (year % 100) {
      century++;
    }
    return '第' + century + '世纪';
  };
  //地层请求
  getgeoatabyid = async (id) => {
    let data = await request(`/vb/geo/model/prop/${id}`);
    if (data.success) {
      var obj = new Object();
      obj.type = 'zcgeodata';
      obj.holename = '地层模型信息';
      if (data.data) {
        if (!data.data.AGEID) {
          data.data.AGEID = this.gettimeyear();
        }
        obj.dataList = data.data;
        this.props.dispatch({
          type: 'Home/setBuildingInfo',
          payload: obj,
        });
      } else {
        this.props.dispatch({
          type: 'Home/setBuildingInfo',
          payload: null,
        });
      }

    } else {
      console.log('geo请求失败');
    }
  };
  //剖面请求
  getgeoatabylayerid = async (id) => {
    let data = await request(`/vb/geo/profile/${id}`);
    if (data.success) {
      var obj = new Object();
      obj.type = 'pmholedata';
      obj.holename = '剖面地质信息';
      obj.holedataList = data.data;
      this.props.dispatch({
        type: 'Home/setBuildingInfo',
        payload: obj,
      });
    }
  };
  //获取边界
  getViewExtend = () => {
    let params = {};
    let extend = viewer.camera.computeViewRectangle();
    if (typeof extend === 'undefined') {
      //2D下会可能拾取不到坐标，extend返回undefined,所以做以下转换
      let canvas = viewer.scene.canvas;
      let upperLeft = new Cesium.Cartesian2(0, 0);//canvas左上角坐标转2d坐标
      let lowerRight = new Cesium.Cartesian2(
        canvas.clientWidth,
        canvas.clientHeight,
      );//canvas右下角坐标转2d坐标

      let ellipsoid = viewer.scene.globe.ellipsoid;
      let upperLeft3 = viewer.camera.pickEllipsoid(
        upperLeft,
        ellipsoid,
      );//2D转3D世界坐标

      let lowerRight3 = viewer.camera.pickEllipsoid(
        lowerRight,
        ellipsoid,
      );//2D转3D世界坐标

      let upperLeftCartographic = viewer.scene.globe.ellipsoid.cartesianToCartographic(
        upperLeft3,
      );//3D世界坐标转弧度
      let lowerRightCartographic = viewer.scene.globe.ellipsoid.cartesianToCartographic(
        lowerRight3,
      );//3D世界坐标转弧度

      let minx = Cesium.Math.toDegrees(upperLeftCartographic.longitude);//弧度转经纬度
      let maxx = Cesium.Math.toDegrees(lowerRightCartographic.longitude);//弧度转经纬度

      let miny = Cesium.Math.toDegrees(lowerRightCartographic.latitude);//弧度转经纬度
      let maxy = Cesium.Math.toDegrees(upperLeftCartographic.latitude);//弧度转经纬度

      params.minx = minx;
      params.maxx = maxx;
      params.miny = miny;
      params.maxy = maxy;
    } else {
      //3D获取方式
      params.maxx = Cesium.Math.toDegrees(extend.east);
      params.maxy = Cesium.Math.toDegrees(extend.north);

      params.minx = Cesium.Math.toDegrees(extend.west);
      params.miny = Cesium.Math.toDegrees(extend.south);
    }
    return params;//返回屏幕所在经纬度范围
  };


  flyTo = (selectedKeys, e) => {
  
    const { checked, eventKey } = e.node.props;
    const { cesiumData,wfsCesiumData } = this.state;
    if (eventKey.includes('1027') && !eventKey.includes('10274')) {
      var Rollerblindcamera = { 'y': 22.546937, 'x': 114.044283, 'z': 86.54, 'heading': 0, 'pitch': -8.3, 'roll': 0 };
      let cartesian = Cesium.Cartesian3.fromDegrees(Rollerblindcamera.x, Rollerblindcamera.y, Rollerblindcamera.z);


 

      viewer.camera.flyTo({
        destination: cartesian,
        orientation: {
          heading: Cesium.Math.toRadians(Rollerblindcamera.heading),
          pitch: Cesium.Math.toRadians(Rollerblindcamera.pitch),
          roll: Cesium.Math.toRadians(Rollerblindcamera.roll),
        },
      });



    } else {
      if(wfsCesiumData[eventKey]){
      

        e.node.isLeaf() && checked && viewer.flyTo(wfsCesiumData[eventKey]);
      }else{

       
       
        if( e.node.isLeaf() && checked )
        {
          let tileset=cesiumData[eventKey] ;

          tileset.readyPromise
          .then(function (tileBuilding) {
          
            
            if(tileBuilding && tileBuilding.boundingSphere )
            {
              tileset.boundingSphere.radius=tileBuilding.boundingSphere.radius * 0.5
              viewer.scene.camera.flyToBoundingSphere(tileBuilding.boundingSphere ) 
            }


          })
        
  


          // if(tileset && tileset.boundingSphere )
          // {
          //   tileset.boundingSphere.radius=tileset.boundingSphere.radius * 0.5
          //   viewer.scene.camera.flyToBoundingSphere(tileset.boundingSphere ) 
          // }


       
        }
        
       
        //viewer.flyTo(cesiumData[eventKey]);
      }
    }
  };

  //显隐弹窗
  toggleModal = () => {
    const { isShowModal } = this.state;
    this.setState({
      isShowModal: !isShowModal,
    });
    !isShowModal && this.props.dispatch({
      type: 'Map/cleanToolsKey',
    });
  };
  //根据路径 获取模型
  getModelbyurl = (url) => {
    let primitives = viewer.scene.primitives._primitives;
    let Ftileset = undefined;
    primitives.forEach((data) => {
      let newurl = data.url;
      if (newurl === url) {
        Ftileset = data;
        return;
      }
    });
    return Ftileset;
  };

  //新增自定义图层
  addNode = (values) => {
    const { checkedKeys } = this.props.LayerManager;
    const { layersData, cesiumData,saveControlObj} = this.state;
    let controlObj={}; //记录新增自定义图层数据Id，默认值为true，用来显示是否显示保存按钮
    if (!values.children) {
      values.children = [];
    }
    controlObj[values.id]=true;
    let nodes = deepClone(layersData);
    nodes[nodes.length - 1].children.push(values);
    flatLayersData = flat(nodes);
    this.addCustomLayer(values).then((data) => {
      this.setState({
        cesiumData: {
          ...cesiumData,
          [values.id]: data,
        },
      });
    });
    // this.addLayer(values).then((data) => {
    //   this.setState({
    //     cesiumData: {
    //       ...cesiumData,
    //       [values.id]: data,
    //     },
    //   });
    // });
    this.setState({
      saveControlObj:Object.assign({},saveControlObj,controlObj),
      layersData: nodes,
      showTool: true,
    });
    this.props.dispatch({
      type: 'LayerManager/setCheckedKeys',
      payload: [...checkedKeys, values.id],
    });
    this.toggleModal();
  };

  //添加自定义图层
  addCustomLayer = async(v)=>{
    let data = null;
    let that = this;
    if(!v)return;
    v.type = v && v.type && v.type.toLowerCase();
    switch (v.type) {
      case "geojson_local"://本地geojson文件
        let entity = this.jsonToLayer(v.file);
        v.url="geojson_local";
        data = entity;
        break;  
      case "shapefile_local"://本地geojson文件
        let entityShapeFile = this.jsonToLayer(v.file);
        v.url="shapefile_local";
        data = entityShapeFile;
        break;  
      case '3dtiles':
        let realUrl = this.getCesiumUrl(v.url, true);
        let cesium3DTileset = new Cesium.Cesium3DTileset({
          url: realUrl,
          modelMatrix: v.modelMatrix || Cesium.Matrix4.IDENTITY,
        });
        viewer.scene.primitives.add(cesium3DTileset);
        cesium3DTileset.readyPromise.then(function(tileset) {
          if (v.offsetHeight) {//调整高度
            let origin = tileset.boundingSphere.center;
            let cartographic = Cesium.Cartographic.fromCartesian(origin);
            let surface = Cesium.Cartesian3.fromRadians(cartographic.longitude, cartographic.latitude, 0.0);
            let offset = Cesium.Cartesian3.fromRadians(cartographic.longitude, cartographic.latitude, v.offsetHeight);
            let translation = Cesium.Cartesian3.subtract(offset, surface, new Cesium.Cartesian3());
            tileset.modelMatrix = Cesium.Matrix4.fromTranslation(translation);
          }
          // viewer.flyTo(cesium3DTileset)
        });
        data = cesium3DTileset;
        break;
      case 'wms':
        realUrl = this.getCesiumUrl(v.url, true);
        // var dataDetail = JSON.parse(v.dataDetail);
        // var layerName = dataDetail.find((i) => i.paramName === "layer") || {};
        let provider = new Cesium.WebMapServiceImageryProvider({
          url: realUrl,
          layers: v.layerName,
          crs: 'EPSG:4490',
          parameters: {
            transparent: true,
            format: 'image/png',
          },
        });
        let imageryLayer = viewer.imageryLayers.addImageryProvider(provider);
        // viewer.camera.flyTo({
        //   destination: {
        //     x: -2455009.579833841,
        //     y: 5462458.593463376,
        //     z: 2392774.6950951326,
        //   },
        //   orientation: {
        //     direction: {
        //       x: 0.37770042545634724,
        //       y: -0.8403930280909273,
        //       z: 0.3886926124153328,
        //     },
        //     up: {
        //       x: -0.1593385555179573,
        //       y: 0.3545323281052194,
        //       z: 0.9213674907732223,
        //     },
        //   },
        // });
        data = imageryLayer;
        break;
      case 'wfs':
        data = this.getWfsDataFromUrl(v);
        break;
    }
    return data;
  }

  jsonToLayer = (json)=>{
    return viewer.mars.draw.loadJson(json, {
        clear: true,
        flyTo: false,
    },true);
  }

  rotateicon = (selectedKeys, e) => {
    // console.log('节点');
    // console.log(e);
  };
  
  toggleExpand = ()=>{
    this.setState({
      toggleExpand:!this.state.toggleExpand
    })
  }


  render() {
    const { checkedKeys } = this.props.LayerManager;
    const { layersData, isShowModal } = this.state;
    return (
      // <div className={`${styles.box} ${this.props.leftActiveKey==='layers'?styles.show:styles.hide}`}>
      <div className={`${styles.box}`}>
        {/*<ModuleTitle title='数据图层'  >*/}
        <div className={styles.expend} onClick={this.toggleExpand} >{this.state.toggleExpand?"收起全部":"展开全部"}</div>
        <div className={styles.addBtn} onClick={this.toggleModal}/>
        {/*</ModuleTitle>*/}

        {this.state.toggleExpand?<Tree
          className={styles.tree}
          checkable
          onCheck={this.check}
          checkedKeys={checkedKeys}
          onSelect={this.flyTo}
          showIcon
          showLine={true}
          defaultExpandAll
          // switcherIcon={<Icon type="plus-square"></Icon>}
          // switcherIcon={<Icon type="double-right"></Icon>}
          onExpand={this.rotateicon}
        >
          {this.renderTreeNodes(layersData)}
        </Tree>:null}

        {this.state.toggleExpand?null:<Tree
          showLine={true}
          className={styles.tree}
          checkable
          onCheck={this.check}
          checkedKeys={checkedKeys}
          onSelect={this.flyTo}
          showIcon
          
          // switcherIcon={<Icon type="plus-square" style={{fontSize:'20px',color:'rgba(142,224,248,0.70)'}}></Icon>}
          // switcherIcon={<Icon type="double-right"></Icon>}
          onExpand={this.rotateicon}
        >
          {this.renderTreeNodes(layersData)}
        </Tree>}


        {
          isShowModal&&<FormModal show={isShowModal}
            close={this.toggleModal}
            submit={this.addNode}
          />
        }
        {

        }
      </div>
    );
  }
}

export default LayersManage;
