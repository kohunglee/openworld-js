/**
 * 信息板测试模块 - 入口
 *
 * 文件结构：
 *   config.js           - 主题/常量配置
 *   store.js            - 数据存储（API 加载 + 画板内容缓存）
 *   renderer.js         - 渲染器（智能文本绘制）
 *   hotUpdate.js        - 本地刷新入口（updateSign）
 *   signTest.js         - 入口（Hook 注册 + 编排）
 *   signPanel.js        - 编辑面板（可拖动 HUD 窗口）
 *   handlers/
 *   imageHandler.js     - 图片模式处理
 */

import { signContentMap, signIndexMap, lazyLoadSign, setCcgxkObj, setTextureModule } from './store.js';
import { drawSmartText } from './renderer.js';
import './hotUpdate.js';
import { handleImageMode } from './handlers/imageHandler.js';
import signPanel from './signPanel/signTest.js';
import { initHotInfo } from './hotinfo/hotinfo.js';
import { hydrateOfflineBoardsIntoMemory } from './offlineQueue.js';
import { hydrateOfflineSaveModeSnapshot, isOfflineSaveModeEnabled } from './saveMode.js';

/**
 * 设置信息板系统
 */
const setSignBoard = (instData, ccgxkObj, offsetValue = {x:0}, wskType = 2) => {
    ccgxkObj.errExpRatio = 100;  // 图片的质量（以100为基准）

    // 挂载纹理 HOOK
    ccgxkObj.hooks.on('errorTexture_diy', function(ctx, width, height, drawItem, _this) {
        const { index, id } = drawItem;
        setCcgxkObj(ccgxkObj); //+3 供热更新模块使用
        setTextureModule(_this);
        signIndexMap.set(id, { index });
        const info = signContentMap.get(id);
        if (info) {  // 引擎里已经有数据
            const { mode } = info;
            if (mode === 'text') {
                drawSmartText(ctx, width, height, info.t, id);
            } else if (mode === 'image') {
                handleImageMode(index, id, info.imgUrl, ccgxkObj);
            } else if (mode === 'empty') {
                drawSmartText(ctx, width, height, id, id);
            }
            ccgxkObj.W.next['T' + index].hidden = false;
            _this.indexToArgs.get(index).isInvisible = false;
        } else {  // 还没数据，懒加载，去服务器那里获取
            lazyLoadSign(id);
            drawSmartText(ctx, width, height, 'Loading...', id);
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
};

// 入口
export default function(ccgxkObj) {
    ccgxkObj.signTest = setSignBoard;  // 设置画板的业务逻辑
    hydrateOfflineSaveModeSnapshot();

    // 只有用户明确开启离线模式时，才把本地待同步草稿灌回场景。
    // 在线模式默认完全以服务器为准，避免历史离线草稿干扰当前在线视图。
    if (isOfflineSaveModeEnabled()) {
        hydrateOfflineBoardsIntoMemory().catch(error => {
            console.error('[signboard offline] hydrate failed:', error);
        });
    }

    signPanel(ccgxkObj); // 初始化编辑面板
    initHotInfo(ccgxkObj); // 初始化热点信息显示（mode=1 时）
    ccgxkObj.hooks.on('hot_action', function(ccgxkObj, e){ // 热点事件
        if(ccgxkObj.mode !== 2){return 0}
        const hotIndex = ccgxkObj.hotPoint;
        const hasRegisteredBoard = Array.from(signIndexMap.values()).some(item => item.index === hotIndex);
        if (!hasRegisteredBoard) return 0;  // 未注册画板不弹编辑器，避免出现空 panel
        ccgxkObj.signPanel.show(hotIndex);  // 显示编辑面板
    });
}
