/**
 * SSE 实时推送管理
 */

const clients = new Set();

export function handleSseStream(req, res) {
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
    });
    res.write(': connected\n\n');
    clients.add(res);
    console.log(`🔗 SSE 客户端已连接 (当前 ${clients.size} 个)`);

    const heartbeat = setInterval(() => {
        try {
            res.write(': heartbeat\n\n');
        } catch {
            removeClient(res);
        }
    }, 15000);

    res.on('close', () => {
        clearInterval(heartbeat);
        removeClient(res);
    });
}

function removeClient(res) {
    if (clients.delete(res)) {
        console.log(`🔌 SSE 客户端已断开 (当前 ${clients.size} 个)`);
    }
}

export function broadcast(data) {
    const msg = `data: ${JSON.stringify(data)}\n\n`;
    for (const client of clients) {
        try {
            client.write(msg);
        } catch {
            clients.delete(client);
        }
    }
    if (clients.size > 0) {
        console.log(`📢 SSE 广播给 ${clients.size} 个客户端`);
    }
}
