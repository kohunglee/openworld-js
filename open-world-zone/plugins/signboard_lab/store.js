/**
 * 数据存储模块（前端 3D 引擎）
 * 从 API 加载数据，支持热更新
 */

import { API_BASE } from './config.js';

// ── 内容映射 ──

export const signContentMap = new Map();   // id → { mode, t/imgUrl/drawName }
export const signIndexMap = new Map();     // id → { index }

// ── Canvas 函数库 ──

export const canvasFunctions = new Map();  // name → code

// ── 引擎引用（需 getter/setter）──

let _ccgxkObj = null;
let _textureModule = null;

export function getCcgxkObj() { return _ccgxkObj; }
export function setCcgxkObj(obj) { _ccgxkObj = obj; }
export function getTextureModule() { return _textureModule; }
export function setTextureModule(mod) { _textureModule = mod; }

// ── 初始化：从 API 加载数据 ──

let initPromise = null;

export async function initData() {
    if (initPromise) return initPromise;

    initPromise = (async () => {
        try {
            // 并行加载 boards 和 canvas functions
            const [boardsRes, canvasRes] = await Promise.all([
                fetch(`${API_BASE}/api/signs`),
                fetch(`${API_BASE}/api/canvas-lib`)
            ]);

            // 处理 boards
            if (boardsRes.ok) {
                const data = await boardsRes.json();
                if (data.boards) {
                    for (const board of data.boards) {
                        if (board.mode === 'text') {
                            signContentMap.set(board.id, { mode: 'text', t: board.content });
                        } else if (board.mode === 'image') {
                            signContentMap.set(board.id, { mode: 'image', imgUrl: board.content });
                        } else if (board.mode === 'canvas') {
                            signContentMap.set(board.id, { mode: 'canvas', drawName: board.content });
                        }
                    }
                    console.log(`[Store] 已加载 ${data.boards.length} 个信息板`);
                }
            }

            // 处理 canvas functions
            if (canvasRes.ok) {
                const data = await canvasRes.json();
                if (data.functions) {
                    for (const [name, code] of Object.entries(data.functions)) {
                        canvasFunctions.set(name, code);
                    }
                    console.log(`[Store] 已加载 ${canvasFunctions.size} 个 Canvas 函数`);
                }
            }
        } catch (e) {
            console.error('[Store] 初始化失败:', e);
        }
    })();

    return initPromise;
}

// ── 获取 Canvas 函数（编译后的）──

export function getCanvasFunction(name) {
    const code = canvasFunctions.get(name);
    if (!code) return null;
    try {
        return new Function('ctx', 'w', 'h', code);
    } catch (e) {
        console.error(`[Store] 函数 ${name} 编译失败:`, e);
        return null;
    }
}
