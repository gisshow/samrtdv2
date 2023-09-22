
const Cesium =window.Cesium
// const viewer= window.viewer;
var  Underground=function(t, i) {
  this._viewer = t;
  var n = Cesium.defaultValue(i, {});
  this._depth = Cesium.defaultValue(n.depth, 500);
  this._alpha = Cesium.defaultValue(n.alpha, .5);
  this.enable = Cesium.defaultValue(n.enable, !1);
}

  Object.defineProperties(Underground.prototype, {
    alpha: {
      get: function () {
        return this._alpha;
      },
      set: function (_value) {
        this._alpha = Number(_value);
        this._enable && this._updateImageryLayersAlpha(this._alpha);
      }
    },
    depth: {
      get: function () {
        return this._depth
      },
      set: function (_value) {
        this._depth = Number(_value);
        this._enable && (Cesium.ExpandByMars.underEarth.enableDepth = this._depth);
      }
    },
    enable: {
      get: function () {
        return this._enable
      },
      set: function (_value) {
        _value ? this.activate() : this.disable()
      }
    }
  });
  Underground.prototype._updateImageryLayersAlpha = function (e) {
    for (var t = this._viewer.imageryLayers._layers, i = 0, a = t.length; i < a; i++)
      t[i].alpha = e
  }
  Underground.prototype._historyOpts = function () {
    var e = {};
    e.alpha = Cesium.clone(this._viewer.imageryLayers._layers[0] && this._viewer.imageryLayers._layers[0].alpha);
      e.highDynamicRange = Cesium.clone(this._viewer.scene.highDynamicRange);
      e.skyShow = Cesium.clone(this._viewer.scene.skyAtmosphere.show);
      e.skyBoxShow = Cesium.clone(this._viewer.scene.skyBox.show);
      e.depthTest = Cesium.clone(this._viewer.scene.globe.depthTestAgainstTerrain);
      this._viewer.scene.globe._surface && this._viewer.scene.globe._surface._tileProvider && this._viewer.scene.globe._surface._tileProvider._renderState && (e.blending = Cesium.clone(this._viewer.scene.globe._surface._tileProvider._renderState.blending));
      this._oldViewOpts = e;
  }
  Underground.prototype.activate = function () {
    if (!this._enable) {
      this._enable = !0;
        this._historyOpts();
        this._updateImageryLayersAlpha(this._alpha);
      var e = this._viewer;
      Cesium.ExpandByMars.underEarth.cullFace = !1;
        Cesium.ExpandByMars.underEarth.enable = !0;
        Cesium.ExpandByMars.underEarth.enableDepth = this._depth;
        Cesium.ExpandByMars.underEarth.enableSkirt = !0;
        e.scene.globe.depthTestAgainstTerrain = !0;
        e.scene.highDynamicRange = !1;
        e.scene.skyAtmosphere.show = !1;
        e.scene.skyBox.show = !1;
        if(e.scene.globe._surface._tileProvider && e.scene.globe._surface._tileProvider._renderState && e.scene.globe._surface._tileProvider._renderState.blending){
          e.scene.globe._surface._tileProvider._renderState.blending.enabled = !0;
          e.scene.globe._surface._tileProvider._renderState.blending.equationRgb = Cesium.BlendEquation.ADD;
          e.scene.globe._surface._tileProvider._renderState.blending.equationAlpha = Cesium.BlendEquation.ADD;
          e.scene.globe._surface._tileProvider._renderState.blending.functionSourceAlpha = Cesium.BlendFunction.ONE;
          e.scene.globe._surface._tileProvider._renderState.blending.functionSourceRgb = Cesium.BlendFunction.ONE;
          e.scene.globe._surface._tileProvider._renderState.blending.functionDestinationAlpha = Cesium.BlendFunction.ZERO;
          e.scene.globe._surface._tileProvider._renderState.blending.functionDestinationRgb = Cesium.BlendFunction.ZERO;
        }
    }
  }
  Underground.prototype.disable = function () {
    if (this._enable) {
      this._enable = !1;
        this._updateImageryLayersAlpha(this._oldViewOpts.alpha);
      var e = this._viewer;
      Cesium.ExpandByMars.underEarth.cullFace = void 0;
        Cesium.ExpandByMars.underEarth.enable = !1;
        Cesium.ExpandByMars.underEarth.enableDepth = 0;
        Cesium.ExpandByMars.underEarth.enableSkirt = !1;
        e.scene.globe.depthTestAgainstTerrain = this._oldViewOpts.depthTest;
        e.scene.skyBox.show = this._oldViewOpts.skyBoxShow;
        e.scene.highDynamicRange = this._oldViewOpts.highDynamicRange;
        e.scene.skyAtmosphere.show = this._oldViewOpts.skyShow;
      
        void 0 != this._oldViewOpts.blending && (e.scene.globe._surface._tileProvider._renderState.blending = this._oldViewOpts.blending);
    }
  }
  Underground.prototype.destroy = function () {
    delete this._viewer;
      delete this._alpha;
      delete this._depth;
      delete this._enable;
      delete this._oldViewOpts;
  }
export default  Underground;
