## openworld.js (ow.min.js)

<img width="200" alt="image" src="https://github.com/user-attachments/assets/10467c5b-f0c8-487a-ba0f-13d4a443f76d" />

OpenWorld-JS is a small WebGL engine for browser 3D worlds and lightweight web games.

It runs in the browser. It does not use Three.js or Babylon.js. The main idea is simple: load fast, walk inside the world fast, and let one web page become a small open world.

[Main website: ow.ccgxk.com](https://ow.ccgxk.com)  
[Big library demo](https://ow.ccgxk.com/demo/house.html?id=biglib&logicadd=1)  
[Cyber city demo](https://git.ccgxk.com/myWorkSpace/webgl_show/cyber_city/cbcity.html)  
[Future product: openworld.zone](https://openworld.zone)

📌 Add one strong GIF here. The GIF should show first-person walking, many books or cubes, smooth movement, and one simple UI action. Keep it under 8 MB if possible.

```md
![OpenWorld-JS browser 3D world demo](./docs/images/openworld-js-demo.gif)
```

If this project gives you a new idea, give it a star. A star is a clear signal for me to keep cleaning the API, write documents, and make more small demos.

If you want to build your own browser world, fork it and change the examples. The project is still young, but the demo is already real.

## What It Is

OpenWorld-JS is a JavaScript engine for making interactive 3D worlds inside normal web pages.

It is good for:

- Lightweight browser games.
- First-person 3D websites.
- Creative coding experiments.
- Small open world prototypes.
- Virtual museums, libraries, rooms, and city scenes.
- Web pages that need 3D walking, not only flat scrolling.

It is not a big editor. It is not a full commercial game engine. It is more like a small engine core, with examples and plugins around it.

The project has two parts:

- `openworld-js`: the engine and examples in this repository.
- `Open World Zone`: a future product built on this engine. It is about personal 3D knowledge space and 3D world pages. That product will live more on `openworld.zone`.

## Why I Made It

I want the browser to have more space.

Most websites are flat. They are like a long paper tape. But many things can be easier to remember when they have a place. A room, a wall, a corridor, a shelf, a small city.

So I made this engine. I want to build 3D worlds that are small enough for the web, but still feel like a place.

The first goal is not realistic graphics. The first goal is:

- small file size
- fast loading
- first-person walking
- many simple objects
- good control feeling
- easy to put text, pictures, books, walls, and rooms into one world

## Main Features

- WebGL browser rendering.
- Modified cannon.js physics.
- First-person control.
- Third-person mode in project demos.
- Xbox gamepad support in demos.
- Instanced rendering for many objects.
- Dynamic instance update and fake delete.
- TypeArray object storage for many world objects.
- DPZ dynamic loading system for large scenes.
- Plugin hooks for UI, mini map, save position, build tools, sound, and object picking.
- Runs from normal browser pages.
- No Three.js.
- No Babylon.js.

📌 Add a short table with tested browser and device data.

Example:

| Device | Browser | Demo | Result |
| --- | --- | --- | --- |
| MacBook Air M1 | Chrome | Big library | Stable |
| iPhone | Safari | Small example | Stable |
| Windows laptop | Edge | Build tool | Stable |

## Size And Performance

The target is very small.

The physics part is based on a modified cannon.js file. The file is about 29 KB in project naming, and about 32 KB on disk in this repo.

I ran a local build on 2026-05-08:

```txt
npm run build

dist/shared/assets/openworld.DA3viApa.js     62.17 kB, gzip 35.78 kB
dist/p001-start/assets/p001-start.js         31.24 kB, gzip 24.43 kB
dist/open-world-zone/assets/open-world-zone.js 172.79 kB, gzip 64.52 kB
```

📌 Update this build result after every important release. Put the newest number here.

The big demo has been used to show a library scene with 300,000 books. The example `p004-adv-w` also has an instancing test with 100,000 cubes.

📌 Add a screenshot of the 300,000 books library.

```md
![300000 books library demo](./docs/images/big-library-300000-books.jpg)
```

📌 Add a screenshot or GIF of the 100,000 cubes instancing test.

```md
![100000 cubes instancing demo](./docs/images/100000-cubes-instancing.gif)
```

## Online Demos

### Main Website

https://ow.ccgxk.com

This is the website directly connected with this repository. It should be the first entrance.

### Big Library Demo

https://ow.ccgxk.com/demo/house.html?id=biglib&logicadd=1

This demo shows the real direction of this engine. It is a browser world. You can walk inside it. The scene can contain many books and large space.

📌 Add one clear image here. The image should not be dark. It should show the books and the depth of the space.

### Cyber City Demo

https://git.ccgxk.com/myWorkSpace/webgl_show/cyber_city/cbcity.html

This is an early demo. It shows a city feeling and wall writing idea.

📌 Add one image or GIF here. Good shot: glowing text on wall, first-person view, city street.

### Open World Zone

https://openworld.zone

Open World Zone is a later product direction. It is not the engine itself. It will use the engine to build personal 3D spaces, 3D knowledge rooms, and world pages.

📌 Add one product vision image here after the first usable product page is ready.

## Quick Start From Source

The public npm package is not the main path now. Use source first.

```bash
git clone https://github.com/kohunglee/openworld-js.git
cd openworld-js
npm install
npm run dev
```

Then open:

```txt
http://localhost:5173/example/p001-start/
```

If Vite uses another port, use the URL printed in terminal.

`p001-start` is the smallest current start. It creates a world, a ground, and a player.

📌 If the npm package is published later, add a shorter install section here.

## Smallest Page

HTML:

```html
<!DOCTYPE html>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style> body { margin: 0; } </style>

<body>
  <canvas id="openworldCanv" style="width:99vw;height:99vh"></canvas>
  <script src="../../cannon/cannon29kb.js"></script>
  <script type="module" src="./main.js"></script>
</body>
```

JavaScript:

```js
import k from '../../src/openworld.js';

globalThis.k = k;
k.initWorld('openworldCanv', true);

const gX = 0;
const gY = -2.5;
const gZ = 0;
const gW = 250;
const gD = 250;
const gH = 6;

k.addPhy({
  name: 'ground-phy',
  X: gX,
  Y: gY,
  Z: gZ,
  width: gW,
  depth: gD,
  height: gH
});

k.W.cube({
  n: 'ground',
  x: gX,
  y: gY,
  z: gZ,
  w: gW,
  d: gD,
  h: gH,
  b: '#7B8B6F'
});

k.mainVPlayer = k.addPhy({
  name: 'mainPlayer',
  X: 10,
  Y: 3,
  Z: 10,
  size: 1,
  mass: 50,
  colliGroup: 1
});

k.W.cube({
  n: 'mainPlayer',
  b: '#FDF9EE'
});
```

Click the canvas to lock the mouse. Then move inside the world.

## Controls

| Key or action | Meaning |
| --- | --- |
| Click canvas | Lock mouse pointer |
| Mouse move | Look around |
| W or Arrow Up | Move forward |
| S or Arrow Down | Move backward |
| A or Arrow Left | Move left |
| D or Arrow Right | Move right |
| Space or E | Jump or fly upward |
| Shift or Q | Run faster |
| Esc | Unlock mouse pointer |

Some demos have more controls from plugins. For example, the build tool and Open World Zone demos can have more UI panels.

📌 Add a short control GIF. It should show click canvas, walk, jump, and turn.

## Examples

Start from `example/`, not from the old `demo/` folder.

| Folder | Meaning |
| --- | --- |
| `example/p001-start` | Minimum world, ground, player |
| `example/p002-commConfig` | Texture and common config |
| `example/p003-basic-w` | Basic WJS shapes, FOV slider, billboard |
| `example/p004-adv-w` | Custom model and 100,000 instanced cubes |
| `example/p005-adddpz` | DPZ dynamic loading example |
| `example/p006-build-tool` | Plugin system and build tool |
| `example/p007-siy-texture` | Product-like texture and plugin experiment |

Try them with Vite:

```txt
http://localhost:5173/example/p003-basic-w/
http://localhost:5173/example/p004-adv-w/
http://localhost:5173/example/p005-adddpz/
http://localhost:5173/example/p006-build-tool/
```

📌 Add one image for each example. Keep all images in one folder, such as `docs/images/`.

## Repository Map

```txt
openworld-js/
|-- README.md
|-- package.json
|-- vite.config.js
|-- index.html
|-- owzlogo.png
|-- cannon/
|   |-- cannon29kb.js
|   |-- cannon.min.js
|   `-- cannon-x-dev.js
|-- src/
|   |-- openworld.js
|   |-- common/
|   |   `-- hooks.js
|   |-- core/
|   |   |-- main.js
|   |   `-- animate.js
|   |-- obj/
|   |   |-- addobj.js
|   |   |-- chunkManager.js
|   |   `-- texture.js
|   |-- player/
|   |   `-- control.js
|   |-- utils/
|   |   `-- tool.js
|   `-- wjs/
|       |-- w.js
|       |-- vertexShader.js
|       `-- fragmentShader.js
|-- plugins/
|   |-- webgl/
|   |   |-- wjsDynamicIns.js
|   |   `-- commModel.js
|   |-- build/
|   |-- centerDot/
|   |-- centerDot_clean.js
|   |-- cookieSavePos.js
|   |-- testSampleAni.js
|   |-- xdashpanel.js
|   `-- xmap.js
|-- example/
|   |-- p001-start/
|   |-- p002-commConfig/
|   |-- p003-basic-w/
|   |-- p004-adv-w/
|   |-- p005-adddpz/
|   |-- p006-build-tool/
|   `-- p007-siy-texture/
|-- open-world-zone/
|   |-- index.html
|   |-- main.js
|   |-- assest/
|   `-- plugins/
|-- demo/
|   `-- old demos and history demos
|-- dist/
|   `-- generated build output
|-- doc/
|   `-- notes and analysis
`-- other/
    `-- old lab files and tools
```

The important paths are:

- `src/openworld.js`: main engine entry.
- `src/wjs/w.js`: WebGL render engine.
- `src/core/main.js`: world init and base config.
- `src/core/animate.js`: physics loop and render loop.
- `src/player/control.js`: first-person control.
- `src/obj/addobj.js`: physics object and TypeArray object system.
- `src/obj/chunkManager.js`: DPZ dynamic loading.
- `plugins/webgl/wjsDynamicIns.js`: dynamic instancing update.
- `example/`: new examples.
- `open-world-zone/`: product experiment based on this engine.

The old `demo/` folder is kept for history. It is useful, but it is mixed. New users should start from `example/`.

## How The Engine Is Built

`src/openworld.js` joins many small modules into one object:

```js
const openworld = {
  hooks,
  W: wjs,
  ...tool,
  ...main,
  ...texture,
  ...control,
  ...chunkManager,
  ...addobj,
  ...animate,
};
```

The engine object is also put on `window.openworld`, so it is easy to inspect in browser devtools.

The render side is `k.W`. It can create and update objects:

```js
k.W.cube({ n: 'box', x: 5, y: 1, z: 5, w: 2, h: 2, d: 2, b: 'e94560' });
k.W.sphere({ n: 'ball', x: 10, y: 1.5, z: 5, size: 2, b: '6bcb77' });
k.W.move({ n: 'box', ry: 45 });
```

The physics side is based on cannon:

```js
k.addPhy({
  name: 'mainPlayer',
  X: 10,
  Y: 3,
  Z: 10,
  size: 1,
  mass: 50,
  colliGroup: 1
});
```

The large world side uses TypeArray object data:

```js
k.addTABox({
  DPZ: 3,
  X: 10,
  Y: 2,
  Z: 20,
  width: 2,
  height: 4,
  depth: 2,
  background: '6a7a8a',
  mass: 0
});
```

DPZ means different load distance levels. A large world should not render and simulate every object all the time.

## Instancing

Instancing is one important feature.

Example from `example/p004-adv-w`:

```js
const insts = [];

for (let i = 0; i < 100000; i++) {
  insts.push({
    x: Math.random() * 100,
    y: Math.random() * 100,
    z: Math.random() * 100,
    b: '8888ff'
  });
}

k.W.cube({
  n: 'manyCubes',
  instances: insts,
  z: -50,
  y: 20
});
```

The plugin `plugins/webgl/wjsDynamicIns.js` also adds:

```js
k.W.updateInstance('manyCubes', 0, { x: 10, y: 5, b: 'ff0000' });
k.W.deleteInstance('manyCubes', 0);
```

This is useful for worlds with many simple objects, such as books, boxes, buildings, cards, stars, trees, or rooms.

## Plugins

The engine is not only one file. It is also a plugin playground.

Current plugin examples:

| Plugin | Meaning |
| --- | --- |
| `xmap` | Small map |
| `cookieSavePos` | Save player position |
| `xdashpanel` | Debug panel |
| `centerDot_clean` | Center point object picking |
| `testSampleAni` | Simple character animation |
| `build` | Build and edit cubes in world |
| `wjsDynamicIns` | Dynamic update for instanced objects |
| `sound` | Small sound effects |

The plugin system is still simple. But it is easy to read and change.

📌 Add one small plugin tutorial later. Best topic: make a mini map or save player position.

## Good Use Cases

OpenWorld-JS is suitable for:

- A small browser game.
- A web game jam project.
- A personal 3D website.
- A 3D portfolio.
- A virtual museum.
- A 3D library.
- A browser city scene.
- A creative coding world.
- A teaching demo with walking.
- A knowledge room or memory palace.
- A fast 3D landing page that is not only a static page.

The best use case now is not a big AAA game. The best use case is a small, fast, special world.

## What Is Stable Now

These parts are already usable:

- WebGL render core.
- Basic geometry.
- Texture support.
- First-person walk.
- Physics body creation.
- Camera movement.
- Instancing.
- Dynamic instance update.
- DPZ dynamic loading idea.
- Build tool demo.
- Big library demo.
- Cyber city demo.

These parts still need more cleaning:

- Public API names.
- English documentation.
- npm package story.
- TypeScript type files.
- More small examples.
- Better README images.
- More test pages.

## Current Status

This project is active.

The engine started as a small WebGL experiment and became bigger. Some old files are still in the repository. I am cleaning it step by step.

The examples work. The demo works. But the public API is not fully frozen.

If you use it now, read the examples first. If you fork it, you can change the engine directly. That is also the spirit of this project.

## Roadmap

- Clean the README and examples.
- Add screenshots and GIFs.
- Add one stable `p001-start` tutorial.
- Add one page API document.
- Add one CDN build.
- Add one npm package story.
- Add TypeScript declaration file.
- Add more small demo pages.
- Add better docs for plugins.
- Add a clear Open World Zone product page.

📌 Update roadmap every month. Remove finished items. Add only real next steps.

## FAQ

### Is this a Three.js replacement?

No.

Three.js is a big and mature 3D library. OpenWorld-JS is a small engine for my own browser world direction. It has rendering, physics, player control, and world plugins together.

### Why not use Three.js or Babylon.js?

I wanted a very small engine and I wanted to understand every part. I also wanted first-person world feeling from the start.

### Can I use it for a game?

Yes, for small browser games and prototypes. It is especially good when the world is made from many simple objects.

### Can I use it for a normal website?

Yes. The main website is `ow.ccgxk.com`. The idea is to let a web page become a place.

### Is there multiplayer?

There are multiplayer experiments and demos. This part is not the main public API yet, but it is real and can be shown.

### Is Open World Zone the same thing?

No.

OpenWorld-JS is the engine. Open World Zone is a future product direction based on the engine.

## License

MIT

## Star And Fork

If you like small engines, browser worlds, or strange WebGL experiments, star this repository.

If you want to build your own small world, fork it and start from `example/p001-start`.

Stars and forks help this project become easier for more developers to find.

---

# Private Notes, Do Not Paste Into README

This part is for repository growth. It is written in English only, but it is not public README text.

## Best GitHub Topics

Use these 20 topics:

```txt
javascript
webgl
3d
game-engine
game-development
gamedev
browser-game
web-game
javascript-game
javascript-game-engine
webgl-game
3d-engine
game-engine-3d
3d-game-engine
rendering-engine
physics-engine
creative-coding
lightweight
vanilla-js
multiplayer
```

Remove:

```txt
minify
```

Do not use now:

```txt
memory-palace
worldbuilding-tool
3d-knowledge-world
open-world
threejs
webgpu
```

The current search goal is browser WebGL engine, not the future product.

## Good Repository Description

Short version:

```txt
A lightweight WebGL engine for browser 3D worlds and small web games. First-person control, physics, instancing, and open-world demos.
```

More direct version:

```txt
Small WebGL engine for browser 3D worlds. No Three.js. First-person control, physics, instancing, and lightweight web game demos.
```

Search version:

```txt
Lightweight JavaScript WebGL game engine for browser 3D worlds, first-person movement, physics, instancing, and creative coding.
```

Use the search version if the main target is GitHub search.

## 1000-Point Action Plan For Today

100 actions. Each action is 10 points. Total is 1000 points. Do the highest value actions first.

### 1. First Screen

1. Add one GIF under the logo that shows walking in the big library.
2. Put `ow.ccgxk.com` before all other links.
3. Put the big library demo as the second link.
4. Put `openworld.zone` as future product, not as main engine website.
5. Add one sentence: "No Three.js. No Babylon.js."
6. Add one sentence: "First-person browser world engine."
7. Add one sentence asking for star in a direct and simple way.
8. Add a screenshot with many books, not only a logo.
9. Add a screenshot with the build tool panel.
10. Add a screenshot with Cyber City wall text.

### 2. Search

11. Update all 20 GitHub topics.
12. Update repository description with `WebGL`, `game engine`, `browser`, `3D worlds`.
13. Add the same keywords in the first 200 words of README.
14. Add `javascript-game-engine` into package keywords.
15. Add `webgl-game` into package keywords.
16. Add `browser-game` into package keywords.
17. Add `3d-engine` into package keywords.
18. Add `creative-coding` into package keywords.
19. Add `lightweight` into package keywords.
20. Add `physics-engine` into package keywords.

### 3. Trust

21. Add build result with file size.
22. Add the date of the build result.
23. Add browser test table.
24. Add device test table.
25. Add MIT license badge.
26. Add JavaScript badge.
27. Add WebGL badge.
28. Add Vite badge.
29. Add one line that API is still changing.
30. Add one line that examples are the best way to start.

### 4. Quick Start

31. Make `example/p001-start` open cleanly from Vite.
32. Add exact local URL for `p001-start`.
33. Add exact local URL for `p003-basic-w`.
34. Add exact local URL for `p004-adv-w`.
35. Add exact local URL for `p006-build-tool`.
36. Add one code block for HTML.
37. Add one code block for JavaScript.
38. Add one short control table.
39. Add one troubleshooting line for pointer lock.
40. Add one troubleshooting line for Vite port.

### 5. Demo Quality

41. Record a 10 second big library GIF.
42. Record a 10 second Cyber City GIF.
43. Record a 10 second build tool GIF.
44. Compress all GIFs.
45. Put images in `docs/images`.
46. Do not use dark unclear screenshots.
47. Use one bright screenshot as social preview image.
48. Show FPS panel in one performance screenshot.
49. Add one "300,000 books" image with text below.
50. Add one "100,000 cubes" image with text below.

### 6. Example Cleanup

51. Add a `README.md` inside `example/`.
52. Add a `README.md` inside `example/p001-start`.
53. Add a `README.md` inside `example/p003-basic-w`.
54. Add a `README.md` inside `example/p004-adv-w`.
55. Add a `README.md` inside `example/p006-build-tool`.
56. Rename unclear example titles into English.
57. Add one line at top of old `demo/README.md`: "Old demos, start from example folder."
58. Add screenshots into each example README.
59. Add controls into each example README.
60. Add one "what you learn" list into each example README.

### 7. Repository Shape

61. Add a clean repository tree in README.
62. Mark `demo/` as old.
63. Mark `open-world-zone/` as product experiment.
64. Mark `dist/` as generated build output.
65. Mark `src/` as engine core.
66. Mark `plugins/` as optional.
67. Mark `cannon/` as physics dependency.
68. Add one diagram of engine modules later.
69. Add one note that `node_modules` is not part of repository reading.
70. Remove or ignore `.DS_Store` files in future cleanup.

### 8. Star Conversion

71. Add "Star this repo" near the top, not only bottom.
72. Add "Fork it and change examples" near Quick Start.
73. Add "I will clean docs if stars grow" in simple words.
74. Add "Show me what you build" in Discussions later.
75. Turn on GitHub Discussions if not used.
76. Add one pinned Discussion: "Show your OpenWorld-JS demo."
77. Add one pinned Issue: "Good first demo improvements."
78. Add two `good first issue` labels.
79. Add one `help wanted` label.
80. Add one contribution note.

### 9. External Traffic

81. Add GitHub link on `ow.ccgxk.com` first screen.
82. Add star call on `ow.ccgxk.com`.
83. Add big demo link from README to website.
84. Add website link from GitHub About field.
85. Add README link to Zhihu article if the article is public.
86. Add one short English blog post on `openworld.zone`.
87. Add one Chinese blog post linking to GitHub.
88. Add one tweet or X post with GIF.
89. Add one Hacker News style title draft.
90. Add one Reddit post draft for `r/webdev` or `r/gamedev`.

### 10. Small Product Signals

91. Add a `docs/roadmap.md`.
92. Add a `docs/api.md`.
93. Add a `docs/examples.md`.
94. Add a `docs/performance.md`.
95. Add a `CHANGELOG.md`.
96. Add a `CONTRIBUTING.md`.
97. Add a `SECURITY.md` if needed.
98. Add a `CODE_OF_CONDUCT.md` only if community starts.
99. Add release `v0.1.0` when README and p001 are clean.
100. Add GitHub release notes with GIF and demo links.

## Highest Priority Today

Do these first:

1. Update GitHub topics.
2. Update repository description.
3. Replace README with the new first screen.
4. Add one strong GIF under logo.
5. Add `ow.ccgxk.com` as first link.
6. Add Quick Start with `npm run dev`.
7. Add example table.
8. Add repository map.
9. Add build size result.
10. Add "Star and fork" call near top and bottom.

These 10 actions are enough to change the first impression today.

## Screenshot List To Make

📌 `docs/images/openworld-js-demo.gif`: main walking GIF.

📌 `docs/images/big-library-300000-books.jpg`: big library screenshot.

📌 `docs/images/cyber-city-wall-text.gif`: Cyber City wall text GIF.

📌 `docs/images/100000-cubes-instancing.gif`: instancing demo GIF.

📌 `docs/images/build-tool-panel.jpg`: build tool screenshot.

📌 `docs/images/p001-start.jpg`: minimum example screenshot.

📌 `docs/images/p003-basic-shapes.jpg`: basic shapes screenshot.

📌 `docs/images/p005-dpz-loading.gif`: DPZ dynamic loading GIF.

## Simple Social Post Drafts

### Post 1

I made a small WebGL engine for browser 3D worlds.

It has first-person control, physics, instancing, and a big library demo with many books.

It does not use Three.js or Babylon.js.

GitHub: https://github.com/kohunglee/openworld-js

Demo: https://ow.ccgxk.com

### Post 2

OpenWorld-JS is my small browser 3D world engine.

I want web pages to feel like places, not only flat paper.

The engine is still young, but the demos are real.

Star it if you like small engines and browser worlds.

### Post 3

I am building a lightweight JavaScript WebGL game engine.

Current features:

- First-person movement
- Physics
- Instancing
- 100,000 cube example
- 300,000 book library demo
- Browser only

Repo: https://github.com/kohunglee/openworld-js

## README Tone Rules

Use simple English.

Do not use slang.

Do not use too many fancy words.

Do not use "please".

Do not sound like a big company.

Sound like one builder who made a real thing and wants other developers to try it.

Good sentence:

```txt
I made this engine because I want the browser to have more space.
```

Bad sentence:

```txt
Experience the next-generation paradigm of spatial computing.
```

Good sentence:

```txt
If this project gives you a new idea, give it a star.
```

Bad sentence:

```txt
Please consider supporting us by starring this repository.
```

## Future README Sections

Add these later, not today:

- API Reference
- Plugin Guide
- Build Tool Guide
- Multiplayer Guide
- Gamepad Guide
- Open World Zone Product Page
- Performance Deep Dive
- 300,000 Books Case Study
- Cyber City Case Study
- How To Make A 3D Knowledge Room
