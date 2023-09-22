/* global Cesium */
/* global viewer */
/* global mars3d */

import React, { Component } from 'react'

import styles from './styles.less';
import { connect } from 'dva';
import { Tooltip, Progress, Icon } from 'antd';
import ModuleTitle from '@/components/moduleTitle'
import Bar from '@/components/Chart/Bar';
import Column from '@/components/Chart/Column'
import { request } from '@/utils/request';
import { getBuild3DUrl, getBuildById } from '@/service/house';
let count = 0;//点击次数

@connect(({ Home }) => ({
   Home
}))
class Undermessage extends Component {

   constructor(props) {
      super(props);
      this.state = {
         isvgshow: [],
         seletedindex: -1
      }
   }

   openHouseHold = () => {
      const { seletedindex } = this.state
      let layerdesc = document.getElementById("layerdesc" + seletedindex);
      if (layerdesc) {
         var imgheight = Number(layerdesc.clientHeight) * 1.1;
         layerdesc.firstChild.style.height = imgheight + "px";
      }
      //alert(imgheight)
   }

   setExpand = (index) => {
      const { seletedindex } = this.state
      if (index == seletedindex) {
         index = -1;
      }
      //展开或收缩
      this.setState({
         seletedindex: index
      })
      setTimeout(this.openHouseHold, 20);
   }
   close = () => {
      this.props.dispatch({
         type: 'Home/setBuildingInfo',
         payload: null
      })
   }
   render() {
      let { buildingInfo } = this.props.Home
      let { buildingInfo: { type, holedataList, holename, dataList }, PMindex } = this.props.Home
      const { isExpand, isShow, isvgshow, seletedindex } = this.state;
      return (
         <>
            {
               (type == "zkholedata" || type == "pmholedata") && holedataList && 
               <div className={styles.connet}>
                  <div className={styles.heads}>
                     <span>{holename}</span>
                     <div className={styles.close} onClick={() => this.close()}>X</div>

                  </div>
                  <div className={styles.line}></div>
                  <div className={styles.scrollBox}>
                     {
                        holedataList.map((item, index) => {
                           if (seletedindex <= -1) {
                              isvgshow[index] = false;
                           } else {
                              if (index == seletedindex) {
                                 isvgshow[index] = true;
                              } else {
                                 isvgshow[index] = false;
                              }
                           }
                           // if (type === "pmholedata") {
                           //    var adiv = document.createElement("a");
                           //    adiv.href = "#" + PMindex;
                           //    adiv.click()
                           // }
                           return (

                              <div className={styles.box} key={index} id={item.objectID}>
                                 <div className={styles.title}>
                                    <div className={styles.imgconnectmes}>
                                       <div className={styles.backgroundimg} style={{ backgroundImage: `url('${require('@/assets/images/img/' + item.LAYERCODE + '.jpg')}')` }}></div>
                                       {/* <img className={styles.img} src={require('@/assets/images/img/'+buildingInfo.LAYERCODE +'.jpg')} width={80} height={120}></img> */}
                                       <div className={styles.connectmes}>
                                          <div className={styles.layername}>{item.LAYERNAME}</div>

                                          <div className={styles.layercode}>地层编号 &nbsp;&nbsp;&nbsp;{item.LAYERCODE}</div>
                                       </div>
                                    </div>
                                    <div className={styles.connectoperate}>
                                       <div className={styles.operate} onClick={() => this.setExpand(index)} >
                                          {
                                             <Icon type="double-right" className={`${(isvgshow[index] === true) ? styles.isvgbottom : styles.isvgtop}`}></Icon>
                                          }
                                       </div>
                                    </div>

                                 </div >
                                 {
                                    (isvgshow[index]) &&
                                    <div className={styles.dashboard} >
                                       <div className={styles.layerdesc} id={"layerdesc" + index}>
                                          <div className={styles.imgbackground} style={{ backgroundImage: `url('${require('@/assets/images/img/' + item.LAYERCODE + '.jpg')}')` }}></div>
                                          {/* <img className={styles.img} src={require('@/assets/images/img/'+buildingInfo.LAYERCODE +'.jpg')} width={80} height={0}></img>    */}
                                          <div className={styles.lines}></div>
                                          <div className={styles.topfrpth}>顶板深埋 &nbsp;&nbsp;&nbsp;{item.TOPDEPTH}</div>
                                          <div className={styles.bottomdepth}>底板深埋 &nbsp;&nbsp;&nbsp;{item.BOTTOMDEPTH}</div>
                                          <div className={styles.layerdescon}><div className={styles.descontitle}>地层描述</div> <div className={styles.desconcon}>{item.LAYERDESC}</div> </div>
                                       </div>
                                       {/* <div className={styles.time}>数据更新</div> */}

                                    </div>
                                 }
                              </div>

                           )
                        })
                     }
                  </div>

               </div>
            }
            {
               (type == "zcgeodata") && dataList &&
               <div className={styles.connet}>
                  <div className={styles.heads}>
                     <span>{holename}</span>
                     <div className={styles.close} onClick={() => this.close()}>X</div>
                  </div>
                  <div className={styles.line}></div>
                  <div className={styles.scrollBox}>
                     <div className={styles.box} >
                        <div className={styles.boxitm}>
                           <div className={styles.descontitle}>地层编号</div> <div className={styles.desconcon}>{dataList.LAYERCODE}</div>
                        </div>
                        <div className={styles.boxitm}>
                           <div className={styles.descontitle}>地层颜色</div> <div className={styles.desconcon}>{dataList.COLOR}</div>
                        </div>
                        <div className={styles.boxitm}>
                           <div className={styles.descontitle}>地质年代</div> <div className={styles.desconcon}>{dataList.AGEID}</div>
                        </div>
                        <div className={styles.boxitm}>
                           <div className={styles.descontitle}>地层名称</div> <div className={styles.desconcon}>{dataList.LAYERNAME}</div>
                        </div>
                        <div className={styles.boxitm}>
                           <div className={styles.descontitle}>地层描述</div> <div className={styles.desconcon}>{dataList.LAYERDESC}</div>
                        </div>
                     </div>
                  </div>
                  {/** */}
               </div>
            }
            {

               (type == "jiwelldata") && dataList &&
               <div className={styles.connet}>
                  <div className={styles.heads}>
                     <span>{holename}</span>
                     <div className={styles.close} onClick={() => this.close()}>X</div>
                  </div>
                  <div className={styles.line}></div>
                  <div className={styles.scrollBox}>
                     <div className={styles.box} >
                        <div className={styles.boxitm}>
                           <div className={styles.descontitle}>OID</div> <div className={styles.desconcon}>{dataList.OBJECTID}</div>
                        </div>
                        <div className={styles.boxitm}>
                           <div className={styles.descontitle}>物探点号</div> <div className={styles.desconcon}>{dataList.WTDH}</div>
                        </div>
                        <div className={styles.boxitm}>
                           <div className={styles.descontitle}>管线代码</div> <div className={styles.desconcon}>{dataList.GXDM}</div>
                        </div>
                        <div className={styles.boxitm}>
                           <div className={styles.descontitle}>横坐标</div> <div className={styles.desconcon}>{dataList.HZB}</div>
                        </div>
                        <div className={styles.boxitm}>
                           <div className={styles.descontitle}>纵坐标</div> <div className={styles.desconcon}>{dataList.ZZB}</div>
                        </div>
                        <div className={styles.boxitm}>
                           <div className={styles.descontitle}>地面高程</div> <div className={styles.desconcon}>{`${dataList.DMGC} 米`}</div>
                        </div>
                        <div className={styles.boxitm}>
                           <div className={styles.descontitle}>埋深</div> <div className={styles.desconcon}>{`${dataList.MS} 米`}</div>
                        </div>
                        <div className={styles.boxitm}>
                           <div className={styles.descontitle}>所在道路</div> <div className={styles.desconcon}>{dataList.SZDL}</div>
                        </div>
                        <div className={styles.boxitm}>
                           <div className={styles.descontitle}>权属单位</div> <div className={styles.desconcon}>{dataList.QSDW}</div>
                        </div>
                        <div className={styles.boxitm}>
                           <div className={styles.descontitle}>建设年代</div> <div className={styles.desconcon}>{dataList.JSND}</div>
                        </div>
                        <div className={styles.boxitm}>
                           <div className={styles.descontitle}>探测单位</div> <div className={styles.desconcon}>{dataList.TCDW}</div>
                        </div>
                        <div className={styles.boxitm}>
                           <div className={styles.descontitle}>探测日期</div> <div className={styles.desconcon}>{dataList.TCRQ}</div>
                        </div>
                        <div className={styles.boxitm}>
                           <div className={styles.descontitle}>使用状态</div> <div className={styles.desconcon}>{dataList.SYZT}</div>
                        </div>
                        <div className={styles.boxitm}>
                           <div className={styles.descontitle}>数据来源</div> <div className={styles.desconcon}>{dataList.SJLY}</div>
                        </div>
                        <div className={styles.boxitm}>
                           <div className={styles.descontitle}>材质</div> <div className={styles.desconcon}>{dataList.CZ}</div>
                        </div>
                        <div className={styles.boxitm}>
                           <div className={styles.descontitle}>工程编号</div> <div className={styles.desconcon}>{dataList.GCBH}</div>
                        </div>
                     </div>
                  </div>
                  {/** 井*/}
               </div>
            }
            {
               (type == "wpipelinedata") && dataList &&
               <div className={styles.connet}>
                  <div className={styles.heads}>
                     <span>{holename}</span>
                     <div className={styles.close} onClick={() => this.close()}>X</div>
                  </div>
                  <div className={styles.line}></div>
                  <div className={styles.scrollBox}>
                     <div className={styles.box} >
                        <div className={styles.boxitm}>
                           <div className={styles.descontitle}>OID</div> <div className={styles.desconcon}>{dataList.OBJECTID}</div>
                        </div>
                        <div className={styles.boxitm}>
                           <div className={styles.descontitle}>管线编码</div> <div className={styles.desconcon}>{dataList.GXBM}</div>
                        </div>
                        <div className={styles.boxitm}>
                           <div className={styles.descontitle}>管线代码</div> <div className={styles.desconcon}>{dataList.GXDM}</div>
                        </div>
                        <div className={styles.boxitm}>
                           <div className={styles.descontitle}>起始点号</div> <div className={styles.desconcon}>{dataList.QDGXDH}</div>
                        </div>
                        <div className={styles.boxitm}>
                           <div className={styles.descontitle}>终点点号</div> <div className={styles.desconcon}>{dataList.ZDGXDH}</div>
                        </div>
                        <div className={styles.boxitm}>
                           <div className={styles.descontitle}>起点高程</div> <div className={styles.desconcon}>{`${dataList.QDDMGC} 米`}</div>
                        </div>
                        <div className={styles.boxitm}>
                           <div className={styles.descontitle}>终点高程</div> <div className={styles.desconcon}>{`${dataList.ZDDMGC} 米`}</div>
                        </div>
                        <div className={styles.boxitm}>
                           <div className={styles.descontitle}>起点埋深</div> <div className={styles.desconcon}>{`${dataList.QDGXMS} 米`}</div>
                        </div>
                        <div className={styles.boxitm}>
                           <div className={styles.descontitle}>终点埋深</div> <div className={styles.desconcon}>{`${dataList.ZDGXMS} 米`}</div>
                        </div>
                        <div className={styles.boxitm}>
                           <div className={styles.descontitle}>埋设类型</div> <div className={styles.desconcon}>{dataList.MSLX}</div>
                        </div>
                        <div className={styles.boxitm}>
                           <div className={styles.descontitle}>管径(mm)</div> <div className={styles.desconcon}>{dataList.GJ}</div>
                        </div>
                        <div className={styles.boxitm}>
                           <div className={styles.descontitle}>所在道路</div> <div className={styles.desconcon}>{dataList.SZDL}</div>
                        </div>
                        <div className={styles.boxitm}>
                           <div className={styles.descontitle}>权属单位</div> <div className={styles.desconcon}>{dataList.QSDW}</div>
                        </div>
                        <div className={styles.boxitm}>
                           <div className={styles.descontitle}>建设年代</div> <div className={styles.desconcon}>{dataList.JSND}</div>
                        </div>
                        <div className={styles.boxitm}>
                           <div className={styles.descontitle}>探测单位</div> <div className={styles.desconcon}>{dataList.TCDW}</div>
                        </div>
                        <div className={styles.boxitm}>
                           <div className={styles.descontitle}>探测日期</div> <div className={styles.desconcon}>{dataList.TCRQ}</div>
                        </div>
                        <div className={styles.boxitm}>
                           <div className={styles.descontitle}>使用状态</div> <div className={styles.desconcon}>{dataList.SYZT}</div>
                        </div>
                        <div className={styles.boxitm}>
                           <div className={styles.descontitle}>数据来源</div> <div className={styles.desconcon}>{dataList.SJLY}</div>
                        </div>
                        <div className={styles.boxitm}>
                           <div className={styles.descontitle}>线性</div> <div className={styles.desconcon}>{dataList.XX}</div>
                        </div>
                        <div className={styles.boxitm}>
                           <div className={styles.descontitle}>材质</div> <div className={styles.desconcon}>{dataList.CZ}</div>
                        </div>
                        <div className={styles.boxitm}>
                           <div className={styles.descontitle}>管长(m)</div> <div className={styles.desconcon}>{dataList.GC}</div>
                        </div>
                        <div className={styles.boxitm}>
                           <div className={styles.descontitle}>工程编号</div> <div className={styles.desconcon}>{dataList.GCBH}</div>
                        </div>
                        <div className={styles.boxitm}>
                           <div className={styles.descontitle}>流向</div> <div className={styles.desconcon}>{dataList.LX}</div>
                        </div>
                     </div>
                  </div>
                  {/** 给水 排水 排污*/}
               </div>
            }
            {

               (type == "dpipelinedata") && dataList &&
               <div className={styles.connet}>
                  <div className={styles.heads}>
                     <span>{holename}</span>
                     <div className={styles.close} onClick={() => this.close()}>X</div>
                  </div>
                  <div className={styles.line}></div>
                  <div className={styles.scrollBox}>
                     <div className={styles.box} >
                        <div className={styles.boxitm}>
                           <div className={styles.descontitle}>模型编码</div> <div className={styles.desconcon}>{dataList.OBJECTID}</div>
                        </div>
                        <div className={styles.boxitm}>
                           <div className={styles.descontitle}>管线代码</div> <div className={styles.desconcon}>{dataList.PIPELINECODE}</div>
                        </div>
                        <div className={styles.boxitm}>
                           <div className={styles.descontitle}>埋设类型</div> <div className={styles.desconcon}>{"直埋"}</div>
                        </div>
                        <div className={styles.boxitm}>
                           <div className={styles.descontitle}>材质</div> <div className={styles.desconcon}>{"灰口铸铁/PVC"}</div>
                        </div>
                        <div className={styles.boxitm}>
                           <div className={styles.descontitle}>管径</div> <div className={styles.desconcon}>{"600*200"}</div>
                        </div>
                        <div className={styles.boxitm}>
                           <div className={styles.descontitle}>电压值</div> <div className={styles.desconcon}>{"110KV"}</div>
                        </div>
                        <div className={styles.boxitm}>
                           <div className={styles.descontitle}>压力</div> <div className={styles.desconcon}>{"中压"}</div>
                        </div>
                        <div className={styles.boxitm}>
                           <div className={styles.descontitle}>流向</div> <div className={styles.desconcon}>{"+"}</div>
                        </div>
                        <div className={styles.boxitm}>
                           <div className={styles.descontitle}>总孔数</div> <div className={styles.desconcon}>{"12"}</div>
                        </div>
                        <div className={styles.boxitm}>
                           <div className={styles.descontitle}>占孔数</div> <div className={styles.desconcon}>{"7"}</div>
                        </div>
                        <div className={styles.boxitm}>
                           <div className={styles.descontitle}>权属单位</div> <div className={styles.desconcon}>{"B054"}</div>
                        </div>
                        <div className={styles.boxitm}>
                           <div className={styles.descontitle}>建设年代</div> <div className={styles.desconcon}>{"2018-05-13"}</div>
                        </div>
                        <div className={styles.boxitm}>
                           <div className={styles.descontitle}>介质</div> <div className={styles.desconcon}>{"铜"}</div>
                        </div>
                     </div>
                  </div>
                  {/** 电力 通讯*/}
               </div>
            }

         </>
      );
   }
}

export default Undermessage;
