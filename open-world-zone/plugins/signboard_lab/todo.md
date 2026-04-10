# TODO - signboard_lab 重构计划

## 背景

2026-04-11：mode=1 隐藏功能导致代码变得复杂，职责混乱，需要重构以提高可维护性。

## 当前问题

### 职责混乱

| 文件 | 当前职责 | 问题 |
|------|---------|------|
| `store.js` | 数据存储 + 懒加载 + 隐藏计算 | 太杂 |
| `hotUpdate.js` | updateSign(做太多事) + SSE | updateSign 成为"上帝函数" |
| `signTest.js` | hook逻辑 + 隐藏状态设置 | hook里逻辑太多 |

### 核心混乱点

- `updateSign` 全局函数被太多地方调用，做的事情太多
- "隐藏逻辑" 散落在多个文件中
- 数据流不清晰：hook → store → updateSign → hook

---

## 重构方案

### 新目录结构

```
signboard_lab/
├── index.js           # 入口，只负责编排
├── config.js          # 配置（不变）
├── store.js           # 纯数据存储
├── visibility.js      # 【新】隐藏逻辑集中地
├── renderer.js        # 渲染（不变）
├── lazyLoad.js        # 【新】懒加载逻辑
├── hotUpdate.js       # SSE + 触发更新
├── handlers/          # 图片处理等
├── signPanel/         # 编辑面板
└── hotinfo/           # 热点信息
```

### 新模块职责

#### visibility.js（核心新增）

集中管理所有隐藏相关的逻辑：

```js
// 集中管理所有隐藏相关的逻辑
export function computeShouldBeHidden(info, mode) { ... }
export function setHiddenState(ccgxkObj, index, hidden) { ... }
export function applyVisibility(ccgxkObj, boardId) {
    // 统一处理：读取状态 → 设置隐藏/显示
}
```

#### lazyLoad.js（从 store.js 抽离）

- `lazyLoadSign()`
- `doBatchFetch()`
- 批量请求合并逻辑

#### store.js（简化）

只保留纯数据操作：

```js
export const signContentMap = new Map();
export const signIndexMap = new Map();
export function setSignContent() { ... }
export function getSignContent() { ... }
```

---

## 重构步骤

1. 创建 `visibility.js`，迁移隐藏相关逻辑
2. 创建 `lazyLoad.js`，迁移懒加载逻辑
3. 简化 `store.js`，只保留数据操作
4. 简化 `hotUpdate.js`，让 `updateSign` 只做触发
5. 简化 `signTest.js`，让 hook 更清晰
6. 创建 `index.js` 作为统一入口
7. 更新 CLAUDE.md 文档

---

## 备注

- 重构后功能不变，只是代码组织更清晰
- 需要完整测试所有功能
- 建议在有空闲时间时进行
