/**
 * 渲染器模块
 * 基于 HTML Canvas 的智能文本绘制
 */

import { THEME } from './config.js';

/**
 * 智能文本渲染器（高性能版）
 * 在普通模式和多段落书写模式之间自动切换，
 * 并在可用区域内完成较优字号与断行渲染。
 */
export function drawSmartText(ctx, width, height, text) {
    ctx.fillStyle = THEME.bgWhite; // 先铺背景，避免旧帧残留
    ctx.fillRect(0, 0, width, height);

    const padding = Math.min(width, height) * THEME.paddingRatio; // 统一内边距
    const maxW = width - padding * 2; // 可用宽度
    const maxH = height - padding * 2; // 可用高度
    const maxFS = Math.max(16, (height * 0.15) | 0); // 普通模式最大字号
    const MIN_FS = 12; // 兜底最小字号
    const LINE_RATIO = 1.4; // 行高比例

    if (maxW <= 0 || maxH <= 0) return; // 无可用空间直接返回

    ctx.fillStyle = THEME.textDark;
    ctx.textBaseline = 'middle';

    const PUNCT = new Set('，。、；：！？）》】"\'…—～·'); // 中文排版“标点避头”集合
    const paragraphs = text.split(/\r\n|\r|\n/); // 按换行拆段
    const writingMode = paragraphs.length > 3; // 多段落时走书写模式

    const refFS = writingMode ? MIN_FS : maxFS; // 参考字号（用于宽度缓存缩放）
    const refWidths = new Map(); // 字符宽度缓存

    ctx.font = `600 ${refFS}px ${THEME.fontFamily}`;

    /**
     * 获取字符在参考字号下的宽度（带缓存）
     */
    function refWidth(ch) {
        let w = refWidths.get(ch);
        if (w === undefined) {
            w = ctx.measureText(ch).width;
            refWidths.set(ch, w);
        }
        return w;
    }

    /**
     * 多段落书写模式:
     * 固定较小字号，左对齐，自上而下绘制，并按可见行裁剪。
     */
    function drawWritingMode() {
        const fs = MIN_FS;
        const lh = fs * LINE_RATIO;
        const maxVisibleLines = Math.floor(maxH / lh);

        if (maxVisibleLines <= 0) return;

        ctx.font = `600 ${fs}px ${THEME.fontFamily}`;
        ctx.textAlign = 'left';

        let y = padding + lh * 0.5; // 第一行中线 y
        let drawn = 0; // 已绘制行数

        /**
         * 绘制一行并推进光标；达到可见上限时返回 false
         */
        function drawLine(line) {
            if (drawn >= maxVisibleLines) return false;
            ctx.fillText(line, padding, y);
            y += lh;
            drawn++;
            return true;
        }

        for (let p = 0; p < paragraphs.length; p++) {
            const seg = paragraphs[p];
            let line = '';
            let w = 0;

            for (let i = 0; i < seg.length; i++) {
                const ch = seg[i];
                const cw = refWidth(ch);

                if (w + cw > maxW && line.length > 0) {
                    // 标点避头: 把上一行末字与标点一起带到下一行
                    if (PUNCT.has(ch) && line.length > 1) {
                        const prev = line[line.length - 1];

                        if (!PUNCT.has(prev)) {
                            if (!drawLine(line.slice(0, -1))) return;

                            line = prev + ch;
                            w = refWidth(prev) + cw;
                            continue;
                        }
                    }

                    if (!drawLine(line)) return;

                    line = ch;
                    w = cw;
                } else {
                    line += ch;
                    w += cw;
                }
            }

            if (!drawLine(line)) return;
        }
    }

    /**
     * 普通模式断行器:
     * 在指定字号下按最大宽度拆分行，并应用标点避头策略。
     */
    function breakLines(fontSize) {
        const scale = fontSize / refFS;
        const lines = [];

        for (let p = 0; p < paragraphs.length; p++) {
            const seg = paragraphs[p];
            let line = '';
            let w = 0;

            for (let i = 0; i < seg.length; i++) {
                const ch = seg[i];
                const cw = refWidth(ch) * scale;

                if (w + cw > maxW && line.length > 0) {
                    if (PUNCT.has(ch) && line.length > 1) {
                        const prev = line[line.length - 1];

                        if (!PUNCT.has(prev)) {
                            lines.push(line.slice(0, -1));

                            line = prev + ch;
                            w = refWidth(prev) * scale + cw;
                            continue;
                        }
                    }

                    lines.push(line);
                    line = ch;
                    w = cw;
                } else {
                    line += ch;
                    w += cw;
                }
            }

            lines.push(line);
        }

        return lines;
    }

    if (writingMode) {
        drawWritingMode();
        return;
    }

    let lo = MIN_FS; // 二分左边界
    let hi = maxFS; // 二分右边界
    let bestFS = MIN_FS; // 当前最优字号
    let bestLines = null; // 当前最优断行结果

    while (lo <= hi) {
        const mid = (lo + hi) >> 1;
        const lines = breakLines(mid);

        if (lines.length * mid * LINE_RATIO <= maxH) {
            bestFS = mid;
            bestLines = lines;
            lo = mid + 1;
        } else {
            hi = mid - 1;
        }
    }

    if (!bestLines) {
        bestLines = breakLines(MIN_FS);
        bestFS = MIN_FS;
    }

    const lh = bestFS * LINE_RATIO;

    ctx.font = `600 ${bestFS}px ${THEME.fontFamily}`;
    ctx.textAlign = 'center';

    const cx = width * 0.5; // 居中 x
    let y = (height - bestLines.length * lh) * 0.5 + lh * 0.5; // 首行中线 y

    for (let i = 0; i < bestLines.length; i++) {
        ctx.fillText(bestLines[i], cx, y);
        y += lh;
    }
}
