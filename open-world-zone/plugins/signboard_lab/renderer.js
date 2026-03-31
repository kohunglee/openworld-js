/**
 * 渲染器模块
 * 智能文本绘制 + Canvas 绘制
 */

import { THEME } from './config.js';
import CustomCanvasLib from './server/CustomCanvasLib.js';

/**
 * 智能文本渲染器
 * 自动计算字体大小、换行、垂直居中
 */
export function drawSmartText(ctx, width, height, text) {
    ctx.fillStyle = THEME.bgWhite;
    ctx.fillRect(0, 0, width, height);

    const padding = width * THEME.paddingRatio;
    const maxWidth = width - padding * 2;
    const maxHeight = height - padding * 2;
    let fontSize = Math.max(16, height * 0.15);
    let lineHeight = fontSize * 1.4;

    ctx.fillStyle = THEME.textDark;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    let lines = [];
    let isFit = false;

    // 字体缩放与换行算法
    while (!isFit && fontSize >= 12) {
        ctx.font = `600 ${fontSize}px ${THEME.fontFamily}`;
        lines = [];
        let currentLine = '';

        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            const testLine = currentLine + char;
            const metrics = ctx.measureText(testLine);
            if (metrics.width > maxWidth && i > 0) {
                lines.push(currentLine);
                currentLine = char;
            } else {
                currentLine = testLine;
            }
        }
        lines.push(currentLine);

        if (lines.length * lineHeight > maxHeight) {
            fontSize -= 2;
            lineHeight = fontSize * 1.4;
        } else {
            isFit = true;
        }
    }

    // 垂直居中绘制
    const totalTextHeight = lines.length * lineHeight;
    let startY = (height - totalTextHeight) / 2 + (lineHeight / 2);

    for (const line of lines) {
        ctx.fillText(line, width / 2, startY);
        startY += lineHeight;
    }
}

/**
 * Canvas 模式渲染器
 */
export function drawCanvasMode(ctx, width, height, drawName) {
    ctx.fillStyle = THEME.bgWhite;
    ctx.fillRect(0, 0, width, height);
    const drawFunc = CustomCanvasLib[drawName];
    if (drawFunc) {
        drawFunc(ctx, width, height);
    }
}
