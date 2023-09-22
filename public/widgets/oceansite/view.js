var thisWidget;


var isduan = false;

//当前页面业务
function initWidgetView(_thisWidget) {
    thisWidget = _thisWidget;


    $("#areaselect").change(function () {
        var val = $(this).val();

        thisWidget.filterArea(val);
    })

    $("input[name=alarmtype]").change(function () {
        var val = $(this).val();

        thisWidget.updateAlarmType(val);

    })



    $("#endtimediv").hide();
    $("#datetext2").val('')

    $("#query").click(function () {
        thisWidget.loadData();
    })
    $("input[name=timetype]").change(function () {
        var val = $(this).val();

        if (val == 2) {
            isduan = true;
            $("#endtimediv").show();
            $("#datetext2").val('2020-05-28T02:00:00')

        } else {
            isduan = false;
            $("#endtimediv").hide();
            $("#datetext2").val('')

        }
    })

    $("input[type=datetime-local]").change(function (v, b) {


        var val = $(this).val();
        var min = $(this).attr("min")
        var max = $(this).attr("max");

        var date = new Date(val);


        var datemin = new Date(min);
        var datemax = new Date(max);
        if (date < datemin) {
            $(this).val(min);
        }

        if (date > datemax) {
            $(this).val(max);
        }

        var datastr1 = $("#datetext").val();
        var datastr2 = $("#datetext2").val();

        var date1 = new Date(datastr1);
        var date2 = new Date(datastr2);

        if (date1 > date2) {
            toastr.info('时间选择错误');
            // $("#datetext2").val(datastr1)
            $("#datetext").val("2020-05-25T03:00:00")
            $("#datetext2").val("2020-05-28T02:00:00")
        }


        date1.setHours(2);
        date1.setHours(date1.getHours() + 72);

        if (date1 < date2) {
            toastr.info('时间选择错误');
            // console.log(date1.getFullYear() + "-" + addZero(date1.getMonth() + 1) + "-" + addZero(date1.getDate()) + "T" + addZero(date1.getHours()) + ":00:00");
            // $("#datetext2").val(date1.getFullYear() + "-" + addZero(date1.getMonth() + 1) + "-" + addZero(date1.getDate()) + "T" + addZero(date1.getHours()) + ":00:00");
            $("#datetext").val("2020-05-25T03:00:00")
            $("#datetext2").val("2020-05-28T02:00:00")
        }

    });


}

function addZero(d) {
    if (d > 9) {
        return d;
    } else {
        return "0" + d;
    }
}

function setArea(set) {
    var html = [];
    html.push("<option value='' selected>全部</option>")
    for (var a in set) {
        if (a != 'remove' && a !== 'insert') {
            html.push("<option value='" + a + "'>" + a + "</option>");
        }

    }
    $("#areaselect").append(html.join(""))
    $("#areaselect").selectpicker("refresh");
}


function getTimeConfig() {
    var sd = $("#datetext").val();
    var sh = $("#datehour").val();
    var ed = $("#datetext2").val()
    var eh = $("#datehour2").val()

    var date = new Date(sd);
    date.setHours(date.getHours() - 1);
    var date2 = new Date(ed);


    sd = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate();
    sh = date.getHours();
    if (isduan && date < date2) {
        date2.setHours(date2.getHours() - 1);
        ed = date2.getFullYear() + "-" + (date2.getMonth() + 1) + "-" + date2.getDate();
        eh = date2.getHours();
    } else {
        ed = null;
        eh = null;
    }



    return { sd, ed, sh, eh }

}


/***
 *  点击更改样式
 */
$(".dark>a").click(function () {
    $(this).css("color", "#fada34");
})
