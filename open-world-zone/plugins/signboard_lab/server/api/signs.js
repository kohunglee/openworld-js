/**
 * Signs 信息板数据 API
 * GET  /api/signs        - 读取信息板数据
 * POST /api/signs        - 保存信息板数据
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { sendJson, readBody } from '../helpers.js';
import { broadcast } from '../sse.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SIGNS_FILE = path.join(__dirname, '..', 'signsData.js');

function parseSignsData() {
    const content = fs.readFileSync(SIGNS_FILE, 'utf-8');
    const match = content.trim().match(/export\s+default\s*(\{[\s\S]*\});?\s*$/);
    if (!match) throw new Error('无法解析 signsData.js: 找不到 export default');

    let objStr = match[1];
    // 只给行首的未加引号的 key 加引号（避免影响字符串值内的 URL）
    objStr = objStr.replace(/^(\s*)(\w+)\s*:/gm, '$1"$2":');
    // 移除尾随逗号
    objStr = objStr.replace(/,\s*([}\]])/g, '$1');

    return JSON.parse(objStr);
}

export function handleGetSigns(req, res) {
    try {
        const data = parseSignsData();
        sendJson(res, data);
    } catch (e) {
        console.error('❌ 解析错误:', e);
        sendJson(res, { error: e.message }, 500);
    }
}

export function handleSaveSigns(req, res) {
    readBody(req, body => {
        try {
            const data = JSON.parse(body);
            const jsContent = `/**
 * 信息板数据配置
 * 由 admin.html 自动生成
 */
export default ${JSON.stringify(data, null, 2)};
`;
            fs.writeFileSync(SIGNS_FILE, jsContent, 'utf-8');
            console.log(`✅ 已保存到 ${SIGNS_FILE}`);

            sendJson(res, { success: true, message: '保存成功' });
            broadcast(data);
        } catch (e) {
            sendJson(res, { error: e.message }, 500);
        }
    });
}
