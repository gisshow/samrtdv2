/* global Cesium */
/* global viewer */
var featureViewer = {
    colorHighlight: Cesium.Color.YELLOW,
    colorSelected: Cesium.Color.fromCssColorString('#e8da4e'),
    setMouseOver: function (v) {

        if (v) {
            this.viewer.screenSpaceEventHandler.setInputAction(this.onMouseMove, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
        } else {

            this.restoreHighlight();

            this.nameOverlay.style.display = 'none';
            this.viewer.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE);
        }
    },
    setMouseClick: function (v) {

        if (v) {
            this.orginClickHandler = this.viewer.screenSpaceEventHandler.getInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK);
            this.viewer.screenSpaceEventHandler.setInputAction(this.onLeftClick, Cesium.ScreenSpaceEventType.LEFT_CLICK);
        } else {

            //设置为原来的
            this.viewer.screenSpaceEventHandler.setInputAction(this.orginClickHandler, Cesium.ScreenSpaceEventType.LEFT_CLICK);
        }
    },
    uninstall: function () {
        this.setMouseOver(false);
        this.setMouseClick(false);
        this.pickTiles=[];
    },
    selected: {
        feature: undefined,
        originalColor: new Cesium.Color(),
        isExtract:false,//是否抽出
        floorTile:undefined,//整个楼层的Tile

    },
    pickTiles:[],
    install: function (viewer, callback) {


        var nameOverlay = document.createElement('div');
        viewer.container.appendChild(nameOverlay);
        nameOverlay.className = 'backdrop';
        nameOverlay.style.display = 'none';
        nameOverlay.style.position = 'absolute';
        nameOverlay.style.bottom = '0';
        nameOverlay.style.left = '0';
        nameOverlay.style['pointer-events'] = 'none';
        nameOverlay.style.padding = '4px';
        nameOverlay.style.backgroundColor = 'black';
        this.nameOverlay = nameOverlay;

        // var selected = {
        //     feature: undefined,
        //     originalColor: new Cesium.Color()
        // };


        var highlighted = {
            feature: undefined,
            originalColor: new Cesium.Color()
        };


        var selectedEntity = new Cesium.Entity();



        this.viewer = viewer;

        var stage = viewer.scene.postProcessStages.add(
            new Cesium.PostProcessStage({
                fragmentShader: fragmentShaderSource,
                uniforms: {
                    highlight: function () {
                        return Cesium.Color.fromCssColorString('#a9f0ff');;
                    },
                },
            })
        );
        stage.selected = [];

        this.restoreHighlight = function () {
            // If a feature was previously highlighted, undo the highlight
            if (Cesium.defined(highlighted.feature)) {

                try {
                    highlighted.feature.color = highlighted.originalColor;

                } catch (ex) {

                }
                highlighted.feature = undefined;
            }
        }

        this.onMouseMove = function (movement) {
            // self.restoreHighlight();

            // Pick a new feature
            var pickedFeature = viewer.scene.pick(movement.endPosition);
            if (Cesium.defined(pickedFeature) && pickedFeature !== self.selected.feature) {
                stage.selected = [pickedFeature];
            } else {
                stage.selected = [];
            }
            // if (!Cesium.defined(pickedFeature)) {
            //     nameOverlay.style.display = 'none';
            //     return;
            // }

            // if (!Cesium.defined(pickedFeature.getProperty)) {
            //     nameOverlay.style.display = 'none';
            //     return;
            // }
            // // A feature was picked, so show it's overlay content

            // var name = pickedFeature.getProperty('name');
            // if (!Cesium.defined(name)) {
            //     name = pickedFeature.getProperty('id');
            // }
            // if (!Cesium.defined(name)) {
            //     name = pickedFeature.getProperty('InternalElementId');
            // }
            // if (name == '') {
            //     nameOverlay.style.display = 'none';
            //     return;
            // }

            // nameOverlay.style.display = 'block';
            // nameOverlay.style.bottom = viewer.canvas.clientHeight - movement.endPosition.y + 'px';
            // nameOverlay.style.left = movement.endPosition.x + 'px';

            // nameOverlay.textContent = name;

            

            // Highlight the feature if it's not already selected.
            // if (pickedFeature !== self.selected.feature) {
            //     highlighted.feature = pickedFeature;
            //     Cesium.Color.clone(pickedFeature.color, highlighted.originalColor);
            //     pickedFeature.color = self.colorHighlight;
            // }
        };

        var self = this;
        this.onLeftClick = function (movement) {
            // If a feature was previously this.selected, undo the highlight
            if (Cesium.defined(self.selected.feature)) {

                try {
                    self.selected.feature.color = self.selected.originalColor;

                } catch (ex) {

                }
                self.selected.feature = undefined;
            }

            var pickedFeature=undefined;
            var pickedObjects = viewer.scene.drillPick(movement.position, 5);

            for (var i = 0; i < pickedObjects.length; i++) {
                var pickedObject = pickedObjects[i];

                if (Cesium.defined(pickedObject) && self.pickTiles.indexOf(pickedObject.primitive)>-1) {
                    pickedFeature=pickedObject;
                    break;
                }
            }

            // Pick a new feature
            // var pickedFeature = viewer.scene.pick(movement.position);
            if (!Cesium.defined(pickedFeature)) {
                self.orginClickHandler(movement);
                //如果不是相同楼层，则缩回
                if(self.selected.floorTile){
                    var root=self.selected.floorTile;
                    let mat=root.transform;
                    Cesium.Matrix4.multiplyByTranslation(mat, new Cesium.Cartesian3(-60,0,0), mat);
                    root.transform=mat;
                    self.selected.isExtract=false;
                    self.selected.floorTile=undefined;
                } 
                return;
            }

            // Select the feature if it's not already this.selected
            if (self.selected.feature === pickedFeature) {
                return;
            }

           

            //如果不是相同楼层，则缩回
            if(self.selected.floorTile && self.selected.floorTile!==pickedFeature.primitive.root){
                var root=self.selected.floorTile;
                let mat=root.transform;
                Cesium.Matrix4.multiplyByTranslation(mat, new Cesium.Cartesian3(-60,0,0), mat);
                root.transform=mat;
                self.selected.isExtract=false;
                self.selected.floorTile=undefined;
            }  

            if (!Cesium.defined(pickedFeature.getProperty)){
                
                return;
            }

            self.selected.feature = pickedFeature;
            // self.selected.floorTile=pickedFeature.primitive.root.root;


            // Save the this.selected feature's original color
            if (pickedFeature === highlighted.feature) {
                Cesium.Color.clone(highlighted.originalColor, self.selected.originalColor);
                highlighted.feature = undefined;
            } else {
                Cesium.Color.clone(pickedFeature.color, self.selected.originalColor);
            }

            // Highlight newly this.selected feature
            if(self.selected.isExtract){
                pickedFeature.color = self.colorSelected;
            }
            

            // Set feature infobox description


            var featureName = pickedFeature.getProperty('name');
            selectedEntity.name = featureName;
            selectedEntity.description = 'Loading <div class="cesium-infoBox-loading"></div>';
            viewer.selectedEntity = selectedEntity;

            // console.log('name:' + pickedFeature.getProperty('name'),'id:' + pickedFeature.getProperty('id') );
            // console.log(pickedFeature,pickedFeature.content.url, 'InternalElementId:' + pickedFeature.getProperty('InternalElementId') );//+ " ; name:" + featureName);

            var names = pickedFeature._content.batchTable.getPropertyNames(pickedFeature._batchId);

            if (callback) {
                let cartesian=getCurrentMousePosition(viewer.scene, movement.position);
                callback(pickedFeature,featureName,cartesian,movement.position);
            }

        }

        this.setMouseOver(true);
        this.setMouseClick(true);
    }


};

/**
 * 获取鼠标当前的屏幕坐标位置的三维Cesium坐标
 * @param {Cesium.Scene} scene 
 * @param {Cesium.Cartesian2} position 二维屏幕坐标位置
 * @param {Cesium.Entity} noPickEntity 排除的对象（主要用于绘制中，排除对自己本身的拾取）
 */
function getCurrentMousePosition(scene, position, noPickEntity) {
    var cartesian;

    //在模型上提取坐标  
    var pickedObject = scene.pick(position);
    if (scene.pickPositionSupported && Cesium.defined(pickedObject)) {
        //pickPositionSupported :判断是否支持深度拾取,不支持时无法进行鼠标交互绘制

        // if (hasPickedModel(pickedObject, noPickEntity)) {
            var cartesian = scene.pickPosition(position);
            if (Cesium.defined(cartesian)) {
                var cartographic = Cesium.Cartographic.fromCartesian(cartesian);
                var height = cartographic.height; //模型高度
                if (height >= 0) return cartesian;

                //不是entity时，支持3dtiles地下
                if (!Cesium.defined(pickedObject.id) && height >= -500) return cartesian;
            }
        // }
    }

    //测试scene.pickPosition和globe.pick的适用场景 https://zhuanlan.zhihu.com/p/44767866
    //1. globe.pick的结果相对稳定准确，不论地形深度检测开启与否，不论加载的是默认地形还是别的地形数据；
    //2. scene.pickPosition只有在开启地形深度检测，且不使用默认地形时是准确的。
    //注意点： 1. globe.pick只能求交地形； 2. scene.pickPosition不仅可以求交地形，还可以求交除地形以外其他所有写深度的物体。

    //提取鼠标点的地理坐标 
    if (scene.mode === Cesium.SceneMode.SCENE3D) {
        //三维模式下
        var pickRay = scene.camera.getPickRay(position);
        cartesian = scene.globe.pick(pickRay, scene);
    } else {
        //二维模式下
        cartesian = scene.camera.pickEllipsoid(position, scene.globe.ellipsoid);
    }
    return cartesian;
}


// Shade selected model with highlight.
var fragmentShaderSource =
    "uniform sampler2D colorTexture;\n" +
    "varying vec2 v_textureCoordinates;\n" +
    "uniform vec4 highlight;\n" +
    "void main() {\n" +
    "    vec4 color = texture2D(colorTexture, v_textureCoordinates);\n" +
    "    if (czm_selected()) {\n" +
    "        vec3 highlighted = highlight.a * highlight.rgb + (1.0 - highlight.a) * color.rgb;\n" +
    "        gl_FragColor = vec4(highlighted, 1.0);\n" +
    "    } else { \n" +
    "        gl_FragColor = color;\n" +
    "    }\n" +
    "}\n";


export default featureViewer;
    // return featureViewer;
