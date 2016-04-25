/**
 * Created by user on 2016/4/21.
 */
var canvas = document.getElementById('canvas');
var ctx = canvas.getContext('2d');
ctx.fillStyle = "000"; //画布背景色
var drawObject = {
    imgOriginPos: {}, //图像原始位置,尺寸
    imgResizePos: {}, //图像变化后的位置和尺寸
    rectPos: {}, //裁剪矩形框位置和尺寸
    resCorner: {} //改变尺寸的四个小框的位置
}

function clip(path, type, ratio) {
    ctx.clearRect(0, 0, 800, 500);
    drawImg(path, type, ratio);
}

function drawImg(path, type, ratio) {
    if(type == "new") {
        canvasImg = new Image();
        canvasImg.src = path;
        canvasImg.onload = function() {
            var position = drawObject.imgOriginPos = calculateImg(this, canvas);
            ctx.drawImage(canvasImg, position.left, position.top, position.width, position.height)
            drawRect();
            drawResCorner(20);
        }
    } else {
        drawObject.imgResizePos = drawObject.imgOriginPos;
        var resizeResult = drawObject.imgResizePos = resizeImg(ratio);
        ctx.drawImage(canvasImg, resizeResult.left, resizeResult.top, resizeResult.width, resizeResult.height);
        drawRect();
        drawResCorner(20);
    }
}

function calculateImg(img, canvas) {
    var imgWidth = img.width,
        imgHeight = img.height,
        canvasWidth = canvas.width,
        canvasHeight = canvas.height,
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
    return {
        target: target,
        left: left,
        top: top,
        width:imgWidth,
        height: imgHeight
    }
}

function resizeImg(ratio) {
    var canvasImgPos = drawObject.imgOriginPos;
    var startWidth = canvasImgPos.width,
        startHeight = canvasImgPos.height,
        startPosTop = canvasImgPos.top,
        startPosLeft = canvasImgPos.left;
    var currentWidth = parseInt(startWidth*ratio, 10),
        currentHeight = parseInt(startHeight*ratio ,10);
    var currentTop = startPosTop - parseInt((currentHeight - startHeight) / 2, 10),
        currentLeft = startPosLeft - parseInt((currentWidth - startWidth) / 2, 10)
    return {
        left: currentLeft,
        top: currentTop,
        width:currentWidth,
        height: currentHeight
    }
}

function drawRect() {
    ctx.strokeStyle = 'red';
    var cutRectPos = drawObject.rectPos = cpuRectPos();
    ctx.strokeRect(cutRectPos.left, cutRectPos.top, cutRectPos.width, cutRectPos.height);
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
    var top = parseInt((canvas.height - height) / 2, 10);
    var left = parseInt((canvas.width - width) / 2, 10);
    return {
        width: width,
        height: height,
        top: top,
        left: left,
        corner: {
            first: {
                top: top,
                left: left
            },
            second: {
                top: top,
                left: left + width
            },
            third: {
                top: top + height,
                left: left + width
            },
            forth: {
                top: top + height,
                left: left
            }
        }
    }

}
function drawResCorner(size) {
    var cornerPos = drawObject.resCorner = cpuCorner(size);
    var color = "red";
    for(var key in cornerPos) {
        var data = cornerPos[key];
        ctx.fillStyle = color;
        ctx.fillRect(data.left, data.top, size, size);
    }
}

function cpuCorner(size) {
    var first = drawObject.rectPos.corner.first,
        second = drawObject.rectPos.corner.second,
        third = drawObject.rectPos.corner.third,
        forth = drawObject.rectPos.corner.forth;
    var cornerPos = {};
    cornerPos.first = {
        top: first.top,
        bottom: first.top + size,
        left: first.left,
        right: first.left + size
    };
    cornerPos.second = {
        top: second.top,
        bottom: second.top + size,
        left: second.left - size,
        right: second.left
    };
    cornerPos.third = {
        top: third.top - size,
        bottom: third.top,
        left: third.left - size,
        right: third.left
    };
    cornerPos.forth = {
        top: forth.top - size,
        bottom: forth.top,
        left: forth.left,
        right: forth.left + size
    };
    return cornerPos;
}

function isHit(pos,mouse) {
    var left = pos.left,
        right = pos.right,
        top = pos.top,
        bottom = pos.bottom,
        mouseX = mouse.x,
        mouseY = mouse.y;
    var canvasPosLeft = $("canvas").offset().left,
        canvasPosTop = $("canvas").offset().top;
    var relativeLeft = mouseX - canvasPosLeft;
    var relativeTop = mouseY - canvasPosTop;
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
        clip(this.result,"new", 1);
    }
})
$("#slider").slider();
$("#slider").on("slide", function(slideEvt) {
    clip("","resize", (1+slideEvt.value/100));
});


