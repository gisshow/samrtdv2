/* 2017-9-28 16:04:24 | 修改 木遥（QQ：516584683） */
//模块：
mars3d.widget.bindClass(mars3d.widget.BaseWidget.extend({
  options: {
    resources: ['view.css', 'cesium-wind.js'],
    //弹窗
    view: [{
      type: 'window',
      url: 'view.html',
      name: 'main',
      windowOptions: {
        title: false,
        closeBtn: 0,
        skin: 'transpanceclass',
        //   maxmin: true,
        width: 340,
        position: {
          top: 150,
          left: 10,
        },
        height: 180,
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
            bottom: 130,
          },
          width: 550,
          height: 65,
        },
      }, {
        type: 'window',
        url: 'visualmap.html',
        name: 'visualmap',
        windowOptions: {
          title: false,
          skin: 'defaultsceneclass',
          closeBtn: 0,
          position: {
            right: 10,
            bottom: 10,
          },
          width: 100,
          height: 205,
        },
      },
    ],
  },
  //初始化[仅执行1次]
  create: function() {

  },
  viewWindow: null, //条件查询
  timeWindow: null, //时间轴轮播
  isshenz: false,
  isshenzpart:0,
  windyLayer: null,
  showEntities: [], //显示的entity
  divpoint: null,
  timeDom: null,
  visualWin: null,
  visualDom: null,
  isActive: false,
  showLunboDate: '2020-05-25',

  contoursPolygon: [],

  colorRange:[0,0.2,0.4,0.6,0.8,1,1.2],
  colorScalePiece: [
    '#4E0B8A',
    '#560E8A',
    '#65158A',
    '#751C8A',
    '#84238A',
    '#952A8A',
    '#A32F89',
    '#B23689',
    '#C23D8A',
    '#D2448A',
    '#E24B8A',
    '#E15589',
    '#D46288',
    '#C76F87',
    '#B97C86',
    '#AD8885',
    '#9F9583',
    '#93A283',
    '#86AF82',
    '#78BB80',
    '#6CC77F',
    '#5FD47E',
    '#53DD80',
    '#4CD38B',
    '#45CA96',
    '#3FC1A1',
    '#38B8AC',
    '#30AFB6',
    '#29A5C2',
    '#229CCC',
    '#1C93D8',
    '#158BE3',
    '#0F82ED',
  ].reverse(),
  colorScale: [
    'rgb(36,104, 180)',
    'rgb(60,157, 194)',
    'rgb(128,205,193)',
    'rgb(151,218,168)',
    'rgb(198,231,181)',
    'rgb(238,247,217)',
  ],
  colorScaleSZ: [

    '#36a7e9',
    '#48bc97',
    '#53d243',
    '#8dcb42',
    '#ddc33a',
    '#e58741',
    '#eb4142',
    // 'rgba(36,104, 180,1.5)',
    // 'rgba(60,157, 194,1.5)',
    // 'rgba(128,205,193,1.5)',
    // 'rgba(151,218,168,1.5)',
    // 'rgba(198,231,181,1.5)',
    // 'rgba(238,247,217,1.5)'
    // 'rgb(255,238,159)',
    // 'rgb(252,217,125)',
    // 'rgb(255,182,100)',
    // 'rgb(252,150,75)',
    // 'rgb(250,112,52)',
    // 'rgb(245,64,32)',
    // 'rgb(237,45,28)',
    // 'rgb(220,24,32)',
    // 'rgb(180,0,35)',
  ],

  colorScaleSZWindy: [
    '#ffffff',
  ],


  getSpeed: function(ud, vd) {
    return Math.sqrt(Math.pow(ud, 2) + Math.pow(vd, 2)).toFixed(4);

  },
  getFengXiang: function(ud, vd) {
    var speedd = Math.sqrt(Math.pow(ud, 2) + Math.pow(vd, 2)).toFixed(4);

    //计算角度
    var dird = Math.atan(ud / vd) * 180 / Math.PI;
    if (ud != 0 && vd < 0) {
      dird = dird + 180;
    } else if (ud < 0 && vd > 0) {
      dird = dird + 360;
    } else if (ud == 0 && vd > 0) {
      dird = 0;
    } else if (ud == 0 && vd < 0) {
      dird = 180;
    } else if (ud > 0 && vd == 0) {
      dird = 90;
    } else if (ud < 0 && vd == 0) {
      dird = 270;
    } else if (ud == 0 && vd == 0) {
      dird = -999;
    }

    if (dird < 22.5 || dird > 360 - 22.5) {
      return '北 ' + speedd + 'm/s';
    } else if (dird >= 22.5 && dird < 90 - 22.5) {
      return '东北 ' + speedd + 'm/s';
    } else if (dird >= 90 - 22.5 && dird < 90 + 22.5) {
      return '东' + speedd + 'm/s';
    } else if (dird >= 90 + 22.5 && dird < 180 - 22.5) {
      return '东南 ' + speedd + 'm/s';
    } else if (dird >= 180 - 22.5 && dird < 180 + 22.5) {
      return '南' + speedd + 'm/s';
    } else if (dird >= 180 + 22.5 && dird < 270 - 22.5) {
      return '西南 ' + speedd + 'm/s';
    } else if (dird >= 270 - 22.5 && dird < 270 + 22.5) {
      return '西 ' + speedd + 'm/s';
    } else {
      return '西北' + speedd + 'm/s';
    }
  },
  //关闭释放
  disable: function () {
    this.timeDom.hide();
    this.visualDom.hide();
    viewer && viewer.mars.popup.close();
  },
  //每个窗口创建完成后调用
  winCreateOK: function(opt, result) {
    viewer && viewer.mars.popup.close();
    if (opt.name === 'main') {
      this.viewWindow = result;
    } else if (opt.name === 'time') {
      this.timeWindow = result;
      this.timeDom = $(opt._dom);
      this.timeDom.hide();

    } else if (opt.name === 'visualmap') {
      this.visualWin = result;
      this.visualDom = $(opt._dom);

    }
  },


  loadShenZhenData: function(isC) {

    $('#loading').show();

    if (isC) {
      this.viewer.camera.setView({
        destination: Cesium.Cartesian3.fromDegrees(114, 22, 3010000),
      });
    }
    var viewer = this.viewer;
    this.clearContourPolygon();
    if (this.heatmapLayer) {
      viewer.imageryLayers.remove(this.heatmapLayer);
    }
    if (this.oceanLayer) {
      this.viewer.imageryLayers.remove(this.oceanLayer);
    }
    this.heatmapLayer = null;
    var self = this;
    //  this.timeDom.show();
    // this.visualDom.show();

    // setTimeout(function () {
    //      self.timeWindow.resizeTime();
    // },100)
    this.isshenz = true;
    if (this.divpoint) {
      this.divpoint.destroy();
      this.divpoint = null;
    }
    var self = this;
    var viewer = this.viewer;

    var timeparams = this.viewWindow.getTimeConfig();

    if (timeparams.ed) {
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

      this.timeDom.css("background-color","#26354F")  
      
      this.timeDom.show();
      this.timeWindow.updateTimeArray(dates);
      setTimeout(function() {
        self.timeWindow.resizeTime();
      }, 200);


    } else {
      this.timeDom.hide();
      this.updateDate(timeparams.sd + ' ' + timeparams.sh);
    }

  },

  loadGlobal: function() {
    this.timeDom.hide();
    // $('#loading').show();
    this.clearContourPolygon();

    viewer.camera.setView({
      destination: Cesium.Cartesian3.fromDegrees(114, 22, 6110000),
    });

    if (this.heatmapLayer) {
      viewer.imageryLayers.remove(this.heatmapLayer);
    }
    if (this.oceanLayer) {
      this.viewer.imageryLayers.remove(this.oceanLayer);
    }
    this.heatmapLayer = null;
    this.isshenz = false;
    if (this.divpoint) {
      this.divpoint.destroy();
      this.divpoint = null;
    }
    var self = this;
    this.getOceanData( function (result) {
      var info = self.getSpeedFW(result);
      self.windyLayer.updateOptions(self.colorScaleSZWindy, info[0], info[1], 12000);
      self.windyLayer.setData(result);
      //    self.visualWin.loadcharts(self.colorRange,self.colorScalePiece);
    });
     
     this.loadContourPolygonGlobal();
  },

  getOceanData:function(fun){
    getFromCache("oceandata").then(function(val){
        if(!val) {
            $.getJSON("/visualization/data/ocean/oceandata.json", function (result) {
                setToCache("oceandata",JSON.stringify(result))
                fun(result);
            })
        }else{
            // console.log("get   ocean data from local cache:",val.length);
            var result=JSON.parse(val);
            fun(result);
        }
     })
  },

  isInGD: function(r1) {
    var r2 = [109, 12, 119, 26];
    return !(((r1[2] < r2[0]) || (r1[1] > r2[3])) ||
      ((r2[2] < r1[0]) || (r2[1] > r1[3])));

  },


  updateZoomStatus: function() {

    if (!this.isActive) {
      return;
    }


    var viewer = this.viewer;

    let height = Math.ceil(viewer.camera.positionCartographic.height);

    var A = 40487.57;
    var B = 0.00007096758;
    var C = 91610.74;
    var D = -40467.74;
    var zoom = Math.round(D + (A - D) / (1 + Math.pow(height / C, B)));

    var DEGPRAD = 180 / Math.PI;
    var rect = viewer.camera.computeViewRectangle();
    var extent84 = [rect.west * DEGPRAD, rect.south * DEGPRAD, rect.east * DEGPRAD, rect.north * DEGPRAD];


    if(height<800000&&this.isInGD(extent84)){
      if(!this.isshenzpart) {
          this.isshenzpart = 1;
          this.viewWindow.selectSZ(1);
          this.loadShenZhenData();
      }

   }else  if (height < 3120000 && (!this.isshenz||this.isshenzpart)&&this.isInGD(extent84)) {
       this.isshenzpart=0;
       this.viewWindow.selectSZ(1);
      this.loadShenZhenData();

   }  else if (height > 4010000 && this.isshenz) {

      this.viewWindow.selectSZ(0);
      this.loadGlobal();

    }

    if (this.windyLayer) {
      var v = 1 / (60010000 / height); //根据视图高度控制线的长度
      if (!this.isshenz) {
        v = 1 / (12010000 / height);
      }else{
        if(height<50000){ 
          // console.log(height,'height')
            v=1/(30010000/height);
        }else{
          // console.log(height,'height')
            v=1/(20010000/height);
        }
      }
      this.windyLayer.updateOptionVilaty(v);
      // if(height<10000){
      //     this.windyLayer.updateOptionVilaty(1/1280);
      // }else if(height<30000){
      //     this.windyLayer.updateOptionVilaty(1/640);
      // }else if(height<110000){
      //     this.windyLayer.updateOptionVilaty(1/240);
      // }else if(height<510000){
      //     this.windyLayer.updateOptionVilaty(1/120);
      // }else if(height<1110000){
      //     this.windyLayer.updateOptionVilaty(1/20);
      // }else if(height<3120000){
      //     this.windyLayer.updateOptionVilaty(1/10);
      // }else if(height<6120000){
      //     this.windyLayer.updateOptionVilaty(1/5);
      // }
    }
  },

  stopWindLayer: function() {

    if (this.windyLayer) {
      this.windyLayer.stop();
    }
  },

  startWindLayer: function() {

    if (this.windyLayer) {
      this.windyLayer.start();
    }
  },

  //打开激活
  activate: function(opt, result) {

    this.colorRange=[];
     var scale=1.2/(this.colorScalePiece.length+1);
    for(var i=0;i<this.colorScalePiece.length+1;i++){
      this.colorRange[i]=scale*i;
    }
    var self = this;
    var viewer = this.viewer;

    viewer.terrainProvider = new Cesium.EllipsoidTerrainProvider(); 
    this.isActive = true;

    viewer.camera.setView({
      destination: Cesium.Cartesian3.fromDegrees(114, 22, 6110000),
    });

    viewer.camera.changed.addEventListener(this.updateZoomStatus,this );

    this.isshenz = false;
    var viewer = this.viewer;
    var self = this;


    $('#loading').show();


    var camera = viewer.camera;
  //  this.stopWindLayer.bind(this);

    camera.moveStart.addEventListener(this.stopWindLayer,this);
  //  this.startWindLayer.bind(this);
    camera.moveEnd.addEventListener(this.startWindLayer,this);


    if (!this._handler) { //监听地图点击事件，点击是空的时候，返回上一层级
      this._handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
      this._handler.setInputAction(function(event) {

        var pick = viewer.scene.pick(event.position);


        if (Cesium.defined(pick) && (pick.id)) {
          var id = pick.id.id;

          if (id === 'sz_region' && !self.isshenz) {

            self.isshenz = true;
            self.viewWindow.selectSZ(1);
            self.loadShenZhenData(true);
          } else {
            self.timeWindow.stop();
            if (self.divpoint) {
              self.divpoint.destroy();
              self.divpoint = null;
            }
            var ellipsoid = viewer.scene.globe.ellipsoid;
            // Mouse over the globe to see the cartographic position
            var cartesian = viewer.camera.pickEllipsoid(event.position, ellipsoid);
            if (cartesian) {
              var cartographic = ellipsoid.cartesianToCartographic(cartesian);
              var lon = Cesium.Math.toDegrees(cartographic.longitude);
              var lat = Cesium.Math.toDegrees(cartographic.latitude);
              if (self.windyLayer) {
                var val = self.windyLayer.getValue(lon, lat);

                if (val) {

                  self.divpoint = new mars3d.DivPoint(viewer, {
                    html: `<div class='speed-pophtml'>
                            <div class='speed-pop-row'><span>流向</span><span>${self.getFengXiang(val.u, val.v)}</span></div>
                            <div class='speed-pop-row'><span>经度</span><span>${lon.toFixed(6)}</span></div>
                            <div class='speed-pop-row'><span>纬度</span><span>${lat.toFixed(6)}</span></div>
                            <div class='speed-pop-row'><span>时间</span><span>${self.showLunboDate}</span></div>
                            </div>`,
                    position: Cesium.Cartesian3.fromDegrees(lon, lat, 0),
                    anchor: [0, 0],
                  });


                }

              }
            }
          }
        } else {
          if (self.divpoint) {
            self.divpoint.destroy();
            self.divpoint = null;
          }
          var ellipsoid = viewer.scene.globe.ellipsoid;
          // Mouse over the globe to see the cartographic position
          var cartesian = viewer.camera.pickEllipsoid(event.position, ellipsoid);
          if (cartesian) {
            var cartographic = ellipsoid.cartesianToCartographic(cartesian);
            var lon = Cesium.Math.toDegrees(cartographic.longitude);
            var lat = Cesium.Math.toDegrees(cartographic.latitude);
            if (self.windyLayer) {
              var val = self.windyLayer.getValue(lon, lat);

              if (val) {

                self.divpoint = new mars3d.DivPoint(viewer, {
                  // html: '<div class="divpoint2">' +
                  //   ' <div class="title">流向：' + self.getFengXiang(val.u, val.v) + '</div>' +
                  //   ' <div class="content">经度:' + lon.toFixed(6) + '<br/> 纬度:' + lat.toFixed(6) + '</div>' +
                  //   ' </div >',
                  html: `<div class='speed-pophtml'>
                    <div class='speed-pop-row'><span>流向</span><span>${self.getFengXiang(val.u, val.v)}</span></div>
                    <div class='speed-pop-row'><span>经度</span><span>${lon.toFixed(6)}</span></div>
                    <div class='speed-pop-row'><span>纬度</span><span>${lat.toFixed(6)}</span></div>
                    </div>`,
                  position: Cesium.Cartesian3.fromDegrees(lon, lat, 0),
                  anchor: [0, 0],
                });


              }

            }
          }
        }

      }, Cesium.ScreenSpaceEventType.LEFT_CLICK);


    }

    $.getJSON('/visualization/data/ocean/sz_region.json', function(result) {
      var features = result.features;
      features.forEach(function(feature) {


        var coordinates = feature.geometry.coordinates[0];
        if (feature.geometry.type === 'MultiPolygon') {
          coordinates = coordinates[0];
        }
        var ps = [];
        var psturf = [];
        coordinates.forEach(function(point) {
          ps.push(point[0]);
          ps.push(point[1]);
          psturf.push(point);
        });
        var polygon = turf.polygon([psturf]);
        var center = turf.centerOfMass(polygon);
        var polygon = viewer.entities.add({
          id: 'sz_region',
          // polygon: {
          //     hierarchy: Cesium.Cartesian3.fromDegreesArray(ps),
          //     material: Cesium.Color.YELLOW.withAlpha(0.6),
          //     classificationType: Cesium.ClassificationType.BOTH,
          //     outline: true,
          //     outlineWidth: 1,
          //     outlineColor: Cesium.Color.BLUE,
          // },
          // polyline: {
          //     positions: Cesium.Cartesian3.fromDegreesArray(ps),
          //     width: 1,
          //     material: Cesium.Color.BLACK,
          //     clampToGround: true,
          //     classificationType: Cesium.ClassificationType.BOTH
          // },
          position: Cesium.Cartesian3.fromDegrees(center.geometry.coordinates[0], center.geometry.coordinates[1], 80),

          label: {
            text: '深圳市',
            font: '14pt Source Han Sans CN', //字体样式
            fillColor: Cesium.Color.WHITE, //字体颜色
            backgroundColor: Cesium.Color.BLUE, //背景颜色
            showBackground: true, //是否显示背景颜色
            style: Cesium.LabelStyle.FILL, //label样式
            outlineWidth: 2,
            scaleByDistance: new Cesium.NearFarScalar(20000, 1, 400000, 0.4),
            classificationType: Cesium.ClassificationType.BOTH,
            verticalOrigin: Cesium.VerticalOrigin.CENTER, //垂直位置
            horizontalOrigin: Cesium.HorizontalOrigin.LEFT, //水平位置
            pixelOffset: new Cesium.Cartesian2(10, 0),
          },
        });

        self.showEntities.push(polygon);


      });

    });

    this.getOceanData(function(result){
    // $.getJSON('/visualization/data/ocean/oceandata.json', function(result) {


      var data = [];
      var info = self.getSpeedFW(result);

      // var gradient = [];
      // for (var i = 0; i < self.colorScale.length; i++) {
      //     gradient[i] = self.colorScale[i];
      // }
      //
      //
      // var per = (info[1] - info[0]) / (self.colorScale.length - 1);
      //
      // for (var i = 0; i < data.length; i++) {
      //     data[i].v = parseInt((data[i].v - info[0]) / per);
      // }
      //
      //
      // var heatLayer = createHeatmapImageryProvider(Cesium, {
      //     //min: min, max: max, //可自定义热力值范围，默认为数据中的最大最小值
      //     data: data,
      //     heatmapoptions: {//参阅api：https://www.patrick-wied.at/static/heatmapjs/docs.html
      //         radius: 12,
      //         minOpacity: 0.5,
      //         xField: 'x',
      //         yField: 'y',
      //         gradient: gradient,
      //         valueField: 'v'
      //     }
      // });
      // self.heatmapLayer = viewer.imageryLayers.addImageryProvider(heatLayer);


      const windOptions = {
        colorScale: self.colorScaleSZWindy,
        minVelocity: info[0],
        maxVelocity: info[1],
        lineWidth: 1,

        maxAge: 10,
        // particleMultiplier: 1 / 300, // TODO: PATHS = Math.round(width * height * particleMultiplier);

        frameRate: 100,
        globalAlpha: 0.9,
        velocityScale: 1 / 1,
        useCoordsDraw: true,
        paths: 12000,  //控制线条个数 流线的稀疏 太大会影响性能
      };


      const windLayer = new CesiumWind.WindLayer(result, { windOptions });
      windLayer.addTo(viewer);
      self.windyLayer = windLayer;


      self.visualWin.loadcharts(self.colorRange, self.colorScalePiece);

    });

    this.loadContourPolygonGlobal();


  },


  getSpeedFW: function(result, data) {
    var ua = result[0].data;
    var va = result[1].data;
    var header = result[0].header;

    var minx = header.lo1;
    var maxy = header.la1;
    var dx = header.dx;
    var rows = header.nx;
    var cols = header.ny;

    var min = 100;
    var max = -100;


    for (var i = 0; i < ua.length; i++) {
      var u = ua[i];
      var v = va[i];

      if (u != null && v != null) {

        var speed = this.getSpeed(u, v);
        min = Math.min(speed, min);
        max = Math.max(speed, max);

        if (data) {
          var row = i % rows;
          var col = parseInt(i / rows);

          var lon = minx + row * dx;
          var lat = maxy - col * dx;
          data.push({ x: lon, y: lat, v: speed });
        }

      }
    }
    return [min, max];

  },


  updateDate: function(date) {
    // console.log('get date:', date);
    this.showLunboDate = date;
    var self = this;
    var viewer = this.viewer;

    if(!this.isActive){
      return;
  }

    // $.ajax({
    //     type: "GET",
    //     url: "/visualization/data/ocean/ocean_flow.csv",
    //     dataType: "text",
    //     success: function (data) {
    //         var allTextLines = data.split(/\r\n|\n/);
    //         var headers = allTextLines[0].split(',');
    //         for (var i = 1; i < allTextLines.length; i++) {
    //             var data = allTextLines[i].split(',');
    //             if (data.length == headers.length) {
    //                 var lon = parseFloat(data[0].replaceAll("\"", ""));
    //                 var lat = parseFloat(data[1].replaceAll("\"", ""));
    //                 var speed=parseFloat(data[4].replaceAll("\"", ""));
    //
    //                 var entity = viewer.entities.add({
    //                     position: Cesium.Cartesian3.fromDegrees(lon, lat, 10),
    //                     point: { //点
    //                         pixelSize: 10,
    //                         color:new Cesium.Color.fromCssColorString('#0000f0'),
    //                         HeightReference: 0,
    //                          popup:{
    //                                 html:"<p>浪高："+speed+" </p><p>经度:"+lon+"</p><p>纬度:"+lat+"</p>"
    //                          }
    //                     }
    //                 });
    //             }
    //         }
    //     }
    // });


    // $.ajax({
    //   type:'get',
    //   url:'/OceanServer/overspeed?date=' + date,
    //   data:{},
    //   dataType:'json',
    //   success:function(result){
    //     console.log(result)
    //     if (result.data) {
    //       var info = [result.min, result.max];
    //       var data = JSON.parse(result.data);
    //       var datacon = JSON.parse(result.datacon);
    //       self.windyLayer.updateOptions(self.colorScaleSZWindy, info[0], info[1], 4000);
    //       self.windyLayer.setData(data);
    //       // self.visualWin.loadcharts(info[0], info[1], self.colorScaleSZ);
    //       self.loadContourPolygon(info, datacon);
    //     }
    //   },
    //   error:function(XMLHttpRequest,textStatus,errorThrown){
    //     // console.log(XMLHttpRequest,textStatus,errorThrown)
    //     if(XMLHttpRequest.status >=500 &&  XMLHttpRequest.status < 600){
    //       alert("无数据！")
    //     }
    //     $('#loading').hide()
    //   }
    // })

    this.getSZOceanData(date,function (result) {

      if(result.data) {


          if(!self.isActive){
            return;
        }
          var info = [result.min,result.max];



          var data=JSON.parse(result.data);
          var datacon=JSON.parse(result.datacon);
          self.windyLayer.updateOptions(self.colorScaleSZWindy, info[0], info[1], 4000);
          self.windyLayer.setData(data);
       //   self.visualWin.loadcharts(self.colorRange,self.colorScalePiece);
          self.loadContourPolygon(info,datacon);
      }
    });

  },

  getSZOceanData:function(date,fun){
    var self = this;
    getFromCache("szoceandata_"+self.isshenzpart+"_"+date).then(function(val){

        if(!val) {
            $.ajaxSetup({
                timeout: 60*1000
            });
            $.getJSON("/OceanServer/overspeed?date="+date+"&type="+self.isshenzpart, function (result) {
              // console.log(result)
                setToCache("szoceandata_"+self.isshenzpart+"_"+date,JSON.stringify(result))
                fun(result);
            }).fail(function() {
                $("#loading").hide();
                self.windyLayer.remove();
                toastr.info('获取数据失败');
            });
        }else{
            // console.log("get sz ocean data from local cache:",val.length);
            var result=JSON.parse(val);
            // console.log(result)
            fun(result);
        }

    })

},


  getColorByValue: function(v) {
    var colorrange = this.colorRange

    for (var i = 1; i < colorrange.length; i++) {
      if (colorrange[i] > v) {
        return this.colorScalePiece[i - 1];
      }
    }


    return this.colorScalePiece[this.colorScalePiece.length - 1];

  },


  getOceanPolygon:function(fun){
    getFromCache("oceandatacontoure11").then(function(val){

        if(!val) {
            $.getJSON("/visualization/data/ocean/oceandata-wave-polygon.json", function (result) {
                // setToCache("oceandatacontoure",JSON.stringify(result))
                fun(result);
            });
        }else{
            // console.log("get   ocean contoure data from local cache:",val.length);
            var result=JSON.parse(val);
            fun(result);
        }

    })
  },


  hexToRgb:function(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : {r:0,g:0,b:0};
},
getColorRamp:function(color, isVertical = true) {
    let ramp = document.createElement('canvas');
    ramp.width = isVertical ? 1 : 100;
    ramp.height = isVertical ? 100 : 1;
    let ctx = ramp.getContext('2d');


    let grd = isVertical ? ctx.createLinearGradient(0, 0, 0, 100) : ctx.createLinearGradient(0, 0, 100, 0);
    let c=this.hexToRgb(color);
    grd.addColorStop(0, 'rgba('+c.r+','+c.g+','+c.b+',0.3)');
   // grd.addColorStop(0.2, 'rgba('+c.r+','+c.g+','+c.b+',0.5)');
  //  grd.addColorStop(0.4, 'rgba('+c.r+','+c.g+','+c.b+',0.7)');
    grd.addColorStop(0.5, 'rgba('+c.r+','+c.g+','+c.b+',1.0)');
   // grd.addColorStop(0.6, 'rgba('+c.r+','+c.g+','+c.b+',0.7)');
   // grd.addColorStop(0.8, 'rgba('+c.r+','+c.g+','+c.b+',0.5)');
    grd.addColorStop(1, 'rgba('+c.r+','+c.g+','+c.b+',0.3)');

    ctx.globalAlpha = 1.0;
    ctx.fillStyle = grd;
    if (isVertical)
        ctx.fillRect(0, 0, 1, 100);
    else
        ctx.fillRect(0, 0, 100, 1);

    return ramp;
},


  loadContourPolygonGlobal: function() {


    var self = this;

    this.clearContourPolygon();


    var rectangle = Cesium.Rectangle.fromDegrees(-180, -90, 180, 90);
    this.oceanLayer = viewer.imageryLayers.addImageryProvider(new Cesium.SingleTileImageryProvider({
      url: '/visualization/data/ocean/ocean.png',
      rectangle: rectangle,
    }));
    // console.log("add sz ocean");
    var self = this;
    $('#loading').hide();//加载时间长优化
    this.getOceanPolygon(function(result){
      // console.log('测试数据',result)
    // $.getJSON('/visualization/data/ocean/oceandata-wave-polygon.json', function(result) {
      var features = result.features;
      // console.log(features.length,'nihaolength')
      features.forEach(function(feature) {

        var coordinates = feature.geometry.coordinates[0];
        if (feature.geometry.type === 'MultiPolygon') {
          coordinates = coordinates[0];
        }
        var ps = [];

        coordinates.forEach(function(point) {
          ps.push(point[0]);
          ps.push(point[1]);

        });

        var holses = [];

        for (var i = 1; i < feature.geometry.coordinates.length; i++) {
          var pp = [];
          coordinates = feature.geometry.coordinates[i];
          coordinates.forEach(function(point) {
            pp.push(point[0]);
            pp.push(point[1]);

          });


          holses.push(Cesium.Cartesian3.fromDegreesArray(ps));
        }


        var hvalue = feature.properties.hvalue;
        var color = self.getColorByValue(hvalue);
        var polygon = viewer.entities.add({
          polygon: {
            hierarchy: new Cesium.PolygonHierarchy(Cesium.Cartesian3.fromDegreesArray(ps), holses),
            material: new Cesium.ImageMaterialProperty({
              image: self.getColorRamp(color, false),
              // color: Cesium.Color.WHITE.withAlpha(0.1)
          }),// Cesium.Color.fromCssColorString(color).withAlpha(0.6),
            classificationType: Cesium.ClassificationType.BOTH,
            outline: false,
          },

        });

        self.contoursPolygon.push(polygon);
        // $('#loading').hide();//加载时间长优化

      });


    });


  },


  loadContourPolygon: function(info, data) {
    if(!this.isActive)
    {
        return;
    }

    var self = this;
    var per = (info[1] - info[0]) / (this.colorScaleSZ.length - 1);
    //

    this.clearContourPolygon();

    
    if(this.isshenzpart){
      var rectangle = Cesium.Rectangle.fromDegrees(113, 21.75, 115, 23.04);
      this.oceanLayer = viewer.imageryLayers.addImageryProvider(new Cesium.SingleTileImageryProvider({
        url: this.path + '/data/szoceans.png',
          rectangle: rectangle
      }))
  }else {
    var rectangle=Cesium.Rectangle.fromDegrees(105.67477,13.13128551,127.684787,28.323631);
     this.oceanLayer = viewer.imageryLayers.addImageryProvider(new Cesium.SingleTileImageryProvider({
      url: this.path + '/data/szocean.png',
      rectangle: rectangle,
    }));
  }
    var features = data.features;
    
    features.forEach(function(feature) {

      

      var coordinates = feature.geometry.coordinates[0];
      if (feature.geometry.type === 'MultiPolygon') {
        coordinates = coordinates[0];
      }
      var ps = [];

      coordinates.forEach(function(point) {
        ps.push(point[0]);
        ps.push(point[1]);

      });

      var holses = [];

      for (var i = 1; i < feature.geometry.coordinates.length; i++) {
        var pp = [];
        coordinates = feature.geometry.coordinates[i];
        coordinates.forEach(function(point) {
          pp.push(point[0]);
          pp.push(point[1]);

        });

        
        holses.push({
          positions: Cesium.Cartesian3.fromDegreesArray(pp)
         });
      }

     

      var hvalue = feature.properties.hvalue;
      var color = self.getColorByValue(hvalue);
      
      if(color!=self.colorScalePiece[0]) {
        var polygon = viewer.entities.add({
          polygon: {
            hierarchy: new Cesium.PolygonHierarchy(Cesium.Cartesian3.fromDegreesArray(ps), holses),
            material: new Cesium.ImageMaterialProperty({
              image: self.getColorRamp(color, false),
              // color: Cesium.Color.WHITE.withAlpha(0.1)
          }),// Cesium.Color.fromCssColorString(color).withAlpha(0.6),
            classificationType: Cesium.ClassificationType.BOTH,
            outline: false
          }

        });

        self.contoursPolygon.push(polygon);
     }
      $('#loading').hide();

    });

   /* var geojsonOptions = {
    //  clampToGround: true,
    };

    var dataPromise = Cesium.GeoJsonDataSource.load(data, geojsonOptions);

    dataPromise.then(function(dataSource) {
      var entities = dataSource.entities.values;
      for (var i = 0; i < entities.length; i++) {
        var entity = entities[i];
        var hvalue = entity.properties.hvalue;
        var color = self.getColorByValue(hvalue);
      //  entity.polygon.classificationType= Cesium.ClassificationType.BOTH;
        //  console.log(hvalue._value,info,parseInt((hvalue - info[0]) / per),per);
        entity.polygon.material = Cesium.Color.fromCssColorString(color).withAlpha(0.6);
        entity.polygon.zIndex=entity.properties.hvalue*10;
        entity.polygon.height=entity.properties.hvalue/100;
        entity.polygon.outline=false;
       
        self.viewer.entities.add(entity);
        self.contoursPolygon.push(entity);
      }

      $('#loading').hide();

    });*/

    // $.getJSON("/visualization/data/ocean/szoceandata-flow-polygon.json", function (result) {
    //
    //     var features=result.features;
    //     features.forEach(function(feature) {
    //         var coordinates = feature.geometry.coordinates[0];
    //         if (feature.geometry.type === 'MultiPolygon') {
    //             coordinates = coordinates[0];
    //         }
    //         var ps = [];
    //
    //         coordinates.forEach(function (point) {
    //             ps.push(point[0]);
    //             ps.push(point[1]);
    //
    //         })
    //         var color=self.colorScaleSZ[parseInt((feature.properties.hvalue - info[0]) / per)];
    //
    //         var polygon = viewer.entities.add({
    //             polygon: {
    //                 hierarchy: Cesium.Cartesian3.fromDegreesArray(ps),
    //                 material: Cesium.Color.fromCssColorString(color).withAlpha(0.6),
    //                 classificationType: Cesium.ClassificationType.BOTH,
    //                 outline: true,
    //                 outlineWidth: 1,
    //                 outlineColor: Cesium.Color.BLUE,
    //             }
    //         });
    //
    //            self.contoursPolygon.push(polygon);
    //     });
    //
    // });
  },


  clearContourPolygon: function() {
    this.contoursPolygon.forEach(function(entity) {
      this.viewer.entities.remove(entity);
    });
    this.contoursPolygon = [];
    if(this.oceanLayer) {
        this.viewer.imageryLayers.remove(this.oceanLayer);
    }
  this.oceanLayer=null;
  },
  /*
   清除 div容器  清除 echarts
   */
  clearMap: function() {
    var self = this;
    this.showEntities.forEach(function(entity) {
      this.viewer.entities.remove(entity);
    });
    this.clearContourPolygon();

    this.showEntities = [];

    if (this.heatmapLayer) {
      this.viewer.imageryLayers.remove(this.heatmapLayer);
    }

    if (this.oceanLayer) {
      this.viewer.imageryLayers.remove(this.oceanLayer);
      // console.log("remove sz ocean");
    }
    this.heatmapLayer = null;

    if (this.windyLayer) {

      this.windyLayer.remove();
    }
    this.windyLayer = null;
    if (this.divpoint) {
      this.divpoint.destroy();
      this.divpoint = null;
    }

  },
  //关闭释放
  disable: function() {
    this.isActive = false;
    this.viewer.camera.changed.removeEventListener(this.updateZoomStatus,this );

    this.clearMap();
    this.viewer.camera.moveStart.removeEventListener(this.stopWindLayer,this);

    this.viewer.camera.moveEnd.removeEventListener(this.startWindLayer,this);
    if (this._handler) {
      this._handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK);
      this._handler = null;
    }
    this.viewWindow = null;


  },
}));
