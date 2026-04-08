# 信息板编辑系统 (signboard_lab)

## 项目概述

在三维世界中编辑信息板/画板内容的插件系统。点击画板 → 弹出 HUD 编辑窗口 → 编辑文字/图片 → SSE 实时刷新画布。

## 目录结构

```
signboard_lab/
├── signTest.js       # 入口文件，Hook 注册，热点事件处理，图片模式处理
├── signPanel.js      # 编辑面板 UI（可拖动 HUD 窗口，text/image 模式）
├── config.js         # 主题/常量配置，API_BASE
├── store.js          # 数据存储（signContentMap, signIndexMap, API 加载）
├── renderer.js       # 渲染器（文本自动换行 + Canvas 绘制）
├── hotUpdate.js      # 热更新（updateSign + SSE 客户端）
├── server/
│   ├── server.js     # API 服务器入口 (Node.js + SQLite, port 8899)
│   ├── db/index.js   # SQLite 数据库（boards + canvas_functions 表）
│   ├── api/signs.js  # Signs API：GET/POST 全量 + PATCH 单条更新
│   ├── api/canvas.js # Canvas 函数库 API
│   ├── sse.js        # SSE 实时推送
│   ├── helpers.js    # 共享工具（sendJson / readBody）
│   ├── admin.html    # 网页版编辑器（旧版，批量编辑用）
│   └── js/main.js    # admin.html 的 JS
```

## 当前进度

### 已完成
1. ✅ signPanel.js - 500×400 可拖动 HUD 面板，白色 75% 透明背景
2. ✅ 文字编辑模式 - textarea 编辑，Ctrl/Cmd+S 或按钮保存
3. ✅ 图片编辑模式 - URL 输入框 + 实时预览
4. ✅ 模式切换 - 文字/图片 按钮切换，自动检测已有模式
5. ✅ 保存流程 - PATCH 单条更新 API → SSE 广播 → 3D 画布实时刷新
6. ✅ 新板子支持 - 数据库里没有的板子，编辑保存后也能实时更新
7. ✅ 文本换行 - textarea 中的 `\n` 正确渲染为画布换行
8. ✅ 保存后自动关闭面板
9. ✅ 服务器连不通时 alert 提示，内容不丢失
10. ✅ FOV 滑杆 - 在 Tab 面板中可调节 FOV（1-120°，默认70°，可还原）

### 关键架构决策

**API 设计**：
- `PATCH /api/signs/:id` - 单条更新（signPanel 用，5亿条数据也扛得住）
- `POST /api/signs` - 批量替换（admin.html 用）
- SSE 广播格式：`{ boards: [单条board] }`，只传变化的那条

**signContentMap 存储策略（image 模式）**：
- 同时存储到 `boardId`（面板读取）和 `boardId + random`（errorTexture_diy hook 查找）
- `random` 后缀用于对抗 Chrome 纹理缓存
- text/canvas 模式只用 `boardId`

**SSE 更新检测**：
- `cur` 为空（新板子）→ 直接调用 updateSign
- `cur` 存在 → 检查 mode/content 是否变化，变化才更新
- signPanel.save() 不碰 signContentMap，完全让 SSE 回环触发刷新

## 核心数据流

```
用户编辑 → signPanel.save()
  → PATCH /api/signs/:id (单条)
  → 服务器 upsertBoard() + SSE broadcast({boards:[单条]})
  → hotUpdate SSE handler → updateSign()
    → signContentMap 更新
    → texture 缓存清除
    → W.plane() 触发重绘
  → errorTexture_diy hook → 渲染新内容
```

## 数据结构

```js
signContentMap.set(id, {
    mode: 'text' | 'canvas' | 'image',
    t: '文本内容',           // 文本模式
    drawName: '函数名',      // Canvas模式
    imgUrl: '图片URL'        // 图片模式
});

signIndexMap.set(id, { index });  // id → 物体 index
```

## 注意事项

1. `random` 后缀是对抗 Chrome 纹理缓存的老办法，不要动它
2. signContentMap 的 key 必须考虑面板读取和 hook 查找两个场景
3. 鼠标锁定交互必须正确：显示面板 unlockPointer + drawPointPause=true，关闭反之
4. 本项目由 `build_lab` 引入，测试需在完整环境中运行
5. 服务器端口 8899，API_BASE 在 config.js 中配置
6. 如果有需要更新的，或修改的，请及时更新这个 claude.md ，也就是本文件！！！（重中之重）

---

最后更新：2026-04-03


-----

# 更新日志

2026年04月04日

我的 server 服务器已经部署到云上了，修改会很棘手。若非非常必要，千万不要修改 /open-world-zone/plugins/signboard_lab/server 里面的内容！！ 且一点要提出申请。

------