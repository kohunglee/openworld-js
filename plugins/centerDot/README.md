# centerDot 建造器 - 函数速查表
==================================

## 目录结构
```
centerDot/
├── build.js          ← 入口文件
├── README.md         ← 本文件（函数速查）
│
└── build/
    ├── init.js           ← 初始化
    ├── kit.js            ← 工具组件
    ├── data.js           ← 数据管理
    ├── event.js          ← 键盘鼠标事件
    ├── cubemodel.js      ← 模型操作
    ├── showHotInfo.js   ← 热点信息显示
    ├── cubeReferPos.js   ← 位置参考
    │
    └── panel/
        ├── inputPanel.js    ← 输入面板
        ├── pEvent.js      ← 面板事件
        ├── pCommEvent.js  ← 面板公共事件
        └── pBassSet.js     ← 基点设置
```

---

## 1. init.js - 初始化
=====================

### 主要函数
| 函数 | 说明 |
|------|------|
| `initHTML()` | 将编辑器 HTML 插入页面 |

---

## 2. kit.js - 工具组件
=======================

### 主要函数
| 函数 | 说明 |
|------|------|
| `f(num, digits=3)` | 保留小数辅助函数 |
| `disListen()` | 判断是否禁止监听键盘 |
| `music(myevent)` | 播放音效 |
| `setInputsStep(stepValue)` | 批量设置输入框 step |
| `nDeg(degree)` | 规范化到 0-360 度 |
| `_applyClassToIds(ids, className)` | 给多个 id 加 class |
| `calForwardAxis(myAngle, boxAngle)` | 计算物体正方向 |

### 主要变量
| 变量 | 说明 |
|------|------|
| `htmlCode` | 编辑器的 HTML 模板（300+行）|
| `indexHotCurr` | 当前热点索引（固定值）|
| `backupEdi` | 编辑器内容备份 |
| `musicMap` | 事件名→音效名映射 |
| `stepValue` | 输入框 step 值 |

---

## 3. data.js - 数据管理
=========================

### 主要函数
| 函数 | 说明 |
|------|------|
| `getCubesData(isDownload, rangeA, rangeB, isJson)` | 获取方块数据 |
| `saveToLocalSt()` | 保存到 LocalStorage/剪切板 |

### 数据格式
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
  b: 颜色 (可选),
  del: 1  (删除标记)
}
```

### 主要变量
| 变量 | 说明 |
|------|------|
| `defaultData` | 默认参数对象 `{w:1, h:1, d:1, y:1, b:'888888'}` |

---

## 4. event.js - 键盘鼠标事件
==============================

### 主要函数
| 函数 | 说明 |
|------|------|
| `hotAction(index)` | 热点被点击 → 打开编辑器 |
| `unlockPointer()` | 解锁鼠标指针 |
| `lockPointer()` | 锁定鼠标指针 |
| `keyEvent(e)` | 主键盘事件处理 |

### 键盘操作表
| 按键 | 功能 |
|------|------|
| W / ↑ | 向前移动物体 |
| S / ↓ | 向后移动物体 |
| A / ← | 向左移动物体 |
| D / → | 向右移动物体 |
| F | 冻结/解冻玩家 |
| E | 解除冻结 |
| X | 添加新方块 |
| Z | 显示/隐藏参考方块 |
| V | 切换视角 |
| 0-9 / - | 激活魔法数字输入 |

### 主要变量
| 变量 | 说明 |
|------|------|
| `keyActionMap` | 键位映射表（箭头、WASD）|

---

## 5. showHotInfo.js - 热点信息显示
==================================

### 主要函数
| 函数 | 说明 |
|------|------|
| `showScreenHotInfo()` | 在屏幕左上角显示热点信息 |

### 显示内容
```
┌─────────────────────────────┐
│ 宽: 1, 高: 1, 深: 1     │
│ X: 0, Y: 1, Z: 0        │
│ rX: 0, rY: 0, rZ: 0     │
└─────────────────────────────┘
```

### 主要变量
| 变量 | 说明 |
|------|------|
| `showScreenHotInfo_lastId` | 缓存上一次的 id，避免重复渲染 |

---

## 6. cubemodel.js - 模型操作
==============================

### 主要函数
| 函数 | 说明 |
|------|------|
| `displayHotModel(clearLast, displayIndex)` | 显示/清除红色高亮 |
| `operaCube(type=0, vis=false)` | 操作方块（0=复制, 1=添加）|
| `modelUpdate(e, customIndex, isKeyOk, newArgs)` | 更新模型数据 |

### 主要变量
| 变量 | 说明 |
|------|------|
| `isDisplayHotModel` | 是否显示高亮 |
| `lastHotId` | 上一次高亮的 id |
| `wskId` | 默认的 wskId |

---

## 7. cubeReferPos.js - 位置参考
================================

### 主要函数
| 函数 | 说明 |
|------|------|
| `displayRefer()` | 显示/隐藏参考方块（按 Z 键）|

### 工作模式
| 模式 | 说明 |
|------|------|
| 0 | 关闭参考 |
| 1 | 正交模式（显示半透明方块）|

### 主要变量
| 变量 | 说明 |
|------|------|
| `newCubePosType` | 0=关闭, 1=正交模式 |
| `addCubeByMouseEvent()` | 鼠标点击添加方块 |

---

## 8. panel/inputPanel.js - 输入面板
====================================

### 主要函数
| 函数 | 说明 |
|------|------|
| `insertEdiFromBackUp()` | 从 backupEdi 填充编辑区 |
| `panelMoveInit(e)` | 开始拖拽面板 |
| `panelMove(e)` | 拖拽中 |
| `panelMoveEnd()` | 结束拖拽 |
| `drawFDico()` | 绘制前后箭头指示 |
| `removeFDicon()` | 移除箭头 |
| `addFDico(listTOP, listDown)` | 添加箭头 |

### 面板操作
| 操作 | 说明 |
|------|------|
| 按住面板空白处 | 拖拽移动面板 |
| Shift | 输入框 step 变 0.001 |

### 主要变量
| 变量 | 说明 |
|------|------|
| `isDragging` | 是否正在拖拽 |
| `panelOffsetX/Y` | 拖拽偏移量 |
| `forwardAxis` | 当前正方向 |
| `axis_widthDepth` | 当前宽/深轴 |

---

## 9. panel/pEvent.js - 面板事件
==================================

### 主要函数
| 函数 | 说明 |
|------|------|
| `onclickView(event)` | 点击画面退出编辑 |
| `cancelAction()` | 点击取消按钮 |
| `quitPanel(G)` | 退出面板 |
| `e_presets()` | 翻转宽深 |
| `e_round()` | 位置归整（四舍五入）|
| `e_zero()` | 旋转归零 |
| `e_delete()` | 删除物体（移到 999999999）|
| `magicNumBlur(e)` | 魔法数字失焦 |
| `clearMagicNum()` | 清除魔法数字 |

### 面板按钮
| 按钮 | 功能 |
|------|------|
| 翻转 | 交换宽和深 |
| 归整 | 位置四舍五入 |
| 归零 | 旋转设为 0 |
| 删除 | 删除物体 |
| 恢复 | 从 backup 恢复 |
| 确认 | 确认修改（非实时模式）|
| 关闭 | 关闭面板 |
| 退出 | 退出并关闭拾取 |

---

## 10. panel/pCommEvent.js - 面板公共事件
==========================================

### 主要函数
| 函数 | 说明 |
|------|------|
| `onchangeForeach(input)` | 给每个输入框绑定所有事件 |

### 输入框事件
| 事件 | 说明 |
|------|------|
| focus | 记录 change 前的值 |
| keydown | 处理魔法数字 |
| change | 更新模型 |
| mousedown | 中键处理魔法数字 |
| mouseover | 自动聚焦 |
| wheel | 滚轮增减数字（0.001）|
| mouseout | 自动失焦 |

### 滚轮操作
| 操作 | 效果 |
|------|------|
| 滚轮向上 | 数字 +0.001 |
| 滚轮向下 | 数字 -0.001 |
| Shift+滚轮 | 增减 0.001（更精细）|
| 先输入数字 | 再按方向键自动加上 |

---

## 11. panel/pBassSet.js - 基点设置
====================================

### 主要函数
| 函数 | 说明 |
|------|------|
| `deformationBase(inputID, step)` | 基点形变逻辑 |
| `bassSet(e, type, sound=true)` | 设置基点 |

### 基点类型
| type | 说明 | 按钮位置 |
|------|------|----------|
| -1 | 无基点 | - |
| 0 | 左基点 | ← |
| 1 | 上基点 | ↑ |
| 2 | 右基点 | → |
| 3 | 下基点 | ↓ |

### 基点按钮布局
```
    [上]
[左]      [右]
    [下]
```

### 工作原理
1. 点击一个基点按钮（变红）
2. 调整相应的尺寸
3. 物体会从基点方向延伸，位置自动调整

---

## 12. build.js - 入口文件
==========================

### 初始化流程
```javascript
1. kit(ccgxkObj)           // 工具组件
2. data(ccgxkObj)          // 数据管理
3. inputPanel(ccgxkObj)    // 输入面板
4. event(ccgxkObj)         // 事件
5. model(ccgxkObj)         // 模型
6. cubeReferPosJS(ccgxkObj)// 位置参考
7. pCommEvent(ccgxkObj)    // 面板公共事件
8. pEvent(ccgxkObj)        // 面板事件
9. pBassSet(ccgxkObj)      // 基点设置
10. showHotInfo(ccgxkObj)  // 热点信息
11. G.initHTML()           // 插入 HTML
```

### 钩子监听
| 钩子 | 触发 |
|------|------|
| `hot_action` | 热点被点击 → `G.hotAction()` |
| `jump` | 跳跃 → `G.music('jump')` |
| `draw_point_before` | 绘制圆点前 → 显示信息、高亮 |
| `close_point` | 关闭拾取 → 清除高亮 |

---

## 快捷键总表
==============

### 拾取模式
| 按键 | 功能 |
|------|------|
| 左键点击 | 打开编辑器 |
| 右键点击 | 关闭拾取 |

### 编辑器模式
| 按键 | 功能 |
|------|------|
| W / ↑ | 向前移 |
| S / ↓ | 向后移 |
| A / ← | 向左移 |
| D / → | 向右移 |
| F | 冻结/解冻玩家 |
| E | 解除冻结 |
| X | 添加新方块 |
| Z | 参考方块 |
| V | 切换视角 |
| 0-9/- | 魔法数字 |
| Shift | 精细调整 |
| 滚轮 | 增减数值 |

### 面板按钮
| 按钮 | 功能 |
|------|------|
| 复制(+1) | 复制当前方块 |
| 翻转 | 交换宽深 |
| 归整 | 位置四舍五入 |
| 归零 | 旋转设为 0 |
| 删除 | 删除物体 |
| 恢复 | 从备份恢复 |
| 确认 | 确认修改 |
| 关闭 | 关闭面板 |
| 退出 | 退出+关闭拾取 |
| 复制数据 | 复制到剪切板 |
| 下载数据 | 下载 JSON |

---

## 数据流向
==========

```
用户点击热点
    ↓
hotAction()
    ↓
unlockPointer() + 显示模态框
    ↓
insertEdiFromBackUp() 填充输入框
    ↓
用户修改输入框
    ↓
onchange → modelUpdate()
    ↓
updateInstance() + 更新 TypeArray
    ↓
重新激活物体
```

---

## DOM 元素 ID 速查
====================

| ID | 说明 |
|----|------|
| `centerPoint` | 中心圆点 canvas |
| `pointObjIndex` | 热点索引显示 |
| `hotPointInfo` | 热点信息表格 |
| `myHUDModal` | HUD 模态框 |
| `myHUDObjEditor` | 编辑器面板 |
| `objID` | 物体 index 输入框 |
| `objWidth/Height/Depth` | 宽高深输入框 |
| `objPosX/Y/Z` | 位置输入框 |
| `objRotX/Y/Z` | 旋转输入框 |
| `objColor` | 颜色选择器 |
| `textureCopyCubes` | 复制按钮 |
| `e_presets` | 翻转按钮 |
| `e_round` | 归整按钮 |
| `e_zero` | 归零按钮 |
| `e_delete` | 删除按钮 |
| `e_bassL/T/R/B` | 基点按钮（左/上/右/下）|
| `magicNum` | 魔法数字输入框 |
| `isRealTimeUpdata` | 实时更新复选框 |
| `rollerPlus` | 滚轮加减复选框 |
| `textureEditorReset` | 恢复按钮 |
| `textureEditorOk` | 确认按钮 |
| `textureEditorClose` | 关闭按钮 |
| `textureEditorCancel` | 退出按钮 |
| `textureSaveCubeData` | 复制数据按钮 |
| `textureGetCubeData` | 下载数据按钮 |
