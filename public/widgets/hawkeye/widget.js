/* 2017-9-28 16:04:33 | 修改 木遥（QQ：516584683） */
//此方式：弹窗非iframe模式
mars3d.widget.bindClass(
  mars3d.widget.BaseWidget.extend({
    viewer: null, //框架会自动对map赋值
    options: {
      resources: ['view.css', `leaflet.js`],
      //弹窗
      view: {
        type: 'append',
        url: 'view.html',
      },
    },
    //初始化[仅执行1次]
    create: function() {},
    //每个窗口创建完成后调用
    winCreateOK: function(opt, result) {
      //此处可以绑定页面dom事件
      this.initmap();
    },
    //激活插件
    activate: function() {
      this.show();
      // toastr.info('激活插件hawkeye');
    },
    //释放插件
    disable: function() {
      //   toastr.info('释放插件hawkeye');
      if (this.mapEle) {
        this.hide();
        this.viewer.scene.postRender.removeEventListener(this.sceneRenderHandler, this);
      }
    },
    initmap: function() {
      if (this.mapEle) {
        this.viewer.scene.postRender.addEventListener(this.sceneRenderHandler, this);
        return;
      }
      this.mapEle = window.document.createElement('div');
      this.mapEle.setAttribute('id', 'map2d');
      this.mapEle.style.height = '150px';
      this.mapEle.style.width = '200px';
      this.mapEle.style.position = 'absolute';
      this.mapEle.style.bottom = '30px';
      this.mapEle.style.right = '60px';
      this.mapEle.style.border = '4px solid midnightblue';
      document.body.appendChild(this.mapEle);
      // this.mapEle = document.getElementById("map2d"),
      this.showStyle = {
        color: '#0B74FF',
        weight: 1,
        fill: !0,
        stroke: !0,
        opacity: 1,
      };
      this.hideStyle = { fill: !1, opacity: 0 };
      this.map = L.map('map2d', {
        center: [31.827107, 117.240601],
        zoom: 13,
        zoomControl: false,
        attributionControl: false,
      });
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {}).addTo(this.map);
      //智图灰色
      // L.tileLayer('http://webst02.is.autonavi.com/appmaptile?x={x}&y={y}&z={z}&lang=zh_cn&size=1&scale=1&style=8', {
      //  }).addTo(this.map),
      //高德影像
      /* L.tileLayer('https://webst02.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}', {
               }).addTo(this.map),*/
      //谷歌

      // L.tileLayer('http://mt1.google.cn/vt/lyrs=s&hl=zh-CN&x={x}&y={y}&z={z}&s=Gali', {}).addTo(this.map);

      //   L.tileLayer('/visualization/data/arcgis/satellite/{z}/{x}/{y}.jpg', {
      //     maxZoom: 20,
      //     tileSize: 256,
      //     subdomains: ['0', '1', '2', '3', '4', '5', '6', '7'],
      //   }).addTo(this.map);
      //智图深蓝
      /*   L.tileLayer('/mapserver/arcgis/rest/services/ChinaOnlineStreetPurplishBlue/MapServer', {
             }).addTo(this.map),*/
      //智图深蓝
      /*  L.tileLayer('http://map.geoq.cn/arcgis/rest/services/ChinaOnlineStreetPurplishBlue/MapServer?f=jsapi', {
                }).addTo(this.map),*/

      this.viewer.scene.postRender.addEventListener(this.sceneRenderHandler, this);
    },
    sceneRenderHandler: function(e) {
      var ext = this.getExtent(this.viewer),
        i = L.latLng(ext.ymin, ext.xmin),
        s = L.latLng(ext.ymax, ext.xmax),
        bounds = L.latLngBounds(i, s);
      if (
        (this.rectangle
          ? this.rectangle.setBounds(bounds)
          : (this.rectangle = L.rectangle(bounds, this.showStyle).addTo(this.map)),
        -180 == ext.xmin && 180 == ext.xmax && 90 == ext.ymax && -90 == ext.ymin)
      ) {
        var center = this.getCenter(this.viewer);
        this.map.setView([center.y, center.x], 0), this.rectangle.setStyle(this.hideStyle);
      } else {
        var oBounds = bounds.pad(0.5);
        this.map.fitBounds(oBounds), this.rectangle.setStyle(this.showStyle);
      }
    },
    hide: function() {
      this.mapEle && (this.mapEle.style.display = 'none');
    },
    show: function() {
      this.map && this.mapEle && (this.mapEle.style.display = 'block');
    },
    setStyle: function(e) {
      e && (this.showStyle = e);
    },
    destroy: function() {
      // console.log('ppppppppppppppppp');
      if (this.mapEle) {
        document.getElementsByTagName('body').removeChild(this.mapEle);
      }
      this.viewer.camera.changed.removeEventListener(this.sceneRenderHandler, this);
    },
    getExtent: function(viewer) {
      var rectangle = viewer.camera.computeViewRectangle(),
        result = this.getMinMax(rectangle);
      if (result.xmax < result.xmin) {
        var s = result.xmax;
        (result.xmax = result.xmin), (result.xmin = s);
      }
      if (result.ymax < result.ymin) {
        var s = result.ymax;
        (result.ymax = result.ymin), (result.ymin = s);
      }
      return result;
    },
    getMinMax: function(rectangle) {
      var t = Number(Cesium.Math.toDegrees(rectangle.west)).toFixed(6),
        i = Number(Cesium.Math.toDegrees(rectangle.east)).toFixed(6),
        n = Number(Cesium.Math.toDegrees(rectangle.north)).toFixed(6);
      return {
        xmin: t,
        xmax: i,
        ymin: Number(Cesium.Math.toDegrees(rectangle.south)).toFixed(6),
        ymax: n,
      };
    },
    getCenter: function(viewer) {
      var scene = viewer.scene,
        pos = this.getPos(scene),
        position = pos;
      if (!position) {
        var globe = scene.globe,
          cartographic = scene.camera.positionCartographic.clone(),
          height = globe.getHeight(cartographic);
        (cartographic.height = height || 0),
          (cartesian = Cesium.Ellipsoid.WGS84.cartographicToCartesian(cartographic));
      }
      var result = this.toCartographic(position);
      var d = Cesium.Cartesian3.distance(position, viewer.scene.camera.positionWC);
      return (result.cameraZ = d), result;
    },
    getPos(scene) {
      var canvas = scene.canvas,
        center = new Cesium.Cartesian2(canvas.clientWidth / 2, canvas.clientHeight / 2),
        ray = scene.camera.getPickRay(center);
      return scene.globe.pick(ray, scene) || scene.camera.pickEllipsoid(center);
    },
    toCartographic: function(cartesian) {
      var cartographic = Cesium.Cartographic.fromCartesian(cartesian),
        result = {};
      return (
        (result.y = Number(Cesium.Math.toDegrees(cartographic.latitude)).toFixed(6)),
        (result.x = Number(Cesium.Math.toDegrees(cartographic.longitude)).toFixed(6)),
        (result.z = Number(cartographic.height).toFixed(2)),
        result
      );
    },

    // 在此点击之后触发插件
  }),
);
