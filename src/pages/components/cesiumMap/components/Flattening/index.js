/* global Cesium */
/* global viewer */
/* global mars */
/* global $ */
/* global mars3d */
/* turf */
import React, { Component } from 'react';
import { Button,message,Upload,Icon,Tooltip } from 'antd';
import { connect } from 'dva';
import styles from './style.less';
import BorderPoint from '../../../border-point'

@connect(({RightFloatMenu }) => ({
    RightFloatMenu
}))

class FlatteningPanel extends Component {
    constructor(props) {
        super(props)
        this.state={
            btnTextg:'上传',
            isbtnActive:null,
            isbtnDisActive:null,
            dataSources:[],
            positions:[],
            upoloading:false,
            flatArr:[]
        }; 
        
    }

    componentDidMount() {
    
    }

    componentWillUnmount() {
        
    }

    drawPolygon = () => {
        // this.clearDraw(true);
        viewer.mars.draw.startDraw({
            type: "polygon",
            style: {
                color: "#ffff00",
                opacity: 0.2,
                clampToGround: true,
            },
            success: (entity)=> {
                this.setState({
                    positions:viewer.mars.draw.getPositions(entity)
                })
            }
        });
        this.setState({
            activeKey:'polygon',
        })
    }

    //方向按钮方法
    btnClick=(type)=>{
        const { positions,flatArr } = this.state;
        let tileset = null;
        let newFlatObj = null;
        let newFlatObjArr=[];
        let iter=null;
        let done = false;
        switch(type){
            case 'draw': //绘制
                viewer.mars.draw.deleteAll();
                this.setState({
                    isbtnDisActive:type
                })
                if (flatArr.length>0) {
                    flatArr.forEach(item=>{
                        item.destroy();
                    })
                    this.setState({
                        flatArr : []
                    })
                }
                this.drawPolygon();  
            break;
            case 'flatten': //压平
                this.setState({
                    isbtnActive:type
                })
                iter = positions[Symbol.iterator]();
                while(!done){
                    let iterObj = iter.next();
                    done = iterObj.done;
                    let positionsValue = [iterObj.value];
                    tileset = mars3d.tileset.pick3DTileset(viewer, positionsValue);//拾取绘制返回的模型
                    if(tileset){
                        tileset._config={};
                    }
                    if(tileset){
                        newFlatObj =new mars3d.tiles.TilesFlat({
                            viewer: viewer,
                            tileset: tileset,
                            positions: positions,
                            flatHeight: 0,
                        })
                        newFlatObjArr.push(newFlatObj)
                    }
                }
                this.setState({
                    flatArr:newFlatObjArr
                })
                break; 
            case 'unflatten': //反向压平
                this.setState({
                    isbtnActive:type
                })
                break;    
            case 'recover': //恢复
                this.setState({
                    isbtnActive:type
                })
                if (flatArr.length>0) {
                    flatArr.forEach(item=>{
                        item.destroy();
                    })
                    this.setState({
                        flatArr : []
                    })
                }
                break; 
            default:
                break;
        }
    }

    close=()=>{
        const { flatArr } = this.state;
        if (flatArr.length>0) {
            flatArr.forEach(item=>{
                item.destroy();
            })
            this.setState({
                flatArr : []
            })
        }
        viewer.mars.draw.deleteAll();
        this.props.dispatch({
            type: 'Map/setToolsActiveKey',
            payload: ""
        })
    }

  render() {
    const {isbtnActive,btnTextg,upoloading,isbtnDisActive} = this.state;
    return (
        <div className={styles.MeasurePanel}>
            <BorderPoint />
            <div className={styles.close} onClick={() => {this.close()}}>
                    <Tooltip title="关闭" >
                        <Icon type="close"/>
                    </Tooltip>
            </div>
            <div className={styles.container}>
                <div className={styles.controlScope}>
                    <div>
                        <div className={styles.title}>
                            <span>压平范围</span>
                        </div>
                        <div>
                            <Button className={`${styles.pipbutton} ${styles.marginBtn} ${isbtnDisActive==='draw'?styles.buttonActive:''}`} onClick={this.btnClick.bind(this,'draw')}>绘制</Button>
                            <Upload
                                name="multipartFile"
                                className={styles.UploadStyle}
                                style={{width:'100%'}}
                                multiple= {false}
                                showUploadList = {false}
                                maxCount={1}
                                beforeUpload = {(file)=>{
                                    viewer.mars.draw.deleteAll();
                                    const { flatArr } = this.state;
                                    if (flatArr.length>0) {
                                        flatArr.forEach(item=>{
                                            item.destroy();
                                        })
                                        this.setState({
                                            flatArr : []
                                        })
                                    }
                                    this.setState({
                                        upoloading:true,
                                        btnTextg:'正在加载',
                                        isbtnDisActive:'upload'
                                    },()=>{
                                        const FILETYPEARR = ["json","geojson","text"];
                                        const fileType = file.name.split('.').pop();
                                        if(!FILETYPEARR.includes(fileType)){
                                            message.error('您上传的文件格式有无，请重新上传')
                                            this.setState({
                                                upoloading:false,
                                                btnTextg:'上传'
                                            })
                                            return false
                                        }
                                        const myThis = this;
                                        //开始解析
                                        const reader = new FileReader();
                                        reader.readAsText(file)
                                        reader.onload = function(){
                                            const { result } = this;                             
                                            let feaStr=JSON.parse(result);
                                            let entityArr=viewer.mars.draw.loadJson(feaStr, {
                                                clear: true,
                                                flyTo: false,
                                            },true);
                                            let positions=viewer.mars.draw.getPositions(entityArr[0]);
                                            myThis.setState({
                                                positions:positions,
                                                upoloading:false,
                                                btnTextg:'上传'
                                            })
                                        }
                                    })
                                }}    
                            >
                                <Button className={`${styles.pipbutton} ${styles.marginBtn} ${isbtnDisActive==='upload'?styles.buttonActive:''}`} loading={upoloading}>{btnTextg}</Button>
                            </Upload>
                        </div>
                    </div>
                </div>
                <div className={styles.controlWay}>
                    <div>
                        <div className={styles.title}>
                            <span>压平方式</span>
                        </div>
                        <div>
                            <Button className={`${styles.pipbutton} ${styles.marginBtn} ${isbtnActive==='flatten'?styles.buttonActive:''}`} onClick={this.btnClick.bind(this,'flatten')}>压平</Button>
                            {/* <Button className={`${styles.pipbutton} ${styles.marginBtn} ${isbtnActive==='unflatten'?styles.buttonActive:''}`} onClick={this.btnClick.bind(this,'unflatten')}>反向压平</Button> */}
                            <Button className={`${styles.pipbutton} ${styles.marginBtn} ${isbtnActive==='recover'?styles.buttonActive:''}`} onClick={this.btnClick.bind(this,'recover')}>恢复</Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
  }
}

export default FlatteningPanel;