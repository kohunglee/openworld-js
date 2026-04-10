/**
 * 信息板测试模块 - 入口
 *
 * 文件结构：
 *   config.js           - 主题/常量配置
 *   store.js            - 数据存储（API 加载 + Canvas 函数编译）
 *   renderer.js         - 渲染器（文本、Canvas）
 *   hotUpdate.js        - 热更新（updateSign + SSE）
 *   signTest.js         - 入口（Hook 注册 + 编排）
 *   signPanel.js        - 编辑面板（可拖动 HUD 窗口）
 *   handlers/
 *     imageHandler.js     - 图片模式处理
 */

import { signContentMap, signIndexMap, lazyLoadSign, setCcgxkObj, setTextureModule, setSignContent, computeShouldBeHidden } from './store.js';
import { drawSmartText } from './renderer.js';
import { initSSE } from './hotUpdate.js';
import { handleImageMode } from './handlers/imageHandler.js';
import signPanel from './signPanel/signTest.js';
import { initHotInfo } from './hotinfo/hotinfo.js';

/**
 * 设置画板的隐藏状态（统一入口，确保 LOD 后状态正确）
 */
const setHiddenState = (ccgxkObj, _this, index, hidden) => {
    ccgxkObj.W.next['T' + index].hidden = hidden;
    _this.indexToArgs.get(index).isInvisible = hidden;
};

/**
 * 设置信息板系统
 */
const setSignBoard = (instData, ccgxkObj, offsetValue = {x:0}, wskType = 2) => {
    ccgxkObj.errExpRatio = 200;  // 图片的质量（以100为基准）

    // 挂载纹理 HOOK
    ccgxkObj.hooks.on('errorTexture_diy', function(ctx, width, height, drawItem, _this) {
        const { index, id } = drawItem;
        setCcgxkObj(ccgxkObj); //+3 供热更新模块使用
        setTextureModule(_this);
        signIndexMap.set(id, { index });

        const info = signContentMap.get(id);
        const ccgxkMode = ccgxkObj.mode;  // 1=只看模式, 2=编辑模式

        if (info && info.mode !== 'pending') {
            // 有确定的数据，动态计算是否应该隐藏
            const shouldBeHidden = computeShouldBeHidden(info, ccgxkMode);

            if (shouldBeHidden) {
                // 应该隐藏（mode=1 且服务器确认无数据）
                setHiddenState(ccgxkObj, _this, index, true);
            } else {
                // 应该显示
                setHiddenState(ccgxkObj, _this, index, false);
                if (info.mode === 'text') {
                    drawSmartText(ctx, width, height, info.t);
                } else if (info.mode === 'image') {
                    drawSmartText(ctx, width, height, 'Loading...');
                    handleImageMode(index, id, info.imgUrl, ccgxkObj);
                } else if (info.mode === 'empty') {
                    // mode=2 时显示 ID，方便用户编辑
                    drawSmartText(ctx, width, height, id);
                }
            }
        } else {
            // 还没数据或正在加载，触发懒加载
            if (!info) {
                // 设置 pending 状态，防止重复请求
                setSignContent(id, 'pending', '', {}, false);
            }
            lazyLoadSign(id);
            // 懒加载期间，mode=1 时先隐藏，mode=2 时显示加载提示
            // 使用 == 兼容字符串 '1' 和数字 1
            if (ccgxkMode == 1) {
                setHiddenState(ccgxkObj, _this, index, true);
            } else {
                setHiddenState(ccgxkObj, _this, index, false);
                drawSmartText(ctx, width, height, id + '[懒]');
            }
        }
    });

    ccgxkObj.dataProc.process({
        data: instData,
        name: 'build_lab_signBoard',
        type: wskType,  // 默认为 2
        model: 'plane',
        mixValue: 0.8,
        invisible: false,
        noIns: true,
        offset: offsetValue,
    });

    initSSE();
};

// 入口
export default function(ccgxkObj) {
    ccgxkObj.signTest = setSignBoard;  // 设置画板的业务逻辑
    signPanel(ccgxkObj); // 初始化编辑面板
    initHotInfo(ccgxkObj); // 初始化热点信息显示（mode=1 时）
    ccgxkObj.hooks.on('hot_action', function(ccgxkObj, e){ // 热点事件
        if(ccgxkObj.mode !== 2){return 0}
        const hotIndex = ccgxkObj.hotPoint;
        ccgxkObj.signPanel.show(hotIndex);  // 显示编辑面板
    });
}
