//绑定图层管理
window.bindToLayerControl= function(options) {
    if (options._layer == null) {
        var _visible = options.visible;
        delete options.visible;
        /*global viewer */
        /*global mars3d */
        var layer = new mars3d.layer.BaseLayer(options, viewer);
        layer._visible = _visible;
        options._layer = layer;
    }

    var manageLayersWidget = mars3d.widget.getClass('widgets/manageLayers/widget.js');
    if (manageLayersWidget) {
        manageLayersWidget.addOverlay(options);
    }
    else {
        if(!viewer.gisdata.config.operationallayers){
            viewer.gisdata.config.operationallayers = [];
        }
        
        viewer.gisdata.config.operationallayers.push(options);
    }
    return options._layer;
}
//取消绑定图层管理
window.unbindLayerControl = function(name) {
    var manageLayersWidget = mars3d.widget.getClass('widgets/manageLayers/widget.js');
    if (manageLayersWidget) {
        manageLayersWidget.removeLayer(name);
    } else {
        var operationallayersCfg = viewer.gisdata.config.operationallayers;
        for (var i = 0; i < operationallayersCfg.length; i++) {
            var item = operationallayersCfg[i];
            if (item.name == name) {
                operationallayersCfg.splice(i, 1);
                break;
            }
        }
    }
}