class TilesFlatten {
    constructor(options) {
        options = options || {};
        this.viewer = options.viewer;
        options.tileset._config=options.tileset._config||{};
        this.tileset = options.tileset;
        this.tileset.marsEditor = this.tileset.marsEditor || {};
        this.tileset.marsEditor.enable = true;		
		this.flatHeight = options.flatHeight||0;//初始值 启动编辑时的默认值
        this.positions = options.positions;
        this.Foptions=options.Foptions||{};
        this._b3dmOffset = options.b3dmOffset || new window.Cesium.Cartesian2();
		this.TextureFS = "#ifdef GL_FRAGMENT_PRECISION_HIGH\n\
								precision highp float;\n\
								#else\n\
									precision mediump float;\n\
								#endif\n\
								# define OES_texture_float_linear\n\
								varying vec2 depth;\n\
								vec4 packDepth(float depth) {\n\
									vec4 enc = vec4(1.0, 255.0, 65025.0, 16581375.0) * depth;\n\
									enc = fract(enc);\n\
									enc -= enc.yzww * vec4(1.0 / 255.0, 1.0 / 255.0, 1.0 / 255.0, 0.0);\n\
									return enc;\n\
								}\n\
								\n\
								void main() {\n\
									float fDepth = (depth.x / 5000.0) / 2.0 + 0.5;\n\
									gl_FragColor = packDepth(fDepth);\n\
								}\n\
								";
		this.TextureVS = "uniform mat4 myPorjection;\n\
								attribute vec3 position;\n\
								varying vec2 depth;\n\
								void main()\n\
								{\n\
								vec4 pos = vec4(position.xyz,1.0);\n\
								depth = pos.zw;\n\
								pos.z = 0.0;\n\
								gl_Position = czm_projection*pos;\n\
								}\n\
		                       ";		
        if (this.tileset && this.tileset._config.editOffset) {
            this.b3dmOffset = new window.Cesium.Cartesian2(this.tileset._config.editOffset.x, this.tileset._config.editOffset.y);
        }
        if (this.positions) {
            this._preparePos(this.positions);
        }
        if (this.localPosArr && !(options.floodAll === true)) {
            this._prepareWorks();
        }
		
		if(this.drawCommand){
		    this.activeEdit();
		}	
		
    }
	
    get tileset() {
        return this._tileset;
    }
    set tileset(val) {
        this._tileset = val;
        if(val._root==undefined){
            val._root ={
                transform:[ 1,0, 0,0,0, 1,0,0,0,0,1,0,0,0,0,1]
            };
        }        
        var inverseMat = new window.Cesium.Matrix4();
        window.Cesium.Matrix4.fromArray(val._root.transform, 0, inverseMat);
        window.Cesium.Matrix4.inverse(inverseMat, inverseMat);
        this.tileInverTransform = inverseMat;
        if (this.tileset._config.editOffset) {
            this._b3dmOffset = new window.Cesium.Cartesian2(this.tileset._config.editOffset.x, this.tileset._config.editOffset.y);
        }
    }
	
	//偏移量
	getflatHeight() {
	    return this.flatHeight;
	}
	setflatHeight(val) {
	    this.flatHeight = Number(val);
	    this.tileset.marsEditor.heightVar[1] = this.flatHeight;
	}	
	
    //模型压平 多边形 偏移量
    getb3dmOffset() {
        return this._b3dmOffset;
    }
    setb3dmOffset(val) {
        if (!val) return;
        this._b3dmOffset.x = val.x || 0;
        this._b3dmOffset.y = val.y || 0;

        this.tileset.marsEditor.b3dmOffset = this.b3dmOffset;
    }
    setPositions(posArr) {
        if (!posArr || posArr.length == 0) return;
        this.positions = posArr;
        this._preparePos(this.positions);
        if (this.localPosArr) {
            this._prepareWorks();
            this.activeEdit();
        }
    }
	
	activeEdit(){
	    this.tileset.marsEditor.fbo = this.fbo;
	    this.tileset.marsEditor.polygonBounds = this.polygonBounds;
	    this.tileset.marsEditor.IsYaPing[0] = true;
	    this.tileset.marsEditor.IsYaPing[1] = true;
	    this.tileset.marsEditor.heightVar[0] = this.minLocalPos.z;
	    this.tileset.marsEditor.heightVar[1] = this.flatHeight;
	    this.viewer.scene.primitives.add(this);
	}    
    _createTexture() {
        var context = this.viewer.scene.context;
        let tt = new window.Cesium.Texture({
            context: context,
            width: 4096,
            height: 4096,
            pixelFormat: window.Cesium.PixelFormat.RGBA,
            pixelDatatype: window.Cesium.PixelDatatype.FLOAT,
            sampler: new window.Cesium.Sampler({
                wrapS: window.Cesium.TextureWrap.CLAMP_TO_EDGE,
                wrapT: window.Cesium.TextureWrap.CLAMP_TO_EDGE,
                minificationFilter: window.Cesium.TextureMinificationFilter.NEAREST,
                magnificationFilter: window.Cesium.TextureMagnificationFilter.NEAREST
            })
        });

        var depthStencilTexture = new window.Cesium.Texture({
            context: context,
            width: 4096,
            height: 4096,
            pixelFormat: window.Cesium.PixelFormat.DEPTH_STENCIL,
            pixelDatatype: window.Cesium.PixelDatatype.UNSIGNED_INT_24_8
        });

        this.fbo = new window.Cesium.Framebuffer({
            context: context,
            colorTextures: [tt],
            depthStencilTexture: depthStencilTexture,
            destroyAttachments: false
        });

        this._fboClearCommand = new window.Cesium.ClearCommand({
            color: new window.Cesium.Color(0.0, 0.0, 0.0, 0.0),
            framebuffer: this.fbo,
        });
    }
	_prepareWorks() {
	    this._createTexture();
	    this._createCommand();
	}
    _createCamera() {//相机
        return {
            viewMatrix: window.Cesium.Matrix4.IDENTITY,
            inverseViewMatrix: window.Cesium.Matrix4.IDENTITY,
            frustum: new window.Cesium.OrthographicOffCenterFrustum(),
            positionCartographic: new window.Cesium.Cartographic(),
            positionWC: new window.Cesium.Cartesian3(),
            directionWC: window.Cesium.Cartesian3.UNIT_Z,
            upWC: window.Cesium.Cartesian3.UNIT_Y,
            rightWC: window.Cesium.Cartesian3.UNIT_X,
            viewProjectionMatrix: window.Cesium.Matrix4.IDENTITY
        }
    }
    _createPolygonGeometry() {//geometry
        var flattenPolygon = new window.Cesium.PolygonGeometry({
            polygonHierarchy: new window.Cesium.PolygonHierarchy(
                this.localPosArr
            ),
            perPositionHeight: true
        });
        return window.Cesium.PolygonGeometry.createGeometry(flattenPolygon);
    }
    _createCommand() {//指令
        var context = this.viewer.scene.context;
        var ppp = this._createPolygonGeometry();
        var _camera = this._createCamera();
        var sp = window.Cesium.ShaderProgram.fromCache({
            context: context,
            vertexShaderSource: this.TextureVS,
            fragmentShaderSource: this.TextureFS,
            attributeLocations: {
                position: 0
            }
        });
        var vao = window.Cesium.VertexArray.fromGeometry({
            context: context,
            geometry: ppp,
            attributeLocations: sp._attributeLocations,
            bufferUsage: window.Cesium.BufferUsage.STATIC_DRAW,
            interleave: true
        });


        var rs = new window.Cesium.RenderState();
        rs.depthTest.enabled = false;
        rs.depthRange.near = -1000000.0;
        rs.depthRange.far = 1000000.0;


        var bg = window.Cesium.BoundingRectangle.fromPoints(this.localPosArr, new window.Cesium.BoundingRectangle());
        _camera.frustum.left = bg.x;
        _camera.frustum.top = bg.y + bg.height;
        _camera.frustum.right = bg.x + bg.width;
        _camera.frustum.bottom = bg.y;

        this._camera = _camera;


        var myPorjection = window.Cesium.Matrix4.computeOrthographicOffCenter(
            _camera.frustum.left,
            _camera.frustum.right,
            _camera.frustum.bottom,
            _camera.frustum.top,
            _camera.frustum.near,
            _camera.frustum.far,
            new window.Cesium.Matrix4()
        );

        this.polygonBounds = new window.Cesium.Cartesian4(
            _camera.frustum.left,
            _camera.frustum.bottom,
            _camera.frustum.right,
            _camera.frustum.top
        );

        this.drawCommand = new window.Cesium.DrawCommand({
            boundingVolume: ppp.boundingVolume,
            primitiveType: window.Cesium.PrimitiveType.TRIANGLES,
            vertexArray: vao,
            shaderProgram: sp,
            renderState: rs,
            pass: window.Cesium.Pass.CESIUM_3D_TILE,
            uniformMap: {
                myPorjection: function () {
                    return myPorjection;
                }
            }
        });
    }  
    startEdit(){//开启压平
        this.tileset.marsEditor.enable = true;
    }
    revokeEdit(){//撤销压平
        this.tileset.marsEditor.enable= false;
    }
    getactive(){//获取 是否激活
        return this.tileset.marsEditor.enable;
    }
	//编辑对象
	clear() {
	    if (this._tileset && this.tileset.marsEditor) {
	        this.tileset.marsEditor.IsYaPing = [false, false, false, false];
	        this.tileset.marsEditor.editVar = [false, false, false, false];
	
	        this.tileset.marsEditor.b3dmOffset = undefined;
	        this.tileset.marsEditor.floodColor = [0.0, 0.0, 0.0, 0.5];
	        this.tileset.marsEditor.floodVar = [0, 0, 0, 0]; 
	        this.tileset.marsEditor.heightVar = [0, 0];             
	        this.tileset.marsEditor.enable = false;
	    }
	}
    update(frameState) {//更新
        if (this.drawed) return;
        this.drawed = true;
        var context = frameState.context;
        var width = 4096;
        var height = 4096;
        if (!this._passState) {
            this._passState = new window.Cesium.PassState(context);
        }
        this._passState.framebuffer = this.fbo;
        this._passState.viewport = new window.Cesium.BoundingRectangle(0, 0, width, height);
        var us = context.uniformState;
        us.updateCamera(this._camera);
        us.updatePass(this.drawCommand.pass);
        this.drawCommand.framebuffer = this.fbo;
        this.drawCommand.execute(context, this._passState);
    }

    //处理 顶点
    _preparePos(positions) {
        if (!positions || positions.length == 0) return;
        var localPos = [];
        var minHeight = 99999;
        var minLocalPos;
        for (var i = 0; i < positions.length; i++) {
            var cart = window.Cesium.Cartographic.fromCartesian(positions[i]);
            var height = cart.height;
            var currLocalPos = window.Cesium.Matrix4.multiplyByPoint(this.tileInverTransform, positions[i], new window.Cesium.Cartesian3());
            if (this.tileset._config.offset && this.tileset._config.offset.z) {
                currLocalPos.z -= this.tileset._config.offset.z;
            }
            if (this.tileset._config.editOffset && this.tileset._config.editOffset.z) {
                currLocalPos.z += this.tileset._config.editOffset.z;
            }
            localPos.push(currLocalPos);
            if (height < minHeight) {
                minHeight = height;
                minLocalPos = currLocalPos;
            }
        }
        this.minHeight = minHeight;
        this.minLocalPos = minLocalPos;
        this.localPosArr = localPos;
    }



    //销毁
    destroy() {
        this.viewer.scene.primitives.remove(this);
        this.clear();
		
		delete this.viewer;
        delete this._tileset;
        delete this.tileInverTransform;
        delete this.drawCommand;
        delete this._passState;
        delete this.polygonBounds;
        delete this._fboClearCommand;
        delete this.fbo;
        delete this.localPosArr;
        delete this.minHeight;
        delete this.minLocalPos;
        delete this.positions;
        delete this._b3dmOffset;
        delete this._camera;
        delete this._external;
        delete this._passState;
        delete this.drawed;	
		delete this.flatHeight;
    }

}
export default TilesFlatten;


