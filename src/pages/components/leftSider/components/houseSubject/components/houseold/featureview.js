/* global Cesium */
/* global viewer */
var featureViewer = {
    colorHighlight: Cesium.Color.YELLOW,
    colorSelected: Cesium.Color.fromCssColorString('rgb(255,211,118)').withAlpha(0.5),
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
    },
    setBasicHouseIds:function(basicHouseIds){
        this.basicHouseIds=basicHouseIds;
    },
    selected: {
        feature: undefined,
        originalColor: new Cesium.Color()
    },
    // basicHouseIds:[],//户的IntId
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
                        return Cesium.Color.fromCssColorString('#a9f0ff').withAlpha(0.5);
                    },
                },
            })
        );
        // var edgeStage = Cesium.PostProcessStageLibrary.createEdgeDetectionStage();
        // edgeStage.uniforms.color = Cesium.Color.YELLOW;
        // edgeStage.selected = [];
        // viewer.scene.postProcessStages.add(Cesium.PostProcessStageLibrary.createSilhouetteStage([edgeStage]));
        stage.selected = [];

        var self = this;
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
            var pickedObjects = viewer.scene.drillPick(movement.endPosition,5);
            for (let i = 0; i < pickedObjects.length; i++) {
                let pickedFeature = pickedObjects[i];
                if(!Cesium.defined(pickedFeature.getProperty)) continue;
                let intId=pickedFeature.getProperty("InternalElementId");
                if(self.basicHouseIds && self.basicHouseIds.indexOf(intId)!=-1){
                    stage.selected = [pickedFeature];
                    return;
                }                
            }
            stage.selected = [];
        };

        
        this.onLeftClick = function (movement) {
            // If a feature was previously this.selected, undo the highlight
            if (Cesium.defined(self.selected.feature)) {

                try {
                    self.selected.feature.color = self.selected.originalColor;
                    // console.log(featureViewer.selected.feature);
                    // let feature=self.selected.feature;
                    // let mat=feature.tileset.root.transform;
                    // Cesium.Matrix4.multiplyByTranslation(mat, new Cesium.Cartesian3(-30,0,0), mat);
                    // feature.tileset.root.transform=mat;

                } catch (ex) {

                }
                self.selected.feature = undefined;
            }

            // Pick a new feature
            let pickedFeature=undefined;
            var pickedObjects = viewer.scene.drillPick(movement.position,5);
            for (let i = 0; i < pickedObjects.length; i++) {
                pickedFeature = pickedObjects[i];
                if(!Cesium.defined(pickedFeature.getProperty)) continue;
                let intId=pickedFeature.getProperty("InternalElementId");
                if(self.basicHouseIds.indexOf(intId)!=-1){
                    break;
                }  
            }
            // var pickedFeature = viewer.scene.pick(movement.position);
            if (!Cesium.defined(pickedFeature)) {
                self.orginClickHandler && self.orginClickHandler(movement);
                return;
            }

            // Select the feature if it's not already this.selected
            if (self.selected.feature === pickedFeature) {
                return;
            }

            if (!Cesium.defined(pickedFeature.getProperty))
                return;

            self.selected.feature = pickedFeature;


            // Save the this.selected feature's original color
            if (pickedFeature === highlighted.feature) {
                Cesium.Color.clone(highlighted.originalColor, self.selected.originalColor);
                highlighted.feature = undefined;
            } else {
                Cesium.Color.clone(pickedFeature.color, self.selected.originalColor);
            }

            // Highlight newly this.selected feature
            pickedFeature.color = self.colorSelected;

            // Set feature infobox description


            var featureName = pickedFeature.getProperty('InternalElementId');
            selectedEntity.name = featureName;
            selectedEntity.description = 'Loading <div class="cesium-infoBox-loading"></div>';
            viewer.selectedEntity = selectedEntity;

            // console.log(pickedFeature,pickedFeature.content.url, 'InternalElementId:' + pickedFeature.getProperty('InternalElementId') );//+ " ; name:" + featureName);

            var names = pickedFeature._content.batchTable.getPropertyNames(pickedFeature._batchId);

            if (callback) {
                let cartesian=getCurrentMousePosition(viewer.scene, movement.position);
                callback(featureName,cartesian,movement.position);
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
