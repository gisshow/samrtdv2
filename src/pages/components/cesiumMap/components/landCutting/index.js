/* global Cesium */
/* global viewer */
/* global mars */
/* global $ */
/* global mars3d */
/* turf */
import React, { Component } from 'react';
import { Slider, Button, Tooltip, Icon,Row, Col,Checkbox } from 'antd'
import styles from './style.less'
import { connect } from 'dva';
import { PUBLIC_PATH } from '@/utils/config'
import BorderPoint from '../../../border-point'
import {getCesiumUrl} from '@/utils/index';
const Ajax = require('axios');
let datacutover, motherBoard,AllSmallCategory={};
const categoryItem=[{name:"请选择",key:"empty"},{name:"倾斜摄影",key:"qingxie"},{name:"地质",key:"dizhi"},{name:"管线",key:"guanxian"},{name:"室内模型",key:"shinei"}];

@connect(({RightFloatMenu }) => ({
  RightFloatMenu
}))
class LandCuttingPanel extends Component {
  constructor(props) {
    super(props);  
    this.state={
        smallCategory:[],
        categoryName:"请选择",
        categoryKey:"empty",
        smallCategoryName:"请选择",
        smallCategoryKey:"empty",
        cutKey:"",
        isbtnActive:'',
        min:0,
        min:-100,
        max:100,
        clipDistance:0,
    } 
    this.clipTileset=null;
    this.underGround=null;
    this.depthTest=viewer.scene.globe.depthTestAgainstTerrain;
  }
  async componentDidMount() {
    let data1 = await Ajax.get(`${PUBLIC_PATH}config/motherBoard.json`);
    motherBoard = data1.data

    let data2 = await Ajax.get(`${PUBLIC_PATH}config/datacutover.json`);
    datacutover = data2.data

    this.setSmallCategory()
  }
  componentWillUnmount() {
      if(this.clipTileset && this.clipTileset.tileset){
        if(this.clipTileset.tileset.type=='add'){
            viewer.scene.primitives.remove(this.clipTileset.tileset);
        }else{
            // 只是隐藏   记录进来之前的显示状态？
            this.clipTileset.tileset.show=false;
        }
        this.clipTileset.clear();
        this.clipTileset=null;
      }
      viewer.camera.moveEnd.raiseEvent();
      this.setGroundAlpha(1.0);
      viewer.scene.globe.depthTestAgainstTerrain=this.depthTest;
      this.underGround=null;
      
  }

  setSmallCategory=()=>{
    const {reality: {sz_osgb:{children}}} = motherBoard;
    const { layers: { water_ranqi, water_gongshui, water_wushui, water_yushui, dizhi},dataswicth:{Indoormodel}} = datacutover;
    // 倾斜
    AllSmallCategory.qingxie=[
        {name:'福田区',key:'futian','url':children.futian},
        {name:'龙岗区',key:'longgang','url':children.longgang},
        {name:'宝安区',key:'baoan','url':children.baoan},
        {name:'南山区',key:'nanshan','url':children.nanshan},
        {name:'光明区',key:'guangming','url':children.guangming},
        {name:'龙华区',key:'longhua','url':children.longhua},
        {name:'坪山区',key:'pingshan','url':children.pingshan},
        {name:'大鹏新区',key:'dapeng','url':children.dapeng},
        {name:'盐田区',key:'yantian','url':children.yantian},
        {name:'罗湖区',key:'luohu','url':children.luohu},
        {name:'伶仃岛',key:'lingdingdao','url':children.lingdingdao},
    ];
    // 地质
    AllSmallCategory.dizhi=dizhi.filter(item=>item.key.indexOf('-di')!=-1);

    //管线
    AllSmallCategory.guanxian=[water_ranqi[0],water_gongshui[0],water_wushui[0],water_yushui[0]];

    //室内
    AllSmallCategory.shinei=Indoormodel.filter(item=>item.name!='会展中心');

  }

  //选择框先择方法
  openPannel=(type,itemKey,item)=>{
    switch(type){
        case 'top': 
          break;
        case 'bottom': 
          break; 
        default:
            break;
    }
  }

  //方向按钮方法
  btnClick=(type)=>{
    this.setState({
        isbtnActive:type
    })
    if(!this.clipTileset) return;
    switch(type){
        case 'top': //顶
            this.clipTileset.type=mars3d.tiles.TilesClipPlan.Type.ZR;
          break;
        case 'bottom': //底
            this.clipTileset.type=mars3d.tiles.TilesClipPlan.Type.Z;
          break; 
        case 'east': //东
            this.clipTileset.type=mars3d.tiles.TilesClipPlan.Type.XR;
            break; 
        case 'west': //西
            this.clipTileset.type=mars3d.tiles.TilesClipPlan.Type.X;
            break;    
        case 'south': //南
            this.clipTileset.type=mars3d.tiles.TilesClipPlan.Type.Y;
            break; 
        case 'north': //北
            this.clipTileset.type=mars3d.tiles.TilesClipPlan.Type.YR;
            break;  
        default:
            this.clipTileset.clear();
            break;
    }
    this.onChange(0);
  }

  click=(type,item)=>{
    const {isbtnActive} =this.state;
    if(this.clipTileset && this.clipTileset.tileset){
        if(this.clipTileset.tileset.type=='add'){
            viewer.scene.primitives.remove(this.clipTileset.tileset);
        }else{
            // 只是隐藏   记录进来之前的显示状态？
            this.clipTileset.tileset.show=false;
        }
        this.clipTileset.clear();
        this.clipTileset=null;
    }
    this.setState({
        smallCategoryName:'请选择'
    })
    if(type=='category'){//大类
        // 更新小类
        this.setState({
            categoryName:item.name,
            categoryKey:item.key,
            smallCategory:AllSmallCategory[item.key]
        })
    }else{
        // 设置为裁剪状态（全局）
        // 加载具体数据，首先判断是否存在，存在则显示，不存在则重新加载
        if(item.key!=''){
            this.setState({
                smallCategoryName:item.name || item.title
            })
            // 隐藏所有倾斜
            this.hideAllOSGB();
            var model=this.getModelByUrl(item.url);
            if(model){
                model.show=true;
                var clipTileset = new mars3d.tiles.TilesClipPlan(model);
                this.clipTileset=clipTileset;
                var radius = model.boundingSphere.radius*3;
                this.setState({min:-radius,max:radius});
            }else{
                this.addModel(item)
            }

            // 重置剖切方向及距离

            this.btnClick(isbtnActive);
            
        }
        if(item.key && (item.key.indexOf('-di')!==-1 || item.key.indexOf('water')!==-1)){
            this.setGroundAlpha(0.2);
        }else{
            this.setGroundAlpha(1.0);
        }
    }
  }

  //隐藏倾斜模型
  hideAllOSGB=()=>{
    let osgbs=AllSmallCategory.qingxie;
    osgbs.forEach(item => {
        let model=this.getModelByUrl(item.url);
        model.show=false;
    });
  }

  setGroundAlpha=(value)=>{
    if (!this.underGround) {
        viewer.scene.globe.depthTestAgainstTerrain = true;
        viewer.scene.globe.baseColor = new Cesium.Color(0, 0, 0, 0);
        this.underGround = new mars3d.analysi.Underground(viewer, {
          alpha: value,
          enable: value==1.0?false:true,
        });
  
    }else {
        this.underGround.alpha = value;
        if (this.underGround.alpha == 1.0) {
            this.underGround.enable = false;
        } else {
        this.underGround.enable = true;
        }
    }
  }

  addModel=(item)=>{
    let resource = getCesiumUrl(item.url,true);//new Cesium.Resource({ url: children[key], headers: { 'authorization': item.authorization, 'szvsud-license-key': window.localStorage.getItem('userLicenseKey') } })
    let cesium3DTileset = new Cesium.Cesium3DTileset({
      url: resource,//children[key],
      maximumScreenSpaceError: 16,
      preferLeaves: true,
      skipLevelOfDetail: true,
      skipLevels: 1,
      skipScreenSpaceErrorFactor: 16,
      immediatelyLoadDesiredLevelOfDetail: false,
      loadSiblings: true,
      preloadWhenHidden: true,
      type:"add",
    });
    viewer.scene.primitives.add(cesium3DTileset);
    cesium3DTileset.readyPromise.then((tileset)=> {
        if (item.offsetHeight) { //调整高度
          let origin = tileset.boundingSphere.center;
          let cartographic = Cesium.Cartographic.fromCartesian(origin);
          let surface = Cesium.Cartesian3.fromRadians(cartographic.longitude, cartographic.latitude, 0.0);
          let offset = Cesium.Cartesian3.fromRadians(cartographic.longitude, cartographic.latitude, item.offsetHeight);
          let translation = Cesium.Cartesian3.subtract(offset, surface, new Cesium.Cartesian3());
          tileset.modelMatrix = Cesium.Matrix4.fromTranslation(translation);
        }
        var clipTileset = new mars3d.tiles.TilesClipPlan(tileset);
        this.clipTileset=clipTileset;
        var radius = tileset.boundingSphere.radius*3;
        this.setState({min:-radius,max:radius});
    })
    
  }

  //根据路径 获取模型
  getModelByUrl = (url) => {
    let primitives = viewer.scene.primitives._primitives;
    let Ftileset = undefined;
    for (let i = 0; i < primitives.length; i++) {
        const item = primitives[i];
        if(item.url==url){
            return item;
        }
    }
    return null;
  }

  onChange=(value)=>{
      this.setState({
        clipDistance:Number(value)
      })
      this.clipTileset.distance = Number(value);
  }

  render() {
    const { categoryName,smallCategory,smallCategoryName,max,min,clipDistance,isbtnActive} = this.state;
    return (
      <div className={styles.MeasurePanel}>
            <BorderPoint />
            <div className={styles.close} onClick={() => {
                this.props.dispatch({
                    type: 'Map/setToolsActiveKey',
                    payload: ""
                })
            }}>
                <Tooltip title="关闭" >
                    <Icon type="close"/>
                </Tooltip>
            </div>
            <div className={styles.container}>
                <div className={styles.controlDiv}>
                    <div>
                        <div className={styles.title}>
                            <span>选择模型</span>
                        </div>
                        <div className={styles.selectDiv}>
                            <div className={`${styles.selectBox} ${styles.marginselect}`}>
                                <div className={styles.btn} onClick={()=>this.openPannel()}>
                                    <Tooltip className={styles.btnText} title={categoryName}>{categoryName}</Tooltip>
                                    <span className="icon iconfont icon_unfold1"></span>
                                </div>
                                <div className={styles.pannel}>
                                    {
                                        categoryItem.map((item,index)=>{
                                            return (
                                                <div className={styles.item}  key={item.key} onClick={()=>this.click('category',item)}>
                                                    <Tooltip className={styles.btnText} title={item.name || item.title}>{item.name || item.title}</Tooltip>
                                                </div>
                                            )
                                        })
                                    }
                                </div>
                            </div>
                            <div className={styles.selectBox}>
                                <div className={styles.btn} onClick={()=>this.openPannel()}>
                                    <Tooltip className={styles.btnText} title={smallCategoryName}>{smallCategoryName}</Tooltip>
                                    <span className="icon iconfont icon_unfold1"></span>
                                </div>
                                <div className={styles.pannel}>
                                    {
                                        smallCategory.map((item,index)=>{
                                            return (
                                                <div className={styles.item}  key={item.key || item.id || index} onClick={()=>this.click('smallCategory',item)}>
                                                    <Tooltip className={styles.btnText} title={item.name || item.title}>{item.name || item.title}</Tooltip>
                                                </div>
                                            )
                                        })
                                    }
                                </div>
                            </div>
                        </div>
                    </div>
                    <div>
                        <div className={styles.title}>
                            <span>剖切方向</span>
                        </div>
                        <div>
                            <Button className={`${styles.pipbutton} ${styles.marginBtn} ${isbtnActive==='top'?styles.buttonActive:''}`} onClick={this.btnClick.bind(this,'top')}>顶面</Button>
                            <Button className={`${styles.pipbutton} ${styles.marginBtn} ${isbtnActive==='bottom'?styles.buttonActive:''}`} onClick={this.btnClick.bind(this,'bottom')}>底面</Button>
                            <Button className={`${styles.pipbutton} ${styles.marginBtn} ${isbtnActive==='east'?styles.buttonActive:''}`} onClick={this.btnClick.bind(this,'east')}>东面</Button>
                            <Button className={`${styles.pipbutton} ${styles.marginBtn} ${isbtnActive==='west'?styles.buttonActive:''}`} onClick={this.btnClick.bind(this,'west')}>西面</Button>
                            <Button className={`${styles.pipbutton} ${styles.marginBtn} ${isbtnActive==='south'?styles.buttonActive:''}`} onClick={this.btnClick.bind(this,'south')}>南面</Button>
                            <Button className={styles.pipbutton} onClick={this.btnClick.bind(this,'north')}>北面</Button>
                        </div>
                    </div>
                </div>
                <div>
                    <div className={styles.title}>
                        <span>裁剪距离</span>
                    </div>
                    <Slider min={min} max={max} step={0.1} value={clipDistance} onChange={this.onChange.bind(this)}></Slider>
                </div>
            </div>
        </div>
    );
  }
}

export default LandCuttingPanel;