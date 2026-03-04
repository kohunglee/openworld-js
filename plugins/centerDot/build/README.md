# build 目录 - 文件速查
=========================

## 本目录文件

| 文件 | 功能 | 行数 | 依赖 |
|------|------|------|------|
| **init.js** | 初始化 | ~50 | - |
| **kit.js** | 工具、HTML、音效 | ~300 | - |
| **data.js** | 数据导出、保存 | ~100 | kit.js |
| **event.js** | 键盘、鼠标事件 | ~150 | kit.js |
| **cubemodel.js** | 模型高亮、操作 | ~180 | kit.js, data.js |
| **showHotInfo.js** | 热点信息显示 | ~50 | kit.js |
| **cubeReferPos.js** | 位置参考方块 | ~80 | kit.js |
| **panel/inputPanel.js** | 输入框、面板拖拽 | ~100 | kit.js |
| **panel/pEvent.js** | 面板按钮事件 | ~120 | kit.js |
| **panel/pCommEvent.js** | 输入框公共事件 | ~100 | kit.js |
| **panel/pBassSet.js** | 基点设置 | ~80 | kit.js |

---

## 加载顺序（在 build.js 中）

```
1. kit.js           ← 基础，后面都依赖它
   ↓
2. data.js          ← 数据管理
   ↓
3. inputPanel.js    ← 输入面板
   ↓
4. event.js         ← 事件
   ↓
5. cubemodel.js     ← 模型
   ↓
6. cubeReferPos.js  ← 参考位置
   ↓
7. pCommEvent.js    ← 面板公共事件
   ↓
8. pEvent.js        ← 面板事件
   ↓
9. pBassSet.js      ← 基点设置
   ↓
10. showHotInfo.js  ← 热点信息
```

---

## 快速跳转

### 我想改 HTML → **kit.js**
### 我想改键盘操作 → **event.js**
### 我想改面板按钮 → **panel/pEvent.js**
### 我想改滚轮输入 → **panel/pCommEvent.js**
### 我想改数据导出 → **data.js**
### 我想改高亮显示 → **cubemodel.js**
### 我想改基点 → **panel/pBassSet.js**
### 我想改热点信息 → **showHotInfo.js**
### 我想改参考方块 → **cubeReferPos.js**
### 我想改面板拖拽 → **panel/inputPanel.js**

---

## 所有函数挂载位置

所有函数都挂载到：
```javascript
ccgxkObj.centerDot.init.函数名()
```

例如：
```javascript
k.centerDot.init.modelUpdate()
k.centerDot.init.hotAction()
k.centerDot.init.getCubesData()
```

---

## 更多详细说明

请看上一级目录的 **README.md**（函数速查表）
