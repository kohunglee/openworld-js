# openworld-js / signboard_lab / 飞书 / SaaS 的 API 盘点与产品方向深思

生成时间：2026-05-02  
工作范围：`openworld-js` 本地源码、`open-world-zone/plugins/signboard_lab` 客户端、`open-world-zone/plugins/signboard_lab/server` 生产服务器代码、`1tool/feishu_test` 飞书读写 MVP、`z-nextjs/saas-start` SaaS 基础、以及你给的博客园文章。  
说明：本文没有启动任何占用端口的程序，只做源码级审计、SQLite 只读抽样和产品方案推演。这样符合你“端口程序由你自己运行”的规则。

## 0. 先给结论

现在真正已经形成服务器与客户端闭环的核心，是 `signboard_lab` 的 `boards` 信息板系统。它不是一个松散的 demo，而是已经有了完整生命线：

1. 3D 世界里的 plane 被建筑数据转成带 ID 的信息板。
2. 客户端通过纹理 hook 发现某块信息板需要内容。
3. 客户端把 ID 合并成批量请求，向 Node + SQLite 服务端取内容。
4. 用户在 3D 里点击信息板，弹出 HUD 面板编辑文字或图片 URL。
5. 面板通过 `PATCH /api/signs/:id` 保存单块信息板。
6. 服务端写 SQLite 后，通过 SSE 把变化推给所有客户端。
7. 客户端收到 SSE 后更新 `signContentMap`，清纹理缓存，强制引擎重新加载画板。
8. 热点信息侧栏和全文/原图模态框也会同步更新。

这条线最重要的价值不是“能保存一段文字”，而是它已经证明：你的 3D 世界可以把二维内容变成空间里的长期对象，并且对象具有远程持久化、局部更新、实时广播、图片展示、备注扩展、编辑/展示两种模式。换句话说，它已经是“3D Knowledge World OS”的最小神经系统。

现在三个目录的关系可以这样理解：

- `openworld-js/open-world-zone/plugins/signboard_lab`：3D 空间里的信息板运行时。它负责看见、懒加载、渲染、编辑、热更新。
- `openworld-js/open-world-zone/plugins/signboard_lab/server`：当前生产 API 服务。它负责 SQLite 持久化、CORS、SSE、单条更新、批量替换、批量读取。
- `1tool/feishu_test`：飞书文档读写桥。它不自己处理 token/OAuth，而是调用本地 `lark-cli`，已经具备“从飞书读内容”和“向飞书追加内容”的能力。
- `z-nextjs/saas-start`：商业化外壳。它已有登录、团队、活动日志、Stripe 订阅、仪表盘、博客、基础 API 和 Server Actions。

海外优先修正：后面的商业判断按“海外站优先”来做，不把国内市场当目标市场。`feishu_test` 在本文里主要代表“Lark/Feishu CLI 已跑通的内容源适配器原型”，真正面向海外用户时，应优先包装成 `Lark / Notion / Google Docs / Markdown / RSS / Readwise / Obsidian` 等 connector，而不是把产品定位成中文飞书生态工具。河南收入目标只作为你的个人生活成本锚点，不作为市场选择依据。

最好的连接方案不是把三者硬塞成一个巨型应用，而是分层：

- Lark/Notion/Google Docs/Markdown 等内容源做协作编辑和原始内容仓库。
- SaaS 做账号、订阅、项目管理、导入队列、发布权限、SEO 平面页。
- openworld-js 做可逛、可分享、可沉浸的空间展示层。
- signboard API 做“空间对象内容层”的同步协议。
- AI 做自动整理、自动选址、自动摘要、自动生成空间结构、自动把内容变成可卖的展馆。

你给的文章里反复强调一个判断：3D 不是替代主笔记系统，而是用 3D 包裹 2D 笔记，2D 负责检索和编辑，3D 负责让人愿意回来逛、愿意复习、愿意把内容当成自己的空间。这个判断与当前代码最匹配，尤其是 `signboard_lab` 已经把“墙上写字、贴照片”落到了可运行代码层。

## 1. 源码地图：现在项目正在形成什么东西

### 1.1 openworld-js 主体

`openworld-js` 是一个浏览器端自研 WebGL 开放世界引擎项目。`README.md` 里强调它是一个体积极小的 WebGL 库，用于直接在浏览器里构建交互式 3D 世界。当前项目通过 Vite 跑，`package.json` 的脚本是：

- `npm run dev`：`vite --host 0.0.0.0`
- `npm run build`：`vite build`
- `npm run preview`：`vite preview --host 0.0.0.0`

真正的演示入口在 `open-world-zone/main.js`。这个文件把引擎初始化起来，然后依次加载公共插件和私有插件：

- `xmap`：小地图。
- `cookieSavePos`：保存当前位置。
- `xdashpanel`：仪表盘。
- `sound`：声音。
- `centerDot_clean`：中心点取物/热点探测。
- `testSampleAni`：人物动画。
- `build`：建造器，只有 `mode === 0` 时加载。
- `dataProc`：万数块/百数块/单数块实例化数据处理系统。
- `mvp`：主角。
- `symoffset`：对称阵列工具。
- `signboard_lab`：当前重点，信息板系统。
- `build_lab`：建造器使用的容器。
- `xhall`：第一个成品建筑。
- `somecube`：实验块。
- `normalevent`：常用事件。
- `tab`：右上角侧边栏。

这个组合说明你现在不是只有引擎，而是已经有一个可进入的世界：有地面、主角、建筑、模式切换、中心点、移动端控制、FOV、自动裁剪、信息板、服务器地址设置。这些东西虽然还散，但已经接近“工具运行时”，不是单纯图形 demo。

### 1.2 dataProc 是底层容量系统

`open-world-zone/plugins/dataProc/dataProc.js` 里有一个很关键的设计：用万数块、百数块、单数块来管理大量实例。它把空间对象分成不同容量的块：

- Type 1：万数块，默认容量 10000。
- Type 2：百数块，默认步长 300。
- Type 3：单数块，步长 1。

这个系统的直觉很对。你做的是“空间里的大量对象”，不是传统 DOM 页面。每块对象既要渲染，又要有物理/热点档案，还要能被删除、隐藏、裁剪、绑定纹理。`dataProc.process()` 统一负责：

1. 分配空闲块索引。
2. 读取原始建筑数据。
3. 填充实例化容器。
4. 添加物理体和热点档案。
5. 需要时调用 `W.cube` 或 `W.plane` 做实例渲染。
6. 返回块头索引，供后续管理。

这对后面的商业化很重要，因为它意味着你的空间不是手摆几十个对象，而是有机会承载数千、数万、甚至更高数量的空间内容对象。

### 1.3 build_lab / xhall 如何产生信息板

`build_lab/full_state.js` 和 `xhall/full_state.js` 是信息板生成的关键。

在 `build_lab/full_state.js` 里，普通建筑数据会被加工成三类信息板：

- `house1H3-*`
- `board1h-*`
- `floorSign-*`

处理逻辑大致是：

1. 找到对应建筑索引。
2. 给对象设置 `dz`、`st` 等热点/物理参数。
3. 把纹理字段 `t` 设置为业务 ID，例如 `house1H3-1`。
4. 把这些对象复制进数组 `arrC`、`arrD`、`arr`。
5. 原位置标记删除。
6. 调用 `ccgxkObj.signTest(arrC, ccgxkObj, {x:0}, 1)` 交给 `signboard_lab`。

在 `xhall/full_state.js` 里也有同样思路，`INDICES.signBoard` 会被转成 `testSign1`、`testSign2` 这样的信息板 ID。

这里的关键不是命名，而是“建筑对象变内容对象”。这就是产品层的核心抽象：空间对象有一个稳定 ID，内容可以晚点加载、远程加载、实时更新。

### 1.4 signboard_lab 是“墙上写字、贴照片”的最小产品

`signboard_lab/signTest.js` 是入口。它做了三件主事：

1. 给引擎注册 `errorTexture_diy` hook：当某个纹理找不到时，接管纹理生成逻辑。
2. 通过 `dataProc.process()` 把信息板 plane 加入世界。
3. 初始化 SSE、编辑面板、热点信息面板，并把热点点击与编辑面板绑定起来。

这意味着你的信息板不需要提前把所有纹理做成图片文件。它可以在浏览器里动态生成：

- text 模式：用 Canvas 绘制文字，并自动换行、自动缩放、居中。
- image 模式：加载图片 URL，然后按图片比例重设 plane 宽高。
- empty 模式：可显示 ID 或做隐藏/占位。

这套方式很适合你的方向。因为 3D 世界里的信息本质仍是二维内容：文字、图片、网页卡片、视频封面、文档摘要。你真正需要的是“把二维内容挂到空间位置上”，不是把每段文字都变成复杂 3D 模型。

## 2. signboard_lab 服务器与客户端已经闭环的全部 API

下面是当前 `signboard_lab/server` 中服务器实际注册、客户端实际调用、并且能形成闭环的 API。这里按“能被生产系统信任的接口”来列。凡是客户端里有残留但服务器无路由的，我会单独放到“未闭环接口”里，不混在完成清单里。

### 2.1 服务基本信息

服务器入口：`open-world-zone/plugins/signboard_lab/server/server.js`  
数据库模块：`open-world-zone/plugins/signboard_lab/server/db/index.js`  
API 处理：`open-world-zone/plugins/signboard_lab/server/api/signs.js`  
SSE 处理：`open-world-zone/plugins/signboard_lab/server/sse.js`  
辅助函数：`open-world-zone/plugins/signboard_lab/server/helpers.js`  
默认端口：`8899`  
启动命令：`npm run start`，实际执行 `node server.js`  
依赖：`better-sqlite3`、`sql.js`，实际持久化使用 `better-sqlite3`。

`server.js` 明确写着这是纯 API 服务器，静态文件由主项目 HTTP 服务器提供。它监听 `0.0.0.0:8899`，启动时初始化 SQLite，并在退出时关闭 SSE 客户端、执行 WAL checkpoint、关闭数据库。

### 2.2 通用 CORS / OPTIONS 预检

接口：`OPTIONS *`

实现位置：`server.js` 的 `handlePreflight(req, res)`

响应状态：`204`

响应头：

```http
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, PATCH, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type
Access-Control-Max-Age: 86400
```

用途：

- 允许浏览器跨域调用 API。
- 支持 `PATCH`、`POST` 带 JSON body 的预检。
- `DELETE` 虽然在 CORS 中允许，但当前服务器没有实现对应业务路由。

这对当前架构很重要，因为 3D 客户端、管理页、生产 API 很可能不在同一端口。开发时主项目可能在 `8089` 或 Vite 端口，API 在 `8899`；生产时默认配置又可能指向远程 `https://selfdb.ccgxk.com`。

### 2.3 数据库表结构：boards

SQLite 文件：`open-world-zone/plugins/signboard_lab/server/db/signboard.db`

当前只读抽样显示，数据库里有 119 条 boards，其中：

- `text`：96 条
- `image`：23 条

表结构：

```sql
CREATE TABLE boards (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  mode TEXT NOT NULL DEFAULT 'text',
  content TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  extra TEXT DEFAULT '{}'
);
```

触发器：

```sql
CREATE TRIGGER boards_updated_at
AFTER UPDATE ON boards
BEGIN
  UPDATE boards SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;
```

字段含义：

- `id`：空间对象 ID，也是客户端纹理 ID，例如 `board1h-0`、`house1H3-1`。
- `name`：显示名；当前多数场景直接等于 `id`。
- `mode`：内容模式，目前闭环的是 `text` 与 `image`。客户端存在 `empty` 内存态；历史 `canvas` 函数库残留已在 2026-05-03 清除。
- `content`：正文或图片 URL。
- `extra`：JSON 字符串，当前已用的是 `remark`，用于保存“不显示在画板上的备注”。
- `created_at`：创建时间。
- `updated_at`：更新时间，靠触发器自动刷新。

数据库模块有几个重要函数：

- `initDatabase()`：打开 SQLite，启用 WAL，建表，迁移 `extra` 字段。
- `getAllBoards()`：按 `id` 排序返回全部。
- `getBoardsByIds(ids)`：按 ID 批量查询。
- `upsertBoard(board)`：单条插入或更新。
- `replaceAllBoards(boards)`：事务内全量删除再插入。
- `deleteBoard(id)`：删除单条，但当前 HTTP 路由没有暴露。
- `closeDatabase()`：checkpoint、关闭连接、清理 wal/shm 文件。

这里有一个很关键的事实：当前生产服务器只保留 `boards` 表与 signs API。历史 Canvas 函数库相关 UI、`/api/canvas-lib` 调用、`canvas_functions` 迁移残留已在 2026-05-03 清除，避免后续误判为半成品 API。

### 2.4 GET /api/signs

接口：`GET /api/signs`

服务器入口：

- `server.js` 路由到 `handleGetSigns(req, res)`
- 实现在 `server/api/signs.js`

客户端调用位置：

- `signboard_lab/hotinfo/hotinfo.js` 的 `loadBoardsData()`
- `signboard_lab/server/js/main.js` 的 `loadData()`，也就是管理页。

请求参数：无。

成功响应：

```json
{
  "version": 1,
  "boards": [
    {
      "id": "board1h-0",
      "name": "board1h-0",
      "mode": "text",
      "content": "文本或图片 URL",
      "extra": { "remark": "" },
      "updated_at": "2026-04-15 13:20:56"
    }
  ]
}
```

错误响应：

```json
{
  "error": "错误信息"
}
```

错误状态：`500`

实现细节：

- 服务端读取全部 boards。
- 对每条数据执行 `JSON.parse(b.extra)`，把数据库里的 JSON 字符串转成对象。
- 返回 `version: 1`，说明你已经预留协议版本概念。
- 响应由 `sendJson()` 写出，带 `Content-Type: application/json; charset=utf-8` 和 `Access-Control-Allow-Origin: *`。

当前用途：

1. 管理页全量编辑时先拉全量。
2. 热点信息面板初始化时拉一份轻量元数据，用于左侧信息、全文/原图弹窗、后续 SSE 局部修补。

这个接口是“平面管理”和“空间热点侧栏”的基础，但不是 3D 画板懒加载的主路径。3D 懒加载走的是 `POST /api/signs/batch`，这样才不会一次性把所有内容都拉下来。

### 2.5 POST /api/signs/batch

接口：`POST /api/signs/batch`

服务器入口：

- `server.js` 路由到 `handleGetSignsBatch(req, res)`
- 实现在 `server/api/signs.js`

客户端调用位置：

- `signboard_lab/store.js` 的 `doBatchFetch()`

请求头：

```http
Content-Type: application/json
```

请求体：

```json
{
  "ids": ["board1h-0", "house1H3-12", "floorSign-3"]
}
```

成功响应：

```json
{
  "boards": [
    {
      "id": "board1h-0",
      "name": "board1h-0",
      "mode": "text",
      "content": "内容",
      "extra": { "remark": "" },
      "updated_at": "2026-04-15 13:20:56"
    }
  ]
}
```

特殊情况：

- 如果 `ids` 不是数组，或者长度为 0，直接返回 `{ "boards": [] }`。
- 如果某些 ID 在数据库里不存在，响应里不会包含它们。客户端会把这些 ID 标成 `empty`，并可在编辑模式下显示 ID 方便补内容。

错误响应：

```json
{
  "error": "错误信息"
}
```

错误状态：`500`

客户端懒加载机制很重要：

- `signContentMap` 没有某个 ID 时，`lazyLoadSign(id)` 把 ID 加入 `pendingIds`。
- 100ms 内的多个 ID 会合并成一次 `POST /api/signs/batch`。
- 请求成功后，客户端逐条 `setSignContent()`，再调用 `window.updateSign()` 触发 3D 纹理刷新。
- 没查到的 ID 会被标记为空内容。
- 请求失败时，客户端把失败 ID 放回队列，下次重试。

这就是“可扩展到很多画板”的核心接口。它避免每个画板一个 HTTP 请求，也避免一进入世界就拉全量。你的空间对象数量会继续增加，这个接口比 `GET /api/signs` 更接近生产运行时主干。

### 2.6 POST /api/signs

接口：`POST /api/signs`

服务器入口：

- `server.js` 路由到 `handleSaveSigns(req, res)`
- 实现在 `server/api/signs.js`

客户端调用位置：

- `signboard_lab/server/js/main.js` 的 `saveData()`，也就是管理页批量保存。

请求头：

```http
Content-Type: application/json
```

请求体：

```json
{
  "version": 1,
  "boards": [
    {
      "id": "board1h-0",
      "name": "board1h-0",
      "mode": "text",
      "content": "新的内容",
      "extra": { "remark": "" }
    }
  ]
}
```

成功响应：

```json
{
  "success": true,
  "message": "保存成功",
  "changed": 3
}
```

错误响应：

```json
{
  "error": "错误信息"
}
```

错误状态：`500`

实现细节：

1. 服务端解析请求体。
2. 取 `data.boards || []`。
3. 读取旧数据，建立 `oldMap`。
4. 对比 `name`、`mode`、`content`、`extra`，找出变化的 boards。
5. 调用 `replaceAllBoards()`，事务内先删除全部，再插入新数组。
6. 返回保存成功和变化条数。
7. 如果有变化，只通过 SSE 广播变化的 boards，而不是广播全量。

这里有一个强烈的设计味道：批量接口不是为高频编辑设计的，而是给 admin 管理页做全量维护。它有破坏性，因为 `replaceAllBoards()` 会删除数据库里所有 boards 再重建。如果未来多人协作或云端正式商业化，这个接口应保留给管理员、导入器、迁移工具，普通用户编辑应该继续走 `PATCH /api/signs/:id`。

### 2.7 PATCH /api/signs/:id

接口：`PATCH /api/signs/:id`

示例：`PATCH /api/signs/board1h-0`

服务器入口：

- `server.js` 识别 `pathname.startsWith('/api/signs/')`
- 通过 `decodeURIComponent(pathname.slice('/api/signs/'.length))` 取 boardId
- 路由到 `handleUpdateOneBoard(req, res, boardId)`

客户端调用位置：

- `signboard_lab/signPanel/signTest.js` 的 `save()`

请求头：

```http
Content-Type: application/json
```

请求体：

```json
{
  "mode": "text",
  "content": "画板正文",
  "extra": {
    "remark": "不显示在画布上的备注"
  }
}
```

图片模式请求体：

```json
{
  "mode": "image",
  "content": "https://example.com/image.png",
  "extra": {
    "remark": "图片说明"
  }
}
```

成功响应：

```json
{
  "success": true,
  "message": "更新成功"
}
```

错误响应：

```json
{
  "error": "错误信息"
}
```

错误状态：`500`

服务端默认值：

- `name`: `data.name || id`
- `mode`: `data.mode || 'text'`
- `content`: `data.content || ''`
- `extra`: `data.extra || {}`

写入方式：

- 调用 `upsertBoard(board)`。
- 如果 ID 不存在，插入新行。
- 如果 ID 存在，更新 `name`、`mode`、`content`、`extra`。
- `updated_at` 由触发器刷新。

SSE 广播：

```json
{
  "boards": [
    {
      "id": "board1h-0",
      "name": "board1h-0",
      "mode": "text",
      "content": "画板正文",
      "extra": {
        "remark": "备注"
      }
    }
  ]
}
```

这个接口是当前最核心、最健康的写接口。它满足：

- 单条更新，不会误伤其他 boards。
- 新板子可以直接 upsert。
- 保存后通过 SSE 回环刷新本机客户端和其他客户端。
- 客户端保存成功后隐藏面板，但不直接改本地状态，而是等待 SSE 回来统一更新，减少“双写状态”带来的错乱。

这个设计经验很宝贵。以后无论你接飞书、Notion、Obsidian、本地文件、SaaS 后台，都应该优先落到“单个空间对象 upsert + 事件广播”的模型，而不是每次全量覆盖。

### 2.8 GET /api/signs/stream

接口：`GET /api/signs/stream`

类型：Server-Sent Events

服务器入口：

- `server.js` 路由到 `handleSseStream(req, res)`
- 实现在 `server/sse.js`

客户端调用位置：

- `signboard_lab/hotUpdate.js` 的 `initSSE()`

响应头：

```http
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive
Access-Control-Allow-Origin: *
```

连接建立后，服务器先写：

```text
: connected
```

每 15 秒心跳：

```text
: heartbeat
```

数据事件格式：

```text
data: {"boards":[{"id":"board1h-0","mode":"text","content":"...","extra":{"remark":""}}]}
```

客户端行为：

- `new EventSource(`${apiBase}/api/signs/stream`)`
- `onopen` 打日志。
- `onmessage` 解析 JSON。
- 如果收到 `data.boards`，逐条判断这块板是否已经注册到 `signIndexMap`。
- 如果当前本地内容没有变化，则跳过，避免重复重绘。
- 如果变化，调用 `window.updateSign(board.id, board.content, board.mode, board.extra || {})`。
- `onerror` 时关闭连接，3 秒后重连。
- 初始化失败时 5 秒后重试。

服务端行为：

- 用 `clients = new Set()` 管理所有响应对象。
- 每个客户端断开时从 Set 里删除。
- `broadcast(data)` 会把 JSON 序列化成 SSE 格式，发给所有客户端。
- 进程关闭时 `closeAllClients()` 会结束所有连接。

这个接口让你的系统从“保存后刷新页面”进化成“空间对象实时变化”。这在未来有几种直接价值：

- 管理后台改内容，3D 展厅自动更新。
- 飞书同步改内容，在线空间自动更新。
- 多人共同布展，一人保存，别人马上看到。
- AI 后台自动整理位置，3D 前端能逐步显示变化。

SSE 比 WebSocket 简单，当前场景也足够。你的主要事件是服务端向客户端广播，不是高频双向游戏状态同步。保留 SSE 是很务实的选择。

### 2.9 404 Not Found

所有未匹配路由都会返回：

```json
{
  "error": "Not Found"
}
```

状态：`404`

这也意味着：

- `DELETE /api/signs/:id` 没有暴露。

这些不能列入已完成 API。

## 3. signboard_lab 客户端内部 API 与运行协议

HTTP API 只是边界，客户端内部也有一套事实上的协议。它们不一定暴露给外部，但决定了系统如何运行。

### 3.1 getApiBase：服务器地址协议

文件：`signboard_lab/config.js`

关键常量：

```js
const STORAGE_KEY = 'signboard_server_address';
const DEFAULT_ADDRESS = '127.0.0.1:8899';
```

`getApiBase()` 逻辑：

- 如果 `localStorage` 有 `signboard_server_address`，直接返回这个值。
- 如果没有，返回 `http://127.0.0.1:8899`。

同时 `tab/serverConfig.js` 也使用同一个 `STORAGE_KEY`，但默认值是：

```js
const DEFAULT_ADDRESS = 'https://selfdb.ccgxk.com';
```

这形成一个隐藏规则：

- 如果用户没有保存过地址，`signboard_lab/config.js` 会默认本地 `http://127.0.0.1:8899`。
- 如果用户在侧边栏点了“默认”，会写入 `https://selfdb.ccgxk.com`。
- 如果用户手动输入 `127.0.0.1:8899` 且没有协议，`getApiBase()` 会原样返回，fetch/EventSource 可能失败。

建议以后把地址保存逻辑统一成“必须带协议”，保存时自动补 `http://` 或校验。这不是当前 API 闭环的阻断点，但会影响普通用户配置成功率。

### 3.2 signContentMap

文件：`signboard_lab/store.js`

用途：内存里的画板内容缓存。

实际形态：

```js
signContentMap.set(id, { mode: 'text', t: content, extra });
signContentMap.set(id, { mode: 'image', imgUrl: content, extra });
signContentMap.set(id, { mode: 'empty' });
```

它的职责：

- 判断某块画板是否已经加载内容。
- 给编辑面板回填文字、图片 URL、备注。
- 给渲染 hook 提供文本或图片 URL。
- 给 SSE 更新检测提供当前值。

这里没有直接持久化，本地刷新页面会重新向服务器加载。

### 3.3 signIndexMap

文件：`signboard_lab/store.js`

用途：把业务 ID 映射到引擎对象索引。

形态：

```js
signIndexMap.set(id, { index });
```

它在 `errorTexture_diy` hook 里建立。当某块 plane 进入纹理加载流程时，hook 能知道 `drawItem.index` 与 `drawItem.id`，于是把 ID 和物理/渲染索引绑定。

它的作用：

- `window.updateSign(boardId, ...)` 能找到该改哪个引擎对象。
- 编辑面板能从当前 `hotPoint` 反查 boardId。
- 热点信息面板能从 hotIndex 找 boardId。
- SSE 收到未进入视野、还没注册的 board 时可以跳过，等它未来进入 hook 后再懒加载。

### 3.4 window.updateSign

文件：`signboard_lab/hotUpdate.js`

这是当前客户端最核心的内部函数。它做的事很多：

1. 从 `signIndexMap` 找到 board 对应的引擎 index。
2. 更新 `signContentMap`。
3. 如果是图片模式，生成 random 后缀对抗浏览器纹理缓存。
4. 清理 `textureModule.textureMap` 里的旧缓存。
5. 清除 `window['T' + index]`。
6. 对 image 模式删除旧 img DOM，设置 `ccgxkObj.indexToArgs.get(index).texture = boardId + random`。
7. 对 text 模式设置 `texture = boardId`。
8. 从 `currentlyActiveIndices` 删除 index，让引擎重新走 hook。

这是一种“以纹理缺失触发动态绘制”的设计。它不是传统 React 状态刷新，而是直接和你的引擎缓存层打交道。这个函数在未来值得拆分，但现在它跑通了最难的部分：让空间对象内容变化能重新进入渲染管线。

### 3.5 errorTexture_diy hook

文件：`signboard_lab/signTest.js`

运行逻辑：

- 如果 `signContentMap` 已有该 ID：
  - `mode === 'text'`：调用 `drawSmartText()`。
  - `mode === 'image'`：调用 `handleImageMode()`。
  - `mode === 'empty'`：绘制 ID 或占位。
- 如果没有内容：
  - 调用 `lazyLoadSign(id)`。
  - 临时绘制 `Loading...`。

这个 hook 的巧妙点在于：内容加载与渲染需求绑定。只有当画板真的被引擎需要绘制时，才触发懒加载。这适合你的大空间，避免入口瞬间请求所有墙面。

### 3.6 drawSmartText

文件：`signboard_lab/renderer.js`

它是 text 模式的画板渲染器，能力包括：

- 白底。
- 中文友好字体族。
- 根据画板宽高动态计算 padding。
- 从较大字号开始试排。
- 自动逐字换行。
- 避免部分中文标点出现在行首。
- 内容过高时逐步缩小字号。
- 三行以内居中，多行时左上排版。

这看似小功能，但对产品非常关键。3D 信息板第一眼是否舒服，取决于文字是否像“贴在墙上的正常纸张”，而不是一坨超出边界的 canvas 文本。

### 3.7 handleImageMode

文件：`signboard_lab/handlers/imageHandler.js`

它负责 image 模式：

- 用唯一 DOM ID 管理隐藏 `<img>`。
- 设置 `crossOrigin = 'anonymous'`。
- 图片加载完成后按自然宽高计算画板宽高。
- 把图片元素塞入 `textureMap`。
- 调用 `ccgxkObj.W.plane()` 更新纹理与尺寸。
- 如果 `naturalWidth === 0`，尝试把它当 SVG fetch 成文本，再转成 data URI。

这个功能让“贴照片”已经是真正意义上的贴照片，不只是文本。

### 3.8 signPanel 编辑面板

文件：`signboard_lab/signPanel/signTest.js` 和 `signboard_lab/signPanel/dom.js`

能力：

- 点击热点后弹出 HUD 编辑窗口。
- 支持 text / image 模式切换。
- 支持图片 URL 预览。
- 支持备注区，备注存在 `extra.remark`，不渲染在画布上。
- 支持 Ctrl/Cmd + S 保存。
- 支持可拖动。
- 支持文字全屏编辑模式。
- 按画板在内存里记住文本光标、滚动条、全屏/小屏状态。
- 打开面板时解锁鼠标、暂停热点追踪。
- 关闭面板时恢复热点追踪，并视情况重新锁定鼠标。

保存流程：

```text
用户点保存
-> 读取 mode/content/remark
-> 保留已有 extra，仅覆盖 extra.remark
-> PATCH /api/signs/:id
-> 成功后显示“已保存”并关闭
-> 等 SSE 回来统一刷新画板
```

这是一个接近真实产品的编辑器，不是简单 prompt。它已经考虑了用户在 3D 第一人称世界里编辑文字时最容易出问题的鼠标锁定、焦点、快捷键、热点漂移、内容不丢失。

### 3.9 hotinfo 热点信息面板

文件：`signboard_lab/hotinfo/hotinfo.js` 和 `hotinfo/dom.js`

这个模块服务于 `mode === 1` 展示模式。它的职责不是直接编辑，而是让浏览者在看到某块信息板时，可以在左侧看到信息，并打开全文或原图。

能力：

- 初始化时 `GET /api/signs` 拉元数据缓存。
- 每 100ms 轮询 `ccgxkObj.hotPoint`。
- 中心点指向信息板时更新左侧信息。
- 图片与文字都走统一内容模态框。
- mode=1 下点击热点只解锁鼠标，不直接弹编辑器。
- 内容模态框里可以点击编辑，复用 signPanel。
- SSE 更新时修补本地 `boardsData`，并刷新当前热点信息或当前打开模态框。

这正好对应你文章里提到的问题：3D 文字看久了累，应该像游戏里读书那样，点开后拍扁成 2D 阅读。`hotinfo` 已经在做这件事。

### 3.10 admin.html 管理页

文件：`signboard_lab/server/admin.html` 和 `server/js/main.js`

已闭环能力：

- `GET /api/signs` 全量读取。
- 在网页里编辑每块 board。
- `POST /api/signs` 批量保存。
- 文本模式 textarea。
- 图片模式 URL 输入和预览。

已清理项：

- Canvas 函数库 Tab 已从 `admin.html` 移除。
- `/api/canvas-lib` 相关 fetch 调用已从 `server/js/main.js` 移除。
- 任意 `new Function` 预览逻辑已移除。
- `canvas_functions` 历史迁移残留已从 `server/db/index.js` 移除。

所以当前 admin 管理页只承担 text/image 信息板批量编辑，不再包含 Canvas 函数库半成品入口。

## 4. 飞书测试目录已经实现的 API

路径：`/Users/kehongli/studio/1tool/feishu_test`

这个项目是飞书文档读写 MVP。它的关键选择是：不在应用代码里手写飞书 token、OAuth、开放平台 API，而是把授权、读写都交给本地 `@larksuite/cli`。这很实用，因为对个人工具来说，先跑通“能读/能写”比一开始就做完整 OAuth 后台更重要。

### 4.1 服务基本信息

入口：`server.js`  
静态页：`public/index.html`  
默认端口：`5177`  
启动脚本：`npm run start`  
CLI：`node_modules/.bin/lark-cli`

`.env` 只用于改 PORT，飞书授权由 CLI 自己管理。

### 4.2 GET /api/cli/status

接口：`GET /api/cli/status`

用途：检查本地 lark-cli 是否已配置和登录。

服务端动作：

```bash
lark-cli auth status
```

成功响应示例：

```json
{
  "ok": true,
  "configured": true,
  "raw": "CLI 原始状态或 JSON"
}
```

未配置响应示例：

```json
{
  "ok": true,
  "configured": false,
  "error": "错误内容",
  "hint": "先在终端运行：cd /Users/kehongli/studio/1tool/feishu_test && ./node_modules/.bin/lark-cli config init --new"
}
```

客户端调用位置：

- `public/index.html` 的 `refreshCliStatus()`

页面右上角会显示：

- `cli: configured`
- `cli: not configured`
- `cli: unknown`

### 4.3 POST /api/read

接口：`POST /api/read`

请求体：

```json
{
  "url": "飞书 Wiki 文档链接"
}
```

服务端动作：

```bash
lark-cli docs +fetch --doc <飞书 Wiki 链接> --as user --format json
```

成功响应：

```json
{
  "ok": true,
  "source": "lark-cli",
  "raw": "CLI JSON 或原始文本",
  "content": "提取出的可读正文"
}
```

错误响应：

```json
{
  "ok": false,
  "source": "lark-cli",
  "error": "错误信息",
  "parsed": "如果错误可解析为 JSON，则返回 JSON"
}
```

客户端调用位置：

- `public/index.html` 的“读取内容”按钮。

兼容逻辑：

- 服务端尝试 `JSON.parse()` CLI 输出。
- 内容字段按优先级取：
  - `data.content`
  - `data.markdown`
  - `data.data?.content`
  - `data.data?.markdown`
  - `data.document?.content`
  - 否则返回格式化 JSON 或原始文本。

这说明飞书层现在已经能作为“内容入口”。未来可以把读取结果拆成多个段落、标题、图片、链接，再映射成多个 signboard。

### 4.4 POST /api/append

接口：`POST /api/append`

请求体：

```json
{
  "url": "飞书 Wiki 文档链接",
  "text": "要追加的 Markdown"
}
```

服务端动作：

```bash
lark-cli docs +update --doc <飞书 Wiki 链接> --as user --mode append --markdown "要追加的内容"
```

成功响应：

```json
{
  "ok": true,
  "source": "lark-cli",
  "result": "CLI JSON 或原始输出"
}
```

错误响应同上。

客户端行为：

- 点击“追加文本”后调用 `/api/append`。
- 成功后自动触发读取按钮，重新读取当前文档。

这给你未来做“3D 空间里写了一段内容，同步追加回飞书”提供了第一块砖。它目前还不是精确更新某个块，而是 append，但作为 MVP 足够。

## 5. SaaS 基础已经具备的 API 与 Server Actions

路径：`/Users/kehongli/studio/z-nextjs/saas-start`

这是 Next.js 15 App Router 的 SaaS 基础。它是商业外壳，而不是 3D 运行时。它已经具备：

- 登录/注册。
- JWT cookie session。
- 团队模型。
- RBAC 的 owner/member 角色字段。
- 活动日志。
- Stripe Checkout。
- Stripe Customer Portal。
- Stripe webhook。
- Dashboard。
- Pricing。
- Blog。
- shadcn/ui 基础组件。
- Drizzle + Postgres schema。

### 5.1 GET /api/user

文件：`app/api/user/route.ts`

接口：`GET /api/user`

行为：

- 调用 `getUser()`。
- 从 cookie 读 `session`。
- 验证 JWT。
- 检查过期时间。
- 查数据库 users 表。
- 排除 `deletedAt` 非空的软删除用户。
- 返回当前用户或 `null`。

客户端调用：

- `components/header.tsx` 用 SWR 拉 `/api/user`。
- `dashboard/general/page.tsx` 用 SWR 拉用户信息。
- `dashboard/page.tsx` 的团队成员邀请区域也会用到用户信息。
- `app/layout.tsx` 用 SWR fallback 预置 `/api/user`。

### 5.2 GET /api/team

文件：`app/api/team/route.ts`

接口：`GET /api/team`

行为：

- 调用 `getTeamForUser()`。
- 先拿当前用户。
- 在 `teamMembers` 中查该用户所属 team。
- 连带取 teamMembers 和成员用户的 `id/name/email`。
- 返回团队数据或 `null`。

客户端调用：

- `dashboard/page.tsx` 用 SWR 拉 `/api/team`。
- `app/layout.tsx` 用 SWR fallback 预置 `/api/team`。

### 5.3 GET /api/stripe/checkout

文件：`app/api/stripe/checkout/route.ts`

接口：`GET /api/stripe/checkout?session_id=...`

用途：Stripe Checkout 成功回跳后，服务端确认 session 和 subscription，并把订阅状态写入团队。

行为：

1. 没有 `session_id`，重定向 `/pricing`。
2. Stripe 未配置，重定向 `/pricing?error=stripe_not_configured`。
3. 调 Stripe retrieve checkout session。
4. 展开 customer、subscription。
5. 查 subscription 和 plan。
6. 从 `client_reference_id` 取 userId。
7. 查用户。
8. 查用户所属 team。
9. 更新 teams 表：
   - `stripeCustomerId`
   - `stripeSubscriptionId`
   - `stripeProductId`
   - `planName`
   - `subscriptionStatus`
   - `updatedAt`
10. 重新设置 session。
11. 重定向 `/dashboard`。

### 5.4 POST /api/stripe/webhook

文件：`app/api/stripe/webhook/route.ts`

接口：`POST /api/stripe/webhook`

用途：接收 Stripe 订阅更新和删除事件。

行为：

1. Stripe 未配置，返回 `503`。
2. 读取原始 text payload。
3. 从 header 取 `stripe-signature`。
4. 用 `STRIPE_WEBHOOK_SECRET` 校验签名。
5. 对事件类型分流：
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
6. 调 `handleSubscriptionChange(subscription)`。
7. 返回 `{ received: true }`。

错误：

- 签名校验失败返回 `400`。

### 5.5 认证和账户 Server Actions

文件：`app/(login)/actions.ts`

这些不是传统 REST API，但在 Next.js App Router 里它们就是表单提交的服务器端 API。

已实现：

- `signIn`
  - 校验 email/password。
  - 查用户和团队。
  - bcrypt 比对密码。
  - 设置 session。
  - 记录 `SIGN_IN`。
  - 如果来自 checkout，则创建 Stripe Checkout Session。
  - 否则跳 `/dashboard`。

- `signUp`
  - 校验 email/password/inviteId。
  - 防重复 email。
  - hash 密码。
  - 创建用户。
  - 如果有邀请，加入邀请团队。
  - 如果没有邀请，创建新 team。
  - 写 teamMembers。
  - 记录 `CREATE_TEAM`、`SIGN_UP` 或 `ACCEPT_INVITATION`。
  - 设置 session。
  - 可接 checkout。

- `signOut`
  - 获取当前用户。
  - 记录 `SIGN_OUT`。
  - 删除 session cookie。

- `updatePassword`
  - 校验旧密码、新密码、确认密码。
  - 比对旧密码。
  - 新旧不能相同。
  - hash 新密码。
  - 更新 users.passwordHash。
  - 记录 `UPDATE_PASSWORD`。

- `deleteAccount`
  - 校验密码。
  - 记录 `DELETE_ACCOUNT`。
  - 软删除用户。
  - 修改 email 保持唯一性。
  - 删除 teamMembers 中对应成员关系。
  - 删除 session。

- `updateAccount`
  - 校验 name/email。
  - 更新 users 表。
  - 记录 `UPDATE_ACCOUNT`。

- `removeTeamMember`
  - 校验 memberId。
  - 删除团队成员。
  - 记录 `REMOVE_TEAM_MEMBER`。

- `inviteTeamMember`
  - 校验 email/role。
  - 防止重复成员。
  - 防止重复 pending invitation。
  - 写 invitations。
  - 记录 `INVITE_TEAM_MEMBER`。
  - 邮件发送尚是 TODO。

### 5.6 支付 Server Actions

文件：`lib/payments/actions.ts`

已实现：

- `checkoutAction`
  - 通过 `withTeam` 确保用户登录且有 team。
  - 从表单取 `priceId`。
  - 调 `createCheckoutSession()`。

- `customerPortalAction`
  - 通过 `withTeam` 确保用户登录且有 team。
  - 调 `createCustomerPortalSession(team)`。
  - 重定向到 portal URL。

### 5.7 数据库 schema 对未来 3D SaaS 的意义

当前 SaaS schema 有：

- `users`
- `teams`
- `teamMembers`
- `activityLogs`
- `invitations`

这对接 3D 产品时还缺：

- `projects`：一个用户/团队可以有多个 3D 空间。
- `worlds` 或 `spaces`：世界配置、主题、默认入口点。
- `boards`：云端内容对象，未来可替代 signboard SQLite 或与其同步。
- `boardVersions`：内容版本历史。
- `sources`：飞书、网页、Markdown、本地文件等外部来源。
- `syncJobs`：导入/同步任务。
- `publicShares`：公开分享链接与权限。
- `worldBuilds`：静态导出版本，便于 CDN 发布。

但作为基础，SaaS 已经够用了。你不需要先重写登录支付系统，应该把 openworld 的“空间内容对象”接进去。

## 6. 目前明确不该误认为完成的接口和能力

### 6.1 signboard 的 Canvas 函数库已清除

2026-05-03 已按“完整清除”处理历史 Canvas 函数库残留：

- `admin.html` 不再显示 Canvas 函数库 Tab。
- `server/js/main.js` 不再定义 `API_CANVAS`，也不再请求 `/api/canvas-lib`。
- `server/js/main.js` 不再包含 `new Function` 预览或函数新增/保存/删除逻辑。
- `server/db/index.js` 不再包含 `DROP TABLE IF EXISTS canvas_functions` 历史迁移代码。
- `claude.md` 和 `server/claude.md` 已移除 `api/canvas.js`、`canvas_functions` 等错误结构说明。

结论：Canvas 函数库现在不是“未完成 API”，而是“不存在的功能”。未来如果真要做动态绘图，应作为新功能重新设计，且必须是受控绘图模板，不能恢复任意提交 JS 函数在浏览器执行的模式。

### 6.2 signboard 没有删除 API

`db/index.js` 有 `deleteBoard(id)`，但 HTTP 没暴露。CORS 允许 DELETE，只是路由不存在。

结论：删除内容现在只能通过直接数据库、未来管理工具，或 `POST /api/signs` 全量替换间接实现。正式产品应做：

- `DELETE /api/signs/:id`
- 或软删除字段 `deleted_at`
- 或版本化恢复

### 6.3 signboard 没有鉴权

当前 API 是 `Access-Control-Allow-Origin: *`，没有 token、cookie、签名、team/project 权限。

这对个人部署没问题，但对商业 SaaS 必须补：

- 项目 ID。
- 用户/团队权限。
- API token 或 session。
- 公开只读与私有编辑分离。
- SSE 权限校验。
- 写操作速率限制。

### 6.4 飞书 MVP 不是云端 OAuth 产品

`feishu_test` 依赖本地 CLI 当前登录用户。它很适合个人工具和本地自动化，但不能直接拿去做多用户 SaaS。

商业化时有两条路：

- 先保留 CLI 模式，做“本地高级版/创作者工具”。
- 后续再接飞书开放平台 OAuth，做云端团队版。

### 6.5 SaaS 还没有 openworld 业务模型

SaaS 有 auth/team/billing，但没有 world/project/board/source/sync 的业务表。它是外壳，不是已经接通的三维产品。

## 7. 三者连接的最佳方案：把内容源变成空间，把 SaaS 变成控制台，把 openworld 变成播放器

### 7.1 一句话架构

Lark/Notion/Google Docs/Markdown/RSS/Readwise/Obsidian 负责原始内容，SaaS 负责账号、项目、订阅、导入、发布、SEO，openworld-js 负责 3D 空间体验，signboard API 负责“空间对象内容协议”，AI 负责把无结构内容变成可逛的空间结构。

这不是强行组合，而是刚好补齐：

- Lark/Notion/Google Docs 强在协作编辑和既有内容沉淀，弱在空间记忆。
- SaaS 强在商业闭环，弱在沉浸体验。
- openworld-js 强在空间展示和引擎壁垒，弱在账号/支付/协作。
- signboard_lab 强在单个空间对象内容闭环，弱在权限和内容来源。

### 7.2 推荐总数据流

```text
Lark / Notion / Google Docs / Markdown / RSS
  -> 内容源读取适配器
  -> AI 解析：标题、段落、图片、摘要、标签、实体、关系
  -> SaaS 项目库：sources / boards / layout / versions
  -> 布局器：把内容放进房间、墙面、展台、走廊
  -> signboard API：写入或同步 boards
  -> openworld-js：懒加载画板、展示、热点阅读
  -> 用户在 3D 里编辑
  -> PATCH board
  -> SaaS 记录版本
  -> 可选追加回飞书
```

### 7.3 最小可落地版本

第一版不要做“AI 自动建整个世界”。那会失控。最小版本应该是：

1. SaaS 里创建一个项目。
2. 用户填一个 Lark/Notion/Google Docs/Markdown/RSS 链接，或上传一份 Markdown。
3. 后台读取内容源。
4. AI 把文档切成若干卡片，每张卡片有：
   - title
   - summary
   - body
   - imageUrl
   - suggestedRoom
   - suggestedWall
   - importance
5. SaaS 生成一份 boards JSON。
6. 写入 signboard server 的 SQLite 或新云端 boards 表。
7. openworld-js 打开时显示这些 boards。
8. 用户可以在 3D 里改某块板。
9. 改动保存为版本。
10. 用户一键发布公开 URL。

这个版本已经能卖，因为它解决的是“把已有知识内容变成一个可逛的三维空间”。它不是卖引擎，是卖成品体验。

### 7.4 推荐新表结构

在 SaaS 里新增：

```text
projects
- id
- teamId
- name
- slug
- status
- createdAt
- updatedAt

worlds
- id
- projectId
- theme
- entryPosition
- engineVersion
- publicMode
- createdAt
- updatedAt

sources
- id
- projectId
- type: feishu | markdown | url | manual
- sourceUrl
- title
- syncStatus
- lastSyncedAt
- rawHash
- createdAt
- updatedAt

boards
- id
- projectId
- worldId
- sourceId
- boardKey
- name
- mode: text | image | link | video | markdown
- content
- extra
- positionJson
- visualJson
- sortKey
- createdAt
- updatedAt

board_versions
- id
- boardId
- content
- extra
- changedBy
- changeSource: user | feishu | ai | import
- createdAt

sync_jobs
- id
- projectId
- sourceId
- status
- inputJson
- outputJson
- error
- createdAt
- finishedAt
```

其中 `boardKey` 对应现在 SQLite 的 `id`。未来可以是：

```text
projectSlug:roomSlug:wallSlug:index
```

但在 openworld 里仍然可投影成 `board1h-0` 这种稳定纹理 ID。

### 7.5 signboard API 的升级方向

现在的 API 是单项目 SQLite。连接 SaaS 后要变成多项目：

- `GET /api/projects/:projectId/signs`
- `POST /api/projects/:projectId/signs/batch`
- `PATCH /api/projects/:projectId/signs/:id`
- `GET /api/projects/:projectId/signs/stream`

为了兼容当前客户端，可以先在网关层保留旧路径：

- 旧：`/api/signs`
- 新：根据 token 或 URL 参数推断 projectId，再转到项目级 boards。

最省事的过渡方案：

1. 先不改 signboard server。
2. SaaS 生成每个项目独立的 SQLite 或 JSON。
3. openworld 的 `getApiBase()` 指向项目专用 API。
4. 等产品验证后，再统一迁到 Postgres。

这比一开始就重构服务器更安全。你的 `server/claude.md` 也提醒生产服务器已部署云上，修改很棘手。商业化前期要尽量减少对这块的破坏。

### 7.6 内容源同步策略

Lark/Notion/Google Docs 这类内容源不是要和每个 board 做强双向同步。强双向同步会很难，因为文档结构和 3D 空间结构不是同构的。

更好的策略是三层：

第一层：导入

- 读取原始文档。
- 切成 boards。
- 生成空间。
- 后续空间可独立编辑。

第二层：半自动同步

- 再次读取原始文档。
- 对比 rawHash 或段落 hash。
- AI 标出新增、删除、改动。
- 用户在 SaaS 审核“应用到 3D 空间”。

第三层：回写摘要

- 用户在 3D 里新增或修改内容。
- 不直接改原文某一段。
- 先追加到原文档的“空间编辑记录”区，或在 SaaS 里生成可复制的变更报告。
- 或生成一份 Markdown 变更报告。

这样就避开了最难的冲突合并，也符合真实用户习惯：原文档是正式工作区，3D 是展厅/记忆宫殿/空间化版本。

### 7.7 AI 的正确位置

AI 不应该第一天就“替用户决定一切”。它应该先做几个低风险但很值钱的动作：

- 从 Lark/Notion/Google Docs/Markdown 抽标题、摘要、图片、关键句。
- 判断内容适合放在“入口、走廊、房间、附录”哪个层级。
- 给每块信息板生成短标题和长正文。
- 把超长正文压成适合墙面阅读的短版，把全文留给 2D 模态框。
- 生成 `extra.remark`，保存不展示的解释。
- 给每个 board 生成 SEO 平面页标题和摘要。
- 识别哪些内容应该变成图片板、哪些应该变成文字板。
- 根据空间容量给用户提醒：这间房不要塞超过 80 块板，否则空间记忆开始崩。

真正强的 AI 不是“自动生成一堆无用内容”，而是“把已有内容变成可以被空间记忆吸收的对象”。这个方向和你文章中的第一性原理一致。

## 8. 参考文章给出的产品方向判断

你给的文章《关于 openworld-js 驱动的 open world zone 的开发想法、思考》里有几条判断，和当前源码高度吻合：

- 第一性原理是墙上写字、贴照片。
- 3D 不应强迫用户承担所有输入和检索，应该配套 2D 平面管理系统。
- 3D 更适合长期结构化知识栖息地，而不是每条碎片笔记的唯一入口。
- 空间记忆适合 50 到 200 个对象这种人能自然记住的位置规模，超大数量需要 2D 索引辅助。
- 文字阅读应当能拍扁成 2D 模态框，否则透视文字会累。
- 引擎本身不是产品，普通用户需要一个今天就能用的最小版本。

这几条里，当前代码已经落地了三条：

1. 墙上写字、贴照片：`signPanel` + `PATCH` + `SSE` + `drawSmartText` + `handleImageMode`。
2. 2D 阅读模态框：`hotinfo` 的全文/原图模态框。
3. 平面管理雏形：`admin.html` 的全量编辑。

还没落地的是：

- SaaS 化 2D 管理系统。
- 飞书等内容源导入。
- AI 自动整理。
- SEO 平面页。
- 公开分享和付费。

所以接下来不是“再想一个大方向”，而是把已有神经系统接上内容源和收费外壳。

参考文章链接：https://www.cnblogs.com/duyuanshang/p/19679184

## 9. 收入目标：在河南生活，但市场按海外算

为了不空谈，可以用河南官方统计做一个粗基准。河南省统计局公布的 2024 年数据里，全省城镇非私营单位就业人员年平均工资为 86199 元，城镇私营单位为 50625 元。来源：河南省统计局，`2024年河南省城镇单位就业人员年平均工资情况`，链接：https://tjj.henan.gov.cn/2025/06-25/3173720.html

但这个数据只用于衡量你的生活成本，不用于选择客户。你的站应当优先做海外市场，原因很直接：

- Stripe 订阅、英文 SEO、Product Hunt、Reddit、Indie Hackers、Hacker News、X/Twitter 更适合 SaaS 冷启动。
- 海外创作者、worldbuilders、educators、ADHD/visual thinkers 对“personal knowledge space / memory palace / immersive portfolio”这类表达更容易理解。
- 海外用户能接受 8 到 29 美元/月的小工具订阅，也更习惯为 creator tool、PKM tool、teaching tool 付费。
- 国内市场会把你拖进备案、支付、飞书私域、低价定制、强关系销售；这和你想做“海外站”的节奏相冲突。

所以这里的收入目标应该按“海外收美元，河南生活成本结算”来理解：

- 如果产品每月净收入 8000 元，已经接近或超过河南很多私营岗位的月均水平。
- 如果每月净收入 15000 元，在河南多数城市会明显更从容。
- 如果每月净收入 30000 元，就不是“过得体面”，而是有余力继续投入产品和试错。

折算成海外订阅，不需要很夸张：

- Solo：8 到 12 美元/月，100 个用户约 800 到 1200 美元月收入。
- Pro：19 到 29 美元/月，100 个用户约 1900 到 2900 美元月收入。
- Studio：49 到 99 美元/月，30 到 60 个用户就能形成稳定现金流。
- Done-for-you setup：499 到 4999 美元/单，少量客户就能覆盖生活与研发。

对你这种独立开发者，最现实的不是先追求海量 C 端，而是做“海外高客单价的小众强需求”。你的引擎壁垒在“空间化展示”，不是普通笔记软件效率。所以收费对象应该优先是：

- English-speaking educators / course creators。
- Worldbuilders / novelists / TTRPG creators。
- Indie researchers / knowledge bloggers / newsletter writers。
- Startup founders who need memorable demo rooms。
- ADHD / visual thinkers / memory palace users。
- Small museums / cultural nonprofits outside China。
- Creator economy users who already pay for Notion, Readwise, Obsidian Sync, Super, Framer, Webflow.

## 10. 超级工具创意 1：Lark / Notion / Docs 一键变 3D Knowledge Villa

### 10.1 产品一句话

把一篇 Lark、Notion、Google Docs、Markdown 或 newsletter archive，自动变成一个可在网页里第一人称漫游的 3D Knowledge Villa：客厅放总览，走廊放目录，房间放章节，墙上挂摘要、图片和原文入口。

### 10.2 为什么这不是普通人容易想到的

大多数人会想“Notion AI summary”或“docs to website”。但这只是平面复制。真正有差异的是把文档结构变成建筑结构：

- 文档标题变楼层。
- 一级标题变房间。
- 二级标题变墙面分区。
- 关键段落变信息板。
- 图片变画框。
- 结论变入口大屏。
- 附录变地下室或档案柜。

这不是花哨。它把用户的空间记忆接进文档复习。对于长文档、课程、研究资料、世界设定，位置本身就是索引。

### 10.3 当前代码怎么支撑

已有：

- Lark/Feishu 读取原型：`POST /api/read`
- 信息板批量写入：`POST /api/signs`
- 信息板单条更新：`PATCH /api/signs/:id`
- 3D 展示：`signTest` + `drawSmartText` + `handleImageMode`
- 2D 全文阅读：`hotinfo`
- SaaS 登录/团队/订阅：`saas-start`

缺口：

- 内容源切块，海外版优先做 Markdown/Notion/Google Docs/Lark。
- 文档结构到空间结构的布局器。
- 项目表。
- 发布链接。
- 权限与订阅。

### 10.4 AI 怎么赋能

AI 做 6 件事：

1. 把原始文档正文切成适合墙面的小卡。
2. 给每张卡生成墙面短标题、短摘要、全文链接。
3. 判断卡片应该放在哪个房间。
4. 生成一张“入口导览地图”。
5. 给每个房间生成一句引导语。
6. 自动生成 SEO 平面页。

### 10.5 谁会付钱

- Course creators。
- Newsletter writers / independent researchers。
- Startup founders 做产品故事展示。
- Educators / tutors。
- Worldbuilders / novelists / TTRPG creators。

### 10.6 收费方式

- Free：1 个项目，最多 30 块板，有水印。
- Pro：$12/month，10 个项目，500 块板，公开分享。
- Studio：$29/month，50 个项目，AI 自动布局，SEO 页。
- Done-for-you：$499 起，把客户现有 Notion/Docs/Markdown 知识库做成一个可分享展厅。

### 10.7 最小可卖版本

先不要做漂亮的大世界。只做一个固定建筑模板：

- 入口大厅。
- 6 个房间。
- 每个房间 20 块板。
- 内容源导入后自动填板。
- 点击板子看全文。
- 用户可以手动替换图片 URL。
- 一键生成公开链接。

只要这个跑通，就能拿去找英文知识博主、newsletter 作者、course creator、worldbuilding 社群试卖。

## 11. 超级工具创意 2：AI Course Museum for Educators

### 11.1 产品一句话

Educators 上传 syllabus、lesson notes、Google Docs、Notion 或 Markdown，AI 自动生成一个可逛的网页 3D course museum：按时间线、知识点、案例、练习题分区展示，学生像逛博物馆一样复习。

### 11.2 为什么它适合你

你文章里提到博物馆体验。现实中很多线上课程页面非常无聊，PPT 又容易丢。3D 课件展馆不追求最高效率，而追求“学生愿意进去看”。这与你的第一人称空间能力天然匹配。

### 11.3 具体场景

- History educators：把二战、古文明、艺术史做成时间线展馆。
- Medical educators：把 anatomy、cases、pharmacology 做成楼层。
- Language tutors：把词汇、场景、语法、例句放进固定房间。
- Corporate trainers：把 onboarding、安全规范、产品知识做成闯关展厅。

### 11.4 AI 能做的部分

- 从教案里提炼知识点。
- 把知识点分成展厅、展墙、展板。
- 自动生成讲解词。
- 自动生成测验题。
- 自动生成学生参观路线。
- 自动生成 educator 可复制的 classroom script。
- 根据学生错题，把错题对应展板放到“复习大厅”。

### 11.5 用现有 API 怎么做

初始导入：

- Lark/Markdown 原型通过 `/api/read` 读入，海外版优先补 Notion/Google Docs/Markdown importer。
- AI 生成 boards。
- 通过 `POST /api/signs` 写入。

课堂中修改：

- educator 在 3D 里点某块板。
- `PATCH /api/signs/:id` 保存。
- 学生端通过 SSE 实时看到更新。

课后复习：

- SaaS 生成公开链接。
- SEO 平面页收录课程目录。
- 3D 页负责沉浸复习。

### 11.6 收费方式

- Starter：$19/month，适合单个 educator。
- Pro：$49/month，支持多个课程展馆和公开分享。
- Done-for-you course museum：$499 到 $2999。

这类产品不需要一开始就很多用户。只要做出一个真正漂亮的英文 “World War II course museum” 或 “Anatomy memory palace” 样板，就有机会靠海外 course creator 和 tutor 群体收费。

## 12. 超级工具创意 3：Researcher 3D Authority Site

### 12.1 产品一句话

把一个 researcher、newsletter writer、blogger 多年文章变成一个三维知识庭院：每个主题一个房间，每篇文章一块展板，平面页负责 SEO，3D 空间负责建立专业感和记忆点。

### 12.2 为什么这个有商业价值

现在个人主页太同质化。博客、Notion、GitHub Pages、Substack archives 都像目录。真正想建立专业权威的人，需要一种“不像模板网站”的展示形式。

你的 openworld-js 的优势是轻。一个 3D 空间如果打开很快，能在浏览器直接逛，就有传播价值。它像作品集，又像数字展馆。

### 12.3 目标客户

- Independent researchers。
- Newsletter writers。
- Technical bloggers。
- Designers / game concept artists。
- Novelists / worldbuilders。
- Consultants / educators。

### 12.4 AI 能做什么

- 抓取用户博客 RSS、Substack archive、Markdown、Notion 或 Google Docs。
- 自动按主题聚类。
- 给每个主题生成房间名。
- 给每篇文章生成墙面摘要。
- 给文章生成“为什么值得读”。
- 自动挑选代表图。
- 生成平面 SEO 页。

### 12.5 产品形态

每个用户有：

- `/{username}` 平面首页。
- `/{username}/world` 3D 世界。
- `/{username}/rooms/:slug` 平面房间页。
- `/{username}/boards/:id` 单个展板 SEO 页。

SaaS 负责订阅、域名绑定、统计、导入、主题模板。openworld 负责 3D 世界。

### 12.6 收费方式

- Solo：$12/month。
- Pro：$29/month，支持自定义域名和 AI 重排。
- Done-for-you authority site：$499 到 $4999。

这个方向最适合早期变现，因为你可以手工帮前 10 个客户做。手工过程会反过来沉淀自动化模板。

## 13. 超级工具创意 4：小说/游戏世界观 Bible 的空间导航器

### 13.1 产品一句话

为小说作者、编剧、TRPG 主持人、游戏策划提供一个 3D 世界观资料馆：人物、势力、地点、时间线、道具、设定稿都挂在空间里，AI 帮忙查矛盾、补摘要、生成关系路线。

### 13.2 为什么普通笔记软件不够

世界观资料有强空间性。地点、势力范围、家族房间、角色关系、地图、事件时间线，本来就不适合纯列表。作者经常不是找不到笔记，而是忘了某个设定存在过。空间化可以制造“路过时看见”的偶遇。

### 13.3 当前引擎为什么合适

你不需要高精 3D。世界观 Bible 的核心是“位置和联想”：

- 王国大厅。
- 家族房间。
- 城市墙面。
- 时间线走廊。
- 道具陈列柜。
- 人物关系板。

这些用 plane、cube、图片、文字就能做。openworld-js 体积小，网页打开快，非常适合作者分享给编辑或合作伙伴。

### 13.4 AI 能做的部分

- 从小说草稿中抽取人物、地点、组织、物品。
- 自动建立实体卡。
- 检查年龄、时间线、关系矛盾。
- 给每个实体推荐摆放位置。
- 生成“本章涉及哪些房间”的路线。
- 在作者写新章时提醒：这个角色上次出现在哪些事件里。

### 13.5 收费方式

- Writer：$12/month。
- Studio：$49/month。
- Done-for-you story bible museum：$499 到 $4999。

这个方向天然海外优先，关键词围绕 worldbuilding、story bible、visual knowledge base、memory palace for writers。

## 14. 超级工具创意 5：ADHD / 视觉思考者的空间复习屋

### 14.1 产品一句话

面向 ADHD、视觉思考者、考试复习用户，提供一个“每天进去逛 10 分钟”的空间复习屋：AI 把待复习内容贴到固定位置，按遗忘曲线安排显眼程度，用户通过空间路径复习。

### 14.2 为什么它不是普通待办软件

很多待办软件失败，不是因为功能不够，而是因为用户不想打开。你的文章里有一句核心判断：它不解决效率问题，它解决“人为什么还想打开它”。这个方向就该承认自己不是最快，而是更容易让人愿意回来。

### 14.3 产品机制

- 今天要复习的内容放客厅。
- 明天要复习的放走廊。
- 已熟悉内容放书房。
- 长期记忆内容放阁楼或档案室。
- 高优先级内容发光或贴近入口。
- 用户看完后点“我记住了 / 我没记住”。
- AI 根据反馈调整位置。

### 14.4 AI 能做什么

- 把用户的笔记压缩成记忆卡。
- 生成问答。
- 生成图像提示或类比。
- 自动安排复习路线。
- 识别太长的卡片并拆分。
- 每天生成“10 分钟散步路线”。

### 14.5 收费方式

- Solo：$8 到 $15/month。
- Exam pack：$19 到 $49 一次性，优先做 SAT/MCAT/USMLE/LSAT 或 language learning，而不是国内考试。
- Pro：$19/month，支持 AI route 和复习记录。

这个方向的难点是用户留存，但一旦做中，订阅很自然。它最适合先做一个极窄海外场景，例如 “Spanish vocabulary memory house” 或 “MCAT visual memory palace”，不要泛化成万能笔记。

## 15. 超级工具创意 6：Lightweight 3D Museum for Small Cultural Organizations

### 15.1 产品一句话

为 small museums、local history societies、university archives、cultural nonprofits 做轻量 3D 网页展馆：不用重型三维建模，主要用空间结构、图片、文字、讲解、路线，快速上线可分享。

### 15.2 为什么这很现实

大量小型文化机构需要“online exhibit”，但预算不一定够做高精 Unity/Unreal，也没有团队维护复杂系统。你可以卖的是：

- 打开快。
- 成本低。
- 能手机/电脑访问。
- 可自己更新展板。
- 有平面 SEO 页面。
- 能嵌入 Markdown/Google Docs/Notion 或管理后台。

这里 openworld-js 的小体积和 signboard 的可编辑，正好是优势。

### 15.3 AI 能做什么

- 从讲解稿生成展板摘要。
- 从照片生成说明文字。
- 自动生成参观路线。
- 生成语音讲解稿。
- 生成不同年龄段版本：kids、visitors、researchers。
- 自动生成导览问答。

### 15.4 收费方式

- Small exhibit setup：$999 到 $4999。
- Annual maintenance：$999 到 $9999。
- Multi-exhibit plan：按机构包年。

这类单子客单价更高，但 2 个月内不建议作为主攻，因为海外 B2B 销售周期会长。它更适合作为样板成熟后的第二阶段。

## 16. 超级工具创意 7：B2B 产品演示空间

### 16.1 产品一句话

把 SaaS 或硬件产品的功能、案例、客户评价、教程做成一个可逛的 3D Demo Room，销售发给客户，客户可以像看展一样理解产品。

### 16.2 为什么它可卖

很多 B2B 官网和 PPT 太像了。销售需要一种让客户记住的演示材料。你的 3D 空间不需要像游戏，只要比 PPT 更有停留感，就能服务成交。

### 16.3 产品结构

- 入口：一句话价值主张。
- 左侧房间：痛点。
- 右侧房间：解决方案。
- 中央：产品截图。
- 走廊：客户案例。
- 二楼：价格和 FAQ。
- 会议室：预约演示。

### 16.4 AI 能做什么

- 根据官网自动生成 Demo Room。
- 从产品文档提炼卖点。
- 自动生成客户行业版本。
- 自动生成销售讲解词。
- 根据客户行业生成专属参观路线。

### 16.5 收费方式

- Single demo room：$499 到 $4999。
- SaaS subscription：$49 到 $199/month。
- Enterprise custom：$5000 起。

这对你也有反向价值：你可以用自己的产品演示空间卖自己的产品。

## 17. 超级工具创意 8：网页收藏的 3D 陈列柜

### 17.1 产品一句话

把用户散落在 browser bookmarks、Readwise、Raindrop、Pocket、RSS、Markdown 里的链接，AI 自动整理成一个 3D 陈列柜。不是替代搜索，而是让好东西重新被看见。

### 17.2 真实痛点

很多人收藏了几千个链接，但几年不看。不是因为没有搜索，而是因为忘了自己收藏过什么。空间陈列柜解决的是“偶遇”，而不是效率检索。

### 17.3 产品机制

- 收藏链接导入。
- AI 抽标题、封面、摘要。
- 同主题放同一墙。
- 最近想看的放入口。
- 长期收藏放书架。
- 用户每次打开都有“今日路过 10 个旧收藏”。

### 17.4 收费方式

- Browser extension + 3D space：$8/month。
- Local lifetime：$49 一次性。
- 高级 AI 整理：按量收费。

这个方向偏 C 端，难度在增长和留存，但作为你个人使用的原型非常顺手。你自己就是第一用户。

## 18. 哪个创意最该先做

我按“现有代码复用度、可收费速度、差异化、开发复杂度”排序：

第一优先：Lark / Notion / Docs / Markdown 一键变 3D Knowledge Villa  
原因：你已经有 Lark/Feishu 读取原型、signboard 编辑、SaaS 外壳。这个最能把三者连起来。海外 MVP 明确，可演示，可卖给 newsletter writer、course creator、worldbuilder。

第二优先：Researcher 3D Authority Site  
原因：适合代建收费。你可以先手工做样板，收第一批定制钱，不必等完整 SaaS。

第三优先：AI Course Museum  
原因：海外 educator/course creator 付费意愿更强，但需要好样板。

第四优先：Worldbuilding Story Bible  
原因：海外潜力好，社群清晰，适合 Reddit/Discord/YouTube demo。

第五优先：Lightweight 3D Museum for Small Cultural Organizations  
原因：客单高，但海外销售周期更长，2 个月内不适合作第一现金流。

暂缓：泛 ADHD 空间复习屋、网页收藏陈列柜  
原因：想象力强，但 C 端留存难。可以作为长期方向，不作为第一现金流。

## 19. 最推荐的具体路线：先做“Docs/Markdown -> 3D Knowledge Villa”

### 19.1 2 个月内见效果的约束

你补充了一个很重要的时间约束：最好 2 个月内能见到效果。这里的“效果”不应该定义成系统完美，而应该定义成：

- 有一个英文落地页能被陌生人看懂。
- 有一个可录屏的 3D Knowledge Villa 样板。
- 有一个内容源导入到 signboard 的半自动流程。
- 有 20 到 50 个海外目标用户被触达。
- 有 3 到 5 个深度反馈。
- 最理想是拿到第一笔 $99 到 $499 的 setup 订单，或至少拿到 waitlist / email。

所以 8 周内不做：

- 完整多用户 OAuth。
- 完整 Notion 双向同步。
- 复杂多人协作。
- 自由建造器商业版。
- 无限模板系统。
- 大规模重构生产 signboard server。

8 周内只做“可展示、可导入、可收费询价”的 overseas-first MVP。

### 19.2 第 1 周目标

不要动生产服务器核心。先做一个导入脚本或 SaaS 后台实验页：

1. 输入 Markdown / Lark 文档 URL，先用你已有 `feishu_test` 逻辑跑通一个内容源。
2. 把返回 Markdown/正文切成 20 到 80 张卡。
3. 生成 boards JSON。
4. 用 `POST /api/signs` 写到本地 signboard server。
5. 打开 openworld 页面看效果。

这里 AI 可以先手工 mock。第一周的目标不是完美自动布局，而是证明“内容源变墙上卡片”。

### 19.3 第 2 周目标

做固定模板：

- 入口 4 块总览板。
- 走廊 12 块目录板。
- 房间 A/B/C 各 20 块正文板。
- 图片板自动挑出来。
- 每块板的 `extra` 存原文、内容源 URL、段落 hash、备注。

同时给 `hotinfo` 的全文模态框适配 `extra.fullText`，这样墙上显示短摘要，点开看全文。

### 19.4 第 3 周目标

接入 SaaS：

- 登录后创建项目。
- 保存内容源 URL。
- 生成项目 boards。
- 项目页显示 2D 列表。
- 提供“打开 3D 世界”按钮。
- 免费项目限制 boards 数量。

这里先不必改 openworld 太多。可以通过 URL 参数或 localStorage 指向不同 API base。

### 19.5 第 4 周目标

做第一个样板站：

- 选一个你自己的高质量文章或资料。
- 生成 3D 知识别墅。
- 平面页写清楚：这是把长文档变成可逛空间的工具。
- 录屏。
- 找 20 个英文知识博主、newsletter 作者、course creator、worldbuilding 创作者私聊。
- 提供 3 个免费或低价代建名额，换反馈和案例。

### 19.6 第 5 到 6 周目标

把样板变成能卖的海外站：

- 英文域名和 landing page。
- H1 不要抽象，建议直接叫：`Turn your notes into a walkable 3D knowledge space`。
- 展示 30 秒录屏 GIF 或视频。
- 放 3 个 use cases：course, worldbuilding, research archive。
- 放价格：`$99 early setup` 或 `$499 done-for-you`。
- 放 waitlist / Stripe payment link / Calendly。
- 写 3 篇 SEO 文章：
  - `3D knowledge base for visual thinkers`
  - `Memory palace software for writers`
  - `Turn Notion pages into an interactive knowledge museum`
- 到 Reddit、Indie Hackers、Hacker News Show HN、Product Hunt upcoming、worldbuilding 论坛试探。

### 19.7 第 7 到 8 周目标

验证是否有现金信号：

- 如果有人愿意付 $99 到 $499，请先手工交付，不要急着自动化。
- 如果没人付钱但有人愿意留邮箱，继续调整定位。
- 如果点击很多但没人留邮箱，落地页表达有问题。
- 如果大家只说 cool 但没人要，说明展示很酷但场景不尖，要缩到一个人群，例如 worldbuilders 或 course creators。
- 如果有人问能否导入 Notion，就优先做 Notion/Markdown importer，而不是继续加 3D 功能。

### 19.8 第一个收费版本

不要等全自动。直接卖代建：

- Early setup：$99，1 篇长文/1 个小展馆/最多 60 块板。
- Standard：$499，一组 Notion/Docs/Markdown 文档/最多 200 块板/一个公开链接。
- Studio：$1999，定制建筑主题/SEO 平面页/后续一次修改。

这个比 $12/month 订阅更适合第一笔收入。订阅等流程稳定后再上。

## 20. 技术债与改造优先级

### 20.1 最高优先级：统一服务器地址格式

当前 `config.js` 和 `tab/serverConfig.js` 对默认地址的处理不完全一致。建议：

- 保存时必须带协议。
- 如果用户输入 `127.0.0.1:8899`，自动转成 `http://127.0.0.1:8899`。
- UI 文案写清楚：本地填 `http://127.0.0.1:8899`，生产填 `https://selfdb.ccgxk.com`。

### 20.2 已完成：管理页 Canvas 残留已处理

2026-05-03 已选择“删除残留入口”，而不是保留半成品 Canvas API。当前 admin 管理页只保留 text/image 信息板编辑。未来如需动态图形能力，应另开受控模板系统。

### 20.3 高优先级：extra 结构标准化

现在 `extra.remark` 已经有了。未来建议标准化：

```json
{
  "remark": "",
  "source": {
    "type": "feishu",
    "url": "",
    "blockId": "",
    "hash": ""
  },
  "fullText": "",
  "summary": "",
  "tags": [],
  "ai": {
    "room": "",
    "importance": 0,
    "lastProcessedAt": ""
  }
}
```

这样不改主表，也能先承载飞书同步和 AI 输出。

### 20.4 中优先级：批量写接口加保护

`POST /api/signs` 是全量替换。未来至少要加：

- 管理员权限。
- 项目隔离。
- 请求体大小限制。
- dry-run 模式，先返回将新增/修改/删除多少。
- 备份版本。

### 20.5 中优先级：SSE 加项目频道

多项目后不能所有人都收所有 boards。SSE 应变成：

```text
GET /api/projects/:projectId/signs/stream
```

或者通过 token 绑定 project。

### 20.6 中优先级：2D 平面页

你的文章已经判断对了：3D 负责逛，2D 负责 SEO 和检索。每块 board 都应该有平面页。平面页包含：

- 标题。
- 摘要。
- 全文。
- 所在房间。
- 打开 3D 并传送到该位置。

这个功能会让产品不只是玩具，而是能被搜索、分享、传播。

## 21. 一个更大胆但可行的终局：空间内容操作系统

终局不要叫笔记软件。笔记软件会把你拖进 Notion、Obsidian、飞书的战场。更好的定位是：

空间内容操作系统，给已有内容一个可逛、可展示、可记忆、可发布的三维外壳。

它的核心对象不是“页面”，而是：

- 世界 World
- 房间 Room
- 墙 Wall
- 展板 Board
- 物件 Object
- 路线 Route
- 来源 Source
- 平面页 Page

在这个系统里：

- 飞书是 Source。
- SaaS 是管理台。
- signboard 是 Board API。
- openworld 是 World Runtime。
- AI 是 Curator，也就是策展人。

你真正要卖的不是“3D 笔记”，而是“AI 策展 + 3D 展示 + 平面发布”。这个表达更容易商业化，因为客户能理解：

- 我有一堆内容。
- 你帮我整理成一个展馆。
- 这个展馆能分享、能传播、能收费、能让别人记住我。

## 22. 最后的判断

从源码看，`signboard_lab` 已经跨过了最危险的一步：不是空想，不是只画一个 3D 场景，而是把“空间对象内容”跑通了。现在最该做的是把它接入一个真实内容来源和一个真实收费外壳。

Lark/Feishu 读取原型证明内容源适配能跑，SaaS 正好是收费外壳，openworld-js 正好是差异化体验。海外站的最小可卖形态，就是 “Docs/Markdown/Notion to 3D Knowledge Villa”。

这条路的关键克制是：不要把 openworld-js 包装成万能 3D 笔记；不要一开始做多人世界；不要一开始做复杂编辑器；不要一开始做自动生成任意建筑。先让用户把一篇长文档变成一个能打开、能逛、能分享、能修改、能让人眼前一亮的空间。

一旦这个样板成立，后面才轮到：

- AI 自动选址。
- 多主题模板。
- 内容源增量同步。
- 平面 SEO 页面。
- 订阅。
- 定制展馆。
- 海外版本。

你的壁垒不是某个 API，而是你已经把一个轻量 3D 引擎、空间对象、动态画板、实时更新、个人长期知识栖息地这几件事揉在一起了。普通人会把它看成“一个 3D 页面”，但真正的产品直觉是：它可以成为内容的第二居所。

## 23. 附录：已闭环 API 总表

### signboard_lab 生产 API

| 方法 | 路径 | 状态 | 客户端 | 作用 |
|---|---|---|---|---|
| OPTIONS | `*` | 已实现 | 浏览器预检 | CORS |
| GET | `/api/signs` | 已实现 | hotinfo/admin | 全量读取 boards |
| POST | `/api/signs/batch` | 已实现 | store.lazyLoadSign | 按 ID 批量懒加载 |
| POST | `/api/signs` | 已实现 | admin.html | 全量替换保存 |
| PATCH | `/api/signs/:id` | 已实现 | signPanel | 单条 upsert |
| GET | `/api/signs/stream` | 已实现 | hotUpdate | SSE 实时广播 |
| 其他 | 未匹配 | 已实现 | 所有 | 404 JSON |

### signboard_lab 仍未暴露但可能未来需要的 API

| 方法 | 路径 | 状态 | 备注 |
|---|---|---|---|
| DELETE | `/api/signs/:id` | 未实现 | 数据库函数有，HTTP 无 |

### 飞书 MVP API

| 方法 | 路径 | 状态 | 作用 |
|---|---|---|---|
| GET | `/api/cli/status` | 已实现 | 检查 lark-cli 配置 |
| POST | `/api/read` | 已实现 | 读取飞书文档 |
| POST | `/api/append` | 已实现 | 向飞书文档追加 Markdown |

### SaaS 基础 HTTP API

| 方法 | 路径 | 状态 | 作用 |
|---|---|---|---|
| GET | `/api/user` | 已实现 | 当前登录用户 |
| GET | `/api/team` | 已实现 | 当前用户团队 |
| GET | `/api/stripe/checkout` | 已实现 | Stripe 成功回跳 |
| POST | `/api/stripe/webhook` | 已实现 | Stripe 订阅事件 |

### SaaS 基础 Server Actions

| 名称 | 状态 | 作用 |
|---|---|---|
| `signIn` | 已实现 | 登录 |
| `signUp` | 已实现 | 注册/接受邀请 |
| `signOut` | 已实现 | 登出 |
| `updatePassword` | 已实现 | 修改密码 |
| `deleteAccount` | 已实现 | 软删除账户 |
| `updateAccount` | 已实现 | 修改姓名和邮箱 |
| `removeTeamMember` | 已实现 | 移除团队成员 |
| `inviteTeamMember` | 已实现 | 创建邀请记录，邮件发送待补 |
| `checkoutAction` | 已实现 | 创建 Stripe Checkout |
| `customerPortalAction` | 已实现 | 打开 Stripe 客户门户 |

## 24. 附录：本次审计的关键源码证据

- `openworld-js/open-world-zone/main.js`：主世界装载顺序。
- `openworld-js/open-world-zone/plugins/signboard_lab/signTest.js`：信息板入口、hook、SSE、热点编辑。
- `openworld-js/open-world-zone/plugins/signboard_lab/store.js`：懒加载、批量读取、内存缓存。
- `openworld-js/open-world-zone/plugins/signboard_lab/hotUpdate.js`：SSE 客户端、`window.updateSign`。
- `openworld-js/open-world-zone/plugins/signboard_lab/signPanel/signTest.js`：编辑面板与 `PATCH /api/signs/:id`。
- `openworld-js/open-world-zone/plugins/signboard_lab/hotinfo/hotinfo.js`：展示模式热点信息与 `GET /api/signs`。
- `openworld-js/open-world-zone/plugins/signboard_lab/server/server.js`：HTTP 路由总表。
- `openworld-js/open-world-zone/plugins/signboard_lab/server/api/signs.js`：signs API 实现。
- `openworld-js/open-world-zone/plugins/signboard_lab/server/db/index.js`：SQLite 表、CRUD、迁移。
- `openworld-js/open-world-zone/plugins/signboard_lab/server/sse.js`：SSE 连接和广播。
- `1tool/feishu_test/server.js`：飞书 CLI API。
- `1tool/feishu_test/public/index.html`：飞书 MVP 前端调用。
- `z-nextjs/saas-start/app/api/user/route.ts`：当前用户 API。
- `z-nextjs/saas-start/app/api/team/route.ts`：当前团队 API。
- `z-nextjs/saas-start/app/api/stripe/checkout/route.ts`：Stripe checkout 回跳。
- `z-nextjs/saas-start/app/api/stripe/webhook/route.ts`：Stripe webhook。
- `z-nextjs/saas-start/app/(login)/actions.ts`：认证和团队 Server Actions。
- `z-nextjs/saas-start/lib/payments/actions.ts`：支付 Server Actions。
- `z-nextjs/saas-start/lib/db/schema.ts`：SaaS 数据模型。

## 25. 追加：5 个更激进的海外创意

这次追加的 5 个创意，不再只是“把资料放进 3D 空间”。海外相邻产品已经说明，普通 3D gallery 不稀奇：Menel、OpenVGAL、Exospace、Exhibbit 这类产品都已经在做 “images to 3D gallery / virtual exhibition”。Worldbuilding 领域也有 Neverkin、TomeWorlds、WorldKeeper、PlotForge 这类工具在做 story bible、timeline、AI world generation。Memory palace 方向也已有移动端和 VR/AI 记忆训练产品。

所以你的新创意不能只是“我也做一个 3D 展馆”。真正要避开正面竞争，应该抓住你现在已有但别人没有强调的三个点：

- **内容源自动策展**：不是手动上传图片，而是从已有 Docs/Markdown/RSS/Notion/Readwise 里抽内容。
- **空间对象 API**：每块板都有 ID、内容、extra、SSE、编辑回写，不是一次性静态展览。
- **2D + 3D 双通道**：3D 负责记忆、逛、情绪，2D 负责全文、SEO、交易、检索。

下面 5 个创意都按海外站优先、2 个月内可做出样板信号来设计。

### 25.1 创意 9：Knowledge Escape Room for Learning

一句话：把课程、培训文档、newsletter archive 自动变成一个“知识密室逃脱”。用户必须读懂墙上的信息板、打开全文、回答问题、找到线索，才能进入下一间房。

这个点子比“3D course museum”更强，因为它不只是展示，而是把学习变成可验证的路径。传统课程的问题是：学生打开视频，但不知道有没有真的吸收。普通 quiz 又太像考试，压力大、无趣。Knowledge Escape Room 把 quiz 藏进空间里：一个知识点是一把钥匙，一个概念关系是一条暗门线索，一个错题会把用户送回对应房间。

它的特别之处：

- 用户不是“看完一页”，而是“走出一个房间”。
- AI 不是简单总结，而是把内容转成谜题、线索和门锁。
- 3D 空间不是装饰，而是学习状态机。
- 每个 board 都是可更新的知识对象，SSE 可让老师/作者实时调整谜题。

适合海外客户：

- Course creators：把 paid course 做成 bonus interactive room。
- Corporate onboarding：把 boring handbook 变成 20 分钟闯关。
- Language tutors：把词汇、语法、情景对话做成关卡。
- Cybersecurity / compliance trainers：让员工在空间里找风险点。

MVP 怎么做：

1. 导入一篇 Markdown 或 Lark/Docs 文档。
2. AI 生成 20 张知识板、5 道题、3 个门。
3. 用户点击热点打开全文，然后在 2D modal 里答题。
4. 答对后把 `extra.unlocked = true` 写入 board 或 session。
5. 空间里下一扇门从 hidden 变 visible。

当前代码怎么接：

- 题目和答案可以存在 `extra.quiz`。
- 门的状态可以先做成前端 localStorage，不急着入库。
- 正文仍然用 `content` + `extra.fullText`。
- `PATCH /api/signs/:id` 可让作者在 3D 里调整题目说明。

2 个月内如何验证：

- 做一个 “AI Safety Basics Escape Room” 或 “Spanish Prepositions Escape Room” 样板。
- 发到 Reddit 的 r/SideProject、r/InternetIsBeautiful、r/languagelearning、Indie Hackers。
- Landing page 文案：`Turn your boring docs into a playable learning room.`
- 先卖 $99 setup：用户给一篇培训文档，你交付一个可玩的 room。

为什么可能有钱：

普通课程工具很多，但“把文档变成 playable room”的表达新，适合创作者当 bonus content 卖。第一批不靠订阅，靠 done-for-you。只要 2 个月内拿到 1 到 3 单 $99-$499，就说明方向有现金味。

风险：

- 谜题太难会劝退。
- 3D 操作如果不顺会影响学习。
- 所以第一版必须极简：三间房、五道题、十分钟完成。

### 25.2 创意 10：Spatial Newsletter Companion

一句话：给 newsletter 作者一个“每期文章自动生成一个可逛小房间”的 companion page。读者读完邮件后，可以进入 3D 房间复习本期关键观点，旧文章会逐渐形成一座可逛的思想馆。

这个创意看起来小，但很适合海外。Substack、Beehiiv、ConvertKit 作者很多，他们都面临同一个问题：文章发出去后很快沉底。读者看过就忘，作者过去 100 篇文章也很难被系统性发现。传统 archive 是列表，没人愿意翻。你的空间可以把 archive 变成“作者的思想建筑”。

核心机制：

- 每期 newsletter 生成一个 room。
- 文章标题变门牌。
- 3 到 7 个核心观点变墙面 boards。
- 推荐阅读变走廊出口。
- 作者可以把最重要的一期放到入口。
- 读者从最新一期走回旧主题，形成“思想路径”。

为什么比普通 3D gallery 有差异：

- gallery 展示的是图片作品，newsletter companion 展示的是思想结构。
- 它不是替代邮件，而是给邮件一个长尾复习空间。
- 每一期都是一个可分享 landing asset，可带来 SEO 和社交传播。

MVP 怎么做：

1. 先不接 Substack API，用户粘贴一篇 Markdown。
2. AI 输出：
   - `issueTitle`
   - `oneSentence`
   - `keyIdeas[]`
   - `quoteCards[]`
   - `relatedLinks[]`
3. 写入 boards。
4. 生成一个 `/{creator}/{issueSlug}/world`。
5. 平面页给 SEO，3D 页给体验。

2 个月内验证：

- 选 3 篇你自己的文章或公开英文长文，做成样板。
- 私信 30 个 newsletter 作者，尤其是写 AI、learning、PKM、worldbuilding、history 的。
- 提供 `I will turn one of your best essays into a walkable idea room for free / $99`。

定价：

- Free sample：1 篇文章。
- Creator：$12/month，每月 4 个 issue rooms。
- Archive setup：$499，把 30 篇旧文章做成一座小型思想馆。

为什么这个很可能比泛知识库更快见效：

newsletter 作者已经懂内容资产、懂 landing page、懂付费订阅。他们会理解“让旧文章重新被发现”的价值。你的工具不是卖给所有读者，而是卖给有内容资产的创作者。

风险：

- 作者可能觉得 3D 是 gimmick。
- 解决方法是不要说 metaverse，不要说 VR。说：`a memorable interactive archive for your best ideas`。

### 25.3 创意 11：Investor Update War Room

一句话：把 startup 的 monthly investor update、metrics、roadmap、customer quotes、demo links 变成一个私密 3D war room，让投资人和顾问像进入作战室一样理解公司进展。

这个方向很怪，但有潜力。创始人每月发 investor update，通常是邮件、Notion、DocSend、Slides。问题是这些材料都很平，读者扫一眼就过。一个 war room 可以把公司状态“空间化”：

- 左墙：本月指标。
- 右墙：客户证据。
- 中央：产品 demo。
- 后墙：roadmap。
- 桌面：asks，告诉投资人本月需要什么帮助。
- 角落：risk board。

这不是给大众看的，而是给少数高价值关系看的。B2B 小工具最怕没有付费场景，但 startup founder 愿意为 fundraising、investor relations、sales narrative 付费。

AI 能做什么：

- 从 update 文档里抽 metrics。
- 把好消息、坏消息、asks 分区。
- 把数字变成可读展板。
- 生成 investor-friendly narrative。
- 自动生成 “3-minute tour route”。
- 对过长内容生成 “board version” 和 “full memo version”。

MVP 怎么做：

1. 创始人粘贴 monthly update Markdown。
2. AI 生成 war room boards。
3. 生成私密链接，需要简单 token。
4. 每个 board 有 full text modal。
5. 访问后记录基本 analytics：访问次数、停留时间、打开了哪些板。

当前代码适配：

- boards API 已能承载指标、quote、roadmap。
- SaaS 已有 team 和 auth，可做私密项目。
- Stripe 可收 setup fee。
- 不需要复杂 3D 建模，一个固定会议室模板即可。

2 个月验证：

- 做一个虚构 startup 的 war room demo。
- 发到 Indie Hackers、founder Slack/Discord、X。
- 私信早期 SaaS founder：`I turn your monthly investor update into a private interactive war room.`
- 收 $199-$999 setup。

为什么这个可能比教育更快有钱：

创始人买的是“让投资人记住我”和“显得专业”，不是买学习工具。只要样板有冲击力，单价可以高。它不需要大量用户，2 单就能验证。

风险：

- 隐私和安全要求更高。
- 第一版不要碰敏感真实数据，先允许用户自行部署或静态导出 ZIP。
- 对外强调 private link / static export / no indexing。

### 25.4 创意 12：Semantic Sales Battle Room

一句话：销售团队上传竞品页面、客户电话纪要、FAQ、案例，AI 生成一个 3D Sales Battle Room。销售在拜访客户前走一遍路线，就能记住 objection handling、竞品对比和最佳话术。

这个创意不是普通 CRM，也不是普通 sales enablement 文档。销售真正的问题不是没有资料，而是资料散、临场想不起来。空间路线很适合做“战前演练”：

- 第一间：客户画像。
- 第二间：痛点。
- 第三间：竞品反驳。
- 第四间：案例证据。
- 第五间：价格异议处理。
- 出口：本次 call 的 5 个关键句。

AI 的价值：

- 从销售资料里提炼 objections。
- 把每个 objection 绑定一张 answer card。
- 根据客户行业生成专属路线。
- 自动把成功案例放到相关异议旁边。
- 生成 “before-call 5-minute walkthrough”。

为什么这很有创意：

多数 sales enablement 是文档库、搜索、AI chat。AI chat 的问题是销售还要问对问题；空间 route 则把“该复习什么”预先排好。它更像认知训练，而不是资料库。

MVP 怎么做：

1. 用户上传一个 Markdown：包含 product、competitors、FAQ、case studies。
2. AI 生成 30 张 battle cards。
3. 固定一个 war room 模板。
4. 每张 card 可点开全文。
5. 增加 “start 5-minute route” 按钮，按顺序高亮 boards。

当前代码适配：

- `extra.routeIndex` 存路线顺序。
- `extra.customerSegment` 存行业版本。
- `content` 存短话术。
- `extra.fullText` 存完整解释。
- SSE 可让销售经理更新 battle cards 后，团队前端实时看到。

2 个月验证：

- 做一个 “AI writing SaaS vs competitors” demo。
- 找 indie SaaS founder、solo sales、agency owner。
- 文案：`A walkable sales battlecard room your team can rehearse before calls.`
- 收费：$499 setup，或 $49/month per team。

风险：

- 企业销售周期长。
- 所以前 2 个月不要卖大企业，卖 indie SaaS founder、agency、consultant。

### 25.5 创意 13：Digital Legacy House

一句话：把一个人的照片、文章、录音、信件、人生事件、作品整理成一个私密或公开的 3D Digital Legacy House。它不是相册，也不是纪念网页，而是一个可走进去的个人记忆空间。

这个创意比较情绪化，但海外市场有真实付费可能。很多家庭、创作者、艺术家、教授、创业者都有一堆散落资料：Google Drive、照片、博客、采访、邮件、演讲稿。普通 memorial website 是平面的，Notion archive 又像文件柜。Digital Legacy House 把人生按房间组织：

- Entrance：一生概览。
- Study：文章和手稿。
- Gallery：照片。
- Voice room：录音和访谈。
- Timeline hallway：重要年份。
- Guestbook room：亲友留言。
- Works room：作品和项目。

AI 能做什么：

- 从资料中抽时间线。
- 给照片生成说明。
- 把文章按主题分房间。
- 从录音转写中抽关键语句。
- 生成每个房间的导览词。
- 生成 privacy-safe public version 和 family-only version。

为什么它和你的项目匹配：

你的第一性原理是“在墙上写字、贴照片”。Digital Legacy House 就是这个原理最直观、最有情感价值的版本。它不要求极高效率，也不需要复杂交互。它需要的是“人愿意进入一个属于某个人的空间”。这和你文章里的“人愿意长期投入属于自己的空间”完全一致。

MVP 怎么做：

1. 用户提供 20 张图片、5 段文字、1 条时间线。
2. 生成固定 house 模板。
3. 每张照片变 image board。
4. 每段文字变 text board。
5. 2D 平面页负责完整文字和分享。
6. 可选择 public/private。

2 个月验证：

- 不要一开始碰沉重的 memorial 场景，先定位为 `Digital Legacy House for creators and families`。
- 做一个虚构 creator 的样板，或用你自己的公开资料做一个 `founder archive house`。
- 找 biography writers、family historians、artists、professors、photographers。
- 收费：$499-$2999 done-for-you。

风险：

- 情感和隐私敏感，不能轻浮。
- 第一版必须明确：用户拥有数据，可导出静态文件，默认私密，不训练模型。

这个方向不一定适合 2 个月内第一现金流，但它可能是长期最高情感溢价的方向。普通人不一定为知识管理付钱，但会为“把某个人的一生好好保存下来”付钱。

## 26. 追加创意的优先级判断

如果只看 2 个月内见效果，追加的 5 个里我会这样排：

1. **Spatial Newsletter Companion**：最适合冷启动。newsletter 作者有内容、有受众、有付费意识，样板容易做。
2. **Knowledge Escape Room for Learning**：最适合录屏传播，标题新，容易让人点进去看。
3. **Investor Update War Room**：最适合拿高单价，但要更会销售。
4. **Semantic Sales Battle Room**：B2B 价值强，但 2 个月内要避开大企业。
5. **Digital Legacy House**：长期情感价值强，但需要更谨慎的品牌表达。

这 5 个里面，最“快”的不是最宏大的 Digital Legacy House，而是 Spatial Newsletter Companion。因为你可以很快做出一个英文样板：拿一篇文章，自动拆成 8 块板，放进一个小房间，再给作者一个 URL。它有明确目标人群，有冷启动渠道，有 $99 setup 的交易形态。

最适合做 viral demo 的是 Knowledge Escape Room。它可以录屏：走进房间，看墙上知识点，答对题，门打开。这个比“我做了个 3D 知识库”更容易让陌生人理解。

最可能提高客单价的是 Investor Update War Room。创始人如果愿意买，可能不会纠结 $99 和 $499 的差别，因为他买的是叙事资产和专业感。

最终建议：不要把这 5 个全做。2 个月内最多做一个主线、一个展示变体。主线继续用 `Docs/Markdown -> 3D Knowledge Villa`，展示变体可以选择 `Knowledge Escape Room`，因为它能把同一套 boards API 变成更有传播力的 demo。

## 27. 追加创意参考的海外相邻产品

这次追加时，我快速看了几个海外相邻产品，目的不是照抄，而是避免把已有市场里常见的 3D gallery / story bible / memory palace 重新包装一遍：

- Menel：浏览器 3D gallery builder，强调 artists、galleries、museums、share with one link。https://www.menel.art/
- OpenVGAL：开源 3D virtual gallery，从图片生成可自托管 WebGL gallery。https://openvgal.com/
- Exospace：面向 artists/galleries 的 3D exhibition 创建工具。https://exospace.gallery/
- Exhibbit：in-browser 3D virtual art gallery platform，强调 curate、publish、promote。https://exhibbit.com/
- Neverkin：collaborative writing and worldbuilding app。https://neverkin.com/
- TomeWorlds：面向 authors、novelists、TTRPG creators 的 worldbuilding companion。https://www.tomeworlds.com/
- WorldKeeper：AI worldbuilding and storytelling software，强调 AI world generation、characters、places、agent API。https://worldkeeper.io/
- Mind Palace: Memory Trainer：App Store 上的 method of loci / AI memory palace 类产品。https://apps.apple.com/us/app/mind-palace-memory-trainer/id6758350669

这些参照说明：海外已经有人做虚拟展馆、写作世界观、记忆宫殿。你的机会不在“也做一个 3D 房间”，而在“已有内容源 -> AI 策展 -> 空间对象 API -> 2D/3D 双通道发布”这条组合链。
