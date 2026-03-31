/**
 * 数据存储模块
 * 管理映射等相关的
 */

import signsData from './server/signsData.js';

// ── 内容映射 ──
export const signContentMap = new Map();   // id → { mode, t/imgUrl/drawName }
export const signIndexMap = new Map();     // id → { index }

// ── 引擎引用（需 getter/setter）──
let _ccgxkObj = null;
let _textureModule = null;

export function getCcgxkObj() { return _ccgxkObj; }
export function setCcgxkObj(obj) { _ccgxkObj = obj; }
export function getTextureModule() { return _textureModule; }
export function setTextureModule(mod) { _textureModule = mod; }

// ── 初始化：从 signsData.js 提取数据 ──
signsData.boards.forEach(board => {
    if (board.mode === 'text') {
        signContentMap.set(board.id, { mode: 'text', t: board.content });
    } else if (board.mode === 'image') {
        signContentMap.set(board.id, { mode: 'image', imgUrl: board.content });
    } else if (board.mode === 'canvas') {
        signContentMap.set(board.id, { mode: 'canvas', drawName: board.content });
    }
});
