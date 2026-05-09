# openworld-js 图片看板 LOD 卡顿深度分析（含 Trace 证据）

更新时间：2026-05-09  
项目：`/Users/kehongli/studio/openworld-js`  
Trace：`/Users/kehongli/Downloads/Trace-20260509T171714.json`

## 0. 先说最终判断

你描述的“移动中直接定格几百毫秒”是成立的，而且这次 Trace 已经给出清晰证据：**主因不是 jpg 单次解码慢，而是主线程在每帧/高频任务里做了过多 CPU 工作**。看板图片只是把激活对象数推高，从而放大了这个问题。

最关键结论：

1. **主线程长任务集中在 `viewAnimate` 帧循环**，最大单次 `FunctionCall` 达 **1504ms**（`src/core/animate.js: viewAnimate`）。
2. **`centerDot_clean` 的颜色拾取逻辑是第二重放大器**，其匿名函数总耗时高，且最大单次 **306ms**，会直接造成“顿一下”。
3. **图片解码存在但不是头号凶手**：`Decode Image` 最大约 **6.2ms**，总计约 **109ms**，远小于帧循环脚本耗时。
4. 这份 Trace metadata 中 `cpuThrottling: 4`，代表录制时 CPU 被 4 倍降速，任何主线程开销都会被放大。

## 1. Trace 关键证据（定格来源）

### 1.1 渲染主线程最长任务

主线程：`CrRendererMain`。

观察到的头部长任务：

- `FunctionCall`（`viewAnimate`）最大：**1504.04ms**
- `FunctionCall`（`viewAnimate`）次大：**644.99ms**
- `FunctionCall`（`plugins/centerDot_clean.js` 匿名）最大：**306.76ms**
- 还有多次 `viewAnimate`：193ms / 134ms / 119ms / 81ms / 69ms ...

这些都符合你说的“移动过程中定格几百毫秒”。

### 1.2 按函数聚合后的总耗时（更有说服力）

`FunctionCall` 聚合结果（trace 内）：

- `src/core/animate.js::viewAnimate`：**3781.9ms total / 316次 / max 1504ms**
- `src/wjs/w.js::draw`：**2573.2ms total / 315次 / max 91.2ms**
- `plugins/centerDot_clean.js::(anonymous)`：**1492.5ms total / 95次 / max 306.8ms**
- `open-world-zone/plugins/signboard_lab/store.js`：仅 **27.8ms total**

这说明：**卡顿核心在通用帧循环与热点拾取，不在 signboard 的网络懒加载本身。**

### 1.3 图片相关事件占比

- `Decode Image`：100 次，总计约 **109ms**，最大 **6.2ms**
- `GPUTask`：总计约 **922.8ms**，但单次都较小（多为 2~4ms）
- `Paint`：总计约 **492.7ms**，单次中小

结论：图片解码/GPU 任务存在，但它们更像“背景消耗”；造成“突然定格”的，是 JS 主线程一次吞下过多工作。

## 2. 与源码的因果映射

## 2.1 第一痛点：`animate.js` 每帧做重活

文件：`src/core/animate.js`

`animateRen -> viewAnimate` 每帧都会执行：

- `updataBodylist()`（内部先跑 `dynaNodes_lab()`）
- `mainVPlayerMove()`
- 钩子 `animatePreFrame`

`updataBodylist()` 又会遍历 `currentlyActiveIndices`，并在条件满足时触发 `W.move`、更新 spatialGrid。看板/物体一多，帧时间线性上升，容易炸出长帧。

## 2.2 第二痛点：`centerDot_clean` 高频全量渲染拾取

文件：`plugins/centerDot_clean.js`

开启后每 100ms 执行一次 `drawPoint`，内部调用 `W.getColorPickObj()`：

- 绑定 FBO
- 遍历 `currentlyActiveIndices`
- 对每个对象做一次 `W.render(obj_proxy, 0)`
- `gl.readPixels` 读回中心像素

这相当于额外再画一遍“活跃对象集合”，对象越多越重。你的场景里“移动+大量图片”时，这块成本会明显放大，Trace 中 300ms 级峰值与此一致。

## 2.3 第三痛点：LOD 边界抖动导致反复激活/隐藏

文件：`src/obj/chunkManager.js` + `src/obj/addobj.js`

`dynaNodes_lab` 会切换激活集合；切换后 `activeTABox/hiddenTABox` 触发对象创建与删除。边界附近往返时，频繁删建会拉高主线程和渲染管线压力。

## 2.4 图片链路的真实角色

文件：`open-world-zone/plugins/signboard_lab/handlers/imageHandler.js`、`src/obj/texture.js`

- 有 `toDataURL`、svg 转码、img onload 等成本。
- 但本次 trace 里并未体现为“单次几百毫秒”的主凶。
- 它们更像“把活跃对象量和上传频率推高”，间接触发前述帧循环卡顿。

## 3. 优先级改造方案（按收益排序）

### P0（先做，收益最高）

1. **先关掉/降频 `centerDot_clean` 拾取**：
   - 从 `100ms` 改为 `300~500ms`；
   - 仅在真正需要交互时开启；
   - 或限制每次拾取只扫描距离中心最近的候选对象，而不是全量 `currentlyActiveIndices`。
2. **给 `viewAnimate` 做帧预算拆分**：
   - `updataBodylist` 分批处理（例如每帧只处理 N 个 active）；
   - 超预算（例如 >6ms）则把剩余工作延期到下一帧。
3. **LOD 增加滞回阈值（Hysteresis）**：
   - 进入/退出阈值分离，减少边界抖动导致的“反复删建”。

### P1（第二阶段）

4. `hiddenTABox/activeTABox` 从“删建模型”改为“保留实例+切 hidden/texture”。
5. 图片上传引入并发上限（例如一次 2~4 张），避免瞬时尖峰。
6. `toDataURL` 逐步迁移 `toBlob/createImageBitmap`（可行平台下）。

### P2（治理类）

7. 给 `signboardPerf` 增加与主循环关联指标：每帧 `activeCount`、`updataBodylist` 耗时、`getColorPickObj` 耗时。
8. 录制对比 trace 时关闭浏览器扩展，避免干扰。

## 4. 关于这次 Trace 的注意事项

1. 你此次录制启用了 `cpuThrottling: 4`，会显著放大卡顿，适合“放大问题定位”，不适合估算真实线上绝对帧率。  
2. trace 里有极长 `V8.StackGuard/CpuProfiler::StartProfiling` 片段，这通常与录制器/调试器状态有关，不应直接当作业务代码耗时。

## 5. 可执行结论（给你下一步）

如果你的目标是“角色移动绝不卡顿”，当前第一刀应砍在：

- `plugins/centerDot_clean.js` 的拾取频率与全量遍历；
- `animate.js` 的每帧全量更新策略；
- LOD 边界抖动控制。

不是先砍 jpg 解码。先砍主线程大任务，卡顿会立刻下降一个量级。

