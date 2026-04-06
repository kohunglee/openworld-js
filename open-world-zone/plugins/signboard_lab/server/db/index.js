/**
 * SQLite 数据库模块（使用 better-sqlite3 原生绑定）
 * 管理信息板的持久化存储
 *
 * 优势：和 TablePlus 等外部工具共享同一个 SQLite 引擎，
 *       外部修改后 API 即读取到最新数据，无需重启服务器
 */

import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, 'signboard.db');

let db = null;

// ── 初始化数据库 ──

export function initDatabase() {
  db = new Database(DB_PATH);

  // 启用 WAL 模式（支持并发读写，TablePlus 等工具修改后立即可见）
  db.pragma('journal_mode = WAL');

  // 创建表
  db.exec(`
    CREATE TABLE IF NOT EXISTS boards (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      mode TEXT NOT NULL DEFAULT 'text',
      content TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 更新时间触发器
  db.exec(`
    CREATE TRIGGER IF NOT EXISTS boards_updated_at
      AFTER UPDATE ON boards
      BEGIN
        UPDATE boards SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
      END;
  `);

  // ── 迁移：添加 extra 字段（如果不存在）──
  try {
    const columns = db.prepare("PRAGMA table_info(boards)").all();
    const hasExtra = columns.some(col => col.name === 'extra');
    if (!hasExtra) {
      db.exec(`ALTER TABLE boards ADD COLUMN extra TEXT DEFAULT '{}'`);
      console.log('[DB] 已添加 extra 字段');
    }
  } catch (e) {
    console.warn('[DB] extra 字段迁移警告:', e.message);
  }

  // ── 迁移：删除 canvas_functions 表（如果存在）──
  try {
    db.exec(`DROP TABLE IF EXISTS canvas_functions`);
  } catch (e) {
    // 忽略
  }

  console.log('[DB] 数据库已初始化 (WAL 模式)');
}

// ── boards CRUD ──

export function getAllBoards() {
  const stmt = db.prepare('SELECT * FROM boards ORDER BY id');
  return stmt.all();
}

export function getBoardsByIds(ids) {
  if (!ids || ids.length === 0) return [];
  const placeholders = ids.map(() => '?').join(',');
  const stmt = db.prepare(`SELECT * FROM boards WHERE id IN (${placeholders})`);
  return stmt.all(...ids);
}

export function upsertBoard(board) {
  const stmt = db.prepare(`
    INSERT INTO boards (id, name, mode, content, extra) VALUES (@id, @name, @mode, @content, @extra)
    ON CONFLICT(id) DO UPDATE SET name=@name, mode=@mode, content=@content, extra=@extra
  `);
  stmt.run({
    id: board.id,
    name: board.name,
    mode: board.mode,
    content: board.content,
    extra: typeof board.extra === 'string' ? board.extra : JSON.stringify(board.extra || {})
  });
}

export function replaceAllBoards(boards) {
  const run = db.transaction(() => {
    db.prepare('DELETE FROM boards').run();
    const stmt = db.prepare('INSERT INTO boards (id, name, mode, content, extra) VALUES (@id, @name, @mode, @content, @extra)');
    for (const b of boards) stmt.run({
      id: b.id,
      name: b.name,
      mode: b.mode,
      content: b.content,
      extra: b.extra || '{}'
    });
  });
  run();
}

export function deleteBoard(id) {
  db.prepare('DELETE FROM boards WHERE id = ?').run(id);
}

// ── 导出数据库实例 ──

export function getDb() { return db; }

// ── 优雅关闭：checkpoint + 清理 WAL 文件 ──

export function closeDatabase() {
  if (!db) return;

  console.log('[DB] 正在执行 checkpoint...');

  // TRUNCATE 模式：将 WAL 数据写入主库，然后清空 WAL
  db.pragma('wal_checkpoint(TRUNCATE)');

  // 关闭数据库连接
  db.close();
  db = null;

  // 删除 WAL 相关文件（checkpoint 后这些文件已无用了）
  const shmPath = DB_PATH + '-shm';
  const walPath = DB_PATH + '-wal';

  try { fs.unlinkSync(shmPath); console.log('[DB] 已删除', shmPath); } catch (e) { /* 忽略 */ }
  try { fs.unlinkSync(walPath); console.log('[DB] 已删除', walPath); } catch (e) { /* 忽略 */ }

  console.log('[DB] 数据库已安全关闭');
}
