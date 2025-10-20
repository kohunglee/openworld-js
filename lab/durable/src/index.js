// =================================================================
// 设计图：我们的“魔法白板”（JSON API 版本）
// =================================================================
export class ChatRoom {
  constructor(state, env) {
    this.state = state;
    // Map 的 Key 依然是 WebSocket 连接，但 Value 变成了结构化的用户信息对象
    this.sessions = new Map();
  }

  async fetch(request) {
    const location = {
      country: request.headers.get('X-CF-Country') || '未知国家',
      region: request.headers.get('X-CF-Region') || '未知地区',
      city: request.headers.get('X-CF-City') || '未知城市',
    };
    const userIp = request.headers.get('X-Real-IP') || 'IP Not Found';
    const upgradeHeader = request.headers.get('Upgrade');
    if (!upgradeHeader || upgradeHeader !== 'websocket') {
      return new Response('需要一个 WebSocket 升级请求', { status: 426 });
    }
    const webSocketPair = new WebSocketPair();
    const { 0: client, 1: server } = webSocketPair;

    this.handleSession(server, location, userIp);

    return new Response(null, { status: 101, webSocket: client });
  }

  handleSession(serverSocket, location, userIp) {
    serverSocket.accept();
    
    // 为每个新连接生成一个简单的唯一 ID
    const sessionId = crypto.randomUUID();
    const locationString = `${location.country}, ${location.region}, ${location.city}`;
    
    // 创建并存储结构化的用户信息
    const sessionData = {
      id: sessionId,
      location: locationString,
      ip: userIp,
      rid: 0,
      content: '',
    };
    this.sessions.set(serverSocket, sessionData);

    console.log(`New connection: ${JSON.stringify(sessionData)}`);
    
    // 新用户连接后，立刻广播一次，让所有人知道他来了
    this.broadcast();

    // 监听用户发来的消息
    serverSocket.addEventListener('message', async (event) => {
      try {
        // 我们约定，客户端发来的也必须是 JSON，并且只包含 text 字段
        const incomingData = JSON.parse(event.data);
        
        // 更新这个用户的文本
        const currentSession = this.sessions.get(serverSocket);
        if (currentSession && typeof incomingData.content === 'string') {
          currentSession.content = incomingData.content;
          currentSession.rid = incomingData.rid || 0;
          this.broadcast();
        }
      } catch (e) {
        console.error("Failed to parse incoming JSON:", event.data);
      }
    });

    // 监听用户断开连接
    serverSocket.addEventListener('close', () => {
      this.sessions.delete(serverSocket);
      // 用户离开后也要广播，以便前端更新列表
      this.broadcast();
    });
  }

  // 【核心改造】广播 JSON 数据
  broadcast() {
    // 1. 从 Map 的 Values 中提取所有用户信息对象，构成一个数组
    const usersArray = [...this.sessions.values()];
    
    // 2. 将整个用户列表包装在一个顶层对象中
    const payload = {
      users: usersArray,
    };
    
    // 3. 将这个对象转换为 JSON 字符串
    const jsonString = JSON.stringify(payload);

    // 4. 将这个 JSON 字符串发送给每一个连接的用户
    for (const session of this.sessions.keys()) {
      session.send(jsonString);
    }
  }
}

// "普通员工"部分保持不变，继续传递地理位置头部
export default {
  async fetch(request, env) {
    const geo = request.cf || {};
    let id = env.CHAT_ROOM.idFromName("shared-whiteboard");
    let durableObjectStub = env.CHAT_ROOM.get(id);
    const newHeaders = new Headers(request.headers);
    newHeaders.set('X-CF-Country', geo.country);
    newHeaders.set('X-CF-Region', geo.region);
    newHeaders.set('X-CF-City', geo.city);
    return durableObjectStub.fetch(new Request(request.url, {
        method: request.method,
        headers: newHeaders,
        body: request.body,
        redirect: request.redirect
    }));
  },
};