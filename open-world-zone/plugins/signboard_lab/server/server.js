#!/usr/bin/env node
/**
 * signboard_lab 纯 API 服务器 (Node.js + SQLite)
 * 用法: node server.js
 *
 * 静态文件由主项目 HTTP 服务器提供
 * admin.html: http://localhost:8089/plugins/signboard_lab/server/admin.html
 */

import http from 'http';
import { initDatabase, closeDatabase } from './db/index.js';
import { handleGetSigns, handleSaveSigns, handleUpdateOneBoard } from './api/signs.js';
import { handleGetCanvasLib, handleSaveCanvasLib, handleAddCanvasFunc, handleDeleteCanvasFunc } from './api/canvas.js';
import { handleSseStream, closeAllClients } from './sse.js';

const PORT = 8899;

// CORS 预检
function handlePreflight(req, res) {
    res.writeHead(204, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400',
    });
    res.end();
}

// 路由
function createServer() {
    return http.createServer((req, res) => {
        const url = new URL(req.url, `http://localhost:${PORT}`);
        const { pathname } = url;
        const method = req.method;

        if (method === 'OPTIONS') return handlePreflight(req, res);

        if (method === 'GET' && pathname === '/api/signs') {
            console.log('📡 GET /api/signs');
            handleGetSigns(req, res);
        } else if (method === 'GET' && pathname === '/api/signs/stream') {
            handleSseStream(req, res);
        } else if (method === 'GET' && pathname === '/api/canvas-lib') {
            console.log('📡 GET /api/canvas-lib');
            handleGetCanvasLib(req, res);
        } else if (method === 'POST' && pathname === '/api/signs') {
            console.log('📡 POST /api/signs');
            handleSaveSigns(req, res);
        } else if (method === 'PATCH' && pathname.startsWith('/api/signs/')) {
            const boardId = decodeURIComponent(pathname.slice('/api/signs/'.length));
            console.log(`📡 PATCH /api/signs/${boardId}`);
            handleUpdateOneBoard(req, res, boardId);
        } else if (method === 'POST' && pathname === '/api/canvas-lib/add') {
            console.log('📡 POST /api/canvas-lib/add');
            handleAddCanvasFunc(req, res);
        } else if (method === 'POST' && pathname === '/api/canvas-lib') {
            console.log('📡 POST /api/canvas-lib');
            handleSaveCanvasLib(req, res);
        } else if (method === 'DELETE' && pathname.startsWith('/api/canvas-lib/')) {
            const funcName = pathname.slice('/api/canvas-lib/'.length);
            console.log(`📡 DELETE /api/canvas-lib/${funcName}`);
            handleDeleteCanvasFunc(req, res, decodeURIComponent(funcName));
        } else {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Not Found' }));
        }
    });
}

// 启动流程
function main() {
    console.log('[DB] 正在初始化 SQLite...');
    initDatabase();

    const server = createServer();
    server.listen(PORT, () => {
        console.log(`
╔════════════════════════════════════════════╗
║   signboard_lab API 服务器 (Node.js+SQLite) ║
╠════════════════════════════════════════════╣
║   API:  http://localhost:${PORT}                ║
║   数据库: signboard.db                      ║
║                                          ║
║   管理页面:                               ║
║   http://localhost:8089/plugins/          ║
║     signboard_lab/server/admin.html       ║
║                                          ║
║   API 端点:                               ║
║     GET/POST  /api/signs                  ║
║     GET       /api/signs/stream (SSE)     ║
║     GET/POST  /api/canvas-lib             ║
║     POST      /api/canvas-lib/add         ║
║     DELETE    /api/canvas-lib/<name>      ║
║                                          ║
║   Ctrl+C 停止                              ║
╚════════════════════════════════════════════╝
`);
    });

    // 优雅关闭
    const shutdown = () => {
        console.log('\n[Server] 正在关闭...');
        closeAllClients();  // 先断开 SSE 长连接
        server.close(() => {
            closeDatabase();
            console.log('[Server] 已安全停止');
            process.exit(0);
        });
    };

    process.on('SIGINT', shutdown);   // Ctrl+C
    process.on('SIGTERM', shutdown);  // kill 命令
}

try {
    main();
} catch (err) {
    console.error('启动失败:', err);
    process.exit(1);
}
