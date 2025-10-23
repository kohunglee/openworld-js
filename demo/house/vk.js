function setVK() {
    k.rId = k?.rId || Math.floor(Math.random() * 10 ** 7); // 随机7位数字，作为 ID 标识
    const now = new Date();
    const isTouch = matchMedia('(hover: none) and (pointer: coarse)').matches;  // 是否是移动设备
    const localTime = now.toLocaleString();
    console.log(`我的 ID: ${k.rId}  ` + localTime);
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
        const dict = "青玄影白寒月江晴语润晓远比尔盖茨马斯克安倍晋三苍井空户晨风蔡徐坤特朗普溥仪张学良爱新觉罗康熙乾隆雍正蒋介石";
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

        k.liveSound = document.getElementById('isLiveSound').checked;

        // 顺便判断一下人数，如果变多了，就响一下
        if (k.frendMap.size > lastPlaySize && k?.liveSound) {

            f = function(i){
                var n=2e4;
                if (i > n) return null;
                var q = t(i,n);
                i=i*0.04;
                return Math.sin(-i*0.03*Math.sin(0.09*i+Math.sin(i/200))+Math.sin(i/100))*q;
            }

            // Sound player
            t=(i,n)=>(n-i)/n;
            A=new AudioContext()
            m=A.createBuffer(1,96e3,48e3)
            b=m.getChannelData(0)
            for(i=96e3;i--;)b[i]=f(i)
            s=A.createBufferSource()
            s.buffer=m
            s.connect(A.destination)
            s.start();

        }
        if (k.frendMap.size < lastPlaySize && k?.liveSound){

            // Sound
            f = function(i){
            var n=4e4;
            if (i > n) return null;
            return Math.sin(i/2000 - Math.sin(i/331)*Math.sin(i/61))*t(i,n);
            }

            // Sound player
            t=(i,n)=>(n-i)/n;
            A=new AudioContext()
            m=A.createBuffer(1,96e3,48e3)
            b=m.getChannelData(0)
            for(i=96e3;i--;)b[i]=f(i)
            s=A.createBufferSource()
            s.buffer=m
            s.connect(A.destination)
            s.start()
        }
        lastPlaySize = k.frendMap.size;
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
        liMe.textContent = `我: ${id2name(k.rId)},    x: ${mvp.x.toFixed(2) ?? '-'}, y: ${mvp.y.toFixed(2) ?? '-'}, z: ${mvp.z.toFixed(2) ?? '-'}`;
        liMe.style.color = 'rgba(213, 0, 0, 1)';
        ul.appendChild(liMe);

        for (const [key, value] of k.frendMap) {
            const timeDiff = Date.now() - Number(value.time);
            const updateData = {};

            if (timeDiff > 3 * 1000) {  // 删去 10 秒未更新的游客
                Object.assign(updateData, defaultPos);
                k.frendMap.delete(key);
                console.log(`frendMap 删除游客 ${key}（${id2name(key)}）- ${(new Date().toLocaleString('zh-CN', { hour12: false }))} ---------------`);
            } else {
                Object.assign(updateData, {
                    x: parseFloat(value.x),
                    y: parseFloat(value.y),
                    z: parseFloat(value.z),
                    w: 0.5, d: 0.5, h: 0.5,
                    ry: parseFloat(value.ry),
                    rx: 15,
                    m:  value.m,
                });
            }

            k.W.updateInstance('frends', index, updateData);
            index++;

            // 创建 li 并写入信息
            const li = document.createElement('li');
            li.textContent = `id: ${id2name(key)},    x: ${updateData.x ?? '-'}, y: ${updateData.y ?? '-'}, z: ${updateData.z ?? '-'} ${ ((updateData.m ?? '' ) === 'm') ? '（手机端）' : '' }`;
            ul.appendChild(li);
        }

        // }
    }
    updateFrends();



    socket.onclose = () => {  // 断开 wss
        console.log("socket 已断开连接。");
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
            if(pos.id === k.rId) return; // 过滤自己
            k.frendMap.set(pos.id, pos); // 更新好友位置

            updateFrends();

        } catch (e) {
            console.log(event.data);
            console.error("无法解析收到的 JSON:");
        }
    };

    // 一个技巧，让它能一直链接，不停旋转
    setInterval(()=>{
        k.keys.turnRight = k.keys.turnRight + 0.01;
    }, 1000);
}