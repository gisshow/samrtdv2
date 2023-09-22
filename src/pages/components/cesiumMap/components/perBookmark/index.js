/* global Cesium */
/* global viewer */
/* global mars3d */
import React, { Component } from 'react';
import { Modal, Icon, Input, Popconfirm, message, Tooltip } from 'antd';
import styles from './style.less';
import { request } from '@/utils/request';
import { connect } from 'dva';
import BorderPoint from '../../../border-point'
@connect(({RightFloatMenu }) => ({
  RightFloatMenu
}))
class SpaceMark extends Component {

  state = {
    visible: false,
    spaceMarkList:[],
    markName:'',
    viewType:'big',
    index:0,
    activeId:''
  };
  componentDidMount() {
    // var s = {uri:"widgets/bookmark/widget.js"}
    // mars3d.widget.activate(s);
    this.getList();
    this.con = React.createRef();
  }

  componentWillUnmount(){
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

  getList=async ()=>{
    let data =await request("/vb/perspective/list");
    if(!data)return;
    this.setState({
      spaceMarkList:data.data
    })
  }

  inputMarkName=(e)=>{
    this.setState({
      markName:e.target.value
    })
  }
  showModal = () => {
    //关闭键盘事件
    this.doKeyEvent(false)
    this.setState({
      visible: true,
    });
  };

  handleOk = async  e => {
    viewer.render()
    let image = viewer.scene.canvas.toDataURL("image/jpeg",0.075);
    

    let data = await request("/vb/perspective",{
      method:"POST",
      data:{
        name:this.state.markName,
        info:mars3d.point.getCameraView(viewer, true),
        image:image
      }
    })
    if(data.success && data.data){
      this.state.spaceMarkList.push({
        id:data.data,
        name:this.state.markName,
        info:mars3d.point.getCameraView(viewer, true),
        image:image
      })
      this.setState({
        ...this.state,
        markName:''
      })
    }
    // console.log("push",data)
    this.setState({
      visible: false,
    });
  };

  handleCancel = e => {
    //打开键盘事件
    this.doKeyEvent(true)
    // console.log(e);
    this.setState({
      visible: false,
    });
  };

  confirmDel =async (id) =>{
    let data = await request(`/vb/perspective/${id}`,{
      method:"DELETE",
    })
    if(data.success){
      message.success("删除成功");
      this.getList();
    }
    
  }
  onChange = (value, type) => {
    // console.log(value, type);
    this.stage.uniforms[type] = value;
  };
  goto=(item)=>{
    const data = item.info
    this.setState({
      ...this.state,
      activeId:item.id
    })
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

  scrollLeft=()=>{
    this.con.current.scrollLeft -= 150;
  }

  scrollRight=()=>{
    this.con.current.scrollLeft += 150;
  }
  changeSize = size=>{
    this.setState({
      ...this.state,
      viewType:size
    })
  }
  closeWidget=()=>{
    this.props.dispatch({
      type:'RightFloatMenu/toggleMenu',
      payload:'isBookMarkActive'
    })
    
    this.props.dispatch({
      type: 'Map/setToolsActiveKey',
      payload: ""
    })
  }
  changeIndex = type=>{
    switch (type) {
      case 'plus':
        if (this.state.index<this.state.spaceMarkList.length-1) {
          let index = this.state.index+1
          this.setState({
            ...this.state,
            index:index
          })
          if (this.state.spaceMarkList.length>0) {
              // this.goto(this.state.spaceMarkList[index].info)
            }
        }
        break;
      case 'minus':
          if (this.state.index>0) {
            let index = this.state.index-1
            this.setState({
              ...this.state,
              index:index
            })
            if (this.state.spaceMarkList.length>0) {
              // this.goto(this.state.spaceMarkList[index].info)
            }
          }
          break;
      default:
        break;
    }
  }
  render() {
    return (
      <>
        <Modal
          title="添加视角书签"
          visible={this.state.visible}
          onOk={this.handleOk}
          okText={"保存"}
          cancelText={"取消"}
          onCancel={this.handleCancel}
        >
          <p>视角书签名称</p>
          <Input placeholder="请输入"  defaultValue={this.state.markName} onChange={this.inputMarkName.bind(this)}/>
        </Modal>
        <div className={styles.smallBox} style={{display:this.state.viewType==='big'?'none':'grid'}}>
          <div className={styles.sTitle}>视角书签</div>
          <div className={styles.ctl+" "+styles.arrow} onClick={()=>{this.changeIndex('minus')}}>
            <Icon type="left" className={styles.arrowIcon} />
          </div>
          <div className={styles.arrow} onClick={()=>{
            if (this.state.spaceMarkList.length>0) {
              this.goto(this.state.spaceMarkList[this.state.index])
            }
          }}>
            {this.state.spaceMarkList.length===0?'暂无数据':this.state.spaceMarkList[this.state.index].name}
          </div>
          <div className={styles.ctl+" "+styles.arrow} onClick={()=>{this.changeIndex('plus')}}>
            <Icon type="right" className={styles.arrowIcon} />
          </div>
          <Tooltip title="最大化">
            <div className={styles.ctl} onClick={()=>{this.changeSize('big')}}>
              <div className={styles.iconWrap}>
                <Icon type="border"/>
              </div>
            </div>
          </Tooltip>
          <Tooltip title="关闭" onClick={this.closeWidget}>
            <div className={styles.ctl}>
              <div className={styles.iconWrap}>
              <Icon type="close"/>
              </div>
            </div>
          </Tooltip>
          <BorderPoint />
        </div>
        <div className={styles.box} style={{display:this.state.viewType==='big'?'block':'none'}}>
          <BorderPoint />
          <div className={styles.boxTitle}>
            <div className={styles.titleText}>
              视角书签
            </div>
            <div className={styles.titleControl} onClick={()=>{this.changeSize('small')}}>
              <Tooltip title="最小化">
                <div className={styles.iconWrap}>
                  <Icon type="line"/>
                </div>
              </Tooltip>
              <Tooltip title="关闭" onClick={this.closeWidget}>
                <div className={styles.iconWrap}>
                  <Icon type="close"/>
                </div>
              </Tooltip>
            </div>
          </div>
          <div className={styles.boxContent}>
            <div className={styles.leftBtn} onClick={this.scrollLeft}>
              <Icon type="left" className={styles.arrowIcon} />
            </div>
            <div ref={this.con} className={styles.con}>
            <div className={styles.father} style={{width:(this.state.spaceMarkList.length+2)*160+"px"}}>
              <div className={styles.item} onClick={this.showModal}>
                <Icon type="plus" className={styles.addIcon} />
                <span className={styles.addText}>新增场景</span>
              </div>
              {this.state.spaceMarkList.map((item,index)=>{
                return <div key={index} className={styles.item} onClick={this.goto.bind(this,item)}>
                  <img src={item.image} alt=""/>
                  <div className={this.state.activeId===item.id?styles.border:''}></div>
                  <div className={styles.mask} >
                    <p className={styles.name} >{item.name}</p>
                    <div  className={styles.bottomBtn}>
                      <div style={{display:'flex'}}>
                        <div  className={styles.btnItem} style={{marginRight:'4px'}}>
                          <span  className={`iconfont icon_focus ${styles.btnIcon}`}></span>
                        </div>
                        
                      </div>
                      <Popconfirm
                        title="删除此视角吗?"
                        onConfirm={this.confirmDel.bind(this,item.id)}
                        placement="top"
                        okText="是"
                        cancelText="否"
                      >
                        <div  className={styles.btnItem}>
                        <span  className={`iconfont icon_delete ${styles.btnIcon}`}></span>
                      </div>
                      </Popconfirm>
                    </div>
                  </div>
                </div>
              })}
              </div>
            </div>
            <div className={styles.rightBtn} onClick={this.scrollRight}>
              <Icon type="right" className={styles.arrowIcon} />
            </div>
          </div>

        </div>
      </>
    );
  }
}

export default SpaceMark;
