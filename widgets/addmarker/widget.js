/* 2017-11-30 15:04:37 | 修改 木遥（QQ：516584683） */

 //const { request } = require("../../../src/utils/request");

let dataId='';

//模块：
var addmarkerWidget = mars3d.widget.bindClass(mars3d.widget.BaseWidget.extend({
    viewer: window.viewer, //框架会自动对map赋值
    options: {
        resources: ['map.css'],
        //弹窗
        view: {
            type: "window",
            url: "view.html",
            windowOptions: {
                width: 300,
                height: 458,
                position:{
                    top:230,
                    right:100
                }
            },
        }
    },
    drawControl: null,
    startaddmarker:true,
    //初始化[仅执行1次]
    create: function () {
        this.drawControl = new mars3d.Draw(this.viewer, {
            hasEdit: false,
        });
        //事件监听
        var that = this;
        this.drawControl.on(mars3d.draw.event.DrawCreated, function (e) {
            var entity = e.entity;
            that.bindMarkerEx(entity);
        });
        this.drawControl.on(mars3d.draw.event.EditMovePoint, function (e) {
            var entity = e.entity;
            that.saveEntity(entity);
        });
        //添加到图层控制
        bindToLayerControl({
            pid: 0,
            name: '我的标记',
            visible: true,
            onAdd: function () {//显示回调
                that.drawControl.setVisible(true);
            },
            onRemove: function () {//隐藏回调
                that.drawControl.setVisible(false);
            },
            onCenterAt: function (duration) {//定位回调
                var arr = that.drawControl.getEntitys();
                that.viewer.flyTo(arr, { duration: duration });
            },
        });
        this.getList();
    },
    is3Denable:function(){
       //判断倾斜摄影已加载 是否开启3D模式
       const {isOpen3D} =window;//是否开启3D模式
       var hide=0,show=0;
       let primitives = this.viewer.scene.primitives._primitives;
       primitives.forEach((data) =>{
           if(data.asset){
            let nametype = data.asset.nametype;
            if(nametype === "obliquephotography"){
                if(isOpen3D){
                    if(data.show){
                        show++;
                    }else{
                        hide++;
                    }
                }            
            } 
           }               
       });
       if(!isOpen3D){
        return true;
       }
       if(hide>0){
           return false;
       }
       if(show>0){
        return true;
       }
    },
    viewWindow: null,
    //每个窗口创建完成后调用
    winCreateOK: function (opt, result) {
        this.viewWindow = result;
        this.getList()
        setTimeout(() => {
            document.getElementsByClassName("layui-layer-title")[0].innerHTML="空间标记编辑";  
        }, 100);
    },
    //激活插件
    activate: function () {
        this.hasEdit(true);
        this.startaddmarker=true;
    },
    //释放插件
    disable: function () {
        this.startaddmarker=false;
        this.viewWindow = null;
        this.stopDraw();
        this.hasEdit(false);
        this.deleteAll()
        // var classNameList =$("#spaceMarkid")[0].className.split(" ");
        // $("#spaceMarkid").removeClass(classNameList[1])
    },
    stopDraw: function () {
        this.drawControl.stopDraw();
    },
    drawPoint: function () {
        this.stopDraw();
        this.drawControl.startDraw({
            type: "billboard",
            style: {
                scale: 1,
                image: this.path + "img/marker.png"
            }
        });
    },
    editable: false,
    hasEdit: function (val) {
        this.editable = val;
        this.drawControl.hasEdit(val);
    },
    bindMarkerEx: function (entity) {
        if (entity == null || entity.position == null) return;

        entity.attribute.attr = entity.attribute.attr || {};
        // entity.attribute.attr.id = (new Date()).format("yyyyMMddHHmmss");
        entity.attribute.attr.name = "我的标记";
        entity.label = this.getLabelStyle(entity.attribute.attr.name);
        var coordinate =this.drawControl.getCoordinates(entity)[0];
        if(coordinate[2]<=3){
            coordinate[2]=150;
            var position =Cesium.Cartesian3.fromDegrees(coordinate[0],coordinate[1],coordinate[2]);
            entity.position=position;
        }
        entity.billboard.scaleByDistance = new Cesium.NearFarScalar(1000, 1.0, 500000, 0.0);
        entity.billboard.horizontalOrigin=Cesium.HorizontalOrigin.CENTER;
        entity.billboard.verticalOrigin= Cesium.VerticalOrigin.BOTTOM;
        entity.billboard.heightReference= Cesium.HeightReference.NONE;
        var that = this;
        this.saveEntity(entity,function () {
            entity.popup = {
                html: function (entity) {
                    return that.getMarkerInhtml(entity.attribute.attr);
                },
                anchor: [0, -35]
            };
            that.viewer.mars.popup.show(entity, entity.position._value);
        });
    },
    //========================
    saveEditFeature: function (id) {
        var entity = this.drawControl.getEntityById(id);
        entity.attribute.attr = entity.attribute.attr || {};
        entity.attribute.attr.name = $.trim($("#addmarker_attr_name").val());
        entity.attribute.attr.remark = $.trim($("#addmarker_attr_remark").val());
        if(['',undefined,null].includes(entity.attribute.attr.name)){
                return 
        }else{
            this.viewer.mars.popup.close();
            entity.label.text = entity.attribute.attr.name;
            this.saveEntity(entity);
            dataId = '';
        }
    },
    closeEditFeature:function(id){
        if(id===dataId){
            this.deleteEditFeature(id);
            dataId = '';
        }else{
            this.viewer.mars.popup.close();
        }
    },
    deleteEditFeature: function (id) {
        var entity = this.drawControl.getEntityById(id);
        this.drawControl.deleteEntity(entity);

        this.viewer.mars.popup.close();
        this.viewWindow.refMarkerList();

        var that = this;
        $.ajax({
           url: '/vb/space-marker/' + id,
           type: 'DELETE',
           beforeSend:function(request){
            const token=window.localStorage.getItem('token');
            token && request.setRequestHeader("token",token);
          },
           success: function (id) {

           }
        });

        //本地存储
        var storagedata = this.getJsonData();
        haoutil.storage.add(this.storageName, storagedata);
    },
    getMarkerDataList: function () {
        var arr = [];
        var arrEntity = this.drawControl.getEntitys();
        for (var i = 0, len = arrEntity.length; i < len; i++) {
            arr.push(arrEntity[i].attribute.attr);
        }
        return arr;
    },
    getMarkerInhtml: function (attr) {
        var inhtml;
        if (this.editable) {
            if (!attr.name || attr.name == "我的标记")
                attr.name = "";
            if (!attr.remark)
                attr.remark = "";
            if (!attr.id)
                attr.id = "0";
            var title = '编辑标记'
            if (attr.name == "") {
                title='添加标记'
            }
            inhtml = '<div class="addmarker-popup-titile">'+title+'</div><div class="mars3d-popup-close-button" style="cursor: pointer;" onclick="addmarkerWidget.closeEditFeature(' + attr.id + ')">×</div><div class="addmarker-popup-content" ><form id="add-marker-form">' +
                '<div class="form-group">  <label for="addmarker_attr_name">名称</label><input type="text" id="addmarker_attr_name" class="form-control" value="' + attr.name + '" placeholder="请输入标记名称"    /> </div>' +
                '<div class="form-group">  <label for="addmarker_attr_remark">备注</label><textarea id="addmarker_attr_remark" class="form-control" rows="3" style="resize: none;" placeholder="请输入备注（可选填）"   >' + attr.remark + '</textarea></div>' +
                '<div class="form-group" style="text-align: center;"><button type="button" class="btn btn-save" onclick="addmarkerWidget.saveEditFeature(' + attr.id + ')" >保存</button>' +
                '&nbsp;&nbsp;<button type="button" class="btn btn-del" onclick="addmarkerWidget.deleteEditFeature(' + attr.id + ')">删除</button></div>' +
                '</form></div>';
        } else {
            inhtml = '<div class="addmarker-popup-titile">我的标记</div><div class="addmarker-popup-content" ><form id="add-marker-form" >' +
                '<div class="form-group"><label>名称：</label><label>' + attr.name + '</label></div>' +
                '<div class="form-group"><label>备注：</label><label>' + attr.remark + '</label></div>' +
                '<div class="form-group"></div>' +
                '</form></div>';
        }
        return inhtml;
    },
    centerAt: function (id) {
        var entity = this.drawControl.getEntityById(id);

        if (entity) {
            var position = entity.position.getValue();
            position = mars3d.point.addPositionsHeight(position,2500);

            this.viewer.camera.flyTo({
                destination: position,
                duration: 3,
                orientation: { heading: 0, pitch: Cesium.Math.toRadians(-90), roll: 0 }
            });
        }
    },
    deleteAll: function () {
        this.drawControl.deleteAll();

        if (this.viewWindow)
            this.viewWindow.refMarkerList();

        //本地存储
        haoutil.storage.del(this.storageName);
    },
    label_font_style: "normal small-caps normal 19px 楷体",
    getLabelStyle: function (name) {
        return new Cesium.LabelGraphics({
            text: name == "" ? "我的标记" : name,
            font: this.label_font_style,
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            outlineColor: Cesium.Color.BLACK,
            outlineWidth: 3,
            horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
            verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
            pixelOffset: new Cesium.Cartesian2(0, -50),
            distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0.0, 200000)
        });
    },
    getJsonData: function () {
        var arr = [];

        var arrEntity = this.drawControl.getEntitys();
        for (var i = 0, len = arrEntity.length; i < len; i++) {
            var entity = arrEntity[i];
            var attr = entity.attribute.attr;
            var coord = mars3d.draw.attr.billboard.getCoordinates(entity);

            var item = {
                id: attr.id,
                name: attr.name,
                remark: attr.remark,
                x: coord[0][0],
                y: coord[0][1],
                z: coord[0][2]
            };
            arr.push(item);
        }
        return JSON.stringify(arr);
    },
    jsonToLayer: function (json, isclear) {
        var that = this;
        var arr = JSON.parse(json);
        if (arr == null || arr.length == 0) return;
        if (isclear) {
            this.drawControl.deleteAll();
        }

        var arrEntity = [];
        for (var i = 0; i < arr.length; i++) {
            var item = arr[i];
            if (!item.x || !item.y) continue;

            var attribute = {
                type: "billboard",
                attr: {
                    id: item.id || "",
                    name: item.name || "",
                    remark: item.remark || ""
                },
                style: {
                    scale: 1,
                    image: this.path + "img/marker.png"
                }
            };

            if (!isclear) { //叠加时，清除已有同id数据
                var entity = this.drawControl.getEntityById(attribute.attr.id);
                this.drawControl.deleteEntity(entity);
            }

            var position = Cesium.Cartesian3.fromDegrees(item.x, item.y, item.z || 0.0);
            var entity = this.drawControl.attributeToEntity(attribute, position);
            entity.popup = {
                html: function (entity) {
                    return that.getMarkerInhtml(entity.attribute.attr);
                },
                anchor: [0, -35]
            };
            entity.billboard.scaleByDistance = new Cesium.NearFarScalar(1.5e2, 1, 8.0e6, 0.2);
            entity.label = this.getLabelStyle(attribute.attr.name);
            arrEntity.push(entity);
        }

        this.viewer.flyTo(arrEntity, { duration: 2.0 });

        if (this.viewWindow)
            this.viewWindow.refMarkerList();
    },
    storageName: "marsgis_addmarker",
    getList: function () {
        //读取本地存储
        // var laststorage = haoutil.storage.get(this.storageName); //读取localStorage值
        // if (laststorage != null && laststorage != 'null') {
        //     this.jsonToLayer(laststorage, true);
        // }


        //读取服务端存储
        var that = this;
        $.ajax({
          url: '/vb/space-marker/list',
          type: 'get',
          beforeSend:function(request){
            const token=window.localStorage.getItem('token');
            token && request.setRequestHeader("token",token);
          },
          success: function (arr) {
            that.jsonToLayer(JSON.stringify(arr.data), true);
          }
        });


    },
    saveEntity: function (entity,endfun) {
        //本地存储
        var storagedata = this.getJsonData();
        haoutil.storage.add(this.storageName, storagedata);

        //服务端存储
        var attr = entity.attribute.attr;
        var coord = mars3d.draw.attr.billboard.getCoordinates(entity);
        var that = this;

        let param = {
          name: attr.name,
          remark: attr.remark,
          x: coord[0][0],
          y: coord[0][1],
          z: coord[0][2]
            // id: attr.id == "0" ? "" : attr.id,
        }
        if(entity.attribute.attr.id){
            // param.id=entity.attribute.attr.id;
            // 修改记录
            $.ajax({
                url: '/vb/space-marker/'+entity.attribute.attr.id,
                data: JSON.stringify(param),
                contentType: "application/json;charset=UTF-8",
                type: 'PUT',    
                dataType: "json",
                beforeSend:function(request){
                  const token=window.localStorage.getItem('token');
                  token && request.setRequestHeader("token",token);
                },
                success: function (data) {
                  if(data.success){
                      if (endfun) endfun();
                      that.viewWindow.refMarkerList();
                  }
                  
                }
              });
        }else{
            var ss =JSON.stringify(param)
            $.ajax({
                url: '/vb/space-marker',
                data: JSON.stringify(param),
                contentType: "application/json;charset=UTF-8",
                type: 'post',
                dataType: "json",
                beforeSend:function(request){
                  const token=window.localStorage.getItem('token');
                  token && request.setRequestHeader("token",token);
                },
                success: function (data) {
                  if(data.success && data.data){
                      entity.attribute.attr.id = data.data;
                      dataId = data.data;
                      if (endfun) endfun();
                      that.viewWindow.refMarkerList();
                  }
                  
                }
              });
        }
        
        if (endfun) endfun();
        this.viewWindow.refMarkerList();
    },


}));
