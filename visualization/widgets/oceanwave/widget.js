/* 2017-9-28 16:04:24 | 修改 木遥（QQ：516584683） */
//模块：
mars3d.widget.bindClass(mars3d.widget.BaseWidget.extend({
  options: {
    resources: ['view.css'],
    //弹窗
    view: [{
      type: 'window',
      url: 'view.html',
      name: 'main',
      windowOptions: {
        title: false,
        closeBtn: 0,
        width: 300,
        skin: 'transpanceclass',
        position: {
          top: 150,
          left: 10,
        },
        height: 160,
      },
    }
      , {
        type: 'window',
        url: 'timeline.html',
        name: 'time',
        windowOptions: {
          title: false,
          closeBtn: 0,
          skin: 'defaultsceneclass2',
          position: {
            left: ($(window).width() - 550) / 2,
            bottom: 30,
          },
          width: 550,
          height: 65,
        },
      }, {
        type: 'alarmwindow',
        url: 'alarmview.html',
        name: 'alarm',
        windowOptions: {
          title: false,
          skin: 'defaultsceneclass2',
          maxmin: 0,
          closeBtn: 0,
          position: {
            right: 10,
            bottom: 250,
          },
          width: 300,
          height: 250,
        },
      }, {
        type: 'infowindow',
        url: 'infoview.html',
        name: 'info',
        windowOptions: {
          title: false,
          show: false,
          skin: 'defaultsceneclass2',
          maxmin: 0,
          closeBtn: 0,
          position: {
            left: 10,
            top: 320,
          },
          width: 400,
          height: 300,
        },
      }, {
        type: 'window',
        url: 'visualmap.html',
        name: 'visualmap',
        windowOptions: {
          skin: 'defaultsceneclass',
          title: false,
          closeBtn: 0,
          position: {
            right: 10,
            bottom: 10,
          },
          width: 120,
          height: 225,
        },
      },/*, {
                type: "window",
                url: "visualmapalarm.html",
                name: 'visualmapalarm',
                windowOptions: {
                    title: false,
                    skin: 'defaultsceneclass',
                    closeBtn: 0,
                    position: {
                        right: 140,
                        bottom: 10
                    },
                    width: 80,
                    height: 130
                }
            }*/
    ],
  },
  //初始化[仅执行1次]
  create: function() {

  },
  viewWindow: null, //条件查询
  timeWindow: null, //时间轴轮播
  alarmWindow: null,
  infoWindow: null,

  visualWin: null,

  infoDom: null,
  alarmDom: null,
  timeDom: null,

  heatmapLayer: null,
  showEntities: [],
  showContours: [],
  showContoursPolygon: [],

  alarmpoints: [],
  divpoints: [],
  dataMap: [],
  isHeatMap: false,
  alarmInd: 0,
  isActive: false,

  colorRange: ['#8f4111', '#d14e00', '#df7f04', '#c1c016', '#4ac550', '#61bd96', '#5299d1', '#5062c4', '#3a408e'].reverse(),
  colorIndex: [14, 9, 6, 4, 2.5, 1.25, 0.5, 0.1, 0].reverse(),

  alarmData: [2.2, 3.5, 4.5, 6],
  alarmColor: ['#ec4040', '#c67d0c', '#c9cb0e', '#317ddd'].reverse(),

  isTimePlay: false,

  isTimeDuan: false,

  isShowCon: false,


  //每个窗口创建完成后调用
  winCreateOK: function(opt, result) {

    if (opt.name === 'main') {
      this.viewWindow = result;
    } else if (opt.name === 'time') {
      this.timeWindow = result;
      this.timeDom = $(opt._dom);
      this.timeDom.hide();
    } else if (opt.name === 'alarm') {
      this.alarmWindow = result;

      var btndom = $(opt._dom).find('.layui-layer-setwin');

      var closebtn = btndom.find('.layui-layer-close');
      btndom.append('<a href=\'javascript:\' class=\'iconfont icondelete\'  style=\'margin-top:3px;\' id=\'hideContentwave\'></a>');

      this.alarmDom = $(opt._dom);
      $('#hideContentwave').click(function() {
        $(opt._dom).hide();
      });
      this.alarmDom.hide();
    } else if (opt.name === 'info') {
      this.infoWindow = result;
      $('#waveInfoWin').parent().hide();
      var btndom = $(opt._dom).find('.layui-layer-setwin');

      var closebtn = btndom.find('.layui-layer-close');
      btndom.append('<a href=\'javascript:\' class=\'iconfont icondelete\'  style=\'margin-top:3px;\' id=\'hideContentWave2\'></a>');

      this.infoDom = $(opt._dom);
      $('#hideContentWave2').click(function() {
        $(opt._dom).hide();
      });
      $(opt._dom).hide();
    } else if (opt.name === 'visualmap') {
      this.visualWin = result;
    }
    theWidgetWave = this;
  },

  //关闭释放
  disable: function () {
    this.infoDom.hide();
    this.timeDom.hide();
    this.alarmDom.hide();
    // console.log("testetstestestetste")
    viewer && viewer.mars.popup.close();
  },

  //打开激活
  activate: function(opt, result) {
    viewer && viewer.mars.popup.close();
    var self = this;
    var viewer = this.viewer;
    this.isActive = true;

    $("#loading").show();

    if (!this._handler) { //监听地图点击事件，点击是空的时候，返回上一层级
      this._handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
      this._handler.setInputAction(function(event) {

        var pick = viewer.scene.pick(event.position);

        self.alarmDom.hide();
        self.infoDom.hide();
        if (self.isHeatMap) {
          if (self.divpoint) {
            viewer.entities.remove(self.divpoint);
            self.divpoint = null;
          }
          var ellipsoid = viewer.scene.globe.ellipsoid;
          // Mouse over the globe to see the cartographic position
          var cartesian = viewer.camera.pickEllipsoid(event.position, ellipsoid);
          if (cartesian) {
            var cartographic = ellipsoid.cartesianToCartographic(cartesian);
            var lon = Cesium.Math.toDegrees(cartographic.longitude);
            var lat = Cesium.Math.toDegrees(cartographic.latitude);
            var key = parseInt(lon * 1) + '_' + parseInt(lat * 1);

            if (self.dataMap[key]) {
              self.timeWindow.stop();
              var points = self.dataMap[key];
              //   console.log(points);

              var min = 10000;
              var point = null;
              for (var i = 0; i < points.length; i++) {
                var dis = Math.abs(points[i].x - lon) + Math.abs(points[i].y - lat);
                if (dis < min) {
                  min = dis;
                  point = points[i];
                }
              }


              var display = 'display:none;';
              if (self.isTimeDuan) {
                display = 'display:;';
              }

              self.divpoint = viewer.entities.add({
                position: Cesium.Cartesian3.fromDegrees(lon, lat, 10),
                point: {
                  color: new Cesium.Color.fromCssColorString('#3388ff').withAlpha(0.1),
                  pixelSize: 10,
                  outlineColor: new Cesium.Color.fromCssColorString('#ffffff'),
                  outlineWidth: 2,
                  heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
                },
                popup: {
                  html:`<div class='wave-pophtml'>
                  <div class='wave-pop-row'><span>站点</span><span>${point.id}</span></div>
                  <div class='wave-pop-row'><span>时间</span><span>${point.time}</span></div>
                  <div class='wave-pop-row'><span>浪高</span><span>${point.v} m</span></div>
                  <div class='wave-pop-row'><span>经度</span><span>${point.x}</span></div>
                  <div class='wave-pop-row'><span>纬度</span><span>${point.y}</span></div>
                  <div class='wave-pop-row' style='${display}'><div class='wave-btn' onclick='showInfoWin(${point.id})'>详细信息</div></div>
                  </div>`,
                  anchor: [0, 0],//定义偏移像素值 [x, y]
                },
              });


              viewer.mars.popup.show(self.divpoint);
            }
          }

        } else if (Cesium.defined(pick) && (pick.id)) {
          self.timeWindow.stop();
          self.alarmDom.hide();
          self.infoDom.hide();
        } else {
          // if(self.divpoint){
          //     self.divpoint.destroy();
          //     self.divpoint=null;
          // }
          // var ellipsoid = viewer.scene.globe.ellipsoid;
          // // Mouse over the globe to see the cartographic position
          // var cartesian = viewer.camera.pickEllipsoid(event.position, ellipsoid);
          // if (cartesian) {
          //     var cartographic = ellipsoid.cartesianToCartographic(cartesian);
          //     var lon = Cesium.Math.toDegrees(cartographic.longitude);
          //     var lat = Cesium.Math.toDegrees(cartographic.latitude);
          //     if(self.windyLayer){
          //         var val=self.windyLayer.getValue(lon,lat);
          //
          //         if(val) {
          //
          //             self.divpoint = new mars3d.DivPoint(viewer, {
          //                 html: '<div class="divpoint2">'+
          //                     ' <div class="title">流向：'+self.getFengXiang(val.u,val.v)+'</div>'+
          //                     ' <div class="content">经度:'+lon.toFixed(6)+'<br/> 纬度:'+lat.toFixed(6)+'</div>'+
          //                     ' </div >',
          //                 position: Cesium.Cartesian3.fromDegrees(lon, lat, 0),
          //                 anchor: [0, 0]
          //             });
          //
          //         }
          //
          //     }
          // }
        }

      }, Cesium.ScreenSpaceEventType.LEFT_CLICK);


      this._handler.setInputAction(function(event) {

        var pick = viewer.scene.pick(event.endPosition);
        if (Cesium.defined(pick) && pick.id) {
          if (pick.id.id) {
            // var id = pick.id.id;
            // if (self.lastPolyline) {
            //     self.lastPolyline.width = 1;
            //     self.lastPolyline = null;
            // }
            //
            // if (id.indexOf("contour_") > -1) {
            //     pick.id.polyline.width = 3;
            //     self.lastPolyline = pick.id.polyline;
            // }
          }

        } else if (self.isHeatMap) {
          // if (self.divpoint) {
          //   viewer.entities.remove(self.divpoint);
          //   self.divpoint = null;
          // }
          // var ellipsoid = viewer.scene.globe.ellipsoid;
          // // Mouse over the globe to see the cartographic position
          // var cartesian = viewer.camera.pickEllipsoid(event.endPosition, ellipsoid);
          // if (cartesian) {
          //   var cartographic = ellipsoid.cartesianToCartographic(cartesian);
          //   var lon = Cesium.Math.toDegrees(cartographic.longitude);
          //   var lat = Cesium.Math.toDegrees(cartographic.latitude);
          //   var key = parseInt(lon * 100) + '_' + parseInt(lat * 100);
          //
          //   if (self.dataMap[key]) {
          //     var point = self.dataMap[key];
          //
          //
          //     var display = 'display:none;';
          //     if (self.isTimeDuan) {
          //       display = 'display:;';
          //     }
          //
          //     self.divpoint = viewer.entities.add({
          //       position: Cesium.Cartesian3.fromDegrees(lon, lat, 10),
          //       point: {
          //         color: new Cesium.Color.fromCssColorString('#3388ff').withAlpha(0.1),
          //         pixelSize: 10,
          //         outlineColor: new Cesium.Color.fromCssColorString('#ffffff'),
          //         outlineWidth: 2,
          //         heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
          //       },
          //       popup: {
          //         html: '<p>站点：' + point.id + '</p><p>时间：' + point.time + '</p><p>浪高：' + point.v + ' </p><p>经度:' + point.x + '</p><p>纬度:' + point.y + '</p><input  style=\'' + display + '\' type=\'button\' onclick=\'showInfoWin(' + point.id + ')\'  value=\'详细信息\'/>',
          //         anchor: [0, 0],//定义偏移像素值 [x, y]
          //       },
          //     });
          //
          //
          //     viewer.mars.popup.show(self.divpoint);
          //   }
          // }

        }
      }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

    }

    this.loadData();
  },

  loadData: function() {

    this.alarmDom.hide();
    this.infoDom.hide();
    this.viewer.mars.popup.close();

    var timeparams = this.viewWindow.getTimeConfig();

    if (timeparams.ed) {
      this.isTimeDuan = true;
      var date = new Date(timeparams.sd);
      date.setHours(timeparams.sh);
      var edate = new Date(timeparams.ed);
      edate.setHours(timeparams.eh);

      var dates = [];

      while (date.getTime() <= edate.getTime()) {
        dates.push(date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate() + ' ' + date.getHours());

        date.setHours(date.getHours() + 1);

      }
      this.timeDom.css("opacity","1");
      this.alarmDom.css("opacity","1");
      this.infoDom.css("opacity","1");
      
      this.timeDom.css("background-color","#26354F") 
      this.alarmDom.css("background-color","#26354F")
      this.infoDom.css("background-color","#26354F")  
      this.timeDom.show();
      this.timeWindow.updateTimeArray(dates);
      var self = this;
      setTimeout(function() {
        self.timeWindow.resizeTime();
      }, 200);


    } else {
      this.isTimeDuan = false;
      this.timeDom.hide();
      this.updateDate(timeparams.sd + ' ' + timeparams.sh);
    }


  },

  getSZWaveData:function(date,fun){
    getFromCache("szwavedata_"+date).then(function(val){
        if(!val) {
            $.ajaxSetup({
                timeout: 60*1000
            });
            $.getJSON("/OceanServer/waveserver?op=1&date="+date, function (result) {
                setToCache("szwavedata_"+date,JSON.stringify(result))
                fun(result);
            }).fail(function() {
                $("#loading").hide();
                toastr.info('获取数据失败');
                fun([]);
            });
        }else{
            // console.log("get sz wave data from local cache:",val.length);
            var result=JSON.parse(val);
            fun(result);
        }
    })
  },

  // updateDate: function(date) {
  //   this.date = date;
  //   console.log('date:', date);
  //   this.dataMap = [];

  //   var self = this;

  //   $.ajax({
  //     type:'get',
  //     url:'/OceanServer/waveserver?op=1&date=' + date,
  //     data:{},
  //     dataType:'json',
  //     success:function(result){
  //       var data = result;
  //       if (data) {
  //         var points = [];
  //         var min = 1000;
  //         var max = -100;
  //         for (var i = 0; i < data.length; i++) {

  //           var id = data[i].id;

  //           var time = date;

  //           var lon = data[i].lon;
  //           var lat = data[i].lat;
  //           var u = data[i].s;
  //           min = Math.min(u, min);
  //           max = Math.max(u, max);

  //           var key = parseInt(lon * 1) + '_' + parseInt(lat * 1);

  //           var point = {
  //             id,
  //             time,
  //             x: lon,
  //             y: lat,
  //             v: u,
  //           };



  //           if(self.dataMap[key]){
  //             var a=self.dataMap[key];
  //             a.push(point);
  //           }else{
  //             var a=[];
  //             a.push(point);
  //             self.dataMap[key]=a;
  //           }
  //           //`  self.dataMap[key]=point;
  //           if (u > self.alarmData[0]) {
  //             self.alarmpoints.push(point);
  //           }
  //           points.push(point);


  //         }

  //         var len = self.colorRange.length;
  //         var per = (max - min) / (len - 1);
  //         for (var i = 0; i < len; i++) {
  //           self.colorIndex[i] = (i * per + min).toFixed(2);
  //         }
  //         self.visualWin.loadcharts(self.colorIndex);
  //         self.points = points;
  //         if (self.isHeatMap) {
  //           self.showHeatMap();
  //         } else {
  //           self.showPoints();
  //         }
  //         self.showAlarmPoints();

  //         if (self.isShowCon && this.isTimeDuan) {
  //           self.showContourLine();
  //         }
  //       }
  //     },
  //     error:function(XMLHttpRequest,textStatus,errorThrown){
  //       // console.log(XMLHttpRequest,textStatus,errorThrown)
  //       if(XMLHttpRequest.status >=500 &&  XMLHttpRequest.status < 600){
  //         alert("无数据！")
  //       }
  //       $('#loading').hide()
  //     }
  //   })

  //   // $.ajax({
  //   //     type: "GET",
  //   //     url: "/visualization/data/ocean/subject_hs.csv",
  //   //     dataType: "text",
  //   //     success: function(data) {
  //   //         var allTextLines = data.split(/\r\n|\n/);
  //   //         var headers = allTextLines[0].split(',');
  //   //
  //   //
  //   //         var points=[];
  //   //         var min=1000;
  //   //         var max=-100;
  //   //
  //   //         for (var i=1; i<allTextLines.length; i++) {
  //   //             var data = allTextLines[i].split(',');
  //   //             if (data.length == headers.length) {
  //   //                 var id=data[0].replaceAll("\"","");
  //   //                 var time=data[6].replaceAll("\"","");
  //   //
  //   //                 var lon=parseFloat(data[4].replaceAll("\"",""));
  //   //                 var lat=parseFloat(data[3].replaceAll("\"",""));
  //   //                 var u=parseFloat(data[2].replaceAll("\"",""));
  //   //                 min=Math.min(u,min);
  //   //                 max=Math.max(u,max);
  //   //
  //   //                 var key=parseInt(lon*100)+"_"+parseInt(lat*100);
  //   //
  //   //                 var point={
  //   //                     id,
  //   //                     time,
  //   //                     x:lon,
  //   //                     y:lat,
  //   //                     v:u
  //   //                 }
  //   //
  //   //
  //   //                 self.dataMap[key]=point;
  //   //                 if(u>self.alarmData[0]){
  //   //                     self.alarmpoints.push(point);
  //   //                 }
  //   //                 points.push(  point  );
  //   //
  //   //             }
  //   //         }
  //   //
  //   //         var len=self.colorRange.length;
  //   //         var per=(max-min)/(len-1);
  //   //         for(var i=0;i<len;i++){
  //   //             self.colorIndex[i]=(i*per+min).toFixed(2);
  //   //         }
  //   //
  //   //
  //   //
  //   //         self.visualWin.loadcharts( self.colorIndex)
  //   //
  //   //         self.points=points;
  //   //
  //   //
  //   //
  //   //         if(self.isHeatMap){
  //   //             self.showHeatMap();
  //   //         }else {
  //   //             self.showPoints();
  //   //         }
  //   //         self.showAlarmPoints();
  //   //
  //   //         if(self.isShowCon&&this.isTimeDuan){
  //   //             self.showContourLine();
  //   //         }
  //   //     }
  //   // });
  // },
  updateDate:function(date){
    this.date=date;
    this.dataMap=[];

    var self=this;

    if(this.isTimeDuan){
      this.timeWindow.stopLong();
    }

   this.getSZWaveData(date, function (result) {
          var data=result;

          if(data){
              var points=[];
              var min=1000;
              var max=-100;
              for (var i=0; i<data.length; i++) {

                      var id=data[i].id;

                      var time=date;

                      var lon=data[i].lon;
                      var lat=data[i].lat;
                      var u=data[i].s;
                      min=Math.min(u,min);
                      max=Math.max(u,max);

                      var key=parseInt(lon*1)+"_"+parseInt(lat*1);

                      var point={
                          id,
                          time,
                          x:lon,
                          y:lat,
                          v:u
                      }


                      if(self.dataMap[key]){
                          var a=self.dataMap[key];
                          a.push(point);
                      }else{
                          var a=[];
                          a.push(point);
                          self.dataMap[key]=a;
                      }
                    //`  self.dataMap[key]=point;

                      if(u>self.alarmData[0]){
                          self.alarmpoints.push(point);
                      }
                      points.push(  point  );


              }

            var len=self.colorRange.length;
            var per=(max-min)/(len-1);
            for(var i=0;i<len;i++){
                self.colorIndex[i]=(i*per+min).toFixed(2);
            }
            self.visualWin.loadcharts( self.colorIndex)
            self.points=points;
            if(self.isHeatMap){
                self.showHeatMap();
            }else {
                self.showPoints();
            }
            self.showAlarmPoints();

            if(self.isShowCon&&this.isTimeDuan){
                self.showContourLine();
            }
          }

    });
  },


  updateTimeState: function(state) {
    this.isTimePlay = state;
    // if(this.isTimePlay){
    //     this.alarmDom.hide();
    //     this.showAlarmPoints();
    // }else{
    //     this.showAlarmInfo();
    // }
  },
  showAlarmInfo: function(id) {


    if (this.isTimeDuan) {
      this.showInfoWin(id);
    }
    var data = null;

    for (var i = 0; i < this.alarmpoints.length; i++) {
      if (this.alarmpoints[i].id === id) {
        data = this.alarmpoints[i];
      }

    }

    if (data) {
      this.alarmWindow.loadcharts(data, this.alarmData, this.alarmColor);
      this.alarmDom.show();
    }

  },

  getIndexByValue: function(v) {
    var len = this.colorIndex.length - 1;
    for (var i = 1; i < this.colorIndex.length; i++) {
      if (v < this.colorIndex[i]) {
        return (i - 1) / len;
      }
    }
    return 1;
  },

  getSZWaveContourData:function(date,fun){
    getFromCache("szwavecontourdata_"+date).then(function(val){
        if(!val) {
            $.ajaxSetup({
                timeout: 60*1000
            });
            $.getJSON("/OceanServer/waveserver?op=2&date="+date, function (result) {
                setToCache("szwavecontourdata_"+date,JSON.stringify(result))
                fun(result);
            }).fail(function() {
                $("#loading").hide();
                toastr.info('获取数据失败');
                fun([]);
            });
        }else{
            // console.log("get sz wave contour data from local cache:",val.length);
            var result=JSON.parse(val);
            fun(result);
        }
    })
},
  showHeatMap: function() {

    $("#loading").show();
    this.clearMap();
    this.isHeatMap = true;
    var viewer = this.viewer;

    viewer.mars.popup.close();

    this.alarmDom.hide();
    this.infoDom.hide();

    var self = this;

    var rectangle=Cesium.Rectangle.fromDegrees(105.67477,13.13128551,127.684787,28.323631);
    this.oceanLayer=viewer.imageryLayers.addImageryProvider(new Cesium.SingleTileImageryProvider({
      url: this.path + '/data/szocean.png',
        rectangle: rectangle
    }))
    // $.getJSON('/OceanServer/waveserver?op=2&date=' + this.date, function(result) {
    this.getSZWaveContourData(this.date, function (result) {
      var features = result.features;
      features&&features.forEach(function(feature) {
        var coordinates = feature.geometry.coordinates[0];
        if (feature.geometry.type === 'MultiPolygon') {
          coordinates = coordinates[0];
        }
        var ps = [];

        coordinates.forEach(function(point) {
          ps.push(point[0]);
          ps.push(point[1]);

        });
        var per = (feature.properties.max - feature.properties.min) / (self.colorRange.length - 1);
        var color = self.colorRange[parseInt((feature.properties.hvalue - feature.properties.min) / per) % self.colorRange.length];

        var polygon = viewer.entities.add({
          polyline: {
            show: self.isShowCon,
            positions: Cesium.Cartesian3.fromDegreesArray(ps),
            width: 1,
            material: Cesium.Color.fromCssColorString(color),
            clampToGround: true,
            classificationType: Cesium.ClassificationType.BOTH,
          },
          position: Cesium.Cartesian3.fromDegrees(ps[0], ps[1], 0),
          label: {
            show:self.isShowCon,

            text: feature.properties.hvalue.toFixed(2)+"",
            font: '14pt Source Han Sans CN', //字体样式
            fillColor: Cesium.Color.WHITE, //字体颜色
            backgroundColor: Cesium.Color.BLUE, //背景颜色
            showBackground: false, //是否显示背景颜色
            style: Cesium.LabelStyle.FILL, //label样式
            outlineWidth: 2,
            scaleByDistance:new Cesium.NearFarScalar(20000, 1, 400000, 0.4),
            classificationType: Cesium.ClassificationType.BOTH,
            verticalOrigin: Cesium.VerticalOrigin.CENTER, //垂直位置
            horizontalOrigin: Cesium.HorizontalOrigin.LEFT, //水平位置
            pixelOffset: new Cesium.Cartesian2(-10, 0)
          },
          polygon: {
            hierarchy: Cesium.Cartesian3.fromDegreesArray(ps),
            material: Cesium.Color.fromCssColorString(color).withAlpha(0.6),
            classificationType: Cesium.ClassificationType.BOTH,
            outline: true,
            outlineWidth: 1,
            outlineColor: Cesium.Color.BLUE,
          },
        });

        self.showContoursPolygon.push(polygon);
      });

      $("#loading").hide();
      if( self.isTimeDuan ){
        self.timeWindow.start();
      }
    });
    //   var gradient={};
    //
    //   for(var i=0;i<this.colorIndex.length;i++){
    //       gradient[i/(this.colorIndex.length-1)]=this.colorRange[i];
    //   }
    //
    //   var points=[];
    //   for(var i=0;i<this.points.length;i++){
    //       points.push({
    //           x:this.points[i].x,
    //           y:this.points[i].y,
    //           v:this.getIndexByValue(this.points[i].v)
    //       })
    //   }
    //
    //
    // //  console.log(gradient);
    //   var heatLayer = createHeatmapImageryProvider(Cesium, {
    //       //min: min, max: max, //可自定义热力值范围，默认为数据中的最大最小值
    //       data: points,
    //       heatmapoptions: {//参阅api：https://www.patrick-wied.at/static/heatmapjs/docs.html
    //           radius: 8,
    //           minOpacity: 1,
    //           xField: 'x',
    //           yField: 'y',
    //            gradient:gradient,
    //           valueField: 'v'
    //       }
    //   });
    //
    //
    //   this.heatmapLayer= viewer.imageryLayers.addImageryProvider(heatLayer);
    this.showAlarmPoints();
  },

  getAlarmColor: function(v) {
    for (var i = this.alarmData.length - 1; i >= 0; i--) {
      if (v > this.alarmData[i]) {
        return this.alarmColor[i];
      }
    }

  },

  showAlarmPoint:function(point){
    return;//不加载预警点
    var color=this.getAlarmColor(point.v);


    var divpoint = new mars3d.DivPoint(viewer, {
        html: '<div class="mars3d-animation-point" style="color:'+color+';"><p></p></div>',
        position: Cesium.Cartesian3.fromDegrees(point.x, point.y),
        anchor: [0, 0],
        data: point,
        popup:{
           html: "<p>站点："+point.id+"</p><p>时间："+point.time+"</p><p>浪高："+point.v+" </p><p>经度:"+point.x+"</p><p>纬度:"+point.y+"</p><input   type='button' onclick='showInfoAlarmWin("+point.id+")'  value='详细信息'/>",

        }

    });

    this.divpoints.push(divpoint);
},

  showAlarmPoints: function() {
    var viewer = this.viewer;
    for (var i = 0; i < this.alarmpoints.length; i++) {
      var point = this.alarmpoints[i];
      this.showAlarmPoint(point);

    }
  },

  getColorByValue: function(v) {
    for (var i = 1; i < this.colorRange.length; i++) {
      if (v < this.colorIndex[i]) {
        return this.colorRange[i - 1];
      }

    }
    return this.colorRange[0];

  },

  showPoints: function() {
    $("#loading").show();
    this.isHeatMap = false;
    this.clearMap();

    this.alarmDom.hide();
    this.infoDom.hide();

    this.viewer.mars.popup.close();


    var self = this;

    var display = ' display:none;';
    if (this.isTimeDuan) {
      display = 'display:;';
    }
    for (var i = 0; i < this.points.length; i++) {
      var point = this.points[i];

      var color = this.getColorByValue(point.v);


      var entity = viewer.entities.add({

        position: Cesium.Cartesian3.fromDegrees(point.x, point.y, 10),
        point: { //点
          pixelSize: 2,
          color: new Cesium.Color.fromCssColorString(color),
          HeightReference: 0,
        },
        popup: {
          html: `<div class='wave-pophtml'>
                <div class='wave-pop-row'><span>站点</span><span>${point.id}</span></div>
                <div class='wave-pop-row'><span>时间</span><span>${point.time}</span></div>
                <div class='wave-pop-row'><span>浪高</span><span>${point.v} m</span></div>
                <div class='wave-pop-row'><span>经度</span><span>${point.x}</span></div>
                <div class='wave-pop-row'><span>纬度</span><span>${point.y}</span></div>
                <div class='wave-pop-row' style='${display}'><div class='wave-btn' onclick='showInfoWin(${point.id})'>详细信息</div></div>
                </div>`,
        },
      });
      this.showEntities.push(entity);
    }
    $("#loading").hide();
    if( this.isTimeDuan){
      this.timeWindow.start();
      // console.log("开始")
    }
    this.showAlarmPoints();
  },


  showInfoWin: function(id) {

    this.infoDom.show();
    var data = null;

    for (var i = 0; i < this.points.length; i++) {
      if (id === this.points[i].id) {
        data = this.points[i];
        break;
      }
    }

    var timeparams = this.viewWindow.getTimeConfig();
    // console.log("ceeeee",data,timeparams)
    if (data && timeparams.ed) {
      this.infoWindow.loadcharts(data, timeparams);
    }

  },


  showContourLine: function() {

    this.isShowCon = true;
    for (var i = 0; i < this.showContoursPolygon.length; i++) {
      this.showContoursPolygon[i].polyline.show = true;
      this.showContoursPolygon[i].label.show=true;
    }

    // self.showContoursPolygon.push(polygon);
    //  var self=this;
    //
    //
    //  console.log("contoure date:",this.date);
    //
    // this.isShowCon=true;
    //
    //
    //  var ind=0;
    //  $.getJSON("/visualization/data/ocean/szoceandata-wave.json", function(result){
    //      var features=result.features;
    //      features.forEach(function(feature) {
    //          var coordinates = feature.geometry.coordinates;
    //          if (feature.geometry.type === 'MultiLineString') {
    //              coordinates = coordinates[0];
    //          }
    //          var ps = [];
    //
    //          coordinates.forEach(function(point) {
    //              ps.push(point[0]);
    //              ps.push(point[1]);
    //
    //          })
    //
    //
    //
    //          var color=self.getColorByValue(feature.properties.value);
    //
    //
    //          var polygon = viewer.entities.add({
    //              id:'contour_'+ind++,
    //              // polygon: {
    //              //     hierarchy: Cesium.Cartesian3.fromDegreesArray(ps),
    //              //     material: Cesium.Color.YELLOW.withAlpha(0.6),
    //              //     classificationType: Cesium.ClassificationType.BOTH,
    //              //     outline: true,
    //              //     outlineWidth: 1,
    //              //     outlineColor: Cesium.Color.BLUE,
    //              // },
    //              polyline: {
    //                  positions: Cesium.Cartesian3.fromDegreesArray(ps),
    //                  width: 1,
    //                  material: Cesium.Color.fromCssColorString(color),
    //                  clampToGround: true,
    //                  classificationType: Cesium.ClassificationType.BOTH
    //              },
    //              tooltip:{
    //                  html:"<p>"+feature.properties.value+"米</p>"
    //              }
    //              // ,
    //              // position: Cesium.Cartesian3.fromDegrees(center.geometry.coordinates[0], center.geometry.coordinates[1], 80),
    //              //
    //              // label: {
    //              //     text: '深圳市',
    //              //     font: '14pt Source Han Sans CN', //字体样式
    //              //     fillColor: Cesium.Color.WHITE, //字体颜色
    //              //     backgroundColor: Cesium.Color.BLUE, //背景颜色
    //              //     showBackground: true, //是否显示背景颜色
    //              //     style: Cesium.LabelStyle.FILL, //label样式
    //              //     outlineWidth: 2,
    //              //     scaleByDistance:new Cesium.NearFarScalar(20000, 1, 400000, 0.4),
    //              //     classificationType: Cesium.ClassificationType.BOTH,
    //              //     verticalOrigin: Cesium.VerticalOrigin.CENTER, //垂直位置
    //              //     horizontalOrigin: Cesium.HorizontalOrigin.LEFT, //水平位置
    //              //     pixelOffset: new Cesium.Cartesian2(10, 0)
    //              // },
    //          });
    //
    //          self.showContours.push(polygon);
    //
    //
    //      })
    //
    //  });

  },


  hideContourLine: function() {
    this.isShowCon = false;

    for (var i = 0; i < this.showContoursPolygon.length; i++) {
      this.showContoursPolygon[i].polyline.show = false;
      this.showContoursPolygon[i].label.show=false;
    }
    // this.showContours=[];
  },

  clearAlarmPoint: function() {
    for (var i = 0; i < this.divpoints.length; i++) {
      if (this.divpoints[i]) {
        this.divpoints[i].destroy();
      }
    }

    this.divpoints = [];
  },

  clearContourPolygon() {
    this.showContoursPolygon.forEach(function(entity) {
      self.viewer.entities.remove(entity);
    });
    this.showContoursPolygon = [];
  },
  /*
   清除 div容器  清除 echarts
   */
  clearMap: function() {

    this.viewer.entities.removeAll();
    this.showEntities = [];
    this.showContours = [];
    this.showContoursPolygon = [];

    if(this.oceanLayer) {
      this.viewer.imageryLayers.remove(this.oceanLayer);
    }
    this.oceanLayer=null;
    this.clearContourPolygon();
    if (this.heatmapLayer) {
      viewer.imageryLayers.remove(this.heatmapLayer);
    }
    this.heatmapLayer = null;

    this.clearAlarmPoint();

  },
  //关闭释放
  disable: function() {
    this.isShowCon = false;
    this.isActive = false;
    if (this._handler) {
      this._handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK);
      this._handler.removeInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE);
      this._handler = null;
    }
    this.viewWindow = null;
    this.clearMap();

    this.isHeatMap=false;
    this. alarmInd=0;
    this.isTimePlay=false;
    this.isTimeDuan=false;


  },
}));


var theWidgetWave;

function RGBtoHEX(rgb) {
  rgb = rgb.match(/^rgba?\(\s?(\d+),?\s?(\d+),?\s?(\d+),?\s?\/?\s?(\d?\.?\d+|\d+)%?\)$/i);
  let hex = '';
  if (rgb) {
    var red = rgb[1] < 0 ? 0 : rgb[1] > 255 ? 255 : rgb[1];
    var green = rgb[2] < 0 ? 0 : rgb[2] > 255 ? 255 : rgb[2];
    var blue = rgb[3] < 0 ? 0 : rgb[3] > 255 ? 255 : rgb[3];

    hex = '#' +
      ('0' + parseInt(red, 10).toString(16)).slice(-2) +
      ('0' + parseInt(green, 10).toString(16)).slice(-2) +
      ('0' + parseInt(blue, 10).toString(16)).slice(-2);
  }
  return hex;
}


function showInfoWin(id) {
  theWidgetWave.showInfoWin(id);
}

function showInfoAlarmWin(id) {
  theWidgetWave.showAlarmInfo(id);

}
