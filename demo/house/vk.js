function setVK() {
    const rId = Math.floor(Math.random() * 10 ** 7); // 随机7位数字，作为 ID 标识
    const workerUrl = "wss://1251631157-k3oer1a0l3.ap-hongkong.tencentscf.com";
    k.frendMap = new Map(); // 用于存储好友的实例 ID 和对应的实例索引
    const socket = new WebSocket(workerUrl);

    socket.onopen = () => {  // 连接 wss
        console.log("连接 socket 成功！");
    };

    // 将位置信息发送到 wss
    function sendMessage(pos) {
        if (socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify(pos));
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
            k.frendMap.set(pos.id, pos); // 更新好友位置

            let index = 0;

            for(let i = 0; i < k.frendMap.size + 1; i++) {
                k.W.updateInstance('frends', i,  { x: 5, y: 5, z: 5, ry: 0 });
            }

            for (const [key, value] of k.frendMap) {
                const timeDiff = Date.now() - Number(value.time);
                const updateData = {};

                if (timeDiff > 3 * 1000) {
                    // console.log(timeDiff);
                    // 重置位置并标记删除
                    Object.assign(updateData, { x: 5, y: 5, z: 5, ry: 0 });
                    k.frendMap.delete(key);
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
            }

            console.log('---------');

        } catch (e) {
            console.log(event.data);
            console.error("无法解析收到的 JSON:");
        }
    };
}