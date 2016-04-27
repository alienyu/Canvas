/**
* @Author: alienyu
* @Date:   2016-04-27 08:53:50
* @Last modified by:   chexingyou
* @Last modified time: 2016-04-27 09:46:18
*/

/**
 * Created by user on 2016/4/21.
 */
var canvas = document.getElementById('canvas');
var ctx = canvas.getContext('2d');
var crop_canvas = document.getElementById('canvasTwo');
var copx = crop_canvas.getContext('2d');
ctx.fillStyle = "#000"; //画布背景色
var drawObject = {
    canvasPos: {
        left: 0,
        right: 800,
        top: 0,
        bottom: 500,
        offsetTop: $("canvas").offset().top,
        offsetLeft: $("canvas").offset().left,
        width: 800,
        height: 500
    }, //canvas位置大小
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

function init(path) {
    canvasImg = new Image();
    canvasImg.src = path;
    canvasImg.onload = function() {
        calculateImg(this, canvas);
        cpuRectPos();
        cpuCorner("init", 20);
        draw("init");
        cutImg();
    }
}

function draw(type) {
    ctx.clearRect(0, 0, 800, 500);
    drawImg();
    drawRect(type);
    drawResCorner(20);
    drawRectInfo();
}

function drawImg() {
    var pos = drawObject.imgResizePos;
    ctx.drawImage(canvasImg, pos.left, pos.top, pos.width, pos.height);
}

function drawRect(type) {
    ctx.strokeStyle = 'red';
    var pos = {};
    if(type == "init") {
        pos = drawObject.rectPos;
    } else {
        pos = drawObject.resRectPos;
    }
    ctx.strokeRect(pos.left, pos.top, pos.width, pos.height);
}

function drawResCorner(size) {
    var pos = drawObject.resCorner;
    var color = "red";
    ctx.fillStyle = color;
    ctx.fillRect(pos.left, pos.top, size, size);
}

function drawRectInfo(){
    var t = drawObject.resRectPos.top, l = drawObject.resRectPos.left,
        w = drawObject.resRectPos.width, h = drawObject.resRectPos.height;
    ctx.fillStyle = '#666';
    ctx.fillRect(l, t - 22, 50, 20);
    ctx.fillStyle = '#fff';
    ctx.font="12px";
    ctx.fillText(w + 'x' + h, l + 4, t - 8);
}

function cutImg() {
    try {
        var imgData = ctx.getImageData(drawObject.rectPos.left, drawObject.rectPos.top, drawObject.rectPos.width, drawObject.rectPos.height);
        var bufferCanvas = document.createElement('canvas');
        bufferCanvas.width = drawObject.rectPos.width;
        bufferCanvas.height = drawObject.rectPos.height;
        var bfx = bufferCanvas.getContext('2d');
        bfx.putImageData(imgData, 0, 0);
        drawObject.resultImg = bufferCanvas.toDataURL("image/png");
        var corpImg = new Image();
        corpImg.src = drawObject.resultImg;
        corpImg.onload = function() {
            copx.clearRect(0, 0, 320, 200);
            copx.drawImage(corpImg, 0, 0, 320, 200);
        }
    } catch(e){}
}

function calculateImg(img) {
    var imgWidth = img.width,
        imgHeight = img.height,
        canvasWidth = drawObject.canvasPos.width,
        canvasHeight = drawObject.canvasPos.height,
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
    drawObject.imgResizePos = drawObject.imgOriginPos = {
        target: target,
        left: left,
        top: top,
        width:imgWidth,
        height: imgHeight
    }
}

function resizeImg() {
    var ratio = drawObject.ratio;
    var canvasImgPos = drawObject.imgOriginPos;
    var startWidth = canvasImgPos.width,
        startHeight = canvasImgPos.height,
        startPosTop = canvasImgPos.top,
        startPosLeft = canvasImgPos.left;
    var currentWidth = parseInt(startWidth*ratio, 10),
        currentHeight = parseInt(startHeight*ratio ,10);
    var currentTop = startPosTop - parseInt((currentHeight - startHeight) / 2, 10),
        currentLeft = startPosLeft - parseInt((currentWidth - startWidth) / 2, 10)
    drawObject.imgResizePos = {
        left: currentLeft,
        top: currentTop,
        width:currentWidth,
        height: currentHeight
    }
}

function cpuRectPos() {
    //高度挤满,小于16:10,因此以宽度为准线
    if(drawObject.imgOriginPos.target == "height") {
        var width = parseInt(drawObject.imgOriginPos.width, 10);
        var height = parseInt(width/16*10, 10);
    } else {
        var height = parseInt(drawObject.imgOriginPos.height, 10);
        var width = parseInt(height*1.6, 10);
    }
    var top = parseInt((drawObject.canvasPos.height - height) / 2, 10);
    var left = parseInt((drawObject.canvasPos.width - width) / 2, 10);
    drawObject.resRectPos = drawObject.rectPos = {
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
}

function cpuCorner(type, size) {
    var point = {};
    if(type == "init") {
        point = drawObject.rectPos.corner;
    } else {
        point = drawObject.resRectPos.corner;
    }
    drawObject.resCorner = {
        top: point.top - size,
        bottom: point.top,
        left: point.left - size,
        right: point.left
    };
}

function resRectPos(type, mousePos) {
    var edge = {
        left: drawObject.imgResizePos.left > 0 ? drawObject.imgResizePos.left : drawObject.canvasPos.left,
        right: drawObject.imgResizePos.left > 0 ? drawObject.imgResizePos.left + drawObject.imgResizePos.width : drawObject.canvasPos.right,
        top: drawObject.imgResizePos.top > 0 ? drawObject.imgResizePos.top : drawObject.canvasPos.top,
        bottom: drawObject.imgResizePos.top > 0 ? drawObject.imgResizePos.top + drawObject.imgResizePos.height : drawObject.canvasPos.bottom
    };
    var rectLeft = drawObject.rectPos.left,
        rectTop = drawObject.rectPos.top,
        rectWidth = drawObject.rectPos.width,
        rectHeight = drawObject.rectPos.height;
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
        drawObject.resRectPos = {
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
        drawObject.resRectPos = {
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
}

function ratioRecPos() {
    var edge = {
        left: drawObject.imgResizePos.left > 0 ? drawObject.imgResizePos.left : drawObject.canvasPos.left,
        right: drawObject.imgResizePos.left > 0 ? drawObject.imgResizePos.left + drawObject.imgResizePos.width : drawObject.canvasPos.right,
        top: drawObject.imgResizePos.top > 0 ? drawObject.imgResizePos.top : drawObject.canvasPos.top,
        bottom: drawObject.imgResizePos.top > 0 ? drawObject.imgResizePos.top + drawObject.imgResizePos.height : drawObject.canvasPos.bottom
    };
    var rect = {
        left: drawObject.rectPos.left,
        right: drawObject.rectPos.right,
        top: drawObject.rectPos.top,
        bottom: drawObject.rectPos.bottom
    };
    var delta = 0,
        newWidth = drawObject.rectPos.width,
        newHeight = drawObject.rectPos.height;
    if(rect.top < edge.top) {
        delta = edge.top - rect.top;
        rect.top = edge.top;
        newHeight = drawObject.imgResizePos.height > drawObject.rectPos.height ? drawObject.rectPos.height : (drawObject.rectPos.height - delta);
        newWidth = parseInt(newHeight * 1.6, 10);
    }
    if(rect.bottom > edge.bottom) {
        delta = rect.bottom - edge.bottom;
        newHeight = drawObject.imgResizePos.height > drawObject.rectPos.height ? drawObject.rectPos.height : (drawObject.rectPos.height - delta);
        newWidth = parseInt(newHeight * 1.6, 10);
        rect.top = edge.bottom - newHeight;
    }
    if(rect.left < edge.left) {
        delta = edge.left - rect.left;
        newWidth = drawObject.imgResizePos.width > drawObject.rectPos.width ? drawObject.rectPos.width : (drawObject.rectPos.width - delta);
        newHeight = parseInt(newWidth / 1.6, 10);
        rect.left = edge.left;
    }
    if(rect.right > edge.right) {
        delta = rect.right - edge.right;
        newWidth = drawObject.imgResizePos.width > drawObject.rectPos.width ? drawObject.rectPos.width : (drawObject.rectPos.width - delta);
        newHeight = parseInt(newWidth / 1.6, 10);
        rect.left = edge.right - newWidth;
    }
    drawObject.rectPos = {
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
}

//反推裁剪框的实际位置
function refreshRectPos() {
    drawObject.rectPos = drawObject.resRectPos = {
        left: drawObject.rectPos.left,
        top: drawObject.rectPos.top,
        right: drawObject.resCorner.right,
        bottom: drawObject.resCorner.bottom,
        width: drawObject.resCorner.right - drawObject.rectPos.left,
        height: drawObject.resCorner.bottom - drawObject.rectPos.top,
        corner: {
            top: drawObject.resCorner.top,
            left: drawObject.resCorner.left
        }
    }
}

function isHit(pos,mouse) {
    var left = pos.left,
        right = pos.right,
        top = pos.top,
        bottom = pos.bottom,
        mouseX = mouse.x,
        mouseY = mouse.y;
    var relativeLeft = mouseX - drawObject.canvasPos.offsetLeft;
    var relativeTop = mouseY - drawObject.canvasPos.offsetTop;
    if(relativeLeft > left && relativeLeft < right && relativeTop > top && relativeTop < bottom) {
        return true;
    } else {
        return false;
    }
}

$("#updImg").on("change" ,function() {
    var file = new FileReader;
    file.readAsDataURL(this.files[0]);
    file.onloadend = function() {
        init(this.result);
    }
})
$("#slider").slider();
$("#slider").on("slide", function(slideEvt) {
    drawObject.ratio = (1+slideEvt.value/100);
    resizeImg();
    ratioRecPos();
    cpuCorner('init', 20);
    draw("init");
    refreshRectPos();
});

$("body").bind({
    "mousedown": function(e) {
        drawObject.isMouseDown = true;
        drawObject.mousePos = {
            startX: e.pageX,
            startY: e.pageY
        }
        if(isHit(drawObject.resCorner, {x: e.pageX, y: e.pageY})) {
            drawObject.hitType = "corner";
        } else if(isHit(drawObject.rectPos, {x: e.pageX, y: e.pageY})){
            drawObject.hitType = "rect";
        } else {
            drawObject.hitType = "";
        }
    },
    "mousemove": function(e) {
        if(drawObject.isMouseDown && drawObject.hitType) {
            var x = e.pageX - drawObject.mousePos.startX,
                y = e.pageY - drawObject.mousePos.startY;
            resRectPos(drawObject.hitType, {x: x, y: y});
            cpuCorner("", 20);
            draw();
        }
    },
    "mouseup": function() {
        drawObject.isMouseDown = false;
        drawObject.rectPos = drawObject.resRectPos;
        cutImg();
    }
});

$("#canvasTwo").bind("click", function() {
    window.open(drawObject.resultImg);
})
