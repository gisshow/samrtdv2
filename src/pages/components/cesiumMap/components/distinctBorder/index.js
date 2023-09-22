/* global Cesium */
/* global viewer */

import React, { Component } from 'react';
import SZ_DISTINCT_LINE from './sz_distinct_part_line2.geojson'
import SZ_Wall from './shenzhen_coor_array.json'
import IMG from './border.png'
class DistinctBorder extends Component {

    constructor(props){
        super(props)
        this.LineEntity=undefined;
        this.wallEntity=undefined;
    }
    
    componentDidMount(){
        this.loadWallBorder();
        this.loadDistinct(SZ_DISTINCT_LINE);
    }

    loadWallBorder=()=>{
        const coorArr = SZ_Wall.coordinates;
        let maximumHeights = [];
        let minimumHeights = [];
        if (coorArr) {
          coorArr.forEach((item, index) => {
            if (index % 2 === 0) {
              maximumHeights.push(2000);
              minimumHeights.push(0);
            }
          });
        }

        let SZWall = viewer.entities.add({
            name : 'SZWall',
            wall : {
              positions: Cesium.Cartesian3.fromDegreesArray(coorArr),
              maximumHeights,
              minimumHeights,
              material: new Cesium.ImageMaterialProperty({
                transparent: true,
                image: IMG
              }),
              shadows: Cesium.ShadowMode.CAST_ONLY
            }
        });

        this.wallEntity=SZWall;

    }

    loadDistinct= async (url)=>{
        let options = {
            clampToGround: true //开启贴地
        };
        let dataSource = await Cesium.GeoJsonDataSource.load(url, options);
        // geocachePromise.then(function(dataSource) {
        viewer.dataSources.add(dataSource);
        this.LineEntity=dataSource;
        const entities = dataSource.entities.values;
        entities.forEach(entity => {
           
            // entity.show=false;
            entity.polyline.width = 3;
            entity.polyline.material = new Cesium.PolylineGlowMaterialProperty({
                glowPower: .6,
                color: Cesium.Color.fromCssColorString('#1694E7').withAlpha(.9)
            })
            // 添加Wall,循环坐标点
            // let positions=entity.polyline.positions.getValue();
            // let maximumHeights = [];
            // let minimumHeights = [];
            // if (positions) {
            //     positions.forEach((item, index) => {
            //         // if (index % 2 === 0) {
            //             maximumHeights.push(2000);
            //             minimumHeights.push(0);
            //         // }
            //     });
            // }
            // entity.wall=new Cesium.WallGraphics({
            //     positions: positions,
            //     maximumHeights,
            //     minimumHeights,
            //     material: new Cesium.ImageMaterialProperty({
            //         transparent: true,
            //         image: getColorRamp({
            //         0.0: 'rgba(68, 157, 247, 1.0)',
            //         0.045: 'rgba(68, 157, 247, 0.8)',
            //         0.1: 'rgba(68, 157, 247, 0.6)',
            //         0.15: 'rgba(68, 157, 247, 0.4)',
            //         0.37: 'rgba(68, 157, 247, 0.2)',
            //         0.54: 'rgba(68, 157, 247, 0.1)',
            //         1.0: 'rgba(68, 157, 247, 0)'
            //         })
            //     }),
            // });
        })        
    }

    componentWillUnmount(){
        if(this.LineEntity){
            viewer.dataSources.remove(this.LineEntity);
            this.LineEntity=null;
        }
        if(this.wallEntity){
            viewer.entities.remove(this.wallEntity);
            this.wallEntity=null;
        }
    }
    
    render() {
        return null;
    }
}

export default DistinctBorder;