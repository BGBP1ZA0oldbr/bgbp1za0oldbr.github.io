"use strict";

// 1. 替换 const/let → var
function drawCoverImage(ctx, img, canvasWidth, canvasHeight) {
    var imgRatio = img.width / img.height;
    var canvasRatio = canvasWidth / canvasHeight;

    var drawWidth, drawHeight, offsetX = 0, offsetY = 0;

    if (imgRatio > canvasRatio) {
        drawHeight = canvasHeight;
        drawWidth = img.width * (canvasHeight / img.height);
        offsetX = (canvasWidth - drawWidth) / 2;
    } else {
        drawWidth = canvasWidth;
        drawHeight = img.height * (canvasWidth / img.width);
        offsetY = (canvasHeight - drawHeight) / 2;
    }

    ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
}

// 2. 移除 async/await → 改用 Promise + .then()
function generateImage() {
    var canvas = document.getElementById("outputCanvas");
    var ctx = canvas.getContext("2d");

    // 清除画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 加载背景图
    var bgImage = new Image();
    bgImage.crossOrigin = "Anonymous";

    // 使用 Promise.then() 替代 async/await
    new Promise(function(resolve) {
        bgImage.onload = resolve;
        bgImage.onerror = function() {
            console.error("背景图加载失败！");
            ctx.fillStyle = "#f0f0f0";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            resolve();
        };
        bgImage.src = "background.jpg"; // 替换为你的图片路径
    }).then(function() {
        // 画背景图
        drawCoverImage(ctx, bgImage, canvas.width, canvas.height);

        // 3. 替换 fetch → 用 XMLHttpRequest（Chrome 46 不支持 fetch）
        return new Promise(function(resolve) {
            var xhr = new XMLHttpRequest();
            xhr.open("GET", "https://ipapi.co/json/", true);
            xhr.onload = function() {
                if (xhr.status === 200) {
                    try {
                        var data = JSON.parse(xhr.responseText);
                        resolve(data);
                    } catch (e) {
                        console.error("IP 解析失败", e);
                        resolve({});
                    }
                } else {
                    console.error("IP 获取失败", xhr.status);
                    resolve({});
                }
            };
            xhr.onerror = function() {
                console.error("IP 请求失败");
                resolve({});
            };
            xhr.send();
        });
    }).then(function(data) {
        var ip = data.ip || "未知";
        var country = data.country_name || "未知";
        var province = data.region || "未知";
        var city = data.city || "未知";

        // 4. 确保 UAParser 已加载（Chrome 46 兼容版本）
        var uaResult = typeof UAParser !== "undefined" ? new UAParser().getResult() : {};
        var os = uaResult.os ? uaResult.os.name || "未知" : "未知";
        var browser = uaResult.browser ? (uaResult.browser.name + " " + uaResult.browser.version) || "未知" : "未知";

        // 日期
        var weekArray = ["日", "一", "二", "三", "四", "五", "六"];
        var today = new Date();
        var dateStr = "今天是 " + today.getFullYear() + "年" + (today.getMonth() + 1) + "月" + today.getDate() + "日 星期" + weekArray[today.getDay()];

        // 设置字体样式
        ctx.fillStyle = "#39c5bb";
        ctx.font = "12px Arial"; // Chrome 46 可能不支持自定义字体

        // 绘制文本
        ctx.fillText("欢迎您来自 " + country + "-" + province + "-" + city + " 的朋友", 10, 25);
        ctx.fillText(dateStr, 10, 52);
        ctx.fillText("您的IP是: " + ip, 10, 75);
        ctx.fillText("您使用的是 " + os + " 操作系统", 10, 100);
        ctx.fillText("您使用的是 " + browser, 10, 125);

        // 5. 手动解析 URL 参数（Chrome 46 不支持 URLSearchParams）
        var query = window.location.search.substring(1);
        var params = {};
        query.split("&").forEach(function(pair) {
            var kv = pair.split("=");
            if (kv[0] === "s") {
                var decodedText = atob(decodeURIComponent(kv[1]).replace(/ /g, "+"));
                ctx.font = "12px Arial";
                ctx.fillText(decodedText, 10, 210);
            }
        });

        var dataURL = canvas.toDataURL("image/jpeg");
        console.log("图片生成成功:", dataURL);
    }).catch(function(e) {
        console.error("生成图片出错:", e);
    });
}

// 确保 DOM 加载完成后执行
document.addEventListener("DOMContentLoaded", generateImage);
