/**
 * Created by user on 2016/4/21.
 */
var canvas = document.getElementById('canvas');
var ctx = canvas.getContext('2d');
ctx.fillStyle = "000";
function clip(path, type, ratio) {
    ctx.clearRect(0, 0, 800, 500);
    if(type == "new") {
        canvasImg = new Image();
        canvasImg.src = path;
        canvasImgPos = {};
        canvasImg.onload = function() {
            canvasImgPos = calculateImg(this, canvas);
            ctx.drawImage(canvasImg, canvasImgPos.left, canvasImgPos.top, canvasImgPos.width, canvasImgPos.height);
        }
    } else {
        resizeResult = resizeImg(ratio);
        ctx.drawImage(canvasImg, resizeResult.left, resizeResult.top, resizeResult.width, resizeResult.height);
    }
};

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
        target = "height";
    } else {
        imgWidth = parseInt(canvasHeight / imgHeight * imgWidth, 10);
        imgHeight = canvasHeight;
        left = parseInt((canvasWidth - imgWidth) / 2,10);
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


