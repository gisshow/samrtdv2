/* global Cesium */
/* global viewer */
/* global mars3d */
import React, { Component } from 'react';
import styles from './style.less'
import RootContainer from '@/components/rootContainer'
import {Slider} from 'antd'

class Clip extends Component {

    constructor(props) {
        super(props);
        this.state={
            max:100,
            min:-100,
        }
        this.clipTileset=null;
    }

    componentDidMount(){
        this.setClipTileset();
    }

    componentWillUnmount(){
        this.clear();
        if(this.clipTileset){
            this.clipTileset=null;
        }
    }

    

    setClipTileset=()=>{
        const {tileset}=this.props;
        this.clipTileset = new mars3d.tiles.TilesClipPlan(tileset);
        var radius = 2000*tileset.boundingSphere.radius;
        this.setState({
            max:radius,
            min:-radius,
        })
    }

    drawLine=()=>{
        this.clipTileset.clear();
        viewer.mars.draw.startDraw({
            type: 'polyline',
            config: { maxPointNum: 2 },
            style: {
                color: '#007be6',
                opacity: 0.8,
                outline: false,
            },
            success:  (entity)=> { //绘制成功后回调 
                var points = viewer.mars.draw.getPositions(entity);
                viewer.mars.draw.deleteAll();

                this.clipTileset.Lineup=0;
                this.clipTileset.clipByPoints(points);
            }
        });
    }

    drawExtent=()=>{
        this.clipTileset.clear();
        viewer.mars.draw.startDraw({
            type: 'rectangle',
            style: {
                color: '#007be6',
                opacity: 0.8,
                outline: false,
                // clampToGround: true
            },
            success:  (entity)=> { //绘制成功后回调 
                var positions = mars3d.draw.attr.rectangle.getOutlinePositions(entity, true);

                viewer.mars.draw.deleteAll()


                this.clipTileset.clipByPoints(positions, {
                    unionClippingRegions: false,
                    edgeColor: Cesium.Color.GREY,
                    edgeWidth: 2.0,
                });
            }
        }); 
    }

    drawPoly=()=>{
        this.clipTileset.clear();

        viewer.mars.draw.startDraw({
            type: "polygon",
            style: {
                color: "#007be6",
                opacity: 0.5,
                clampToGround: true,
            },
            success: (entity)=> { //绘制成功后回调
                var points = viewer.mars.draw.getPositions(entity);
                viewer.mars.draw.deleteAll();

                this.clipTileset.clipByPoints(points, { unionClippingRegions: false });
            }
        });
    }

    drawClipZ=()=>{
        this.clipTileset.type = mars3d.tiles.TilesClipPlan.Type.ZR;
    }

    drawClipY=()=>{
        this.clipTileset.type = mars3d.tiles.TilesClipPlan.Type.Y;
    }

    drawClipX=()=>{
        this.clipTileset.type = mars3d.tiles.TilesClipPlan.Type.X;
    }

    onDistanceChange=(value)=>{
        this.clipTileset.distance = value;
    }


    clear=()=>{
        this.clipTileset.clear();
    }

    render() {
        const {max,min}=this.state;
        // const {startTime,endTime}=this.props;
        return (
            // <RootContainer>
                <div className={styles.clip}>
                    <div className={styles.item}>
                        <span className={styles.name}>绘制剖切</span>
                        <span className={styles.btn} onClick={()=>this.drawLine()}>绘制线段</span>
                        {/* <span className={styles.btn} onClick={()=>this.drawExtent()}>绘制矩形</span> */}
                    </div>
                    <div className={styles.item}>
                        <span className={styles.name}>方向剖切</span>
                        <span className={styles.btn} onClick={()=>this.drawClipZ()}>切顶部</span>
                        <span className={styles.btn} onClick={()=>this.drawClipX()}>切西向</span>
                        <span className={styles.btn} onClick={()=>this.drawClipY()}>切南向</span>
                    </div>
                    <div className={`${styles.item} ${styles.slider}`}>
                        <span className={styles.name}>裁剪距离</span>
                        <Slider tooltipVisible={false} max={max} min={min} defaultValue={0}   onChange={this.onDistanceChange.bind(this)}/>
                    </div>
                    <div className={styles.footer}><span className={styles.btn} onClick={()=>this.clear()}>清除</span></div>
                </div>
                
            // </RootContainer>

        )
    }
}

export default Clip;