
mars3d.widget.bindClass(mars3d.widget.BaseWidget.extend({
    options: {
        resources: ['view.css'],
        //弹窗
        view: [{
            type: "window",
            url: "view.html",
            name: 'main',
            windowOptions: {
             //   maxmin: true,
                skin: 'transpanceclass',
                title: false,
                closeBtn: 0,
                width: 350,
                position: {
                    top:150,
                    left: 10,
                },
                height: 260
            }
        }
        , {
            type: "window",
            url: "timeline.html",

            name: 'time',
            windowOptions: {
                title: false,
                closeBtn: 0,
                skin: 'defaultsceneclass2',
                position: {
                    left: 320,
                    right:150,
                    bottom: 30
                },

                height: 75
            }
        } , {
                type: "window",
                url: "alarmview.html",
                name: 'alarm',
                windowOptions: {
                    skin: 'defaultsceneclass2',
                    title: false,
                    maxmin: 0,
                    closeBtn: 0,
                    position: {
                        right: 10,
                        bottom: 265
                    },
                    width: 300,
                    height:250
                }
            }, {
                type: "window",
                url: "alarmview2.html",
                name: 'alarm2',
                windowOptions: {
                    skin: 'defaultsceneclass2',
                    title: false,
                    maxmin: 0,
                    closeBtn: 0,
                    position: {
                        right: 10,
                        bottom: 10
                    },
                    width: 300,
                    height:250
                }
            }, {
                type: "window",
                url: "infoview.html",
                name: 'info',
                windowOptions: {
                    title: false,
                    show:false,
                    skin: 'defaultsceneclass2',
                    maxmin: 0,
                    closeBtn: 0,
                    position: {
                        left: 10,
                        top: 330
                    },
                    width: 350,
                    height:420
                }
            }, /*{
                type: "window",
                url: "visualmap.html",
                name: 'visualmap',
                windowOptions: {
                    skin: 'defaultsceneclass',
                    title: false,
                    closeBtn: 0,
                    position: {
                        right: 10,
                        bottom: 10
                    },
                    width: 120,
                    height: 195
                }
            }*/
        ]
    },
    //初始化[仅执行1次]
    create: function() {

    },
    viewWindow: null, //条件查询
    timeWindow: null, //时间轴轮播
    alarmWindow:null,
    alarmWindow2:null,
    infoWindow:null,

    alarmDom:null,
    alarmDom2:null,
    infoDom:null,
    timeDom:null,

    showEntities: [],
    divpoints:[],

    points:[],
    areaMap:[],
    areaSet:[],
    alarmpoints:[],

    area:'',
    alarmInd:0,

    alarmtype:1,
    isActive:false,
    isShowAlarm:false,


    timePause:false,
    time:null,
    timeInd:0,

    zsalarmval:50,//增水预警值
    isTimeDuan:false,

    adAlarmData:{
        '深圳湾岸段':[230,250,275,300],
        '深圳大鹏湾岸段':[215,230,245,260],
        '深圳珠江口岸段': [235,260,280,300] ,    //[235,260,280,300],
        '深圳大亚湾岸段':[220,230,245,260]

      /*
        测试数据
       */
      // '深圳湾岸段':[230,250,275,30],
      // '深圳大鹏湾岸段':[215,230,245,30],
      // '深圳珠江口岸段': [235,260,280,30] ,
      // '深圳大亚湾岸段':[220,230,245,30]
    },
    //关闭释放
    disable: function () {
        this.timeDom.hide();
        this.infoDom.hide();
        this.alarmDom.hide();
        this.alarmDom2.hide();
        viewer && viewer.mars.popup.close();
    },
    //每个窗口创建完成后调用
    winCreateOK: function(opt, result) {
        viewer && viewer.mars.popup.close();
        if (opt.name === "main") {
            this.viewWindow = result;
        } else if (opt.name === "time"){
            this.timeWindow = result;

            this.timeDom= $(opt._dom);

            this.timeDom.hide();
        }else if (opt.name === "alarm"){
            this.alarmWindow = result;
            var btndom = $(opt._dom).find(".layui-layer-setwin");

            var closebtn = btndom.find(".layui-layer-close");
            btndom.append("<a href='javascript:' class='iconfont icondelete'  style='margin-top:3px;' id='hideContent'></a>");

            this.alarmDom= $(opt._dom);
            $("#hideContent").click(function() {
                $(opt._dom).hide();
            });
            $(opt._dom).hide();

        }else if (opt.name === "alarm2"){
            this.alarmWindow2 = result;
            var btndom = $(opt._dom).find(".layui-layer-setwin");

            var closebtn = btndom.find(".layui-layer-close");
            btndom.append("<a href='javascript:' class='iconfont icondelete'  style='margin-top:3px;' id='hideContent3'></a>");

            this.alarmDom2= $(opt._dom);
            $("#hideContent3").click(function() {
                $(opt._dom).hide();
            });
            $(opt._dom).hide();

        }else if (opt.name === "info"){
            this.infoWindow = result;

            var btndom = $(opt._dom).find(".layui-layer-setwin");

            var closebtn = btndom.find(".layui-layer-close");
            btndom.append("<a href='javascript:' class='iconfont icondelete'  style='margin-top:3px;' id='hideContent2'></a>");

            this.infoDom= $(opt._dom);
            $("#hideContent2").click(function() {
                $(opt._dom).hide();
            });
            $(opt._dom).hide();

        }
        theWidgetSite=this;
    },


    hideInfo:function(){
        this.infoDom.hide();
        this.alarmDom.hide();
        this.alarmDom2.hide();
        this.viewer.mars.popup.close();

    },

    hideInfo2:function(){
        this.infoDom.hide();
        this.alarmDom.hide();
        this.alarmDom2.hide();


    },

    getHtmlByPoint:function(point,b){

        var display="display:none;";
        if(this.isTimeDuan||b){
            display="display:;"
        }
        var info=this.areaMap[point.id];
        var fun='showInfoWinSite'
        if(b){
            fun='showAlarmWinSite'
        }

        return `<div class='site-pophtml'>
                <div class='site-pop-row'><span>岸段</span><span>${info.ad}</span></div>
                <div class='site-pop-row'><span>站点</span><span>${point.name}</span></div>
                <div class='site-pop-row'><span>时间</span><span>${this.getTimeString()}</span></div>
                <div class='site-pop-row'><span>总水</span><span>${point.zss[this.timeInd]} cm</span></div>
                <div class='site-pop-row'><span>增水</span><span>${point.zs[this.timeInd]} cm</span></div>
                <div class='site-pop-row'><span>天文潮</span><span>${point.zss[this.timeInd]-point.zs[this.timeInd]} cm</span></div>
                <div class='site-pop-row' style='${display}'><div class='site-btn' onclick='${fun}(${point.id})'>详细信息</div></div>
                </div>`;

    },


    updateDateFromTime:function(date,ind){
        this.date=date;

        this.hideInfo();


        if(ind){
            this.timeInd=ind;
        }else{
            this.timeInd=0;
        }

        var self=this;

        for(var i=0;i<this.divpoints.length;i++){
            if(this.divpoints[i]) {
                this.divpoints[i].destroy();
            }
        }

        this.divpoints=[];

        this.alarmInd=0;
        this.alarmpoints = [];


                for (var i=0; i<this.points.length; i++) {

                    var point=this.points[i];


                    var id=point.id;

                    var name=point.name;
                    var lon=point.lon;
                    var lat=point.lat;
                    var hei=point.hei;



                    var zs=point.zs;
                    var zss=point.zss;

                    var alarmtype=0;
                    var time=0;
                    var a=self.timeInd;

                    var info=self.areaMap[id];
                    var ad=info.ad;
                    var alarmdata=self.adAlarmData[ad];

                    if (zss[a] > alarmdata[3]) {
                        time=a;
                        alarmtype = Math.max(4,alarmtype);
                    } else if (zss[a] > alarmdata[2]) {
                        if(alarmtype<4){
                            time=a;
                        }
                        alarmtype = Math.max(3,alarmtype);
                    } else if (zss[a] > alarmdata[1]) {
                        if(alarmtype<2){
                            time=a;
                        }
                        alarmtype = Math.max(2,alarmtype);
                    } else if (zss[a] > alarmdata[0]) {
                        if(alarmtype<1){
                            time=a;
                        }
                        alarmtype = Math.max(1,alarmtype);
                    }

                    if(zs[a]>self.zsalarmval){
                        alarmtype=alarmtype+10;
                    }
                    var point={
                        id,
                        name,
                        lon,
                        lat,
                        hei,
                        l:alarmtype,
                        t:time,
                        zs,
                        zss
                    }

                    if(alarmtype>0){
                        self.alarmpoints.push(point);
                    }
                }

                self.showPoints();
                self.showAlarmPoints();

    },

    getSZSiteData:function(date,fun){
        
        getFromCache("szsitedata_"+date).then(function(val){
            if(!val) {
                $.ajaxSetup({
                    timeout: 60*1000
                });
                $.getJSON("/OceanServer/siteserver?date="+date, function (result) {
                    setToCache("szsitedata_"+date,JSON.stringify(result))
                    fun(result);
                }).fail(function() {
                    $("#loading").hide();
                    toastr.info('获取数据失败');
                    fun([]);
                });
            }else{
                // console.log("get sz site data from local cache:",val);
                var result=JSON.parse(val);
                fun(result);
            }
        })
    },


    updateDate:function(date,ind){
        this.date=date;

        // console.log("get date:",date);

        if(ind){
            this.timeInd=ind;
        }else{
            this.timeInd=0;
        }

        var self=this;

        for(var i=0;i<this.divpoints.length;i++){
            if(this.divpoints[i]) {
                this.divpoints[i].destroy();
            }
        }

        this.divpoints=[];

        this.alarmInd=0;
        this.alarmpoints = [];

         var aa=date.split(" ");
         var date=new Date(aa[0]);
         date.setHours(aa[1]-1);

         var dates=date.getFullYear()+"-"+(date.getMonth()+1)+"-"+date.getDate()+" "+date.getHours();
        // $.getJSON("/OceanServer/siteserver?date="+dates, function (result) {
        this.getSZSiteData(dates, function (result) {
            var data=result;
            if(data && data.length){
                var points=[];
                var min=1000;
                var max=-100;
                for (var i=0; i<data.length; i++) {

                    var point=data[i];


                    var id=point[0];
                    var time=point[1];
                    var name=point[3];
                    var lon=parseFloat(point[4])-0.011858832;
                    var lat=parseFloat(point[5])-0.003077487;
                    var hei=parseFloat(point[6]);

                    self.time=new Date(time);

                    var zs=[];
                    var zss=[];
                    for(var a=0;a<72;a++){
                        zs[a]=parseFloat(point[8+a])
                        zss[a]=parseFloat(point[80+a])+zs[a];
                    }

                    var alarmtype=0;
                    var time=0;
                    var a=self.timeInd;

                    var info=self.areaMap[id];
                    var ad=info.ad;
                    var alarmdata=self.adAlarmData[ad];

                    if (zss[a] > alarmdata[3]) {
                        time=a;
                        alarmtype = Math.max(4,alarmtype);
                    } else if (zss[a] > alarmdata[2]) {
                        if(alarmtype<4){
                            time=a;
                        }
                        alarmtype = Math.max(3,alarmtype);
                    } else if (zss[a] > alarmdata[1]) {
                        if(alarmtype<2){
                            time=a;
                        }
                        alarmtype = Math.max(2,alarmtype);
                    } else if (zss[a] > alarmdata[0]) {
                        if(alarmtype<1){
                            time=a;
                        }
                        alarmtype = Math.max(1,alarmtype);
                    }

                    if(zs[a]>self.zsalarmval){
                        alarmtype=alarmtype+10;
                    }
                    var point={
                        id,
                        name,
                        lon,
                        lat,
                        hei,
                        l:alarmtype,
                        t:time,
                        zs,
                        zss
                    }
                    self.points.push(point)
                    if(alarmtype>0){
                        self.alarmpoints.push(point);
                    }
                }

                self.showPoints();
                self.showAlarmPoints();
            }else{
                self.clearMap();
                self.hideInfo();
            }

        });


        // $.ajax({
        //     type: "GET",
        //     url: "/visualization/data/ocean/tide_forecast.csv",
        //     dataType: "text",
        //     success: function(data) {
        //         var allTextLines = data.split(/\r\n|\n/);
        //         var headers = allTextLines[0].split(',');
        //         for (var i=1; i<allTextLines.length; i++) {
        //             var data = allTextLines[i].split(',');
        //             if (data.length == headers.length) {
        //                 var id=data[0].replaceAll("\"","");
        //                 var time=data[1].replaceAll("\"","");
        //                 var name=data[3].replaceAll("\"","");
        //                 var lon=parseFloat(data[4].replaceAll("\"",""));
        //                 var lat=parseFloat(data[5].replaceAll("\"",""));
        //                 var hei=parseFloat(data[6].replaceAll("\"",""));
        //
        //                 self.time=new Date(time);
        //
        //                 var zs=[];
        //                 var zss=[];
        //                 for(var a=0;a<72;a++){
        //                     zs[a]=parseFloat(data[8+a].replaceAll("\"",""))
        //                     zss[a]=parseFloat(data[80+a].replaceAll("\"",""))+zs[a];
        //                 }
        //
        //                 var alarmtype=0;
        //                 var time=0;
        //                 var a=self.timeInd;
        //
        //                 var info=self.areaMap[id];
        //                 var ad=info.ad;
        //                 var alarmdata=self.adAlarmData[ad];
        //
        //                 if (zss[a] > alarmdata[3]) {
        //                     time=a;
        //                     alarmtype = Math.max(4,alarmtype);
        //                 } else if (zss[a] > alarmdata[2]) {
        //                     if(alarmtype<4){
        //                         time=a;
        //                     }
        //                     alarmtype = Math.max(3,alarmtype);
        //                 } else if (zss[a] > alarmdata[1]) {
        //                     if(alarmtype<2){
        //                         time=a;
        //                     }
        //                     alarmtype = Math.max(2,alarmtype);
        //                 } else if (zss[a] > alarmdata[0]) {
        //                     if(alarmtype<1){
        //                         time=a;
        //                     }
        //                     alarmtype = Math.max(1,alarmtype);
        //                 }
        //
        //                 if(zs[a]>50){
        //                     alarmtype=alarmtype+10;
        //                 }
        //                 var point={
        //                     id,
        //                     name,
        //                     lon,
        //                     lat,
        //                     hei,
        //                     l:alarmtype,
        //                     t:time,
        //                     zs,
        //                     zss
        //                 }
        //                 self.points.push(point)
        //                 if(alarmtype>0){
        //                     self.alarmpoints.push(point);
        //                 }
        //             }
        //         }
        //
        //         self.showPoints();
        //         self.showAlarmPoints();
        //     }
        // });

    },

    getTimeString:function(){
        return this.date+":00:00";
    },

    //打开激活
    activate: function(opt, result) {
        var self = this;
        var viewer = this.viewer;
       this.isActive=true;


        if (!this._handler) { //监听地图点击事件，点击是空的时候，返回上一层级
            this._handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
            this._handler.setInputAction(function (event) {

                var pick = viewer.scene.pick(event.position);


                if (Cesium.defined(pick) && (pick.id)) {
                    self.timeWindow.stop();
                    self.hideInfo2();
                }else{
                }

            }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

            this._handler.setInputAction(function (event) {

                var pick = viewer.scene.pick(event.endPosition);
                if (Cesium.defined(pick) && pick.id) {


                }else if(self.isHeatMap){


                }
            }, Cesium.ScreenSpaceEventType.MOUSE_MOVE)




        }
        this.areaMap=[];
        this.areaSet=[];

         this.alarmpoints=[];
         this.points=[];

           this.area='',
            this. alarmInd=0,
            this.alarmtype=1,
            this.isShowAlarm=false,

            this.time=null,
            this.timeInd=0,
               this.timePause=false;
        $.ajax({
            type: "GET",
            url: "/visualization/data/ocean/tidepoint.csv",
            dataType: "text",
            success: function(data) {
                var allTextLines = data.split(/\r\n|\n/);
                var headers = allTextLines[0].split(',');

                for (var i=1; i<allTextLines.length; i++) {
                    var data = allTextLines[i].split(',');
                    if (data.length == headers.length) {
                        var id=data[0].replaceAll("\"","");
                        var name=data[5].replaceAll("\"","");
                          id=data[6].replaceAll("\"","");
                        var area=data[10].replaceAll("\"","");
                        var ad=data[12].replaceAll("\"","");
                        self.areaMap[id]={area,ad,name};
                        self.areaSet[area]=true;
                    }
                }

                self.viewWindow.setArea(self.areaSet);

                self.loadData();
            }
        });



    },

    loadData:function(){
        this.hideInfo();
        var timeparams= this.viewWindow.getTimeConfig();

        if(timeparams.ed){
            this.isTimeDuan=true;
            var date=new Date(timeparams.sd);
            date.setHours(timeparams.sh);
            var edate=new Date(timeparams.ed);
            edate.setHours(timeparams.eh);

            var dates=[];

            while(date.getTime()<=edate.getTime()){
                date.setHours(date.getHours()+1);

                dates.push(date.getFullYear()+"-"+(date.getMonth()+1)+"-"+date.getDate()+" "+date.getHours())
            }

            this.dates=dates;

            this.timeDom.css("opacity","1");
            this.infoDom.css("opacity","1");
            this.alarmDom.css("opacity","1");
            this.alarmDom2.css("opacity","1");
            
            this.timeDom.css("background-color","#26354F");
            this.infoDom.css("background-color","#26354F");
            this.alarmDom.css("background-color","#26354F");
            this.alarmDom2.css("background-color","#26354F");
       
            this.timeDom.show();
            this.timeWindow.updateTimeArray(dates);
            var self=this;
            setTimeout(function () {
                self.timeWindow.resizeTime();
            },200)


        }else {
            this.isTimeDuan=false;
            this.timeDom.hide();

            this.dates=[];
            var date=new Date(timeparams.sd);
            date.setHours(timeparams.sh+1);

            this.updateDate(date.getFullYear()+"-"+(date.getMonth()+1)+"-"+date.getDate()+" "+date.getHours());
        }

    },

    filterArea:function(area){

        this.clearMap();

        this.hideInfo();
        this.area=area;
        var self=this;
        this.alarmpoints=[];
        for(var i=0;i<this.points.length;i++) {
            var point=this.points[i];

            var info=this.areaMap[point.id];
            if(area.length!=0&&info.area!=area){
                continue;
            }
            var zss=point.zss;
            var zs=point.zs;



                var alarmtype=0;
                var time=0;

                var ad=info.ad;
                var alarmdata=this.adAlarmData[ad];

                var a=self.timeInd;

                    if (zss[a] > alarmdata[3]) {
                        time=a;
                        alarmtype = Math.max(4,alarmtype);
                    } else if (zss[a] > alarmdata[2]) {
                        if(alarmtype<4){
                            time=a;
                        }
                        alarmtype = Math.max(3,alarmtype);
                    } else if (zss[a] > alarmdata[1]) {
                        if(alarmtype<2){
                            time=a;
                        }
                        alarmtype = Math.max(2,alarmtype);
                    } else if (zss[a] > alarmdata[0]) {
                        if(alarmtype<1){
                            time=a;
                        }
                        alarmtype = Math.max(1,alarmtype);
                    }


                    if (zs[a] > this.zsalarmval) {
                        time=a;
                        alarmtype =alarmtype+10;
                    }

                if(alarmtype>0) {
                    point.l = alarmtype;
                    point.t = time;
                    this.alarmpoints.push(point);
                }








            var html=this.getHtmlByPoint(point);

            var entity = viewer.entities.add({
                id:'pointentity_'+i,
                position: Cesium.Cartesian3.fromDegrees(point.lon, point.lat, 10),
                point: { //点
                    pixelSize: 6,
                    color:new Cesium.Color.fromCssColorString("#ffffff"),
                    HeightReference: 0
                },
                popup:{
                    html: html
                }
            });
            this.showEntities.push(entity);
        }

        viewer.flyTo(this.showEntities);
        this.showAlarmPoints();


    },


    showAlarmInfo:function(id){

        if(this.isTimeDuan){
            this.showInfoWin(id);
        }

        var data=null;
        for(var i=0;i<this.alarmpoints.length;i++){
            var point=this.alarmpoints[i];
            if(point.id==id){
                data=point;
            }
        }
        this.alarmDom.hide();
        this.alarmDom2.hide();

        if(data) {
            var l = data.l;
            if(l >= 10){
                if(l > 10){
                    this.alarmDom.show();
                    var info = this.areaMap[data.id];
                    this.alarmWindow.loadcharts(data, info, this.timeInd, this.alarmtype, this.adAlarmData[info.ad]);
                }
                this.alarmDom2.show();
                var info = this.areaMap[data.id];
                this.alarmWindow2.loadcharts(data, info, this.timeInd, this.alarmtype, this.adAlarmData[info.ad]);
            }else {
                this.alarmDom.show();
                var info = this.areaMap[data.id];
                this.alarmWindow.loadcharts(data, info, this.timeInd, this.alarmtype, this.adAlarmData[info.ad]);
            }

        }

    },



    showAlarmPoint:function(point){
        var info=this.areaMap[point.id];

        var html=this.getHtmlByPoint(point,true);

        var color='#367ae5';

        var l = point.l;

        if(l == 10){
            color='rgba(31, 122, 15, .6)';
        }else if(l > 10){
            color='rgba(31, 122, 15, .6)';
        }else if(l==2){
            color='#c2cb10';
        }else if(l==3){
            color='#c97e09';
        }else if(l==4){
            color='#ea4040';
        }else if(l==1){
            color='#367ae5';
        }

        var divpoint = new mars3d.DivPoint(viewer, {
            html: '<div class="mars3d-animation-point" style="color:'+color+';"><p></p></div>',
            position: Cesium.Cartesian3.fromDegrees(point.lon, point.lat),
            anchor: [0, 0],
            data: null,
            popup: html
        });

        this.divpoints.push(divpoint);
    },
    showAlarmPoints:function(){
        var viewer=this.viewer;
        for(var i=0;i<this.alarmpoints.length;i++) {
            var point=this.alarmpoints[i];
            var info=this.areaMap[point.id];

           this.showAlarmPoint(point);
        }
    },

    showPoints:function(){

        this.clearMap();

        if(this.area){
            this.filterArea(this.area);
            return;
        }


        if(this.points.length == 0){
            toastr.info('当前时间无数据');
        }
        
        for(var i=0;i<this.points.length;i++) {
            var point=this.points[i];

            var info=this.areaMap[point.id];
            var html=this.getHtmlByPoint(point);


            var entity = viewer.entities.add({
                id:'pointentity_'+i,
                position: Cesium.Cartesian3.fromDegrees(point.lon, point.lat, 10),
                point: { //点
                    pixelSize: 6,
                    color:new Cesium.Color.fromCssColorString("#fdfbfd"),
                    HeightReference: 0
                },
                popup:{
                    html: html
                }
            });
            this.showEntities.push(entity);
        }

        $("#loading").hide();
        viewer.flyTo(this.showEntities);
        this.showAlarmPoints();
    },


    showInfoWin:function(id){
        
        this.timeWindow.stop();
        this.infoDom.show();
        var data=null;
        for(var i=0;i<this.points.length;i++){
            var point=this.points[i];
            if(point.id==id){
                data=point;
            }
        }

        if(data) {
            var info=this.areaMap[data.id];

            this.infoWindow.loadcharts(data,info,this.adAlarmData[info.ad],this.dates,this.timeInd);
        }

    },




    clearAlarmPoint:function(){
        for(var i=0;i<this.divpoints.length;i++){
            if(this.divpoints[i]) {
                this.divpoints[i].destroy();
            }
        }

        this.divpoints=[];
    },

    /*
     清除 div容器  清除 echarts
     */
    clearMap: function() {

        this.viewer.entities.removeAll();
        this.showEntities=[];
        this.showContours=[];

        if(this.heatmapLayer) {
            viewer.imageryLayers.remove(this.heatmapLayer);
        }
        this.heatmapLayer=null;

        this.clearAlarmPoint();


    },
    //关闭释放
    disable: function() {
        this.isActive=true;
        if (this._handler) {
            this._handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK);
            this._handler = null;
        }
        this.viewWindow = null;
        this.clearMap();

    },
}));


var theWidgetSite;

function RGBtoHEX(rgb) {
    rgb = rgb.match(/^rgba?\(\s?(\d+),?\s?(\d+),?\s?(\d+),?\s?\/?\s?(\d?\.?\d+|\d+)%?\)$/i);
    let hex = '';
    if(rgb) {
        var red = rgb[1] < 0 ? 0 : rgb[1] > 255 ? 255: rgb[1];
        var green = rgb[2] < 0 ? 0 : rgb[2] > 255 ? 255: rgb[2];
        var blue = rgb[3] < 0 ? 0 : rgb[3] > 255 ? 255: rgb[3];

        hex = "#" +
            ("0" + parseInt(red, 10).toString(16)).slice(-2) +
            ("0" + parseInt(green, 10).toString(16)).slice(-2) +
            ("0" + parseInt(blue, 10).toString(16)).slice(-2)
    }
    return hex;
}


function showInfoWinSite(id) {

    theWidgetSite.showInfoWin(id);
}
function showAlarmWinSite(id) {

    theWidgetSite.showAlarmInfo(id);
}
