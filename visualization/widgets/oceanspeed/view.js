var thisWidget;


var isduan=false;
var showLunboDate="2020-05-25";

//当前页面业务
function initWidgetView(_thisWidget) {
    thisWidget = _thisWidget;





  //  $("#datehour").val(8)

    $("#endtimediv").hide();
    $("#datetext2").val('')
  //  $("#datehour2").val('')

    $("input[name=areatype]").change(function () {
        var val=$(this).val();

        if(val==2){
            $("#timediv").show();
            thisWidget.loadShenZhenData(true);
        }else{
            $("#timediv").hide();
            thisWidget.loadGlobal();
        }
    })

    $("#zhuanti_btn2").click(function () {
        $(this).addClass("selectbtn2");
        $("#zhuanti_btn1").removeClass("selectbtn2");
        $("#timediv").show();
        thisWidget.loadShenZhenData(true);
    })

    $("#zhuanti_btn1").click(function () {
        $(this).addClass("selectbtn2");
        $("#zhuanti_btn2").removeClass("selectbtn2");
        $("#timediv").hide();
        thisWidget.loadGlobal();
    })

    $("input[name=timetype]").change(function () {
        var val=$(this).val();

        if(val==2){
          isduan=true;
          $("#endtimediv").show();
          $("#datetext2").val('2020-05-29T08:00:00')

        }else{
            isduan=false;
            $("#endtimediv").hide();
            $("#datetext2").val('')

        }
    })

    $("#query").click(function () {
        thisWidget.loadShenZhenData();
    })


    $("input[type=datetime-local]").change(function (v,b) {


        var val=$(this).val();
        var min=$(this).attr("min")
        var max=$(this).attr("max");

        var date=new Date(val);


        var datemin=new Date(min);
        var datemax=new Date(max);
        if(date<datemin){
           $(this).val(min);
        }

        if(date>datemax){
            $(this).val(max);
        }
        
        var datastr1=$("#datetext").val();
        var datastr2=$("#datetext2").val();

        var date1=new Date(datastr1);
        var date2=new Date(datastr2);

        if(date1>date2){
            toastr.info('时间选择错误');
            $("#datetext2").val(datastr1)
        }
    });






}

function selectSZ(isT) {
    if(isT) {

        $("#zhuanti_btn2").addClass("selectbtn2");
        $("#zhuanti_btn1").removeClass("selectbtn2");
        $("#timediv").show();

        $("input[name=areatype][value=2]").prop("checked",true);
    }else{
        $("#timediv").hide();

        $("#zhuanti_btn1").addClass("selectbtn2");
        $("#zhuanti_btn2").removeClass("selectbtn2");
        $("input[name=areatype][value=1]").prop("checked",true);
    }
}

function getTimeConfig() {
    var sd=$("#datetext").val();
    var sh=$("#datehour").val();
    var ed=$("#datetext2").val()
    var eh=$("#datehour2").val()

    var date=new Date(sd);
    var date2=new Date(ed);


    sd=date.getFullYear()+"-"+(date.getMonth()+1)+"-"+date.getDate();
    sh=date.getHours();
    if(isduan&&date<date2){
        ed = date2.getFullYear() + "-" + (date2.getMonth() + 1) + "-" + date2.getDate();
        eh = date2.getHours();
    }else{
        ed=null;
        eh=null;
    }



    return {sd,ed,sh,eh}

}

/***
 *  点击更改样式
 */
$(".dark>a").click(function() {
    $(this).css("color", "#fada34");
})


