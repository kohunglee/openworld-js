/**
 * Canvas 绘图函数库 API
 * GET    /api/canvas-lib          - 读取函数列表
 * POST   /api/canvas-lib          - 保存（更新）单个函数
 * POST   /api/canvas-lib/add      - 新增函数
 * DELETE /api/canvas-lib/<name>   - 删除函数
 */

import { getAllCanvasFunctions, upsertCanvasFunction, deleteCanvasFunction } from '../db/index.js';
import { sendJson, readBody } from '../helpers.js';

// ── GET /api/canvas-lib ──

export function handleGetCanvasLib(req, res) {
  try {
    const funcs = getAllCanvasFunctions();
    // 转换为 { name: code } 格式
    const functions = {};
    for (const f of funcs) {
      functions[f.name] = f.code;
    }
    sendJson(res, { success: true, functions });
  } catch (e) {
    console.error('❌ 读取 canvas-lib 错误:', e);
    sendJson(res, { error: e.message }, 500);
  }
}

// ── POST /api/canvas-lib （更新函数）──

export function handleSaveCanvasLib(req, res) {
  readBody(req, body => {
    try {
      const { name, body: code } = JSON.parse(body);
      if (!name || code == null) {
        sendJson(res, { error: '缺少 name 或 body' }, 400);
        return;
      }

      upsertCanvasFunction(name, code);
      console.log(`✅ 已更新函数 ${name}`);
      sendJson(res, { success: true, message: `函数 ${name} 已更新` });
    } catch (e) {
      sendJson(res, { error: e.message }, 500);
    }
  });
}

// ── POST /api/canvas-lib/add （新增函数）──

export function handleAddCanvasFunc(req, res) {
  readBody(req, body => {
    try {
      const { name } = JSON.parse(body);
      if (!name) {
        sendJson(res, { error: '缺少函数名' }, 400);
        return;
      }
      if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name)) {
        sendJson(res, { error: '函数名只能包含字母、数字和下划线，且不能以数字开头' }, 400);
        return;
      }

      // 检查是否已存在
      const existing = getAllCanvasFunctions().find(f => f.name === name);
      if (existing) {
        sendJson(res, { error: `函数 ${name} 已存在` }, 400);
        return;
      }

      // 创建空函数模板
      const defaultCode = '// TODO: 实现绘制逻辑';
      upsertCanvasFunction(name, defaultCode);
      console.log(`✅ 已新增函数 ${name}`);
      sendJson(res, { success: true, message: `函数 ${name} 已创建` });
    } catch (e) {
      sendJson(res, { error: e.message }, 500);
    }
  });
}

// ── DELETE /api/canvas-lib/<name> （删除函数）──

export function handleDeleteCanvasFunc(req, res, name) {
  try {
    if (!name) {
      sendJson(res, { error: '缺少函数名' }, 400);
      return;
    }

    const decodedName = decodeURIComponent(name);
    deleteCanvasFunction(decodedName);
    console.log(`✅ 已删除函数 ${decodedName}`);
    sendJson(res, { success: true, message: `函数 ${decodedName} 已删除` });
  } catch (e) {
    sendJson(res, { error: e.message }, 500);
  }
}
