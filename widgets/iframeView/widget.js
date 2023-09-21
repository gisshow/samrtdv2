/* 2017-9-28 16:04:33 | 修改 木遥（QQ：516584683） */
//此方式：弹窗非iframe模式
mars3d.widget.bindClass(mars3d.widget.BaseWidget.extend({
    options: {
        resources: ['view.css'],
        //弹窗
        view: {
            type: "append",
            url: "view.html"
        },
    },

    //初始化[仅执行1次]
    create: function() {
        //  console.log("created",$(".top"))

    },
    //每个窗口创建完成后调用
    winCreateOK: function(opt, result) {
        $('.y-iframeStyle').attr('src',this.config.iframesrc)
    },
    //激活插件
    activate: function() {

    },
    //释放插件
    disable: function() {
    },


}));
