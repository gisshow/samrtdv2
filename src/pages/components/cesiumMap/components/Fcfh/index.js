/* global Cesium */
/* global viewer */
/* global mars */
/* global $ */
/* global mars3d */
/* turf */

import React, { Component, useState } from 'react';
import { Slider, Button, InputNumber, Row, Col, Icon, message, Drawer, Collapse, Modal, Spin } from 'antd';
import styles from './style.less';
import { connect } from 'dva';
import { PUBLIC_PATH } from '@/utils/config';
import BorderPoint from '../../../border-point';
import axios from 'axios';
const Ajax = require('axios');
const { Panel } = Collapse;
@connect(({ Map }) => ({
  Map,
}))
class Fcfh extends Component {
  constructor(props) {
    super(props);
    this.state = {
      floors: [],
      items: [],
      demomodel: null,
      Draweropen: false,
      isModalOpen: false,
      floorobj: null,
      tableLoading: false
    };
  }

  /**
  * 递归获取globalid
  * @param {*} params 
  */
  getGlobalId = (arr, result) => {
    for (let index = 0; index < arr.length; index++) {
      const element = arr[index];
      result.ids.push(element.globalId)
      if (element.children && element.children.length > 0) {
        this.getGlobalId(element.children, result)
      }
    }
  };


  /**
 * 递归获取globalid
 * @param {*} params 
 */
  getGlobaname = (arr, result) => {
    for (let index = 0; index < arr.length; index++) {
      const element = arr[index];
      result.ids.push(element)
      if (element.children && element.children.length > 0) {
        this.getGlobaname(element.children, result)
      }
    }
  };





  fnFenceng = (data) => {

    let result = { ids: [] }
    result.ids.push(data.globalId);
    if (data.children) {
      this.getGlobalId(data.children, result)
    }
    this.fencengCallback(result.ids)

  };

  fnclickFenceng = (data) => {
    var th = this;
    this.setState({
      isModalOpen: true,
      floorobj: data
    })
    let result = { ids: [] }
    result.ids.push(data.globalId);
    if (data.children) {
      this.getGlobalId(data.children, result)
    }

    this.clickfencengCallback(result.ids)





    var findfloor = th.findfloorandChildren(data.globalId);
    console.log(findfloor)
    //th.findObjectByID(data.globalId);

    th.fnFenceng(findfloor)
    const colors = [];
    colors.push(["${ID} ==='" + data.globalId + "'", "color('#3ef435')"])
    var conditions = th.state.demomodel.style._offset._conditions;
    th.state.demomodel.style = new Cesium.Cesium3DTileStyle({
      color: {
        conditions: colors
      },
      offset: {
        conditions: conditions
      },

    });








  };



  fnlpbFenceng = (data) => {

    let result = { ids: [] }

    if (data.children) {
      this.getGlobaname(data.children, result)
    }
    else {
      result.ids.push(data);
    }
    return result.ids;


  };

  // 获取楼层与对于的子
  findfloorandChildren = (id) => {
    var floorandchildren = [];
    this.state.floors.map(data => {
      let result = { ids: [], p: data }
      if (data.children) {

        this.getGlobalId(data.children, result)
      }
      floorandchildren.push(result)
    })

    var findfloorobj = null;

    floorandchildren.map(data => {
      var f = data.p;
      var z = data.ids;

      var findIndex = z.includes(id);

      if (findIndex) {
        findfloorobj = f;
        return;//找到了退出
      }

    })
    return findfloorobj;
  };

  // 根据部件ID 查找部件对象
  findObjectByID = (Gid) => {

    var th = this;
    this.state.floors.map(item => {


      let dpb = th.fnlpbFenceng(item);
      //  console.log(dpb)
      dpb.map(pitem => {
        var id = pitem.globalId;
        if (id == Gid) {
          th.fnclickFenceng(pitem)
          return;
        }

      })
    })
  };



  conditions = [];
  colors = [];
  ids = {};


  andleColorType = (color) => {
    color = color.replace(/rgba\(/, '')
    color = color.replace(/\)/, '')
    let colorArr = color.split(',');
    let colorArr2 = new Array(colorArr.length).fill(0);
    for (let i = 0; i < colorArr.length; i++) {
      colorArr2[i] = + colorArr[i] / 255
    }
    return new Cesium.Color(...colorArr2);
  };


  fnAllFenceng = () => {

    this.setState({
      tableLoading: true
    });




    if (this.conditions.length == 0) {
      for (let key in this.ids) {
        let data = this.ids[key];
        let result = { ids: [] }
        result.ids.push(data.globalId);
        if (data.children) {
          this.getGlobalId(data.children, result)
        }
        this.zakai(result.ids, key);
      }

    }
    this.state.demomodel.style = new Cesium.Cesium3DTileStyle({
      offset: {
        conditions: this.conditions

      },
      color: {
        conditions: this.colors

      }


    });

    this.setState({
      tableLoading: false
    });


  };

  // t in ragne 0..1, start-middle-end are colors in hex e.g. #FF00FF
  gradient = (t, start, middle, end) => {
    return t >= 0.5 ? this.linear(middle, end, (t - .5) * 2) : this.linear(start, middle, t * 2);
  };

  linear = (s, e, x) => {
    let r = this.byteLinear(s[1] + s[2], e[1] + e[2], x);
    let g = this.byteLinear(s[3] + s[4], e[3] + e[4], x);
    let b = this.byteLinear(s[5] + s[6], e[5] + e[6], x);
    return "#" + r + g + b;
  };

  // a,b are hex values from 00 to FF; x is real number in range 0..1
  byteLinear = (a, b, x) => {
    let y = (('0x' + a) * (1 - x) + ('0x' + b) * x) | 0;
    return y.toString(16).padStart(2, '0') // hex output
  };



  zakai = (ids, height) => {




    var h = height * 2;
    var j = ids.length;
    const colors = [];
    for (let index = 0; index < j; index++) {
      const id = ids[index];
      this.conditions.push(["${ID} ==='" + id + "'", " vec4(0.0,5.0,0.0," + h + ".0)"])

      // var gradient =this.gradient(index/100,'#05befb','#066685','#033849'); 


      this.colors.push(["${ID} ==='" + id + "'", "color('#1ab6e9')"])

    }
  };



  /**
   * 分层展开函数
   * @param {*} ids 
   */
  fencengCallback = (ids) => {



    const conditions = [];
    const colors = [];
    for (let index = 0; index < ids.length; index++) {
      const id = ids[index];
      conditions.push(["${ID} ==='" + id + "'", "vec4(0.1,0.1,2.0,25.0)"])

      //conditions.push(["${ID} ==='" + id + "'", " vec4(0.0,5.0,0.0,2.0)"])

      colors.push(["${ID} ==='" + id + "'", "color('#1baadf')"])

    }

    this.state.demomodel.style = new Cesium.Cesium3DTileStyle({
      offset: {
        conditions: conditions

      },

      color: {
        conditions: colors
      }
    });



  };

  clickfencengCallback = (ids) => {

    const conditions = [];
    const colors = [];
    for (let index = 0; index < ids.length; index++) {
      const id = ids[index];
      colors.push(["${ID} ==='" + id + "'", "color('#1baadf')"])

    }

    this.state.demomodel.style = new Cesium.Cesium3DTileStyle({
      // offset: {
      //   conditions: conditions

      // },

      color: {
        conditions: colors
      }
    });

  };




  getfloors = () => {
    let self = this;
    axios.get("BIM/19/tileset_spatialStructure.json", null)
      .then(function (result) {
        if (result.status == 200) {
          var floors = [];


          const levels = result.data.children[0].children[0].children
          for (let index = 0; index < levels.length; index++) {
            const element = levels[index];
            floors.push(element)
            self.ids[index] = element;
          }

          self.setState({
            floors: floors,
          })

        }

      })
      .catch(function (error) {
        console.log(error);
      });




  };

  reset = () => {

    // this.state.demomodel.style = new Cesium.Cesium3DTileStyle({
    //   offset: {
    //     conditions: []
    //   }
    // });

    this.drawheatmap();

  };


  showHeatMap = (arrPoints) => {

    let colorScale = [
      'rgb(36,104, 180)',
      'rgb(60,157, 194)',
      'rgb(128,205,193)',
      'rgb(151,218,168)',
      'rgb(198,231,181)',
      'rgb(238,247,217)',
    ];

    var gradient = [];
    for (var i = 0; i < colorScale.length; i++) {
      gradient[i] = colorScale[i];
    }


    


    // console.log(arrPoints)
    //console.log(_map)
    // 热力图 图层
    //  const heatLayer = new mars3d.layer.HeatLayer({
    //   positions: arrPoints,
    //   // 以下为热力图本身的样式参数，可参阅api：https://www.patrick-wied.at/static/heatmapjs/docs.html
    //   max: 20000,
    //   heatStyle: {
    //     radius: 20,
    //     minOpacity: 0,
    //     maxOpacity: 0.4,
    //     blur: 0.3,
    //     gradient: {
    //       0: "#e9ec36",
    //       0.25: "#ffdd2f",
    //       0.5: "#fa6c20",
    //       0.75: "#fe4a33",
    //       1: "#ff0000"
    //     }
    //   },
    //   // 以下为矩形矢量对象的样式参数
    //   style: {
    //     opacity: 1.0
    //     // clampToGround: true,
    //   },
    //   flyTo: true
    // })


//计算数据的最大最小值和边界 start
var _x = arrPoints[0]["x"];
var _y = arrPoints[0]["y"];
var _value = arrPoints[0]["value"];

var bounds = { "east": _x, "west": _x, "north": _y, "south": _y };

var min = _value;
var max = _value;
for (var i = 0; i < arrPoints.length; i++) {
    _x = arrPoints[i]["x"];
    _y = arrPoints[i]["y"];
    _value = arrPoints[i][ "value"];

    if (min > _value) min = _value;
    if (max < _value) max = _value;

    if (_x > bounds.east) bounds.east = _x;
    if (_x < bounds.west) bounds.west = _x;
    if (_y > bounds.north) bounds.north = _y;
    if (_y < bounds.south) bounds.south = _y;
}
//计算数据的最大最小值和边界 end




var options=
{
  useEntitiesIfAvailable: true, //whether to use entities if a Viewer is supplied or always use an ImageryProvider
  minCanvasSize: 700,           // minimum size (in pixels) for the heatmap canvas
  maxCanvasSize: 2000,          // maximum size (in pixels) for the heatmap canvas
  radiusFactor: 20,             // data point size factor used if no radius is given (the greater of height and width divided by this number yields the used radius)
  spacingFactor: 1.5,           // extra space around the borders (point radius multiplied by this number yields the spacing)
  maxOpacity: 0.4,              // the maximum opacity used if not given in the heatmap options object
  minOpacity: 0,              // the minimum opacity used if not given in the heatmap options object
  blur: 0.3,                   // the blur used if not given in the heatmap options object
  gradient: {
    0: "#e9ec36",
    0.25: "#ffdd2f",
    0.5: "#fa6c20",
    0.75: "#fe4a33",
    1: "#ff0000"
  }
}



// init heatmap
let heatMap = mars3d.CesiumHeatmap.create(
	window.viewer,
  bounds,
  options
 
);

// random example data



let valueMin = 0;
let valueMax = 20000;

// add data to heatmap
heatMap.setWGS84Data(valueMin, valueMax, arrPoints);



  }

  drawheatmapdemo = () => {

  

    

    var th = this;
    var resource = new Cesium.Resource({
      url: 'http://data.mars3d.cn/file/apidemo/heat-fuzhou.json'

    });
    return resource.fetchJson().then(function (result) {

     
      const arrPoints = []
      // for (let i = 0; i < result.Data.length; i++) {
      //   const item = result.Data[i]
      //   arrPoints.push({ x: item.x, y: item.y, value: item.t0 })
      // }
      for (let i = 0; i < 5000000; i++) {

        arrPoints.push({ x: 119.32+ Math.random() * 50  , y: 26.15 + Math.random() * 20 , value: Math.random() * 2000 })
      }





   

      th.showHeatMap(arrPoints)
    });

    

  }


  drawheatmap = () => {

  

    

    var th = this;
    var resource = new Cesium.Resource({
      url: 'CesiumPlugins/heatmap/heat-fuzhou.json'

    });
    return resource.fetchJson().then(function (result) {
      const arrPoints = []
      for (let i = 0; i < result.Data.length; i++) {
        const item = result.Data[i]
        arrPoints.push({ x: item.x, y: item.y, value: item.t0 })
      }
      th.showHeatMap(arrPoints)
    });

    

  }




  drawheatmap2 = () => {


    var th = this;
    var resource = new Cesium.Resource({
      url: 'CesiumPlugins/heatmap/api.geojson'

    });
    return resource.fetchJson().then(function (result) {

     
      const arrPoints = []
     
      for (let i = 0; i < result.features.length ; i++) {

         const item = result.features[i].properties
         arrPoints.push({ x: Number( item.x)  , y:  Number( item.y), value: Number(  item.DisLevel)})
      }
      console.log(arrPoints)





      th.showHeatMap(arrPoints)
    });

    

  }


  draweropen = () => {

    this.setState({
      Draweropen: !this.state.Draweropen
    })

  };
  drawerclose = () => {



    this.setState({
      Draweropen: false
    })

  };



  closePanel = () => {


    this.props.dispatch({
      type: 'Map/setToolsActiveKey',
      payload: 'Fcfh',
    });
  };

  selectEvent = (ids) => {

    const conditions = [];
    for (let index = 0; index < ids.length; index++) {
      const id = ids[index];
      conditions.push(["${ID} ==='" + id + "'", "rgb(255, 255, 255)"])
    }
    conditions.push(["true", "rgba(255, 200, 200,0.2)"])
    this.state.demomodel.style = new Cesium.Cesium3DTileStyle({
      color: {
        conditions: conditions
      }
    });
  };

  componentDidMount() {


    let find = 0;

    let count = viewer.scene.primitives._primitives.length;
    for (var i = 0; i < count; i++) {
      var primitive = viewer.scene.primitives._primitives[i]

      if (primitive._name == "demomodel") {
        find++;
        this.setState({
          demomodel: primitive
        })

        // console.log(primitive._name )
        // primitive._name!="上海临港科技新城"
        //message.error('请打开图层')
        // return;
      }
    }

    if (find == 0) {
      message.error('请在图层列表加载模型图层,并定位到模型')

      this.props.dispatch({
        type: 'Map/setToolsActiveKey',
        payload: 'Fcfh',
      });

    }
    else {
      this.getfloors();
    }


    var th = this;
    const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    handler.setInputAction(function (movement) {


      const feature = viewer.scene.pick(movement.position);
      if (feature instanceof Cesium.Cesium3DTileFeature) {
        const attributes = feature;
        let id = feature.getProperty("ID");
        console.log(id)
        var findfloor = th.findfloorandChildren(id);
        th.findObjectByID(id);
        th.fnFenceng(findfloor)
        const colors = [];
        colors.push(["${ID} ==='" + id + "'", "color('#3ef435')"])
        var conditions = th.state.demomodel.style._offset._conditions;
        th.state.demomodel.style = new Cesium.Cesium3DTileStyle({
          color: {
            conditions: colors
          },
          offset: {
            conditions: conditions
          },

        });



      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

  }

  componentWillUnmount() {

  }

  render() {

    const text = `
    A dog is a type of domesticated animal.
    Known for its loyalty and faithfulness,
    it can be found as a welcome guest in many households across the world.
  `;

    const onChange = (key) => {
      console.log(key)
    };

    let arr = []


    let lpbarr = []

    this.state.floors.map(item => {
      var name = item.name;
      name = name.substring(name.indexOf(" ") + 1) + "层";
      arr.push(<Button key={item.name} className={styles.floorbut} onClick={() => { this.fnFenceng(item) }}> {name}</Button>)

      let fjbu = []
      let dpb = this.fnlpbFenceng(item);

      dpb.map(pitem => {
        var n = pitem.name.substring(pitem.name.indexOf(":") + 1, pitem.name.lastIndexOf(":"));
        fjbu.push(<Button key={pitem.name} onClick={() => { this.fnclickFenceng(pitem) }}> {n}</Button>)
      })





      lpbarr.push(<Panel header={name} key={item.name}    > {fjbu}  </Panel>)


    })





    return (




      <div    >

        <div>

          <Drawer id="lpbdiv" title="楼盘表" className={styles.DrawerPanel} mask={false} visible={this.state.Draweropen} onClose={this.drawerclose} placement="left" width={520}   >

            <Collapse onChange={onChange}>



              {lpbarr}



            </Collapse>


          </Drawer>

        </div>



        <div className={styles.PipePanel}>




          <BorderPoint />
          <div className={styles.closeV} onClick={this.closePanel}>
            <Icon type="close" />
          </div>

          <div>
            {arr}
            <Button className={styles.resetbut} onClick={this.fnAllFenceng}  >楼层炸开</Button>
            <Button className={styles.resetbut} onClick={this.draweropen}  >楼盘表</Button>
            <Button className={styles.resetbut} onClick={this.reset}  >还原模型</Button>



          </div>


          <div>


          </div>

        </div>


        <Modal wrapClassName="fcfhModal" mask={false} title="部件属性" footer={[]} visible={this.state.isModalOpen} onOk={() => {
          this.setState({
            isModalOpen: false
          })
        }}

          onCancel={() => {

            this.setState({
              isModalOpen: false
            })

          }}

        >

          <div>全局ID:{this.state.floorobj && this.state.floorobj.globalId}</div>
          <div>部件名称:{this.state.floorobj && this.state.floorobj.name}</div>
          <div>类型:{this.state.floorobj && this.state.floorobj.type}</div>

        </Modal>


        {/* <Spin tip="Loading" spinning={this.state.tableLoading }    size="large">
        <div className="content" />
       </Spin> */}


      </div>




    );
  }
}

export default Fcfh;
