
let {Cesium} =window;
const STEP = 10;//默认步长
let speedRatio=1;//默认倍率
let firstPerson = {
    install: function(viewer) {

        let scene = viewer.scene;
        let canvas = viewer.canvas;
        canvas.setAttribute('tabindex', '0'); // needed to put focus on the canvas
        canvas.onclick = function() {
            canvas.focus();
        };
        let ellipsoid = scene.globe.ellipsoid;

        // disable the default event handlers
        scene.screenSpaceCameraController.enableRotate = false;
        scene.screenSpaceCameraController.enableTranslate = false;
        scene.screenSpaceCameraController.enableZoom = false;
        scene.screenSpaceCameraController.enableTilt = false;
        scene.screenSpaceCameraController.enableLook = false;

        let startMousePosition;
        let mousePosition;
        let flags = {
            looking: false,
            moveForward: false,
            moveBackward: false,
            moveUp: false,
            moveDown: false,
            moveLeft: false,
            moveRight: false
        };


        

        let handler = new Cesium.ScreenSpaceEventHandler(canvas);

        handler.setInputAction(function(movement) {
            flags.looking = true;
            mousePosition = startMousePosition = Cesium.Cartesian3.clone(movement.position);
        }, Cesium.ScreenSpaceEventType.LEFT_DOWN);

        handler.setInputAction(function(movement) {
            mousePosition = movement.endPosition;
        }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

        handler.setInputAction(function(position) {
            flags.looking = false;
        }, Cesium.ScreenSpaceEventType.LEFT_UP);

        // handler.setInputAction(function(delta) {

        //     if(delta > 0){
        //         speedRatio  =speedRatio * 0.8;
        //     }
        //     else{
        //         speedRatio  =speedRatio * 1.2;
        //     }
        //     console.log(delta);

        // }, Cesium.ScreenSpaceEventType.WHEEL);


        function getFlagForKeyCode(keyCode) {
            switch (keyCode) {
                case 'W'.charCodeAt(0):
                    return 'moveForward';
                case 'S'.charCodeAt(0):
                    return 'moveBackward';
                case 'Q'.charCodeAt(0):
                    return 'moveUp';
                case 'E'.charCodeAt(0):
                    return 'moveDown';
                case 'D'.charCodeAt(0):
                    return 'moveRight';
                case 'A'.charCodeAt(0):
                    return 'moveLeft';
                default:
                    return undefined;
            }
        }

        document.addEventListener('keydown', function(e) {
            let flagName = getFlagForKeyCode(e.keyCode);
            if (typeof flagName !== 'undefined') {
                flags[flagName] = true;
            }
        }, false);

        document.addEventListener('keyup', function(e) {
            let flagName = getFlagForKeyCode(e.keyCode);
            if (typeof flagName !== 'undefined') {
                flags[flagName] = false;
            }
        }, false);


        function moveForward(distance) {
            //和模型的相机移动不太一样  不是沿着相机目标方向，而是默认向上方向 和 向右 方向的插值方向
            let camera = viewer.camera;
            let direction = camera.direction;
            //获得此位置默认的向上方向  
            let up = Cesium.Cartesian3.normalize(camera.position, new Cesium.Cartesian3());

            // right = direction * up  
            let right = Cesium.Cartesian3.cross(direction, up, new Cesium.Cartesian3());

            direction = Cesium.Cartesian3.cross(up, right, new Cesium.Cartesian3());

            direction = Cesium.Cartesian3.normalize(direction, direction);
            direction = Cesium.Cartesian3.multiplyByScalar(direction, distance,direction);


            camera.position = Cesium.Cartesian3.add(camera.position,direction, camera.position );

        }

        this.cameraFunc = function(clock) {
            let camera = viewer.camera;

            if (flags.looking) {
                let width = canvas.clientWidth;
                let height = canvas.clientHeight;

                // Coordinate (0.0, 0.0) will be where the mouse was clicked.
                let x = (mousePosition.x - startMousePosition.x) / width;
                let y = -(mousePosition.y - startMousePosition.y) / height;

                //这计算了，分别向右 和 向上移动的
                let lookFactor = 0.05;
                camera.lookRight(x * lookFactor);
                camera.lookUp(y * lookFactor);

                //获得direction 方向
                let direction = camera.direction;
                //获得此位置默认的向上方向  
                let up = Cesium.Cartesian3.normalize(camera.position, new Cesium.Cartesian3());

                // right = direction * up  
                let right = Cesium.Cartesian3.cross(direction, up, new Cesium.Cartesian3());
                // up = right * direction
                up = Cesium.Cartesian3.cross(right, direction, new Cesium.Cartesian3());

                camera.up = up;
                camera.right = right;
            }

            // Change movement speed based on the distance of the camera to the surface of the ellipsoid.
            let cameraHeight = ellipsoid.cartesianToCartographic(camera.position).height;
            let moveRate = speedRatio;
            // let moveRate = cameraHeight / speedRatio;

            if (flags.moveForward) {
                    moveForward(moveRate);
            }
            if (flags.moveBackward) {
                    moveForward(-moveRate);
            }
            if (flags.moveUp) {
                camera.moveUp(moveRate);
            }
            if (flags.moveDown) {
                camera.moveDown(moveRate);
            }
            if (flags.moveLeft) {
                camera.moveLeft(moveRate);
            }
            if (flags.moveRight) {
                camera.moveRight(moveRate);
            }
        };

        viewer.clock.onTick.addEventListener(this.cameraFunc);

        //关闭log深度，这样在步行的时候近处不会消失
        this.orgindepth = viewer.scene.logarithmicDepthBuffer;
        viewer.scene.logarithmicDepthBuffer = false;

    },
    uninstall: function(viewer) {
        let scene = viewer.scene;
        let canvas = viewer.canvas;
        scene.screenSpaceCameraController.enableRotate = true;
        scene.screenSpaceCameraController.enableTranslate = true;
        scene.screenSpaceCameraController.enableZoom = true;
        scene.screenSpaceCameraController.enableTilt = true;
        scene.screenSpaceCameraController.enableLook = true;

        if (this.cameraFunc) {
            viewer.clock.onTick.removeEventListener(this.cameraFunc);
            this.cameraFunc = undefined;
        }

        viewer.scene.logarithmicDepthBuffer = this.orgindepth;
    },
    setSpeedRatio:function(value){
        speedRatio=STEP*value;
    }

};

export default firstPerson;
　　