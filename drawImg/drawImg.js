/**
 * Created by user on 2016/4/21.
 */
(function clip() {
    var canvas = document.getElementById('canvas');
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = "000";
    var img = new Image();
    img.src = "width.png";
    img.onload = function() {
        result = calculateImg(this, canvas);
        ctx.drawImage(img, result.left, result.top, result.width, result.height);
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
})();