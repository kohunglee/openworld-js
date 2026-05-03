# 文件结构

server.js          # 主入口：HTTP 服务器 + 静态文件 + 路由分发 
helpers.js         # 共享工具：sendJson / readBody       
sse.js             # SSE 管理：客户端连接 / 心跳 / 广播    
api/                                                                                                                           
    signs.js       # Signs API：读取/保存信息板数据      
