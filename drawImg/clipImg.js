function clipImg(ops) {
    this.options = {
        dom: "#drawImg",
        canvasPos: { //初始画布位置大小
            posLeft: $("#oriCanvas").offset().left, //画布位置
            posTop: $("#oriCanvas").offset().top,
            left: 0, //画布起始点
            top: 0,
            right: 480,
            bottom: 300,
            width: 480,
            height: 300
        },
        minResize: {
            width:32,
            height: 20
        },
        corner: {
           size: 12,
           bgColor: "#000",
           strokeColor: "#fff"
        },
        updCallback: function() {},
        imgOriginPos: {}, //图像原始位置,尺寸
        imgResizePos: {}, //图像变化后的位置和尺寸
        rectPos: {}, //裁剪矩形框位置和尺寸
        resRectPos: {}, //裁剪框变化后的位置和尺寸
        resCorner: {}, //改变尺寸的四个小框的位置
        resultImg:  "", //裁剪后的图形base64
        ratio: 1, //比例
        isMouseDown: false, //鼠标是否按下
        hitType: "", //点击目标是右下角还是拖拽框
        mousePos: {} //鼠标偏移量
    }
    $.extend(this.options, ops);
    this.start();
    return this.options.resultImg;
}

clipImg.prototype = {
    start: function() {
        this.oriCanvas = document.getElementById("oriCanvas");
        this.ctx = this.oriCanvas.getContext('2d');
        this.rstCanvas = document.getElementById('rstCanvas');
        this.copx = this.rstCanvas.getContext('2d');
        this.bindEvent();
    },
    bindEvent: function() {
        this.bindUpdImg();
        this.bindSlider();
        this.bindMouseEvent();
        this.bindBtnEvent()
;    },
    bindUpdImg: function() {
        var that = this;
        $("#updImg").on("change" ,function() {
            var file = new FileReader;
            file.readAsDataURL(this.files[0]);
            file.onloadend = function() {
                that.init(this.result);
                $("#slider").slider("setValue", 0);
            }
        })
    },
    bindSlider: function() {
        var that = this;
        $("#slider").slider();
        $(".tooltip-inner").remove();
        $("#slider").on({
            "slide": function(slideEvt) {
                that.options.ratio = (1 + slideEvt.value / 100);
                that.resizeImg();
                that.ratioRecPos();
                that.cpuCorner('init', that.options.corner.size);
                that.draw("init");
                that.refreshRectPos();
            }
        });

        $(".slider").on("click", function(e) {
            var value = $("#slider").val();
            that.options.ratio = (1 + value / 100);
            that.resizeImg();
            that.ratioRecPos();
            that.cpuCorner('init', that.options.corner.size);
            that.draw("init");
            that.refreshRectPos();
            that.cutImg();
        });

        $(".draw_ops").delegate(".slider_ops", "click", function(e) {
            var oriData =parseInt($("#slider").val(), 10),
                step = parseInt($("#slider").data("slider-step")),
                resData;
            if($(e.target).hasClass("slider_minus")) {
                resData = (oriData - step) > 0 ? (oriData - step) : 0;
            } else {
                resData = (oriData + step) < $("#slider").data("slider-max") ? (oriData + step) : $("#slider").data("slider-max");
            }
            $("#slider").slider("setValue", resData);
            that.options.ratio = (1 + resData / 100);
            that.resizeImg();
            that.ratioRecPos();
            that.cpuCorner('init', that.options.corner.size);
            that.draw("init");
            that.refreshRectPos();
            that.cutImg();
        })
    },
    bindMouseEvent: function() {
        var that = this;
        var ops = this.options;
        $("body").bind({
            "mousedown": function(e) {
                ops.isMouseDown = true;
                ops.mousePos = {
                    startX: e.pageX,
                    startY: e.pageY
                }
                if(that.isHit(ops.resCorner, {x: e.pageX, y: e.pageY})) {
                    ops.hitType = "corner";
                } else if(that.isHit(ops.rectPos, {x: e.pageX, y: e.pageY})){
                    ops.hitType = "rect";
                } else {
                    ops.hitType = "";
                }
            },
            "mousemove": function(e) {
                if(ops.isMouseDown && ops.hitType) {
                    var x = e.pageX - ops.mousePos.startX,
                        y = e.pageY - ops.mousePos.startY;
                    that.resRectPos(ops.hitType, {x: x, y: y});
                    that.cpuCorner("", that.options.corner.size);
                    that.draw();
                }
                if(that.isHit(ops.resCorner, {x: e.pageX, y:e.pageY})) {
                    $("#oriCanvas").css("cursor", "se-resize");
                } else {
                    $("#oriCanvas").css("cursor", "pointer");
                }
            },
            "mouseup": function() {
                ops.isMouseDown = false;
                ops.rectPos = ops.resRectPos;
                that.cutImg();
            }
        });

        $("#rstCanvas").bind("click", function() {
            window.open(ops.resultImg);
        });

        $('#updImg').bind({
            "mouseenter": function(e) {
                $(".draw_upd_hack").addClass("hover");
            },
            "mouseleave": function(e) {
                $(".draw_upd_hack").removeClass("hover");
            }
        })
    },
    bindBtnEvent: function() {
        var that = this;
        reNew();
        $("#closeDraw, #cancelUpd").click(function() {
            $("#mask").hide();
            $("#drawImg").hide();
            $("#upd").remove();
            $("body").append('<input type="file" id="upd" />');
            reNew();
        });

        $("#confirmUpd").click(function() {
            that.options.updCallback.call(that);
        });

        function reNew() {
            $("#upd").on("change" ,function() {
                var file = new FileReader;
                file.readAsDataURL(this.files[0]);
                file.onloadend = function() {
                    $("#slider").slider();
                    $("#slider").slider("setValue", 0);
                    $("#mask").show();
                    $("#drawImg").show();
                    that.options.canvasPos.posLeft = $("#oriCanvas").offset().left;
                    that.options.canvasPos.posTop = $("#oriCanvas").offset().top;
                    that.init(this.result);
                }
            });
        }
    },
    init: function(path) {
        var that = this;
        this.canvasImg = new Image();
        this.canvasImg.src = path;
        this.canvasImg.onload = function() {
            that.calculateImg(this, that.oriCanvas);
            that.cpuRectPos();
            that.cpuCorner("init", that.options.corner.size);
            that.draw("init");
            that.cutImg();
        }
    },
    draw: function(type) {
        this.ctx.clearRect(0, 0, this.options.canvasPos.width, this.options.canvasPos.height);
        this.drawImg();
        this.drawRect(type);
        //this.drawResCorner(this.options.corner.size);
        this.drawRectInfo();
        //this.drawVirtualCorner();
    },
    drawImg: function() {
        var ops = this.options;
        var pos = this.options.imgResizePos;
        this.ctx.drawImage(this.canvasImg, pos.left, pos.top, pos.width, pos.height);
        var oriImgData = this.ctx.getImageData(ops.resRectPos.left, ops.resRectPos.top, ops.resRectPos.width, ops.resRectPos.height);
        this.ctx.fillStyle = "rgba(255,255,255,0.3)";
        this.ctx.fillRect(pos.left, pos.top, pos.width, pos.height);
        this.ctx.putImageData(oriImgData, ops.resRectPos.left, ops.resRectPos.top);
    },
    drawRect: function(type) {
        this.ctx.strokeStyle = '#fff';
        var pos = {};
        if(type == "init") {
            pos = this.options.rectPos;
        } else {
            pos = this.options.resRectPos;
        }
        this.ctx.strokeRect(pos.left, pos.top, pos.width, pos.height);
    },
    drawResCorner: function(size) {
        var pos = this.options.resCorner;
        this.ctx.fillStyle = this.options.corner.bgColor;
        this.ctx.fillRect(pos.left, pos.top, size*2, size*2);
    },
    drawRectInfo: function() {
        var ops = this.options;
        var t = ops.resRectPos.top, l = ops.resRectPos.left,
            w = ops.resRectPos.width, h = ops.resRectPos.height;
        this.ctx.fillStyle = '#666';
        this.ctx.fillRect(l, t - 22, 50, 20);
        this.ctx.fillStyle = '#fff';
        this.ctx.font="12px";
        this.ctx.fillText(w + 'x' + h, l + 4, t - 8);
    },
    drawVirtualCorner: function() {
        var ops = this.options;
        if((ops.resCorner.left >= ops.canvasPos.right) || (ops.resCorner.top >= ops.canvasPos.bottom)) {
            $("#virtualCorner").remove();
            var div = document.createElement('div');
            var pos = {
                left: ops.canvasPos.posLeft + ops.resRectPos.right - $(ops.dom).offset().left,
                top: ops.canvasPos.posTop + ops.resRectPos.bottom -$(ops.dom).offset().top
            };
            $(div).css({
                position: 'absolute',
                left: pos.left + "px",
                top: pos.top + "px",
                width: "12px",
                height: "12px",
                "background-color": this.options.corner.bgColor
            }).attr("id", "virtualCorner").appendTo($(this.options.dom));
        } else {
            $("#virtualCorner").remove();
        }
    },
    cutImg: function() {
        try {
            var that = this;
            var ops = this.options;
            var imgData = this.ctx.getImageData(ops.rectPos.left, ops.rectPos.top, ops.rectPos.width, ops.rectPos.height);
            var bufferCanvas = document.createElement('canvas');
            bufferCanvas.width = ops.rectPos.width;
            bufferCanvas.height = ops.rectPos.height;
            var bfx = bufferCanvas.getContext('2d');
            bfx.putImageData(imgData, 0, 0);
            ops.resultImg = bufferCanvas.toDataURL("image/png");
            var corpImg = new Image();
            corpImg.src = ops.resultImg;
            corpImg.onload = function() {
                that.copx.clearRect(0, 0, 240, 150);
                that.copx.drawImage(corpImg, 0, 0, 240, 150);
            }
        } catch(e){}
    },
    calculateImg: function(img) {
        var ops = this.options;
        var imgWidth = img.width,
            imgHeight = img.height,
            canvasWidth = ops.canvasPos.width,
            canvasHeight = ops.canvasPos.height,
            top = 0,
            left = 0,
            target = "width";
        if(imgWidth/imgHeight > 1.6) {
            imgHeight = parseInt(canvasWidth / imgWidth * imgHeight, 10);
            imgWidth = canvasWidth;
            top = parseInt((canvasHeight - imgHeight) / 2, 10);
        } else {
            imgWidth = parseInt(canvasHeight / imgHeight * imgWidth, 10);
            imgHeight = canvasHeight;
            left = parseInt((canvasWidth - imgWidth) / 2,10);
            target = "height";
        }
        ops.imgResizePos = ops.imgOriginPos = {
            target: target,
            left: left,
            top: top,
            width:imgWidth,
            height: imgHeight
        }
    },
    resizeImg: function() {
        var ratio = this.options.ratio;
        var canvasImgPos = this.options.imgOriginPos;
        var startWidth = canvasImgPos.width,
            startHeight = canvasImgPos.height,
            startPosTop = canvasImgPos.top,
            startPosLeft = canvasImgPos.left;
        var currentWidth = parseInt(startWidth*ratio, 10),
            currentHeight = parseInt(startHeight*ratio ,10);
        var currentTop = startPosTop - parseInt((currentHeight - startHeight) / 2, 10),
            currentLeft = startPosLeft - parseInt((currentWidth - startWidth) / 2, 10);
        this.options.imgResizePos = {
            left: currentLeft,
            top: currentTop,
            width:currentWidth,
            height: currentHeight
        }
    },
    cpuRectPos: function() {
        var ops = this.options;
        //高度挤满,小于16:10,因此以宽度为准线
        if(ops.imgOriginPos.target == "height") {
            var width = parseInt(ops.imgOriginPos.width, 10);
            var height = parseInt(width/16*10, 10);
        } else {
            var height = parseInt(ops.imgOriginPos.height, 10);
            var width = parseInt(height*1.6, 10);
        }
        var top = parseInt((ops.canvasPos.height - height) / 2, 10);
        var left = parseInt((ops.canvasPos.width - width) / 2, 10);
        ops.resRectPos = ops.rectPos = {
            width: width,
            height: height,
            top: top,
            left: left,
            bottom: top + height,
            right: left + width,
            corner: {
                top: top + height,
                left: left + width
            }
        }
    },
    cpuCorner: function(type, size) {
        var point = {};
        if(type == "init") {
            point = this.options.rectPos.corner;
        } else {
            point = this.options.resRectPos.corner;
        }
        this.options.resCorner = {
            top: point.top - size,
            bottom: point.top + size,
            left: point.left - size,
            right: point.left + size
        };
    },
    resRectPos: function(type, mousePos) {
        var ops = this.options;
        var edge = {
            left: ops.imgResizePos.left > 0 ? ops.imgResizePos.left : ops.canvasPos.left,
            right: ops.imgResizePos.left > 0 ? ops.imgResizePos.left + ops.imgResizePos.width : ops.canvasPos.right,
            top: ops.imgResizePos.top > 0 ? ops.imgResizePos.top : ops.canvasPos.top,
            bottom: ops.imgResizePos.top > 0 ? ops.imgResizePos.top + ops.imgResizePos.height : ops.canvasPos.bottom
        };
        var rectLeft = ops.rectPos.left,
            rectTop = ops.rectPos.top,
            rectWidth = ops.rectPos.width,
            rectHeight = ops.rectPos.height;
        if(type == "corner") {
            var newHeight = rectHeight + mousePos.y;
            var newWidth = parseInt(newHeight * 1.6, 10);
            //宽度超出右边界
            if(rectLeft + newWidth > edge.right) {
                newWidth = edge.right - rectLeft;
                newHeight = parseInt(newWidth / 1.6, 10);
            }
            //高度超出下边界
            if(rectTop + newHeight > edge.bottom) {
                newHeight = edge.bottom - rectTop;
                newWidth = parseInt(newHeight * 1.6, 10);
            }
            if(newHeight < 40) {
                newHeight = 40;
                newWidth = 64;
            }
            ops.resRectPos = {
                width: newWidth,
                height: newHeight,
                top: rectTop,
                left: rectLeft,
                bottom: rectTop + newHeight,
                right: rectLeft + newWidth,
                corner: {
                    top: rectTop + newHeight,
                    left: rectLeft + newWidth
                }
            }
        } else {
            var newLeft = rectLeft + mousePos.x,
                newTop = rectTop + mousePos.y,
                newRight = newLeft + rectWidth,
                newBottom = newTop + rectHeight;
            if(newLeft < edge.left) {
                newLeft = edge.left;
            }
            if(newRight > edge.right) {
                newLeft = edge.right - rectWidth;
            }
            if(newTop < edge.top) {
                newTop = edge.top;
            }
            if(newBottom > edge.bottom) {
                newTop = edge.bottom - rectHeight;
            }
            ops.resRectPos = {
                width: rectWidth,
                height: rectHeight,
                top: newTop,
                left: newLeft,
                bottom: newTop + rectHeight,
                right: newLeft + rectWidth,
                corner: {
                    top: newTop + rectHeight,
                    left: newLeft + rectWidth
                }
            }
        }
    },
    ratioRecPos: function() {
        var ops = this.options;
        var edge = {
            left: ops.imgResizePos.left > 0 ? ops.imgResizePos.left : ops.canvasPos.left,
            right: ops.imgResizePos.left > 0 ? ops.imgResizePos.left + ops.imgResizePos.width : ops.canvasPos.right,
            top: ops.imgResizePos.top > 0 ? ops.imgResizePos.top : ops.canvasPos.top,
            bottom: ops.imgResizePos.top > 0 ? ops.imgResizePos.top + ops.imgResizePos.height : ops.canvasPos.bottom
        };
        var rect = {
            left: ops.rectPos.left,
            right: ops.rectPos.right,
            top: ops.rectPos.top,
            bottom: ops.rectPos.bottom
        };
        var delta = 0,
            newWidth = ops.rectPos.width,
            newHeight = ops.rectPos.height;
        if(rect.top < edge.top) {
            delta = edge.top - rect.top;
            rect.top = edge.top;
            newHeight = ops.imgResizePos.height > ops.rectPos.height ? ops.rectPos.height : (ops.rectPos.height - delta);
            newWidth = parseInt(newHeight * 1.6, 10);
        }
        if(rect.bottom > edge.bottom) {
            delta = rect.bottom - edge.bottom;
            newHeight = ops.imgResizePos.height > ops.rectPos.height ? ops.rectPos.height : (ops.rectPos.height - delta);
            newWidth = parseInt(newHeight * 1.6, 10);
            rect.top = edge.bottom - newHeight;
        }
        if(rect.left < edge.left) {
            delta = edge.left - rect.left;
            newWidth = ops.imgResizePos.width > ops.rectPos.width ? ops.rectPos.width : (ops.rectPos.width - delta);
            newHeight = parseInt(newWidth / 1.6, 10);
            rect.left = edge.left;
        }
        if(rect.right > edge.right) {
            delta = rect.right - edge.right;
            newWidth = ops.imgResizePos.width > ops.rectPos.width ? ops.rectPos.width : (ops.rectPos.width - delta);
            newHeight = parseInt(newWidth / 1.6, 10);
            rect.left = edge.right - newWidth;
        }
        ops.rectPos = {
            width: newWidth,
            height: newHeight,
            top: rect.top,
            left: rect.left,
            bottom: rect.top + newHeight,
            right: rect.left + newWidth,
            corner: {
                top: rect.top + newHeight,
                left: rect.left + newWidth
            }
        }
    },
    refreshRectPos: function() {
        var ops = this.options;
        ops.rectPos = ops.resRectPos = {
            left: ops.rectPos.left,
            top: ops.rectPos.top,
            right: ops.resCorner.left + ops.corner.size,
            bottom: ops.resCorner.top + ops.corner.size,
            width: ops.resCorner.left - ops.rectPos.left + ops.corner.size,
            height: ops.resCorner.top - ops.rectPos.top + ops.corner.size,
            corner: {
                top: ops.resCorner.top,
                left: ops.resCorner.left
            }
        }
    },
    isHit: function(pos, mouse) {
        var left = pos.left,
            right = pos.right,
            top = pos.top,
            bottom = pos.bottom,
            mouseX = mouse.x,
            mouseY = mouse.y;
        var relativeLeft = mouseX - this.options.canvasPos.posLeft;
        var relativeTop = mouseY - this.options.canvasPos.posTop;
        if(relativeLeft > left && relativeLeft < right && relativeTop > top && relativeTop < bottom) {
            return true;
        } else {
            return false;
        }
    }
}

$(document).ready(function() {
    new clipImg({
        updCallback: function() {
            window.open(this.options.resultImg);
        }
    });

})