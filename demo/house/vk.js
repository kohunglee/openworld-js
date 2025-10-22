function setVK() {
    const rId = Math.floor(Math.random() * 10 ** 7); // 随机7位数字，作为 ID 标识
    const now = new Date();
    const localTime = now.toLocaleString();
    console.log(`我的 ID: ${rId}  ` + localTime);
    const workerUrl = "wss://wsslib.ccgxk.com";
    k.frendMap = new Map(); // 用于存储好友的实例 ID 和对应的实例索引
    const socket = new WebSocket(workerUrl);
    const defaultPos = { x: 0, y: 0, z: 0, ry: 0 };

    // document.getElementById('myinfoModal').hidden = false;

    socket.onopen = () => {  // 连接 wss
        console.log("连接 socket 成功！");
    };

    // ID 转换为 中文 名字
    const id2name = n => {
        const dict = "特朗普青玄影白寒星竹清语墨尘云归宸光元智星云霄航宇速影蓝新宙能空明林安星云海山风月江晴语润晓远";
        let h = (n * 2654435761) >>> 0; // Knuth 哈希
        let name = "";
        for (let i = 0; i < 3; i++) {
            h ^= h >>> 13;
            h = Math.imul(h, 1274126177) >>> 0; // 保证 32 位无符号整数
            name += dict[h % dict.length];
        }
        return name;
    };

    // 将位置信息发送到 wss
    function sendMessage(pos) {
        if (socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify(pos));
            updateFrends();
        }
    }

    // 信息整合和判断主角位置变化后发送
    const mvp = k.mainVPlayer.body.position;
    let lastPosCount = null;
    const reMod = setInterval(() => {
        const pos = {};
        pos.id = rId;
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
    }, 100);

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
        liMe.textContent = `我: ${id2name(rId)},    x: ${mvp.x.toFixed(2) ?? '-'}, y: ${mvp.y.toFixed(2) ?? '-'}, z: ${mvp.z.toFixed(2) ?? '-'}`;
        liMe.style.color = 'rgba(213, 0, 0, 1)';
        ul.appendChild(liMe);

        for (const [key, value] of k.frendMap) {
            const timeDiff = Date.now() - Number(value.time);
            const updateData = {};

            if (timeDiff > 10 * 1000) {  // 删去 10 秒未更新的游客
                Object.assign(updateData, defaultPos);
                k.frendMap.delete(key);
                console.log(`frendMap 删除游客 ${key}（${id2name(key)}）`);
            } else {
                Object.assign(updateData, {
                    x: parseFloat(value.x),
                    y: parseFloat(value.y),
                    z: parseFloat(value.z),
                    w: 0.5, d: 0.5, h: 0.5,
                    ry: parseFloat(value.ry),
                    rx: 15,
                });
            }

            k.W.updateInstance('frends', index, updateData);
            index++;

            // 创建 li 并写入信息
            const li = document.createElement('li');
            li.textContent = `id: ${id2name(key)},    x: ${updateData.x ?? '-'}, y: ${updateData.y ?? '-'}, z: ${updateData.z ?? '-'}`;
            ul.appendChild(li);

        }

        // }
    }



    socket.onclose = () => {  // 断开 wss
        console.log("socket 已断开连接。");
        reMod && clearInterval(reMod);
        k.frendMap = new Map();
        k.W.delete('frends');
        sendMessage({
            id: rId,
            x: 0,
            y: 0,
            z: 0,
            ry: 0,
        });
        setTimeout(() => {
            setVK();  // 断线重连
        }, 1000);
        
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
    socket.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            const pos = JSON.parse(JSON.parse(data.content));
            pos.time = Date.now();
            if(pos.id === rId) return; // 过滤自己
            k.frendMap.set(pos.id, pos); // 更新好友位置

            updateFrends();

        } catch (e) {
            console.log(event.data);
            console.error("无法解析收到的 JSON:");
        }
    };
}