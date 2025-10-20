function setVK() {
    const randomId = Math.floor(Math.random() * 10 ** 7); // 随机7位数字
    const workerUrl = "wss://realtime-whiteboard.kohunglee.workers.dev";
    let socket = new WebSocket(workerUrl);

    socket.onopen = () => {  // 连接 wss
        console.log("连接成功！请开始输入。");
    };
    socket.onclose = () => {  // 断开 wss
        sendMessage({ x: 0, y: 0, z: 0 }, randomId);  // 断开时发送归零位置
        socket = new WebSocket(workerUrl);
    };

    // 将位置信息发送到 wss
    function sendMessage(pos, randomId) {
        if (socket.readyState === WebSocket.OPEN) {
            const payload = {
                rid: randomId, // 随机ID
                content: pos
            };
            socket.send(JSON.stringify(payload));
        }
    }

    // 信息整合和判断主角位置变化后发送
    const mvp = k.mainVPlayer.body.position;
    let lastPosCount = null;
    setInterval(() => {
        const pos = {};
        pos.x = mvp.x.toFixed(2);
        pos.y = mvp.y.toFixed(2);
        pos.z = mvp.z.toFixed(2);
        pos.ry = k.keys.turnRight;
        const totalCount = pos.x + pos.y + pos.z + pos.ry;
        if(totalCount !== lastPosCount){
            const posStr = JSON.stringify(pos); // 转换为 JSON 字符串
            sendMessage(posStr, randomId);
            lastPosCount = totalCount;
        }
    }, 100);

    // 初始化 游客 模型实例
    const arrIns = Array.from({ length: 10 }, () => ({
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
            console.log(data);
            const arr = data['users'];
            for (let index = 0; index < arr.length; index++) {
                const element = arr[index];
                const con = element.content;
                const rid = element.rid;
                console.log(rid, randomId);
                if(rid === randomId){  // 跳过自己的信息
                    continue;
                }
                if(con !== ''){  // 向新实例，添加位置信息
                    const pos = JSON.parse(con);
                    k.W.updateInstance('frends', index, {
                        x: parseFloat(pos.x),
                        y: parseFloat(pos.y),
                        z: parseFloat(pos.z),
                        w: 0.5,
                        d: 0.5,
                        h: 0.5,
                        ry: parseFloat(pos.ry),
                        rx: 15,
                    });
                }
            }
        } catch (e) {
            console.error("无法解析收到的 JSON:", event.data);
            whiteboard.textContent = "收到错误的数据格式。";
        }
    };
}