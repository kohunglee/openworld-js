// WebGL框架 - 主入口文件

// 先不使用这个。

// ===============
import initWCore from './w-core.js';
import initWUtils from './w-utils.js';
import initWState from './w-state.js';
import initWRender from './w-render.js';
import initWModels from './w-models.js';

// 创建主 W 对象
const W = {};

// 按正确顺序初始化各模块（注意依赖关系）
initWCore(W);      // 核心：容器、hooks、reset
initWUtils(W);     // 工具：lerp, animation, col, add 等
initWState(W);     // 状态管理：setState
initWRender(W);    // 渲染：draw, render
initWModels(W);    // 模型：smooth 函数 + 内置模型

export default W;
