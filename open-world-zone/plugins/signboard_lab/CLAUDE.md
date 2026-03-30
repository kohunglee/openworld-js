# build_lab 插件开发文档

## 项目概述

`build_lab` 是一个用于 OpenWorld 3D 引擎的信息板管理插件，允许用户在 3D 场景中创建和管理可交互的信息展示板。支持三种显示模式：**文字**、**图片**、**Canvas 绘制函数**。

---

## 核心文件说明

```
build_lab/
├── build_lab.js       # 主入口，处理 3D 场景数据和颜色涂装
├── signTest.js        # 信息板渲染核心逻辑，支持 text/image/canvas 三种模式
├── signsData.js       # 信息板数据配置（由 admin.html 自动生成）
├── CustomCanvasLib.js # Canvas 绘制函数库（可在网页端编辑）
├── data.js            # 3D 场景基础数据
├── admin.html         # Web 管理界面（信息板编辑 + Canvas 函数库编辑）
├── server.py          # Python 本地开发服务器（端口 8899）
└── css/tailwind.min.js
```

---

## 快速启动

```bash
cd /Users/kehongli/studio/openworld-js/open-world-zone/plugins/build_lab

# 启动服务器
python3 server.py

# 访问管理页面
# http://localhost:8899/admin.html
```

---

## API 接口

服务器提供以下 API：

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/signs` | 获取信息板数据 |
| POST | `/api/signs` | 保存信息板数据 |
| GET | `/api/canvas-lib` | 获取 Canvas 函数列表 |
| POST | `/api/canvas-lib` | 保存单个函数代码 |
| POST | `/api/canvas-lib/add` | 新增绘制函数 |
| DELETE | `/api/canvas-lib/<name>` | 删除绘制函数 |

---

## 信息板数据结构 (signsData.js)

```javascript
export default {
  "version": 1,
  "boards": [
    {
      "id": "testSign1",        // 唯一标识，与 3D 场景中的 t 属性对应
      "name": "左侧墙面",        // 显示名称
      "mode": "text",           // 模式: text | image | canvas
      "content": "文字内容..."   // text: 文字; image: URL; canvas: 函数名
    }
  ]
}
```

---

## Canvas 绘制函数 (CustomCanvasLib.js)

### 函数签名

所有绘制函数接收三个参数：
- `ctx` - Canvas 2D 上下文
- `w` - 画布宽度
- `h` - 画布高度

### 示例

```javascript
export default {
  drawCircle: (ctx, w, h) => {
    ctx.fillStyle = '#b9e73c';
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
  }
};
```

### 编辑方式

1. 访问 http://localhost:8899/admin.html
2. 切换到「Canvas 函数库」Tab
3. 点击左侧函数名，右侧显示代码编辑器
4. 编辑后点击「保存」或按 `Cmd+S`
5. 预览区实时显示绘制效果

---

## 渲染流程 (signTest.js)

```
┌─────────────────────────────────────────────────────────┐
│  signsData.js  →  signContentMap (Map)                  │
│                          ↓                              │
│  errorTexture_diy Hook 触发                             │
│                          ↓                              │
│  ┌─────────────────────────────────────────────────┐   │
│  │  mode: 'text'   →  drawSmartText()             │   │
│  │  mode: 'image'  →  动态创建 <img> + 更新纹理    │   │
│  │  mode: 'canvas' →  CustomCanvasLib[funcName]()  │   │
│  └─────────────────────────────────────────────────┘   │
│                          ↓                              │
│  ccgxkObj.dataProc.process() → 渲染到 3D 场景          │
└─────────────────────────────────────────────────────────┘
```

### 关键代码片段

```javascript
// signTest.js 第 77-94 行（原硬编码位置，现已提取为独立文件）
import CustomCanvasLib from './CustomCanvasLib.js';

// 渲染 canvas 模式
if (type === 'canvas') {
  ctx.fillStyle = THEME.bgWhite;
  ctx.fillRect(0, 0, width, height);
  const drawFunc = CustomCanvasLib[textInfo.drawName];
  if (drawFunc) { drawFunc(ctx, width, height); }
}
```

---

## 3D 场景索引 (build_lab.js)

```javascript
const INDICES = {
  floor: [4, 6, 0, 2, 3, 7, 19, 17, 22, 21, 18, 20, 44, 43, 42, 45, 39, 40, 38, 37, 35, 36, 102],
  decorations: [49, 48, 47],
  signBoard: [107, 108, 109, 110, 111],  // 信息板对应的场景索引
};
```

信息板 ID 映射：
- `testSign1` ← 索引 107
- `testSign2` ← 索引 108
- `testSign3` ← 索引 109
- `testSign4` ← 索引 110
- `testSign5` ← 索引 111

---

## 常见问题

### 1. 端口被占用

```bash
# 查找占用进程
lsof -i :8899

# 终止进程
kill <PID>
```

### 2. 修改后 3D 场景未更新

1. 确保点击了「保存到文件」
2. 刷新 3D 页面（信息板纹理会重新生成）

### 3. Canvas 函数报错

- 检查函数名是否正确（只允许字母、数字、下划线）
- 检查代码语法（编辑器有实时预览，红色表示错误）
- 确保函数体使用正确的 `ctx` API

### 4. 图片模式不显示

- 检查 URL 是否可访问
- 确保图片支持跨域（CORS）
- 控制台查看是否有加载错误

---

## 开发注意事项

### 编辑代码时

1. **signTest.js** 是渲染核心，修改需谨慎
2. **CustomCanvasLib.js** 可通过网页编辑，也可直接编辑文件
3. **signsData.js** 建议通过 admin.html 编辑，手动编辑需保持 JSON 格式正确

### 添加新信息板

1. 在 `data.js` 或场景数据中添加新的立方体，设置 `t` 属性（如 `testSign6`）
2. 在 `signsData.js` 的 `boards` 数组中添加对应配置
3. 在 `build_lab.js` 的 `INDICES.signBoard` 中添加索引

### 添加新的 Canvas 函数

1. 方式一：通过 admin.html 网页界面添加
2. 方式二：直接编辑 `CustomCanvasLib.js`，添加新函数

---

## 技术栈

- **前端**: 原生 HTML/CSS/JS + Tailwind CSS (CDN)
- **后端**: Python 3 http.server
- **3D 引擎**: OpenWorld (ccgxkObj API)
- **数据格式**: ES Module + JSON

---

## 文件大小参考

| 文件 | 大小 |
|------|------|
| admin.html | ~15KB |
| server.py | ~10KB |
| signTest.js | ~5KB |
| CustomCanvasLib.js | ~0.5KB |

---

## 更新日志

- **2026-03-30**: 添加 Canvas 函数库在线编辑功能
  - 提取 CustomCanvasLib.js 为独立文件
  - admin.html 新增「Canvas 函数库」Tab
  - 支持 Cmd+S 快捷键保存
  - 实时预览 Canvas 绘制效果
