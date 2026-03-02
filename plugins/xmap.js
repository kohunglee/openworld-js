/**
 * 小地图插件
 * ========
 * 实时显示当前主角在地图的位置
 */
const mapOpt = {};  // 地图比例尺

// 插件入口
export default function(ccgxkObj, mapRatioInput = 1, posCenter = {x:0, z:0}) {
    const template = document.createElement('template');  //+1 添加 html 节点
    template.innerHTML = htmlCode;
    const content = template.content.cloneNode(true);
    document.body.appendChild(content);
    mapOpt.ratio = mapRatioInput;  // 比例尺
    mapOpt.x = posCenter.x;  //+ 地图中心偏移
    mapOpt.z = posCenter.z;
    const mapUpdateInterval = setInterval(() => {  // 每 50 毫秒更新一下
        drawRedDot(posMap, ccgxkObj);
    }, 50);
}

// 用于显示的 html
const htmlCode = `
<style>
    /* 使用一个独特的 ID 或 class 来限定样式作用域 */
    #posMap {
        position: fixed;
        right: 50px;
        bottom: 50px;
        opacity: 0.8;
        border: 1px solid #ccc; /* 增加边框以便看清 */
        background-color: #f0f0f0; /* 增加背景色 */
        user-select: none;           /* 标准语法 */
        -webkit-user-select: none;   /* Safari/Chrome */
        -moz-user-select: none;      /* Firefox */
        -ms-user-select: none;       /* 旧版 IE/Edge */
    }
</style>
<canvas id="posMap" width="100" height="100"></canvas>
`;

// 绘制小地图的核心函数
function drawRedDot(canvasElement, ccgxkObj) {
    const mvp = ccgxkObj.mainVPlayer;
    if(ccgxkObj?.isMVPInit !== true){
        return 0;
    }
    const ctx = canvasElement.getContext("2d");
    const centerX = canvasElement.width / 2;    // 地图中心的 X 坐标
    const centerY = canvasElement.height / 2;   // 地图中心的 Y 坐标
    let playerMapX = (mvp.X / 5000 * mapOpt.ratio) * centerX;
    let playerMapZ = (mvp.Z / 5000 * mapOpt.ratio) * centerY;
    const gridSize = canvasElement.width / 10;  // 10 * 10 格子大小
    ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvasElement.width, canvasElement.height);
    ctx.fillStyle = "#F5F7FF";
    for (let row = 0; row < 10; row++) {  // 棋盘
        for (let col = 0; col < 10; col++) {
            if ((row + col) % 2 === 0) {
                ctx.fillRect(row * gridSize, col * gridSize, gridSize, gridSize);
            }
        }
    }
    const finalPlayerX = centerX + playerMapX + mapOpt.x;
    const finalPlayerY = centerY + playerMapZ + mapOpt.z;
    ctx.beginPath();
    ctx.arc(centerX, centerY, 2, 0, 2 * Math.PI); // 中心点
    ctx.arc(finalPlayerX, finalPlayerY, 1, 0, 2 * Math.PI); // 玩家点
    ctx.fillStyle = "red";
    ctx.fill();
    ctx.strokeStyle = "#9AFF4D";  //+ 玩家朝向线
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(finalPlayerX, finalPlayerY);
    const mainPlayer = ccgxkObj.W.current.mainPlayer;
    const northAngle = ccgxkObj.calYAngle(mainPlayer.rx, mainPlayer.ry, mainPlayer.rz);
    const lineEndX = finalPlayerX - 100 * Math.sin(northAngle);
    const lineEndY = finalPlayerY - 100 * Math.cos(northAngle);
    ctx.lineTo(lineEndX, lineEndY);
    ctx.stroke();
}

