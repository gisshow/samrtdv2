/* 2017-12-7 13:23:59 | 修改 木遥（QQ：516584683） */
//模块：
var public_image_path = '';

// if (location.href.indexOf('/visualization') > -1) {
//   public_image_path = '/visualization';
// }
const { publicPath } = window;
if (publicPath) {
  if (publicPath.endsWith('/')) {
    public_image_path = publicPath.substring(0, publicPath.length - 1);
  } else {
    public_image_path = publicPath;
  }
}
var entityList = [];
var clickTime = 1;
var widget_queryBaiduPOI = mars3d.widget.bindClass(
  mars3d.widget.BaseWidget.extend({
    map: null, //框架会自动对map赋值
    options: {
      resources: ['view.css'],
      //直接添加到index
      view: {
        type: 'append',
        url: 'view.html',
        parent: 'body',
      },
    },
    configBaidu: {
      key: ['4j0HA8IeuvAPCl62ni8xCZkBhc2YGr67'],
      tipsUrl: '/gw/COMMON/search/prev', //"url": "/vb/poi/ns/list",
      url: '/gw/COMMON/addrMatch',
      region: '全国',
    },
    //初始化[仅执行1次]
    create: function() {
      var that = this;

      //单击事件
      this.handler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);

      $.getJSON(this.path + 'config.json', function(data) {
        that.configBaidu = data;
      });
    },
    //每个窗口创建完成后调用
    winCreateOK: function(opt, result) {
      if (opt.type != 'append') return;

      var that = this;

      var img = $('#map-querybar img');
      img.each(function(index, item) {
        $(item).attr('src', that.path + $(item).attr('src'));
      });

      if (that.config.position) $('#map-querybar').css(that.config.position);
      if (that.config.style) $('#map-querybar').css(that.config.style);

      // 搜索框
      $('#txt_querypoi').click(function() {
        // 文本框内容为空
        if ($.trim($(this).val()).length == 0) {
          that.hideAllQueryBarView();
          that.showHistoryList(); // 显示历史记录
        }
      });

      // 搜索框绑定文本框值发生变化,隐藏默认搜索信息栏,显示匹配结果列表
      $('#txt_querypoi').bind('input propertychange', function() {
        that.hideAllQueryBarView();

        that.clearLayers();

        var queryVal = $.trim($('#txt_querypoi').val());
        if (queryVal.length == 0) {
          // 文本框内容为空,显示历史记录
          that.showHistoryList();
        } else {
          that.autoTipList(queryVal, true);
        }
      });

      // 点击搜索查询按钮
      $('#btn_querypoi').click(function() {
        that.hideAllQueryBarView();

        var queryVal = $.trim($('#txt_querypoi').val());
        that.strartQueryPOI(queryVal, true);
      });
      //绑定回车键
      $('#txt_querypoi').bind('keydown', function(event) {
        if (event.keyCode == '13') {
          $('#btn_querypoi').click();
        }
      });

      // 返回查询结果面板界面
      $('#querybar_detail_back').click(function() {
        that.hideAllQueryBarView();
        $('#querybar_resultlist_view').show();
      });
    },
    //打开激活
    activate: function() {
      var that = this;
      this.handler.setInputAction(function() {
        // 点击地图区域,隐藏所有弹出框
        if ($.trim($('#txt_querypoi').val()).length == 0) {
          that.hideAllQueryBarView();
          $('#txt_querypoi').blur();
        }
      }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
    },
    //关闭释放
    disable: function() {
      this.clearLayers();
      this.entityModel && viewer.entities.remove(this.entityModel) && (this.entityModel = null);
      this.handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK);
    },

    hideAllQueryBarView: function() {
      $('#querybar_histroy_view').hide();
      $('#querybar_autotip_view').hide();
      $('#querybar_detail_view').hide();
      $('#querybar_resultlist_view').hide();
    },

    // 点击面板条目,自动填充搜索框,并展示搜索结果面板
    autoSearch: function(name) {
      $('#txt_querypoi').val(name);
      $('#btn_querypoi').trigger('click');
    },

    _key_index: 0,
    getKey: function() {
      var thisidx = this._key_index++ % this.configBaidu.key.length;
      return this.configBaidu.key[thisidx];
    },
    //===================与后台交互========================

    //显示智能提示搜索结果

    autoTipList: function(text, queryEx) {
      //查询外部widget
      if (this.hasExWidget() && queryEx) {
        var qylist = this.autoExTipList(text);
        return;
      }
      //查询外部widget

      var key = this.getKey();
      var token = window.localStorage.getItem('token');
      $.ajax({
        url: this.configBaidu.tipsUrl,
        type: 'GET',
        headers: {
          'szvsud-license-key': window.localStorage.getItem('baseMapLicenseKey'),
        },
        dataType: 'json',
        timeout: '5000',
        contentType: 'application/json;utf-8',
        data: {
          keyword: text,
        },
        success: function(data) {
          if (data.code !== 200) {
            toastr.error('请求失败(' + data.status + ')：' + data.message);
            return;
          }
          var pois = data.data;

          var inhtml = '';
          for (var index = 0; index < pois.length; index++) {
            var name = pois[index].name;
            // var num = pois[index].num;
            // if (num > 0) continue;

            inhtml +=
              "<li onclick=widget_queryBaiduPOI.autoSearch('" +
              name +
              "')><i class='fa fa-search'></i>" +
              name +
              '</li>';
          }

          if (inhtml.length > 0 && $('#txt_querypoi').val().length > 0) {
            $('#querybar_ul_autotip').html(inhtml);
            $('#querybar_autotip_view').show();
          }
        },
        error: function(data) {
          toastr.error('请求出错(' + data.status + ')：' + data.statusText);
        },
      });
    },

    // 根据输入框内容，查询显示列表
    queryText: null,
    queryRegion: null,
    strartQueryPOI: function(text, queryEx) {
      if (text.length == 0) {
        toastr.warning('请输入搜索关键字！');
        return;
      }

      // TODO:根据文本框输入内容,从数据库模糊查询到所有匹配结果（分页显示）
      this.addHistory(text);

      this.hideAllQueryBarView();

      //查询外部widget
      if (this.hasExWidget() && queryEx) {
        var qylist = this.queryExPOI(text);
        return;
      }
      //查询外部widget

      this.thispage = 1;
      this.queryText = text;
      this.queryRegion = this.config.region || this.configBaidu.region;
      this.queryPOI();
    },
    queryPOIForCity: function(city) {
      this.thispage = 1;
      this.queryRegion = city;
      this.queryPOI();
    },
    queryPOI: function() {
      var that = this;
      var key = this.getKey();
      var token = window.localStorage.getItem('token');
      // 从数据库查询获取数据
      // http://10.253.102.69/gw/COMMON/addrMatch?ak=ebf48ecaa1fd436fa3d40c4600aa051f&query=万象城二期D栋&region=440300&page_num=1&page_size=10
      $.ajax({
        url: this.configBaidu.url,
        type: 'GET',
        dataType: 'json',
        timeout: '5000',
        headers: {
          'szvsud-license-key': window.localStorage.getItem('baseMapLicenseKey'),
        },
        contentType: 'application/json;utf-8',
        data: {
          ak: 'ebf48ecaa1fd436fa3d40c4600aa051f',
          query: this.queryText,
          region: 440300,
          page_num: this.thispage,
          page_size: this.pageSize,
        },

        success: function(data) {
          if (!that.isActivate) return;

          // 改造/gw/COMMON/addrMatch为/vb/entity/paa/search
          const ajax_response = data;
          let ajax_response_data = ajax_response.result;
          if (ajax_response_data) {
            ajax_response.data = {
              pageNo: this.thispage,
              pageSize: this.pageSize,
              pateTotal: ajax_response.total,
              total: 10,
              list: ajax_response_data.map(function({ name, location, cid }) {
                return {
                  entityId: cid,
                  geo: JSON.stringify({
                    type: 'Point',
                    coordinates: [location.lng, location.lat],
                  }),
                  name,
                  type: 'poi',
                };
              }),
            };
          }
          console.log('ajax_response', ajax_response);
          // return ajax_response;
          // http://10.253.102.69/vb/population/stat
          data = {
            success: true,
            code: 200,
            msg: '请求成功',
            data: ajax_response.data,
          };

          if (data.code !== 200) {
            toastr.error('请求失败(' + data.status + ')：' + data.message);
            return;
          }
          var pois = data.data.list;
          // if (pois && pois.length > 0 )
          //     that.workShowCitys.showResult(pois);
          // else
          that.showPOIPage(pois, data.data.total);
        },
        error: function(data) {
          toastr.error('请求出错(' + data.status + ')：' + data.statusText);
        },
      });
    },
    //===================大数据时，显示城市列表结果========================
    workShowCitys: {
      pageSize: 10,
      arrdata: [],
      counts: 0,
      allpage: 0,
      thispage: 0,
      showResult: function(data) {
        this.arrdata = data;
        this.counts = data.length;
        this.allpage = Math.ceil(this.counts / this.pageSize);
        this.thispage = 1;
        this.showPOIPage();
      },
      showPOIPage: function() {
        var inhtml = '';

        var startIdx = (this.thispage - 1) * this.pageSize;
        var endIdx = startIdx + this.pageSize;
        if (endIdx >= this.counts) {
          endIdx = this.counts;
        }

        for (var index = startIdx; index < endIdx; index++) {
          var item = this.arrdata[index];
          item.index = index + 1;

          var _id = index;
          var _mc = item.key;

          inhtml +=
            '<div class="querybar-site" onclick="widget_queryBaiduPOI.queryPOIForCity(\'' +
            _mc +
            '\')"> <div class="querybar-sitejj"> <div style=" float: left;">' +
            _mc +
            '</div> <div style=" float: right;  ">约' +
            item.num +
            '个结果</div></div> </div>';
        }

        //分页信息
        inhtml +=
          '<div class="querybar-page"><div class="querybar-fl">找到<strong>' +
          this.counts +
          '</strong>个结果</div><div class="querybar-ye querybar-fr">' +
          this.thispage +
          '/' +
          this.allpage +
          '页  <a href="javascript:widget_queryBaiduPOI.workShowCitys.showFirstPage()">首页</a> <a href="javascript:widget_queryBaiduPOI.workShowCitys.showPretPage()">&lt;</a>  <a href="javascript:widget_queryBaiduPOI.workShowCitys.showNextPage()">&gt;</a> </div></div>';

        $('#querybar_resultlist_view').html(inhtml);
        $('#querybar_resultlist_view').show();
      },
      showFirstPage: function() {
        this.thispage = 1;
        this.showPOIPage();
      },
      showNextPage: function() {
        this.thispage = this.thispage + 1;
        if (this.thispage > this.allpage) this.thispage = this.allpage;
        this.showPOIPage();
      },

      showPretPage: function() {
        this.thispage = this.thispage - 1;
        if (this.thispage < 1) this.thispage = 1;
        this.showPOIPage();
      },
    },

    //===================显示查询结果处理========================
    pageSize: 10,
    arrdata: [],
    counts: 0,
    allpage: 0,
    thispage: 0,
    entitiesObj: {},
    showPOIPage: function(data, counts) {
      this.arrdata = data;
      this.counts = counts;
      if (this.counts < data.length) this.counts = data.length;
      this.allpage = Math.ceil(this.counts / this.pageSize);

      var inhtml = '';
      if (this.counts == 0) {
        inhtml +=
          '<div class="querybar-page"><div class="querybar-fl">没有找到"<strong>' +
          this.queryText +
          '</strong>"相关结果</div></div>';
      } else {
        for (var index = 0; index < this.arrdata.length; index++) {
          var item = this.arrdata[index];
          if (!item.geo) {
            continue;
          }
          var startIdx = (this.thispage - 1) * this.pageSize;
          item.index = index + 1;

          var _id = index;

          inhtml += `<div class="querybar-site" onclick="widget_queryBaiduPOI.showDetail(${_id})">
                    <span class="index">${item.index}</span>
                    <span class="text">${item.name}</span>
                </div>`;
          this.objResultData[_id] = item;
        }

        //分页信息
        var _fyhtml;
        if (this.allpage > 1)
          _fyhtml =
            '<div class="querybar-ye querybar-fr">' +
            '<a href="javascript:widget_queryBaiduPOI.showFirstPage()">首页</a> <a href="javascript:widget_queryBaiduPOI.showPretPage()"><span class="iconfont icon_arrow_down icon-left"></span></a>  <a href="javascript:widget_queryBaiduPOI.showNextPage()"><span class="iconfont icon_arrow_down icon-right"></span></a> </div>';
        else _fyhtml = '';

        //底部信息
        inhtml +=
          '<div class="querybar-page"><div class="querybar-fl">' +
          this.thispage +
          '/' +
          this.allpage +
          '页 </div>' +
          _fyhtml +
          '</div>';
      }
      $('#querybar_resultlist_view').html(inhtml);
      $('#querybar_resultlist_view').show();

      if (this.arrdata.length > 0) {
        this.showPOIArr(this.arrdata);
      }

      if (this.counts == 1) {
        this.showDetail('0');
      }
    },
    showFirstPage: function() {
      this.thispage = 1;
      this.queryPOI();
    },
    showNextPage: function() {
      this.thispage = this.thispage + 1;
      if (this.thispage > this.allpage) {
        this.thispage = this.allpage;
        toastr.warning('当前已是最后一页了');
        return;
      }
      this.queryPOI();
    },

    showPretPage: function() {
      this.thispage = this.thispage - 1;
      if (this.thispage < 1) {
        this.thispage = 1;
        toastr.warning('当前已是第一页了');
        return;
      }
      this.queryPOI();
    },
    //点击单个结果,显示详细
    objResultData: {},
    entityModel: null,
    showDetail: function(id) {
      //$("#querybar_resultlist_view").hide(); // 隐藏匹配结果列表
      //$("#querybar_detail_view").show();
      $('#cesiumContainer-mars3d-pupup-all').empty();
      entityList.forEach((entity1, idx) => {
        this.dataSource.entities.values.forEach(entity2 => {
          if (entity1.name === entity2.name) {
            entity2.billboard.image =
              public_image_path + '/config/images/search-localtion/' + (idx + 1) + '@2x.png';
          }
        });
      });

      var item = this.objResultData[id];
      var geo = JSON.parse(item.geo);
      this.entityModel && viewer.entities.remove(this.entityModel) && (this.entityModel = null);
      var layer = this.getWorkLayer();
      // this.clearLayers();
      if (geo.type == 'Polygon') {
        var positions = geo.coordinates.join().split(',');
        positions = Cesium.Cartesian3.fromDegreesArray(positions);
        this.entityModel = {
          id: item.entityId,
          name: 'Fpolygon' + item.name,
          perPositionHeight: false, //贴地参数
          // polygon: {
          //   hierarchy : {
          //     positions : positions,
          //   },
          //   material:Cesium.Color.fromCssColorString("#FEC205").withAlpha(0.6),//Cesium.Color.DIMGRAY.withAlpha(0.8),//Cesium.Color.fromRandom({alpha:1.0})Cesium.Color.DARKGRAY.withAlpha(0.0)
          //   classificationType:Cesium.ClassificationType.BOTH,
          //   clampToGround:true,
          //   outline:true,
          //   oultlineColor:Cesium.Color.BLACK,
          // }, Cesium.Color.RED.withAlpha(0.6)
          polyline: {
            positions: positions,
            hierarchy: {
              positions: positions,
            },
            material: new Cesium.PolylineDashMaterialProperty({
              color: Cesium.Color.RED,
            }),
            classificationType: Cesium.ClassificationType.BOTH,
            clampToGround: true,
            outline: true,
            oultlineColor: Cesium.Color.BLACK,
            width: 3,
          },
        };
        viewer.entities.add(this.entityModel);
        var polyCenter = Cesium.BoundingSphere.fromPoints(positions).center;
        var cato = Cesium.Cartographic.fromCartesian(polyCenter);
        var lon = Number(Cesium.Math.toDegrees(cato.longitude).toFixed(6));
        var lat = Number(Cesium.Math.toDegrees(cato.latitude).toFixed(6));
        viewer.mars.centerAt({ x: lon, y: lat, minz: 1600 });
      } else if (geo.type == 'LineString') {
        var positions = geo.coordinates.join().split(',');
        positions = Cesium.Cartesian3.fromDegreesArray(positions);
        this.entityModel = {
          id: item.entityId,
          name: 'Fpolygon' + item.name,
          perPositionHeight: false, //贴地参数
          polyline: {
            positions: positions,
            hierarchy: {
              positions: positions,
            },
            material: Cesium.Color.fromCssColorString('#FEC205').withAlpha(0.6), //Cesium.Color.DIMGRAY.withAlpha(0.8),//Cesium.Color.fromRandom({alpha:1.0})Cesium.Color.DARKGRAY.withAlpha(0.0)
            classificationType: Cesium.ClassificationType.BOTH,
            clampToGround: true,
            outline: true,
            oultlineColor: Cesium.Color.BLACK,
            width: 3,
          },
        };
        viewer.entities.add(this.entityModel);
        var polyCenter = Cesium.BoundingSphere.fromPoints(positions).center;
        var cato = Cesium.Cartographic.fromCartesian(polyCenter);
        var lon = Number(Cesium.Math.toDegrees(cato.longitude).toFixed(6));
        var lat = Number(Cesium.Math.toDegrees(cato.latitude).toFixed(6));
        viewer.mars.centerAt({ x: lon, y: lat, minz: 1600 });
      } else if (geo.type == 'Point') {
        viewer.mars.centerAt({ x: geo.coordinates[0], y: geo.coordinates[1], minz: 1600 });
      }

      //  this.dataSource.entities.values[id].billboard.image = public_image_path+'/config/images/search-localtion/'+(id+1)+'s@2x.png';
      //  this.dataSource.entities.values[id].billboard.eyeOffset = new Cesium.Cartesian3(0,0,20);

      setTimeout(() => {
        this.removeEntity(this.entitiesObj[item.entityId]);
      }, 500);

      ////根据实际字段名修改。
      //var name = item.name;
      //if (name.length > 12)
      //    name = name.substring(0, 11) + "..";
      //$("#lbl_poi_name").html(name);

      ////==================构建查询详情div=================
      //var inHtml = '<p>名称：' + item.name + '</p>'; //详情
      //if (item.telephone)
      //    inHtml += '<p>电话：' + item.telephone + '</p>';
      //if (item.address)
      //    inHtml += '<p>地址：' + item.address + '</p>';
      //if (item.detail_info) {
      //    if (item.detail_info.tag)
      //        inHtml += '<p>类别：' + item.detail_info.tag + '</p>';

      //    //if (item.detail_info.detail_url)
      //    //    inHtml += '<p>详情：<a href="' + item.detail_info.detail_url + '"  target="_black">单击链接</a></p>';
      //}

      ////====================================================

      //$("#poi_detail_info").html(inHtml);

      //if (item.detail_info && item.detail_info.detail_url) {
      //    $("#btnShowDetail").show();
      //    $("#btnShowDetail").attr('href', item.detail_info.detail_url);
      //}
      //else {
      //    $("#btnShowDetail").hide();
      //}

      // this.centerAt(item);
    },
    dataSource: null,
    getWorkLayer: function() {
      if (this.dataSource == null) {
        this.dataSource = new Cesium.CustomDataSource();
        this.viewer.dataSources.add(this.dataSource);
      }
      return this.dataSource;
    },
    clearLayers: function() {
      if (this.dataSource == null) return;
      this.dataSource.entities.removeAll();
      this.viewer.mars.popup.close();
    },
    showPOIArr: function(arr) {
      var that = this;
      var layer = this.getWorkLayer();
      this.clearLayers();
      entityList = [];
      viewer.scene.globe.depthTestAgainstTerrain = false;

      $(arr).each(function(i, item) {
        var jd = item.x;
        var wd = item.y;
        var geo = JSON.parse(item.geo);
        if (geo) {
          if (geo.type == 'Polygon') {
            var positions = geo.coordinates.join().split(',');
            positions = Cesium.Cartesian3.fromDegreesArray(positions);
            var polyCenter = Cesium.BoundingSphere.fromPoints(positions).center;
            var cato = Cesium.Cartographic.fromCartesian(polyCenter);
            var lon = Number(Cesium.Math.toDegrees(cato.longitude).toFixed(6));
            var lat = Number(Cesium.Math.toDegrees(cato.latitude).toFixed(6));
            jd = lon;
            wd = lat;
          } else if (geo.type == 'LineString') {
            var positions = geo.coordinates.join().split(',');
            positions = Cesium.Cartesian3.fromDegreesArray(positions);
            var polyCenter = Cesium.BoundingSphere.fromPoints(positions).center;
            var cato = Cesium.Cartographic.fromCartesian(polyCenter);
            var lon = Number(Cesium.Math.toDegrees(cato.longitude).toFixed(6));
            var lat = Number(Cesium.Math.toDegrees(cato.latitude).toFixed(6));
            jd = lon;
            wd = lat;
          } else if (geo.type == 'Point') {
            jd = geo.coordinates[0];
            wd = geo.coordinates[1];
          }
        }
        //var z = 0;

        //===========无坐标数据===========
        if (isNaN(jd) || jd == 0 || isNaN(wd) || wd == 0) return;

        // var wgsMpt = mars3d.pointconvert.bd2wgs([jd, wd]);
        // wgsMpt = that.viewer.mars.point2map({ x: wgsMpt[0], y: wgsMpt[1] });
        // jd = wgsMpt.x;
        // wd = wgsMpt.y;

        item.JD = jd;
        item.WD = wd;

        //==================构建图上目标单击后显示div=================
        var name;

        name = item.name;

        var inHtml =
          '<div class="mars-popup-titile">' + name + '</div><div class="mars-popup-content" >';

        var phone = $.trim(item.telephone);
        if (phone != '')
          inHtml +=
            '<div><label style="text-align: end;margin-left: 0px;margin-right: 0px;">电话：</label>' +
            phone +
            '</div>';

        var dz = $.trim(item.address);
        if (dz != '')
          inHtml +=
            '<div style="margin:10px"><label style="text-align: end;margin-left: 0px;margin-right: 0px;">地址：</label>' +
            dz +
            '</div>';

        if (item.detail_info) {
          var fl = $.trim(item.detail_info.tag);
          if (fl != '')
            inHtml +=
              '<div><label style="text-align: end;margin-left: 0px;margin-right: 0px;">类别：</label>' +
              fl +
              '</div>';
        }
        inHtml += '</div>';
        //==============================================================
        clickTime++;
        var cato = Cesium.Cartographic.fromDegrees(item.JD, item.WD);
        var height = viewer.scene.sampleHeight(cato);
        height = isNaN(height) ? 70 + 0.1 * clickTime : height + 0.1 * clickTime;
        var tmpEntity = {
          name: item.entityId,
          position: Cesium.Cartesian3.fromDegrees(jd, wd, height),
          billboard: {
            image: public_image_path + '/config/images/search-localtion/' + (i + 1) + '@2x.png',
            scale: 0.7, //原始大小的缩放比例
            horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
            verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
            // heightReference: Cesium.HeightReference.CLAMP_TO_GROUND, //贴地
            scaleByDistance: new Cesium.NearFarScalar(1.5e2, 1.0, 8.0e6, 0.2),
            // disableDepthTestDistance: Number.POSITIVE_INFINITY, //一直显示，不被地形等遮挡
          },
          data: item,
          popup: {
            html: inHtml,
            anchor: [0, -50],
          },
          click: function(entity) {
            //单击
            entityList.forEach((entity1, idx) => {
              that.dataSource.entities.values.forEach(entity2 => {
                if (entity1.name === entity2.name) {
                  entity2.billboard.image =
                    public_image_path + '/config/images/search-localtion/' + (idx + 1) + '@2x.png';
                }
              });
            });
            entity.billboard.image =
              public_image_path + '/config/images/search-localtion/' + (i + 1) + 's@2x.png';
          },
        };
        //添加实体
        entityList.push(tmpEntity);
        var entity = that.dataSource.entities.add(tmpEntity);
        that.entitiesObj[item.entityId] = {
          entity: entity,
          jd: jd,
          wd: wd,
          inHtml: inHtml,
          name: name,
          entityId: item.entityId,
          index: i,
        };
        item._entity = entity;
      });

      if (arr.length > 1) that.viewer.flyTo(that.dataSource.entities, { duration: 3 });
    },
    removeEntity: function(item) {
      var that = this;
      var layer = this.getWorkLayer();
      layer.entities.remove(item.entity);

      var jd = item.jd;
      var wd = item.wd;
      var cato = Cesium.Cartographic.fromDegrees(jd, wd);
      var h = viewer.scene.sampleHeight(cato);
      clickTime++;
      var height = isNaN(h) ? 70 + 0.1 * clickTime : h + 0.1 * clickTime;

      var i = item.index;
      var tmpEntity = {
        name: item.entityId,
        position: Cesium.Cartesian3.fromDegrees(jd, wd, height),
        billboard: {
          image: public_image_path + '/config/images/search-localtion/' + (i + 1) + 's@2x.png',
          scale: 0.7, //原始大小的缩放比例
          horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          // heightReference: Cesium.HeightReference.CLAMP_TO_GROUND, //贴地
          scaleByDistance: new Cesium.NearFarScalar(1.5e2, 1.0, 8.0e6, 0.2),
          // disableDepthTestDistance: Number.POSITIVE_INFINITY, //一直显示，不被地形等遮挡
        },
        data: item,
        popup: {
          html: item.inHtml,
          anchor: [0, -50],
        },
        click: function(entity) {
          //单击
          that.dataSource.entities.values.forEach((_entity, idx) => {
            _entity.billboard.image =
              public_image_path + '/config/images/search-localtion/' + (idx + 1) + '@2x.png';
          });
          entity.billboard.image =
            public_image_path + '/config/images/search-localtion/' + (i + 1) + 's@2x.png';
        },
      };
      //添加实体
      var entity = layer.entities.add(tmpEntity);
      this.entitiesObj[item.entityId] = {
        entity: entity,
        jd: jd,
        wd: wd,
        inHtml: item.inHtml,
        name: item.name,
        entityId: item.entityId,
        index: i,
      };
    },
    centerAt: function(item) {
      var entity = item._entity;
      if (entity == null) {
        toastr.warning(item.name + ' 无经纬度坐标信息！');
        return;
      }

      this.viewer.mars.centerAt({ x: item.JD, y: item.WD, minz: 2500 });

      var that = this;
      setTimeout(function() {
        that.viewer.mars.popup.show(entity, entity.position.getValue());
      }, 300);
    },

    //===================历史记录相关========================

    cookieName: 'querypoi_gis',
    arrHistory: [],
    showHistoryList: function() {
      $('#querybar_histroy_view').hide();

      var lastcookie = haoutil.cookie.get(this.cookieName); //读取cookie值
      if (lastcookie == null) return;

      this.arrHistory = eval(lastcookie);
      if (this.arrHistory == null || this.arrHistory.length == 0) return;

      var inhtml = '';
      for (var index = this.arrHistory.length - 1; index >= 0; index--) {
        var item = this.arrHistory[index];
        inhtml +=
          "<li><i class='iconfont icon_editbeifen'/><a href=\"javascript:widget_queryBaiduPOI.autoSearch('" +
          item +
          '\');">' +
          item +
          '</a></li>';
      }
      $('#querybar_ul_history').html(inhtml);
      $('#querybar_histroy_view').show();
    },

    clearHistory: function() {
      this.arrHistory = [];
      haoutil.cookie.del(this.cookieName);

      $('#querybar_ul_history').html('');
      $('#querybar_histroy_view').hide();
    },

    //记录历史值
    addHistory: function(data) {
      this.arrHistory = [];
      var lastcookie = haoutil.cookie.get(this.cookieName); //读取cookie值
      if (lastcookie != null) {
        this.arrHistory = eval(lastcookie);
      }
      //先删除之前相同记录
      this.arrHistory.remove(data);

      this.arrHistory.push(data);

      if (this.arrHistory.length > 10) this.arrHistory.splice(0, 1);

      lastcookie = JSON.stringify(this.arrHistory);
      haoutil.cookie.add(this.cookieName, lastcookie);
    },

    //======================查询非百度poi，联合查询处理=================
    //外部widget是否存在或启用
    exWidget: null,
    hasExWidget: function() {
      if (window['queryBarWidget'] == null) return false;
      else {
        this.exWidget = queryBarWidget;
        return true;
      }
    },
    autoExTipList: function(text) {
      var that = this;
      this.exWidget.autoTipList(text, function() {
        that.autoTipList(text, false);
      });
    },
    //调用外部widget进行查询
    queryExPOI: function(text) {
      var layer = this.getWorkLayer();

      var that = this;
      this.exWidget.strartQueryPOI(text, layer, function() {
        that.strartQueryPOI(text, false);
      });
    },
  }),
);
