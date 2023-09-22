/* global Cesium */
/* global viewer */
/* global mars3d */
import React, { Component } from 'react';
import { Modal, Button, Input } from 'antd';
import styles from './style.less';
import { PUBLIC_PATH } from '@/utils/config'
import { connect, connectAdvanced } from 'dva';

@connect((Map,RightFloatMenu) => ({
  Map,RightFloatMenu
}))
class PerBookmark extends Component {

  componentDidMount() {
    let $this= this;
    viewer.mars.keyboardRoam.unbind();
    this.closeORstartkey(true)
    mars3d.widget.activate({
      uri:PUBLIC_PATH+"widgets/addmarker/widget.js",
      success:function(thisWidget){
          var mark = setInterval(endmarker,500);
          function endmarker(){
            if(!thisWidget.startaddmarker){
              clearInterval(mark)
              
              viewer.mars.keyboardRoam.bind();
              $this.closeORstartkey(false)
              var s = PUBLIC_PATH+"widgets/addmarker/widget.js"
              mars3d.widget.disable(s);
              $this.props.dispatch({
                type: 'Map/setToolsActiveKey',
                payload: ""
              })
              $this.props.dispatch({
                type:'RightFloatMenu/toggleMenu',
                payload:''
              })
            }
          }
      }
    });
    
  }
  componentWillUnmount(){
    var s = PUBLIC_PATH+"widgets/addmarker/widget.js"
    mars3d.widget.disable(s);
  }
  //关闭或开启层级变速键盘漫游
  closeORstartkey=(isHomekeystop)=>{
    //控制键盘漫游是否开启
    this.props.dispatch({
      type:'RightFloatMenu/setisHomekeystop',
      payload:isHomekeystop
    })
  }

  state = {
    visible: false,
    spaceMarkList:[],
    markName:''
  };

  inputMarkName=(e)=>{
    this.setState({
      markName:e.target.value
    })
  }
  showModal = () => {
    this.setState({
      visible: true,
    });
  };

  handleOk = e => {
    // console.log(e);

    viewer.render()
    let image = viewer.scene.canvas.toDataURL("image/png");

    this.state.spaceMarkList.push({
      name:this.state.markName,
      data:mars3d.point.getCameraView(viewer, true),
      image:image
    })
    this.setState({
      visible: false,
    });
  };

  handleCancel = e => {
    // console.log(e);
    this.setState({
      visible: false,
    });
  };
  onChange = (value, type) => {
    // console.log(value, type);
    this.stage.uniforms[type] = value;
  };
  goto=(data)=>{
    // console.log(data);
    viewer.mars.centerAt(data, { isWgs84: true });
  }

  formatDate=(time)=>{
    var date = new Date(time);

    var year = date.getFullYear(),
      month = date.getMonth() + 1,//月份是从0开始的
      day = date.getDate(),
      hour = date.getHours(),
      min = date.getMinutes(),
      sec = date.getSeconds();
    var newTime = year + '-' +
      month + '-' +
      day + ' ' +
      hour + ':' +
      min + ':' +
      sec;
    return newTime;
  }

  render() {
    return (
      <>
        {/*<Modal*/}
        {/*  title="添加视角书签"*/}
        {/*  visible={this.state.visible}*/}
        {/*  onOk={this.handleOk}*/}
        {/*  okText={"保存"}*/}
        {/*  cancelText={"取消"}*/}
        {/*  onCancel={this.handleCancel}*/}
        {/*>*/}
        {/*  <p>视角书签名称</p>*/}
        {/*  <Input placeholder="请输入"  defaultValue={this.state.markName} onChange={this.inputMarkName.bind(this)}/>*/}
        {/*</Modal>*/}
        {/*<div className={styles.box}>*/}
        {/*  <div className={styles.father}>*/}
        {/*    <div className={styles.item} onClick={this.showModal}>*/}
        {/*      <span className="iconfont  icon_add"></span>*/}
        {/*    </div>*/}
        {/*    {this.state.spaceMarkList.map((item,index)=>{*/}
        {/*      return <div key={index} className={styles.item} onClick={this.goto.bind(this,item.data)}>*/}
        {/*        <img src={item.image} alt=""/>*/}
        {/*        <div className={styles.mask} >*/}
        {/*          <p>{item.name}</p>*/}
        {/*          <h4>2020/05/06 12:12</h4>*/}
        {/*          <div>*/}
        {/*            <a className={"iconfont icon_edit"}></a>*/}
        {/*            <a className={"iconfont icon_delete"}></a>*/}
        {/*          </div>*/}
        {/*        </div>*/}
        {/*      </div>*/}
        {/*    })}*/}
        {/*  </div>*/}

        {/*  <div className={styles.leftBtn}><span className="iconfont icon_arrow_down"></span></div>*/}
        {/*  <div className={styles.rightBtn}><span className="iconfont icon_arrow_down"></span></div>*/}

        {/*</div>*/}
      </>
    );
  }
}

export default PerBookmark;
