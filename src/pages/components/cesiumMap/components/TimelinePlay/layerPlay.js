export function playWmts() {

}


addLayer = async (v) => {
    const { positionDistrict } = this.props.LayerManager;
    const { cesiumData, Buttonshow } = this.state;
    const { reality: { sz_osgb } } = motherBoard;
    let data = null;
    let $that = this;
    let realUrl;
    if (!v) return;
    v.type = v && v.type && v.type.toLowerCase();

    switch (v.type) {
        case 'terrain':
            let terrain = new Cesium.CesiumTerrainProvider({
                url: v.url,
            });
            viewer.terrainProvider = terrain;
            data = terrain;
            break;
        case '3dtiles':
            realUrl = this.getCesiumUrl(v.url, true);
            let cesium3DTileset;
            if (!Cesium.defined(cesium3DTileset)) {
                cesium3DTileset = new Cesium.Cesium3DTileset({
                    url: realUrl,
                    modelMatrix: v.modelMatrix || Cesium.Matrix4.IDENTITY,
                });
                viewer.scene.primitives.add(cesium3DTileset);
                cesium3DTileset.readyPromise.then(function (tileset) {
                    if (v.offsetHeight) {//调整高度
                        let origin = tileset.boundingSphere.center;
                        let cartographic = Cesium.Cartographic.fromCartesian(origin);
                        let surface = Cesium.Cartesian3.fromRadians(cartographic.longitude, cartographic.latitude, 0.0);
                        let offset = Cesium.Cartesian3.fromRadians(cartographic.longitude, cartographic.latitude, v.offsetHeight);
                        let translation = Cesium.Cartesian3.subtract(offset, surface, new Cesium.Cartesian3());
                        tileset.modelMatrix = Cesium.Matrix4.fromTranslation(translation);
                    }
                    // viewer.flyTo(cesium3DTileset)
                });
            }
            data = cesium3DTileset;
            break;
        case 'zhuji_district':
            let big_dataSource = new Cesium.CustomDataSource('zhuji_district');
            viewer.dataSources.add(big_dataSource);
            Object.keys(positionDistrict).forEach(item => {
                // this.addLabel({
                //   position: positionDistrict[item],
                //   name: item,
                //   size: 24,
                //   height: 150,
                //   type: 'district'
                // })
                const label = big_dataSource.entities.add({
                    position: Cesium.Cartesian3.fromDegrees(...positionDistrict[item], 150),
                    label: {
                        id: item,
                        text: item,
                        font: 24 + 'px PingFangSC-Medium',
                        fillColor: Cesium.Color.WHITE,
                        translucencyByDistance: new Cesium.NearFarScalar(1.5e5, 1.0, 1.5e6, 0.0),
                        scaleByDistance: new Cesium.NearFarScalar(1.5e5, 1.0, 1.5e6, 0.1),
                        outlineWidth: 2,
                        backgroundPadding: new Cesium.Cartesian2(12, 8),
                        backgroundColor: Cesium.Color.fromCssColorString('#1694E7').withAlpha(.1),
                        pixelOffset: new Cesium.Cartesian2(-30, -30),
                        horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
                    },
                });
            });
            // viewer.flyTo(big_dataSource)
            data = big_dataSource;
            break;
        case 'zhuji_street':
            // var prefixUrl = `/portal/manager/poiNs/range`;
            // const markImg = require('')
            var prefixUrl = `/portal/manager/poi/range`;
            let zhuji_dataSource18 = new Cesium.CustomDataSource('zhuji18');
            let zhuji_dataSource19 = new Cesium.CustomDataSource('zhuji19');
            let zhuji_dataSource20 = new Cesium.CustomDataSource('zhuji20');
            zhuji_dataSource18.show = false;
            zhuji_dataSource19.show = false;
            zhuji_dataSource20.show = false;
            viewer.dataSources.add(zhuji_dataSource18, { clampToGround: true });
            viewer.dataSources.add(zhuji_dataSource19, { clampToGround: true });
            viewer.dataSources.add(zhuji_dataSource20, { clampToGround: true });

            function addFeature(url, dataSource) {
                $.ajax({
                    url: url,
                    type: 'get',
                    dataType: 'json',
                    contentType: 'application/json;charset=UTF-8',
                    success: function (data) {
                        if (data.code == 200) {
                            // let list = data.data === null ? [] : data.data.list
                            // console.log(list)
                            data.data && data.data.forEach((item, index) => {
                                //添加实体
                                var entitie = dataSource.entities.add({
                                    name: item.textString,
                                    position: Cesium.Cartesian3.fromDegrees(item.x, item.y),
                                    // billboard: {
                                    //   image: './config/images/mark1.png',
                                    //   scale: 0.8,  //原始大小的缩放比例
                                    //   horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
                                    //   verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                                    //   heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
                                    //   scaleByDistance: new Cesium.NearFarScalar(1.5e2, 1.0, 8.0e6, 0.2)
                                    // },
                                    label: {
                                        text: item.textString,
                                        font: 'normal small-caps normal 12px 宋体',
                                        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                                        fillColor: Cesium.Color.WHITE,
                                        outlineColor: Cesium.Color.BLACK,
                                        outlineWidth: 2,
                                        showBackground: true,
                                        backgroundColor: Cesium.Color.fromAlpha(Cesium.Color.fromCssColorString('#000000'), .9),
                                        backgroundPadding: new Cesium.Cartesian2(8, 3),
                                        horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
                                        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                                        pixelOffset: new Cesium.Cartesian2(0, -24),   //偏移量  
                                        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
                                        distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0.0, 2000000),
                                    },
                                    data: item,
                                });
                            });
                        }
                    },
                    error: function (data) {
                        console.log('请求出错(' + data.status + ')：' + data.statusText);
                    },
                });
            }

            addFeature(prefixUrl + `/${18}`, zhuji_dataSource18);
            addFeature(prefixUrl + `/${19}`, zhuji_dataSource19);
            addFeature(prefixUrl + `/${20}`, zhuji_dataSource20);
            //监听鼠标滚动事件
            var zhuji_handler = new Cesium.ScreenSpaceEventHandler(viewer.canvas);
            zhuji_handler.setInputAction((event) => {
                var level = 0;
                if (viewer.scene.globe._surface._tilesToRender.length) {
                    level = viewer.scene.globe._surface._tilesToRender[0].level;
                }
                if (level > 15 && level < 17) {
                    zhuji_dataSource18.show = true;
                    zhuji_dataSource19.show = false;
                    zhuji_dataSource20.show = false;
                } else if (level >= 17 && level < 19) {
                    zhuji_dataSource18.show = false;
                    zhuji_dataSource19.show = true;
                    zhuji_dataSource20.show = false;
                } else if (level >= 19 && level < 21) {
                    zhuji_dataSource18.show = false;
                    zhuji_dataSource19.show = false;
                    zhuji_dataSource20.show = true;
                } else {
                    zhuji_dataSource18.show = false;
                    zhuji_dataSource19.show = false;
                    zhuji_dataSource20.show = false;
                }
            }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
            data = [zhuji_dataSource20, zhuji_dataSource19, zhuji_dataSource20];
            this.setState({
                zhuji_handler,
            });
            break;
        case 'wms':
            realUrl = this.getCesiumUrl(v.url, true);

            let provider = new Cesium.WebMapServiceImageryProvider({
                url: realUrl,
                layers: v.layerName,
                crs: 'EPSG:4490',
                parameters: {
                    transparent: true,
                    format: 'image/png',
                },
            });
            let imageryLayer = viewer.imageryLayers.addImageryProvider(provider);
            viewer.camera.flyTo({
                destination: {
                    x: -2455009.579833841,
                    y: 5462458.593463376,
                    z: 2392774.6950951326,
                },
                orientation: {
                    direction: {
                        x: 0.37770042545634724,
                        y: -0.8403930280909273,
                        z: 0.3886926124153328,
                    },
                    up: {
                        x: -0.1593385555179573,
                        y: 0.3545323281052194,
                        z: 0.9213674907732223,
                    },
                },
            });
            data = imageryLayer;
            break;
        case 'wmts':
            var imageslayers = window.viewer.imageryLayers;
            var dataDetail = JSON.parse(v.dataDetail);
            var gridsetName = dataDetail.find((i) => i.paramName === 'tileMatrixSetID') || {};
            var mapName = dataDetail.find((i) => i.paramName === "layer") || {};
            var url = v.url.replace("gatewayoms", "168.4.0.3")

            var r = new Cesium.Resource({
                url: `${url}rest/${mapName.value}/${gridsetName.value}/${gridsetName.value}:{TileMatrix}/{TileRow}/{TileCol}?format=image/png`,
                // headers:
                // {
                //     'szvsud-license-key': window.localStorage.getItem('userLicenseKey'),
                // },
            });

            var source = new Cesium.WebMapTileServiceImageryProvider({
                url: r,
            });

            data = window.data = imageslayers.addImageryProvider(source);

            break
        case 'shenzhen_dl1':
            let shenzhen_dl1000 = new Cesium.CustomDataSource('shenzhen_dl1000');
            let shenzhen_dl10000 = new Cesium.CustomDataSource('shenzhen_dl10000');
            let shenzhen_dl250000 = new Cesium.CustomDataSource('shenzhen_dl250000');
            shenzhen_dl1000.show = false;
            shenzhen_dl10000.show = false;
            shenzhen_dl250000.show = false;
            viewer.dataSources.add(shenzhen_dl1000);
            viewer.dataSources.add(shenzhen_dl10000);
            viewer.dataSources.add(shenzhen_dl250000);

            function addSz_dl(url, dataSource) {
                let promise_line = Cesium.GeoJsonDataSource.load(url);
                promise_line.then(data => {
                    let entities = data.entities.values;
                    entities.map(entity => {
                        entity.polyline.width = entity.properties.getValue().WIDTH != null ? parseFloat(entity.properties.getValue().WIDTH / 3) : 0;
                        dataSource.entities.add(entity);
                    });
                });
            }

            addSz_dl(v.url['250000'], shenzhen_dl250000);
            addSz_dl(v.url['10000'], shenzhen_dl10000);
            addSz_dl(v.url['1000'], shenzhen_dl1000);
            //监听鼠标滚动事件
            var handler = new Cesium.ScreenSpaceEventHandler(viewer.canvas);
            handler.setInputAction((event) => {
                var level = 0;
                if (viewer.scene.globe._surface._tilesToRender.length) {
                    level = viewer.scene.globe._surface._tilesToRender[0].level;
                }
                // console.log(level);
                if (level > 5 && level < 10) {
                    shenzhen_dl1000.show = false;
                    shenzhen_dl10000.show = false;
                    shenzhen_dl250000.show = true;
                } else if (level >= 10 && level < 13) {
                    shenzhen_dl1000.show = false;
                    shenzhen_dl10000.show = true;
                    shenzhen_dl250000.show = false;
                } else if (level >= 13 && level < 21) {
                    shenzhen_dl1000.show = true;
                    shenzhen_dl10000.show = false;
                    shenzhen_dl250000.show = false;
                } else {
                    shenzhen_dl1000.show = false;
                    shenzhen_dl10000.show = false;
                    shenzhen_dl250000.show = false;
                }
            }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
            data = [shenzhen_dl1000, shenzhen_dl10000, shenzhen_dl250000];
            this.setState({
                handler,
            });
            break;
        case 'shenzhen_dl':
            let dlx_1000 = new Cesium.CustomDataSource('dlx_1000');
            let dlx_10000 = new Cesium.CustomDataSource('dlx_10000');
            let dlx_250000 = new Cesium.CustomDataSource('dlx_250000');

            viewer.dataSources.add(dlx_1000);
            viewer.dataSources.add(dlx_10000);
            viewer.dataSources.add(dlx_250000);

            function addlx(url, dataSource, param) {
                $.ajax({
                    url: `${url}&bbox=${param.minx}%2C${param.miny}%2C${param.maxx}%2C${param.maxy}`,
                    type: 'get',
                    dataType: 'json',
                    contentType: 'application/json;charset=UTF-8',
                    success: function (data) {
                        if (data && data.features && data.features.length) {
                            dataSource.entities.removeAll();
                            let promise_line = Cesium.GeoJsonDataSource.load(data, {
                                clampToGround: true,
                            });
                            promise_line.then(data => {
                                let entities = data.entities.values;
                                entities.map(entity => {
                                    entity.polyline.width = entity.properties.getValue().WIDTH != null ? parseFloat(entity.properties.getValue().WIDTH / 3) : 0;
                                    dataSource.entities.add(entity);
                                });
                            });
                        }
                    },
                    error: function (data) {
                        console.log('请求出错(' + data.status + ')：' + data.statusText);
                    },
                });
            }

            // 处理函数
            const that = this;

            function handle() {
                var level = 0;
                if (viewer.scene.globe._surface._tilesToRender.length) {
                    level = viewer.scene.globe._surface._tilesToRender[0].level;
                }
                // console.log(level)
                let param = that.getViewExtend();//获取当前视域范围
                if (level > 9 && level < 12) {
                    dlx_1000.show = false;
                    dlx_10000.show = false;
                    dlx_250000.show = true;
                    addlx(v.url['250000'], dlx_250000, param);
                } else if (level >= 12 && level < 14) {
                    dlx_1000.show = false;
                    dlx_10000.show = true;
                    dlx_250000.show = false;
                    addlx(v.url['10000'], dlx_10000, param);
                } else if (level >= 14 && level < 20) {
                    dlx_1000.show = true;
                    dlx_10000.show = false;
                    dlx_250000.show = false;
                    addlx(v.url['1000'], dlx_1000, param);
                } else {
                    dlx_1000.show = false;
                    dlx_10000.show = false;
                    dlx_250000.show = false;
                }
            }

            // 防抖
            function debounce(fn, wait) {
                var timeout = null;
                return function () {
                    if (timeout !== null) clearTimeout(timeout);
                    timeout = setTimeout(fn, wait);
                };
            }
            // 滚动事件
            var szdlx_handler = window.addEventListener('mousemove', debounce(handle, 1000));
            data = [dlx_1000, dlx_10000, dlx_250000];
            this.setState({
                szdlx_handler,
            });
            break;
        case 'tian_vec':
            let imageryLayer1 = viewer.imageryLayers.addImageryProvider(new Cesium.WebMapTileServiceImageryProvider({
                url: 'http://{s}.tianditu.gov.cn/vec_c/wmts?service=wmts&request=GetTile&version=1.0.0' +
                    '&LAYER=vec&tileMatrixSet=c&TileMatrix={TileMatrix}&TileRow={TileRow}&TileCol={TileCol}' +
                    '&style=default&format=tiles&tk=6e179266b26b2e2c5c4cce2c91823f40',
                layer: 'vec',
                style: 'default',
                format: 'tiles',
                tileMatrixSetID: 'c',
                subdomains: ['t0', 't1', 't2', 't3', 't4', 't5', 't7'],
                tilingScheme: new Cesium.GeographicTilingScheme(),
                tileMatrixLabels: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19'],
                maximumLevel: 50,
                show: true,
            }));
            data = imageryLayer1;
            break;
        case 'tian_img':
            let imageryLayer2 = viewer.imageryLayers.addImageryProvider(new Cesium.WebMapTileServiceImageryProvider({
                url: 'http://{s}.tianditu.gov.cn/img_c/wmts?service=wmts&request=GetTile&version=1.0.0' +
                    '&LAYER=img&tileMatrixSet=c&TileMatrix={TileMatrix}&TileRow={TileRow}&TileCol={TileCol}' +
                    '&style=default&format=tiles&tk=6e179266b26b2e2c5c4cce2c91823f40',
                layer: 'img',
                style: 'default',
                format: 'tiles',
                tileMatrixSetID: 'c',
                subdomains: ['t0', 't1', 't2', 't3', 't4', 't5', 't7'],
                tilingScheme: new Cesium.GeographicTilingScheme(),
                tileMatrixLabels: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19'],
                maximumLevel: 50,
                show: true,
            }));
            data = imageryLayer2;
            break;
        case 'fin3dtiles':
            //精细模型加载
            // document.getElementById("Maskb").style.display="block";
            cesium3DTileset = this.getModelbyurl(v.url);
            window.szlayer && (window.szlayer.show = true);
            if (cesium3DTileset) {
                cesium3DTileset.show = true;
            } else {
                cesium3DTileset = new Cesium.Cesium3DTileset({
                    url: realUrl,
                });
                viewer.scene.primitives.add(cesium3DTileset);
                cesium3DTileset.readyPromise.then(function (tileset) {
                    tileset.asset.dataType = v.datatype;
                    if (v.offsetHeight) {//调整高度
                        let origin = tileset.boundingSphere.center;
                        let cartographic = Cesium.Cartographic.fromCartesian(origin);
                        let surface = Cesium.Cartesian3.fromRadians(cartographic.longitude, cartographic.latitude, 0.0);
                        let offset = Cesium.Cartesian3.fromRadians(cartographic.longitude, cartographic.latitude, v.offsetHeight);
                        let translation = Cesium.Cartesian3.subtract(offset, surface, new Cesium.Cartesian3());
                        tileset.modelMatrix = Cesium.Matrix4.fromTranslation(translation);
                    }
                });
            }
            if (cesium3DTileset.asset.loaded) {
                // document.getElementById("Maskb").style.display="none";
            } else {
                cesium3DTileset.allTilesLoaded.addEventListener(function () {
                    cesium3DTileset.asset.loaded = true;
                    // document.getElementById("Maskb").style.display="none";


                });
            }


            addfin3dTilestime++;
            //隐藏 倾斜摄影
            // console.log('各大行政区倾斜摄影已隐藏');
            var List = ['dapeng', 'baoan', 'futian', 'guangming', 'lingdingdao', 'longgang', 'longhua', 'luohu', 'nanshan', 'pingshan', 'yantian'];
            List.forEach((element) => {
                let url = sz_osgb.children[element];
                let primitives = this.getModelbyurl(url);
                if (primitives.show) {
                    primitives.show = false;
                } else {
                    return;
                }
            });

            // let primitives = this.getModelbyurl(sz_osgb.url);
            // if(primitives.show){
            //   primitives.show = false;
            // }
            data = cesium3DTileset;
            break;
        case 'geojson':

            realUrl = this.getCesiumUrl(v.url, true);
            var dataSource = await viewer.dataSources.add(Cesium.GeoJsonDataSource.load(realUrl, {
                clampToGround: true,
            }));

            data = dataSource;
            break;
        case 'mapserver':
            realUrl = this.getCesiumUrl(v.url, true);
            data = this.loadMapServer(realUrl);
            break;
        case 'kml':
            realUrl = this.getCesiumUrl(v.url, true);
            data = this.loadKMLKMZ(realUrl);
            break;
        case 'kmz':
            realUrl = this.getCesiumUrl(v.url, true);
            data = this.loadKMLKMZ(realUrl);
            break;
        case 'wfs':

            var requestParams = v.gisApi.requestParams || [];
            var typeName = requestParams.find((i) => i.name === 'typeName') || {};
            realUrl = this.getCesiumUrl(v.url + `?service=WFS&request=GetFeature&typeName=${typeName.description}&outputFormat=application/json`, true);
            data = await viewer.dataSources.add(Cesium.GeoJsonDataSource.load(realUrl));

            break;
        case 'arcgis-imageserver':
            var dataDetail = JSON.parse(v.dataDetail);
            var rectangle = dataDetail.find((i) => i.paramName === "rectangle") || {};
            realUrl = this.getArcgisUrl(v.url + "exportImage", true);
            data = this.loadArcgisServer(realUrl, rectangle.value);
            break;
        case 'arcgis-mapserver':
            realUrl = this.getArcgisUrl(v.url, true);
            var dataDetail = JSON.parse(v.dataDetail);
            var rectangle = dataDetail.find((i) => i.paramName === "rectangle") || {};
            data = this.loadArcgisServer(realUrl, rectangle.value);
            break;
        case 'arcgis-featureserver':
            realUrl = this.getArcgisUrl(v.url, true);
            var dataDetail = JSON.parse(v.dataDetail);
            var rectangle = dataDetail.find((i) => i.paramName === "rectangle") || {};
            var layer = dataDetail.find(i => i.paramName === 'layer') || {};
            data = this.loadArcgisServer(realUrl, rectangle.value, layer.value);
            break;
    }
    return data;
    // this.setState({
    //   cesiumData: {
    //     ...cesiumData,
    //     [v.id]: data
    //   }
    // })
};



//在cesium图层里面添加license-key
getArcgisUrl = (url) => {
    // return url;
    return new Cesium.Resource({
        url: url,
        queryParameters: {
            'szvsud-license-key': window.localStorage.getItem('userLicenseKey'),
        }
    });
};

//在cesium图层里面添加license-key
getCesiumUrl = (url, needKey) => {
    return url;
    // return new Cesium.Resource({
    //     url: url,
    //     headers: needKey
    //         ? {
    //             'szvsud-license-key': window.localStorage.getItem('userLicenseKey'),
    //         }
    //         : {},
    //     retryCallback: (resource, error) => {
    //         if (error) {
    //             if (error.statusCode === 401) message.error('当前数据预览接口您无访问权限');
    //             else if (error.statusCode === 404)
    //                 message.error('当前数据预览接口已暂停服务或被删除');
    //             // else this.errorHandler('当前数据预览接口访问错误');
    //         }
    //         return false;
    //     },
    //     retryAttempts: 1,
    // });
};