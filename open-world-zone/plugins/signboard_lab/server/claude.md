# 文件结构

server.js          # 主入口：HTTP 服务器 + 静态文件 + 路由分发 
helpers.js         # 共享工具：sendJson / readBody       
api/                                                                                                                           
    signs.js       # Signs API：读取/保存信息板数据      

说明：2026-05-03 已移除 SSE 长连接，服务端只保留普通 HTTP API；客户端保存后本地刷新，HotInfo 手动刷新当前画板。
