/**
 * Signs 信息板数据 API
 * GET  /api/signs          - 读取全部信息板数据
 * POST /api/signs          - 批量保存（admin.html 用）
 * POST /api/signs/batch    - 批量获取（懒加载用）
 * PATCH /api/signs/:id     - 单条更新（signPanel 用）
 */

import { getAllBoards, replaceAllBoards, upsertBoard, getBoardsByIds } from '../db/index.js';
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
        content: b.content,
        extra: b.extra ? JSON.parse(b.extra) : {},
        updated_at: b.updated_at
      }))
    };
    sendJson(res, data);
  } catch (e) {
    console.error('❌ 读取数据库错误:', e);
    sendJson(res, { error: e.message }, 500);
  }
}

// ── POST /api/signs/batch (批量获取) ──

export function handleGetSignsBatch(req, res) {
  readBody(req, body => {
    try {
      const { ids } = JSON.parse(body);
      if (!Array.isArray(ids) || ids.length === 0) {
        sendJson(res, { boards: [] });
        return;
      }

      const boards = getBoardsByIds(ids);
      sendJson(res, {
        boards: boards.map(b => ({
          id: b.id,
          name: b.name,
          mode: b.mode,
          content: b.content,
          extra: b.extra ? JSON.parse(b.extra) : {},
          updated_at: b.updated_at
        }))
      });
    } catch (e) {
      console.error('❌ 批量获取错误:', e);
      sendJson(res, { error: e.message }, 500);
    }
  });
}

// ── POST /api/signs (批量) ──

export function handleSaveSigns(req, res) {
  readBody(req, body => {
    try {
      const data = JSON.parse(body);
      const newBoards = data.boards || [];

      // 获取旧数据，用于对比差异
      const oldBoards = getAllBoards();
      const oldMap = new Map(oldBoards.map(b => [b.id, b]));

      // 找出变化的 boards
      const changedBoards = [];
      for (const nb of newBoards) {
        const ob = oldMap.get(nb.id);
        const oldExtra = ob?.extra ? JSON.parse(ob.extra) : {};
        const newExtra = nb.extra || {};

        // 检测是否有变化（name, mode, content, extra 任一变化）
        if (!ob ||
            ob.name !== nb.name ||
            ob.mode !== nb.mode ||
            ob.content !== nb.content ||
            JSON.stringify(oldExtra) !== JSON.stringify(newExtra)) {
          changedBoards.push({
            id: nb.id,
            name: nb.name || nb.id,
            mode: nb.mode || 'text',
            content: nb.content || '',
            extra: newExtra
          });
        }
      }

      // 批量替换
      replaceAllBoards(newBoards.map(b => ({
        id: b.id,
        name: b.name,
        mode: b.mode,
        content: b.content,
        extra: b.extra || {}
      })));

      console.log(`✅ 已保存 ${newBoards.length} 个信息板到数据库，变化 ${changedBoards.length} 条`);
      sendJson(res, { success: true, message: '保存成功', changed: changedBoards.length });

      // SSE 只广播变化的 boards（不再广播全部！）
      if (changedBoards.length > 0) {
        broadcast({ boards: changedBoards });
      }
    } catch (e) {
      sendJson(res, { error: e.message }, 500);
    }
  });
}

// ── PATCH /api/signs/:id (单条) ──

export function handleUpdateOneBoard(req, res, id) {
  readBody(req, body => {
    try {
      const data = JSON.parse(body);
      const board = {
        id: id,
        name: data.name || id,
        mode: data.mode || 'text',
        content: data.content || '',
        extra: data.extra || {}
      };

      upsertBoard(board);
      console.log(`✅ 已更新信息板: ${id}`);

      sendJson(res, { success: true, message: '更新成功' });

      // SSE 广播单条变化（格式与全量一致，hotUpdate handler 能直接处理）
      broadcast({ boards: [{ ...board, extra: board.extra }] });
    } catch (e) {
      sendJson(res, { error: e.message }, 500);
    }
  });
}
