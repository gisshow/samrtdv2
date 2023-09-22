/* global Cesium */
/* global viewer */
/* global mars3d */
/* global $ */

var fs =
    'uniform sampler2D colorTexture;\n' +
    'varying vec2 v_textureCoordinates;\n' +
    'uniform vec4 highlight;\n' +
    'uniform float brightness;\n' +
    'uniform float saturation;\n' +
    'uniform float contrast;\n' +
    'void main() {\n' +
    '    vec4 color = texture2D(colorTexture, v_textureCoordinates);\n' +
    '        vec3 finalColor = color.rgb * brightness;\n' +
    '        float luminance = 0.2125 * color.r + 0.7154 * color.g + 0.721 * color.b;\n' +
    '        vec3 luminaceColor  = vec3(luminance);\n' +
    '        finalColor = mix(luminaceColor,finalColor,saturation);\n' +
    '        vec3 avgColor = vec3(0.5,0.5,0.5);\n' +
    '        finalColor = mix(avgColor,finalColor,contrast);\n' +
    '        gl_FragColor = vec4(finalColor.rgb, color.a);\n' +
    '}\n';
    // https://blog.csdn.net/u013354943/article/details/53007893
// var stage = viewer.scene.postProcessStages.add(new Cesium.PostProcessStage({
//     fragmentShader : fs,
//     uniforms : {
//         highlight : function() {
//             return new Cesium.Color(1.0, 0.0, 0.0, 0.5);
//         }
//     }
// }));

var BrightnessPost=new Cesium.PostProcessStage({
    fragmentShader : fs,
    uniforms : {
      brightness:1.0,
      saturation:1.0,
      contrast:1.0
    }
});

var uniforms = {};
Object.defineProperties(uniforms, {
  brightness : {
        get : function() {
            return BrightnessPost.uniforms.brightness;
        },
        set : function(value) {
          BrightnessPost.uniforms.brightness = BrightnessPost.uniforms.brightness = value;
        }
    },
    saturation : {
        get : function() {
            return BrightnessPost.uniforms.saturation;
        },
        set : function(value) {
          BrightnessPost.uniforms.saturation = BrightnessPost.uniforms.saturation = value;
        }
    },
    contrast : {
        get : function() {
            return BrightnessPost.uniforms.contrast;
        },
        set : function(value) {
          BrightnessPost.uniforms.contrast = BrightnessPost.uniforms.contrast = value;
        }
    }
});
var colorPost=new Cesium.PostProcessStageComposite({
    stages : [BrightnessPost],
    uniforms : uniforms
})
// var stage=viewer.scene.postProcessStages.add(new Cesium.PostProcessStageComposite({
//     stages : [BrightnessPost],
//     uniforms : uniforms
// }));
export default colorPost;