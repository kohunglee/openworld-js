/**
 * 服务器错误文案工具
 * ========
 * 目标：前端不“脑补”错误原因，优先展示服务端返回的 message/error。
 */

/**
 * 从 fetch Response 中提取服务端错误文案。
 * 若服务端没给 message/error，则回退为 HTTP 状态码文案。
 * @param {Response} res
 */
export async function readServerErrorMessage(res) {
    let data = null;
    try {
        data = await res.json();
    } catch {
        data = null;
    }
    return data?.message || data?.error || `HTTP ${res.status}`;
}

/**
 * 从异常对象中提取可展示文本。
 * 仅做兜底，不额外拼接推测性语句。
 * @param {unknown} error
 * @param {string} fallback
 */
export function getErrorMessage(error, fallback = '请求失败') {
    if (typeof error === 'string' && error.trim()) return error.trim();
    if (error && typeof error === 'object' && typeof error.message === 'string' && error.message.trim()) {
        return error.message.trim();
    }
    return fallback;
}
