"use strict";

import hooks from './common/hooks.js';
import tool from './utils/tool.js';
import wjs from './wjs/w_ins_lab.js';
import main from './core/main.js';
import texture from './obj/texture.js';
import control from './player/control.js';
import chunkManager from './obj/chunkManager.js';
import addobj from './obj/addobj.js';
import animate from './core/animate.js';

// 插件
import wjsShadow from './plugins/webgl/wjsShadow.js';
import centerDot from './plugins/centerDot.js';
import dynamicIns from './plugins/webgl/wjsDynamicIns.js';


// 主对象
const ccgxk = {
    hooks : hooks,        // JS 钩子，用于扩展
    W     : wjs,          // 三维模型 WebGL 渲染引擎
    ...tool,         // 工具函数
    ...main,         // 全局的配置、变量、初始化等
    ...texture,      // 纹理相关
    ...control,      // 第一视角的实现
    ...chunkManager, // 动态区块管理
    ...addobj,       // 添加新物体
    ...animate,      // 动画进程相关
}

// 启用插件
// wjsShadow(ccgxk);  // 开启阴影（暂时有性能问题，待改进）
// centerDot(ccgxk);  // 开启中心点取物
dynamicIns(ccgxk);  // 开启实例化的动态操作

        // 导入插件模块
import xmap from './plugins/xmap.js';
import cookieSavePos from './plugins/cookieSavePos.js';
import svgTextureLib from './plugins/svgTextureLib.js';
import xdashpanel from './plugins/xdashpanel.js';
import commModel from './plugins/webgl/commModel.js';
// import centerDot from './plugins/centerDot.js';
xmap(ccgxk);            // 小地图
cookieSavePos(ccgxk);   // 保存当前位置
svgTextureLib(ccgxk);   // 纹理预设库
xdashpanel(ccgxk);      // 仪表盘
commModel(ccgxk);       // 基础模型库
centerDot(ccgxk);       // 开启中心点取物



// 兼容浏览器平台
window.ccgxk = ccgxk;

// 导出
export default ccgxk;