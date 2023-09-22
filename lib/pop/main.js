    // 创建弹窗对象的方法
    var Popup = function(info){
        this.constructor(info);
    }
    Popup.prototype.id=0;
    Popup.prototype.constructor = function(info){
        var _this = this;
        _this.viewer = info.viewer;//弹窗创建的viewer
        _this.geometry = info.geometry;//弹窗挂载的位置
        _this.id ="popup_" +_this.__proto__.id++ ;
        _this.ctn = $("<div class='bx-popup-ctn' id =  '"+_this.id+"'>");
        $(_this.viewer.container).append( _this.ctn);
        //测试弹窗内容
        var testConfig = {
            header:info.header || "测试数据",
            content:info.content || "<div>测试窗口</div>",
        }
        _this.ctn.append(_this.createHtml(testConfig.header,testConfig.content));
        
        _this.render(_this.geometry);
        _this.eventListener = _this.viewer.clock.onTick.addEventListener(function(clock) {
            _this.render(_this.geometry);
        })
    }
    // 实时刷新
    Popup.prototype.render = function(geometry){
        var _this = this;
        var position = Cesium.SceneTransforms.wgs84ToWindowCoordinates(_this.viewer.scene,geometry)
        _this.ctn.css("left",position.x- _this.ctn.get(0).offsetWidth/2);
        _this.ctn.css("top",position.y- _this.ctn.get(0).offsetHeight - 10);
    }
    // 动态生成内容
    Popup.prototype.createHtml = function(header,content){
            var html = '<div class="bx-popup-header-ctn">'+
            header+
            '</div>'+
            '<div class="bx-popup-content-ctn" >'+
            '<div class="bx-popup-content" >'+    
            content+
            '</div>'+
            '</div>'+
            '<div class="bx-popup-tip-container" >'+
            '<div class="bx-popup-tip" >'+
            '</div>'+
        '</div>'+
        '<a class="leaflet-popup-close-button" >X</a>';
        return html;
    }
    // 关闭弹窗按钮
    Popup.prototype.close=function(){
        var _this = this;
        _this.ctn.remove();
        _this.viewer.clock.onTick.removeEventListener( _this.eventListener );
    }

