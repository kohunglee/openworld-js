/**
 * Canvas 绘制函数库
 * 由 admin.html 自动生成，请勿手动编辑
 */
export default {
            drawCircle: (ctx, w, h) => {
ctx.fillStyle = '#666';
ctx.beginPath();
ctx.arc(w / 2, h / 2, Math.min(w, h) * 0.3, 0, Math.PI * 2);
ctx.fill();
  },
    drawCross: (ctx, w, h) => {
ctx.strokeStyle = '#999';
ctx.lineWidth = 10;
ctx.beginPath();
ctx.moveTo(w * 0.2, h * 0.2); ctx.lineTo(w * 0.8, h * 0.8);
ctx.moveTo(w * 0.8, h * 0.2); ctx.lineTo(w * 0.2, h * 0.8);
ctx.stroke();
  },
        japan: (ctx, w, h) => {
// TODO: 实现绘制逻辑
ctx.fillStyle = '#f00';
ctx.beginPath();
ctx.arc(w / 2, h / 2, Math.min(w, h) * 0.3, 0, Math.PI * 2);
ctx.fill();
  },
          japanxx: (ctx, w, h) => {
ctx.fillStyle = '#fff'; // 背景色
ctx.fillRect(0, 0, w, h);
ctx.strokeStyle = '#1e3a8a'; // 波浪颜色 (Tailwind blue-900)
ctx.lineWidth = 1;

const r = 70; // 波纹半径，控制疏密
const rows = Math.ceil(h / (r / 2)) + 1;
const cols = Math.ceil(w / (r * 2)) + 1;

for (let i = 0; i < rows; i++) {
  const y = i * r / 2; // 行间距
  const offsetX = (i % 2 === 0) ? 0 : r; // 奇偶行交错
  for (let j = 0; j < cols; j++) {
    const x = j * r * 2 + offsetX; // 列间距
    for (let k = 5; k > 0; k--) { // 每个半圆有5层弧線
      ctx.beginPath();
      // 核心：利用 Math.min 限制半径，防止奇数层覆盖偶数层
      ctx.arc(x, y, (r / 5) * k, Math.PI, Math.PI * 2); // 只画上半圆
      ctx.stroke();
    }
  }
}
  },
};
