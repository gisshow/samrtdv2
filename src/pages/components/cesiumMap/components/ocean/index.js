/* global Cesium */
/* global viewer */
/* global mars */
/* global $ */
/* global mars3d */
/* turf */

import React, { Component } from 'react';
import { Slider, Button, InputNumber, Table, Switch, Radio, Checkbox, Row, Col, Tree, Icon } from 'antd';
import styles from './style.less';
import BorderPoint from '@/pages/components/border-point';
import { getCesiumUrl } from '@/utils/index';
import { PUBLIC_PATH } from '@/utils/config';
import szhyDATA from './data/szhy.json';
const Ajax = require('axios');

const { Cesium } = window;
let datacutover;
let polygonGeometryList = [];// 水面数据 避免反复加载数据
let _height = 0;//水面高度
let _depthTestAgainstTerrain=true;
class OceanPanel extends Component {
    constructor(props) {
        super(props);
        this.state = {
            inputValue: 0.4,
            toolsshowhide: true,
        }
    }
    render() {
        const { inputValue, toolsshowhide } = this.state
        return (
            <>
                <div>
                    <div className={styles.bottom} onClick={this.toolsshowhide}> <Icon type="menu" className={styles.icon} /> </div>
                    <div className={`${styles.PipePdiv}  ${toolsshowhide === false ? styles.toolsShow : styles.toolsHide}`} id={"PipePdiv"}>
                        <BorderPoint />
                        <div className={styles.close} onClick={this.toolsshowhide}> <Icon type="menu" className={styles.icon} /> </div>
                        <div className={`${styles.OceanPanel}`}>
                            <Row className={styles.title}><Col span={4} offset={1}>透明度设置</Col></Row>
                            <Row className={styles.rowItem}>
                                <Col span={4} offset={1}>水面透明</Col>
                                <Col span={12}><Slider min={0} max={1} step={0.1} value={inputValue} onChange={(value) => { this.onWaterChange(value) }}></Slider></Col>
                            </Row>
                        </div>
                    </div>
                </div>
            </>
        )
    }


    //控制透明度弹窗显示隐藏
    toolsshowhide = () => {
        let { toolsshowhide } = this.state
        this.setState({
            toolsshowhide: !this.state.toolsshowhide,
        })
    }

    //进入
    async componentDidMount() {
        let data2 = await Ajax.get(`${PUBLIC_PATH}config/datacutover.json`);
        datacutover = data2.data
        const { layers: { hd_dem } } = datacutover
        this.initMap(hd_dem)
    }
    //卸载
    componentWillUnmount() {
        const { viewer } = window;       
        this.removeTerrain(viewer)
        this.removeOceanPrimitive(viewer)
        viewer.scene.globe.depthTestAgainstTerrain = _depthTestAgainstTerrain;
    }
    //水面透明度
    onWaterChange = (value) => {
        const { viewer } = window;
        this.setState({
            inputValue: value
        }, () => {
            if (value <= 0) {
                this.removeOceanPrimitive(viewer)
            }
            else {
                this.addOceanPrimitive(viewer)
            }
        }

        );
    }
    //地图初始加载
    initMap = (hd_dem) => {
        const { viewer } = window;
        _depthTestAgainstTerrain=viewer.scene.globe.depthTestAgainstTerrain;
        polygonGeometryList = []
        szhyDATA.features.forEach(t => {
            let polygonHierarchy;
            const coordinates = t.geometry.coordinates;
            const lens = coordinates.length;
            let positions = Cesium.Cartesian3.fromDegreesArray(
                Array.prototype.concat.apply([], coordinates[0]));
            let holes = []
            if (lens > 1) {
                for (let i = 1; i < lens; i++) {
                    holes.push({
                        positions: Cesium.Cartesian3.fromDegreesArray
                            (Array.prototype.concat.apply([], coordinates[i]))
                    });
                }
            }
            polygonHierarchy = new Cesium.PolygonHierarchy(positions, holes)

            polygonGeometryList.push(
                new Cesium.PolygonGeometry({
                    polygonHierarchy: polygonHierarchy,
                    height: _height,
                    vertexFormat: Cesium.EllipsoidSurfaceAppearance.VERTEX_FORMAT
                })
            );
        });
        this.addTerrain(viewer, hd_dem)
        this.addOceanPrimitive(viewer)

    }
    //加载地形
    addTerrain = (viewer, item) => {
        viewer.terrainProvider = new Cesium.CesiumTerrainProvider({
            url: getCesiumUrl(item.url, true)
        });        
        viewer.scene.globe.depthTestAgainstTerrain = false;
    }
    //移除地形
    removeTerrain = (viewer) => {
        viewer.terrainProvider = new Cesium.EllipsoidTerrainProvider();
        viewer.scene.globe.depthTestAgainstTerrain = false;
    }
    //移除水面
    removeOceanPrimitive = (viewer) => {
        let oceanPrimitives = viewer.scene.primitives._primitives.filter(t =>
            (t instanceof Cesium.PrimitiveCollection && t["oceanPrimitives"]))
        if (oceanPrimitives) {
            oceanPrimitives.forEach(instance => {
                viewer.scene.primitives.remove(instance);
            })
            oceanPrimitives = [];
        }
    }
    //加载水面
    addOceanPrimitive = (viewer) => {
        let fragmentShader = this.FSWaterFace();
        let appearance = this.CreateAppearence(fragmentShader, 'Cesium/Assets/Textures/waterNormalsSmall.jpg');

        let oceanPrimitives = viewer.scene.primitives._primitives.filter(t =>
          (t instanceof Cesium.PrimitiveCollection && t["oceanPrimitives"]))
        if (oceanPrimitives) {
            oceanPrimitives.forEach(instance => {
                viewer.scene.primitives.remove(instance);
            })
            oceanPrimitives = [];
        }

        let primitives = new Cesium.PrimitiveCollection();
        polygonGeometryList.forEach(t => {
            primitives.add(
                new Cesium.Primitive({
                    geometryInstances: new Cesium.GeometryInstance({
                        geometry: t
                    }),
                    appearance: appearance,
                    show: true, allowPicking: false, asynchronous: false
                })
            )
        })
        viewer.scene.primitives.add(primitives);
        primitives['oceanPrimitives'] = true;
    }
    //创建appearence
    CreateAppearence = (fs, url) => {
        return new Cesium.EllipsoidSurfaceAppearance({
            aboveGround: true,
            material: new Cesium.Material({
                fabric: {
                    type: 'Water',
                    uniforms: {
                        normalMap: url,
                        frequency: 2000.0,
                        animationSpeed: 0.01,
                        amplitude: 10.0
                        // specularIntensity: 2,
                        // fadeFactor: 2.0
                    }
                }
            }),
            fragmentShaderSource: fs
        });
    }
    //片元
    FSWaterFace = () => {
        let { inputValue } = this.state;
        if (inputValue >= 1) {
            inputValue = 1.000000001;
        }

        return `varying vec3 v_positionMC;
      varying vec3 v_positionEC;
      varying vec2 v_st;
      void main()
      {
          czm_materialInput materialInput;
          vec3 normalEC = normalize(czm_normal3D * czm_geodeticSurfaceNormal(v_positionMC, vec3(0.0), vec3(1.0)));
      #ifdef FACE_FORWARD
          normalEC = faceforward(normalEC, vec3(0.0, 0.0, 1.0), -normalEC);
      #endif
          materialInput.s = v_st.s;
          materialInput.st = v_st;
          materialInput.str = vec3(v_st, 0.0);
          materialInput.normalEC = normalEC;
          materialInput.tangentToEyeMatrix = czm_eastNorthUpToEyeCoordinates(v_positionMC, materialInput.normalEC);
          vec3 positionToEyeEC = -v_positionEC;
          materialInput.positionToEyeEC = positionToEyeEC;
          czm_material material = czm_getMaterial(materialInput);
      #ifdef FLAT
          gl_FragColor = vec4(material.diffuse + material.emission, material.alpha);
      #else
          // gl_FragColor = czm_phong(normalize(positionToEyeEC), material);
          gl_FragColor = czm_phong(normalize(positionToEyeEC), material, czm_lightDirectionEC);
          gl_FragColor.a = `+ inputValue + `;
      #endif
      }
      `;
    }
}
export default OceanPanel;





