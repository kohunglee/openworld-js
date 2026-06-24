# 信息板编辑系统 (signboard_lab)

## 项目概述

在三维世界中编辑信息板/画板内容的插件系统。点击画板 → 弹出 HUD 编辑窗口 → 编辑文字/图片 → 默认实时提交到服务器并立即刷新画布；用户手动开启离线模式后，保存才会进入浏览器 IndexedDB 队列；HotInfo 可手动刷新当前画板，Tab 面板与浮动按钮可手动同步离线编辑。

## 目录结构

```
signboard_lab/
├── signTest.js       # 入口文件，Hook 注册，热点事件处理，图片模式处理
├── signPanel.js      # 编辑面板 UI（可拖动 HUD 窗口，text/image 模式）
├── config.js         # 主题/常量配置，API_BASE
├── store.js          # 数据存储（signContentMap, signIndexMap, API 加载）
├── renderer.js       # 渲染器（文本自动换行 + Canvas 绘制）
├── hotUpdate.js      # 本地刷新入口（updateSign）
├── offlineQueue.js   # IndexedDB 离线编辑队列 + bulk-upsert 手动同步
├── server/
│   ├── server.js     # API 服务器入口 (Node.js + SQLite, port 8899)
│   ├── db/index.js   # SQLite 数据库（boards 表）
│   ├── api/signs.js  # Signs API：GET/POST 全量 + PATCH 单条更新
│   ├── helpers.js    # 共享工具（sendJson / readBody）
│   ├── admin.html    # 网页版信息板批量编辑器
│   └── js/main.js    # admin.html 的 JS
```

## 当前进度

### 已完成
1. ✅ signPanel.js - 500×400 可拖动 HUD 面板，白色 75% 透明背景
2. ✅ 文字编辑模式 - textarea 编辑，Ctrl/Cmd+S 或按钮保存
3. ✅ 图片编辑模式 - URL 输入框 + 实时预览
4. ✅ 模式切换 - 文字/图片 按钮切换，自动检测已有模式
5. ✅ 保存流程 - IndexedDB 离线队列 → 客户端本地 updateSign → 3D 画布立即刷新
6. ✅ 新板子支持 - 数据库里没有的板子，编辑保存后也能实时更新
7. ✅ 文本换行 - textarea 中的 `\n` 正确渲染为画布换行
8. ✅ 保存后自动关闭面板
9. ✅ 服务器连不通时 alert 提示，内容不丢失
10. ✅ FOV 滑杆 - 在 Tab 面板中可调节 FOV（1-120°，默认70°，可还原）
11. ✅ 服务器离线提示 - 懒加载失败后暂停自动重试，Tab 侧栏显示状态，可手动重试连接
12. ✅ 离线保存队列 - 本机浏览器编辑过的画板写入 IndexedDB，同一 id 只保留最后一次编辑，Tab 面板支持新旧两种手动同步
13. ✅ SVG 图片兜底 - 优先把 SVG 转成白底位图贴图；浏览器跨域抓不到时回退服务端代理

### 关键架构决策

**API 设计**：
- `PATCH /api/signs/:id` - 单条更新（signPanel 用，5亿条数据也扛得住）
- `POST /api/signs/bulk-upsert` - 离线队列批量 upsert，同步时每批最多 50 条
- `PATCH /api/signs/:id` - 旧服务器兼容同步路径，离线队列可按 500ms 一条逐个补发
- `POST /api/signs` - 批量替换（admin.html 用）
- `POST /api/signs/batch` - 批量获取，懒加载与 HotInfo 当前画板手动刷新共用

**signContentMap 存储策略（image 模式）**：
- 同时存储到 `boardId`（面板读取）和 `boardId + random`（errorTexture_diy hook 查找）
- `random` 后缀用于触发图片纹理重新进入当前 hook 刷新链路
- text 模式只用 `boardId`

**刷新策略**：
- 默认在线模式下，signPanel 保存直接调用旧服务器 `PATCH /api/signs/:id`，成功后再调用 `window.updateSign(boardId, content, mode, extra)`
- 用户手动开启离线模式后，signPanel 才会先写 `offlineQueue.js` 的当前服务器分区 IndexedDB 队列，再直接调用 `window.updateSign(boardId, content, mode, extra)`，不等待服务器
- HotInfo 的“更新”按钮只请求当前热点对应的 boardId，并在内容变化时调用 `updateSign`
- 后续若做可见画板低频刷新，优先复用 `POST /api/signs/batch`，不要恢复全局长连接

**SVG 图片策略**：
- 前端检测到 `.svg` 后，不再直接把外链 SVG URL 交给 WebGL
- 而是优先抓取 SVG 文本，补白底与默认文字色，再转成位图 data URL 贴图
- 浏览器若因 CORS 读不到外链 SVG，则回退到 `GET /api/signs/image-proxy?url=...` 由服务端代抓
- 这样可以显著减少“透明 SVG + 深色场景 + WebGL 纹理链路”带来的黑块/黑贴图观感

**离线同步策略**：
- `offlineQueue.js` 使用 IndexedDB 数据库 `owz_signboard_offline`，对象仓库 `pending_boards`
- 离线队列按“完整服务器 URL（忽略末尾 `/`）+ boardId”隔离；A 服务器的草稿不会在 B 服务器下显示、统计、同步或清空
- 只保存“本机当前浏览器编辑过”的画板，不缓存懒加载读到的服务器内容
- 同一个 boardId 使用 `put()` 覆盖，队列里只保留最后一次编辑
- Tab 插件的 `offlineSync.js` 提供独立的 `Signboard Offline Sync` 区域，可刷新队列、同步、输出控制台、清空本地队列
- `tab` 里提供“离线模式”开关；仅在离线模式下，`someCtrl` 左侧显示 `[同步(n)]` 按钮，并默认走旧服务器逐条同步
- 同步调用 `POST /api/signs/bulk-upsert`，每批最多 50 条；HTTP 207 时只删除成功项，失败项留在 IndexedDB 里继续重试
- 旧服务器兼容模式调用 `PATCH /api/signs/:id`，按 `500ms` 一条逐个发送；每条成功后立刻从 IndexedDB 删除，失败项保留

**服务器离线策略**：
- `store.js` 的懒加载批量请求失败后，会把 ID 留在 `pendingIds`，暂停自动重试，避免 100ms 一次刷控制台
- 通过 `window.signboardServerStatus` 和 `signboard:server-status` 事件通知 Tab 侧栏
- Tab 侧栏的“重试连接”调用 `window.retrySignboardLazyLoad()`，恢复 pending 画板加载

## 核心数据流

```
用户编辑 → signPanel.save()
  → 若在线模式：PATCH /api/signs/:id
    → 成功后本地调用 updateSign()
  → 若离线模式：offlineQueue.saveOfflineBoardDraft()
    → IndexedDB put(serverUrl::id) 覆盖当前服务器下本机最后一次编辑
    → signPanel 保存成功后本地调用 updateSign()
  → signContentMap 更新
  → texture 缓存清除
  → W.plane() 触发重绘
  → errorTexture_diy hook → 渲染新内容

用户点击 Tab 的 Sync Offline Boards
  → offlineQueue.syncOfflineBoards()
  → POST /api/signs/bulk-upsert，每批最多 50 条
  → 成功项从 IndexedDB 删除，失败项保留

用户点击 Tab 的 Sync Legacy Server
  → offlineQueue.syncOfflineBoardsLegacy()
  → PATCH /api/signs/:id，按 500ms 一条逐个发送
  → 每条成功后立刻从 IndexedDB 删除，失败项保留
```

## 数据结构

```js
signContentMap.set(id, {
    mode: 'text' | 'image' | 'empty' | 'pending',
    t: '文本内容',           // 文本模式
    imgUrl: '图片URL',       // 图片模式
    fromServer: boolean      // 是否来自服务器确认
});

signIndexMap.set(id, { index });  // id → 物体 index
```

## Mode 隐藏逻辑（2026-04-11 优化）

**引擎模式说明**：
- `ccgxkObj.mode === 1`：预览模式（浏览者视角），`[打开全文]` 与 `[查看原图]` 共用同一个内容模态框，且都可在模态框中点击“编辑”直接唤起编辑面板
- `ccgxkObj.mode === 2`：编辑模式（编辑者视角）

**隐藏规则**：
| 画板状态 | mode=1（只看） | mode=2（编辑） |
|---------|---------------|---------------|
| 有 text 内容 | 显示 | 显示 |
| 有 image 内容 | 显示 | 显示 |
| empty（服务器确认无数据） | **隐藏** | 显示 ID |
| empty（非服务器确认） | 显示 | 显示 |
| pending（懒加载中） | 隐藏 | 显示 "[懒]" |

**性能优化**：
- 隐藏的画板**跳过所有渲染流程**，不加载图片资源
- `updateSign` 中检测 `shouldBeHidden`，直接 return 跳过纹理设置

**核心技术点**：
1. `fromServer` 标志：标记数据是否来自服务器确认，决定 empty 状态是否应该隐藏
2. `computeShouldBeHidden()`：动态计算隐藏状态，响应 mode 切换
3. LOD 兼容：每次 hook 都重新设置 `hidden` 和 `isInvisible`，确保 LOD 重载后状态正确

## 注意事项

1. image 模式当前仍依赖 `random` 后缀触发重载链路，不能直接改成稳定 key
2. signContentMap 的 key 必须考虑面板读取和 hook 查找两个场景
3. 鼠标锁定交互必须正确：显示面板 unlockPointer + drawPointPause=true，关闭反之
4. 本项目由 `build_lab` 引入，测试需在完整环境中运行
5. 服务器端口 8899，API_BASE 在 config.js 中配置
6. 如果有需要更新的，或修改的，请及时更新这个 claude.md ，也就是本文件！！！（重中之重）

---

最后更新：2026-05-17


-----

# 更新日志

2026年04月10日

**新增 Mode 隐藏逻辑**：
- mode=1（只看模式）：服务器无数据的画板自动隐藏
- mode=2（编辑模式）：所有画板正常显示，方便编辑
- 核心：`fromServer` 标志 + `computeShouldBeHidden()` 动态计算

------

2026年05月16日

**新增 IndexedDB 离线保存与手动批量同步**：
- signPanel 保存不再等待单条 PATCH，请求慢时也能立即关闭面板并刷新当前画板
- 新增 `offlineQueue.js`，本机编辑写入 IndexedDB，同一画板只保留最后一次编辑
- Tab 新增独立 `Signboard Offline Sync` 区域，支持查看 pending 数量、ID 预览、最近同步结果、同步、刷新、控制台 dump、清空本地队列
- 同步使用后端 `POST /api/signs/bulk-upsert`，每批最多 50 条；部分成功时只移除成功项

------

2026年05月17日

**新增旧服务器兼容逐条同步**：
- Tab 面板新增 `Sync Legacy Server` 按钮
- 离线队列支持走旧接口 `PATCH /api/signs/:id`
- 为了兼容慢服务器和旧接口负载，每条请求之间固定等待 500ms
- legacy 模式默认不带 `credentials`，避免 `127.0.0.1:8089 -> 127.0.0.1:8899` 时被旧服务的 CORS 配置拦截
- 逐条同步时只删除成功项，失败项继续保留在 IndexedDB，便于反复重试

------

2026年05月17日

**修复刷新后本地离线稿“数据库还在但画板不显示”**：
- 页面初始化时自动读取 IndexedDB 待同步草稿
- 先把草稿灌回 `signContentMap`
- 当前已经注册到场景里的板子，会立即调用 `updateSign()` 重刷
- 这样刷新页面后，本地未同步内容不会再被服务器旧内容视觉上覆盖

------

2026年05月03日

**信息板服务器离线提示**：
- store 懒加载失败后暂停自动重试，避免服务器关闭时控制台刷屏
- Tab 服务器设置区新增状态文本与“重试连接”按钮
- 离线状态只放在 Tab 侧栏的服务器设置区，不占用主视图

------

2026年05月03日

**移除 SSE 长连接刷新**：
- 客户端删除 `EventSource /api/signs/stream` 初始化，保留 `window.updateSign` 作为唯一渲染刷新原语
- signPanel 保存成功后直接本地刷新，不再等待服务端广播
- HotInfo 增加“更新”按钮，只刷新当前热点画板
- 服务端删除 `/api/signs/stream` 路由和 `server/sse.js`

------

2026年05月03日

**彻底清理 Canvas 函数库残留**：
- admin.html 移除 Canvas 函数库 Tab、代码编辑器、预览区、新增函数弹窗
- server/js/main.js 移除 `/api/canvas-lib`、`new Function` 预览、函数新增/保存/删除逻辑
- server/db/index.js 移除 `canvas_functions` 历史表删除迁移代码
- 当前信息板只保留 text/image 两种已闭环模式

------

2026年04月04日

我的 server 服务器已经部署到云上了，修改会很棘手。若非非常必要，千万不要修改 /open-world-zone/plugins/signboard_lab/server 里面的内容！！ 且一点要提出申请。

------
