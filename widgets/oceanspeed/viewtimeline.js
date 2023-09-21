var thisWidget;

var myChart;

var dataList;
var dataListCN;
//当前页面业务
function initWidgetView(_thisWidget) {
    thisWidget = _thisWidget;

    // if (thisWidget.config && thisWidget.config.style) {//适应不同样式
    //     $("body").addClass(thisWidget.config.style);
    // }
    dataList = [];
    dataListCN = [];
    for (let i = 0; i < 3; i++) {
        var date = new Date();
        date.setDate(date.getDate() + i);

        var year = date.getFullYear();
        var month = date.getMonth() + 1;
        var day = date.getDate();
        dataListCN.push(year + "-" + month + "-" + day);

        dataList.push(year + "-" + month + "-" + day);
        // console.log(dataListCN,dataList,'shijian')
    }

    var option = {
        timeline: {
            axisType: 'category',
            currentIndex: 0,
            autoPlay: false,
            // playInterval : 5000,
            realtime: true,
            left: 10,
            top: 2,
            bottom: 2,
            right: 20,
            controlStyle: {
                color: '#2F8DF4',
                borderColor: '#2F8DF4',
                showPrevBtn: false,
                showNextBtn: false,
                emphasis: '#2F8DF4'
            },
            lineStyle: {
                color: '#2F8DF4',
                width: 4,
            },
            checkpointStyle: {
                color: '#ffd800',
                borderColor: '#ffd800'
            },
            tooltip: {},
            grid: {
                rigth: 10,
                constainLabel: true,
            },
            data: dataList,
            label: {
                color: 'white',
                formatter: function (value, index) {
                    return dataListCN[index];
                }
            },
        }
    };

    myChart = echarts.init(document.getElementById("timelinediv"));
    myChart.setOption(option);



    myChart.on('timelineChanged', function (timelineIndex) {

        var arrIndex = parseInt(timelineIndex.currentIndex);

        var date = myChart.getOption().timeline[0].data[arrIndex];

        thisWidget.updateDate(date);

    });

}

function stop() {
    var option = myChart.getOption();
    option.timeline[0].autoPlay = false;
    myChart.setOption(option);
}


function updateTimeArray(times) {
    // console.log(times);
    dataList = times;
    dataListCN = times;
    var option = {
        baseOption: {
            timeline: {
                axisType: 'category',
                currentIndex: 0,
                tooltip: {
                    show: true
                },
                autoPlay: false,
                playInterval: 5000,
                realtime: true,
                left: 10,
                top: 2,
                bottom: 2,
                right: 20,
                controlStyle: {
                    color: '#2F8DF4',
                    borderColor: '#2F8DF4',
                    showPrevBtn: false,
                    showNextBtn: false,
                    emphasis: '#2F8DF4'
                },
                lineStyle: {
                    color: '#2F8DF4',
                    width: 4,
                },
                checkpointStyle: {
                    color: '#ffd800',
                    borderColor: '#ffd800'
                },
                data: dataList,
                label: {
                    color: 'white',

                    formatter: function (value, index) {

                        return dataListCN[index];
                    }
                },
            },
            tooltip: {
                show: true,
                trigger: 'axis',
                formatter: '{b}',
                position: 'bottom',
                axisPointer: {
                    type: 'shadow',
                }
            },


            grid: [{
                show: false,
                left: '10%',
                top: 60,
                height: 0,
                containLabel: true,
                width: '40%',
            }],

            xAxis: [{
                type: 'value',
                inverse: true,
                max: 6,
                min: 0,
                axisLine: {
                    show: false,
                },
                axisTick: {
                    show: false,
                },
                position: 'top',
                axisLabel: {
                    show: false,
                    textStyle: {
                        color: '#000',
                        fontSize: 12,
                    },
                },
                splitLine: {
                    show: false,
                    lineStyle: {
                        color: '#1F2022',
                        width: 1,
                        type: 'solid',
                    },
                },
            }],
            yAxis: [{
                type: 'category',
                inverse: false,
                position: 'right',
                axisLine: {
                    show: false
                },
                axisTick: {
                    show: false
                },
                axisLabel: {
                    show: false,
                    margin: 0,
                    textStyle: {
                        color: '#000',
                        fontSize: 12,
                    },

                },
                data: []
            }]
        },

        options: [],
    };

    // myChart.getOption().timeline[0].data=dataCNList
    myChart.setOption(option);

    thisWidget.updateDate(dataList[0]);

}

function resizeTime() {
    myChart.resize();

}
// #ffd800
/*
  从0开始重新查询
 */
function resetIndex() {

    var option = {
        timeline: {
            axisType: 'category',
            currentIndex: 0,
            autoPlay: false,
            playInterval: 5000,
            realtime: true,
            left: 10,
            top: 2,
            bottom: 2,
            right: 20,
            controlStyle: {
                color: '#2F8DF4',
                borderColor: '#2F8DF4',
                showPrevBtn: false,
                showNextBtn: false,
                emphasis: '#2F8DF4'
            },
            lineStyle: {
                color: '#2F8DF4',
                width: 4,
            },
            checkpointStyle: {
                color: '#ffd800',
                borderColor: '#ffd800'
            },
            data: dateList,
            label: {
                color: 'white',
                formatter: function (value, index) {

                    return dataListCN[index];
                }
            },
        }
    };

    // myChart.getOption().timeline[0].data=dataCNList
    myChart.setOption(option);
    thisWidget.updateDate(dateList[0]);

}
