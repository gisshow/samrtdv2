/* 2017-11-30 16:56:24 | 修改 木遥（QQ：516584683） */
//模块：
mars3d.widget.bindClass(mars3d.widget.BaseWidget.extend({
    options: {
        //弹窗
        view: {
            type: "window",
            url: "view.html",
            windowOptions: {
                width: 210,
                height: 120,
                position: {
                    "top": 70,
                    "left": 20
                }
            }
        },
    },
    lastStage:null,
    hueShift:0,
    saturationShift:0,
    brightnessShift:0,
    density:0,
    minimumBrightness:0,
    removeStage:function(){
        if (this.lastStage)
        this.viewer.scene.postProcessStages.remove(this.lastStage);
        this.lastStage = null;
    },
    clearStage:function(){
        if (this.lastStage)
        this.viewer.scene.postProcessStages.remove(this.lastStage);
        this.lastStage = null;
        this.viewer.scene.skyAtmosphere.hueShift = this.hueShift;
        this.viewer.scene.skyAtmosphere.saturationShift = this.saturationShift;
        this.viewer.scene.skyAtmosphere.brightnessShift = this.brightnessShift;
        // this.viewer.scene.fog.density = this.density;
        // this.viewer.scene.fog.minimumBrightness = this.minimumBrightness;
    },
    initParam:function(){
        // old
        this.hueShift = this.viewer.scene.skyAtmosphere.hueShift;
        this.saturationShift = this.viewer.scene.skyAtmosphere.saturationShift;
        this.brightnessShift = this.viewer.scene.skyAtmosphere.brightnessShift;
        // this.density = this.viewer.scene.fog.density;
        // this.minimumBrightness = this.viewer.scene.fog.minimumBrightness;

        //赋予新值
        this.viewer.scene.skyAtmosphere.hueShift = -0.8;
        this.viewer.scene.skyAtmosphere.saturationShift = -0.7;
        this.viewer.scene.skyAtmosphere.brightnessShift = -0.33;
        // this.viewer.scene.fog.density = 0.001;
        // this.viewer.scene.fog.minimumBrightness = 0.8;
    },
    initScence:function(){
        this.initParam();
        this.showSnow(5);

    },
    getSnowShader:function(val){
        return "uniform sampler2D colorTexture;\n\
        varying vec2 v_textureCoordinates;\n\
    \n\
        float snow(vec2 uv,float scale)\n\
        {\n\
            float time = czm_frameNumber / 60.0;\n\
            float w=smoothstep(1.,0.,-uv.y*(scale/10.));if(w<.1)return 0.;\n\
            uv+=time/scale;uv.y+=time*2./scale;uv.x+=sin(uv.y+time*.5)/scale;\n\
            uv*=scale;vec2 s=floor(uv),f=fract(uv),p;float k=3.,d;\n\
            p=.5+.35*sin(11.*fract(sin((s+p+scale)*mat2(7,3,6,5))*5.))-f;d=length(p);k=min(d,k);\n\
            k=smoothstep(0.,k,sin(f.x+f.y)*0.01);\n\
            return k*w;\n\
        }\n\
    \n\
        void main(void){\n\
            vec2 resolution = czm_viewport.zw;\n\
            vec2 uv=(gl_FragCoord.xy*2.-resolution.xy)/min(resolution.x,resolution.y);\n\
            vec3 finalColor=vec3(0);\n\
            float c = 0.0;\n\
            c+=snow(uv,30.)*.0;\n\
            c+=snow(uv,20.)*.0;\n\
            c+=snow(uv,15.)*.0;\n\
            c+=snow(uv,10.);\n\
            c+=snow(uv,8.);\n\
        c+=snow(uv,6.);\n\
            c+=snow(uv,5.);\n\
            finalColor=(vec3(c)); \n\
            gl_FragColor = mix(texture2D(colorTexture, v_textureCoordinates), vec4(finalColor,1), "+val/10+"); \n\
    \n\
        }\n\
    ";
    },
    showSnow:function(val){
        this.removeStage();
        var snow = new Cesium.PostProcessStage({
            name: 'czm_snow',
            fragmentShader: this.getSnowShader(val)
        });
        this.viewer.scene.postProcessStages.add(snow);
        this.lastStage = snow;
    },
    getRainShader:function(val){
        return "uniform sampler2D colorTexture;\n\
                            varying vec2 v_textureCoordinates;\n\
                        \n\
                            float hash(float x){\n\
                                return fract(sin(x*133.3)*13.13);\n\
                        }\n\
                        \n\
                        void main(void){\n\
                        \n\
                            float time = czm_frameNumber / 120.0;\n\
                        vec2 resolution = czm_viewport.zw;\n\
                        \n\
                        vec2 uv=(gl_FragCoord.xy*2.-resolution.xy)/min(resolution.x,resolution.y);\n\
                        vec3 c=vec3(.6,.7,.8);\n\
                        \n\
                        float a=-.4;\n\
                        float si=sin(a),co=cos(a);\n\
                        uv*=mat2(co,-si,si,co);\n\
                        uv*=length(uv+vec2(0,4.9))*.3+1.;\n\
                        \n\
                        float v=1.-sin(hash(floor(uv.x*100.))*2.);\n\
                        float b=clamp(abs(sin(20.*time*v+uv.y*(5./(2.+v))))-.95,0.,1.)*20.;\n\
                        c*=v*b; \n\
                        \n\
                        gl_FragColor = mix(texture2D(colorTexture, v_textureCoordinates), vec4(c,1), "+val/10+");  \n\
                        }\n\
                        ";
    },
    showRain:function(val){
        this.removeStage();
        var rain = new Cesium.PostProcessStage({
            name: 'czm_rain',
            fragmentShader: this.getRainShader(val)
        });
        this.viewer.scene.postProcessStages.add(rain);

        this.lastStage = rain;
    },
    getfogShader:function(val){
        return "float getDistance(sampler2D depthTexture, vec2 texCoords) \n" +
        "{ \n" +
        "    float depth = czm_unpackDepth(texture2D(depthTexture, texCoords)); \n" +
        "    if (depth == 0.0) { \n" +
        "        return czm_infinity; \n" +
        "    } \n" +
        "    vec4 eyeCoordinate = czm_windowToEyeCoordinates(gl_FragCoord.xy, depth); \n" +
        "    return -eyeCoordinate.z / eyeCoordinate.w; \n" +
        "} \n" +
        "float interpolateByDistance(vec4 nearFarScalar, float distance) \n" +
        "{ \n" +
        "    float startDistance = nearFarScalar.x; \n" +
        "    float startValue = nearFarScalar.y; \n" +
        "    float endDistance = nearFarScalar.z; \n" +
        "    float endValue = nearFarScalar.w; \n" +
        "    float t = clamp((distance - startDistance) / (endDistance - startDistance), 0.0, 1.0); \n" +
        "    return mix(startValue, endValue, t); \n" +
        "} \n" +
        "vec4 alphaBlend(vec4 sourceColor, vec4 destinationColor) \n" +
        "{ \n" +
        "    return sourceColor * vec4(sourceColor.aaa, 1.0) + destinationColor * (1.0 - sourceColor.a); \n" +
        "} \n" +
        "uniform sampler2D colorTexture; \n" +
        "uniform sampler2D depthTexture; \n" +
        "uniform vec4 fogByDistance; \n" +
        "uniform vec4 fogColor; \n" +
        "varying vec2 v_textureCoordinates; \n" +
        "void main(void) \n" +
        "{ \n" +
        "    float distance = getDistance(depthTexture, v_textureCoordinates); \n" +
        "    vec4 sceneColor = texture2D(colorTexture, v_textureCoordinates); \n" +
        "    float blendAmount = interpolateByDistance(fogByDistance, distance); \n" +
        "    vec4 finalFogColor = vec4(fogColor.rgb, fogColor.a * blendAmount); \n" +
        "    gl_FragColor = alphaBlend(finalFogColor, sceneColor); \n" +
        "} \n";
    },
    showfog:function(val,isCheck){
        if(isCheck){
            this.removeStage();
            var fog =new Cesium.PostProcessStage({
                fragmentShader: this.getfogShader(val),
                uniforms: {
                    fogByDistance: new Cesium.Cartesian4(0, 0.5*(val/10), 20000, 1*(val*0.1)),
                    fogColor: Cesium.Color.GRAY,
                },
            })
            this.viewer.scene.postProcessStages.add(fog);
            this.lastStage = fog;
        }else{
            this.lastStage.uniforms.fogByDistance=new Cesium.Cartesian4(0, 0.5*(val/10), 20000, 1*(val*0.1));
        }

       
        // this.viewer.scene.fog.density = 0.0005*val;
    },

    //初始化[仅执行1次]
    create: function () {

    },
    //viewWindow: null,
    ////每个窗口创建完成后调用
    //winCreateOK: function (opt, result) {
    //    this.viewWindow = result;
    //},
    //激活插件
    activate: function () {
        this.viewWindow = null;

    },
    disable: function () {
        this.clearStage();
    },


}));
