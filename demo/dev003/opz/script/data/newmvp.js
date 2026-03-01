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
            const [m1, m2, m3] = k.dataProc.typesMeta;

            for (let i = m1.startIdx; i < m1.endIdx; i += m1.step) if (k.indexToArgs.has(i)) type1.push(i);
            for (let i = m2.startIdx; i < m2.endIdx; i += m2.step) if (k.indexToArgs.has(i)) type2.push(i);
            for (let i = m3.startIdx; i < m3.endIdx; i += m3.step) if (k.indexToArgs.has(i)) type3.push(i);

            // ===== 万数块网格 =====
            let gridHTML = '';
            for (let i = 0; i < m1.total; i++) {
                const idx = m1.startIdx + i * m1.step;
                const has = k.indexToArgs.has(idx);
                const info = has ? k.indexToArgs.get(idx) : null;
                gridHTML += `<span title="idx:${idx} ${info ? '' : '空'}"
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
                return `
                    <div style="display:flex;align-items:center;gap:8px;margin:4px 0;">
                        <div style="flex:1;height:10px;background:#e0e0e0;border-radius:5px;overflow:hidden;">
                            <div style="width:${pct}%;height:100%;background:${color};border-radius:5px;transition:width 0.3s;"></div>
                        </div>
                        <span style="font-size:11px;color:#555;min-width:80px;">${used} / ${total} (${pct}%)</span>
                    </div>`;
            };

            const w = n => Math.round(n / 1_0000);  // 转换为 w 单位显示

            // ===== 拼装 HTML =====
            container.innerHTML = `
                <div style="font-family:monospace;font-size:12px;line-height:1.6;">

                    <div style="margin-bottom:10px;">
                        <div style="font-size:11px;color:#888;margin-bottom:4px;">
                            万数块 &nbsp;${type1.length} / ${m1.total} 已用
                            &nbsp;<span style="color:#3a7bd5;">■ 占用</span>
                            &nbsp;<span style="color:#999;">· 空闲</span>
                        </div>
                        ${gridHTML}
                    </div>

                    <hr style="border:none;border-top:1px solid #ddd;margin:8px 0;">

                    <div>
                        <div style="font-size:11px;color:#555;margin-bottom:2px;">万数块 (0 ~ ${w(m1.endIdx)}w)</div>
                        ${bar(type1.length, m1.total, '#3a7bd5')}

                        <div style="font-size:11px;color:#555;margin:6px 0 2px;">百数块 (${w(m2.startIdx)}w ~ ${w(m2.endIdx)}w)</div>
                        ${bar(type2.length, m2.total, '#9b59b6')}

                        <div style="font-size:11px;color:#555;margin:6px 0 2px;">单数块 (${w(m3.startIdx)}w ~ ${w(m3.endIdx)}w)</div>
                        ${bar(type3.length, m3.total, '#27ae60')}
                    </div>

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
        const id = k.dataProc.process(buildCubeData, {x:0}, dls);
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
 * 模型文件在此定义，4 种规格的模型
 *
 * 临时测试嘛，所以先写死了，后期再研究怎么使用其他的模型。
 */
const x_m  = get2data[0];
const m_m  = get2data[2];
const m2_m = get2data[3];
const l_m  = [{"x":32.557,"y":9.101,"z":29.457 - 60,"w":36,"h":17,"d":30, b:"#ff0000ff"}];
const ll_m = [{"x":32.557,"y":9.101,"z":29.457 - 60,"w":36,"h":17,"d":30, b:"#ffc978ff"}];

/**
 * 触发器模型
 *
 * 论形状，其实都是一根棍儿，不显示而已。
 * 因为，我并不准备在场景中显示。
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


/** --------------------------------------------------------------------- */
/**
 * 天际线块，独立实例化系统
 *
 * 完全独立于【万数块系统】。
 * 预分配 total 个槽位，每个 tri() 调用认领一个。
 *
 * 软删除：把对应槽位缩到极小、扔到极远，视觉消失但 drawcall 不变。
 */
const SkylineSystem = (() => {
    const SKYLINE_NAME = 'skyline_independent';
    const SOFT_DELETE_POS = { x: 999999, y: 999999, z: 999999, w: 0.001, h: 0.001, d: 0.001 };

    let instances = [];
    let realPositions = [];   // 单独存真实坐标，hide() 不会污染它（因为对象，是引用嘛，一改全改了，可能是这样）
    let slotIndex = 0;
    let initialized = false;

    // 初始化这个实例化容器，容量为 count 个
    function init(count) {
        instances = [];
        realPositions = [];
        for (let i = 0; i < count; i++) {
            instances.push({ ...SOFT_DELETE_POS });
            realPositions.push(null);  // 还没认领，为 null
        }
        k.W.cube({
            n: SKYLINE_NAME,
            t: dls,
            instances: instances,
            mix: 0.7,
        });
        initialized = true;
        slotIndex = 0;
        console.log(`%c[SkylineSystem] 初始化完成，预分配 ${count} 个槽位`, 'color:#ffc978;font-weight:bold;');
    }


    // 认领（宣称）
    function claim(xDis, zDis) {
        if (!initialized) { console.error('[SkylineSystem] 未初始化！'); return -1; }
        if (slotIndex >= instances.length) { console.error('[SkylineSystem] 槽位已满！'); return -1; }
        const idx = slotIndex++;
        const base = ll_m[0];  // 模板模型数据和位置数据
        const realPos = {
            x: base.x + xDis,
            y: base.y,
            z: base.z + zDis,
            w: base.w,
            h: base.h,
            d: base.d,
        };
        realPositions[idx] = realPos;   // 真实坐标存到独立数组
        instances[idx] = { ...realPos };
        k.W.updateInstance(SKYLINE_NAME, idx, realPos);
        return idx;
    }

    // 对指定 idx 的槽位软删除
    function hide(idx) {
        if (idx < 0) return;
        k.W.updateInstance(SKYLINE_NAME, idx, { ...SOFT_DELETE_POS });
    }

    // 对指定 idx 槽位，恢复显示
    function show(idx) {
        if (idx < 0) return;
        const pos = realPositions[idx];  // ← 从独立数组取真实坐标
        if (!pos) { console.warn('[SkylineSystem] show() 但该槽位未认领:', idx); return; }
        k.W.updateInstance(SKYLINE_NAME, idx, pos);
    }

    return { init, claim, hide, show };
})();


/** --------------------------------------------------------------------- */
/**
 * 预计建筑总数，必须和下面循环的 number*number 一致
 * +1 是给 tri() 第一次直接调用（无偏移）用的
 */
const BUILDING_NUMBER = 47;
const BUILDING_COUNT = BUILDING_NUMBER * BUILDING_NUMBER + 1;
SkylineSystem.init(BUILDING_COUNT);


/** --------------------------------------------------------------------- */
/**
 * 生成单独的那个建筑
 */
tri();

/**
 * 生成几千个建筑
 */
if (1) {
    let number = BUILDING_NUMBER;
    let total  = number * number;  // 3249 个，最多 3333 个，因为总容量 1w （好像可以改到 万数块） ，每个占 3 个。
    let count  = 0;

    console.log("开始利用闲时执行...");
    const startTime = performance.now();

    function doWork(deadline) {
        while (deadline.timeRemaining() > 0 && count < total) {
            let i = Math.floor(count / number) + 1;
            let j = (count % number) + 1;
            tri(160 + 50 * i - 2000, -60 * j);  // 在这里添加（tri 会添加三个「触发棍子」）
            count++;
        }
        if (count < total) {
            requestIdleCallback(doWork);
        } else {
            const endTime = performance.now();
            console.log(`%c 任务全部完成！`, 'color: #4caf50; font-weight: bold;');
            console.log(`总计耗时: ${((endTime - startTime) / 1000).toFixed(2)} 秒`);
        }
    }

    requestIdleCallback(doWork);
}


k.SPRINT_MAX_SPEED = 1000;


/** --------------------------------------------------------------------- */
/**
 * 放置触发器
 * 每次调用认领一个天际线槽位，闭包持有 skySlot
 */
function tri(zDis = 60, xDis = 0) {

    // 认领天际线槽位（真实位置写入，初始可见）
    const skySlot = SkylineSystem.claim(xDis, zDis);

    const triggerState = {
        inGemZone:   false,
        inBoardZone: false,
        inHutZone:   false
    };
    let mvppos = -1;
    let requestStateUpdate, runBusinessLogic;
    let runGemfunc, runHutfunc, runBoardfunc, runSkylinefunc;

    // 四个激活函数
    if (1) {
        let x, m, m2, l;  // 不再需要 ll 天际线了，天际线由 SkylineSystem 管理

        runGemfunc = () => {
            if (!x)  x  = k.dataProc.process(x_m,  { x: xDis, z: zDis }, dls, 'gem');
            if (!m)  m  = k.dataProc.process(m_m,  { x: xDis, z: zDis }, dls, 'board',  2);
            if (!m2) m2 = k.dataProc.process(m2_m, { x: xDis, z: zDis }, dls, 'board2', 2);
            if (l)  { k.deleteModBlock(l);  l  = null; }
            SkylineSystem.hide(skySlot);  // 进入近景，隐藏天际线
        };

        runBoardfunc = () => {
            if (!m)  m  = k.dataProc.process(m_m,  { x: xDis, z: zDis }, dls, 'board',  2);
            if (!m2) m2 = k.dataProc.process(m2_m, { x: xDis, z: zDis }, dls, 'board2', 2);
            if (x)  { k.deleteModBlock(x);  x  = null; }
            if (l)  { k.deleteModBlock(l);  l  = null; }
            SkylineSystem.hide(skySlot);  // 进入中景，隐藏天际线
        };

        runHutfunc = () => {
            if (!l) l = k.dataProc.process(l_m, { x: xDis, z: zDis }, dls, 'hut', 2);
            if (x)  { k.deleteModBlock(x);  x  = null; }
            if (m)  { k.deleteModBlock(m);  m  = null; }
            if (m2) { k.deleteModBlock(m2); m2 = null; }
            SkylineSystem.hide(skySlot);  // 进入小屋级别，隐藏天际线
        };

        runSkylinefunc = () => {
            // 万数块那边全部清掉
            if (x)  { k.deleteModBlock(x);  x  = null; }
            if (m)  { k.deleteModBlock(m);  m  = null; }
            if (m2) { k.deleteModBlock(m2); m2 = null; }
            if (l)  { k.deleteModBlock(l);  l  = null; }
            SkylineSystem.show(skySlot);  // 离得远了，显示天际线
        };
    }

    // 计算当前状态（防抖）
    if (1) {
        let stateDebounceTimer = null;  // 防抖计时器变量（解决那个莫名其妙的 bug）
        requestStateUpdate = () => {
            if (stateDebounceTimer) clearTimeout(stateDebounceTimer);  // 如果 xx 毫秒内，有新的函数被激活，则消除旧的，留下最新的
            stateDebounceTimer = setTimeout(() => {
                evaluateFinalState();
                stateDebounceTimer = null;
            }, 15);  // 15ms 是一个比较安全的值，在 20 性能下，最久冲突为 13ms
        };

        const evaluateFinalState = () => {
            let targetState = 4;
            if      (triggerState.inGemZone)   targetState = 1;
            else if (triggerState.inBoardZone) targetState = 2;
            else if (triggerState.inHutZone)   targetState = 3;
            else                               targetState = 4;

            if (mvppos !== targetState) {  // 如果最终状态等于当前状态，忽略
                mvppos = targetState;
                runBusinessLogic(targetState);  // 判断完毕，执行最终函数
            }
        };
    }

    // 执行，按照不同的状态，执行不同的函数
    if (1) {
        runBusinessLogic = (state) => {
            switch (state) {
                case 1: runGemfunc();      break;
                case 2: runBoardfunc();    break;
                case 3: runHutfunc();      break;
                case 4: runSkylinefunc();  break;
            }
        };
    }

    // 放置三个触发器定位块
    if (1) {
        triggers.forEach(conf => {
            triggersPosData[0].dz = conf.dz;
            triggersPosData[0].st = 1;
            const idx  = k.dataProc.process(triggersPosData, { x: xDis, z: zDis - 60 }, dls, 'setTriModel', 3, true);
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

// ======================== 垃圾区 ===================================

}
