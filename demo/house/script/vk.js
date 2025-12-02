/**
 * 
 * VK 是多人在线的意思，因为之前是托管在 cloudflare 的 VK work 上，故此得名。
 * 
 */
let lastTime = 0;
function setVK() {
    const closeVKCheck = document.getElementById('closeVK');
    const now = Date.now();

    // 节流措施
    if(true){
        if(closeVKCheck.checked) { return 0; }  // 不开启在线功能
        if(typeof vkSocket !== 'undefined'){
            if(vkSocket.readyState === 0){ return 0; }  // 可能可以减少一些频繁调用（如频繁勾选那个选择框）
        }
        if (now - lastTime < 1000) return;  // 节流
        lastTime = now;
    }

    k.rId = k?.rId || Math.floor(Math.random() * 10 ** 7); // 随机7位数字，作为 ID 标识
    const connectInfo = document.getElementById('isConneting');
    connectInfo.innerText = '（连接中...）';
    const isTouch = matchMedia('(hover: none) and (pointer: coarse)').matches;  // 是否是移动设备
    const localTime = now.toLocaleString();
    
    console.log(`我的 ID: ${k.rId}  ` + localTime);
    const workerUrl = "wss://myshwsa.ccgxk.com/ws/";  // 新服务器

    k.frendMap = new Map(); // 用于存储好友的实例 ID 和对应的实例索引
    k.rIdSet = new Set();  // 用于储存已经有过的 id
    globalThis.vkSocket = new WebSocket(workerUrl);
    const defaultPos = { x: 0, y: 0, z: 0, ry: 0 };

    vkSocket.onopen = () => {  // 连接 wss
        console.log("连接 vkSocket 成功！");
        connectInfo.innerText = '（已连接）';
    };

    // 将位置信息发送到 wss
    function sendMessage(pos) {
        if(k.donotUseSocket) return;
        if (vkSocket.readyState === WebSocket.OPEN) {
            vkSocket.send(JSON.stringify(pos));
            updateFrends();
        }
    }

    // 信息整合和判断主角位置变化后发送
    const mvp = k.mainVPlayer.body.position;
    let lastPosCount = null;
    let lastPlaySize = null;
    const reMod = setInterval(() => {
        const pos = {};
        pos.m = (isTouch) ? 'm' : '';
        pos.id = k.rId;
        pos.x = mvp.x.toFixed(2);
        pos.y = mvp.y.toFixed(2);
        pos.z = mvp.z.toFixed(2);
        pos.ry = k.keys.turnRight.toFixed(2);
        const totalCount = pos.x + pos.y + pos.z + pos.ry;
        if(totalCount !== lastPosCount){
            const posStr = JSON.stringify(pos); // 转换为 JSON 字符串
            sendMessage(posStr);
            lastPosCount = totalCount;
        }

        if(lastPlaySize === null){
            lastPlaySize = k.frendMap.size;
        }
        lastPlaySize = k.frendMap.size;
    }, 100);

    // 定义一次即可
    const brightColors = [
        '#FF4B4B', '#FF9900', '#FFD700', '#00E676', '#00B0FF',
        '#2979FF', '#7C4DFF', '#E040FB', '#FF4081', '#FF6E40',
        '#C6FF00', '#64DD17', '#18FFFF', '#00B8D4', '#AEEA00',
        '#777777', '#FFEA00', '#69F0AE', '#536DFE', '#ffffffff'
    ];
    function numToColor(key) {  // 数字转化鲜艳的颜色
        return brightColors[Math.abs(Number(key)) % brightColors.length];
    }

    // 都有游客位置变化时，更新实例位置
    function updateFrends() {
        let index = 0;
        for(let i = 0; i < 50; i++) {
            k.W.updateInstance('frends', i,  defaultPos);
        }

        const totalCount = k.frendMap.size + 1;
        document.getElementById('onlineCount').innerText = totalCount;  // 总数
        document.getElementById('shiftInfo').innerText = '当前人数: ' + totalCount + ' | ';

        const ul = document.getElementById('frendPosInfo');
        ul.innerHTML = ''; // 清空旧内容

        const liMe = document.createElement('li');
        const mvp = k.mainVPlayer.body.position;
        liMe.textContent = `我: ${id2name(k.rId)}, x: ${mvp.x.toFixed(2) ?? '-'}, y: ${mvp.y.toFixed(2) ?? '-'}, z: ${mvp.z.toFixed(2) ?? '-'} ${ (isTouch) ? '（手机端）' : '' }`;
        liMe.style.color = 'rgba(213, 0, 0, 1)';
        const colorBox = document.createElement('span');  // 创建色块（先这样吧，后续再优化性能）
        colorBox.style.display = 'inline-block';
        colorBox.style.width = '12px';
        colorBox.style.height = '12px';
        colorBox.style.marginLeft = '6px';
        colorBox.style.border = '1px solid #fff';
        colorBox.style.background = numToColor(k.rId);
        liMe.appendChild(colorBox);

        ul.appendChild(liMe);

        for (const [key, value] of k.frendMap) {
            const timeDiff = Date.now() - Number(value.time);
            const updateData = {};

            if (timeDiff > 6 * 1000) {  // 删去 6 秒未更新的游客
                Object.assign(updateData, defaultPos);
                const ip = (k.frendMap.get(key).ip) ? k.frendMap.get(key).ip : '';
                k.frendMap.delete(key);
                console.log(`frendMap 删除游客 ${key}（${id2name(key) + '' + ip}）- ${(new Date().toLocaleString('zh-CN', { hour12: false }))} ---------------`);
            } else {
                Object.assign(updateData, {
                    x: parseFloat(value.x),
                    y: parseFloat(value.y),
                    z: parseFloat(value.z),
                    w: 0.5, d: 0.5, h: 0.5,
                    ry: parseFloat(value.ry),
                    rx: 15,
                    mb:  value.m,
                    ip:  value.ip,
                    b: numToColor(key),
                });
            }

            k.W.updateInstance('frends', index, updateData);
            index++;

            // 创建 li 并写入信息
            const li = document.createElement('li');
            li.textContent = `id: ${id2name(key)}, x: ${updateData.x ?? '-'}, y: ${updateData.y ?? '-'}, z: ${updateData.z ?? '-'} ${ ((updateData.mb ?? '' ) === 'm') ? '（手机端）' : '' }`;
            li.title = (updateData.ip ?? '' );
            const colorBox = document.createElement('span');  // 创建色块（先这样吧，后续再优化性能）
            colorBox.style.display = 'inline-block';
            colorBox.style.width = '12px';
            colorBox.style.height = '12px';
            colorBox.style.marginLeft = '6px';
            colorBox.style.border = '1px solid #fff';
            colorBox.style.background = updateData.b;
            li.appendChild(colorBox);

            ul.appendChild(li);
        }
    }
    updateFrends();

    vkSocket.onclose = () => {  // 断开 wss
        console.log("vkSocket 已断开连接。");
        reMod && clearInterval(reMod);
        k.frendMap = new Map();
        k.W.delete('frends');
        sendMessage({
            id: k.rId,
            x: 0,
            y: 0,
            z: 0,
            ry: 0,
        });
        if(!closeVKCheck.checked) {
            setTimeout(() => {
                setVK();  // 断线重连
            }, 1000);
        }
    };

    // 初始化 游客 模型实例
    const arrIns = Array.from({ length: 50 }, () => ({
        x: 0, 
        y: 0, 
        z: 0, 
        w: 0.001, 
        h: 0.001, 
        d: 0.001,
        b: '#f00',
    }));
    k.W.cube({  // 渲染实例化
        n: 'frends',
        instances: arrIns,
    });


    // 接收事件
    vkSocket.onmessage = (event) => {
        if(k.donotUseSocket) return;
        try {
            const data = JSON.parse(event.data);
            const pos = JSON.parse(data.content);
            pos.time = Date.now();
            if(pos.id === k.rId) return; // 过滤自己

            k.rIdSet.add(pos.id);
            const or_data = k.frendMap.get(pos.id) ?? {};
            k.frendMap.set(pos.id, {...or_data, ...pos}); // 更新好友位置

            updateFrends();

        } catch (e) {
            console.log(event.data);
            console.error("无法解析收到的 JSON:");
        }
    };

    // 用户不在此页面，则暂停更新
    const intervalId = setInterval(() => {
        if(k.isDEV !== '1') {
            const isActive = !document.hidden && document.hasFocus();
            if (isActive) {  // 活动
                k.donotUseSocket = false;
                document.getElementById('isConneting').style.color = "unset";
            } else {  // 不在页面
                k.donotUseSocket = true;
                document.getElementById('isConneting').style.color = "grey";
            }
        }
        
    }, 1000);
}