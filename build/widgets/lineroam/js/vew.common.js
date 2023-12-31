/* 2017-7-21 08:55:38 | 修改 木遥（微信:  http://marsgis.cn/weixin.html ） */
/*
 * @Author: HuJunyun
 * @Date:   2016-06-21
 * @Last Modified by:   HuJunyun
 * @Last Modified time: 2016-06-21
 */
function nihao(){
    alert("你好");
}
$(function () {
    $(window).resize(refHeight);
    refHeight();

    //关闭标绘
    //$('.mp_icon_close').click(function () {
    //    $(this).parent().parent('.mp_box').hide();
    //});
    // 切换选项卡
    $('.mp_tab_tit li').click(function () {
        if ($(this).hasClass('cur') || $(this).hasClass('disabled')) {
            return false;
        } else {
            var that = $(this),
            index = that.index();
            that.addClass("cur").siblings("li").removeClass("cur");
            that.parent().siblings(".mp_tab_con").children().eq(index).addClass("cur").siblings().removeClass("cur");
             
            var _id = $(this).attr('id');
            if (_id != 'tab_plot')
                last_attr_tab = _id;
        }
    });
    
    // mp_tree
    $('.open').click(changeOpenShowHide);
});


function tab2plot() { 
    $("#tab_attr").addClass('disabled');
    $("#tab_latlng").addClass('disabled');
    $("#tab_plot").click();
}
var last_attr_tab = 'tab_attr';
function tab2attr() {
    $("#tab_attr").removeClass('disabled');
    $("#tab_latlng").removeClass('disabled');

    if ($("#tab_plot").hasClass('cur'))
        $("#" + last_attr_tab).click();
}

function changeOpenShowHide () {
    var openlis = $(this).siblings();
    var opent = $(this).children('.tree_icon');
    openlis.toggle();
    if (openlis.is(":hidden")) {
        opent.html('+');
    } else {
        opent.html('-');
    }
}

function refHeight() {
    $('.mp_tab_card').height($('.mp_box').height() - $('.mp_head').height() - 1);
    $('.mp_tree').height($('.mp_tab_card').height() - 72);
    $('.mp_mark').height($('.mp_tab_card').height() - 80);
}



(function ($) {
    //下拉菜单默认参数
    var defaluts = {
        select: "mp_select",
        select_text: "mp_select_text",
        select_ul: "mp_select_ul"
    };
 
    $.fn.extend({
        // 下拉菜单
        "select": function (options) {
            var opts = $.extend({}, defaluts, options);
            return this.each(function () {
                var that = $(this);
                //模拟下拉列表
                if (that.data("value") !== undefined && that.data("value") !== '') {
                    that.val(that.data("value"));
                }
                var _html = [];
                _html.push("<div class=\"" + that.attr('class') + "\">");
                _html.push("<div class=\"" + opts.select_text + "\">" + that.find(":selected").text() + "</div>");
                _html.push("<ul class=\"" + opts.select_ul + "\">");
                that.children("option").each(function () {
                    var option = $(this);
                    if (that.data("value") == option.val()) {
                        _html.push("<li data-value=\"" + option.val() + "\">" + option.text() + "</li>");
                    } else {
                        _html.push("<li data-value=\"" + option.val() + "\">" + option.text() + "</li>");
                    }
                });
                _html.push("</ul>");
                _html.push("</div>");
                var select = $(_html.join(""));
                var select_text = select.find("." + opts.select_text);
                var select_ul = select.find("." + opts.select_ul);
                that.after(select);
                that.hide();
                //下拉列表操作
                select.click(function (event) {
                    $(this).toggleClass('mp_selected');
                    $(this).find("." + opts.select_ul).slideToggle().end().siblings("div." + opts.select).find("." + opts.select_ul).slideUp();
                    event.stopPropagation();
                });
                $("body").click(function () {
                    select_ul.slideUp();
                });
                select_ul.on("click", "li", function () {
                    var li = $(this);
                    var val = li.addClass("selecton").siblings("li").removeClass("selecton").end().data("value").toString();
                    if (val !== that.attr("data-value")) {
                        select_text.text(li.text());
                        that.attr("data-value", val);
                        that.change();
                    }
                });
            });
        },
        // 复选框
        "checkbox": function () {
            return this.each(function () {
                var that = $(this);
                var $input = that.siblings("input");
                if ($input.prop("disabled") == true) {
                    that.addClass("pnui-check-disbaled");
                } else if ($input.prop("checked") == true) {
                    that.addClass("pnui-checked");
                } else {
                    that.removeClass("pnui-checked");
                }
                that.on("click", function () {
                    if ($input.prop("disabled") == true) {
                        return false;
                    } else if (that.hasClass("pnui-checked")) {
                        $input.removeAttr("checked");
                        that.removeClass("pnui-checked");
                    } else {
                        $input.attr("checked", "checked");
                        that.addClass("pnui-checked");
                    }
                });
                $(".checkall").click(function () {
                    var that = $(this);
                    var $checkallbox = that.parents('.checkallbox');
                    var $checkchild = $checkallbox.find(".pnui-chkbox");
                    that.toggleClass("pnui-checked");
                    $checkchild.each(function () {
                        $(this).toggleClass("pnui-checked");
                    });
                    if (that.hasClass("pnui-checked")) {
                        $checkchild.siblings("input").attr("checked", "checked");
                        $checkchild.addClass("pnui-checked");
                    } else {
                        $checkchild.siblings("input").removeAttr("checked");
                        $checkchild.removeClass("pnui-checked");
                    }
                });
            });
        },
        // 单选框
        "radio": function () {
            return this.each(function () {
                var that = $(this);
                if (that.children("input").prop("disabled") == true) {
                    that.children(".pnui-rdobox").removeClass().addClass("pnui-rdobox pnui-radio-disbaled");
                } else if (that.children("input").prop("checked") == true) {
                    that.siblings().children('input').removeAttr("checked");
                    that.siblings().children(".pnui-rdobox").removeClass("pnui-checked");
                    that.children(".pnui-rdobox").addClass("pnui-checked");
                } else {
                    that.siblings().children('input').prop("checked", "checked");
                    that.siblings().children(".pnui-rdobox").addClass("pnui-checked");
                    that.children(".pnui-rdobox").removeClass("pnui-checked");
                }
                that.on("click", function () {
                    var that = $(this);
                    if (that.children("input").prop("disabled") == true) {
                        return false;
                    } else if (that.children("input").prop("checked") == true) {
                        that.siblings().children('input').prop("checked", "checked");
                        that.siblings().children(".pnui-rdobox").addClass("pnui-checked");
                        that.children("input").removeAttr("checked");
                        that.children(".pnui-rdobox").removeClass("pnui-checked");
                    } else {
                        that.siblings().children('input').removeAttr("checked");
                        that.siblings().children(".pnui-rdobox").removeClass("pnui-checked");
                        that.children("input").prop("checked", "checked");
                        that.children(".pnui-rdobox").addClass("pnui-checked");
                    }
                });
            });
        },
        //滑动条 
        progress: function (max) {
            var opts = {
                progress: "puiprogress",
                progress_bg: "puiprogress_bg",
                progress_btn: "puiprogress_btn",
                progress_bar: "puiprogress_bar",
                progress_text: "puiprogress_text"
            };
            return this.each(function () {
                var that = $(this);
                //模拟进度条
                var _html = [];
                _html.push("<div class=\"" + opts.progress + "\">");
                _html.push("<div class=\"" + opts.progress_bg + "\">");
                _html.push("<div class=\"" + opts.progress_bar + "\">" + "</div>");
                _html.push("</div>");
                _html.push("<div class=\"" + opts.progress_btn + "\">" + "</div>");
                _html.push("<div class=\"" + opts.progress_text + "\">" + that.val() + "%</div>");
                _html.push("</div>");
                var pro = $(_html.join(""));
                var progress_bg = pro.find("." + opts.progress_bg);
                var progress_btn = pro.find("." + opts.progress_btn);
                var progress_bar = pro.find("." + opts.progress_bar);
                var progress_text = pro.find("." + opts.progress_text);
                that.after(pro);
                that.hide();
                //进度条操作
                var tag = false, ox = 0, left = 0, bgleft = 0;
                pro.css('width', max);

                var _val = Number(that.val());
                left = max * _val / 100; 
                progress_btn.css('left', left);
                progress_bar.width(left);  
                progress_text.html(parseInt(_val) + '%');

                progress_btn.mousedown(function (e) {
                    ox = e.pageX - left;
                    tag = true;
                });
                $(document).mouseup(function () {
                    tag = false;
                });
                pro.mousemove(function (e) {//鼠标移动
                    if (tag) {
                        left = e.pageX - ox;
                        if (left <= 0) {
                            left = 0;
                        } else if (left > max) {
                            left = max;
                        }
                        progress_btn.css('left', left);
                        progress_bar.width(left);
                        var _val = parseInt((left / max) * 100);
                        progress_text.html(_val + '%');
                         
                        that.val(_val);
                        that.change();
                    }
                });
                progress_bg.click(function (e) {//鼠标点击
                    if (!tag) {
                        bgleft = progress_bg.offset().left;
                        left = e.pageX - bgleft;
                        if (left <= 0) {
                            left = 0;
                        } else if (left > max) {
                            left = max;
                        }
                        progress_btn.css('left', left);
                        progress_bar.animate({ width: left }, max);
                        var _val = parseInt((left / max) * 100);
                        progress_text.html(_val + '%');
                        that.val(_val);
                        that.change();
                    }
                });
            });
        }
    });
})(jQuery);

