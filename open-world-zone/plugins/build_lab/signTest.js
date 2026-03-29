/**
 * 文本画板 测试 模块 
 */


const THEME = {
    bgWhite: '#ffffff',
    bgWarn: '#ff0000',
    textDark: '#2c3e50',
    fontFamily: '"Microsoft YaHei", sans-serif',
    paddingRatio: 0.1 // 内边距占宽度的比例 (10%)
};

const signContentMap = new Map([
    ['testSign1', '野狗不需要墓碑，奔跑到腐烂即可。'],
    ['testSign2', '这是一段测试文本。三维空间适合做长期结构化知识的栖息地，而不是每一条碎片笔记的唯一入口。利用人类天生强大的空间记忆能力，把抽象信息绑在具体地点上。这是一段测试文本。三维空间适合做长期结构化知识的栖息地，而不是每一条碎片笔记的唯一入口。利用人类天生强大的空间记忆能力，把抽象信息绑在具体地点上。唯一入口。利用人类天生强大的空间记忆能力，把抽象信息绑在具体地点上。'],
    ['welcome_board', '欢迎来到数字禅修空间。在这里，你可以慢慢逛，慢生活。']
]);

// 渲染器
const drawSmartText = (ctx, width, height, text) => {  

    ctx.fillStyle = THEME.bgWhite; //+ 绘制背景
    ctx.fillRect(0, 0, width, height);
    const padding = width * THEME.paddingRatio;
    const maxWidth = width - padding * 2;
    const maxHeight = height - padding * 2;
    let fontSize = Math.max(16, height * 0.15); //+ 初始字体设置
    let lineHeight = fontSize * 1.4;
    ctx.fillStyle = THEME.textDark;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    let lines = [];
    let isFit = false;
    
    while (!isFit && fontSize >= 12) { //+ 字体缩放与换行算法
        ctx.font = `600 ${fontSize}px ${THEME.fontFamily}`;
        lines = [];
        let currentLine = '';

        for (let i = 0; i < text.length; i++) { // 逐字测量，实现精准换行
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
        lines.push(currentLine); // 推入最后一行
        if (lines.length * lineHeight > maxHeight) { // 检查总高度是否超出画布
            fontSize -= 2; // 缩小字体重试
            lineHeight = fontSize * 1.4;
        } else {
            isFit = true; // 找到了合适的尺寸
        }
    }

    const totalTextHeight = lines.length * lineHeight; //+ 执行最终绘制 (垂直居中)
    let startY = (height - totalTextHeight) / 2 + (lineHeight / 2);
    for (const line of lines) {
        ctx.fillText(line, width / 2, startY);
        startY += lineHeight;
    }
};

// --- 渲染插件库 ---
const RenderPlugins = {
    // 格式一：自适应文字 (你之前的逻辑)
    text: (ctx, w, h, data) => {
        const content = signContentMap.get(data.id) || data.t;
        drawSmartText(ctx, w, h, content); // 调用之前写好的排版函数
    },

    // 格式二：自定义 Canvas 程序 (执行一段函数)
    canvas: (ctx, w, h, data, _this) => {
        // 假设 data.draw 是一个预定义的绘图函数名
        const customDraw = CustomCanvasLib[data.drawName]; 
        if (customDraw) customDraw(ctx, w, h, data, _this);
    },

    // 格式三：纯图片
    image: (ctx, w, h, data) => {
        const img = new Image();
        img.src = data.imgUrl; // 数据中自带图片地址
        img.onload = () => ctx.drawImage(img, 0, 0, w, h);
    }
};

// 入口
export default function(instData, ccgxkObj) {
    ccgxkObj.errExpRatio = 200;

    // 挂载 HOOK
    ccgxkObj.hooks.on('errorTexture_diy', function(ctx, width, height, drawItem, _this) {
        const { index, id } = drawItem;
        console.log(index, id, drawItem.t);
        const textContent = signContentMap.get(id) || drawItem.t; // 兼容从 data.js 传来的 t 属性
        if (textContent && textContent !== 'errorTexture_diy') {
            
            drawSmartText(ctx, width, height, textContent);  // 执行智能排版绘制
            ccgxkObj.W.next['T' + index].hidden = false;
            _this.indexToArgs.get(index).isInvisible = false;
            
        } else {
            ctx.fillStyle = THEME.bgWarn; // 未命中，绘制红色警告块
            ctx.fillRect(0, 0, width, height);
        }
    });

    // 将这些画板实例送入档案系统
    ccgxkObj.dataProc.process({
        data: instData,
        name: 'build_lab_signBoard',
        type: 2,           // 存入百数块区域
        model: 'plane',    // 使用平面模型作为墙上的画板
        mixValue: 0.8,
        invisible: false,  // 必须可见
        noIns: true,       // 使用独立纹理，不走实例化渲染
    });
}