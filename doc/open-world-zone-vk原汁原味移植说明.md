# open-world-zone VK 原汁原味移植说明

## 背景

`open-world-zone` 的多人在线机制来自 `demo/house` 中的 `vk.js` 和 `vktool.js`。原版是传统浏览器全局脚本，依赖 `setVK`、`vkSocket`、`id2name`、`getCookie`、`setCookie` 等函数或对象自然挂到全局作用域；而 `open-world-zone` 是 Vite 模块项目，入口文件通过 ES Module import 组织代码。两种运行环境最容易出问题的地方不是 WebSocket 协议本身，而是“谁先创建 DOM、谁能访问全局变量、用户开关状态什么时候恢复”。这次移植以原版体验为准，只在模块化边界上做必要适配。

## 移植原则

本次处理的核心原则是：用户看见的 VK 行为尽量和 `demo/house` 一致。包括连接时显示 `（连接中...）`，连接成功后显示 `（已连接）`，HUD 中使用 `当前人数: N | `，Tab 面板中保留“在线人数”“关闭在线功能（下次进来也会自动关闭）”“当前在线人数”等中文界面，好友列表继续显示中文随机名、坐标、手机端标识和颜色块。好友实例仍然使用 50 个 cube 实例，超过 6 秒未更新的游客继续从 `frendMap` 中删除，删除日志也恢复原版中文输出。

## Vite 兼容点

原版脚本里可以直接使用 `k` 和 `vkSocket`。在 Vite 模块中，裸变量不会像普通 script 那样可靠地表达共享状态，所以 `open-world-zone/vk.js` 显式从 `globalThis.k` 读取 openworld 实例，并把 socket 保存在 `globalThis.vkSocket`。函数内部再用 `const vkSocket = globalThis.vkSocket` 固定本次连接，避免重连后闭包误用后来的 socket。`vktool.js` 保持原来的 ID 转中文名、cookie 读写算法，只增加 `export`，让 `vk.js` 和 Tab 插件能按模块方式引用。

## Tab 插件对齐

`demo/house` 的在线开关逻辑在 `indexevent.js` 中，`open-world-zone` 没有同一份 HTML，而是由 `plugins/tab/tab.js` 动态插入面板。因此 VK 相关 DOM 必须放回 Tab 插件里，否则 `setVK()` 调用时找不到 `closeVK`、`onlineCount`、`isConneting`、`frendPosInfo` 等节点。Tab 插件现在会在插入 HTML 后立即读取 `closeVK` cookie，并先设置 checkbox 与 `onlineInfo.hidden`，再等主入口末尾调用 `setVK()`。这样如果用户上次关闭了在线功能，本次进入页面时 `setVK()` 会按原版逻辑直接返回，不会多连一次 WebSocket。

## WebSocket 行为

服务器地址固定为 `wss://myshwsa.ccgxk.com/ws/`，没有接入 Tab 面板中其它服务器配置。发送数据时仍然沿用原版的“双层 JSON”方式：先把位置对象转成字符串，再交给 `sendMessage` 做一次 `JSON.stringify` 后发送。接收数据时也继续读取服务端返回的 `data.content`，再解析出玩家位置。这个结构看起来绕，但它属于当前线上服务的协议习惯，移植时不应该擅自改成单层 JSON，否则服务端或其它旧客户端可能无法互通。

## 关闭在线功能

关闭在线功能时，Tab 插件会关闭 `globalThis.vkSocket`，隐藏在线信息区域，把 HUD 人数改为 `当前人数: 0 | `，并写入 `closeVK=true` cookie。重新打开时调用 `setVK()`，恢复在线信息区域，并继续使用原来的断线重连节奏。`vk.js` 的 `onclose` 仍然会在开关未勾选时一秒后重连；如果用户是主动勾选关闭，`onclose` 能读到 checkbox 状态，因此不会自动重连。

## 注意事项

这次没有修改 `src`，也没有改变 openworld 底层实例化接口。`frends` 仍是一个动态实例化 cube 集合，依赖 `W.updateInstance`。如果之后要改成角色模型、名字牌或更复杂的插值动画，建议另开一层显示适配，不要直接改 WebSocket 数据协议。VK 现在仍然把页面失焦视为暂停发送：非开发模式下，如果 `document.hidden` 或页面没有焦点，会设置 `k.donotUseSocket = true` 并把连接状态文字变灰；页面重新激活后恢复发送。这个行为也来自原版，适合减少后台页面占用。

## 验证建议

最低验证是运行 `npm run build`，确保 Vite 能正常解析模块 import 并完成生产构建。浏览器验证时，重点看四件事：首次进入是否显示中文在线区域；勾选关闭后刷新页面是否保持关闭；取消勾选后是否重新连接 `wss://myshwsa.ccgxk.com/ws/`；多人同时进入时，好友列表、颜色块和 HUD 人数是否随位置更新。若需要排查线上连接，应优先看控制台中的“我的 ID”“连接 vkSocket 成功！”和“vkSocket 已断开连接。”这些原版日志。
