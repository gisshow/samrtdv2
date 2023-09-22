var thisWidget;
var thisType = "";

//当前页面业务
function initWidgetView(_thisWidget) {
    thisWidget = _thisWidget;
    thisWidget.initScence();
    let presentStatus = "snow";
    let presentVal =5 ;

    if (thisWidget.config && thisWidget.config.style) {
        $("body").addClass(thisWidget.config.style);
    }
    $('#btn_weather_snow').bind('click', function () {
        presentStatus = "snow"
        thisWidget.showSnow(presentVal);
    });
    $('#btn_weather_rain').bind('click', function () {
      presentStatus = "rain"
      thisWidget.showRain(presentVal);
    });
    $('#btn_weather_fog').bind('click', function () {
      presentStatus = "fog"
      thisWidget.showfog(presentVal,true);
    });

    $('#btn_weather_clear').bind('click', function () {
      presentStatus = "clear"
        thisWidget.clearStage();
    });

    $("#progress").bind("input propertychange",function() {
      presentVal=$("#progress").val()*0.8;
      switch (presentStatus) {
        case "snow":
          thisWidget.showSnow(presentVal);
          break;
        case "rain":
          thisWidget.showRain(presentVal);
          break;
        case "fog":
          thisWidget.showfog($("#progress").val()*0.95,false);
          break
      }


    })

}
