/**
 * 渲染器模块
 * 智能文本绘制 + Canvas 绘制
 */

import { THEME } from './config.js';

/**
 * 智能文本渲染器
 * 自动计算字体大小、换行、垂直居中
 * 多行时左对齐+整体居中，避免标点在行首
 */
export function drawSmartText(ctx, width, height, text) {
    ctx.fillStyle = THEME.bgWhite;
    ctx.fillRect(0, 0, width, height);
    const padding = Math.min(width, height) * THEME.paddingRatio;  // 取小边的 padding
    const maxWidth = width - padding * 2;
    const maxHeight = height - padding * 2;
    let fontSize = Math.max(16, height * 0.15);
    let lineHeight = fontSize * 1.4;
    ctx.fillStyle = THEME.textDark;
    ctx.textBaseline = 'middle';
    const noLineStartPunctuation = '，。、；：！？）》】"\'…—～·'; // 不应该出现在行首的标点符号
    let lines = [];
    let isFit = false;

    // 字体缩放与换行算法
    while (!isFit && fontSize >= 12) {
        ctx.font = `600 ${fontSize}px ${THEME.fontFamily}`;
        lines = [];
        let currentLine = '';
        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            if (char === '\n') {
                lines.push(currentLine);
                currentLine = '';
                continue;
            }
            const testLine = currentLine + char;
            const metrics = ctx.measureText(testLine);
            if (metrics.width > maxWidth && i > 0) {
                
                const nextChar = text[i]; // 检查下一个字符是否是不能在行首的标点
                if (noLineStartPunctuation.includes(nextChar)) {
                    if (currentLine.length > 1) { // 但如果当前行只有一个字，就直接换行
                        const lastChar = currentLine[currentLine.length - 1];
                        if (!noLineStartPunctuation.includes(lastChar)) { // 检查最后一个字是否也是标点（如果是，就不用管了）
                            lines.push(currentLine.slice(0, -1));
                            currentLine = lastChar + char;
                        } else {
                            lines.push(currentLine);
                            currentLine = char;
                        }
                    } else {
                        lines.push(currentLine);
                        currentLine = char;
                    }
                } else {
                    lines.push(currentLine);
                    currentLine = char;
                }
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

    const isMultiLine = lines.length > 3; // 根据行数决定对齐方式
    if (isMultiLine) { // 多行模式：左上角排版
        ctx.textAlign = 'left';
        let startY = padding + (lineHeight / 2);
        for (const line of lines) {
            ctx.fillText(line, padding, startY);
            startY += lineHeight;
        }
    } else {  // 少行模式（每行居中）
        ctx.textAlign = 'center';
        const totalTextHeight = lines.length * lineHeight;
        let startY = (height - totalTextHeight) / 2 + (lineHeight / 2);
        for (const line of lines) {
            ctx.fillText(line, width / 2, startY);
            startY += lineHeight;
        }
    }
}

