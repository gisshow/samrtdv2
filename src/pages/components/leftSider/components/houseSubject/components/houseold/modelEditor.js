/* global Cesium */
// (function () {
import  move from './images/move.png'
import  rotate from './images/rotate.png'
    var MouseEditor = function (options) {
        this.options = options;

        //必须的参数
        this.viewer = options.viewer;
        this.position = options.position;
        this.heading = options.heading || 0;
        this.range = options.range || 100;


        this.scene = this.viewer.scene;

        this.billboards = this.scene.primitives.add(new Cesium.BillboardCollection());


        this.dragging = false;
        this.rotating = false;


        //依据位置和朝向计算 旋转矩阵
        this.modelRotateMat = function () {
            var mat = Cesium.Matrix4.getRotation(this.modelMatrix(), new Cesium.Matrix3());
            return mat;
        }

        this.modelMatrix = function () {
            var mat = Cesium.Transforms.eastNorthUpToFixedFrame(this.position);
            var rotationX = Cesium.Matrix4.fromRotationTranslation(Cesium.Matrix3.fromRotationZ(this.heading));
            Cesium.Matrix4.multiply(mat, rotationX, mat);

            if (this.scale > 0 && this.scale!=1)
                Cesium.Matrix4.multiplyByUniformScale(mat, this.scale, mat);

            return mat;
        }

        //依据位置和朝向计算 旋转的位置
        this.rotationPos = function () {
            var rotpos = new Cesium.Cartesian3(this.range, 0.0, 0.0);
            var mat = this.modelRotateMat();
            rotpos = Cesium.Matrix3.multiplyByVector(mat, rotpos, rotpos);
            rotpos = Cesium.Cartesian3.add(this.position, rotpos, rotpos);
            return rotpos;
        }

        //用来平移位置的指示器
        this.movep = this.billboards.add({
            position: this.position,
            color: new Cesium.Color.fromCssColorString("#FFFF00"),
            image: move,
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
            show: false,
        });
        //用来旋转的指示器
        this.rotatep = this.billboards.add({
            position: this.position ? this.rotationPos() : null,
            color: new Cesium.Color.fromCssColorString("#FFFF00"),
            image: rotate,
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
            show: false,
        });


        this.pickTerrain = function (wndpos) {
            var ray = this.viewer.camera.getPickRay(wndpos);
            var pos = this.viewer.scene.globe.pick(ray, this.viewer.scene);

            if (!pos)
                return;

            var cartographic = Cesium.Ellipsoid.WGS84.cartesianToCartographic(pos);

            return pos;
        }


        this._onLeftdown = function (click) {
            var pickedObjects = this.scene.drillPick(click.position, 2);

            for (var i = 0; i < pickedObjects.length; i++) {
                var pickedObject = pickedObjects[i];

                if (Cesium.defined(pickedObject) && (pickedObject.primitive === this.movep)) {
                    this.dragging = true;
                    this.scene.screenSpaceCameraController.enableRotate = false;
                    break;
                } else if (Cesium.defined(pickedObject) && (pickedObject.primitive === this.rotatep)) {
                    this.rotating = true;
                    this.scene.screenSpaceCameraController.enableRotate = false;
                    break;
                }
            }
        }
        this._onMousemove = function (movement) {


            if (this.dragging) {
                var position = this.pickTerrain(movement.endPosition);
                if (!position)
                    return;


                this.position = position;

                this.movep.position = this.position;

                this.rotatep.position = this.rotationPos();

                if (this.options.onPosition) {
                    this.options.onPosition(this.position);
                }

            } else if (this.rotating) {

                var position = this.pickTerrain(movement.endPosition);
                if (!position)
                    return;

                this.rotatep.position = position;
                this.range = Cesium.Cartesian3.distance(this.position,position);

                //获取该位置的默认矩阵
                //var transmat = Cesium.Matrix4.IDENTITY;
                var mat = Cesium.Transforms.eastNorthUpToFixedFrame(this.position);
                // Cesium.Matrix4.multiply(mat, transmat, mat);
                mat = Cesium.Matrix4.getRotation(mat, new Cesium.Matrix3());


                var xaxis = Cesium.Matrix3.getColumn(mat, 0, new Cesium.Cartesian3());
                var yaxis = Cesium.Matrix3.getColumn(mat, 1, new Cesium.Cartesian3());
                var zaxis = Cesium.Matrix3.getColumn(mat, 2, new Cesium.Cartesian3());
                //计算该位置 和  position 的 角度值
                var dir = Cesium.Cartesian3.subtract(position, this.position, new Cesium.Cartesian3());
                //  z crosss (dirx cross z) 得到在 xy平面的向量
                dir = Cesium.Cartesian3.cross(dir, zaxis, dir);
                dir = Cesium.Cartesian3.cross(zaxis, dir, dir);
                dir = Cesium.Cartesian3.normalize(dir, dir);

                this.heading = Cesium.Cartesian3.angleBetween(xaxis, dir);
            

                var ay = Cesium.Cartesian3.angleBetween(yaxis, dir);

                if (ay > Math.PI * 0.5) {
                    this.heading = 2 * Math.PI - this.heading;
                }


                if (this.options.onHeading) {
                    this.options.onHeading(this.heading);
                }
                /*
                yaxis = Cesium.Cartesian3.cross(zaxis, xaxis, yaxis);
                yaxis = Cesium.Cartesian3.normalize(yaxis, yaxis);

                zaxis = Cesium.Cartesian3.cross(xaxis, yaxis, zaxis);
                zaxis = Cesium.Cartesian3.normalize(zaxis, zaxis);

                //console.log(heading);
                mat = Cesium.Matrix3.setColumn(mat, 0, xaxis, mat);
                mat = Cesium.Matrix3.setColumn(mat, 1, yaxis, mat);
                mat = Cesium.Matrix3.setColumn(mat, 2, zaxis, mat);
                */
            }


        }
        this._onLeftup = function (click) {
            if (this.dragging || this.rotating) {
                this.rotating = this.dragging = false;
                this.scene.screenSpaceCameraController.enableRotate = true;
                //如果没有这句话 会导致billboards的某些没有刷新，无法再次点击
                this.billboards._createVertexArray = true;
            }
        }



        this.eventhandler = new Cesium.ScreenSpaceEventHandler(this.viewer.canvas);


        this.enable = false;

        this.setEnable = function (v) {
            if (v) {
                var self = this;
                this.eventhandler.setInputAction(function (p) { self._onLeftdown(p); }, Cesium.ScreenSpaceEventType.LEFT_DOWN);
                this.eventhandler.setInputAction(function (p) { self._onMousemove(p); }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
                this.eventhandler.setInputAction(function (p) { self._onLeftup(p); }, Cesium.ScreenSpaceEventType.LEFT_UP);
                
                this.rotatep.show = this.movep.show = true;
            } else {
                this.eventhandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOWN);
                this.eventhandler.removeInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE);
                this.eventhandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_UP);

                this.rotatep.show = this.movep.show = false;
            }
            this._enable = false;
        }

        this.remove = function () { 
            //从场景中移除
            if (this.billboards) {
                this.scene.primitives.remove(this.billboards);
                this.billboards = undefined;
            }

            if (this._enable) {
                this.enable = false;
            }
        }

        this.setPosition = function (opts) {
            for (var key in opts) {
                this[key] = opts[key];
            }

            this.movep.position = this.position;
            this.rotatep.position = this.rotationPos();
        }
    };



    var modelEditor = function (options) {
        return new MouseEditor(options);
    }
     export default modelEditor;

// })();



