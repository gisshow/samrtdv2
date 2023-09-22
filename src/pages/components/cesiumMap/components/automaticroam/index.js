/* global Cesium */
/* global viewer */
/* global mars3d */
/* global haoutil */
import React, { Component } from 'react';
import { Tooltip, Icon, Popconfirm, message } from 'antd';
import BorderPoint from '../../../border-point';
import styles from './style.less';
import { request } from '@/utils/request';
import { connect } from 'dva';
import { PUBLIC_PATH } from '@/utils/config';
const Ajax = require('axios');

let speedmul = 1,
  motherBoard;

@connect(({ RightFloatMenu }) => ({
  RightFloatMenu,
}))
class Automaticroam extends Component {
  state = {
    visible: false,
    FlyrouteList: [],
    markName: '',
    height: 50,
    flyspeed: 200,
    EntityList: [],
    viewType: 'big',
    index: 0,
    selectedindex: -1,
    selectedid: 25,
  };

  async componentDidMount() {
    //this.getList();
    this.con = React.createRef();
    let data1 = await Ajax.get(`${PUBLIC_PATH}config/motherBoard.json`);
    motherBoard = data1.data;
    this.fly = true;
    this.getList();
  }
  componentWillUnmount() {
    clearInterval(this.INnewList);
    clearInterval(this.newdraw);
    mars3d.widget.disable(PUBLIC_PATH + 'widgets/lineroam/widget.js');
    this.data = [];
    viewer.scene.preRender.removeEventListener(this.Listener);
  }
  //路线
  getList = async () => {
    var that = this;
    mars3d.widget.activate({
      uri: PUBLIC_PATH + 'widgets/lineroam/widget.js',
      success: function(thisWidget) {
        that.FlythisWidget = thisWidget;
        document.getElementsByClassName('layui-layer-title')[0].innerHTML = '自动漫游编辑';

        // 清空其他项目的飞行路线
        console.log('that.state.FlyrouteList', that.state.FlyrouteList, thisWidget);
        thisWidget.arrFlyTable.length = 0;
        // 根据项目id获取飞行路线
        thisWidget.getList();

        var inter = setInterval(getdatalist, 500);
        function getdatalist() {
          if (!thisWidget.startlineraom) {
            clearInterval(inter);
            return;
          }
          if (thisWidget.viewWindow) {
            var newdata = null;
            var olddata = that.data;
            if (that.data == undefined) {
              that.data = thisWidget.viewWindow.plotEdit.linedataList(); //获取路线数据
              newdata = that.data;
            } else {
              that.data = thisWidget.viewWindow.plotEdit.linedataList(); //获取路线数据
              if (olddata.length != that.data.length) {
                newdata = that.data;
              } else if (olddata.length == 0) {
                newdata = [];
              }
            }
            if (newdata != null) {
              that.setState({
                FlyrouteList: newdata,
              });
            }
          }
        }
      },
    });
    this.INnewList = setInterval(function() {
      that.getnewList();
    }, 1000);
  };
  getnewList = async () => {
    const { selectedid, FlyrouteList } = this.state;
    var flag = window.localStorage.getItem('marsgis_roam_flag');
    if (flag && flag !== 'false') {
      var roamdata = window.localStorage.getItem('marsgis_roam');
      var geojson = JSON.parse(roamdata);
      var newFlyrouteList = FlyrouteList;
      if (geojson != null) {
        for (var i = 0; i < geojson.length; i++) {
          var id = geojson[i].id;
          if (selectedid == id) {
            var newname = geojson[i].name;
            for (var j = 0; j < newFlyrouteList.length; j++) {
              var oldid = newFlyrouteList[j].id;
              var oldname = newFlyrouteList[j].name;
              if (oldid == id && newname != oldname) {
                newFlyrouteList = geojson;
                window.localStorage.setItem('marsgis_roam', '');
              }
            }
          }
        }
        this.setState({
          FlyrouteList: newFlyrouteList,
        });
        window.localStorage.setItem('marsgis_roam_flag', false);
      }
    }
  };

  //数组转字符 坐标处理
  arrayTostr = array => {
    var lonlatpositions = mars3d.pointconvert.cartesians2lonlats(array); //路线坐标 数组 经纬度坐标组
    let strpositions = lonlatpositions.join('|');
    return strpositions;
  };
  //字符转数组 坐标处理
  strToarray = str => {
    let lonlatList = [];
    if (str != undefined) {
      var array = str.split('|');
      array.forEach(data => {
        let nArray = data.split(',');
        let newArray = nArray.map(Number); //整形
        lonlatList = lonlatList.concat(newArray);
      });
    }
    return lonlatList;
  };
  //添加entity 线
  addentityLine = (position, id) => {
    viewer.entities.add({
      id: id,
      polyline: {
        positions: mars3d.pointconvert.lonlats2cartesians(position),
        width: 5,
        material: new Cesium.PolylineOutlineMaterialProperty({
          color: Cesium.Color.ORANGE,
          outlineWidth: 3,
        }),
        clampToGround: true,
      },
    });
  };

  //描绘路线
  depictroute = () => {
    var that = this;
    if (!this.FlythisWidget.viewWindow) {
      mars3d.widget.activate({
        uri: PUBLIC_PATH + 'widgets/lineroam/widget.js',
        success: function(thisWidget) {
          //激活后回调方法\
          that.FlythisWidget = thisWidget;
          setTimeout(function() {
            thisWidget.viewWindow.tableWork.startdarwline();
          }, 200);
          if (this.newdraw) {
            clearInterval(this.newdraw);
          }
          this.newdraw = setInterval(function() {
            if (that.FlythisWidget.viewWindow) {
              that.data = that.FlythisWidget.viewWindow.plotEdit.linedataList(); //获取路线数据
              that.setState({
                FlyrouteList: that.data,
              });
            }
            //console.log(that.data);
          }, 2000);
        },
      });
    } else {
      this.FlythisWidget.viewWindow.tableWork.startdarwline();
      if (this.newdraw) {
        clearInterval(this.newdraw);
      }
      this.newdraw = setInterval(function() {
        if (that.FlythisWidget.viewWindow) {
          that.data = that.FlythisWidget.viewWindow.plotEdit.linedataList(); //获取路线数据
          that.setState({
            FlyrouteList: that.data,
          });
        }
      }, 1000);
    }
  };

  //删除 路线
  confirmDel = async id => {
    var that = this;
    //
    if (!this.FlythisWidget.viewWindow) {
      mars3d.widget.activate({
        uri: PUBLIC_PATH + 'widgets/lineroam/widget.js',
        success: function(thisWidget) {
          //激活后回调方法\
          setTimeout(function() {
            var data = thisWidget.viewWindow.tableWork.removeflyline(id);
            that.setState({
              FlyrouteList: that.data,
            });
          }, 200);
        },
      });
    } else {
      var data = this.FlythisWidget.viewWindow.tableWork.removeflyline(id);
      that.setState({
        FlyrouteList: that.data,
      });
    }

    // let {FlyrouteList,flyLine,drawControl} =this.state;
    // if(flyLine!=undefined){
    //   viewer.scene.preRender.removeEventListener(this.Listener);
    //   flyLine.stop();
    //   flyLine.destroy();
    // }

    // FlyrouteList.forEach((data,i) => {
    //   if(data.id==id){
    //     FlyrouteList.splice(i,1);
    //      //根据id 删除指定的绘制路线
    //     var delentity =viewer.entities.getById("R"+id);
    //     viewer.entities.remove(delentity);
    //   }
    // });
    // this.setState({
    //   FlyrouteList:FlyrouteList
    // });
    // let data = await request(`/vb/roam/${id}`,{
    //   method:"DELETE",
    // })
    // if(data.code==200){
    //   message.success("删除成功");
    //   this.deleteline();
    //   this.getList();
    // }else{
    //   message.error("删除失败");
    // }
  };
  onChange = (value, type) => {
    // console.log(value, type);
    this.stage.uniforms[type] = value;
  };
  //启动 飞行路线
  flyto = (flyobject, index) => {
    // console.log(this.FlythisWidget);
    // console.log(flyobject);
    this.FlythisWidget.toRoamFly(flyobject);
    this.keyboardupordown();

    this.setState({
      index: index,
      selectedindex: index,
    });
  };
  //监听
  minitorListener = () => {
    viewer.scene.preRender.removeEventListener(this.Listener);
    viewer.scene.preRender.addEventListener(this.Listener);
  };
  Listener = () => {
    var $that = this;
    const {
      reality: { sz_osgb },
    } = motherBoard;
    if (!this.isshowqingxie()) {
      //viewer.scene.preRender.removeEventListener(fn);
      var List = [
        'dapeng',
        'baoan',
        'futian',
        'guangming',
        'lingdingdao',
        'longgang',
        'longhua',
        'luohu',
        'nanshan',
        'pingshan',
        'yantian',
      ];
      List.forEach(element => {
        let url = sz_osgb.children[element];
        let primitives = $that.getModelbyurl(url);
        if (!primitives.show) {
          primitives.show = true;
        }
      });
    }
  };

  //判断倾斜摄影是否显示
  isshowqingxie = () => {
    var hidenum = 0,
      shownum = 0;
    const {
      reality: { sz_osgb },
    } = motherBoard;
    var List = [
      'dapeng',
      'baoan',
      'futian',
      'guangming',
      'lingdingdao',
      'longgang',
      'longhua',
      'luohu',
      'nanshan',
      'pingshan',
      'yantian',
    ];
    List.forEach(element => {
      let url = sz_osgb.children[element];
      let primitives = this.getModelbyurl(url);
      if (primitives) {
        if (!primitives.show) {
          hidenum++;
        } else {
          shownum++;
        }
      }
    });
    if (hidenum > 0) {
      return false;
    }
    if (shownum == List.length) {
      return true;
    } else {
      return false;
    }
  };
  //根据路径 获取模型
  getModelbyurl = url => {
    let primitives = viewer.scene.primitives._primitives;
    let Ftileset = undefined;
    primitives.forEach(data => {
      let newurl = data.url;
      if (newurl === url) {
        Ftileset = data;
        return;
      }
    });
    return Ftileset;
  };

  //键盘按钮Q和E 视角上升和下降 监听事件
  keyboardupordown = () => {
    const { flyLine, flyspeed } = this.state;
    let $this = this;
    var unitkey = [];
    //键盘监听

    document.addEventListener('keydown', function(e) {
      switch (e.keyCode) {
        case 18:
          var num = unitkey.indexOf(e.keyCode);
          if (num > -1) {
            unitkey.splice(num, 1);
          }
          unitkey.push(e.keyCode);
          break;
        case 187:
          //移除数组中多余的"+"加号键的标识
          var num = unitkey.indexOf(e.keyCode);
          if (num > -1) {
            unitkey.splice(num, 1);
          }
          //移除数组中已存在的"-"减号键的标识
          var numt = unitkey.indexOf(189);
          if (numt > -1) {
            unitkey.splice(numt, 1);
          }
          unitkey.push(e.keyCode);
          $this.quickenORslow(unitkey);
          break;
        case 189:
          //移除数组中多余的"-"减号键的标识
          var num = unitkey.indexOf(e.keyCode);
          if (num > -1) {
            unitkey.splice(num, 1);
          }
          //移除数组中已存在的"+"加号键的标识
          var numt = unitkey.indexOf(187);
          if (numt > -1) {
            unitkey.splice(numt, 1);
          }
          unitkey.push(e.keyCode);
          $this.quickenORslow(unitkey);
          break;
      }
    });
    document.addEventListener('keyup', function(e) {
      switch (e.keyCode) {
        case 18:
          var num = unitkey.indexOf(e.keyCode);
          unitkey.splice(num, 1);
          break;
        case 187:
          var num = unitkey.indexOf(e.keyCode);
          unitkey.splice(num, 1);
          break;
        case 189:
          var num = unitkey.indexOf(e.keyCode);
          unitkey.splice(num, 1);
          break;
      }
    });
  };
  //执行加速和减速
  quickenORslow = unitkey => {
    var onekey = unitkey.indexOf(18);
    var twokey = unitkey.indexOf(187);
    var threekey = unitkey.indexOf(189);
    if (onekey > -1 && twokey > -1) {
      //加速
      //  console.log("加速")
      speedmul++;
    }
    if (onekey > -1 && threekey > -1) {
      //减速
      // console.log("减速")
      speedmul--;
      if (speedmul <= 0) {
        //设置speedmul不能等于0
        speedmul = 1;
      }
    }
    viewer.clock.multiplier = speedmul; //倍数添加
  };

  //时间获取
  formatDate = time => {
    var date = undefined;
    if (time == undefined) {
      date = new Date();
    } else {
      date = new Date(time);
    }

    var year = date.getFullYear(),
      month = date.getMonth() + 1, //月份是从0开始的
      day = date.getDate(),
      hour = date.getHours(),
      min = date.getMinutes(),
      sec = date.getSeconds();
    var newTime = year + '-' + month + '-' + day + ' ' + hour + ':' + min + ':' + sec;
    return newTime;
  };

  scrollLeft = () => {
    this.con.current.scrollLeft -= 150;
  };

  scrollRight = () => {
    this.con.current.scrollLeft += 150;
  };
  //关闭
  close = () => {
    // console.log(334);

    //let {flyLine} =this.state;
    viewer.scene.preRender.removeEventListener(this.Listener);
    //flyLine.stop();
    // flyLine.destroy();

    // this.props.dispatch({
    //   type: 'RightFloatMenu/toggleMenu',
    //   payload: 'isFlyActive',
    // });
    this.componentWillUnmount();
    if (window.BIMProject) {
      if (window.BIMProject.rootThis) {
        window.BIMProject.rootThis.setState({
          project_map_fly_visible: false,
        });
      }
    }
  };
  //最小或最大
  changeSize = size => {
    this.setState({
      ...this.state,
      viewType: size,
    });
    // if (size==='small') {
    //   if (this.state.spaceMarkList.length>0) {
    //     this.goto(this.state.spaceMarkList[this.state.index].info)
    //   }
    // }
  };
  changeIndex(type) {
    let index = this.state.index;
    switch (type) {
      case 'plus':
        if (index < this.state.FlyrouteList.length - 1) {
          index++;
          this.setState({
            ...this.state,
            index: index,
          });
        }
        break;
      case 'minus':
        if (index > 0) {
          index--;
          this.setState({
            ...this.state,
            index: index,
          });
        }
        break;
      default:
        break;
    }
  }
  editFlyline = (item, index) => {
    var that = this;
    //
    if (!this.FlythisWidget.viewWindow) {
      mars3d.widget.activate({
        uri: PUBLIC_PATH + 'widgets/lineroam/widget.js',
        success: function(thisWidget) {
          //激活后回调方法\
          setTimeout(function() {
            thisWidget.viewWindow.tableWork.startedit(item.id);
          }, 200);
        },
      });
    } else {
      this.FlythisWidget.viewWindow.tableWork.startedit(item.id);
    }
    this.setState({
      selectedindex: index,
      selectedid: item.id,
    });
  };

  render() {
    const { selectedindex } = this.state;
    return (
      <>
        {
          <div
            className={styles.smallBox}
            style={{ display: this.state.viewType === 'big' ? 'none' : 'grid' }}
          >
            <div className={styles.sTitle}>飞行漫游</div>
            {/* <div className={styles.ctl+" "+styles.arrow} onClick={()=>{this.changeIndex('minus')}}> */}
            <div
              className={styles.ctl + ' ' + styles.arrow}
              onClick={() => {
                this.changeIndex('minus');
              }}
            >
              <Icon type="left" className={styles.arrowIcon} />
            </div>
            <div
              className={styles.arrow}
              onClick={() => {
                this.flyto(this.state.FlyrouteList[this.state.index], this.state.index);
              }}
            >
              {this.state.FlyrouteList.length === 0
                ? '暂无数据'
                : this.state.FlyrouteList[this.state.index].name}
            </div>
            {/* onClick={()=>{this.changeIndex('plus')}} */}
            <div
              className={styles.ctl + ' ' + styles.arrow}
              onClick={() => {
                this.changeIndex('plus');
              }}
            >
              <Icon type="right" className={styles.arrowIcon} />
            </div>
            <Tooltip title="最大化">
              <div
                className={styles.ctl}
                onClick={() => {
                  this.changeSize('big');
                }}
              >
                <div className={styles.iconWrap}>
                  <Icon type="border" />
                </div>
              </div>
            </Tooltip>
            <Tooltip title="关闭" onClick={this.close}>
              <div className={styles.ctl}>
                <div className={styles.iconWrap}>
                  <Icon type="close" />
                </div>
              </div>
            </Tooltip>
            <BorderPoint />
          </div>
        }

        {
          <div
            className={styles.box}
            style={{ display: this.state.viewType === 'big' ? 'block' : 'none' }}
          >
            <BorderPoint />
            <div className={styles.boxTitle}>
              <div className={styles.titleText}>飞行漫游</div>
              <div
                className={styles.titleControl}
                onClick={() => {
                  this.changeSize('small');
                }}
              >
                <Tooltip title="最小化">
                  <div className={styles.iconWrap}>
                    <Icon type="line" />
                  </div>
                </Tooltip>
                <Tooltip title="关闭" onClick={this.close}>
                  <div className={styles.iconWrap}>
                    <Icon type="close" />
                  </div>
                </Tooltip>
              </div>
            </div>
            <div className={styles.boxContent}>
              <div className={styles.leftBtn} onClick={this.scrollLeft}>
                <Icon type="left" className={styles.arrowIcon} />
              </div>
              <div ref={this.con} className={styles.con}>
                <div
                  className={styles.father}
                  style={{ width: (this.state.FlyrouteList.length + 2) * 172 + 'px' }}
                >
                  <div className={styles.item} onClick={this.depictroute}>
                    <Icon type="plus" className={styles.addIcon} />
                    <span className={styles.addText}>新增路线</span>
                  </div>
                  {this.state.FlyrouteList.map((item, index) => {
                    return (
                      <div key={index} className={styles.item}>
                        <img
                          src="./config/images/shenzhen/shenzhenmap.png"
                          alt=""
                          className={`${index == selectedindex ? styles.selected : ''}`}
                        />
                        <div className={styles.mask}>
                          <p className={styles.name}>{item.name == null ? '\b' : item.name}</p>
                          <div className={styles.bottomBtn}>
                            <div style={{ display: 'flex' }}>
                              <div
                                className={styles.btnItem}
                                style={{ marginRight: '4px' }}
                                onClick={this.flyto.bind(this, item, index)}
                              >
                                <a className={'iconfont icon_play'}></a>
                              </div>
                              <div
                                className={styles.btnItem}
                                onClick={this.editFlyline.bind(this, item, index)}
                              >
                                <a className={'iconfont icon_edit'}></a>
                              </div>
                            </div>
                            <Popconfirm
                              title="删除此飞行路线吗?"
                              onConfirm={this.confirmDel.bind(this, item.id)}
                              placement="top"
                              okText="是"
                              cancelText="否"
                            >
                              <div className={styles.btnItem}>
                                <span className={styles.btnIcon + ' iconfont'}>&#xe6ab;</span>
                              </div>
                            </Popconfirm>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className={styles.rightBtn} onClick={this.scrollRight}>
                <Icon type="right" className={styles.arrowIcon} />
              </div>
            </div>
          </div>
        }
      </>
    );
  }
}

export default Automaticroam;
