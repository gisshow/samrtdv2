/* 2017-12-6 11:11:44 | 修改 木遥（微信:  http://marsgis.cn/weixin.html ） */
//模块：
window.hasServer = true;
mars3d.widget.bindClass(
  mars3d.widget.BaseWidget.extend({
    options: {
      //弹窗
      view: {
        type: 'window',
        url: 'view.html',
        windowOptions: {
          width: 360,
          position: {
            top: 100,
            right: -365,
            bottom: 5,
          },
        },
      },
    },
    drawControl: null,
    iframeleft: 0,
    linedataList: [],
    startlineraom: true,
    //初始化[仅执行1次]
    create: function() {
      this.drawControl = new mars3d.Draw(this.viewer, {
        hasEdit: true,
      });

      //事件监听
      var that = this;
      this.drawControl.on(mars3d.draw.event.DrawCreated, function(e) {
        // var entity = e.entity;
        // if (entity._attribute.attr.id == null || entity._attribute.attr.id == "")
        //     entity._attribute.attr.id = (new Date()).format("MMddHHmmss");
        if (that.viewWindow) that.viewWindow.plotlist.plotEnd();
      });
      this.drawControl.on(mars3d.draw.event.EditStart, function(e) {
        //控制窗口位移
        var win = document.getElementsByTagName('iframe')[0];
        win.offsetParent.offsetParent.style.left = that.iframeleft - 450 + 'px';
        // console.log(win)
        var entity = e.entity;
        that.startEditing(entity);
      });
      this.drawControl.on(mars3d.draw.event.EditMovePoint, function(e) {
        var entity = e.entity;
        that.startEditing(entity);
      });
      this.drawControl.on(mars3d.draw.event.EditRemovePoint, function(e) {
        var entity = e.entity;
        that.startEditing(entity);
      });
      this.drawControl.on(mars3d.draw.event.EditStop, function(e) {
        var win = document.getElementsByTagName('iframe')[0];
        if (win) {
          if (win.offsetParent.offsetParent.innerText == '') {
            win.offsetParent.offsetParent.style.left = that.iframeleft + 450 + 'px';
          } else if (win.offsetParent.offsetParent.innerText == '自动漫游编辑') {
            win.offsetParent.offsetParent.style.left = that.iframeleft + 450 + 'px';
          }
          var entity = e.entity;
          that.stopEditing(entity);
          that.saveEntity(entity);
        }
      });
    },
    viewWindow: null,
    //每个窗口创建完成后调用
    winCreateOK: function(opt, result) {
      this.viewWindow = result;
      var Container = document.getElementById('cesiumContainer');
      this.iframeleft = Container.offsetWidth;
      setTimeout(() => {
        var win = document.getElementsByTagName('iframe')[0];
        var ssss = win.contentDocument.getElementsByClassName('layui-layer-title');
        // win && win.contentDocument.getElementsByClassName("layui-layer-title") && win.contentDocument.getElementById("btn_Add_line").click();
      }, 200);
    },
    //激活插件
    activate: function() {
      this.drawControl.hasEdit(true);
      this.drawControl.setVisible(true);
      this.startlineraom = true;
      console.log('激活插件');
    },
    //释放插件
    disable: function() {
      this.viewWindow = null;
      this.drawControl.stopDraw();
      this.startlineraom = false;

      if (this.lastEditEntity) {
        this.lastEditEntity._polyline.show = false;
        this.lastEditEntity._attribute.style.show = false;
        this.lastEditEntity = null;
      }

      this.drawControl.hasEdit(false);
      this.drawControl.setVisible(false);
    },

    //开始标记
    startDraw: function(defval) {
      //编辑时只显示本身路线，其他路线隐藏
      if (this.lastEditEntity) {
        this.lastEditEntity._polyline.show = false;
        this.lastEditEntity._attribute.style.show = false;
        this.lastEditEntity = null;
      }

      //console.log(JSON.stringify(defval));
      this.drawControl.startDraw(defval);
    },
    startEditingById: function(id) {
      var entity = this.drawControl.getEntityById(id);
      if (entity == null) return;

      this.viewer.flyTo(entity);

      this.drawControl.startEditing(entity);
    },
    lastEditEntity: null,
    startEditing: function(entity) {
      //编辑时只显示本身路线，其他路线隐藏
      if (this.lastEditEntity) {
        this.lastEditEntity._polyline.show = false;
        this.lastEditEntity._polyline.clampToGround = true;
        this.lastEditEntity._attribute.style.show = false;
        this.lastEditEntity = null;
      }
      this.lastEditEntity = entity;

      entity._polyline.show = true;
      entity._polyline.clampToGround = true;
      entity._attribute.style.show = true;
      var lonlats = this.drawControl.getCoordinates(entity);
      this.viewWindow.plotEdit.startEditing(entity.attribute, lonlats);
    },
    stopEditing: function(layer) {
      if (this.viewWindow) this.viewWindow.plotEdit.stopEditing();
    },
    stopDraw: function() {
      this.drawControl.stopDraw();
    },
    //更新图上的属性
    updateAttr2map: function(attr) {
      this.drawControl.updateAttribute(attr);
    },
    //更新图上的几何形状、坐标等
    updateGeo2map: function(coords, withHeight) {
      var positions = [];
      if (withHeight) {
        for (var i = 0; i < coords.length; i += 3) {
          var point = Cesium.Cartesian3.fromDegrees(coords[i], coords[i + 1], coords[i + 2]);
          positions.push(point);
        }
      } else {
        for (var i = 0; i < coords.length; i += 2) {
          var point = Cesium.Cartesian3.fromDegrees(coords[i], coords[i + 1], 0);
          positions.push(point);
        }
      }
      this.drawControl.setPositions(positions);

      if (positions.length <= 3) {
        this.centerCurrentEntity();
      }

      return positions;
    },
    centerCurrentEntity: function() {
      var entity = this.drawControl.getCurrentEntity();
      if (entity == null) return;
      this.viewer.flyTo(entity);
    },
    //文件处理
    getGeoJson: function() {
      return this.drawControl.toGeoJSON();
    },
    jsonToLayer: function(json, isClear, isFly) {
      if (json == null) return;

      return this.drawControl.loadJson(json, {
        clear: isClear,
        flyTo: isFly,
      });
    },
    deleteAll: function() {
      this.drawControl.deleteAll();
      this.deleteAllData();
    },
    deleteEntity: function(id) {
      var entity = this.drawControl.getEntityById(id);
      if (entity == null) return;

      this.delEntity(id);
      this.drawControl.deleteEntity(entity);
    },
    deleteCurrentEntity: function() {
      var entity = this.drawControl.getCurrentEntity();
      if (entity == null) return;

      this.delEntity(entity._attribute.attr.id);
      this.drawControl.deleteEntity(entity);
    },
    hasEdit: function(val) {
      this.drawControl.hasEdit(val);
    },

    //数据保存处理
    storageName: 'marsgis_roam',
    arrFlyTable: [],
    getList: function() {
      var that = this;
      if (window.hasServer) {
        //后台接口查询
        var token = window.localStorage.getItem('token');
        // 根据BIM项目的id来查询飞行路线
        let projectId;
        if (window.BIMProject) {
          if (window.BIMProject.rootThis)
            projectId = window.BIMProject.rootThis.state.project_detail_id;
        }
        $.ajax({
          url: '/gws/remote/route/list',
          data: { projectId },
          headers: {
            token: token,
          },
          type: 'get',
          dataType: 'json',
          contentType: 'application/x-www-form-urlencoded',
          success: function(result) {
            if (result.code == 200 && result.data.length > 0) {
              //请求成功
              var dataList = result.data;
              for (var i = 0; i < dataList.length; i++) {
                var geojson = JSON.parse(dataList[i].properties);
                geojson.id = dataList[i].id;
                that.arrFlyTable.push(geojson);
              }
              var entities = that.showData(that.arrFlyTable);

              if (that.viewWindow) that.viewWindow.tableWork.loadData(that.arrFlyTable);
            } else {
              console.log('漫游路线请求失败');
            }
          },
          error: () => {
            console.log('漫游路线请求失败');
          },
        });
      } else {
        //本地缓存
        var laststorage = haoutil.storage.get(this.storageName); //读取localStorage值
        //var laststorage = null; //读取localStorage值
        if (laststorage != null) this.arrFlyTable = eval(laststorage);

        if (this.arrFlyTable == null || this.arrFlyTable.length == 0) {
          this.arrFlyTable = [];

          var that = this;
          $.getJSON(this.path + 'data/fly.json', function(result) {
            that.arrFlyTable = that.arrFlyTable.concat(result);
            that.showData(that.arrFlyTable);
            if (that.viewWindow) that.viewWindow.tableWork.loadData(that.arrFlyTable);
          });
        } else {
          this.showData(this.arrFlyTable);
          if (this.viewWindow) this.viewWindow.tableWork.loadData(this.arrFlyTable);
        }
      }
    },
    showData: function(arr) {
      //加载历史保存数据
      var arrjson = [];
      for (var i = 0; i < arr.length; i++) {
        var item = arr[i];
        if (item.properties.style) item.properties.style.show = false;
        var json = {
          type: 'Feature',
          properties: item.properties,
          geometry: item.geometry,
        };
        json.properties.attr.id = item.id;
        json.properties.attr.name = item.name;

        arrjson.push(json);
      }
      var entities = this.drawControl.loadJson(
        {
          type: 'FeatureCollection',
          features: arrjson,
        },
        {
          clear: true,
          flyTo: false,
        },
      );
      return entities;
    },
    deleteAllData: function() {
      this.arrFlyTable = [];
      haoutil.storage.add(this.storageName, JSON.stringify(this.arrFlyTable));
      haoutil.storage.add('marsgis_roam_flag', true);
      if (this.isActivate && this.viewWindow != null)
        this.viewWindow.tableWork.loadData(this.arrFlyTable);
    },
    isOnDraw: false,
    delEntity: function(id) {
      if (!id) {
        this.isOnDraw = true; //绘制过程中删除
        return;
      }
      this.drawControl.stopDraw();
      if (window.hasServer) {
        $.ajax({
          url: '/gws/remote/route/remove/' + id,
          type: 'POST',
          beforeSend: function(request) {
            const token = window.localStorage.getItem('token');
            token && request.setRequestHeader('token', token);
          },
          success: function(result) {
            console.log('删除漫游路线成功，返回数据：' + JSON.stringify(result));
          },
          error: function(XMLHttpRequest, textStatus, errorThrown) {
            alert('服务出错：' + XMLHttpRequest.statusText + '，代码 ' + XMLHttpRequest.status);
          },
        });
      }
      for (var index = this.arrFlyTable.length - 1; index >= 0; index--) {
        if (this.arrFlyTable[index].id == id) {
          this.arrFlyTable.splice(index, 1);
          break;
        }
      }
      haoutil.storage.add(this.storageName, JSON.stringify(this.arrFlyTable));
      haoutil.storage.add('marsgis_roam_flag', true);
      if (this.isActivate && this.viewWindow != null)
        this.viewWindow.tableWork.loadData(this.arrFlyTable);
    },

    saveEntity: function(entity) {
      if (this.isOnDraw) {
        //绘制过程中删除
        this.isOnDraw = false;
        return;
      }
      var that = this;
      var random = new Date().format('MMddHHmmss');
      var noId = false;
      if (entity._attribute.attr.id == null || entity._attribute.attr.id == '') {
        noId = true;
        entity._attribute.attr.id = random;
      }
      if (entity._attribute.attr.name == null || entity._attribute.attr.name == '')
        entity._attribute.attr.name = '路线' + random;
      var json = this.drawControl.toGeoJSON(entity);
      if (json.geometry.coordinates.length < 2) {
        //路线点数小于2个
        return;
      }
      var item = {
        id: json.properties.attr.id,
        name: json.properties.attr.name,
        geometry: json.geometry,
        properties: json.properties,
      };

      if (window.hasServer) {
        //后台接口
        //新增
        var token = window.localStorage.getItem('token');
        item = JSON.stringify(item);
        var geometry = JSON.stringify({
          projectId: window.BIMProject.rootThis.state.project_detail_id,
          properties: item, //genjson
        });
        if (noId) {
          $.ajax({
            url: '/gws/remote/route/save',
            beforeSend: function(request) {
              const token = window.localStorage.getItem('token');
              token && request.setRequestHeader('token', token);
            },
            data: geometry,
            contentType: 'application/json;charset=UTF-8',
            type: 'post',
            dataType: 'json',
            success: function(data) {
              if (data.code == 200) {
                entity._attribute.attr.id = data.data;
                item = JSON.parse(item);
                item.id = data.data; //同步table内标签的id
                //获取
                item.properties.attr.id = data.data;
                that.arrFlyTable.push(item);

                if (that.isActivate && that.viewWindow != null)
                  that.viewWindow.tableWork.loadData(that.arrFlyTable);
              }
            },
          });
        } else {
          //修改
          var geometry = JSON.stringify({
            properties: item, //genjson
          });
          var geojson = JSON.parse(item);
          for (var g = 0; g < this.arrFlyTable.length; g++) {
            var d = this.arrFlyTable[g];
            if (d.id == geojson.id) {
              this.arrFlyTable[g] = geojson;
            }
          }
          $.ajax({
            url: '/gws/remote/route/remove/' + entity.attribute.attr.id,
            data: geometry,
            contentType: 'application/json;charset=UTF-8',
            type: 'POST',
            dataType: 'json',
            beforeSend: function(request) {
              const token = window.localStorage.getItem('token');
              token && request.setRequestHeader('token', token);
            },
            success: function(result) {
              haoutil.storage.add(that.storageName, JSON.stringify(that.arrFlyTable));
              haoutil.storage.add('marsgis_roam_flag', true);
              console.log('修改漫游成功，返回数据：' + JSON.stringify(result));
            },
          });
        }
      } else {
        //保存到本地缓存
        var isFind = false;
        for (var index = this.arrFlyTable.length - 1; index >= 0; index--) {
          if (this.arrFlyTable[index].id == item.id) {
            isFind = true;
            this.arrFlyTable[index] = item;
            break;
          }
        }
        if (!isFind) this.arrFlyTable.push(item);
        haoutil.storage.add(this.storageName, JSON.stringify(this.arrFlyTable));
        haoutil.storage.add('marsgis_roam_flag', true);
        if (this.isActivate && this.viewWindow != null)
          this.viewWindow.tableWork.loadData(this.arrFlyTable);
      }
    },
    toRoamFly: function(lineData) {
      var data = this.getFormatData(lineData);

      mars3d.widget.activate({
        uri: 'widgets/roamFly/widget.js',
        data: data,
      });
    },
    saveForGeoJson: function(lineData) {
      var data = this.getFormatData(lineData);
      haoutil.file.downloadFile(data.name + '.json', JSON.stringify(data));
      var win = document.getElementsByTagName('iframe')[0];
      var that = this;
      if (win) {
        if (win.offsetParent.offsetParent.innerText != '') {
          setTimeout(function() {
            if (Number(that.iframeleft) > 1470) {
              win.offsetParent.offsetParent.style.left = Number(that.iframeleft) - 450 + 'px';
            }
          }, 200);
        }
      }
    },
    //保存为czml
    saveForCzml: function(lineData) {
      if (lineData.geometry.coordinates.length < 2) {
        toastr.error('路线无坐标数据，无法生成！');
        return;
      }
      var data = this.getFormatData(lineData);
      var line = new mars3d.FlyLine(this.viewer, data);
      var czml = JSON.stringify(line.toCZML());
      line.destroy();

      haoutil.file.downloadFile(lineData.properties.attr.name + '.czml', czml);
    },
    //转为flyLine需要的参数格式
    getFormatData: function(lineData) {
      var attr = lineData.properties.attr;
      var data = {
        id: attr.id,
        name: attr.name,
        remark: attr.remark,
        clockLoop: attr.clockLoop,
        camera: {
          type: attr.cameraType,
          followedX: attr.followedX,
          followedZ: attr.followedZ,
        },
        showGroundHeight: attr.showGroundHeight,
        interpolation: attr.interpolation, //setInterpolationOptions插值

        points: lineData.geometry.coordinates,
        speed: lineData.properties.speed,
      };

      if (attr.showLabel) {
        data.label = {
          show: true,
        };
      }
      if (attr.showLine) {
        data.path = lineData.properties.style;
        data.path.show = true;
      }
      if (attr.showShadow) {
        data.shadow = [
          {
            show: true,
            type: attr.shadowType,
          },
        ];
      }
      return data;
    },
    getModelCfg: function(model) {
      //漫游对象
      switch (model) {
        case 'model_man': //行人模型
          return {
            show: true,
            uri: serverURL_gltf + '/mars/man/walk.gltf',
            scale: 1,
            minimumPixelSize: 30,
          };
          break;
        case 'model_car': //汽车模型
          return {
            show: true,
            uri: serverURL_gltf + '/mars/qiche.gltf',
            scale: 0.2,
            minimumPixelSize: 50,
          };
          break;
        case 'model_air': //民航飞机模型
          return {
            show: true,
            uri: serverURL_gltf + '/mars/feiji.glb',
            scale: 0.1,
            minimumPixelSize: 50,
          };
          break;
        case 'model_zhanji': //军用飞机模型
          return {
            show: true,
            uri: serverURL_gltf + '/mars/zhanji.glb',
            scale: 0.01,
            minimumPixelSize: 50,
          };
          break;
        case 'model_weixin': //卫星模型
          return {
            show: true,
            uri: serverURL_gltf + '/mars/weixin.gltf',
            scale: 1,
            minimumPixelSize: 100,
          };
          break;
      }
      return {
        show: false,
      };
    },
  }),
);
