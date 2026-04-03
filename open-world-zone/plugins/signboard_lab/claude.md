# 信息板编辑系统 (signboard_lab)

## 项目概述

这是一个用于在三维世界中编辑信息板/画板内容的插件系统。目标是实现：点击三维空间中的画板，弹出可拖动的 HUD 编辑窗口，实时修改文字内容、切换模式（文本/自定义Canvas/图片），并保存到数据库。

## 目录结构

```
signboard_lab/
├── signTest.js       # 入口文件，Hook 注册，热点事件处理
├── signPanel.js      # 编辑面板 UI（可拖动 HUD 窗口）★ 新创建
├── config.js         # 主题/常量配置
├── store.js          # 数据存储（API 加载 + Canvas 函数编译）
├── renderer.js       # 渲染器（文本、Canvas 绘制）
├── hotUpdate.js      # 热更新（updateSign + SSE）
├── server/           # 辅助服务器（已有 admin.html 编辑器）
│   ├── admin.html    # 网页版编辑器（旧版）
│   ├── api/          # API 接口
│   └── sse.js        # SSE 实时推送
```

## 关键依赖

### 中心点插件 (centerDot_clean.js)
位置：`/Users/kehongli/studio/openworld-js/plugins/centerDot_clean.js`

功能：
- 在屏幕中心显示双圈光标，用于拾取三维物体
- 通过颜色编码识别物体 index
- 提供 `hot_action` 钩子事件，点击热点时触发

使用方式：
```js
ccgxkObj.hooks.on('hot_action', function(ccgxkObj, e){
    // 热点被点击时的处理
});
```

### 建造师插件参考
位置：`/Users/kehongli/studio/openworld-js/plugins/centerDot/build/`

重要文件：
- `init.js` - 入口，展示如何初始化面板
- `event.js` - 鼠标锁定/解锁逻辑 (`unlockPointer`, `lockPointer`)
- `panel/pEvent.js` - `quitPanel` 退出面板逻辑

关键交互模式：
```js
// 显示面板：解锁鼠标 + 暂停绘制
unlockPointer();
ccgxkObj.drawPointPause = true;

// 关闭面板：恢复绘制 + 锁定鼠标
ccgxkObj.drawPointPause = false;
lockPointer();
```

## 当前进度

### 已完成
1. ✅ 创建 `signPanel.js` - 可拖动的白色 HUD 窗口
2. ✅ 添加关闭按钮（右上角 ×）
3. ✅ 实现拖动功能（拖动标题栏移动）
4. ✅ 添加鼠标锁定/解锁交互逻辑
5. ✅ 修改 `signTest.js` 导入并使用 signPanel

### 当前状态
点击热点画板 → 弹出编辑面板 → 可拖动 → 可关闭 → 自动恢复鼠标锁定

面板目前是一个白板，显示热点 index，尚未添加编辑功能。

## 下一步计划

### 阶段二：添加编辑功能
1. 在面板中添加文本输入框
2. 实现文本实时更新到画板纹理
3. 添加保存按钮，保存到数据库

### 阶段三：模式切换
1. 添加三个模式切换按钮：文本模式 / Canvas模式 / 图片模式
2. 文本模式：显示文本输入框
3. Canvas模式：显示 Canvas 函数选择器
4. 图片模式：显示图片 URL 输入框

### 阶段四：数据持久化
1. 连接现有 API (`server/api/signs.js`)
2. 实现保存/加载功能

## 核心代码片段

### signPanel.js 结构
```js
export default function(ccgxkObj) {
    const g = {
        htmlCode: `...`,        // 面板 HTML + CSS
        initHTML() {},          // 初始化到页面
        bindEvents() {},        // 绑定关闭按钮等
        initDrag() {},          // 拖动功能
        unlockPointer() {},     // 解锁鼠标
        lockPointer() {},       // 锁定鼠标
        showPanel(hotIndex) {}, // 显示面板（解锁+暂停绘制）
        hidePanel() {},         // 隐藏面板（恢复+锁定）
    };

    ccgxkObj.signPanel = {
        show: g.showPanel,
        hide: g.hidePanel,
        toggle: g.togglePanel,
        init: g.initHTML
    };
}
```

### signTest.js 入口
```js
import signPanel from './signPanel.js';

export default function(ccgxkObj) {
    ccgxkObj.signTest = setSignBoard;
    signPanel(ccgxkObj);  // 初始化面板

    ccgxkObj.hooks.on('hot_action', function(ccgxkObj, e){
        const hotIndex = ccgxkObj.hotPoint;
        ccgxkObj.signPanel.show(hotIndex);  // 显示编辑面板
    });
}
```

## 数据结构

画板数据存储在 `signContentMap` (Map 类型)：
```js
signContentMap.set(id, {
    mode: 'text' | 'canvas' | 'image',
    t: '文本内容',           // 文本模式
    drawName: '函数名',      // Canvas模式
    imgUrl: '图片URL'        // 图片模式
});
```

索引映射 `signIndexMap`：
```js
signIndexMap.set(id, { index });  // id → 物体 index
```

## 注意事项

1. 修改文件后需要测试热点点击流程
2. 面板样式参考 `kit.js` 的模态框风格
3. 鼠标锁定交互必须正确，否则用户无法正常操作
4. 本项目由 `build_lab` 引入，测试需在完整环境中运行

---

最后更新：2026-04-03