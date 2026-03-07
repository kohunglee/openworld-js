/**
 * 生成 9000 行 CSV 测试数据
 * 运行: node /Users/kehongli/studio/openworld-js/open-world-zone/plugins/signboard/generate-csv.js
 */

const fs = require('fs');
const path = require('path');

const totalRows = 9000;
const outputPath = path.join(__dirname, 'data.csv');

// 示例内容数组
const contents = [
    '你好山东', '你真棒', '静夜思', '举头望明月', '低头思故乡',
    '春眠不觉晓', '处处闻啼鸟', '夜来风雨声', '花落知多少',
    '白日依山尽', '黄河入海流', '欲穷千里目', '更上一层楼',
    '床前明月光', '疑是地上霜', '春风又绿江南岸', '明月何时照我还',
    '大江东去', '浪淘尽', '千古风流人物', '测试内容', '示例文本'
];

let csv = 'id,target,content,func\n';

for (let i = 1; i <= totalRows; i++) {
    const target = `sign${String(i).padStart(4, '0')}`;  // sign0001 - sign9000
    const content = contents[i % contents.length];
    const func = 1;
    csv += `${i-1},${target},${content},${func}\n`;
}

fs.writeFileSync(outputPath, csv, 'utf-8');
console.log(`已生成 ${totalRows} 行数据到 ${outputPath}`);
