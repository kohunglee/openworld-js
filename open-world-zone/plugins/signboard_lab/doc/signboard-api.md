
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

3. 初始化编辑面板、热点信息面板，并把热点点击与编辑面板绑定起来。

  

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

辅助函数：`open-world-zone/plugins/signboard_lab/server/helpers.js`

默认端口：`8899`

启动命令：`npm run start`，实际执行 `node server.js`

依赖：`better-sqlite3`、`sql.js`，实际持久化使用 `better-sqlite3`。

  

`server.js` 明确写着这是纯 API 服务器，静态文件由主项目 HTTP 服务器提供。它监听 `0.0.0.0:8899`，启动时初始化 SQLite，并在退出时执行 WAL checkpoint、关闭数据库。2026-05-03 已移除 SSE 长连接，服务端只保留普通 HTTP API。

  

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

  

这对当前架构很重要，因为 3D 客户端、管理页、生产 API 很可能不在同一端口。开发时主项目可能在 `8089` 或 Vite 端口，API 在 `8899`；生产时默认配置会指向远程 `https://openworld.zone/owz-serverapi`。

  

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

- `mode`：内容模式，目前闭环的是 `text` 与 `image`。客户端存在 `empty` 内存态；管理页残留 `canvas` 选项，但服务器未实现 canvas API。

- `content`：正文或图片 URL。

- `extra`：JSON 字符串，当前已用的是 `remark`，用于保存“不显示在画板上的备注”。

- `created_at`：创建时间。

- `updated_at`：更新时间，靠触发器自动刷新。

  

数据库模块有几个重要函数：

  

- `initDatabase()`：打开 SQLite，启用 WAL，建表，迁移 `extra` 字段，删除历史 `canvas_functions` 表。

- `getAllBoards()`：按 `id` 排序返回全部。

- `getBoardsByIds(ids)`：按 ID 批量查询。

- `upsertBoard(board)`：单条插入或更新。

- `replaceAllBoards(boards)`：事务内全量删除再插入。

- `deleteBoard(id)`：删除单条，但当前 HTTP 路由没有暴露。

- `closeDatabase()`：checkpoint、关闭连接、清理 wal/shm 文件。

  

这里有一个很关键的事实：`initDatabase()` 会 `DROP TABLE IF EXISTS canvas_functions`。这说明 canvas 函数库在当前生产服务器里已经被主动移除。管理页 JS 里保留的 `API_CANVAS` 不能算已闭环 API。

  

### 2.4 GET /api/signs

  

接口：`GET /api/signs`

  

服务器入口：

  

- `server.js` 路由到 `handleGetSigns(req, res)`

- 实现在 `server/api/signs.js`

  

客户端调用位置：

  

- `signboard_lab/hotinfo/hotinfo.js` 的 `loadBoardsData()`

- `tab/serverConfig.js` 的“重试连接”轻量检测；没有待加载画板时，会用这个接口确认服务器是否恢复。

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

2. 热点信息面板初始化时拉一份轻量元数据，用于左侧信息、全文/原图弹窗、后续本地局部修补。

3. Tab 侧栏在用户手动点击“重试连接”且没有 pending 画板时，用它做一次连接检测。

  

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

- 请求失败时，客户端把失败 ID 放回 `pendingIds`，但会暂停自动重试，避免服务器关闭时 100ms 一次刷控制台。

- 失败状态会通过 `signboard:server-status` 事件通知 Tab 侧栏。用户确认服务器恢复后，可以点击“重试连接”，由 `window.retrySignboardLazyLoad()` 继续加载这些 pending 画板。

  

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

7. 返回保存成功和变化条数；客户端若需要刷新，应自己按需调用读取接口。

  

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

"message": "更新成功",

"board": {

"id": "board1h-0",

"name": "board1h-0",

"mode": "text",

"content": "画板正文",

"extra": {

"remark": "备注"

}

}

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

  

这个接口是当前最核心、最健康的写接口。它满足：

  

- 单条更新，不会误伤其他 boards。

- 新板子可以直接 upsert。

- 保存成功后，客户端本机直接调用 `window.updateSign()` 立即刷新当前画板。

- 其他客户端或其他页面若要看到变化，需要通过 HotInfo 的“更新”按钮或后续的可见画板低频刷新策略主动拉取。

  

这个设计经验很宝贵。以后无论你接飞书、Notion、Obsidian、本地文件、SaaS 后台，都应该优先落到“单个空间对象 upsert + 按需刷新”的模型，而不是每次全量覆盖。

  

### 2.8 当前画板手动刷新

  

2026-05-03 已移除 `GET /api/signs/stream`。当前刷新策略是：

  

- 本机编辑保存成功后，`signPanel.save()` 直接调用 `window.updateSign(boardId, content, mode, extra)`。

- HotInfo 面板里的“更新”按钮使用 `POST /api/signs/batch`，只请求当前热点对应的一个 boardId。

- 这个入口在 DOM 中是 `<a id="signHotInfoRefresh">[更新]</a>`，跟 `[编辑]` 一类 HotInfo 操作保持同样的链接式风格；请求过程中用 `aria-disabled="true"` 防止重复点击。

- 客户端拿到返回值后先和 `signContentMap` 比对；内容有变化才调用 `window.updateSign()`，无变化只修补 `boardsData` 里的更新时间等元信息。

- 后续如果做“可见画板低频刷新”，也应该优先复用 `POST /api/signs/batch`，只刷新已注册、当前可见或距离用户近的画板。

  

这个变化的理由很明确：画板大多是冷数据，Vercel / Cloudflare 这类平台对长连接支持也会增加部署成本。把长连接换成按需刷新，更贴近当前产品阶段。

  

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

- `GET /api/canvas-lib` 没有暴露。

- `POST /api/canvas-lib` 没有暴露。

- `POST /api/canvas-lib/add` 没有暴露。

- `DELETE /api/canvas-lib/:name` 没有暴露。

  

这些不能列入已完成 API。

  

## 3. signboard_lab 客户端内部 API 与运行协议

  

HTTP API 只是边界，客户端内部也有一套事实上的协议。它们不一定暴露给外部，但决定了系统如何运行。

  

### 3.1 getApiBase：服务器地址协议

  

文件：`signboard_lab/config.js`

  

关键常量：

  

```js

const STORAGE_KEY = 'signboard_server_address';

const DEFAULT_ADDRESS = 'https://openworld.zone/owz-serverapi';

```

  

`getApiBase()` 逻辑：

  

- 如果 `localStorage` 有 `signboard_server_address`，直接返回这个值。

- 如果没有，返回 `https://openworld.zone/owz-serverapi`。

  

同时 `tab/serverConfig.js` 也使用同一个 `STORAGE_KEY`，但默认值是：

  

```js

const DEFAULT_ADDRESS = 'https://openworld.zone/owz-serverapi';

```

  

现在默认地址应保持同一个规则：

  

- 如果用户没有保存过地址，`signboard_lab/config.js` 会默认 `https://openworld.zone/owz-serverapi`。

- 如果用户在侧边栏点了“默认”，也会写入 `https://openworld.zone/owz-serverapi`。

- 如果用户手动输入 `127.0.0.1:8899` 且没有协议，`getApiBase()` 会原样返回，fetch 可能失败。

  

建议以后把地址保存逻辑统一成“必须带协议”，保存时自动补 `http://` 或校验。这不是当前 API 闭环的阻断点，但会影响普通用户配置成功率。

  

### 3.2 信息板服务器状态协议

  

文件：`signboard_lab/store.js`、`tab/serverConfig.js`

  

2026-05-03 之后，信息板客户端多了一层轻量状态协议，用来处理服务器关闭或网络不可达的情况。

  

核心对象：

  

```js

window.signboardServerStatus = {
    status: 'online' | 'offline' | 'connecting' | 'idle' | 'unknown',
    apiBase: 'http://127.0.0.1:8899',
    pending: 12,
    time: 1777800000000,
    message: 'Failed to fetch'
}

```

  

事件：

  

```js

window.dispatchEvent(new CustomEvent('signboard:server-status', { detail: payload }));

```

  

当前使用方式：

  

- `store.js` 的 `doBatchFetch()` 请求失败时，设置 `status: 'offline'`，并把失败 ID 留在 `pendingIds`。

- 失败后 `isFetchPaused = true`，不会再自动 100ms 重试，避免控制台被 `net::ERR_CONNECTION_REFUSED` 刷屏。

- `tab/serverConfig.js` 监听 `signboard:server-status`，只在 Tab 侧栏服务器设置区显示“已连接 / 未连接 / 正在连接”等状态，不再在右上角控制条显示徽标。

- Tab 侧栏里的“重试连接”会调用 `window.retrySignboardLazyLoad()`；如果当前没有 pending 画板，则只用 `GET /api/signs` 做一次轻量连接检测。

- `signPanel.save()`、HotInfo 初始化加载、HotInfo 手动刷新失败时，也会汇报同一套离线状态。

  

这个协议不是服务端 API，而是浏览器内的 UI 状态协议。它的重点是：服务器关着时不要偷偷高频重试，而是明确告诉用户，等用户决定再重试。

  

### 3.3 signContentMap

  

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

- 给保存后本地刷新和 HotInfo 手动刷新提供当前值，用于判断是否需要重绘。

  

这里没有直接持久化，本地刷新页面会重新向服务器加载。

  

### 3.4 signIndexMap

  

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

- 手动刷新或保存刷新只能作用于已经注册的 board；未进入视野、还没注册的 board 会在未来进入 hook 后再懒加载。

  

### 3.5 window.updateSign

  

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

  

### 3.6 errorTexture_diy hook

  

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

  

### 3.7 drawSmartText

  

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

  

### 3.8 handleImageMode

  

文件：`signboard_lab/handlers/imageHandler.js`

  

它负责 image 模式：

  

- 用唯一 DOM ID 管理隐藏 `<img>`。

- 设置 `crossOrigin = 'anonymous'`。

- 图片加载完成后按自然宽高计算画板宽高。

- 把图片元素塞入 `textureMap`。

- 调用 `ccgxkObj.W.plane()` 更新纹理与尺寸。

- 如果 `naturalWidth === 0`，尝试把它当 SVG fetch 成文本，再转成 data URI。

  

这个功能让“贴照片”已经是真正意义上的贴照片，不只是文本。

  

### 3.9 signPanel 编辑面板

  

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

-> 成功后调用 window.updateSign() 本地刷新画板

-> 显示“已保存”并关闭

```

  

这是一个接近真实产品的编辑器，不是简单 prompt。它已经考虑了用户在 3D 第一人称世界里编辑文字时最容易出问题的鼠标锁定、焦点、快捷键、热点漂移、内容不丢失。

  

### 3.10 hotinfo 热点信息面板

  

文件：`signboard_lab/hotinfo/hotinfo.js` 和 `hotinfo/dom.js`

  

这个模块服务于 `mode === 1` 展示模式。它的职责不是直接编辑，而是让浏览者在看到某块信息板时，可以在左侧看到信息，并打开全文或原图。

  

能力：

  

- 初始化时 `GET /api/signs` 拉元数据缓存。

- 每 100ms 轮询 `ccgxkObj.hotPoint`。

- 中心点指向信息板时更新左侧信息。

- 图片与文字都走统一内容模态框。

- mode=1 下点击热点只解锁鼠标，不直接弹编辑器。

- 内容模态框里可以点击编辑，复用 signPanel。

- `window.updateSign()` 触发时修补本地 `boardsData`，并刷新当前热点信息或当前打开模态框。

- 左侧 `signHotInfoId` 右侧有 `<a id="signHotInfoRefresh">[更新]</a>`，只请求当前热点画板，内容变化时再刷新纹理。

- `[更新]` 使用 a 标签，不使用 button，视觉上与 `[编辑]`、`[打开全文]`、`[查看原图]` 保持一致。请求中通过 `aria-disabled="true"` 防止重复点击。

- 备注和全文里的链接识别支持两类：普通域名会补 `https://`；任意 `scheme://...` 会保留原协议，例如 `obsidian://open?...`、`chrome://settings/`、其他应用自定义协议。

  

这正好对应你文章里提到的问题：3D 文字看久了累，应该像游戏里读书那样，点开后拍扁成 2D 阅读。`hotinfo` 已经在做这件事。

  

### 3.11 admin.html 管理页

  

文件：`signboard_lab/server/admin.html` 和 `server/js/main.js`

  

已闭环能力：

  

- `GET /api/signs` 全量读取。

- 在网页里编辑每块 board。

- `POST /api/signs` 批量保存。

- 文本模式 textarea。

- 图片模式 URL 输入和预览。

  

未闭环残留：

  

- 管理页里还有 Canvas 函数库 Tab。

- JS 里定义了 `API_CANVAS = API_BASE + '/api/canvas-lib'`。

- 它会尝试调用：

- `GET /api/canvas-lib`

- `POST /api/canvas-lib`

- `POST /api/canvas-lib/add`

- `DELETE /api/canvas-lib/:name`

- 但当前 `server/api` 目录只有 `signs.js`。

- `server.js` 没有注册 canvas 路由。

- `db/index.js` 还主动删除 `canvas_functions` 表。

  

所以 Canvas 函数库不是当前服务器与客户端已完美实现的 API。它是历史残留 UI，需要未来要么删除，要么重新实现。
