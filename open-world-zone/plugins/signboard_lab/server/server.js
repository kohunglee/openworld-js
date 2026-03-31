#!/usr/bin/env node
/**
 * signboard_lab 本地开发服务器 (Node.js 版)
 * 用法: node server.js
 * 然后访问: http://localhost:8899/admin.html
 *
 * 零 npm 依赖，纯 Node.js 原生模块
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { handleGetSigns, handleSaveSigns } from './api/signs.js';
import { handleGetCanvasLib, handleSaveCanvasLib, handleAddCanvasFunc, handleDeleteCanvasFunc } from './api/canvas.js';
import { handleSseStream } from './sse.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = 8899;

// ── 静态文件 MIME 类型 ──

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.js':   'application/javascript; charset=utf-8',
    '.mjs':  'application/javascript; charset=utf-8',
    '.css':  'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png':  'image/png',
    '.jpg':  'image/jpeg',
    '.gif':  'image/gif',
    '.svg':  'image/svg+xml',
    '.ico':  'image/x-icon',
};

function serveStatic(urlPath, res) {
    const filePath = path.join(__dirname, urlPath === '/' ? '/admin.html' : urlPath);

    // 防止路径穿越
    if (!filePath.startsWith(__dirname)) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
    }

    const ext = path.extname(filePath);
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404);
            res.end('Not Found');
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(data);
        }
    });
}

// ── 路由分发 ──

const server = http.createServer((req, res) => {
    const url = new URL(req.url, `http://localhost:${PORT}`);
    const { pathname } = url;
    const method = req.method;

    // API 路由
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
        // 静态文件
        serveStatic(pathname, res);
    }
});

// ── 启动 ──

server.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════╗
║   signboard_lab 开发服务器 (Node.js)       ║
╠════════════════════════════════════════════╣
║   管理页面: http://localhost:${PORT}/admin.html     ║
║   SSE:      http://localhost:${PORT}/api/signs/stream ║
║   API:                                    ║
║     GET/POST  /api/signs                  ║
║     GET/POST  /api/canvas-lib             ║
║     POST      /api/canvas-lib/add         ║
║     DELETE    /api/canvas-lib/<name>      ║
║   按 Ctrl+C 停止服务器                      ║
╚════════════════════════════════════════════╝
`);
});
