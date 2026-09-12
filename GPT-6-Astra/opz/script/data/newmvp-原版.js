/**
 * 创建一个新人物
 */
function newMvp(){
    const mainVPSize = 0.5;  // 主角的大小，方便建造
    k.W.cube({  // 隐藏显示原主角
        n:'mainPlayer',
        hidden: true,
        size: mainVPSize,
    });
    k.W.sphere({  // 主角的头
        g:'mainPlayer', n:'mvp_head',
        y: 0.82, x: 0, z: 0, s: 1, size: 0.5,
    });
    k.W.cube({  // 主角的脖子
        g:'mainPlayer', n:'mvp_neck', y: 0.6,
        x: 0, z: 0, w:0.1,  h:0.1,  d:0.1,
    });
    k.W.cube({  // 主角的身体
        g:'mainPlayer', n:'mvp_body', y: 0.3, x: 0,
        z: 0, w:0.6,  h:0.5,  d:0.1,
    });
    // 关节
    k.W.cube({  // 关节：主角的右胳膊
        g:'mainPlayer',
        n:'joint_test', y: 0.47, x: 0.30, z: 0,
        rz:15, ry:0, w:0.1,  h:0.1,  d:0.1, 
    });
    k.W.cube({  // 主角的右胳膊
        g:'joint_test', n:'aaa', y: -2,
        x: 0, z: 0, rz:0, w:1,  h:5,  d:1,
    });
    // 关节
    k.W.cube({  // 关节：主角的右胳膊
        g:'mainPlayer', n:'joint_test_left', y: 0.47, x: -0.30,
        z: 0, rz:-15, ry:0, w:0.1,  h:0.1,  d:0.1, 
    });
    k.W.cube({  // 主角的右胳膊
        g:'joint_test_left',
        n:'bbb', y: -2, x: 0, z: 0, rz:0, w:1,  h:5,  d:1,
    });
    // 关节
    k.W.cube({  // 关节：主角的右腿
        g:'mainPlayer',
        n:'joint_test_right_leg',
        y: 0.1, x: 0.15, z: 0, w:0.1,  h:0.1,  d:0.1,
    });
    k.W.cube({  // 主角的右腿
        g:'joint_test_right_leg',
        n:'rightleg',
        y: -3, x: 0, z: 0, rz:0, w:1,  h:6,  d:1,
    });
    // 关节
    k.W.cube({  // 关节：主角的左腿
        g:'mainPlayer',
        n:'joint_test_left_leg',
        y: 0.1, x: -0.15, z: 0, 
        w:0.1,  h:0.1,  d:0.1,
    });
    k.W.cube({  // 主角的右腿
        g:'joint_test_left_leg', n:'leftleg', y: -3,
        x: 0, z: 0, rz:0, w:1,  h:6,  d:1,
    });

// ======================== 实验区 ===================================

    // 显示万数块状况（一秒一更新）
    if(1) {
        function updateWskStudio() {
            const container = document.getElementById('wskStudio');
            if (!container) return;

            // ===== 扫描数据 =====
            const type1 = [], type2 = [], type3 = [];

            for (let i = 0; i < 63_0000; i += 1_0000)  if (k.indexToArgs.has(i)) type1.push(i);
            for (let i = 63_0000; i < 99_0000; i += 300) if (k.indexToArgs.has(i)) type2.push(i);
            for (let i = 99_0000; i < 100_0000; i += 1)  if (k.indexToArgs.has(i)) type3.push(i);

            const t1Total = 63, t2Total = 1200, t3Total = 10000;

            // ===== 万数块网格 (10x7 grid) =====
            let gridHTML = '';
            for (let i = 0; i < 63; i++) {
                const idx = i * 1_0000;
                const has = k.indexToArgs.has(idx);
                const info = has ? k.indexToArgs.get(idx) : null;
                gridHTML += `<span title="idx:${idx} ${info ? JSON.stringify(info) : '空'}" 
                    style="display:inline-block;width:18px;height:18px;line-height:18px;text-align:center;
                    font-size:11px;margin:1px;cursor:default;border-radius:2px;
                    background:${has ? '#3a7bd5' : '#e0e0e0'};color:${has ? '#fff' : '#999'};">
                    ${has ? '■' : '·'}
                </span>`;
                if ((i + 1) % 10 === 0) gridHTML += '<br>';
            }

            // ===== 进度条生成函数 =====
            const bar = (used, total, color) => {
                const pct = Math.round((used / total) * 100);
                const filled = Math.round(pct / 5); // 20格
                return `
                    <div style="display:flex;align-items:center;gap:8px;margin:4px 0;">
                        <div style="flex:1;height:10px;background:#e0e0e0;border-radius:5px;overflow:hidden;">
                            <div style="width:${pct}%;height:100%;background:${color};border-radius:5px;transition:width 0.3s;"></div>
                        </div>
                        <span style="font-size:11px;color:#555;min-width:80px;">${used} / ${total} (${pct}%)</span>
                    </div>`;
            };

            // ===== 拼装 HTML =====
            container.innerHTML = `
                <div style="font-family:monospace;font-size:12px;line-height:1.6;">

                    <!-- 万数块网格 -->
                    <div style="margin-bottom:10px;">
                        <div style="font-size:11px;color:#888;margin-bottom:4px;">
                            万数块 &nbsp;${type1.length} / ${t1Total} 已用
                            &nbsp;<span style="color:#3a7bd5;">■ 占用</span>
                            &nbsp;<span style="color:#999;">· 空闲</span>
                        </div>
                        ${gridHTML}
                    </div>

                    <hr style="border:none;border-top:1px solid #ddd;margin:8px 0;">

                    <!-- 三类进度条 -->
                    <div>
                        <div style="font-size:11px;color:#555;margin-bottom:2px;">万数块 (0 ~ 63w)</div>
                        ${bar(type1.length, t1Total, '#3a7bd5')}

                        <div style="font-size:11px;color:#555;margin:6px 0 2px;">百数块 (63w ~ 99w)</div>
                        ${bar(type2.length, t2Total, '#9b59b6')}

                        <div style="font-size:11px;color:#555;margin:6px 0 2px;">单数块 (99w ~ 100w)</div>
                        ${bar(type3.length, t3Total, '#27ae60')}
                    </div>

                    <!-- 底部时间戳 -->
                    <div style="font-size:10px;color:#aaa;margin-top:8px;text-align:right;">
                        更新于 ${new Date().toLocaleTimeString()}
                    </div>

                </div>
            `;
        }

        // 更新
        let _wskTimer = null;
        if (_wskTimer) clearInterval(_wskTimer);
        _wskTimer = setInterval(updateWskStudio, 1000);
    }


    // 生成供 build 插件使用的数据
    if(1){
        const buildCubeData = new Array();
        const buildLen = 9500;  // 保险一点
        for(let i = 0; i < buildLen; i++){  // 生成原始数据
            buildCubeData[i] =  {
                "x": 9999999,
                "y": -9999999,
                "z": 9999999,
                "w": 0.00001,
                "h": 0.00001,
                "d": 0.00001,
                "dz": 0,  // dpz 先设置成 0 ，方便调试
            };
        }
        k.visCubeLen = -1;  // 建造器设置 index 使用
        const id = dataProc.process(buildCubeData, {x:0}, dls);
        k.centerDot.init.wskId = id;
    }

    // 得到图书馆数据
    let get2data;  // 数据容器
    if(1){
        logicFunc(testcubedata)
        const getdata = logicData(testcubedata);  // 图书馆源数据
        function analyzeTexture(myData){  // 分离不同的 t
            const result = new Array();
            const len = myData.length;
            for(let i = 0; i < len; i++){
                const obj = myData[i];
                const texture = obj?.t ?? 0;
                if(result[texture] === undefined){
                    result[texture] = [];
                }
                result[texture].push(obj);
            }
            return result;
        }
        get2data =  analyzeTexture(getdata);  // 得到不同纹理的 3 份数据
    }

    // 下面是复杂业务逻辑




































    // 开始

    /** --------------------------------------------------------------------- */

    /**
     * 模型文件在此定义，始终规格的模型
     */
    const x_m = get2data[0];  //+ 四种规格对应的模型文件
    const m_m = get2data[2];
    const m2_m = get2data[3];
    const l_m =  [{"x":32.557,"y":9.101,"z":29.457 - 60,"w":36,"h":17,"d":30,b:"#ff0000ff"}];  // 红块
    const ll_m = [{"x":32.557,"y":9.101,"z":29.457 - 60,"w":36,"h":17,"d":30,b:"#ffc978ff"}];  // 黄块（天际线）

    /**
     * 触发器模型。
     * 
     * 都是一根棍儿。
     * 但是，我并不准备在场景中显示。
     * 这个触发器，在 引擎 那边，会实时检测与主角的位置距离，到达一定距离，会触发激活函数。
     * 三个触发器，对应三个距离。
     * 分别是近景、中景、远景，触发不同的业务逻辑，显示不同的模型。
     */
    const triggers = [
        { key: 'inGemZone',   dz: 3, name: '近景' },
        { key: 'inBoardZone', dz: 2, name: '中景' },
        { key: 'inHutZone',   dz: 1, name: '远景' }
    ];
    const triggersPosData = [{ "x": 32.557, "y": 1.5, "z": 29.457, "w": 0.5, "h": 50, "d": 0.5 }];


    /**
     * 生成单独的那个建筑
     */
    tri();

    /**
     * 生成几千个建筑
     * 
     * 其实是放置建筑的触发器，
     * 只不过主角有位置，所以就有了主角附近的建筑
    */
    if(1){
        let number = 57;
        let total = number * number; // 3249 次
        let count = 0;

        console.log("开始利用闲时执行...");
        const startTime = performance.now();

        
        function doWork(deadline) {  // 循环操作
            while (deadline.timeRemaining() > 0 && count < total) {
                
                // 还原 i 和 j
                let i = Math.floor(count / number) + 1;
                let j = (count % number) + 1;
                
                tri(160 + 50 * i -2000, -60 * j);  // 放置。这个数值操作是 偏移量 ，毕竟建筑都长一个样，只是位置不一样

                count++;
            }

            if (count < total) {  // 还没做完，请求下一个闲时片断
                requestIdleCallback(doWork);
            } else {
                const endTime = performance.now();
                console.log(`%c 任务全部完成！`, 'color: #4caf50; font-weight: bold;');
                console.log(`总计耗时: ${((endTime - startTime) / 1000).toFixed(2)} 秒`);
            }
        }

        // 开启闲时调度
        requestIdleCallback(doWork);
    }

    

    k.SPRINT_MAX_SPEED = 1000;  // 临时测试，主角加速


    /**
     * 放置触发器（一般触发器是不可视的）
    */
    function tri(zDis = 60, xDis = 0){
        const triggerState = {  // 辅助开关，记录当前状态
            inGemZone: false,   // 宝石
            inBoardZone: false, // 木板
            inHutZone: false    // 小屋
        };
        let mvppos = -1;  // 辅助中间值，记录当前模型状态
        let requestStateUpdate, runBusinessLogic;
        let runGemfunc, runHutfunc, runBoardfunc, runSkylinefunc;

        // 四个激活函数
        if(1){
            let x, m, m2, l, ll;  // 分别对应 宝石、木板、小屋、天际线 的 wsk idx 的值

            runGemfunc = () => {  // 宝石
                if(!x){
                    x = dataProc.process(x_m, { x: xDis, z: zDis }, dls, 'gem');
                }
                if(!m){
                    m = dataProc.process(m_m, { x: xDis, z: zDis }, dls, 'board', 2);
                }
                // ----------
                if(!m2){
                    m2 = dataProc.process(m2_m, { x: xDis, z: zDis }, dls, 'board2', 2);
                }
                if(l){
                    k.deleteModBlock(l);
                    l = null;
                }
                if(ll){
                    k.deleteModBlock(ll);
                    ll = null;
                }
            };
            runBoardfunc = () => {  // 木板
                if(!m){
                    m = dataProc.process(m_m, { x: xDis, z: zDis }, dls, 'board', 2);
                }
                if(!m2){
                    m2 = dataProc.process(m2_m, { x: xDis, z: zDis }, dls, 'board2', 2);
                }
                // ----------
                if(x){
                    k.deleteModBlock(x);
                    x = null;
                }
                if(l){
                    k.deleteModBlock(l);
                    l = null;
                }
                if(ll){
                    k.deleteModBlock(ll);
                    ll = null;
                }
            };
            runHutfunc = () => {  // 小屋
                if(!l){
                    l = dataProc.process(l_m, { x: xDis, z: zDis }, dls, 'hut', 2);
                }
                // ----------
                if(x){
                    k.deleteModBlock(x);
                    x = null;
                }
                if(m){
                    k.deleteModBlock(m);
                    m = null;
                }
                if(m2){
                    k.deleteModBlock(m2);
                    m2 = null;
                }
                if(ll){
                    k.deleteModBlock(ll);
                    ll = null;
                }
            };
            runSkylinefunc = () => {  // 天际线
                if(!ll){  // （调试）添加一个 百数块，用于标识 这个 天际线 块
                    ll = dataProc.process(ll_m, { x: xDis,z: zDis }, dls, 'skyline', 2);
                    // console.log("天际线idx" + ll);
                }
                // ----------
                if(x){
                    k.deleteModBlock(x);
                    x = null;
                }
                if(m){
                    k.deleteModBlock(m);
                    m = null;
                }
                if(m2){
                    k.deleteModBlock(m2);
                    m2 = null;
                }
                if(l){
                    k.deleteModBlock(l);
                    l = null;
                }
            };
        }

        // 计算当前状态
        if(1){
            let stateDebounceTimer = null;  // 防抖计时器变量
            requestStateUpdate = () => {  // 延时决策
                if (stateDebounceTimer) {  // 如果 xx 毫秒内，有新的函数被激活，则消除旧的，留下最新的
                    clearTimeout(stateDebounceTimer);
                }
                stateDebounceTimer = setTimeout(() => {
                    evaluateFinalState(); // 倒计时结束，执行最终裁判
                    stateDebounceTimer = null;
                }, 15);  // 15ms 是一个比较安全的值，在 20 性能下，最久冲突为 13ms
            };
            const evaluateFinalState = () => {
                let targetState = 4;
                if (triggerState.inGemZone) {
                    targetState = 1;
                } else if (triggerState.inBoardZone) {
                    targetState = 2;
                } else if (triggerState.inHutZone) {
                    targetState = 3;
                } else {
                    targetState = 4;
                }
                if (mvppos !== targetState) {  // 如果最终状态等于当前状态，忽略
                    mvppos = targetState;
                    runBusinessLogic(targetState);  // 判断完毕，执行最终函数
                }
            };
        }

        // 执行，按照不同的状态，执行不同的函数
        if(1){
            runBusinessLogic = (state) => {
                switch (state) {
                    case 1:
                        runGemfunc();
                        break;
                    case 2:
                        runBoardfunc();
                        break;
                    case 3:
                        runHutfunc();
                        break;
                    case 4:
                        runSkylinefunc();
                        break;
                }
            };
        }

        // 放置这三个定位块
        if(1){
            triggers.forEach(conf => {
                triggersPosData[0].dz = conf.dz;
                triggersPosData[0].st = 1;
                const idx = dataProc.process(triggersPosData, { x: xDis, z: zDis - 60 }, dls, 'setTriModel', 3, true);  // 放置模型
                const args = k.indexToArgs.get(idx + 0);
                args.activeFunc = () => {  // 激活函数
                    triggerState[conf.key] = true;
                    requestStateUpdate();
                };
                args.deleteFunc = () => {  // 删除函数
                    triggerState[conf.key] = false;
                    requestStateUpdate();
                };
            });
        }
    }

    const insData = [
        {x:0,y:20,z:0,w:1,h:1,d:1},
        {x:0,y:25,z:0,w:1,h:1,d:1},
    ];
    
    k.W.cube({
        n: 'skyline_cube',
        t: dls,
        instances: insData,
        mix: 0.7,
    });

    k.W.updateInstance('skyline_cube', 0, { w: 30 });  // 让第一个实例变宽















    
// ======================== 垃圾区 ===================================


}