/**
 * Signs 信息板数据 API
 * GET  /api/signs        - 读取信息板数据
 * POST /api/signs        - 保存信息板数据
 */

import { getAllBoards, replaceAllBoards } from '../db/index.js';
import { sendJson, readBody } from '../helpers.js';
import { broadcast } from '../sse.js';

// ── GET /api/signs ──

export function handleGetSigns(req, res) {
  try {
    const boards = getAllBoards();
    // 转换为前端期望的格式
    const data = {
      version: 1,
      boards: boards.map(b => ({
        id: b.id,
        name: b.name,
        mode: b.mode,
        content: b.content
      }))
    };
    sendJson(res, data);
  } catch (e) {
    console.error('❌ 读取数据库错误:', e);
    sendJson(res, { error: e.message }, 500);
  }
}

// ── POST /api/signs ──

export function handleSaveSigns(req, res) {
  readBody(req, body => {
    try {
      const data = JSON.parse(body);
      const boards = data.boards || [];

      // 批量替换
      replaceAllBoards(boards.map(b => ({
        id: b.id,
        name: b.name,
        mode: b.mode,
        content: b.content
      })));

      console.log(`✅ 已保存 ${boards.length} 个信息板到数据库`);
      sendJson(res, { success: true, message: '保存成功' });

      // SSE 广播
      broadcast(data);
    } catch (e) {
      sendJson(res, { error: e.message }, 500);
    }
  });
}
