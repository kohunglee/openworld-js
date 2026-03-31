#!/usr/bin/env node
/**
 * signboard_lab 纯 API 服务器 (Node.js 版)
 * 用法: node server.js
 *
 * 注意：静态文件由主项目的 HTTP 服务器提供
 * admin.html 访问地址: http://localhost:8089/plugins/signboard_lab/server/admin.html
 */

import http from 'http';

import { handleGetSigns, handleSaveSigns } from './api/signs.js';
import { handleGetCanvasLib, handleSaveCanvasLib, handleAddCanvasFunc, handleDeleteCanvasFunc } from './api/canvas.js';
import { handleSseStream } from './sse.js';

const PORT = 8899;

// CORS 预检响应
function handlePreflight(req, res) {
    res.writeHead(204, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400',
    });
    res.end();
}

const server = http.createServer((req, res) => {
    const url = new URL(req.url, `http://localhost:${PORT}`);
    const { pathname } = url;
    const method = req.method;

    // CORS 预检请求（浏览器发 POST 前会先发 OPTIONS）
    if (method === 'OPTIONS') {
        return handlePreflight(req, res);
    }

    // 只处理 API 路由
    if (method === 'GET' && pathname === '/api/signs') {
        console.log(`📡 GET /api/signs`);
        handleGetSigns(req, res);
    } else if (method === 'GET' && pathname === '/api/signs/stream') {
        handleSseStream(req, res);
    } else if (method === 'GET' && pathname === '/api/canvas-lib') {
        console.log(`📡 GET /api/canvas-lib`);
        handleGetCanvasLib(req, res);
    } else if (method === 'POST' && pathname === '/api/signs') {
        console.log(`📡 POST /api/signs`);
        handleSaveSigns(req, res);
    } else if (method === 'POST' && pathname === '/api/canvas-lib/add') {
        console.log(`📡 POST /api/canvas-lib/add`);
        handleAddCanvasFunc(req, res);
    } else if (method === 'POST' && pathname === '/api/canvas-lib') {
        console.log(`📡 POST /api/canvas-lib`);
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

server.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════╗
║   signboard_lab 纯 API 服务器 (Node.js)     ║
╠════════════════════════════════════════════╣
║   API 地址: http://localhost:${PORT}              ║
║   管理页面: 由主项目 HTTP 服务器提供         ║
║     → http://localhost:8089/plugins/       ║
║       signboard_lab/server/admin.html      ║
║                                          ║
║   API 端点:                               ║
║     GET/POST  /api/signs                  ║
║     GET       /api/signs/stream (SSE)     ║
║     GET/POST  /api/canvas-lib             ║
║     POST      /api/canvas-lib/add         ║
║     DELETE    /api/canvas-lib/<name>      ║
║   按 Ctrl+C 停止服务器                      ║
╚════════════════════════════════════════════╝
`);
});
