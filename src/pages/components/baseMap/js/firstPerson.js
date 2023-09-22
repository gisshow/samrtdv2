//第一人称视角
class FirstPersonControl {
	constructor(arg) {
	  //设置唯一id 备用
	  this.objId = Number((new Date()).getTime() + "" + Number(Math.random() * 1000).toFixed(0));
	  this.viewer = arg.viewer;
	  this.personurl = arg.url==undefined?"":arg.url; //人模型 路径
	  arg.viewer.scene.camera.frustum.near = 0.001;
	  //事件
	  this.handler = new window.Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);
	  this.firstPersonControlFlags = {
		moveForward: false,
		moveBackward: false,
		moveUp: false,
		moveDown: false,
		moveLeft: false,
		moveRight: false,
		moveSpace: false,
		directionUp: false,
		directionDown: false,
		directionLeft: false,
		directionRight: false,
		doingAnimation: false,
		enabled: false
	  };
	  this.direction = new window.Cesium.HeadingPitchRoll;
	  this.ellipsoid = arg.viewer.scene.globe.ellipsoid;
	  this.surfacenormal = new window.Cesium.Cartesian3;
	  this.r = new window.Cesium.Cartesian3;
	  this.H = 2;
	  this.canvas = arg.viewer.canvas;
	  this.Matrix4s = new window.Cesium.Matrix4;
	  this.quaternion = new window.Cesium.Quaternion;
	  this.ca = new window.Cesium.Cartesian3(1, 1, 1);
	  this._initialized = false;
	  this.scene = arg.viewer.scene;
	  this.addedModel = undefined;
	  this.surfacenormalg = new window.Cesium.Cartesian3;
	  this.cameraHeightValid = false;
	  this.N = false;
	  this.surfacenormalv = new window.Cesium.Cartesian3;
	  this.firstPersonControlStartPosition = undefined;
	  this.firstPersonControlEndPosition = undefined;
	  this.firstPersonControlSpeed = 0;
	  this.firstPersonControlStartTime = undefined;
	  this.moveSpeed = 5; //移动速度
	  this.firstPersonControlEyeHeight = 1.6; //眼睛高度
	  this.SpaceTH = 0.6; //空格起跳 高度
	  this.RayL = new window.Cesium.Ray; //射线L
	  this.RayD = new window.Cesium.Ray; //射线D
	  this.RayI = new window.Cesium.Ray; //射线I
	  this.rotateSpeed = 1; //旋转速度
		this.cartesianm = new window.Cesium.Cartesian3;
	  this.cartesianG = new window.Cesium.Cartesian3;
	  this.cartesianO = new window.Cesium.Cartesian3;
  
	  this.leftBtnDownEvent = undefined;
	  this.leftBtnUpEvent = undefined;
	  this.wheelEnent = undefined;
	  this.sceneCameraRotate = undefined;
	  this.sceneCameraTranslate = undefined;
	  this.sceneCameraZoom = undefined;
	  this.sceneCameraTilt = undefined;
	  this.sceneCameraLook = undefined;
	  this.addedModel = undefined;
	}
	//开始
	startactivity() {
	  var $this = this;
	  this.camerachanged();
	  //滚轮 事件
	  $this.handler.setInputAction(function(num) {
		if (!$this._initialized || !$this.firstPersonControlFlags.enabled) return;
		var camera = $this.viewer.camera;
		var direction = camera.direction;
		var position = camera.position;
		var a = num * 0.01;
		var destination = $this.movePosition(position, direction, a);
		var surface = $this.ellipsoid.geodeticSurfaceNormal(destination);
		$this.cameraHeightValid = false;
		$this.N = false;
		$this.viewer.camera.setView({
		  destination: destination,
		  orientation: {
			direction: direction,
			up: surface
		  }
		})
	  }, window.Cesium.ScreenSpaceEventType.WHEEL);
	  //左键 事件
	  $this.handler.setInputAction(function(clickEvent) {
		if ($this._initialized || !$this.firstPersonControlFlags.enabled) return;
		var cartesian = $this.viewer.scene.pickPosition(clickEvent.position);
		if (!window.Cesium.defined(cartesian)) {
		  var i = $this.viewer.camera.getPickRay(clickEvent.position);
		  cartesian = $this.scene.globe.pick(i, $this.scene)
		}
		if (!window.Cesium.defined(cartesian)) return;
		var n = $this.viewer.camera.heading;
		var a = $this.matrixhandle(cartesian, 0);
		if (!$this.addedModel && $this.personurl && $this.personurl.length > 0) {
		  $this.addedModel = $this.viewer.scene.primitives.add(
			window.Cesium.Model.fromGltf({
			  url: $this.personurl,
			  allowPicking: false,
			}));
		  $this.addedModel.readyPromise.then(function(model) {
			model.activeAnimations.addAll({
			  loop: window.Cesium.ModelAnimationLoop.NONE
			})
		  }).otherwise(function(model) {
			$this.addedModel = undefined;
			$this.H = 0;
		  })
		}
		if ($this.addedModel) {
		  $this.addedModel.show = true;
		  $this.addedModel.modelMatrix = a;
		  $this.surfacenormalg = $this.ellipsoid.geodeticSurfaceNormal(cartesian);
		  window.Cesium.Cartesian3.cross($this.surfacenormalg, $this.viewer.camera.right, $this.surfacenormalg);
		  window.Cesium.Cartesian3.multiplyByScalar($this.surfacenormalg, $this.H * -1, $this.surfacenormalg);
		  window.Cesium.Cartesian3.add(cartesian, $this.surfacenormalg, cartesian)
		} else {
		  $this.H = 0
		}
		var newcartesian = window.Cesium.Cartographic.fromCartesian(cartesian);
		var Heights = $this.viewer.scene.globe.getHeight(newcartesian);
		if (Heights > newcartesian.height) {
		  newcartesian.height = Heights
		}
		newcartesian.height += $this.firstPersonControlEyeHeight;
		$this.cameraHeightValid = true;
		cartesian = window.Cesium.Cartesian3.fromRadians(newcartesian.longitude, newcartesian.latitude, newcartesian.height);
		$this.viewer.camera.setView({
		  destination: cartesian,
		  orientation: {
			heading: n,
			pitch: 0,
			roll: 0
		  }
		});
		$this.firstPersonControlFlags.enabled = true;
		$this._initialized = true
	  }, window.Cesium.ScreenSpaceEventType.LEFT_CLICK);
  
	  this.keyboardEventListener();
	  this.frameEventListener();
  
	}
	//模型的状态
	ModelState() {
	  if (!this.N) {
		return true
	  }
	  if (!this.addedModel.ready) {
		return false
	  }
	  for (var e = 0; e < this.addedModel.activeAnimations.length; e++) {
		var t = this.addedModel.activeAnimations.get(e);
		if (t._state === window.Cesium.ModelAnimationState.ANIMATING) {
		  return true
		}
	  }
	  return false
	}
	//4*4矩阵参数 处理
	matrixhandle(cartesian, r) {
	  var heading = this.viewer.camera.heading; //当前弧度
	  this.direction.heading = heading + window.Cesium.Math.PI / 0.288;
	  this.direction.pitch = 0;
	  this.direction.roll = 0;
	  this.surfacenormal = this.ellipsoid.geodeticSurfaceNormal(cartesian);
	  window.Cesium.Cartesian3.cross(this.surfacenormal, this.viewer.camera.right, this.surfacenormal);
	  window.Cesium.Cartesian3.multiplyByScalar(this.surfacenormal, this.H * r, this.surfacenormal);
	  window.Cesium.Cartesian3.add(cartesian, this.surfacenormal, cartesian);
	  var n = window.Cesium.Transforms.eastNorthUpToFixedFrame(cartesian, undefined, this.Matrix4s);
	  this.quaternion = window.Cesium.Quaternion.fromHeadingPitchRoll(this.direction, this.quaternion);
	  var a = window.Cesium.Matrix4.fromTranslationQuaternionRotationScale(window.Cesium.Cartesian3.ZERO, this.quaternion, this.ca);
	  window.Cesium.Matrix4.multiply(n, a, n);
	  return n
	}
	//移动的坐标
	movePosition(position, direction, a) {
	  window.Cesium.Cartesian3.multiplyByScalar(direction, a, this.surfacenormalv);
	  window.Cesium.Cartesian3.add(position, this.surfacenormalv, this.surfacenormalv);
	  return this.surfacenormalv;
	}
	//判断 键盘 按下 按钮
	JudgeKeyCode(type) {
	  switch (type) {
		case "W".charCodeAt(0):
		  return "moveForward";
		case "S".charCodeAt(0):
		  return "moveBackward";
		case "D".charCodeAt(0):
		  return "moveRight";
		case "A".charCodeAt(0):
		  return "moveLeft";
		case " ".charCodeAt(0):
		  return "moveSpace";
		case 40:
		  return "directionUp";
		case 38:
		  return "directionDown";
		case 39:
		  return "directionLeft";
		case 37:
		  return "directionRight";
		case 69:
		  return "directionLeft";
		case 81:
		  return "directionRight";
		default:
		  return undefined
	  }
	}
	//视角改变时  模型随之移动
	camerachanged() {
	  var $this = this;
	  $this.viewer.scene.camera.changed.addEventListener(function() {
		if (!$this._initialized || !$this.firstPersonControlFlags.enabled) return;
		if (!$this.addedModel) {
		  return
		}
		var e = $this.viewer.scene.camera;
		var t = window.Cesium.Cartographic.fromCartesian(e.position);
		var r = window.Cesium.Cartesian3.fromRadians(t.longitude, t.latitude, t.height - $this.firstPersonControlEyeHeight);
		var i = $this.matrixhandle(r, 1);
		$this.addedModel.modelMatrix = i;
		if ($this.addedModel.ready) {
		  if (!$this.ModelState()) {
			$this.addedModel.activeAnimations.addAll({
			  loop: window.Cesium.ModelAnimationLoop.NONE
			})
		  }
		}
	  });
	}
	//键盘 按钮 监听事件
	keyboardEventListener() {
	  var $this = this;
	  //键盘按下监听事件
	  document.addEventListener("keydown", function(e) {
		if (!$this._initialized || !$this.firstPersonControlFlags.enabled || $this.firstPersonControlFlags.doingAnimation)
		  return;
		var t = $this.JudgeKeyCode(e.keyCode);
		if (typeof t !== "undefined") {
		  $this.firstPersonControlFlags[t] = true;
		  $this.N = true
		}
	  }, false);
	  //键盘松开监听事件
	  document.addEventListener("keyup", function(e) {
		if (!$this._initialized || !$this.firstPersonControlFlags.enabled || $this.firstPersonControlFlags.doingAnimation)
		  return;
		var t = $this.JudgeKeyCode(e.keyCode);
		if (typeof t !== "undefined") {
		  $this.firstPersonControlFlags[t] = false;
		  $this.firstPersonControlStartTime = undefined
		}
	  }, false);
	}
	//每帧 时钟 监听事件
	frameEventListener() {
	  var nowdate;
	  var $this = this;
	  $this.viewer.clock.onTick.addEventListener(function(e) {
		if (!$this._initialized || !$this.firstPersonControlFlags.enabled) return;
		nowdate = window.Cesium.JulianDate.now(nowdate);
		var camera = $this.viewer.camera;
		if ($this.firstPersonControlFlags.doingAnimation) {
		  $this.N = false;
		  $this.Makeanimation(nowdate); //未完成
		  return
		}
		//移动空间 准备
		if ($this.firstPersonControlFlags.moveSpace) {
		  var cartesian = window.Cesium.Cartographic.fromCartesian(camera.position);
		  $this.firstPersonControlFlags.doingAnimation = true;
		  $this.firstPersonControlStartPosition = cartesian;
		  $this.firstPersonControlEndPosition = cartesian;
		  $this.firstPersonControlStartTime = window.Cesium.JulianDate.clone(nowdate);
		  $this.firstPersonControlSpeed = 4.427188724235731;
		  $this.firstPersonControlFlags.moveSpace = false;
  
		  if ($this.firstPersonControlFlags.moveForward) { //前进
			$this.firstPersonControlFlags.mode = 0;
		  } else if ($this.firstPersonControlFlags.moveBackward) { //后退
			$this.firstPersonControlFlags.mode = 1;
		  } else if ($this.firstPersonControlFlags.moveLeft) { //向左
			$this.firstPersonControlFlags.mode = 2;
		  } else if ($this.firstPersonControlFlags.moveRight) { //向右
			$this.firstPersonControlFlags.mode = 3;
		  }
		  return;
		}
		//视角 上下 操作
		if ($this.firstPersonControlFlags.directionUp || $this.firstPersonControlFlags.directionDown) {
		  $this.CameraDirectionUpDown(); //未完成
		  return
		}
		//视角 左右 操作
		if ($this.firstPersonControlFlags.directionLeft || $this.firstPersonControlFlags.directionRight) {
		  $this.CameraDirectionLeftRight(); //未完成
		  return
		}
		var sd = 0; //秒差
		if ($this.firstPersonControlStartTime !== undefined) {
		  sd = window.Cesium.JulianDate.secondsDifference(nowdate, $this.firstPersonControlStartTime)
		}
		$this.firstPersonControlStartTime = window.Cesium.JulianDate.clone(nowdate);
		if (sd == 0) return;
		var Speedpersecond = $this.moveSpeed * sd;
		var directiono = window.Cesium.clone(camera.direction, true);
		var ups = window.Cesium.clone(camera.up, true);
		var rightl = window.Cesium.clone(camera.right, true);
		var positionu = window.Cesium.clone(camera.position, true);
		var trackposition;
		//设置 相机 观察角度
		var f = function e() {
		  window.Cesium.Cartesian3.clone(directiono, $this.surfacenormalg);
		  window.Cesium.Cartesian3.multiplyByScalar($this.surfacenormalg, -$this.H, $this.surfacenormalg);
		  window.Cesium.Cartesian3.add(positionu, $this.surfacenormalg, positionu);
		  $this.viewer.camera.setView({
			destination: positionu,
			orientation: {
			  direction: directiono,
			  up: ups
			}
		  })
		};
		if ($this.firstPersonControlFlags.moveUp || $this.firstPersonControlFlags.moveDown) {
		  if ($this.firstPersonControlFlags.moveUp) {
			trackposition = $this.movePosition(positionu, ups, Speedpersecond)
		  }
		  if ($this.firstPersonControlFlags.moveDown) {
			trackposition = $this.movePosition(positionu, ups, -Speedpersecond)
		  }
		  $this.viewer.camera.setView({
			destination: trackposition,
			orientation: {
			  direction: directiono,
			  up: ups
			}
		  });
		  return
		}
		if ($this.firstPersonControlFlags.moveForward) {
		  trackposition = $this.movePosition(positionu, directiono, Speedpersecond)
		}
		if ($this.firstPersonControlFlags.moveBackward) {
		  trackposition = $this.movePosition(positionu, directiono, -Speedpersecond)
		}
		if ($this.firstPersonControlFlags.moveLeft) {
		  trackposition = $this.movePosition(positionu, rightl, -Speedpersecond / 2);
		}
		if ($this.firstPersonControlFlags.moveRight) {
		  trackposition = $this.movePosition(positionu, rightl, Speedpersecond / 2);
		}
		if (!window.Cesium.defined(trackposition)) {
		  return
		}
		window.Cesium.Cartesian3.clone(directiono, $this.surfacenormalg);
		window.Cesium.Cartesian3.multiplyByScalar($this.surfacenormalg, $this.H, $this.surfacenormalg);
		window.Cesium.Cartesian3.add(trackposition, $this.surfacenormalg, trackposition);
		window.Cesium.Cartesian3.add(positionu, $this.surfacenormalg, positionu);
		$this.surfacenormal = $this.ellipsoid.geodeticSurfaceNormal(trackposition);
		var cartesianc = window.Cesium.Cartographic.fromCartesian(trackposition);
		var cartesianh = window.Cesium.Cartographic.fromCartesian(positionu);
		var heightp = cartesianh.height + $this.SpaceTH;
		var Radiansv = window.Cesium.Cartesian3.fromRadians(cartesianc.longitude, cartesianc.latitude, heightp);
		$this.viewer.camera.setView({
		  destination: window.Cesium.Cartesian3.fromRadians(cartesianc.longitude, cartesianc.latitude, heightp + 10),
		  orientation: {
			heading: 0,
			pitch: -window.Cesium.Math.PI / 2,
			roll: 0
		  }
		});
		$this.viewer.scene.forceRender(); //强制渲染
		window.Cesium.Cartesian3.negate($this.surfacenormal, $this.surfacenormal);
		$this.RayL.origin = Radiansv; //起源
		$this.RayL.direction = $this.surfacenormal; //方向
		var Radiansm = window.Cesium.Cartesian3.fromRadians(cartesianh.longitude, cartesianh.latitude, heightp);
		$this.positionh=undefined;
		if ($this.firstPersonControlFlags.moveForward || $this.firstPersonControlFlags.moveBackward || $this.firstPersonControlFlags
		  .moveLeft || $this.firstPersonControlFlags.moveRight) {
		  var MFB = $this.firstPersonControlFlags.moveForward || $this.firstPersonControlFlags.moveBackward;
		  var MLR = $this.firstPersonControlFlags.moveLeft || $this.firstPersonControlFlags.moveRight;
		  //var w = 0.5;
		  //var b = 0.6;
		  var scalarb = 0.6,
			scalarw = 0.5;
		  if (MFB && !MLR) {
			$this.RayI.origin = window.Cesium.Cartesian3.add(Radiansm, window.Cesium.Cartesian3.multiplyByScalar(rightl, -scalarw / 2,
			  $this.cartesianO), $this.RayI.origin);
			$this.RayI.direction = rightl;
			$this.RayD.origin = Radiansm;
			if ($this.firstPersonControlFlags.moveForward) {
			  $this.RayD.direction = directiono;
			} else if ($this.firstPersonControlFlags.moveBackward) {
			  window.Cesium.Cartesian3.negate(directiono, $this.RayD.direction)
			}
		  } else if (!MFB && MLR) {
			$this.RayD.origin = window.Cesium.Cartesian3.add(Radiansm, window.Cesium.Cartesian3.multiplyByScalar(directiono, -scalarb /
			  2, $this.cartesianO), $this.RayD.origin);
			$this.RayD.direction = directiono;
			$this.RayI.origin = Radiansm;
			if ($this.firstPersonControlFlags.moveRight) {
			  $this.RayI.direction = rightl;
			} else if ($this.firstPersonControlFlags.moveLeft) {
			  window.Cesium.Cartesian3.negate(rightl, $this.RayI.direction)
			}
		  } else if (MFB && MLR) {
			$this.RayI.origin = positionu;
			$this.RayD.origin = positionu;
			if ($this.firstPersonControlFlags.moveForward) {
			  $this.RayD.direction = directiono
			} else if ($this.firstPersonControlFlags.moveBackward) {
			  window.Cesium.Cartesian3.negate(directiono, $this.RayD.direction)
			}
			if ($this.firstPersonControlFlags.moveRight) {
			  $this.RayI.direction = rightl
			} else if ($this.firstPersonControlFlags.moveLeft) {
			  window.Cesium.Cartesian3.negate(rightl, $this.RayI.direction)
			}
		  }
		  var pickF = $this.viewer.scene.pickFromRay($this.RayD);
		  var pickx = $this.viewer.scene.pickFromRay($this.RayI);
		  var definedC = window.Cesium.defined(pickF);
		  if (definedC) {
			var M = pickF.position;
			definedC = window.Cesium.defined(M) && window.Cesium.Cartesian3.distanceSquared(M, Radiansm) < scalarb * scalarb;
		  }
		  if (definedC) {
			f();
			return
		  }
		  var definedP = window.Cesium.defined(pickx);
		  if (definedP) {
			var M = pickx.position;
			definedP = window.Cesium.defined(M) && window.Cesium.Cartesian3.distanceSquared($this.RayI.origin, M) < scalarw * scalarw
		  }
		  if (definedP) {
			f();
			return
		  }
		  var pickS = $this.viewer.scene.pickFromRay($this.RayL);
		  if (window.Cesium.defined(pickS) && window.Cesium.defined(pickS.position)) {
			$this.positionh = pickS.position
		  }
		}
		if (!window.Cesium.defined($this.positionh)) {
		  f();
		  return
		}
		window.Cesium.Cartesian3.negate($this.surfacenormalg, $this.surfacenormalg);
		window.Cesium.Cartesian3.add($this.positionh, $this.surfacenormalg, $this.positionh);
		var cartesiani = window.Cesium.Cartographic.fromCartesian($this.positionh);
		cartesiani.height += $this.firstPersonControlEyeHeight;
		if ($this.cameraHeightValid && cartesiani.height - cartesianh.height > $this.SpaceTH) {
		  f();
		  return
		}
		$this.cameraHeightValid = true;
		if (cartesiani.height - cartesianh.height > -.5) {
		  var RadianE = window.Cesium.Cartesian3.fromRadians(cartesiani.longitude, cartesiani.latitude, cartesiani.height);
		  $this.viewer.camera.setView({
			destination: RadianE,
			orientation: {
			  direction: directiono,
			  up: ups
			}
		  })
		} else {
		  $this.viewer.camera.setView({
			destination: window.Cesium.Cartesian3.fromRadians(cartesiani.longitude, cartesiani.latitude, cartesianh.height),
			orientation: {
			  direction: directiono,
			  up: ups
			}
		  });
		  $this.firstPersonControlFlags.doingAnimation = true;
		  if (!window.Cesium.defined($this.firstPersonControlStartPosition)) {
			$this.firstPersonControlStartPosition = new window.Cesium.Cartographic
		  }
		  $this.firstPersonControlStartPosition.longitude = cartesiani.longitude;
		  $this.firstPersonControlStartPosition.latitude = cartesiani.latitude;
		  $this.firstPersonControlStartPosition.height = cartesianh.height;
		  $this.firstPersonControlEndPosition = cartesiani;
		  $this.firstPersonControlSpeed = 0;
		  $this.cameraHeightValid = false;
		  $this.resetFlags()
		}
	  })
	}
	//制作动画
	Makeanimation(nowdate) {
	  var directioni = window.Cesium.clone(this.viewer.camera.direction, true);
	  var upn = window.Cesium.clone(this.viewer.camera.up, true);
	  var righta = window.Cesium.clone(this.viewer.camera.right, true);
	  var sdo = window.Cesium.JulianDate.secondsDifference(nowdate, this.firstPersonControlStartTime);
	  if (sdo == 0) return;
	  var cspeed = 0.5 * 9.8 * sdo * sdo - this.firstPersonControlSpeed * sdo;//控制速度
	  if (cspeed >= this.firstPersonControlStartPosition.height - this.firstPersonControlEndPosition.height) {
		this.firstPersonControlFlags.doingAnimation = false;
		cspeed = this.firstPersonControlStartPosition.height - this.firstPersonControlEndPosition.height;
		this.firstPersonControlStartTime = undefined;
		this.resetFlags();//重置
	  }
	  var scalar = 0.35;//标量
	  if (window.Cesium.defined(this.firstPersonControlFlags.mode)) {
		var startp = window.Cesium.clone(this.firstPersonControlStartPosition, true);
		if (this.firstPersonControlFlags.mode === 0) {
		  this.moileposition(directioni, scalar,startp)
		} else if (this.firstPersonControlFlags.mode === 1) {
		  this.moileposition(directioni, -scalar,startp)
		} else if (this.firstPersonControlFlags.mode === 2) {
		  this.moileposition(righta, -scalar,startp);
		} else if (this.firstPersonControlFlags.mode === 3) {
		  this.moileposition(righta, scalar,startp);
		}
		this.firstPersonControlFlags.mode = undefined
	  }
	  var Radiand = window.Cesium.Cartesian3.fromRadians(this.firstPersonControlStartPosition.longitude, this.firstPersonControlStartPosition
		.latitude, this.firstPersonControlStartPosition.height - cspeed);
	  this.viewer.camera.setView({
		destination: Radiand,
		orientation: {
		  direction: directioni,
		  up: upn
		}
	  })
	}
	//相机视角 上下移动
	CameraDirectionUpDown() {
	  var position = this.viewer.camera.position;
	  var heading = this.viewer.camera.heading;
	  var pitch = this.viewer.camera.pitch;
	  var roll = this.viewer.camera.roll;
	  if (this.firstPersonControlFlags.directionUp) {
		pitch -= window.Cesium.Math.RADIANS_PER_DEGREE * this.rotateSpeed * 0.5
	  } else {
		pitch += window.Cesium.Math.RADIANS_PER_DEGREE * this.rotateSpeed * 0.5
	  }
	  this.viewer.camera.setView({
		destination: position,
		orientation: {
		  heading: heading,
		  pitch: pitch,
		  roll: roll
		}
	  })
	}
	//相机视角 左右移动
	CameraDirectionLeftRight() {
	  var position = this.viewer.camera.position;
	  var heading = this.viewer.camera.heading;
	  var pitch = this.viewer.camera.pitch;
	  var roll = this.viewer.camera.roll;
	  if (this.firstPersonControlFlags.directionLeft) {
		heading += window.Cesium.Math.RADIANS_PER_DEGREE * this.rotateSpeed
	  } else {
		heading -= window.Cesium.Math.RADIANS_PER_DEGREE * this.rotateSpeed
	  }
	  this.viewer.camera.setView({
		destination: position,
		orientation: {
		  heading: heading,
		  pitch: pitch,
		  roll: roll
		}
	  })
	}
	//重新 设置对象
	resetFlags() {
	  this.firstPersonControlFlags["moveForward"] = false;
	  this.firstPersonControlFlags["moveBackward"] = false;
	  this.firstPersonControlFlags["moveUp"] = false;
	  this.firstPersonControlFlags["moveDown"] = false;
	  this.firstPersonControlFlags["moveRight"] = false;
	  this.firstPersonControlFlags["moveLeft"] = false;
	  this.firstPersonControlFlags["moveSpace"] = false;
	  this.firstPersonControlFlags["directionUp"] = false;
	  this.firstPersonControlFlags["directionDown"] = false;
	  this.firstPersonControlFlags["directionLeft"] = false;
	  this.firstPersonControlFlags["directionRight"] = false
	}
	//模型移动状态 设置
	moileposition(nowdate, scalar,startposition) {
	  var ellipsoidi = this.viewer.scene.globe.ellipsoid;
	  this.cartesianm = window.Cesium.Cartesian3.fromRadians(startposition.longitude, startposition.latitude, startposition.height);
	  var cartesianmn = window.Cesium.clone(this.cartesianm, true);
	  window.Cesium.Cartesian3.multiplyByScalar(nowdate, scalar, this.surfacenormalv);
	  window.Cesium.Cartesian3.add(this.cartesianm, this.surfacenormalv, this.cartesianm);
	  window.Cesium.Cartesian3.clone(nowdate,  this.cartesianG);
	  window.Cesium.Cartesian3.multiplyByScalar(this.cartesianG, this.H, this.cartesianG);
	  window.Cesium.Cartesian3.add(this.cartesianm, this.cartesianG, this.cartesianm);
	  window.Cesium.Cartesian3.add(cartesianmn, this.cartesianG, cartesianmn);
	  var cartesianma = window.Cesium.Cartographic.fromCartesian(this.cartesianm);
	  startposition = window.Cesium.Cartographic.fromCartesian(cartesianmn);
	  this.viewer.camera.setView({
		destination: window.Cesium.Cartesian3.fromRadians(cartesianma.longitude, cartesianma.latitude, cartesianma.height + 100),
		orientation: {
		  heading: 0,
		  pitch: -window.Cesium.Math.PI / 2,
		  roll: 0
		}
	  });
	  this.viewer.scene.forceRender();
	  var o = ellipsoidi.geodeticSurfaceNormal(this.cartesianm);
	  this.positionh.origin = this.cartesianm;
	  this.positionh.direction = o;
	  var s = 1;
	  var l = this.viewer.scene.pickFromRay(this.positionh);
	  if (window.Cesium.defined(l) && window.Cesium.defined(l.position)) {
		var u = window.Cesium.Cartographic.fromCartesian(l.position);
		var d = u - startposition.height;
		if (d > 0 && d < 1) {
		  s = d
		}
	  }
	  this.positionh.origin = window.Cesium.Cartesian3.fromRadians(cartesianma.longitude, cartesianma.latitude, cartesianma.height + s);
	  this.positionh.direction = window.Cesium.Cartesian3.negate(o, o);
	  var f = this.viewer.scene.pickFromRay(this.positionh);
	  this.viewer.camera.setView({
		destination: window.Cesium.Cartesian3.fromRadians(startposition.longitude, startposition.latitude, startposition.height + 100),
		orientation: {
		  heading: 0,
		  pitch: -window.Cesium.Math.PI / 2,
		  roll: 0
		}
	  });
	  this.viewer.scene.forceRender();
	  this.positionh.origin = window.Cesium.Cartesian3.fromRadians(startposition.longitude, startposition.latitude, startposition.height + s);
	  this.positionh.direction = nowdate;
	  l = this.viewer.scene.pickFromRay(this.positionh);
	  if (window.Cesium.defined(l) && window.Cesium.defined(l.position)) {
		var u = window.Cesium.Cartographic.fromCartesian(l.position);
		if (window.Cesium.Cartesian3.distanceSquared(l.position, this.positionh.origin) <= scalar * scalar) {
		  return
		}
	  }
	  if (window.Cesium.defined(f) && window.Cesium.defined(f.position)) {
		var u = window.Cesium.Cartographic.fromCartesian(f.position);
		this.firstPersonControlEndPosition.height = u.height + this.firstPersonControlEyeHeight;
		this.cartesianm = window.Cesium.Cartesian3.fromRadians(cartesianma.longitude, cartesianma.latitude, this.firstPersonControlEndPosition.height)
	  }
	  window.Cesium.Cartesian3.negate(this.cartesianG, this.cartesianG);
	  window.Cesium.Cartesian3.add(this.cartesianm, this.cartesianG, this.cartesianm);
	  this.firstPersonControlStartPosition = window.Cesium.Cartographic.fromCartesian(this.cartesianm);
	  this.cameraHeightValid = false
	}
  }
  export default FirstPersonControl;