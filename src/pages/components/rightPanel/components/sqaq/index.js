import React, { Component } from 'react'
import ModuleTitle from '@/components/moduleTitle'
import styles from './styles.less';

class ContentBox extends Component {


  ua (t, e, a, i, s) {
    var n = [],
    o = 0,
    r = 0,
    l = 0,
    c = [],
    d = [],
    u = 1 - e;
    t.sort((function(t, e) {
      return e.value - t.value
    }));

    for (var m = 0; m < t.length; m++) {

      o += t[m].value;
      var A = {
        name: "undefined" === typeof t[m].name ? "series".concat(m) : t[m].name,
        type: "surface",
        parametric: !0,
        wireframe: {
          show: !1
        },
        pieData: t[m],
        pieStatus: {
          selected: !1,
          hovered: !1,
          k: u
        },
        center: ["10%", "50%"],
        itemStyle: {
          color: t[m].label.colorEnd
        }
      };
      n.push(A)
    };
     c = [];
      d = [];
    for (var v = 0; v < n.length; v++)
     {
      l = r + n[v].pieData.value;
      n[v].pieData.startRatio = r / o;
      n[v].pieData.endRatio = l / o;
      n[v].parametricEquation = this.ma(n[v].pieData.startRatio, n[v].pieData.endRatio, !1, !1, u, n[v].pieData.value);
      r = l;
      var h = this.va(n[v].pieData.value / o, 4);
      c.push({
        name: n[v].name,
        value: h
      });
      d.push({
        name: n[v].name,
        value: h
      })
    }

    var p = this.Aa(n, s);
    let f = {
      legend: {
        show: !0,
        data: c,
        orient: "horizontal",
        left: "top",
        top: 0,
        textStyle: {
          color: "white"
        },
        icon: "circle"
      },
      labelLine: {
        show: !0,
        lineStyle: {
          color: "#fff"
        }
      },
      label: {
        show: !0,
        position: "outside",
        formatter: "{b} \n {d}%",
        color: "#fff"
      },
      tooltip: {
        backgroundColor: "#033b77",
        borderColor: "#21f2c4",
        textStyle: {
          color: "#fff",
          fontSize: 13
        },
        formatter: function(t) {
          var e, a, i = (100 * ((null === (e = f.series[t.seriesIndex].pieData) || void 0 === e ? void 0 : e.endRatio) - (null === (a = f.series[t.seriesIndex].pieData) || void 0 === a ? void 0 : a.startRatio))).toFixed(0);
          return "".concat(t.name || t.seriesName, "<br/>") + '<span style="display:inline-block;margin-right:5px;border-radius:10px;width:10px;height:10px;background-color:'.concat(t.color, ';"></span>') + "".concat(t.percent || i, "%")
        }
      },
      xAxis3D: {
        min: -1,
        max: 1
      },
      yAxis3D: {
        min: -1,
        max: 1
      },
      zAxis3D: {
        min: -1,
        max: 1
      },
      grid3D: {
        show: !1,
        boxHeight: p,
        viewControl: {
          alpha: i,
          distance: a,
          rotateSensitivity: 0,
          zoomSensitivity: 0,
          panSensitivity: 0,
          autoRotate: !1
        }
      },
      series: n
    };
    return f
  }


  ma (t, e, a, i, s, n) {
    var o = (t + e) / 2,
    r = t * Math.PI * 2,
    l = e * Math.PI * 2,
    c = o * Math.PI * 2;
    0 === t && 1 === e && (a = !1);
    s = "undefined" !== typeof s ? s: 1 / 3;
    var d = a ? .1 * Math.cos(c) : 0,
    u = a ? .1 * Math.sin(c) : 0,
    m = i ? 1.05 : 1;
    return {
      u: {
        min: -Math.PI,
        max: 3 * Math.PI,
        step: Math.PI / 32
      },
      v: {
        min: 0,
        max: 2 * Math.PI,
        step: Math.PI / 20
      },
      x: function(t, e) {
        return t < r ? d + Math.cos(r) * (1 + Math.cos(e) * s) * m: t > l ? d + Math.cos(l) * (1 + Math.cos(e) * s) * m: d + Math.cos(t) * (1 + Math.cos(e) * s) * m
      },
      y: function(t, e) {
        return t < r ? u + Math.sin(r) * (1 + Math.cos(e) * s) * m: t > l ? u + Math.sin(l) * (1 + Math.cos(e) * s) * m: u + Math.sin(t) * (1 + Math.cos(e) * s) * m
      },
      z: function(t, e) {
        return t < .5 * -Math.PI ? Math.sin(t) : t > 2.5 * Math.PI ? Math.sin(t) * n * .1 : Math.sin(e) > 0 ? 1 * n * .1 : -1
      }
    }
  }

  Aa (t, e) {
    return t.sort((function(t, e) {
      return e.pieData.value - t.pieData.value
    })),
    25 * e / t[0].pieData.value
  }

  va (t, e) {
    var a = parseFloat(t);
    if (isNaN(a)) return ! 1;
    a = Math.round(t * Math.pow(10, e)) / Math.pow(10, e);
    var i = a.toString(),
    s = i.indexOf(".");
   // s < 0 && (s = i.length, i += ".");
    if(s < 0 )
    {
      s = i.length;
      i += ".";
    }
    while (i.length <= s + e) i += "0";
    return i
  }
  



  


  onlineEcharts () {
    var t =  window.echarts.init(document.getElementById("onlineEcharts")),
    e = [{
      value: 30,
      name: "在线",
      label: {
        colorStart: "#52D5CB",
        colorEnd: "#027E99",
        color: "#fff"
      }
    },
    {
      value: 70,
      name: "离线",
      label: {
        colorStart: "#00A8FF",
        colorEnd: "#8FDFFE"
      }
    }],
   
  


   a = this.ua(e, 0, 240, 28, 25, .5);
   t.setOption(a);
   console.log(a)

    a.series.push({
      backgroundColor: "transparent",
      type: "pie",
      label: {
        opacity: 1,
        fontSize: 14,
        lineHeight: 22,
        padding: [0, -35]
      },
      labelLine: {
        normal: {
          smooth: .1,
          length: 20,
          length2: 40
        }
      },
      startAngle: -90,
      clockwise: !1,
      radius: ["20%", "50%"],
      center: ["50%", "50%"],
      data: e,
      itemStyle: {
        opacity: 0
      }
    });

    t.setOption(a, a);
    window.addEventListener("resize", (function() {
      t.resize()
    }), !1)
  }

  
  

  todayEcharts()
    {
    var t = window.echarts.init(document.getElementById("todayEcharts")),
    e = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADQAAAF+CAYAAADNzDlVAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAilJREFUeNrs1rENwjAURdEfC0pmQAwBDfuwE8wDDSULIGagTGEcFNHQpfPXseT0V0ryzrA/XzcRsWt3HX2fsd1XSRITc8O2JIn5RZVIdsr87mU54xT0TBL1/Sms2uPd7qPXivvp+PfKpfuGBAkStPxMf7muLXe43FiO5ViO5VjOsAoSxHIsx3Isx3Isx3KGVZAglmM5lmM5lmM5liMFQYJYjuVYjuVYjuVYTpAgQSzHcizHcizHcoZVkCCWYzmWYzmWYzmWM6yCBLEcy7Ecy7Ecy7GcIEGCWI7lWI7lWI7lDKsgQYJYjuVYjuVYjuUMqyBBLMdyLMdyLMdyLGdYBQliOZZjOZZjOZZjOUGCBLEcy7Ecy7EcyxlWQYJYjuVYjuVYjuVYzrAKEsRyLMdyLMdyLMdypCBIEMuxHMuxHMuxnGEVJEgQy7Ecy7Ecy7GcYRUkiOVYjuVYjuVYjuUMqyBBLMdyLMdyLMdyLCdIkCCWYzmWYzmWYznDKkgQy7Ecy7Ecy7EcyxlWQYJYjuVYjuVYjuVYjhQECWI5lmM5lmM5ljOsggQJYjmWYzmWYzmWM6yCBLEcy7Ecy7Ecy7GcYRUkiOVYjuVYjuVYjuUECRLEcizHcizHcixnWAUJYjmWYzmWYzmWYznDKkgQy7Ecy7Ecy7Ecy5GCIEEsx3Isx3Isx3IsJ0iQIJZjOZZjOZZjOcMqSBDLsRzLsRzL9Wy5odZqhwQJWn4+AgwApGqd0LftHcgAAAAASUVORK5CYII=",
    a = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADQAAAF+CAYAAADNzDlVAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAABFhJREFUeNrs3U+O1DgUgHHblUFzhb7GCCHNtnfMFUasOA9HYEWfAQlpZq6AEOIIdPcFZgMVe5L6Q6pLzQjFLZK2fpZSKbVioQ8n9b68+Dnxz39fXYYYrkIIF+Fxt5the5kagQkHhtepEZhvUCk01tLh3Gul3aZQwovxSwMwn8cfhW74+Lul66jJawgQIEB1QJfDdj1s5ZFvI8NzLsfluByX43KAlmzjKRdyTkYIEJeb6XK5JC7H5bhchculmLmcOASoAqjPGyMEiMtVuFyMhctxOS5X4XKlRC4nDgECBIjLLeVyXSnpqhQux+W43FyXi/Jy4hCgKqC+74wQIC5XkZdLKcvLcTkuV+FyOScuJw4Bmt/MlwPE5WprH4LaBy7H5WpcbvjgcuIQIECAuByXe0iXy4eJtOONXilx2NJh238PIYbpmPP9qvpc7O5YU+r351/KB9hyAl7C3WPO9+vqs3O5hkZocrn9H+PJwdP3Y87h/n9sNX24HKBFgLaesQLiclUul9Q+yMvJy1Xl5bLaB3EIUE3biVzvGSsgLjfb5Yb7ci7H5bhchcvFWLicOAQIECAux+W43P1QXcmpuWuotbyc2gdxCFBF29c+FHk5QFzOfDl5OS63jMsFtQ/iECBAgLgcl+Ny34PqcoMrot+cFkzEWIbtuN9/H0/R/yuyWFGf2zR8vBiLIHa5hTsFE3FGkcWifT4Pey63fqDt9hemsOYWSylGaM2t++P6zWUjS7KNuZGX1pdbO5S83Mqb9eXEIUC1gfV4r2GEAP08IHk5LsfluNzkcsEzVnEIULXLFS4HiMvNdrnh+uFyXI7LVbhcTN7hJQ4BqnU5eTlAXG6+y/XbjstxOS5X4XJ93nA5cQhQrcupYwXE5Wa7XLRWMJfjclUuV6wVLA4BAgSIyy3ncl0p6aoULsfluNxcl4vRM1ZxCBAgQFxuybWC25ov1+Wc2nK543tOj/tpeYxpOz9mzX3GERpd7uI4PWZcGuO8Hf82vSr07n5FfW7TZrPlcuIQoAqgL19+NUKAuFyFyw1xyDPWVbtci9dQY/Pl+o7LiUOA5rdD7cPGCAHicubLcTkut4jLmS8nDgF6CJdT+wCIy3kfK5fjcsu43HA/xOXEIUCVLnffhAYjBIjL/ZjLZevLcTkuV+Vyyfpy4hCgKqCvX58YIUBcbr7Lxd8/vb1u6Gf7hstxuZ/tcp6xikOAAAHicubLPYz2BHk5LsfluJzA+tja7hlrr/YBEJeb63Lx2cd38nJcjstVuFyyvpw4BAgQIC7H5bgcl3u0Lpd77/AShwBVNGuSAOJylS739MNf7blcSv1+uFI+LFmbT5avzbv/gOmY8/2q+lzc+ZWbqvZPK76OS9duvrNfV5/2XG4YMS4nDgECBIjLcbmHdLmGzjh5OS7H5cShxoGsLweIy1W63G/v/+FyXI7LVbic+XLiECBAgLgcl+NyXI7LrcXlYilFHAIEaH77T4ABAKzsRPWz+TQ7AAAAAElFTkSuQmCCgg",
    i = [{
      name: "8-20",
      value: 2691
    },
    {
      name: "8-21",
      value: 5e3
    },
    {
      name: "8-22",
      value: 3416
    },
    {
      name: "8-23",
      value: 4666
    },
    {
      name: "8-24",
      value: 4666
    },
    {
      name: "8-25",
      value: 4666
    },
    {
      name: "8-26",
      value: 4666
    },
    {
      name: "8-27",
      value: 4666
    },
    {
      name: "8-28",
      value: 4666
    },
    {
      name: "8-29",
      value: 4666
    },
    {
      name: "8-30",
      value: 2e3
    }],
    s = [],
    n = [];
    i.forEach((function(t, e) {
      n.push(t.value)
    }));

    i.forEach((function(t, e) {
      s.push({
        name: t.name,
        value: Math.max.apply(null, n)
      })
    }));
    var o = Math.max.apply(null, n),
    r = 1,
    l = {
      tooltip: {
        formatter: "{b} : {c}"
      },
      grid: {
        left: "5%",
        right: "5%",
        top: "1%",
        bottom: "20%",
        containLabel: !0
      },

      xAxis: [{
        type: "category",
        data: function(t) {
          var e = [];
          return t.forEach((function(t) {
            e.push(t.name)
          })),
          e
        } (i),
        boundaryGap: ["20%", "20%"],
        splitLine: {
          show: !1
        },
        axisLine: {
          show: !1
        },
        axisTick: {
          show: !1
        },
        axisLabel: {
          textStyle: {
            fontSize: 16 * r,
            color: "#3fdaff"
          }
        }
      },
      "axisLabel", {
        rotate: -60,
        textStyle: {
          color: "rgba(255,255,255,0.7)",
          fontSize: 14 * r
        }
      }],


      yAxis: [{
        type: "value",
        splitLine: {
          show: !1
        },
        axisLine: {
          show: !1
        },
        axisTick: {
          show: !0,
          inside: !0,
          length: 10 * r,
          lineStyle: {
            color: "#0b5263"
          }
        },
        axisLabel: {
          show: !0,
          textStyle: {
            color: "rgba(255,255,255,0.7)",
            fontSize: 14 * r
          }
        }
      },
      "axisTick", {
        show: !1
      }],
      series: [{
        name: "bg",
        type: "pictorialBar",
        barWidth: "20",
        silent: !0,
        symbol: "image://" + e,
        symbolClip: !1,
        symbolBoundingData: o,
        symbolSize: [20, "100%"],
        data: s
      },
      {
        name: "数据",
        type: "pictorialBar",
        barWidth: "20",
        barGap: "-100%",
        data: i,
        z: 3,
        symbol: "image://" + a,
        symbolClip: !0,
        symbolBoundingData: o,
        symbolSize: [20, "100%"]
      }]
    };
    t.setOption(l);
    window.addEventListener("resize", (function() {
      t.resize()
    }), !1)
  }

  


  realEcharts()
  {

    var t = window.echarts.init(document.getElementById("realEcharts")),
    e = {
      grid: {
        top: "1%",
        left: "5%",
        right: "10%",
        bottom: "20%",
        containLabel: !0
      },
      tooltip: {
        trigger: "axis"
      },
      xAxis: {
        type: "category",
        data: ["8-20", "8-21", "8-22", "8-23", "8-24", "8-25", "8-26", "8-27", "8-28", "8-29", "8-30"],
        axisLine: {
          show: !1,
          lineStyle: {
            color: "rgba(255,255,255,0.7)"
          }
        },
        splitLine: {
          lineStyle: {
            color: "#167174"
          }
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
        max: 1e6,
        data: [0, 1e5, 3e5, 6e5, 8e5, 1e6],
        scale: !0,
        axisLine: {
          show: !0,
          lineStyle: {
            color: "#167174"
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
            color: "#167174"
          }
        },
        axisTick: {
          show: !1
        }
      },
      series: [{
        data: [1e5, 1e5, 2e5, 300200, 8e5, 600400, 600400, 600400, 600400, 600400, 600400],
        type: "line",
        symbolSize: 8,
        lineStyle: {
          color: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 1,
            y2: 1,
            colorStops: [{
              offset: .2,
              color: "rgba(255, 198, 132, 0.2)"
            },
            {
              offset: .5,
              color: "rgba(255, 187, 3, 1)"
            },
            {
              offset: .8,
              color: "rgba(246, 198, 87, 0.18)"
            }]
          }
        },
        itemStyle: {
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
      }]
    };
    t.setOption(e);
    window.addEventListener("resize", (function() {
      t.resize()
    }), !1)
  }

  


  componentDidMount() {

    this.onlineEcharts()
    this.todayEcharts()
    this.realEcharts()

  }

  render() {

    return (
      <>
        <div className={styles.contentBox}  >

          <div className={styles.title}    >设施设备情况</div>

          <div className={styles.deviceBox}  >
          
            <div className={styles.deviceNum}>
              <div className={styles.deviceNumTitle}    >单位：个</div>
              <div className={styles.deviceNumType}     >
                <div className={styles.num}    >8</div>
                <div className={styles.deviceNumTypeTitle}   >配电站数量</div>
              </div>

              <div className={styles.deviceNumType}    >
                <div className={styles.num}    >20</div>
                <div className={styles.deviceNumTypeTitle}   >变电站数量</div>
              </div>

            </div>

            <div className={styles.onlineEcharts} id="onlineEcharts"></div>


          </div>

       

        </div>
        <div className={styles.contentBox}>

          <div className={styles.title}    >当日用电备情况</div>
          <div className={styles.todayElectricity} >
            <div className={styles.total}>
            <img   src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABcAAAAYCAYAAAARfGZ1AAAAAXNSR0IArs4c6QAAA8pJREFUSEu9lV1MHFUUx885c2dmZ5dllxYKVKRU26IEmn6ggdhatSGxhtZKbLS1VmMkMTHRF01MExNeTXzwwahJk/oVqQ2ahsYHE1IlRuhDm6oboVBW2mZhIbQV6e7M7szO3GOWBaQypNiknqebe879nTP3/s8ZhLtoeBfZ8P/BtXT350hwGBjoP38RQgaRXssae7+YP3tL5brZ7SFABwM8DIhngGH4dkmY+QUkSALAJmAQdujp1uXgvEpUHjW9maZiKuupVGqGbgcfcS+8qEMgmUWrNutZhh3at2dZeBFFjmTB2m3I8DeOyBU7ntmx2djVnIRLa69bye+j6ur91WrDaCz7048B0D+w2anVQRtzOLdFolyfDbY+sSxcE0ZbzrX3CNK/cjhbjgzH7NC+SCBzqoYlXWbp1Tnhtou62T2JjO9I5HWC1ISUXiMgPrBieLW3ZVjoTl1MrfqhmRNGyqUdJJT+GFaYDTyxS4AYGbD621cE166dSuugHnLRaxGknawr2TniufzgeTXc25xIGG5F+BFbZM/m4Q/lph91HTc+kOl7WQVlzAW5TUHaZK3e+5TvtQQufzuuCePVnHQe91ynDQAkzLYCz8UvWiMCMAMiqUJoR6UnNyPCBqtm/wF/eKzrdyk9C5EEg5djyR4wF+RKeBEQYgC0EaSsBwA1v41EOsh8ZxAJEr9aDW2v+MKN/q9/9rxciohURCUwG4TISDh9X23jh4FQ1JxKxtdfm7jSDsyFRkMAmXNNIBBC0QbMpgNv+sN7TnT/W9ekUPaejfWflVRVX72eSNDE0G9vMULJEv0TgAIUS+9+7l1fePB05/H5lp2/5eLSst6a5qZzASga6T193AhqRTsVoh3SdiqWFEI0mGo9+L4vPHSy8z1geeswY5ZO2hzEbO6XNdu3x9duq7/3z0tDlZND8RaWUltIgMSkYDz17MFjvvDwp1++Pe+QSLPFuykzbVsZE4g5umHdd8FApHx6PNEiFDIKD104IfO6UtQr6SPPd/nDP+p8CZSl00TajisJRzM3Z+JguVt1XQ2IVdEoibwe/zEiSs60H+rxhRd/0vnkQqhXWIm5ZEZ5ZHLq7LDGCirBqtKIggXwXBgAEauevHHj9cPnfOFlH5/YClIpvKVHharyapaSvUzaMcczjlEdLVKVvG9W5ossBwiBm1NvPPOHL/z+vr413l+O749i+mrSLimN6hAKLr23uR0qD2dGGxtnfOGPMRcaZ5HZMIY6VM0rc1lw3jEFIAcRHV94BzMNFIbJHVlXfhYhLhRyx6CVZP8bNZWUKIarg0QAAAAASUVORK5CYII=" alt="" />
            总额定容量:
            <span> 238762.22 kV/A</span>
            </div>

            <div className={styles.todayEcharts} id="todayEcharts"></div>
          
          </div>
        </div>


        <div className={styles.contentBox}>

          <div className={styles.title}    >实时用电情况</div>
          <div className={styles.content} >
          <div className={styles.total}>
           <img   src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABcAAAAYCAYAAAARfGZ1AAAAAXNSR0IArs4c6QAAA8pJREFUSEu9lV1MHFUUx885c2dmZ5dllxYKVKRU26IEmn6ggdhatSGxhtZKbLS1VmMkMTHRF01MExNeTXzwwahJk/oVqQ2ahsYHE1IlRuhDm6oboVBW2mZhIbQV6e7M7szO3GOWBaQypNiknqebe879nTP3/s8ZhLtoeBfZ8P/BtXT350hwGBjoP38RQgaRXssae7+YP3tL5brZ7SFABwM8DIhngGH4dkmY+QUkSALAJmAQdujp1uXgvEpUHjW9maZiKuupVGqGbgcfcS+8qEMgmUWrNutZhh3at2dZeBFFjmTB2m3I8DeOyBU7ntmx2djVnIRLa69bye+j6ur91WrDaCz7048B0D+w2anVQRtzOLdFolyfDbY+sSxcE0ZbzrX3CNK/cjhbjgzH7NC+SCBzqoYlXWbp1Tnhtou62T2JjO9I5HWC1ISUXiMgPrBieLW3ZVjoTl1MrfqhmRNGyqUdJJT+GFaYDTyxS4AYGbD621cE166dSuugHnLRaxGknawr2TniufzgeTXc25xIGG5F+BFbZM/m4Q/lph91HTc+kOl7WQVlzAW5TUHaZK3e+5TvtQQufzuuCePVnHQe91ynDQAkzLYCz8UvWiMCMAMiqUJoR6UnNyPCBqtm/wF/eKzrdyk9C5EEg5djyR4wF+RKeBEQYgC0EaSsBwA1v41EOsh8ZxAJEr9aDW2v+MKN/q9/9rxciohURCUwG4TISDh9X23jh4FQ1JxKxtdfm7jSDsyFRkMAmXNNIBBC0QbMpgNv+sN7TnT/W9ekUPaejfWflVRVX72eSNDE0G9vMULJEv0TgAIUS+9+7l1fePB05/H5lp2/5eLSst6a5qZzASga6T193AhqRTsVoh3SdiqWFEI0mGo9+L4vPHSy8z1geeswY5ZO2hzEbO6XNdu3x9duq7/3z0tDlZND8RaWUltIgMSkYDz17MFjvvDwp1++Pe+QSLPFuykzbVsZE4g5umHdd8FApHx6PNEiFDIKD104IfO6UtQr6SPPd/nDP+p8CZSl00TajisJRzM3Z+JguVt1XQ2IVdEoibwe/zEiSs60H+rxhRd/0vnkQqhXWIm5ZEZ5ZHLq7LDGCirBqtKIggXwXBgAEauevHHj9cPnfOFlH5/YClIpvKVHharyapaSvUzaMcczjlEdLVKVvG9W5ossBwiBm1NvPPOHL/z+vr413l+O749i+mrSLimN6hAKLr23uR0qD2dGGxtnfOGPMRcaZ5HZMIY6VM0rc1lw3jEFIAcRHV94BzMNFIbJHVlXfhYhLhRyx6CVZP8bNZWUKIarg0QAAAAASUVORK5CYII=" alt=""  />
           实时负荷:
           <span > 618762.27 kW</span>
           </div>
           <div className={styles.realEcharts} id="realEcharts"></div>
          </div>
          
        </div>



      </>
    );
  }
}

export default ContentBox;
