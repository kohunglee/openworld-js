/**
 * Canvas 绘图函数库 API
 * GET    /api/canvas-lib          - 读取函数列表
 * POST   /api/canvas-lib          - 保存（更新）单个函数
 * POST   /api/canvas-lib/add      - 新增函数
 * DELETE /api/canvas-lib/<name>   - 删除函数
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { sendJson, readBody } from '../helpers.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CANVAS_LIB_FILE = path.join(__dirname, '..', 'CustomCanvasLib.js');

/**
 * 解析 CustomCanvasLib.js，提取所有函数名和函数体
 */
function parseCanvasLib() {
    const content = fs.readFileSync(CANVAS_LIB_FILE, 'utf-8');
    const match = content.trim().match(/export\s+default\s*(\{[\s\S]*\});?\s*$/);
    if (!match) throw new Error('无法解析 CustomCanvasLib.js');

    const objStr = match[1];
    const funcs = {};
    const pattern = /(\w+)\s*:\s*(?:function\s*)?\([^)]*\)\s*=>?\s*\{/g;
    let m;
    while ((m = pattern.exec(objStr)) !== null) {
        const funcName = m[1];
        const start = m.index + m[0].length;
        let braceCount = 1;
        let i = start;
        while (i < objStr.length && braceCount > 0) {
            if (objStr[i] === '{') braceCount++;
            else if (objStr[i] === '}') braceCount--;
            i++;
        }
        funcs[funcName] = objStr.slice(start, i - 1).trim();
    }
    return funcs;
}

/**
 * 在完整文件内容中定位某个函数的范围 {start, end}
 */
function findFuncRange(content, funcName) {
    const pattern = new RegExp(`${funcName}\\s*:\\s*(?:function\\s*)?\\([^)]*\\)\\s*=>?\\s*\\{`);
    const match = pattern.exec(content);
    if (!match) return null;
    let braceCount = 1;
    let i = match.index + match[0].length;
    while (i < content.length && braceCount > 0) {
        if (content[i] === '{') braceCount++;
        else if (content[i] === '}') braceCount--;
        i++;
    }
    return { start: match.index, end: i };
}

// ── GET /api/canvas-lib ──

export function handleGetCanvasLib(req, res) {
    try {
        const funcs = parseCanvasLib();
        sendJson(res, { success: true, functions: funcs });
    } catch (e) {
        console.error('❌ 解析 canvas-lib 错误:', e);
        sendJson(res, { error: e.message }, 500);
    }
}

// ── POST /api/canvas-lib （更新函数）──

export function handleSaveCanvasLib(req, res) {
    readBody(req, body => {
        try {
            const { name: funcName, body: funcBody } = JSON.parse(body);
            if (!funcName || funcBody == null) {
                sendJson(res, { error: '缺少 name 或 body' }, 400);
                return;
            }

            const content = fs.readFileSync(CANVAS_LIB_FILE, 'utf-8');
            const range = findFuncRange(content, funcName);
            if (!range) {
                sendJson(res, { error: `函数 ${funcName} 不存在` }, 404);
                return;
            }

            // 检查函数后面是否有逗号
            const afterFunc = content.slice(range.end).trimStart();
            const hasComma = afterFunc.startsWith(',');

            const newFunc = `  ${funcName}: (ctx, w, h) => {\n${funcBody}\n  },`;
            const newContent = content.slice(0, range.start) + newFunc + content.slice(range.end + (hasComma ? 1 : 0));

            fs.writeFileSync(CANVAS_LIB_FILE, newContent, 'utf-8');
            console.log(`✅ 已更新函数 ${funcName}`);
            sendJson(res, { success: true, message: `函数 ${funcName} 已更新` });
        } catch (e) {
            sendJson(res, { error: e.message }, 500);
        }
    });
}

// ── POST /api/canvas-lib/add （新增函数）──

export function handleAddCanvasFunc(req, res) {
    readBody(req, body => {
        try {
            const { name: funcName } = JSON.parse(body);
            if (!funcName) {
                sendJson(res, { error: '缺少函数名' }, 400);
                return;
            }
            if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(funcName)) {
                sendJson(res, { error: '函数名只能包含字母、数字和下划线，且不能以数字开头' }, 400);
                return;
            }

            let content = fs.readFileSync(CANVAS_LIB_FILE, 'utf-8');

            if (new RegExp(`${funcName}\\s*:`).test(content)) {
                sendJson(res, { error: `函数 ${funcName} 已存在` }, 400);
                return;
            }

            // 在 export default { 后插入新函数
            const match = content.match(/export\s+default\s*\{/);
            if (match) {
                let braceCount = 1;
                let i = match.index + match[0].length;
                while (i < content.length && braceCount > 0) {
                    if (content[i] === '{') braceCount++;
                    else if (content[i] === '}') braceCount--;
                    i++;
                }
                const endBrace = i - 1;
                let prefix = content.slice(0, endBrace).trimEnd();
                if (!prefix.endsWith(',')) prefix += ',';
                const newFunc = `  ${funcName}: (ctx, w, h) => {\n    // TODO: 实现绘制逻辑\n  }`;
                content = prefix + '\n' + newFunc + ',\n' + content.slice(endBrace);
            }

            fs.writeFileSync(CANVAS_LIB_FILE, content, 'utf-8');
            console.log(`✅ 已新增函数 ${funcName}`);
            sendJson(res, { success: true, message: `函数 ${funcName} 已创建` });
        } catch (e) {
            sendJson(res, { error: e.message }, 500);
        }
    });
}

// ── DELETE /api/canvas-lib/<name> （删除函数）──

export function handleDeleteCanvasFunc(req, res, funcName) {
    try {
        if (!funcName) {
            sendJson(res, { error: '缺少函数名' }, 400);
            return;
        }

        let content = fs.readFileSync(CANVAS_LIB_FILE, 'utf-8');
        const range = findFuncRange(content, funcName);
        if (!range) {
            sendJson(res, { error: `函数 ${funcName} 不存在` }, 404);
            return;
        }

        let before = content.slice(0, range.start);
        let after = content.slice(range.end);

        // 处理逗号
        if (before.trimEnd().endsWith(',')) {
            before = before.trimEnd().slice(0, -1);
        } else if (after.trimStart().startsWith(',')) {
            after = after.trimStart().slice(1);
        }

        fs.writeFileSync(CANVAS_LIB_FILE, before + after, 'utf-8');
        console.log(`✅ 已删除函数 ${funcName}`);
        sendJson(res, { success: true, message: `函数 ${funcName} 已删除` });
    } catch (e) {
        sendJson(res, { error: e.message }, 500);
    }
}
