/**
 * 主 HTML 上的一些事件，比如模态框的显示隐藏、移动端的控制等
 */

// 程序说明
btn01.addEventListener('mousedown', function(event) {
    document.getElementById('myinfoModal').hidden = false;
});

// 关闭 【程序说明】模态框
document.getElementById('closeBtn').addEventListener('click', function() {
    document.getElementById('myinfoModal').hidden = true;
});

// 关闭 【程序说明】模态框 02 
document.getElementById('closeBtn02').addEventListener('click', function() {
    document.getElementById('myinfoModal').hidden = true;
});

// 到原点
document.getElementById('goOPOS').addEventListener('click', function() {
    k.mainVPlayer.body.position.x = 7.6;
    k.mainVPlayer.body.position.y = 10;
    k.mainVPlayer.body.position.z = 16.5;
    k.keys.turnRight = 0;
});

// 到大厅
document.getElementById('goHall').addEventListener('click', function() {
    k.mainVPlayer.body.position.x = 31;
    k.mainVPlayer.body.position.y = 10;
    k.mainVPlayer.body.position.z = -31;
    k.keys.turnRight = 90;
});

// 移动端
const turnNum = 0.7;  // 旋转时的单位角度
const stepNum = 4;  // 移动时的单位距离
// 前
const goF = document.getElementById('goF');
goF.onmousedown = goF.ontouchstart = () => {
    k.keys.viewForward = 1;
};
goF.onmouseup = goF.ontouchend = () => {
    k.keys.viewForward = 0;
};
// 后
const goB = document.getElementById('goB');
goB.onmousedown = goB.ontouchstart = () => {
    k.keys.viewBackward = 1;
};
goB.onmouseup = goB.ontouchend = () => {
    k.keys.viewBackward = 0;
};
// 左转
const turnL = document.getElementById('turnL');
let timeturnL = null;
turnL.onmousedown = turnL.ontouchstart = () => {
    if (timeturnL) return;
    timeturnL = setInterval(() => {
        k.keys.turnRight+=turnNum;
    }, 10); // 每 100ms 执行一次
};
turnL.onmouseup = turnL.ontouchend = () => {
    clearInterval(timeturnL);
    timeturnL = null;
};
// 右转
const turnR = document.getElementById('turnR');
let timeturnR = null;
turnR.onmousedown = turnR.ontouchstart = () => {
    if (timeturnR) return;
    timeturnR = setInterval(() => {
        k.keys.turnRight-=turnNum;
    }, 10); // 每 100ms 执行一次
}
turnR.onmouseup = turnR.ontouchend = () => {
    clearInterval(timeturnR);
    timeturnR = null;
};
// 左移
const goL = document.getElementById('goL');
goL.onmousedown = goL.ontouchstart = () => {
    k.keys.viewLeft = 1;
};
goL.onmouseup = goL.ontouchend = () => {
    k.keys.viewLeft = 0;
}
// 右移
const goR = document.getElementById('goR');
goR.onmousedown = goR.ontouchstart = () => {
    k.keys.viewRight = 1;
};
goR.onmouseup = goR.ontouchend = () => {
    k.keys.viewRight = 0;
}
// 蹦
const goJump = document.getElementById('goJump');
goJump.onmousedown = goJump.ontouchstart = () => {
    k.mainVPlayer.body.velocity.y = k.jumpYVel;
};
// 抬头
const lookUp = document.getElementById('lookUp');
let timelookUp = null;
lookUp.onmousedown = lookUp.ontouchstart = () => {
    if (timelookUp) return;
    timelookUp = setInterval(() => {
        k.keys.turnUp+=turnNum;
    }, 10); // 每 100ms 执行一次
};
lookUp.onmouseup = lookUp.ontouchend = () => {
    clearInterval(timelookUp);
    timelookUp = null;
};
// 低头
const lookDn = document.getElementById('lookDn');
let timelookDn = null;
lookDn.onmousedown = lookDn.ontouchstart = () => {
    if (timelookDn) return;
    timelookDn = setInterval(() => {
        k.keys.turnUp-=turnNum;
    }, 10); // 每 100ms 执行一次
};
lookDn.onmouseup = lookDn.ontouchend = () => {
    clearInterval(timelookDn);
    timelookDn = null;
};