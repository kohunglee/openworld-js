

function setVK() {
    const urlParams = new URLSearchParams(globalThis.location.search);  // 获取 URL
    const isKV = urlParams.get('vk');  // 获取 url 的 vk 参数

        const API = "https://ccgxktestvk.kohunglee.workers.dev";
        const page = Math.floor(Math.random()*90000+10000); // 随机5位数字
        let last = ""; // 保存上一次的文本

        async function upload(){
            const v = JSON.stringify(k.mainVPlayer.body.position); // 转换为 JSON 字符串
            const mvp = k.mainVPlayer.body.position;
            const pos = {};
            pos.x = mvp.x.toFixed(2);
            pos.y = mvp.y.toFixed(2);
            pos.z = mvp.z.toFixed(2);
            const posStr = JSON.stringify(pos); // 转换为 JSON 字符串
            if(posStr && posStr!==last){
                last=posStr;
                await fetch(`${API}/update?page=${page}`,{method:"POST",body:posStr});
            }
        }

        async function refresh(){
            if(isKV === '1'){
                try{
                    const r = await fetch(`${API}/get-all`);
                    const json = await r.json();
                    const newIns = [];
                    for(const [k,v] of Object.entries(json)){
                        const pos = JSON.parse(v);
                        newIns.push({
                            x: parseFloat(pos.x),
                            y: parseFloat(pos.y),
                            z: parseFloat(pos.z),
                            w: 0.2,
                            d: 0.2,
                            h: 0.2,
                        });
                    }
                    k.W.cube({  // 渲染实例化
                        n: 'frends',
                        y: 0.5,
                        instances: newIns,
                    });
                    newIns.length = 0;  // 清空数组
                }catch(e){ }
            }
        }

        k.W.cube({  // 渲染实例化
            n: 'frends',
        });


        setInterval(()=>{upload();refresh();},1000);
        refresh();
        
    // }
}