# temp 目录说明

这个目录现在模拟的是两类未来服务器资源：

1. CDN 上的静态模型包
2. 服务器实时编辑出来的场景总配置

这次结构故意压得很简单，方便你后端 SaaS 对接。

## 目录结构

```text
temp/
  README.md
  scene-config.json
  cdn/
    build_lab/
      index.js
      build_lab.js
      data.js
      full_state.js
      constants.js
    xhall/
      index.js
      build_lab.js
      data.js
      full_state.js
      constants.js
```

## 这两个层分别干什么

### 1. `temp/cdn/<modelName>/`

这里代表未来放在 CDN 上的“模型整包代码”。

特点：

- 里面是前端直接 `import()` 的 JS 模块
- 尽量保留你原来 `plugins/build_lab`、`plugins/xhall` 的逻辑结构
- 统一入口固定是：
  - `temp/cdn/build_lab/index.js`
  - `temp/cdn/xhall/index.js`

前端运行时会按下面的规则拼路径：

```js
${cdnBaseUrl}/${modelName}/index.js
```

也就是说，后端只要返回 `modelName: "build_lab"`，前端就会去找：

```text
.../cdn/build_lab/index.js
```

### 2. `temp/scene-config.json`

这里代表未来服务器实时编辑的“总配置”。

总配置只关心：

- 当前场景里放了哪些建筑
- 它们各自用哪个模型
- 它们各自放在什么位置
- 是否启用

## 总配置格式

当前格式如下：

```json
{
  "sceneName": "empty-scene-demo",
  "buildings": [
    {
      "id": "your-own-id",
      "buildingName": "build001",
      "modelUrl": "https://your-cdn.example.com/build_lab/index.js",
      "position": { "x": 0, "y": 0, "z": 0 },
      "enabled": true
    }
  ]
}
```

字段说明：

- `sceneName`
  - 当前场景名，仅做说明展示

- `buildings`
  - 场景里的建筑数组

- `buildings[].id`
  - 每个建筑自己的唯一编号
  - 这个不是模型编号，而是“场景里的这一个建筑实例”的编号
  - 以后你要给画板、后端编辑、删除、排序等功能挂接，都应该优先认这个 id

- `buildings[].buildingName`
  - 当前建筑实例的建筑名
  - 例如：`build001`
  - 有建筑名时，最终模型内部的画板 key 会拼成：
    - `build001-testSign12`
    - `build001-board1h-3`
  - 没有建筑名时，会兼容老代码，继续使用裸 key：
    - `testSign12`
    - `board1h-3`
  - 有建筑名的实例，在同一个服务器场景内必须全局唯一

- `buildings[].modelUrl`
  - 模型入口 URL
  - 这里直接写最终可访问的完整地址最省心
  - 例如：`https://your-cdn.example.com/build_lab/index.js`

- `buildings[].position`
  - 建筑位置
  - 当前只认 `x y z`

- `buildings[].enabled`
  - 是否启用
  - `false` 时前端直接跳过这个建筑

## 一个非常关键的约定

建筑的位置，只能由总配置决定。

也就是说：

- `build_lab` 模型包内部，不应该再偷偷决定“它固定放在 x=50 z=50”
- `xhall` 模型包内部，也不应该再偷偷决定“它固定放在 x=90”

这次重做的核心目的，就是把“模型长什么样”和“模型摆在哪里”彻底拆开。

## 前端当前怎么加载

当前前端流程是：

1. 读取 `temp/scene-config.json`
2. 遍历 `buildings`
3. 对每条建筑配置，直接按 `modelUrl` 动态加载对应 `index.js`
4. 把该条建筑自己的 `id / position / enabled` 传给模型入口函数
5. 模型入口只负责渲染该建筑

## 画板 key 规则

当前有画板的建筑模型，不再直接使用裸的内部 key，例如：

- `testSign12`
- `board1h-3`
- `floorSign-1`

当前规则分两种：

```text
有 buildingName：<buildingName>-<模型内部原完整key>
无 buildingName：直接使用 <模型内部原完整key>
```

例如：

```text
build001-testSign12
build001-board1h-3
build001-floorSign-1
testSign12
```

这样同一个服务器里多个建筑实例就不会把画板内容串在一起。

## buildingName 和无名实例的致命约束

`buildingName` 不是普通备注字段，它直接影响服务器里“一个画板 key 对应一个内容”的映射。

所以当前前端规则是：

- 有 `buildingName` 的建筑实例：
  - `buildingName` 在同一服务器场景内必须全局唯一
- 没有 `buildingName` 的建筑实例：
  - 为了兼容老代码，同一个模型在同一服务器里只允许出现一次无名实例
  - 如果同一个模型被声明了第二次，至少有一个必须带 `buildingName`
- 如果冲突：
  - 控制台报错
  - 页面弹错
  - 场景加载直接终止
- 前端绝不会偷偷帮你补后缀

## 后端 SaaS 以后怎么对接最顺

后端未来最省事的接法，就是继续返回和 `scene-config.json` 一样的结构。

也就是说，先不要让后端去操心模型内部 cube 数据，只需要管：

- 建筑实例 id
- modelUrl
- position
- enabled

这样后端编辑体验会比较简单，前端渲染层也不需要跟着大改。

## CDN 模型包怎么打

当前已经额外接了一条专门给 CDN 模型包用的 Vite 构建命令：

```bash
npm run build:cdn
```

执行后会分别产出两个独立、压缩后的文件：

```text
dist/cdn/build_lab/index.js
dist/cdn/xhall/index.js
```

这两个文件的设计目标是：

- 每个模型一个独立 `index.js`
- 已压缩
- 不拆共享 chunk
- 更适合你单独上传到 CDN

也就是说，后面如果你只更新了 `build_lab`，理论上只需要重新打包并上传：

```text
dist/cdn/build_lab/index.js
```

不需要动 `xhall` 的线上文件路径规则。

## 当前的空场景

当前默认总配置是空的：

```json
{
  "sceneName": "empty-scene-demo",
  "buildings": []
}
```

也就是页面启动后，只保留地面、天空、基础移动和原有插件，不默认摆任何建筑。

## 调试阶段的一个提醒

当前仓库里的示例 `scene-config.json` 使用的是：

```text
http://127.0.0.1:5173/open-world-zone/temp/cdn/.../index.js
```

如果你本地 Vite 不是跑在 `127.0.0.1:5173`，记得把 URL 改成你当前实际访问的地址。
