import { message } from 'antd';
import { getQueryString, locationReplaceStr } from './index';
import { getTokenFromLocalStorage } from '@/utils/login';

const Ajax = require('axios');

const delayCloseTime = 5;

const prefix = '';
const Cesium = window.Cesium;

Ajax.interceptors.request.use(
  config => {
    // window.localStorage.setItem('token','e3V8VWWRGuSICeCX7KiFFSZLGrZhDkCg768EaiUEmEc=')
    let token = getQueryString('token')
      ? getQueryString('token')
      : window.localStorage.getItem('token');
    token && (config.headers.token = token);
    // const name=window.localStorage.getItem('name');
    // if(!token && window.location.hostname!=="localhost"){
    //   window.location.href=`/login`;
    //   //window.location.href=`http://168.4.0.3/login`;
    // }
    // 用户未登录
    // console.log('config', config);
    const { url } = config;
    if (url.startsWith('/vb/') === true || url.startsWith('/file_relation/') === true) {
      Object.assign(config.headers, {
        'szvsud-license-key': window.localStorage.getItem('baseMapLicenseKey'),
      });
    }
    // 给/gws/的网址添加token权限
    if (url.startsWith('/gws/') === true) {
      Object.assign(config.headers, {
        token: getTokenFromLocalStorage(),
      });
    }
    // 给/gw/的网址添加szvsud-license-key权限
    if (url.startsWith('/gw/') === true) {
      delete config.headers.token;
      Object.assign(config.headers, {
        'szvsud-license-key': window.localStorage.getItem('baseMapLicenseKey'),
      });
    }
    return config;
  },
  error => {
    return Promise.error(error);
  },
);

// Ajax.interceptors.response.use(response=>{
//   const {data:{code}}=response;
//   if(code===401){
//     // 开发环境不跳转登录
//     let host = window.location.host
//     const locationStr = locationReplaceStr(window.location.href)
//     if (host.indexOf('localhost')===-1) {
//       window.location.href=`/login?returnUrl=${locationStr}`;
//     }

//     return Promise.reject(response);
//   }else{
//     return Promise.resolve(response);
//   }
// })

function errorHandle({ errorCode = 500, errorMsg = '服务器错误', errorDetails }, options) {
  message.error(errorMsg, delayCloseTime);
}

function commonRequest(url, options, requestPrefix = '') {
  let requestOptions = options;
  //此处 data与params变量名混淆了。
  // if ((options.method === 'GET' || !options.method) && options.data) {
  //   requestOptions = {
  //     ...requestOptions,
  //     params: options.data,
  //     data: null,
  //   };
  // }

  // if ((options.method === 'POST' || options.method === 'PUT') && !options.data && options.params) {
  //   requestOptions = {
  //     ...requestOptions,
  //     data: options.params,
  //     params: null,
  //   };
  // }

  const timeStamp = `_t=${new Date().getTime()}`;

  const query = url.indexOf('?') >= 0 ? '&' : '?';

  return Ajax({
    method: requestOptions.method || 'GET',
    url: `${requestPrefix}${url}`,
    data: requestOptions.data || {},
    params: requestOptions.params || {},
    timeout: 150000,
  })
    .then(({ data }) => {
      if (data.success === false) {
        // errorHandle({
        //   errorCode: data.responseCode,
        //   errorMsg: data.responseMsg,
        // }, options);
      }
      return { ...data };
    })
    .catch(error => errorHandle(error, requestOptions));
}

export function request(url, options = {}) {
  return commonRequest(url, options, prefix);
}
//隐藏 标签和模型
export function hidemodelanddivpoint(furl) {
  let hideindoorlist = [];
  //隐藏上一个单体化和标签
  if (window.nowTilesetList.length > 0) {
    let newnowTilesetList = window.nowTilesetList;
    for (let index = 0; index < newnowTilesetList.length; index++) {
      let data = newnowTilesetList[index];
      if (data.cesium3DTileset != undefined) {
        if (data.tilesflatten.tileset.url == furl) {
          data.divpoint.visible = true;
          data.cesium3DTileset.show = false; //单体化 显示
          data.cesium3DTileset.style = new Cesium.Cesium3DTileStyle({ show: true });
          data.tilesflatten.destroy(); //注销压平
          hideindoorlist.push(data.cesium3DTileset.url);
          window.nowTilesetList.splice(index, 1);
          index--;
        }
      }
    }
    //window.FlyToca=undefined;
  }
  //隐藏 室内和标签
  if (window.featurecontentList.length > 0) {
    let newfeaturecontentList = window.featurecontentList;
    for (let index = 0; index < newfeaturecontentList.length; index++) {
      let content = newfeaturecontentList[index];
      if (hideindoorlist.indexOf(content.feature.tileset.url) > -1) {
        content.divpoint.visible = false; //室内标签隐藏
        content.cesium3DTileset.show = false; //室内模型 隐藏
        content.feature.show = true; //单体化 显示
        window.featurecontentList.splice(index, 1);
        index--;
      }
    }
  }
}

//回撤事件
export function publicretracement(viewer, num) {
  //不赋值 或 值小于2的 只执行一次
  if (num != undefined && num > 1) {
    for (var index = 0; index < num; index++) {
      var cement = publicretracement();
      if (cement) {
        return;
      }
    }
  }
  //回撤到压平功能前
  // if(window.nowTilesetList.length>0 && window.featurecontentList.length==0 && window.FlyToca==undefined){
  //   let newnowTilesetList=window.nowTilesetList;
  //   for (let index = 0; index < newnowTilesetList.length; index++) {
  //     let data=newnowTilesetList[index];
  //     if(data.cesium3DTileset!=undefined){
  //       data.divpoint.visible=true;
  //       data.cesium3DTileset.show=false;//单体化 显示
  //       data.tilesflatten.destroy();//注销压平
  //       window.nowTilesetList.splice(index,1);
  //       index--;
  //     }
  //   }
  //   //判断 是否所有回撤内容 都为undefined 隐藏回撤按钮
  //   var retselect=false;
  //   if(window.FlyToca==undefined &&  window.featurecontentList.length==0 && window.nowTilesetList.length==0){
  //     document.getElementById("retracement").style.display="none";
  //     retselect=true;
  //   }
  //   return retselect;
  // }

  // //回撤到显示单体化时
  // if(window.nowTilesetList.length>0 && window.featurecontentList.length>0 && window.FlyToca==undefined){
  //   let newfeaturecontentList=window.featurecontentList;
  //   for (var j = 0; j < newfeaturecontentList.length; j++) {
  //     var data = newfeaturecontentList[j];
  //     data.divpoint.visible=false;//室内模型 标签
  //     data.cesium3DTileset.show=false;//室内模型 隐藏
  //     data.feature.show=true;
  //     if(data.cesium3DTileset!=undefined){
  //       data.cesium3DTileset.style=new Cesium.Cesium3DTileStyle({show:true,})
  //     }
  //     window.featurecontentList.splice(j,1);
  //     j--;
  //   }
  //   //判断 是否所有回撤内容 都为undefined 隐藏回撤按钮
  //   var retselect=false;
  //   if(window.FlyToca==undefined &&  window.featurecontentList.length==0 && window.nowTilesetList.length==0){
  //     document.getElementById("retracement").style.display="none";
  //     retselect=true;
  //   }
  //   return retselect;
  // }
  // //回撤到进入室内模型前的视角
  // if(window.nowTilesetList.length>0 && window.featurecontentList.length>0 && window.FlyToca!=undefined){
  //   let cartesian = Cesium.Cartesian3.fromDegrees(window.FlyToca.x, window.FlyToca.y, window.FlyToca.z);
  //   viewer.camera.flyTo({
  //       destination : cartesian,
  //       orientation : {
  //           heading : Cesium.Math.toRadians( window.FlyToca.heading),
  //           pitch : Cesium.Math.toRadians( window.FlyToca.pitch),
  //           roll : Cesium.Math.toRadians( window.FlyToca.roll)
  //       }
  //   });
  //   window.FlyToca=undefined;
  //   //关闭 键盘 漫游
  //   viewer.mars.keyboardRoam.unbind();
  //   //判断 是否所有回撤内容 都为undefined 隐藏回撤按钮
  //   var retselect=false;
  //   if(window.FlyToca==undefined &&  window.featurecontentList.length==0 && window.nowTilesetList.length==0){
  //     document.getElementById("retracement").style.display="none";
  //     retselect=true;
  //   }
  //   return retselect;
  // }
  if (window.FlyToca != undefined) {
    window.szlayer && (window.szlayer.show = false);
    let cartesian = Cesium.Cartesian3.fromDegrees(
      window.FlyToca.Camera.x,
      window.FlyToca.Camera.y,
      window.FlyToca.Camera.z,
    );
    window.viewer.camera.flyTo({
      destination: cartesian,
      orientation: {
        heading: Cesium.Math.toRadians(window.FlyToca.Camera.heading),
        pitch: Cesium.Math.toRadians(window.FlyToca.Camera.pitch),
        roll: Cesium.Math.toRadians(window.FlyToca.Camera.roll),
      },
    });
    //window.FlyToca.tilesflatten.destroy();//注销压平
    //室内模型隐藏
    //window.FlyToca.C3DTileset.show=false;
    //
    //window.FlyToca.Ftileset.show = false;
    // if(window.FlyToca.hideTiles){
    //   window.FlyToca.hideTiles.show = true;
    // }

    window.FlyToca.Camera = undefined;
    // window.FlyToca.tilesflatten=undefined;
    //window.FlyToca.Ftileset=undefined;
    //window.FlyToca.hideTiles=undefined;

    //关闭 键盘 漫游
    // window.viewer.mars.keyboardRoam.unbind();
    //判断 是否所有回撤内容 都为undefined 隐藏回撤按钮
    var retselect = false;
    // if(window.FlyToca.Camera==undefined){
    //   document.getElementById("retracement").style.display="none";
    //   retselect=true;
    // }
    return retselect;
  }

  //白模 回撤到单体化显示时 nowTilesetList中有压平内容 不存储
  if (
    window.nowTilesetList.length == 0 &&
    window.featurecontentList.length > 0 &&
    window.FlyToca == undefined
  ) {
    let newfeaturecontentList = window.featurecontentList;
    for (var j = 0; j < newfeaturecontentList.length; j++) {
      var data = newfeaturecontentList[j];
      data.divpoint.visible = false; //室内模型 标签
      data.cesium3DTileset.show = false; //室内模型 隐藏
      data.feature.show = true;
      if (data.cesium3DTileset != undefined) {
        data.cesium3DTileset.style = new Cesium.Cesium3DTileStyle({ show: true });
      }
      window.featurecontentList.splice(j, 1);
      j--;
    }
    //判断 是否所有回撤内容 都为undefined 隐藏回撤按钮
    var retselect = false;
    if (
      window.FlyToca == undefined &&
      window.featurecontentList.length == 0 &&
      window.nowTilesetList.length == 0
    ) {
      document.getElementById('retracement').style.display = 'none';
      retselect = true;
    }
    return retselect;
  }

  //白模 回撤到进入室内模型前的视角
  if (
    window.nowTilesetList.length == 0 &&
    window.featurecontentList.length > 0 &&
    window.FlyToca != undefined
  ) {
    let cartesian = Cesium.Cartesian3.fromDegrees(
      window.FlyToca.x,
      window.FlyToca.y,
      window.FlyToca.z,
    );
    window.viewer.camera.flyTo({
      destination: cartesian,
      orientation: {
        heading: Cesium.Math.toRadians(window.FlyToca.heading),
        pitch: Cesium.Math.toRadians(window.FlyToca.pitch),
        roll: Cesium.Math.toRadians(window.FlyToca.roll),
      },
    });
    window.FlyToca = undefined;
    //关闭 键盘 漫游
    //window.viewer.mars.keyboardRoam.unbind();
    //判断 是否所有回撤内容 都为undefined 隐藏回撤按钮
    var retselect = false;
    if (
      window.FlyToca == undefined &&
      window.featurecontentList.length == 0 &&
      window.nowTilesetList.length == 0
    ) {
      document.getElementById('retracement').style.display = 'none';
      retselect = true;
    }
    return retselect;
  }
}
