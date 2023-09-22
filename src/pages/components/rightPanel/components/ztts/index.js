import React, { Component } from 'react'
import ModuleTitle from '@/components/moduleTitle'

import styles from './styles.less';

class ContentBox extends Component {

  planEcharts() {
    var t = {
      DC2: [{
        sceneId: 0,
        sceneName: "基准场景",
        stockName: "DC2",
        productName: "SKU1",
        stockOutAmount: 60,
        stockOutWeight: 120,
        stockOutSquare: 60,
        stockInCost: 120,
        stockOutCost: 180,
        avgStockAmount: 60,
        storageCost: 1400,
        stockHoldCost: 800
      },
      {
        sceneId: 0,
        sceneName: "基准场景",
        stockName: "DC2",
        productName: "SKU2",
        stockOutAmount: 60,
        stockOutWeight: 90,
        stockOutSquare: 120,
        stockInCost: 120,
        stockOutCost: 180,
        avgStockAmount: 60,
        storageCost: 2800,
        stockHoldCost: 1200
      },
      {
        sceneId: 0,
        sceneName: "基准场景",
        stockName: "DC2",
        productName: "SKU3",
        stockOutAmount: 60,
        stockOutWeight: 90,
        stockOutSquare: 120,
        stockInCost: 120,
        stockOutCost: 180,
        avgStockAmount: 60,
        storageCost: 2800,
        stockHoldCost: 1200
      },
      {
        sceneId: 0,
        sceneName: "基准场景",
        stockName: "DC2",
        productName: "SKU4",
        stockOutAmount: 30,
        stockOutWeight: 60,
        stockOutSquare: 90,
        stockInCost: 60,
        stockOutCost: 90,
        avgStockAmount: 30,
        storageCost: 2100,
        stockHoldCost: 1e3
      },
      {
        sceneId: 0,
        sceneName: "基准场景",
        stockName: "DC2",
        productName: "SKU3",
        stockOutAmount: 60,
        stockOutWeight: 90,
        stockOutSquare: 120,
        stockInCost: 120,
        stockOutCost: 180,
        avgStockAmount: 60,
        storageCost: 2800,
        stockHoldCost: 1200
      },
      {
        sceneId: 0,
        sceneName: "基准场景",
        stockName: "DC2",
        productName: "SKU4",
        stockOutAmount: 30,
        stockOutWeight: 60,
        stockOutSquare: 90,
        stockInCost: 60,
        stockOutCost: 90,
        avgStockAmount: 30,
        storageCost: 2100,
        stockHoldCost: 1e3
      }]
    };
    var  e = [];

    for (var a in t) {
      var i = t[a];
      i.length=i.length + 1;
      e = e.concat(i, [{
        productName: ""
      }])
    }
    var s = [],
    n = e.map((function(t) {
      return t.productName
    })),
    o = e.map((function(t) {
      return t.stockOutAmount
    })),
    r = e.map((function(t) {
      return t.avgStockAmount
    })),
    l = {
      tooltip: {
        trigger: "axis",
        axisPointer: {
          type: "shadow"
        }
      },
      axisPointer: {
        link: {
          xAxisIndex: "all"
        }
      },
      legend: {
        data: ["文字占位1", "文字占位2"],
        x: "7%",
        y: "5%",
        itemWidth: 11,
        itemHeight: 5,
        textStyle: {
          color: "#fff",
          fontSize: 12
        }
      },
      grid: [{
        top: 40,
        height: 90,
        left: "15%"
      },
      {},
      {
        top: 130,
        height: 90,
        left: "15%"
      }],
      xAxis: [{
        type: "category",
        data: n,
        gridIndex: 0,
        axisLabel: {
          show: !1,
          color: "rgba(255,255,255,0.7)",
          margin: 4
        },
        axisTick: {
          show: !1
        },
        zlevel: 2
      },
      {
        type: "category",
        gridIndex: 1,
        axisLine: {
          show: !1
        },
        zlevel: 3
      },
      {
        position: "top",
        type: "category",
        data: n,
        gridIndex: 2,
        axisLabel: {
          color: "rgba(255,255,255,0.7)",
          margin: -108
        },
        axisTick: {
          show: !1
        },
        zlevel: 2
      }],
      yAxis: [{
        type: "value",
        gridIndex: 0,
        minInterval: 1,
        interval: 30,
        axisLabel: {
          color: "rgba(255,255,255,0.7)",
          lineStyle: {
            color: "rgba(255,255,255,0.7)"
          }
        },
        splitLine: {
          lineStyle: {
            color: "#167174"
          }
        },
        axisLine: {
          lineStyle: {
            color: "#167174"
          }
        },
        axisTick: {
          show: !1
        }
      },
      {
        type: "value",
        gridIndex: 1,
        axisLabel: {
          show: !1
        },
        splitLine: {
          show: !1
        },
        axisTick: {
          show: !1
        }
      },
      {
        type: "value",
        inverse: !0,
        gridIndex: 2,
        minInterval: 1,
        interval: 30,
        axisLabel: {
          color: "rgba(255,255,255,0.7)"
        },
        splitLine: {
          lineStyle: {
            color: "#167174"
          }
        },
        axisLine: {
          lineStyle: {
            color: "#167174"
          }
        },
        axisTick: {
          show: !1
        }
      }],
      series: [{
        name: "文字占位1",
        data: o,
        type: "bar",
        itemStyle: {
          normal: {
            color: "#73EBC0"
          }
        },
        xAxisIndex: 0,
        yAxisIndex: 0
      }].concat(s, [{
        name: "文字占位2",
        data: r,
        type: "bar",
        itemStyle: {
          normal: {
            color: "#CC9A30"
          }
        },
        xAxisIndex: 2,
        yAxisIndex: 2
      }])
    };

    var c = window. echarts.init(document.getElementById("planEcharts"));
    c.setOption(l);
    window.addEventListener("resize", (function () { c.resize() }), !1);




  }
    

  weatherEcharts()
   {
    var t = {
      grid: {
        top: "15%",
        left: "5%",
        right: "10%",
        bottom: "0%",
        containLabel: !0
      },
      tooltip: {
        trigger: "axis"
      },
      dataset: [{
        source: [[1, 4862.4], [2, 5294.7], [3, 5934.5], [4, 7171], [5, 8964.4], [6, 10202.2], [7, 11962.5], [8, 14928.3], [9, 16909.2], [10, 18547.9], [11, 21617.8], [12, 26638.1], [13, 34634.4], [14, 46759.4], [15, 58478.1], [16, 67884.6], [17, 74462.6], [18, 79395.7]]
      }],
      xAxis: {
        axisLine: {
          show: !1,
          lineStyle: {
            color: "rgba(17, 65, 67, 0.6)"
          }
        },
        axisLabel: {
          show: !0,
          textStyle: {
            color: "rgba(255,255,255,0.7)"
          }
        },
        splitLine: {
          lineStyle: {
            color: "#167174",
            type: "dashed"
          }
        },
        axisTick: {
          show: !1
        }
      },
      yAxis: {
        axisLine: {
          show: !1,
          lineStyle: {
            color: "rgba(17, 65, 67, 0.6)"
          }
        },
        axisLabel: {
          show: !0,
          textStyle: {
            color: "rgba(255,255,255,0.7)"
          }
        },
        splitLine: {
          lineStyle: {
            color: "#167174",
            type: "dashed"
          }
        },
        axisTick: {
          show: !1
        }
      },
      series: [{
        name: "scatter",
        type: "scatter",
        datasetIndex: 0,
        symbolSize: 12,
        itemStyle: {
          color: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 1,
            y2: 1,
            colorStops: [{
              offset: 0,
              color: "#FFD4A0"
            },
            {
              offset: 1,
              color: "#F68B00"
            }]
          }
        }
      },
      {
        name: "line",
        type: "line",
        smooth: !0,
        datasetIndex: 1,
        symbolSize: .1,
        symbol: "circle",
        label: {
          show: !0,
          fontSize: 16
        },
        labelLayout: {
          dx: -20
        },
        encode: {
          label: 2,
          tooltip: 1
        },
        lineStyle: {
          color: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 1,
            y2: 1,
            colorStops: [{
              offset: .4,
              color: "#6140B3"
            },
            {
              offset: .8,
              color: "#FF5050"
            }]
          }
        }
      }]
    };


    var e =  window. echarts.init(document.getElementById("weatherEcharts"));
    e.setOption(t);

    window.addEventListener("resize", (function() {
      e.resize()
    }), !1)
  
  }

  EmergencyEcharts() {
    var t =  window. echarts.init(document.getElementById("EmergencyEcharts")),

    e = ["老人摔倒", "小孩丢失", "高空坠物", "煤气报警", "小型火灾"],
    a = [100, 100, 100, 100, 100],
    i = {
      1 : [3, 20, 62, 34, 55]
    },
    s = {
      1 : [11, 38, 23, 39, 66]
    },
    n = [1],
    o = {
      baseOption: {
        timeline: {
          show: !1,
          top: 0,
          data: []
        },
        legend: {
          top: "5%",
          left: "8%",
          itemWidth: 11,
          itemHeight: 5,
          icon: "horizontal",
          textStyle: {
            color: "#ffffff",
            fontSize: 12
          },
          data: ["次数", "百分比"]
        },
        grid: [{
          show: !1,
          left: "10%",
          top: "20%",
          bottom: "8%",
          containLabel: !0,
          width: "33%"
        },
        {
          show: !1,
          left: "52%",
          top: "20%",
          bottom: "8%",
          width: "0%"
        },
        {
          show: !1,
          right: "10%",
          top: "20%",
          bottom: "8%",
          containLabel: !0,
          width: "33%"
        }],
        xAxis: [{
          type: "value",
          inverse: !0,
          axisLine: {
            show: !1
          },
          axisTick: {
            show: !1
          },
          position: "top",
          axisLabel: {
            show: !1
          },
          splitLine: {
            show: !1
          }
        },
        {
          gridIndex: 1,
          show: !1
        },
        {
          gridIndex: 2,
          axisLine: {
            show: !1
          },
          axisTick: {
            show: !1
          },
          position: "top",
          axisLabel: {
            show: !1
          },
          splitLine: {
            show: !1
          }
        }],
        yAxis: [{
          type: "category",
          inverse: !0,
          position: "right",
          axisLine: {
            show: !1
          },
          axisTick: {
            show: !1
          },
          axisLabel: {
            show: !1
          },
          data: e
        },
        {
          gridIndex: 1,
          type: "category",
          inverse: !0,
          position: "left",
          axisLine: {
            show: !1
          },
          axisTick: {
            show: !1
          },
          axisLabel: {
            show: !0,
            textStyle: {
              color: "#ffffff",
              fontSize: 12
            }
          },
          data: e.map((function(t) {
            return {
              value: t,
              textStyle: {
                align: "center"
              }
            }
          }))
        },
        {
          gridIndex: 2,
          type: "category",
          inverse: !0,
          position: "left",
          axisLine: {
            show: !1
          },
          axisTick: {
            show: !1
          },
          axisLabel: {
            show: !1
          },
          data: e
        }],
        series: []
      },
      options: []
    };
    o.baseOption.timeline.data.push(n[0]);
    o.options.push({
      series: [{
        type: "pictorialBar",
        xAxisIndex: 0,
        yAxisIndex: 0,
        symbol: "roundRect",
        symbolMargin: "2",
        itemStyle: {
          normal: {
            color: "rgba(28, 87, 90, 0.5)"
          }
        },
        symbolRepeat: !0,
        symbolSize: [3, 15],
        data: a,
        barGap: "-100%",
        barCategoryGap: 0,
        label: {
          normal: {
            show: !0,
            formatter: function(t) {
              return i[n[0]][t.dataIndex]
            },
            position: "insideTopLeft",
            textStyle: {
              color: "#ffffff",
              fontSize: 12
            },
            offset: [ - 30, 5]
          }
        },
        z: -100,
        animationEasing: "elasticOut"
      },
      {
        name: "次数",
        type: "pictorialBar",
        xAxisIndex: 0,
        yAxisIndex: 0,
        symbol: "roundRect",
        symbolMargin: "2",
        itemStyle: {
          barBorderRadius: 5,
          color: {
            type: "linear",
            x: 1,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [{
              offset: 0,
              color: "#008961"
            },
            {
              offset: 1,
              color: "#A0FFD2"
            }]
          }
        },
        symbolRepeat: !0,
        symbolSize: [3, 15],
        data: i[n[0]],
        animationEasing: "elasticOut",
        animationDelay: function(t, e) {
          return 30 * e.index * 1.1
        }
      },
      {
        type: "pictorialBar",
        xAxisIndex: 2,
        yAxisIndex: 2,
        symbol: "roundRect",
        symbolMargin: "2",
        itemStyle: {
          normal: {
            color: "rgba(28, 87, 90, 0.5)"
          }
        },
        symbolRepeat: !0,
        symbolSize: [3, 15],
        data: a,
        barGap: "-100%",
        barCategoryGap: 0,
        label: {
          normal: {
            show: !0,
            formatter: function(t) {
              return s[n[0]][t.dataIndex] + "%"
            },
            position: "insideTopRight",
            textStyle: {
              color: "#ffffff",
              fontSize: 12
            },
            offset: [35, 5]
          }
        },
        z: -100,
        animationEasing: "elasticOut"
      },
      {
        name: "百分比",
        type: "pictorialBar",
        xAxisIndex: 2,
        yAxisIndex: 2,
        symbolSize: [3, 15],
        symbol: "roundRect",
        symbolMargin: "2",
        itemStyle: {
          barBorderRadius: 5,
          color: {
            type: "linear",
            x: 1,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [{
              offset: 0,
              color: "rgba(196, 110, 56, 1)"
            },
            {
              offset: 1,
              color: "rgba(227, 194, 85, 1)"
            }]
          }
        },
        symbolRepeat: !0,
        data: s[n[0]],
        animationEasing: "elasticOut",
        animationDelay: function(t, e) {
          return 30 * e.index * 1.1
        }
      }]
    });
    t.setOption(o);
    window.addEventListener("resize", (function() {
      t.resize()
    }), !1);

  }
  


  componentDidMount()
   {

    this.planEcharts()
    this.EmergencyEcharts()
    this.weatherEcharts()
  
  }


  render() {

    return (
      <>
        <div className={styles.contentBox}>

         <div className={styles.title}    >设施设备情况</div>
          <div className={styles.eventEcharts} id="planEcharts"></div>



        </div>
        <div className={styles.contentBox}>
        <div className={styles.title}    >空气质量(AQI)</div>
        <div className={styles.eventEcharts} id="weatherEcharts"></div>


        </div>

        <div className={styles.contentBox}>
        <div className={styles.title}    >突发事件统计(AQI)</div>
        <div className={styles.eventEcharts} id="EmergencyEcharts"></div>


        </div>



      </>
    );
  }
}

export default ContentBox;
