# openworld-js 目录结构与 centerDot 插件深度分析
================================================================

## 一、完整目录树
===============

```
openworld-js/
├── LICENSE
├── CLAUDE.md
├── ads.txt
├── .git/
├── .gitmodules
├── cannon/                    # Cannon.js 物理引擎
│   └── cannon29kb.js
│
├── src/                       # 核心源码目录
│   ├── openworld.js            # 主入口文件
│   ├── 深度使用宝典.md        # 万字使用文档
│   │
│   ├── common/
│   │   └── hooks.js           # 钩子系统
│   │
│   ├── core/
│   │   ├── main.js           # 全局配置、初始化
│   │   └── animate.js        # 动画系统
│   │
│   ├── wjs/
│   │   └── w.js             # WebGL 渲染引擎
│   │
│   ├── obj/
│   │   ├── addobj.js         # 物体管理（DPZ + TypeArray）
│   │   ├── chunkManager.js   # 动态区块管理
│   │   └── texture.js        # 纹理管理
│   │
│   ├── player/
│   │   └── control.js        # 玩家控制
│   │
│   └── utils/
│       └── tool.js            # 工具函数
│
├── plugins/                    # 插件目录
│   ├── centerDot_clean.js         # 中心点拾取（清爽版）
│   ├── centerDot/              # 中心点拾取（完整版，带建造器）
│   │   ├── build.js            # 建造器入口
│   │   └── build/
│   │       ├── init.js           # 初始化
│   │       ├── kit.js            # 工具组件（HTML、音效、辅助函数）
│   │       ├── data.js           # 数据管理
│   │       ├── event.js          # 键盘鼠标事件
│   │       ├── cubemodel.js      # 模型操作（高亮显示）
│   │       ├── showHotInfo.js   # 显示热点信息
│   │       ├── cubeReferPos.js   # 添加方块位置参考
│   │       └── panel/
│   │           ├── inputPanel.js    # 输入框面板
│   │           ├── pEvent.js      # 面板事件
│   │           ├── pCommEvent.js  # 面板公共事件
│   │           └── pBassSet.js     # 基点设置
│   │
│   ├── cookieSavePos.js        # 位置保存
│   ├── sound.js               # 音效
│   ├── xmap.js                # 小地图
│   ├── xdashpanel.js           # 仪表盘
│   ├── testSampleAni.js       # 人物动画
│   ├── svgTextureLib.js        # SVG 纹理库
│   │
│   ├── webgl/
│   │   ├── commModel.js        # 通用模型库
│   │   └── wjsDynamicIns.js    # 动态实例化
│   │
│   └── owz/
│       └── deleteModBlock.js   # 删除方块
│
├── example/                   # 示例目录
│   ├── assest/
│   │   ├── texture.jpeg
│   │   └── GoldenLion.jpg
│   │
│   ├── p001-start/          # 入门示例
│   │   ├── index.html
│   │   └── main.js
│   │
│   ├── p002-commConfig/      # 配置示例
│   │   ├── index.html
│   │   └── main.js
│   │
│   ├── p003-basic-w/         # 基础 WJS
│   │   ├── index.html
│   │   └── main.js
│   │
│   ├── p004-adv-w/           # 高级 WJS（10万方块）
│   │   ├── index.html
│   │   └── main.js
│   │
│   └── p005-adddpz/         # DPZ 示例
│       ├── index.html
│       └── main.js
│
├── demo/                      # 演示项目
│   ├── texture.jpeg
│   ├── dev001/
│   │   └── opz/
│   │       ├── assets/
│   │       ├── css/
│   │       ├── data/
│   │       ├── fps/
│   │       └── script/
│   │           ├── board/
│   │           ├── book_func/
│   │           ├── booktext/
│   │           ├── build_house/
│   │           ├── data/
│   │           ├── event/
│   │           ├── init/
│   │           ├── kit/
│   │           ├── other/
│   │           ├── separated/
│   │           └── vk/
│   │
│   └── house/
│       ├── file.svg
│       ├── css/
│       ├── data/
│       ├── fps/
│       └── script/
│           ├── index.js
│           ├── bookhot.js
│           ├── booksystem.js
│           ├── booksystemtool.js
│           ├── csvread.js
│           ├── cubedata.js
│           ├── dataprocess.js
│           ├── dog.js
│           ├── event.js
│           ├── indexevent.js
│           ├── logicbuild.js
│           ├── logicdata.js
│           ├── newmvp.js
│           ├── signboard.js
│           ├── startbuild.js
│           ├── textinshelf.js
│           ├── vk.js
│           ├── vktool.js
│           ├── makegroundmvp.js
│           └── loader.js
│
├── other/                     # 其他项目
│   ├── cbcity.html
│   ├── cbcity/
│   │   ├── index.js
│   │   ├── dalishi.jpeg
│   │   └── lastpack/
│   │       ├── index.html
│   │       ├── index.js
│   │       ├── cannon29kb.js
│   │       ├── openworld.js
│   │       ├── texture.jpeg
│   │       └── plugins/
│   │
│   └── vtool/
│       ├── index.html
│       ├── cubemake.js
│       ├── vista.js
│       ├── vista.min.js
│       ├── areaeditor.2.0.min.js
│       ├── cannon29kb.js
│       └── img/
│
└── doc/                       # 本文档目录
    └── 目录结构与centerDot深度分析.md
```

---

│   ├── centerDot_clean.js      # 中心点拾取（清爽版）
│   ├── centerDot/              # 中心点拾取（完整版，带建造器）
│   │   ├── build.js            # 建造器入口
│   │   └── build/
│   │       ├── init.js           # 初始化
│   │       ├── kit.js            # 工具组件（HTML、音效、辅助函数）
│   │       ├── data.js           # 数据管理
│   │       ├── event.js          # 键盘鼠标事件
│   │       ├── cubemodel.js      # 模型操作（高亮显示）
│   │       ├── showHotInfo.js   # 显示热点信息
│   │       ├── cubeReferPos.js   # 添加方块位置参考
│   │       └── panel/
│   │           ├── inputPanel.js    # 输入框面板
│   │           ├── pEvent.js      # 面板事件
│   │           ├── pCommEvent.js  # 面板公共事件
│   │           └── pBassSet.js     # 基点设置



## 二、centerDot 插件深度分析
==============================

### 2.1 整体架构
--------------

centerDot 是一个**屏幕中心拾取 + 3D 编辑器**插件。

它分为两个版本：
1. **centerDot_clean.js** - 清爽版，只有拾取功能
2. **centerDot/build.js** - 完整版，带完整的 3D 编辑器

---

### 2.2 centerDot_clean.js（清爽版）
---------------------------------

**文件位置**: `plugins/centerDot_clean.js

**功能**:
- 屏幕中心圆点显示
- FBO 颜色拾取（识别中心物体）
- 热点事件发射
- 第一/第三人称视角切换

**核心原理**:
1. 创建一个 FBO（Framebuffer Object）
2. 将所有物体用纯色（index 编码）渲染到 FBO
3. 读取中心像素颜色，解码出物体 index
4. 根据距离判断是否显示为热点

**主要 API**:

```javascript
// 开启拾取
centerDot.openPoint(ccgxkObj);

// 关闭拾取
centerDot.closePoint(ccgxkObj);

// 切换视角
centerDot.setCamView(viewType);
// viewType: 0=第一人称, 1=第三人称(远), 2=第三人称(近), 3=第三人称(极近)

// 当前热点
k.hotPoint  // 当前热点物体的 index
```

**钩子事件**:

| 钩子名 | 触发时机 |
|--------|----------|
| `open_point` | 开启拾取时 |
| `close_point` | 关闭拾取时 |
| `hot_action` | 点击热点时 |
| `draw_point_before` | 绘制圆点前 |

---

### 2.3 centerDot 完整版（build.js 子目录）
---------------------------------------

**入口文件**: `plugins/centerDot/build.js`

这个入口依次加载并初始化所有子模块。

---

### 2.4 kit.js - 工具组件
-----------------------

**文件**: `plugins/centerDot/build/kit.js`

**功能**: 提供 HTML、音效、辅助函数

**主要内容**:

| 函数/变量 | 说明 |
|----------|------|
| `htmlCode` | 编辑器的 HTML 模板字符串（300+行）|
| `initHTML()` | 将 HTML 插入页面 |
| `f(num, digits)` | 保留小数辅助函数 |
| `disListen()` | 判断是否禁止监听 |
| `musicMap` | 事件名到音效名的映射 |
| `music(event)` | 播放音效 |
| `setInputsStep(stepValue)` | 批量设置输入框 step |
| `nDeg(degree)` | 规范化到 0-360 度 |
| `_applyClassToIds()` | 给多个 id 加 class |
| `calForwardAxis()` | 计算物体正方向 |

**HTML 包含**:
- HUD 模态框（370x370）
- 物体编辑面板（位置、旋转、尺寸输入框）
- 热点信息显示表格
- 基点设置按钮
- 更多选项折叠面板

---

### 2.5 data.js - 数据管理
-----------------------

**文件**: `plugins/centerDot/build/data.js`

**功能**: 方块数据的导出、保存、下载

| 函数 | 说明 |
|------|------|
| `getCubesData(isDownload, rangeA, rangeB, isJson)` | 获取方块数据 |
| `saveToLocalSt()` | 保存到 LocalStorage/剪切板 |
| `defaultData` | 默认参数对象 |

**数据格式**:
```javascript
{
  x: 位置X,
  y: 位置Y,
  z: 位置Z,
  rx: 旋转X,
  ry: 旋转Y,
  rz: 旋转Z,
  w: 宽度,
  h: 高度,
  d: 深度,
  b: 颜色 (可选)
}
```

---

### 2.6 event.js - 事件处理
-------------------------

**文件**: `plugins/centerDot/build/event.js`

**功能**: 键盘、鼠标锁定、热点事件

| 函数 | 说明 |
|------|------|
| `hotAction(index)` | 热点被点击，打开编辑器 |
| `unlockPointer()` | 解锁鼠标指针 |
| `lockPointer()` | 锁定鼠标指针 |
| `keyEvent(e)` | 主键盘事件处理 |
| `keyActionMap` | 键位映射表 |

**键盘操作**:

| 按键 | 功能 |
|------|------|
| W/↑ | 向前移动物体 |
| S/↓ | 向后移动物体 |
| A/← | 向左移动物体 |
| D/→ | 向右移动物体 |
| F | 冻结/解冻玩家 |
| E | 解除冻结 |
| X | 添加新方块 |
| Z | 显示/隐藏参考方块 |
| V | 切换视角 |
| 0-9/- | 激活魔法数字输入 |

---

### 2.7 showHotInfo.js - 显示热点信息
---------------------------------

**文件**: `plugins/centerDot/build/showHotInfo.js`

**功能**: 在屏幕左上角显示当前热点的信息

| 函数 | 说明 |
|------|------|
| `showScreenHotInfo()` | 显示热点的宽高深、位置、旋转 |
| `showScreenHotInfo_lastId` | 缓存上一次的 id，避免重复渲染 |

**显示内容**:
```
宽: 1, 高: 1, 深: 1
X: 0, Y: 1, Z: 0
rX: 0, rY: 0, rZ: 0
```

---

### 2.8 cubemodel.js - 模型操作
-------------------------------

**文件**: `plugins/centerDot/build/cubemodel.js`

**功能**: 高亮显示、操作方块

| 函数 | 说明 |
|------|------|
| `displayHotModel(clearLast, displayIndex)` | 显示/清除红色高亮 |
| `operaCube(type, vis)` | 复制/添加方块 |
| `modelUpdate(e, customIndex, isKeyOk, newArgs)` | 更新模型数据 |

**核心逻辑**:
1. `isDisplayHotModel` - 是否显示高亮
2. `lastHotId` - 上一次高亮的 id
3. `operaCube(type=0)` - 复制方块
4. `operaCube(type=1)` - 添加新方块

---

### 2.9 cubeReferPos.js - 位置参考
---------------------------------

**文件**: `plugins/centerDot/build/cubeReferPos.js`

**功能**: 添加方块时的位置参考（预览方块）

| 函数 | 说明 |
|------|------|
| `displayRefer()` | 显示/隐藏参考方块 |
| `newCubePosType` | 0=关闭, 1=正交模式 |

**工作流程**:
1. 按 Z 键进入参考模式
2. 显示一个半透明方块在玩家前方
3. 点击添加方块
4. 按 Z 键退出

---

### 2.10 panel/inputPanel.js - 输入面板
-------------------------------------

**文件**: `plugins/centerDot/build/panel/inputPanel.js`

**功能**: 编辑面板输入框的事件、面板拖拽、箭头指示

| 函数 | 说明 |
|------|------|
| `insertEdiFromBackUp()` | 从备份填充编辑区 |
| `panelMoveInit(e)` | 开始拖拽面板 |
| `panelMove(e)` | 拖拽中 |
| `panelMoveEnd()` | 结束拖拽 |
| `drawFDico()` | 绘制前后箭头指示 |
| `removeFDicon()` | 移除箭头 |
| `addFDico()` | 添加箭头 |

---

### 2.11 panel/pEvent.js - 面板事件
-------------------------------------

**文件**: `plugins/centerDot/build/panel/pEvent.js`

**功能**: 面板上按钮事件

| 函数 | 说明 |
|------|------|
| `onclickView(event)` | 点击画面退出编辑 |
| `cancelAction()` | 点击取消按钮 |
| `quitPanel(G)` | 退出面板 |
| `e_presets()` | 翻转宽深 |
| `e_round()` | 位置归整（四舍五入）|
| `e_zero()` | 旋转归零 |
| `e_delete()` | 删除物体（移到很远）|
| `magicNumBlur(e)` | 魔法数字失焦 |
| `clearMagicNum()` | 清除魔法数字 |

---

### 2.12 panel/pCommEvent.js - 面板公共事件
-------------------------------------------

**文件**: `plugins/centerDot/build/panel/pCommEvent.js`

**功能**: 所有输入框的 onchange 事件、滚轮增减

| 函数 | 说明 |
|------|------|
| `onchangeForeach(input)` | 给每个输入框绑定事件 |
| focus 事件 | 记录 change 前的值 |
| keydown 事件 | 处理魔法数字 |
| change 事件 | 更新模型 |
| mousedown 事件 | 中键处理魔法数字 |
| mouseover 事件 | 自动聚焦 |
| wheel 事件 | 滚轮增减数字 |
| mouseout 事件 | 自动失焦 |

**滚轮操作**:
- 滚轮向上 → 数字增加 0.001
- 滚轮向下 → 数字减少 0.001
- Shift+滚轮 → 增减 0.001（更精细）

---

### 2.13 panel/pBassSet.js - 基点设置
---------------------------------------

**文件**: `plugins/centerDot/build/panel/pBassSet.js`

**功能**: 物体形变的基点（边）设置

| 函数 | 说明 |
|------|------|
| `deformationBaseType` | -1=无, 0=左, 1=上, 2=右, 3=下 |
| `deformationBase(inputID, step)` | 基点形变逻辑 |
| `bassSet(e, type, sound)` | 设置基点 |

**基点按钮位置**:
```
    [上]
[左]      [右]
    [下]
```

**工作原理**:
1. 选择一个基点（如"左"）
2. 调整宽度时，物体向右延伸
3. 位置也会相应调整，保持基点不动

---

## 三、使用指南
==============

### 3.1 使用清爽版（centerDot_clean.js）
-----------------------------------

```javascript
import centerDot from '../plugins/centerDot_clean.js';

k.initWorld('openworldCanv');
centerDot(k);  // 初始化

// 监听热点点击
k.hooks.on('hot_action', (kObj, e) => {
    console.log('点击了热点:', kObj.hotPoint);
});
```

### 3.2 使用完整版（centerDot/build.js）
---------------------------------------

```javascript
import centerDotClean from '../plugins/centerDot_clean.js';
import build from '../plugins/centerDot/build.js';

k.initWorld('openworldCanv');
centerDotClean(k);  // 先初始化清爽版
build(k);          // 再初始化建造器
```

### 3.3 黑名单机制
------------------

```javascript
// 添加到黑名单，不被拾取
k.centerDotBlacklist = new Set([100, 200, 300]);
```

### 3.4 暂停绘制
--------------

```javascript
k.drawPointPause = true;   // 暂停
k.drawPointPause = false;  // 恢复
```

---

## 四、核心原理（30%）
====================

### 4.1 FBO 颜色拾取原理
------------------------

```
主舞台（显示给用户）
    ↓
FBO（秘密排练室）
    ↓
用 index 编码颜色
    ↓
读取中心像素
    ↓
解码出 index
```

**颜色编码**:
```javascript
// index + 1 转为 6 位十六进制
obj_proxy.b = (index + 1).toString(16).padStart(6, '0');
```

**颜色解码**:
```javascript
const objIndex = colorArray[0] * 256² + colorArray[1] * 256 + colorArray[2] - 1;
```

### 4.2 视角数据
--------------

```javascript
camViewData: {
    0: {x: 0, y: 0.4, z: -0.5},  // 第一人称
    1: {x: 0, y: 2, z: 4},      // 第三人称（远）
    2: {x: 0, y: 1.8, z: 2},    // 第三人称（近）
    3: {x: 0, y: 1.5, z: 1},    // 第三人称（极近）
}
```

---

## 五、文件依赖关系
==================

```
build.js (入口)
    │
    ├── kit.js (HTML、音效、辅助函数)
    │
    ├── data.js (数据管理)
    │
    ├── inputPanel.js (输入面板)
    │
    ├── event.js (事件)
    │
    ├── cubemodel.js (模型)
    │
    ├── cubeReferPos.js (参考位置)
    │
    ├── pCommEvent.js (面板公共事件)
    │
    ├── pEvent.js (面板事件)
    │
    ├── pBassSet.js (基点设置)
    │
    └── showHotInfo.js (热点信息)
```

---

## 六、常见问题
==============

**Q: 怎么禁用中心点拾取？**
```javascript
k.notCenterDot = true;
```

**Q: 怎么只显示热点不显示圆点？**
```javascript
k.centerDot.status = 0;  // 点关闭状态
```

**Q: 编辑器面板怎么拖动？**
```
按住面板空白处拖动
```

**Q: 怎么用键盘精确移动？**
```
按数字键输入魔法数字 → 按方向键 → 自动加上魔法数字
```

**Q: 基点怎么用？**
```
1. 点击一个基点按钮（变红）
2. 调整相应的尺寸
3. 物体会从基点方向延伸
```

---

## 七、总结
==========

centerDot 是一个功能完备的 3D 拾取+编辑器插件，
包含：
- 颜色拾取（FBO）
- 完整的属性编辑
- 键盘操作
- 鼠标拖拽
- 基点形变
- 数据导出
