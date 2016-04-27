function clipImg(ops) {
    this.options = {
        canvasPos: { //初始画布位置大小
            posLeft: $("#oriCanvas").offset().left, //画布位置
            posTop: $("#oriCanvas").offset().top,
            left: 0, //画布起始点
            top: 0,
            right: 800,
            bottom: 500,
            width: 800,
            height: 500
        },
        minResize: {
            width:64,
            height: 40
        },
        corner: {
           bgColor: "fff",
            strokeColor: "red"
        },
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
}

clipImg.prototype = {
    start: function() {
        this.oriCanvas = document.getElementById("oriCanvas");
        this.ctx = this.oriCanvas.getContext('2d');
        this.rstCanvas = document.getElementById('rstCanvas');
        this.copx = this.rstCanvas.getContext('2d')
        this.bindEvent();
    },
    bindEvent: function() {
        this.bindUpdImg();
        this.bindSlider();
        this.bindMouseEvent();
    },
    bindUpdImg: function() {
        var that = this;
        $("#updImg").on("change" ,function() {
            var file = new FileReader;
            file.readAsDataURL(this.files[0]);
            file.onloadend = function() {
                that.init(this.result);
            }
        })
    },
    bindSlider: function() {
        var that = this;
        $("#slider").slider();
        $("#slider").on("slide", function(slideEvt) {
            that.options.ratio = (1+slideEvt.value/100);
            that.resizeImg();
            that.ratioRecPos();
            that.cpuCorner('init', 20);
            that.draw("init");
            that.refreshRectPos();
        });
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
                    that.cpuCorner("", 20);
                    that.draw();
                }
            },
            "mouseup": function() {
                ops.isMouseDown = false;
                ops.rectPos = ops.resRectPos;
                that.cutImg();
            }
        });

        $("#canvasTwo").bind("click", function() {
            window.open(ops.resultImg);
        })
    },
    init: function(path) {
        var that = this;
        this.canvasImg = new Image();
        this.canvasImg.src = path;
        this.canvasImg.onload = function() {
            that.calculateImg(this, that.oriCanvas);
            that.cpuRectPos();
            that.cpuCorner("init", 20);
            that.draw("init");
            that.cutImg();
        }
    },
    draw: function(type) {
        this.ctx.clearRect(0, 0, 800, 500);
        this.drawImg();
        this.drawRect(type);
        this.drawResCorner(20);
        this.drawRectInfo();
        this.drawVirtualCorner();
    },
    drawImg: function() {
        var pos = this.options.imgResizePos;
        ctx.drawImage(this.canvasImg, pos.left, pos.top, pos.width, pos.height);
    },
    drawRect: function(type) {
        this.ctx.strokeStyle = 'red';
        var pos = {};
        if(type == "init") {
            pos = this.options.rectPos;
        } else {
            pos = this.options.resRectPos;
        }
        this.ctx.strokeRect(pos.left, pos.top, pos.width, pos.height);
    },
    drawResCorner: function() {
        var pos = this.options.resCorner;
        this.ctx.fillStyle = this.options.corner.bgColor;
        this.ctx.fillRect(pos.left, pos.top, size, size);
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
                left: ops.canvasPos.offsetLeft + ops.resRectPos.right,
                top: ops.canvasPos.offsetTop + ops.resRectPos.bottom
            };
            $(div).css({
                position: 'absolute',
                left: pos.left + "px",
                top: pos.top + "px",
                width: "20px",
                height: "20px",
                "background-color": "red"
            }).attr("id", "virtualCorner").appendTo($("#drawImg"));
        } else {
            $("#virtualCorner").remove();
        }
    }
}

$(document).ready(function() {
    new clipImg();
})