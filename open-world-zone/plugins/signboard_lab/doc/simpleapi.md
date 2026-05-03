# signboard_lab 后端最小 API

目标：后端只维护“空间画板 ID -> 可渲染内容”。前端默认读 `localStorage.signboard_server_address`，没有就用 `http://127.0.0.1:8899`。Next.js/SaaS 重写时可把这些做成 `/api/signs/*` Route Handlers，数据库随意，先保证契约稳定。需要 CORS：`GET,POST,PATCH,OPTIONS`，请求头 `Content-Type`。

## 核心数据
`Board`：
```json
{
  "id": "house1H3-1",
  "name": "house1H3-1",
  "mode": "text",
  "content": "文字或图片URL",
  "extra": { "remark": "" },
  "updated_at": "2026-05-03 18:00:00"
}
```

字段要点：
- `id` 是画板纹理/空间对象的稳定业务 ID，必须唯一，来自前端世界里的 `t`，例如 `house1H3-1`、`board1h-2`、`floorSign-1`。
- `name` 可直接等于 `id`，当前前端不强依赖展示名。
- `mode` 只保留 `text | image | empty`。`text` 时 `content` 是正文；`image` 时 `content` 是图片 URL；`empty` 表示空板。
- `extra` 是扩展 JSON，目前只用 `remark`，备注不画到纹理，只给热点信息/编辑面板看。
- 查不到某个 `id` 不算错误，前端会当空板处理。

## 必做接口

### `GET /api/signs`
用途：热点信息栏初始化、管理后台读取全量。数据量大后可分页，但当前前端期望全量。
```json
{
  "version": 1,
  "boards": [Board]
}
```

### `POST /api/signs/batch`
用途：画板懒加载、手动刷新当前热点画板。前端会在 100ms 内合并多个 ID。
```json
// request
{ "ids": ["house1H3-1", "board1h-2"] }

// response：只返回数据库存在的板
{ "boards": [Board] }
```
注意：`ids` 为空返回 `{ "boards": [] }`；不存在的 ID 不要返回占位，也不要 404。

### `PATCH /api/signs/:id`
用途：编辑面板保存单个画板。前端只发 `mode/content/extra`，后端用 URL 里的 `:id` upsert。
```json
// request
{ "mode": "text", "content": "新内容", "extra": { "remark": "" } }

// response
{
  "success": true,
  "message": "更新成功",
  "board": Board
}
```
默认值建议：`name=id`，`mode=text`，`content=""`，`extra={}`。

### `POST /api/signs`
用途：可选后台批量替换全部画板，旧 server/admin 用。小步重构时可先不做后台 UI，但接口保留最省事。
```json
// request
{ "boards": [Board] }

// response
{ "success": true, "message": "保存成功", "changed": 3 }
```

## 前端行为
- `store.js` 发现纹理缺失时调用 `/api/signs/batch`，拿到数据后写入本地 `signContentMap`。
- 编辑面板保存走 `PATCH /api/signs/:id`。保存成功后前端立即执行 `window.updateSign(id, content, mode, extra)`，本机刷新纹理。
- 当前已不需要 SSE，也不需要服务端主动推送。未来多人协作再加轮询/WebSocket。
- 图片上传暂时不是接口职责；`image` 模式只要求 `content` 能被浏览器当图片 URL 加载。
