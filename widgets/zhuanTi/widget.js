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
        $("#zhuanti_btn1").click(function() {
            $(this).addClass('selectbtn');
            $("#zhuanti_btn2").removeClass('selectbtn');
            $("#zhuanti_btn3").removeClass('selectbtn');

            var opt={};
                opt.uri = window.publicPath+ 'widgets/oceanspeed/widget.js';
                opt.name = $(this).val();
                mars3d.widget.activate(opt);

        });

        $("#zhuanti_btn2").click(function() {
            $(this).addClass('selectbtn');
            $("#zhuanti_btn1").removeClass('selectbtn');
            $("#zhuanti_btn3").removeClass('selectbtn');

            var opt={};
            opt.uri = window.publicPath+ 'widgets/oceanwave/widget.js';
            opt.name = $(this).val();
            mars3d.widget.activate(opt);

        });

        $("#zhuanti_btn3").click(function() {
            $(this).addClass('selectbtn');
            $("#zhuanti_btn1").removeClass('selectbtn');
            $("#zhuanti_btn2").removeClass('selectbtn');


            var opt={};
            opt.uri = window.publicPath+'widgets/oceansite/widget.js';
            opt.name = $(this).val();
            mars3d.widget.activate(opt);

        });


    },
    //激活插件
    activate: function() {
         $("#zhuanti_btn1").trigger('click');
    },
    //释放插件
    disable: function() {
    },


}));
