/* global Cesium */
/* global viewer */
/* global mars */
/* global $ */
/* global mars3d */
/* turf */
import React, { Component } from 'react';
import { PUBLIC_PATH } from '@/utils/config'
import { connect } from 'dva'
const Ajax = require('axios');


@connect(({ House }) => ({House}))

class PanoramicView extends Component {
    constructor(props) {
        super(props)
        this.state={
            dataSourceData:{}
        }; 
        
    }

    componentDidMount() {
        this.openPanoramicView();
    }

    componentWillUnmount() {
        
    }

    openPanoramicView= async ()=>{
        let panoramicViewData = await Ajax.get(`${PUBLIC_PATH}config/vr.json`);
        if(panoramicViewData.status===200){
            let dataSource= new Cesium.CustomDataSource();
            viewer.dataSources.add(dataSource);
            this.props.dispatch({
                type: 'House/savePanoramicViewdataSource',
                payload: dataSource,
            });
            let features =  panoramicViewData.data.data;
            let pointPositions = [];
            features = features.map(item=>{
                pointPositions=Cesium.Cartesian3.fromDegrees(item.x_coord, item.y_coord,0);
                let iconameurl = `${PUBLIC_PATH}config/images/location_list@Rx.png`;
                let entity= dataSource.entities.add({
                    id: item.id,
                    name: item.name,
                    position: pointPositions,
                    // position: Cesium.Cartesian3.fromDegrees(lng, lat, 0),
                    billboard: {
                        image: iconameurl,
                        scale: 0.8,  //原始大小的缩放比例
                        horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
                        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND, //贴地
                        scaleByDistance: new Cesium.NearFarScalar(1.5e2, 1.0, 8.0e6, 0.2),
                        disableDepthTestDistance: Number.POSITIVE_INFINITY, //一直显示，不被地形等遮挡
                    },
                    data: item,
                    click:(item)=>{
                        window.open(item._data.url)
                    }
                });   
            });
        }
    }

    render() {
        return (
            <></>
        );
    }
}

export default PanoramicView;