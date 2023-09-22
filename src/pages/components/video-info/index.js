/* global Cesium */
/* global viewer */
/* global mars */
/* global $ */
/* global mars3d */
/* turf */

import React, { Component } from 'react'
import style from './index.less'
import { Slider, Button, InputNumber, Table, Switch, Radio, Checkbox, Row, Col, Tree, Icon, Image, Pagination, Tooltip, Input, Spin } from 'antd'
import { connect, connectAdvanced } from 'dva';
import { PUBLIC_PATH } from '@/utils/config'
import { request } from '@/utils/request';
import Sider from 'antd/lib/layout/Sider';
import Item from 'antd/lib/list/Item';
import BorderPoint from '@/pages/components/border-point'
import CheckboxGroup from 'antd/lib/checkbox/Group';
import { GeologyListConfig, PipeLineConfig } from '@/pages/components/leftSider/config';
import VideoTouShe from "./videoTou";
const Ajax = require('axios');

let videoConfig;

let uavList = [{
    name: '无人机-测试1',
    source: '海监',
    location: [114, 22.56]
}, {
    name: '无人机-测试2',
    source: '公安',
    location: [113.92, 22.5]
}, {
    name: '无人机-固定3',
    source: '交通',
    location: [113.95, 22.4]
}]
for (let i = 0; i < 10; i++) {
    uavList.push({
        name: '摄像头测试' + parseInt(Math.random() * 10),
        source: Math.random() * 10 > 5 ? '海监' : '公安',
        location: [113.92 + Math.random() * 0.1, 22.5 + Math.random() * 0.1]
    })
}

@connect(({ Map, RightFloatMenu, Video }) => ({
    Map, RightFloatMenu, Video
}))

class VideoInfo extends Component {
    constructor(props) {
        super(props);
        this.state = {
            tabName: 'video',
            showVideoInfo: true,
            showloading:true,
            inputValue: '',      //搜索框值
            fuseSetting: 1,      // 0，未融合，1融合
            selectedVideo: null,//选中的视频项，展示详情
            list_defaultPageSize: 14, //默认一页显示多少
            list_total: 0,       //列表个数
            list_current: 1,      //当前页

            video_toushe: false,
            video_toushe_arr: [], //投射的视频组 废弃

            uavList: uavList
        }

    }

    async componentWillMount() {
        let config = await Ajax.get(`${PUBLIC_PATH}config/video.json`);
        videoConfig = config.data
        //禁用图标双击事件
        viewer.cesiumWidget.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK)

        const { list_defaultPageSize, inputValue, fuseSetting } = this.state
        this.props.dispatch({
            type: 'Video/videoList',
            payload: {
                page: 0,
                size: list_defaultPageSize,
                fuseSetting: fuseSetting, //是否融合
                likeName: inputValue
            }
        }).then(({ success, data }) => {
            // console.log(data)
            this.setState({

                list_total: data.total,

            })
        })
    }

    componentDidMount() {
        setTimeout(() => {
            this.addVideoMap()
        }, 2000)
    }

    componentWillUnmount(){
        //清除图标点
        viewer.dataSources.removeAll();
        //清除
        this.VideoTouShe.destroyAll()
        
    }

    addVideoMap = () => {
        const { videoList, } = this.props.Video
        let dataSource = new Cesium.CustomDataSource('video');
        viewer.dataSources.removeAll();
        viewer.dataSources.add(dataSource);
        this.setState({
            showloading:true,
        })

        videoList.forEach((item, index) => {
            //添加实体
            var entitie = dataSource.entities.add({
                id: index,
                name: item.name,
                position: Cesium.Cartesian3.fromDegrees(item.px, item.py, 0),
                billboard: {
                    image: encodeURI(`${PUBLIC_PATH}config/images/video/icon_camera_normal.png`),
                    scale: 0.7,  //原始大小的缩放比例
                    horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
                    verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                    // heightReference: Cesium.HeightReference.CLAMP_TO_GROUND, //贴地
                    scaleByDistance: new Cesium.NearFarScalar(1.5e2, 1.0, 8.0e6, 0.2),
                    // disableDepthTestDistance: Number.POSITIVE_INFINITY, //一直显示，不被地形等遮挡 
                },
                label: {
                    text: item.name,
                    show: false,
                    font: "normal small-caps normal 19px 楷体",
                    style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                    fillColor: Cesium.Color.AZURE,
                    outlineColor: Cesium.Color.BLACK,
                    outlineWidth: 2,
                    horizontalOrigin: Cesium.HorizontalOrigin.LEFT,
                    verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                    pixelOffset: new Cesium.Cartesian2(10, 0), //偏移量
                    // heightReference: Cesium.HeightReference.CLAMP_TO_GROUND, //贴地
                    distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0.0, 80000)
                },
                data: item,
                click: (entity) => {//单击
                    this.clickVideo(entity.data,entity.id)
                }
            });
        })
        viewer.flyTo(dataSource.entities, { duration: 3 }).then(()=>{
            this.setState({
                showloading:false,
            })
        });
    }

    hideVideo = () => {
        let datasources = viewer.dataSources.getByName('video')
        for (let i = 0; i < datasources.length; i++) {
            let datasource = datasources[i]
            datasource.show = false;
        }
    }

    clickVideo = (item, index) => {
        const { videoList } = this.props.Video
        let copy = videoList
        if (copy[index].show) { // 关闭
            copy[index].show = false

            let datasources = viewer.dataSources.getByName('video')
            let datasource = datasources[0]
            let entities = datasource.entities
            let selected = entities.getById(index)
            selected.billboard.image = encodeURI(`${PUBLIC_PATH}config/images/video/icon_camera_normal.png`)

            //关闭网页端播放
            this.state.ws && this.state.ws.close();
            //关闭投影播放
            let video_toushe_arr = this.state.video_toushe_arr;
            video_toushe_arr.remove(item)
            let video_toushe = video_toushe_arr.length === 0 ? false : true;
            // console.log(video_toushe_arr);
            this.VideoTouShe.destoryViewField(item)


            this.setState({
                video_toushe_arr,
                video_toushe,
                showVideoInfo: false,
            })

            this.props.dispatch({
                type: 'Video/setVideoList',
                payload: copy
            })

            this.clearVideoStream()

        } else { //显示
            copy[index].show = true

            viewer.camera.flyTo({
                destination: Cesium.Cartesian3.fromDegrees(item.px, item.py + 0.00415, 2000), //经度、纬度、高度
                orientation: {
                    heading: Cesium.Math.toRadians(0),
                    pitch: Cesium.Math.toRadians(-90),
                    roll: Cesium.Math.toRadians(0)
                },
                duration: 4
            });

            let datasources = viewer.dataSources.getByName('video')
            let datasource = datasources[0]
            let entities = datasource.entities
            let selected = entities.getById(index)
            selected.billboard.image = encodeURI(`${PUBLIC_PATH}config/images/video/icon_camera_selected.png`)


            this.props.dispatch({
                type: 'Video/setVideoList',
                payload: copy
            })

            setTimeout(() => {
                this.setState({
                    showVideoInfo: true,
                    selectedVideo: copy[index]
                }, () => {
                    this.startVideo(copy[index])
                })
            }, 1000)

        }

    }

    closeVideo = () => {

        this.state.ws && this.state.ws.close();

        this.setState({
            showVideoInfo: false
        })
    }

    startVideo = (item) => {
        let _this = this;
        //先要调用接口开启视频流
        this.props.dispatch({
            type:'Video/videoStream',
            payload:{
                gbsNum:item.gbsNum,
                gbsPass:item.gbsPass
            }
        }).then(result=>{
            setTimeout(()=>{
                this.setState({
                    ws: new WebSocket(`${videoConfig.rstp}${item.id}`)
                }, () => {
                    // 连接成功后播放视频
                    this.state.ws.onopen = function (message) {
                        _this.playVideo(item);
                    }
                    this.state.ws.onmessage = function (message) {
                        var parsedMessage = JSON.parse(message.data);
                        // console.log(`parsedMessage,${parsedMessage}`)
                        if (parsedMessage.id == "startResponse") {
                            _this.state.webRtcPeer.processAnswer(parsedMessage.sdpAnswer, function (error) {
                                if (error)
                                    return console.error(error);
                                // console.log(parsedMessage.sdpAnswer)
                            });
                        } else if (parsedMessage.id == "iceCandidate") {
                            _this.state.webRtcPeer.addIceCandidate(parsedMessage.candidate, function (error) {
                                if (error)
                                    return console.error('Error adding candidate: ' + error);
                            });
                        }
                    }
                })
            },3000)
        })
    }

    //保流
    stayVideoStream = (item)=>{
        window.videoInterval = window.setInterval(()=>{
            this.props.dispatch({
                type:'Video/videoStay',
                payload:{
                    gbsNum:item.gbsNum,
                    gbsPass:item.gbsPass
                }
            })
        },15000)
    }
    //清除保流
    clearVideoStream = ()=>{
        window.clearInterval(window.videoInterval)
    }

    playVideo = (item) => {
        let _this = this;
        var options = {
            remoteVideo: document.getElementById("myVideo"),
            mediaConstraints: {
                audio: true,
                video: true
            },
            onicecandidate: onIceCandidate
        }
        let webRtcPeer = new window.kurentoUtils.WebRtcPeer.WebRtcPeerRecvonly(options,
            function (error) {
                if (error)
                    return console.error(error);
                webRtcPeer.generateOffer(onOffer);
            });
        this.setState({
            webRtcPeer: webRtcPeer
        })
        // 回调参数
        function onIceCandidate(candidate) {
            var message = {
                id: 'onIceCandidate',
                candidate: candidate
            }
            _this.sendMessage(message);
        }
        // 回调参数
        function onOffer(error, offerSdp) {
            var message = {
                id: 'start',
                sdpOffer: offerSdp,
                videourl: item.ip
            }
            _this.sendMessage(message);
        }
        this.stayVideoStream(item);
    }
    // 发送信息
    sendMessage = (message) => {
        var jsonMessage = JSON.stringify(message);
        // console.log(jsonMessage)
        // console.log(_this.state.ws)
        this.state.ws.send(jsonMessage);
    }

    changeTab(name) {
        this.setState({
            ...this.state,
            tabName: name
        })
    }
    toggleVideo() {
        let showVideoInfo = this.state.showVideoInfo
        this.setState({
            ...this.state,
            showVideoInfo: !showVideoInfo
        })
    }
    closePanel() {
        this.props.toggleVideoPanel('videoScale')
    }

    onInputFocus = ()=>{
        //关闭键盘事件
        this.doKeyEvent(false)
    }

    onInputChange = (e) => {
        this.setState({
            inputValue: e.target.value
        })
    }

    onInputBlur = () =>{
        //打开键盘事件
        this.doKeyEvent(true)
    }

     //键盘事件开关
    doKeyEvent = (isActive) => {
        var isHomekeystop;
        if (!isActive) {
        isHomekeystop = true;
        viewer.mars.keyboardRoam.unbind();
        } else {
        isHomekeystop = false;
        viewer.mars.keyboardRoam.bind()
        }
        //控制键盘漫游是否开启
        this.props.dispatch({
        type: 'RightFloatMenu/setisHomekeystop',
        payload: isHomekeystop
        })
    }

    // 分页向前向后翻页
    listChange = (page, pageSize) => {
        const { list_defaultPageSize, inputValue, fuseSetting } = this.state
        this.setState({
            showloading:true
        })
        this.props.dispatch({
            type: 'Video/videoList',
            payload: {
                page: page - 1,
                size: list_defaultPageSize,
                fuseSetting: fuseSetting, //是否融合
                likeName: inputValue,
            }
        }).then(({ success, data }) => {
            this.setState({
                list_current: page,
                list_total: data.total,
                showloading:false
            })
            this.addVideoMap()
            this.VideoTouShe.destroyAll()
        })
    }
    listSearch = () => {
        const { inputValue, fuseSetting, list_defaultPageSize } = this.state
        this.setState({
            showloading:true,
        })

        this.props.dispatch({
            type: 'Video/videoList',
            payload: {
                page: 0,
                size: list_defaultPageSize,
                fuseSetting: fuseSetting, //是否融合
                likeName: inputValue,
            }
        }).then(({ success, data }) => {
            this.setState({
                list_current: data.pageNum + 1,
                list_total: data.total,
            })
            this.addVideoMap()
            this.VideoTouShe.destroyAll()
        })
    }

    //切换投射
    putVideoTou = () => {
        const { video_toushe_arr, selectedVideo} = this.state
        let video_toushe_arr1 = [...video_toushe_arr, selectedVideo];
        let video_toushe = video_toushe_arr1.length === 0 ? false : true;
        // console.log(video_toushe_arr1)
        this.setState({
            video_toushe_arr:video_toushe_arr1,
            video_toushe,
            showVideoInfo: !this.state.showVideoInfo,
        },()=>{
            this.VideoTouShe.addViewField(selectedVideo)
        })
    }

    onRef = (ref) =>{
        this.VideoTouShe = ref
    }

    render() {
        const { videoList, } = this.props.Video
        const { selectedVideo, inputValue, list_total, list_current, list_defaultPageSize, showloading } = this.state
        return (
            <div className={style.videoInfo}>
                <div className={style.tabs}>
                    <div onClick={() => { this.changeTab('video') }} className={[style.item, this.state.tabName === 'video' ? style.active : ''].join(' ')}>视频摄像头</div>
                    <div onClick={() => { this.changeTab('uav') }} className={[style.item, this.state.tabName === 'uav' ? style.active : ''].join(' ')}>无人机</div>
                </div>
                <div className={style.videoList}>
                    <div className={style.surround}>
                        <div className={style.videoSearch}>
                            {/* <input placeholder="搜索……" className={style.inputSearch}></input> */}
                            {/* <Input className={style.inputSearch} placeholder="搜索……" value={inputValue} onChange={this.onInputChange} /> */}
                            <Input className={style.inputSearch} placeholder="搜索……" value={inputValue}  onFocus={this.onInputFocus} onChange={this.onInputChange} onBlur={this.onInputBlur}/>
                            <div className={style.iconBox} onClick={this.listSearch}>
                                <Icon type="search" />
                            </div>
                        </div>
                    </div>
                    {
                        showloading && 
                        <div className={style.loading}>
                            <Spin />
                        </div>
                    }
                    { !showloading && (
                        <>
                            <div style={{ display: this.state.tabName === 'video' ? 'block' : 'none' }}>
                                <div className={style.listData}>
                                    {
                                        videoList.map((item, index) => {
                                            return (
                                                <div className={style.listItem} key={index}>
                                                    <div>{index}</div>
                                                    <div className={style.nameText}>{item.name}</div>
                                                    <div>{item.dataCatalogName}</div>
                                                    <div className={style.switch} onClick={() => this.clickVideo(item, index)}>
                                                        <img src={(item.show) ? require('@/assets/images/video/switch_on.png') : require('@/assets/images/video/switch_off.png')} alt="" />
                                                    </div>
                                                </div>
                                            )
                                        })
                                    }
                                </div>
                                <div className={style.page}>
                                    <Pagination total={list_total} size="small" showLessItems={true} defaultPageSize={list_defaultPageSize} current={list_current} onChange={this.listChange} />
                                </div>
                            </div>
                            <div style={{ display: this.state.tabName === 'uav' ? 'block' : 'none' }}>
                                <div className={style.listData}>
                                    {
                                        videoList.map((item, index) => {
                                            return (
                                                <div className={style.listItem} key={index}>
                                                    <div>{index}</div>
                                                    <div className={style.nameText}>{item.name}</div>
                                                    <div>{item.dataCatalogName}</div>
                                                    <div className={style.switch} onClick={() => this.clickVideo(item, index)}>
                                                        <img src={(item.show) ? require('@/assets/images/video/switch_on.png') : require('@/assets/images/video/switch_off.png')} alt="" />
                                                    </div>
                                                </div>
                                            )
                                        })
                                    }
                                </div>
                                <div className={style.page}>
                                    <Pagination total={list_total} size="small" showLessItems={true} defaultPageSize={list_defaultPageSize} current={list_current} onChange={this.listChange} />
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {selectedVideo && (
                    <div className={style.videoContentWrap} style={{ display: this.state.showVideoInfo ? 'block' : 'none' }}>
                        <div className={style.titleInfo}>
                            <div className={style.titleLeft}>
                                <div className={style.title}>
                                    <div className={style.text}>摄像头</div>
                                    <div className={style.status}>(正常)</div>
                                </div>
                                <div className={style.date}>数据更新时间：{selectedVideo.updateTime}</div>
                            </div>
                            <div className={style.rightInfo} onClick={this.putVideoTou}><Icon type='swap' style={{ color: '#8EE0F8', marginRight: '4px' }} />切换投影模式</div>
                            <div onClick={this.closeVideo}><Icon type='close' style={{ cursor: 'pointer' }} /></div>
                        </div>
                        <div className={style.dataInfo}>
                            <dl className={style.item}>
                                <dt>{selectedVideo.px}E</dt>
                                <dd>经度</dd>
                            </dl>
                            <dl className={style.item}>
                                <dt>{selectedVideo.py}N</dt>
                                <dd>纬度</dd>
                            </dl>
                            <dl className={style.item}>
                                <dt>{selectedVideo.pz}m</dt>
                                <dd>海拔高度</dd>
                            </dl>
                            <dl className={style.item}>
                                <dt>32.5°</dt>
                                <dd>旋转角</dd>
                            </dl>
                            <dl className={style.item}>
                                <dt>32.5°</dt>
                                <dd>俯视角</dd>
                            </dl>
                        </div>
                        <video className={style.video} controls autoPlay id='myVideo'></video>
                    </div>
                )}
                <VideoTouShe selectedArr={this.state.video_toushe_arr} onRef = { this.onRef} />
                {/* {
                    this.state.video_toushe ===true ? (
                        
                    ):""
                } */}
            </div>
        )
    }
}

export default VideoInfo