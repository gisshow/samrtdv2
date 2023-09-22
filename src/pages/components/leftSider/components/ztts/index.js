import React, { Component } from 'react'
import ModuleTitle from '@/components/moduleTitle'
import styles from './styles.less';

class ContentBox extends Component {


  eventEcharts() {
    var t = window.echarts.init(document.getElementById("eventEcharts"));
    var e = {
      grid: {
        top: "10%",
        left: "5%",
        right: "5%",
        bottom: "4%",
        containLabel: !0
      },
      tooltip:
      {
        trigger: "axis"
      },
      xAxis: {
        type: "category",
        data: ["8-20", "8-21", "8-22", "8-23", "8-24", "8-25", "8-26", "8-27", "8-28", "8-29", "8-30"],
        axisLine: {
          show: !1,
          lineStyle: { color: "rgba(255,255,255,0.7)" }
        },
        splitLine: {
          lineStyle: { color: "#167174" }
        },
        axisTick: {
          show: !1
        },
        axisLabel: {
          rotate: -60
        }
      },
      yAxis: {
        type: "value",
        min: 0,
        scale: !0,
        axisLine:
        {
          show: !0,
          lineStyle: { color: "#167174" }
        },
        axisLabel:
        {
          show: !0,
          textStyle: {
            color: "rgba(255,255,255,0.7)"
          }
        },
        splitLine: {
          lineStyle:
            { color: "#167174" }
        },
        axisTick:
        {
          show: !1
        }
      },
      series:
        [{
          data: [2, 5, 10, 10, 5, 8, 30, 20, 6, 8, 10],
          type: "line",
          symbolSize: 8,
          lineStyle: {
            color: {
              type: "linear",
              x: 0,
              y: 0,
              x2: 1,
              y2: 1,
              colorStops: [
                { offset: .2, color: "rgba(255, 198, 132, 0.2)" },
                { offset: .5, color: "rgba(255, 187, 3, 1)" },
                { offset: .8, color: "rgba(246, 198, 87, 0.18)" }
              ]
            }
          },
          itemStyle:
          {
            normal: {
              borderWidth: 3,
              borderColor: "#FF6803",
              color: "#FF6803",
              symbol: "none"
            },
            emphasis: {
              showSymbol: !0
            }
          }
        },
        {
          data: [0, 5, 10, 15, 20, 30, 9, 6, 8, 9, 10],
          type: "line",
          symbolSize: 8,
          lineStyle:
          {
            color:
            {
              type: "linear",
              x: 0,
              y: 0,
              x2: 1,
              y2: 1,
              colorStops: [
                {
                  offset: .2,
                  color: "rgba(132, 167, 255, 0.2)"
                },
                { offset: .5, color: "rgba(3, 255, 238, 1)" }, { offset: .8, color: "rgba(87, 131, 246, 0.18)" }]
            }
          }, itemStyle: { normal: { borderWidth: 3, borderColor: "#00A987", color: "#00A987", symbol: "none" }, emphasis: { showSymbol: !0 } }
        }]
    };
    t.setOption(e);
    window.addEventListener("resize", (function () { t.resize() }), !1)
  }

  peopleEcharts() {
    var t = 50;
    var e = 38;
    var a = 65;
    var i = 55;
    var s = {
      tooltip: {
        trigger: "item",
        formatter: "{b}  {c}%"
      },
      legend: [
        {
          x: "center",
          bottom: "7%",
          data: [
            {
              name: "文字占位 1"
            },
            {
              name: "文字占位 2"
            },
            {
              name: "文字占位 3"
            }
          ],
          left: "center",
          itemGap: 6,
          icon: "circle",
          itemWidth: 6,
          itemHeight: 6,
          textStyle: {
            color: "#fff",
            fontSize: 12,
            padding: [5, 0, 2, 0],
            rich: {
              a: {
                verticalAlign: "middle"
              }
            }
          }
        }
      ],
      series: [
        {
          type: "pie",
          radius: ["30%", "37%"],
          center: ["50%", "42%"],
          startAngle: -150,
          data: [{
            hoverOffset: 1,
            value: t,
            name: "文字占位 1",
            itemStyle: {
              color: "#43DFB3"
            },
            label: {
              show: !1
            },
            labelLine: {
              normal: {
                smooth: !0,
                lineStyle: {
                  width: 0
                }
              }
            },
            hoverAnimation: !1
          },
          {
            label: {
              show: !1
            },
            labelLine: {
              normal: {
                smooth: !0,
                lineStyle: {
                  width: 0
                }
              }
            },
            value: 100 - t,
            hoverAnimation: !1,
            itemStyle: {
              color: "#103658"
            }
          }]
        },

        {
          type: "pie",
          radius: ["44%", "51%"],
          center: ["50%", "42%"],
          startAngle: -70,
          data: [{
            hoverOffset: 1,
            value: e,
            name: "文字占位 2",
            itemStyle: {
              color: "#0AACD5"
            },
            label: {
              show: !1
            },
            labelLine: {
              normal: {
                smooth: !0,
                lineStyle: {
                  width: 0
                }
              }
            },
            hoverAnimation: !1
          },
          {
            label: {
              show: !1
            },
            labelLine: {
              normal: {
                smooth: !0,
                lineStyle: {
                  width: 0
                }
              }
            },
            value: 100 - e,
            hoverAnimation: !1,
            itemStyle: {
              color: "#103658"
            }
          }]
        },
        {
          type: "pie",
          radius: ["58%", "65%"],
          center: ["50%", "42%"],
          startAngle: 50,
          data: [{
            hoverOffset: 1,
            value: i,
            name: "文字占位 3",
            itemStyle: {
              color: "#BE7F2C"
            },
            label: {
              show: !1
            },
            labelLine: {
              normal: {
                smooth: !0,
                lineStyle: {
                  width: 0
                }
              }
            },
            hoverAnimation: !1
          },
          {
            label: {
              show: !1
            },
            labelLine: {
              normal: {
                smooth: !0,
                lineStyle: {
                  width: 0
                }
              }
            },
            value: 100 - a,
            hoverAnimation: !1,
            itemStyle: {
              color: "#103658"
            }
          }]
        },
        {
          type: "pie",
          radius: ["30%", "37%"],
          center: ["50%", "42%"],
          startAngle: -150,
          name: "",
          silent: !0,
          z: 1,
          hoverAnimation: !1,
          label: {
            show: !1
          },
          itemStyle: {
            borderCap: "round",
            borderJoin: "round"
          },
          data: [{
            value: 7.5,
            itemStyle: {
              color: "#d0276c10"
            }
          }]
        },
        {
          type: "pie",
          radius: ["44%", "51%"],
          center: ["50%", "42%"],
          startAngle: -70,
          name: "",
          silent: !0,
          z: 1,
          hoverAnimation: !1,
          label: {
            show: !1
          },
          itemStyle: {
            borderCap: "round",
            borderJoin: "round"
          },
          data: [{
            value: 7.5,
            itemStyle: {
              color: "#4e2e9b10"
            }
          }]
        },
        {
          type: "pie",
          radius: ["58%", "65%"],
          center: ["50%", "42%"],
          startAngle: 50,
          name: "",
          silent: !0,
          z: 1,
          hoverAnimation: !1,
          label: {
            show: !1
          },

          itemStyle: {
            borderCap: "round",
            borderJoin: "round"
          },
          data: [{
            value: 7.5,
            itemStyle: {
              color: "#61c8f110"
            }
          }]
        }]
    };
    var n = window.echarts.init(document.getElementById("peopleEcharts"));
    n.setOption(s);
    window.addEventListener("resize", (function () {
      n.resize()
    }), !1)
  }

  peopleBarEcharts() {


    var t;
    var e = this;

    var a = {
      tooltip: {
        trigger: "item",
        formatter: "{a} <br/>{b} : {c} ({d}%)"
      },
      legend: {
        x: "center",
        bottom: "12%",
        orient: "horizontal",
        icon: "circle",
        itemWidth: 6,
        itemHeight: 6,
        textStyle: {
          color: "#fff",
          fontSize: 12
        }
      },

      series: [
        {
          name: "社区总人数统计",
          center: ["50%", "42%"],
          type: "pie",
          radius: [20, 65],
          roseType: "radius",
          itemStyle: {
            normal: {
              color: function (t) {
                var a = [{
                  colorStart: "#5EFFD2",
                  colorEnd: "#008E65"
                },
                {
                  colorStart: "#901FD7",
                  colorEnd: "#D5B2FF"
                },
                {
                  colorStart: "#FFD04E",
                  colorEnd: "#FFE256"
                },
                {
                  colorStart: "#15EFE6",
                  colorEnd: "#60BBFF"
                }];
                return new window.echarts.graphic.LinearGradient(1, 0, 0, 0, [{
                  offset: 0,
                  color: a[t.dataIndex]["colorStart"]
                },
                {
                  offset: 1,
                  color: a[t.dataIndex]["colorEnd"]
                }])
              }
            },
            borderRadius: 5
          },
          label: {
            show: !1,
            color: "#fff",
            formatter: "{d}%",
            position: "inside"
          },
          emphasis: {
            label: {
              show: !0
            }
          },
          labelLine: {
            smooth: .2,
            length: 0,
            length2: 10,
            maxSurfaceAngle: 80
          },
          data: [
            {
              value: 20,
              name: "文字占位 1"
            },
            {
              value: 15,
              name: "文字占位 2"
            },
            {
              value: 28,
              name: "文字占位 3"
            },
            {
              value: 30,
              name: "文字占位 4"
            }

          ],
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          }
        }
      ]
    };


    var i = window.echarts.init(document.getElementById("peopleBarEcharts"));
    i.setOption(a);
    window.addEventListener("resize", (function () {
      i.resize()
    }), !1)
  }


  carEcharts ()
  {
    var t = this;
    var e =  window.echarts.init(document.getElementById("carEcharts"));

    var a =  window.echarts.graphic.extendShape({
      shape: {
        x: 0,
        y: 0
      },
      buildPath: function(t, e) {
        var a = e.xAxisPoint,
        i = [e.x, e.y],
        s = [e.x - 13, e.y - 13],
        n = [a[0] - 13, a[1] - 13],
        o = [a[0], a[1]];
        t.moveTo(i[0], i[1]).lineTo(s[0], s[1]).lineTo(n[0], n[1]).lineTo(o[0], o[1]).closePath()
      }
    });
    console.log(window.echarts)
    console.log(window.echarts.extendShape)
    var  i = window.echarts.graphic.extendShape({
      shape: {
        x: 0,
        y: 0
      },
      buildPath: function(t, e) {
        var a = e.xAxisPoint,
        i = [e.x, e.y],
        s = [a[0], a[1]],
        n = [a[0] + 18, a[1] - 9],
        o = [e.x + 18, e.y - 9];
        t.moveTo(i[0], i[1]).lineTo(s[0], s[1]).lineTo(n[0], n[1]).lineTo(o[0], o[1]).closePath()
      }
    });

    var  s = window.echarts.graphic.extendShape({
      shape: {
        x: 0,
        y: 0
      },
      buildPath: function(t, e) {
        var a = [e.x, e.y],
        i = [e.x + 18, e.y - 9],
        s = [e.x + 5, e.y - 22],
        n = [e.x - 13, e.y - 13];
        t.moveTo(a[0], a[1]).lineTo(i[0], i[1]).lineTo(s[0], s[1]).lineTo(n[0], n[1]).closePath()
      }
    });


     window.echarts.graphic.registerShape("CubeLeft", a);
     window.echarts.graphic.registerShape("CubeRight", i);
     window.echarts.graphic.registerShape("CubeTop", s);


    var n = [25, 25, 25, 25, 25, 25, 25] ;
    var o = [5, 6, 15, 5, 20, 12, 15] ;
    var r = {
      tooltip: {
        trigger: "axis",
        axisPointer: {
          type: "shadow"
        },
        formatter: function(t, e, a) {
          var i = t[1];
          return i.name + " : " + i.value
        }
      },
      grid: {
        top: "20%",
        left: "8%",
        right: "8%",
        bottom: "0%",
        containLabel: !0
      },
      xAxis: {
        type: "category",
        data: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"],
        axisLine: {
          show: !1,
          lineStyle: {
            color: "rgba(255,255,255,0.7)"
          }
        },
        axisTick: {
          show: !1,
          length: 9,
          alignWithLabel: !0,
          lineStyle: {
            color: "#7DFFFD"
          }
        },
        axisLabel: {
          show: !0,
          fontSize: 16
        }
      },
      yAxis: {
        min: 0,
        max: 25,
        interval: 5,
        type: "value",
        axisLine: {
          show: !1,
          lineStyle: {
            color: "rgba(255,255,255,0.7)"
          }
        },
        splitLine: {
          show: !0,
          lineStyle: {
            color: "rgba(17, 65, 67, 0.2)"
          }
        },
        axisTick: {
          show: !1
        },
        axisLabel: {
          show: !0,
          fontSize: 16
        },
        boundaryGap: ["20%", "20%"]
      },
      series: [{
        type: "custom",
        renderItem: function(t, e) {
          var a = e.coord([e.value(0), e.value(1)]);
          return {
            type: "group",
            children: [{
              type: "CubeLeft",
              shape: {
                api: e,
                x: a[0],
                y: a[1],
                xAxisPoint: e.coord([e.value(0), 0])
              },
              style: {
                fill: "rgba(0,201,213,0.4)"
              }
            },
            {
              type: "CubeRight",
              shape: {
                api: e,
                x: a[0],
                y: a[1],
                xAxisPoint: e.coord([e.value(0), 0])
              },
              style: {
                fill: "rgba(0,149,253,0.22)"
              }
            },
            {
              type: "CubeTop",
              shape: {
                api: e,
                x: a[0],
                y: a[1],
                xAxisPoint: e.coord([e.value(0), 0])
              },
              style: {
                fill: "rgba(5, 172, 164, 0.8)"
              }
            }]
          }
        },
        data: n
      },
      {
        type: "custom",
        renderItem: function(e, a) {
          var i = a.coord([a.value(0), a.value(1)]),
          s = a.value(1) > 800 ? "red": new  window.echarts.graphic.LinearGradient(0, 0, 0, 1, [{
            offset: 0,
            color: "rgba(0, 209, 197, 1)"
          },
          {
            offset: 1,
            color: "rgba(0,54,44,0.3)"
          }]);
          return {
            type: "group",
            children: [{
              type: "CubeLeft",
              shape: {
                api: a,
                xValue: a.value(0),
                yValue: a.value(1),
                x: i[0],
                y: i[1],
                xAxisPoint: a.coord([a.value(0), 0])
              },
              style: {
                fill: s
              }
            },
            {
              type: "CubeRight",
              shape: {
                api: a,
                xValue: a.value(0),
                yValue: a.value(1),
                x: i[0],
                y: i[1],
                xAxisPoint: a.coord([a.value(0), 0])
              },
              style: {
                fill: s
              }
            },
            {
              type: "CubeTop",
              shape: {
                api: a,
                xValue: a.value(0),
                yValue: a.value(1),
                x: i[0],
                y: i[1],
                xAxisPoint: a.coord([a.value(0), 0])
              },
              style: {
                fill: s
              }
            }]
          }
        },
        data: o
      },
      {
        type: "bar",
        itemStyle: {
          color: "transparent"
        },
        tooltip: {},
        data: n
      }]
    };
    e.setOption(r);
    window.addEventListener("resize", (function() {
      e.resize()
    }), !1)



  }
  






  componentDidMount() {
    this.eventEcharts()
    this.peopleEcharts()
    this.peopleBarEcharts()
    this.carEcharts()
  }

  render() {

    return (
      <>
        <div className={styles.contentBox}  >

          <div className={styles.title}    >安防事件统计</div>
          <div className={styles.eventEcharts} id="eventEcharts"></div>

        </div>
        <div className={styles.contentBox}>

          <div className={styles.title}    >社区总人数统计</div>
          <div className={styles.peopleBox} >
            <div className={styles.peopleEcharts} id="peopleEcharts"></div>
            <div className={styles.peopleBarEcharts} id="peopleBarEcharts"></div>
          </div>
        </div>


        <div className={styles.contentBox}>

          <div className={styles.title}    >社会车辆统计</div>
          <div className={styles.carEcharts} id="carEcharts"></div>
        </div>



      </>
    );
  }
}

export default ContentBox;
