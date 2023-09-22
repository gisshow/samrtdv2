/* global Cesium */
/* global viewer */
/* global mars */
/* global $ */
/* global mars3d */
/* turf */
/* Hls */
import React, { Component } from 'react'
import style from './index.less'
import { Slider, Button, InputNumber, Table, Switch, Radio, Checkbox, Row, Col, Tree, Icon, Image, Pagination, Tooltip } from 'antd'
import { connect, connectAdvanced } from 'dva';
import { PUBLIC_PATH } from '@/utils/config'
import { request } from '@/utils/request';
import Sider from 'antd/lib/layout/Sider';
import Item from 'antd/lib/list/Item';
import BorderPoint from '@/pages/components/border-point'
import CheckboxGroup from 'antd/lib/checkbox/Group';
import { GeologyListConfig, PipeLineConfig } from '@/pages/components/leftSider/config';
const Ajax = require('axios');

let videoConfig;

@connect(({ Map, RightFloatMenu, Video }) => ({
    Map, RightFloatMenu, Video
}))

class VideoTouShe extends Component {
    constructor(props) {
        super(props);
        this.state = {
            //传过来的值
            selectedArr:props.selectedArr,
            // 存放3D视频的数组
            arrViewField: [],
            // 视频渲染数组
            arrViewFieldVideo: [],
        }

    }

    async componentWillMount() {
        let config = await Ajax.get(`${PUBLIC_PATH}config/video.json`);
        videoConfig = config.data
    }

    componentWillReceiveProps(nextProps) {
        // console.log(`wowowowowowowowowowo`)
        // console.log(nextProps.selectedArr)
        const {selectedArr} = this.state
        
        //比较不同，判断是新增还是删除
        if(nextProps.selectedArr.length > selectedArr.length){
            // console.log('新增')
        }else if(nextProps.selectedArr.length < selectedArr.length){
            // console.log('移除')
        }else{
            // console.log('不变')
        }

        this.setState({
            selectedArr: nextProps.selectedArr
        })
    }

    componentDidMount() {
        // console.log('视频投射')
        this.props.onRef(this)
    }

    // 添加摄像头
    addViewField = (item) => {
        let _this = this;
        let itemObj = {
            myId: item.vid
        }
        // 先创建DOM在添加投射体
        this.setState({
            arrViewFieldVideo: [...this.state.arrViewFieldVideo, itemObj]
        }, () => {

            // 赋值视点
            var cartesian = Cesium.Cartesian3.fromDegrees(item.pxP, item.pyP, item.pzP);
            // 赋值相机
            var cameraPosition = Cesium.Cartesian3.fromDegrees(item.px, item.py, item.pz);
            //构造投射体
            let selectedView = new mars3d.video.Video3D(window.viewer, {
                type: mars3d.video.Video3D.Type.Video,
                dom: document.getElementById(`myVideo${item.vid}`),
                // url: this.videoList[item.ip],
                cameraPosition: cameraPosition,
                position: cartesian,
                alpha: item.alpha,
                fov: item.fov,
                aspectRatio: item.aspectRatio,
                debugFrustum: true,
            });
            selectedView.myId = item.vid;
            selectedView && this.setState({
                arrViewField: [...this.state.arrViewField, selectedView]
            }, () => {
                this.rtspStart(item);
            });
        })
    }

    rtspStart = (item) => {
        // console.log(item)
        let _this = this;
        this.setState({
            ws: new WebSocket( videoConfig.rstp + item.id)
        }, () => {
            // 连接成功后播放视频
            this.state.ws.onopen = function (message) {
                _this.playVideo(item);
            }
            this.state.ws.onmessage = function (message) {
                var parsedMessage = JSON.parse(message.data);

                if (parsedMessage.id == "startResponse") {
                    _this.state.webRtcPeer.processAnswer(parsedMessage.sdpAnswer, function (error) {
                        if (error)
                            return console.error(error);
                        // console.log("开始播放")
                        // console.log(parsedMessage.sdpAnswer)
                    });
                } else if (parsedMessage.id == "iceCandidate") {
                    _this.state.webRtcPeer.addIceCandidate(parsedMessage.candidate, function (error) {
                        if (error)
                            return console.error('Error adding candidate: ' + error);
                        // console.log("冰侯事件");
                    });
                } else if (parsedMessage.id == "error") {
                    // console.log("有问题");
                    // console.log(parsedMessage.message);
                } else if (parsedMessage.id == "videoInfo") {
                    // console.log("视频信息");
                    // console.log(parsedMessage.message);
                } else if (parsedMessage.id == "playEnd") {
                    // console.log("播完了");
                    // console.log(parsedMessage.message);
                } else if (parsedMessage.id == "seek") {
                    // console.log("我是seek");
                    // console.log(parsedMessage.message);
                } else {
                    // console.log("有其他事")
                }
            }
        })
    }
    playVideo = (item) => {
        // console.log("****************************")
        // console.log(item.vid)
        // console.log(document.getElementById(`myVideo${item.vid}`))
        // console.log("****************************")
        var options = {
            remoteVideo: document.getElementById(`myVideo${item.vid}`),
            mediaConstraints: {
                audio: true,
                video: true
            },
            onicecandidate: onIceCandidate
        }
        // console.log(window.kurentoUtils)
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
            // console.log("---------------------------------")
            var message = {
                id: 'onIceCandidate',
                candidate: candidate
            }
            _this.sendMessage(message);
        }
        let _this = this;
        // 回调参数
        function onOffer(error, offerSdp) {
            var message = {
                id: 'start',
                sdpOffer: offerSdp,
                videourl: item.ip
                // videourl : "rtsp://0.0.0.0:8554/live.sdp"
            }
            _this.sendMessage(message);
        }
    }
    // 发送信息
    sendMessage = (message) => {
        // console.log(666666)
        var jsonMessage = JSON.stringify(message);
        // console.log(jsonMessage)
        // console.log(_this.state.ws)
        this.state.ws.send(jsonMessage);
    }

    destoryViewField = (item) => {
        let selectedView = this.state.arrViewField.filter(v => v.myId === item.vid)
        selectedView[0] && selectedView[0].destroy()
        let noselectedView = this.state.arrViewField.filter(v => v.myId !== item.vid)
        // let arrViewFieldVideo = this.state.arrViewFieldVideo.filter(v => v.myId !== item.vid)
        this.setState({
            arrViewField:noselectedView,
            // arrViewFieldVideo,
        })

    }
    
    destroyAll = () =>{
        const { arrViewField,arrViewFieldVideo } = this.state
        arrViewField.forEach((item)=>{
            item.destroy()
        })

        this.setState({
            arrViewField:[],
            // arrViewFieldVideo:[],
        })
    }

    videoListDom = () => {
        return (
            <div>
                {
                    this.state.arrViewFieldVideo.map(item => {
                        return (
                            <video key={item.myId} id={`myVideo${item.myId}`} autoPlay style={{ position: "absolute" }}></video>
                        )
                    })
                }
            </div>
        )
    }

    render() {
        return (
            <>
                {this.videoListDom()}
            </>
        )
    }

}


export default VideoTouShe