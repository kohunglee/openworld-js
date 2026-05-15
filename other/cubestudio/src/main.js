import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { TransformControls } from 'three/addons/controls/TransformControls.js';

/**
 * Cube Studio 第一版配置。
 * 这里保持和 open-world-zone 的 dataProc 默认值一致，导出时才知道哪些字段可以省略。
 */
const DEFAULT_CUBE = Object.freeze({
    x: 0,
    y: 1,
    z: 0,
    w: 1,
    h: 1,
    d: 1,
    rx: 0,
    ry: 0,
    rz: 0,
});

const DEFAULT_COLOR = '#888888';
const DEFAULT_MIX_COLOR = '#888888';
const TEXTURE_URL = './assets/texture.jpeg?v=20260515';
const PRECISION = 3;
const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;
const SAMPLE_PATHS = {
    buildLab: './samples/build_lab.json',
    xhall: './samples/xhall.json',
};

const canvas = document.querySelector('#scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x101318);

const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 2000);
camera.position.set(18, 18, 26);

const orbit = new OrbitControls(camera, renderer.domElement);
orbit.enableDamping = true;
orbit.target.set(0, 1, 0);

const transform = new TransformControls(camera, renderer.domElement);
transform.setMode('translate');
transform.setTranslationSnap(0.1);
transform.setRotationSnap(15 * DEG_TO_RAD);
transform.setScaleSnap(0.1);
scene.add(transform);

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const cubeGroup = new THREE.Group();
const pivot = new THREE.Object3D();
scene.add(cubeGroup, pivot);

const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
const edgeGeometry = new THREE.BoxGeometry(1.01, 1.01, 1.01);
const selectionMaterial = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    wireframe: true,
    depthTest: false,
});

const clock = new THREE.Clock();
const moveVector = new THREE.Vector3();
const lookTarget = new THREE.Vector3();
const firstPersonEuler = new THREE.Euler(0, 0, 0, 'YXZ');
const defaultTextureImage = new Image();
const mixedTextureCache = new Map();
defaultTextureImage.addEventListener('load', refreshAllMaterials);
defaultTextureImage.src = TEXTURE_URL;

const state = {
    cubes: [],
    meshes: new Map(),
    selected: new Set(),
    history: [],
    future: [],
    dragSnapshot: null,
    isApplyingTransform: false,
    lastPreview: '',
    isFirstPerson: false,
    isPointerLocked: false,
    firstPersonKeys: new Set(),
    firstPersonSpeed: 8,
};

const els = {
    importText: document.querySelector('#import-text'),
    jsonPreview: document.querySelector('#json-preview'),
    statusLine: document.querySelector('#status-line'),
    exportName: document.querySelector('#export-name'),
    snapPosition: document.querySelector('#snap-position'),
    snapRotation: document.querySelector('#snap-rotation'),
    firstPerson: document.querySelector('#first-person'),
    crosshair: document.querySelector('#crosshair'),
    hudPrimary: document.querySelector('#hud-primary'),
};

const propInputs = [...document.querySelectorAll('[data-prop]')];
const modeButtons = {
    translate: document.querySelector('#mode-translate'),
    rotate: document.querySelector('#mode-rotate'),
    scale: document.querySelector('#mode-scale'),
};

initScene();
bindEvents();
addCube({ select: true, record: false });
pushHistory();
refreshJsonPreview();
animate();

/**
 * 初始化场景灯光、网格和辅助坐标轴。
 * 网格使用 5 单位主间距，方便对照现有建筑里常见的 5x5 地板块。
 */
function initScene() {
    const hemi = new THREE.HemisphereLight(0xf4fbff, 0x8aa39d, 2.9);
    scene.add(hemi);

    const ambient = new THREE.AmbientLight(0xffffff, 1.15);
    scene.add(ambient);

    const sun = new THREE.DirectionalLight(0xffffff, 1.6);
    sun.position.set(20, 30, 16);
    sun.castShadow = true;
    scene.add(sun);

    const grid = new THREE.GridHelper(120, 120, 0x64748b, 0x293241);
    grid.position.y = 0;
    scene.add(grid);

    const axes = new THREE.AxesHelper(8);
    axes.position.y = 0.02;
    scene.add(axes);
}

/**
 * 绑定 UI、键盘和 TransformControls 事件。
 * 删除不绑定快捷键，避免误删；撤销按用户确认只绑定 Cmd/Ctrl+Z。
 */
function bindEvents() {
    window.addEventListener('resize', resizeRenderer);
    renderer.domElement.addEventListener('pointerdown', handlePointerDown);

    transform.addEventListener('dragging-changed', (event) => {
        orbit.enabled = !event.value;
        if (event.value) {
            state.dragSnapshot = snapshotSelectedCubes();
        } else if (state.dragSnapshot) {
            pushHistory();
            state.dragSnapshot = null;
            refreshJsonPreview();
            updateStatus();
        }
    });
    transform.addEventListener('objectChange', applyPivotTransform);

    document.querySelector('#load-build-lab').addEventListener('click', () => loadSample(SAMPLE_PATHS.buildLab));
    document.querySelector('#load-xhall').addEventListener('click', () => loadSample(SAMPLE_PATHS.xhall));
    document.querySelector('#import-json').addEventListener('click', importJsonFromTextarea);
    document.querySelector('#clear-scene').addEventListener('click', clearScene);
    document.querySelector('#add-cube').addEventListener('click', () => addCube({ select: true, record: true }));
    document.querySelector('#duplicate-cube').addEventListener('click', duplicateSelection);
    document.querySelector('#delete-cube').addEventListener('click', deleteSelection);
    document.querySelector('#undo').addEventListener('click', undo);
    document.querySelector('#redo').addEventListener('click', redo);
    document.querySelector('#clear-color').addEventListener('click', clearSelectedColor);
    document.querySelector('#refresh-json').addEventListener('click', refreshJsonPreview);
    document.querySelector('#download-json').addEventListener('click', downloadJson);
    els.firstPerson.addEventListener('click', toggleFirstPerson);

    modeButtons.translate.addEventListener('click', () => setTransformMode('translate'));
    modeButtons.rotate.addEventListener('click', () => setTransformMode('rotate'));
    modeButtons.scale.addEventListener('click', () => setTransformMode('scale'));

    els.snapPosition.addEventListener('change', updateSnaps);
    els.snapRotation.addEventListener('change', updateSnaps);

    propInputs.forEach((input) => {
        input.addEventListener('change', () => updateSelectedFromInput(input));
    });

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    document.addEventListener('pointerlockchange', handlePointerLockChange);
    document.addEventListener('mousemove', handleFirstPersonMouseMove);
    resizeRenderer();
}

/**
 * 创建或更新单个方块 Mesh。
 * 所有几何都用单位立方体，通过 scale 表示 w/h/d，和导出字段保持一一对应。
 */
function upsertMesh(index) {
    const cube = state.cubes[index];
    let entry = state.meshes.get(index);

    if (!entry) {
        const material = new THREE.MeshStandardMaterial({
            color: '#ffffff',
            map: getMixedTexture(cube),
            emissive: '#3b3b3b',
            emissiveIntensity: 0.18,
            roughness: 0.72,
            metalness: 0.03,
        });
        const mesh = new THREE.Mesh(boxGeometry, material);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.userData.index = index;

        const outline = new THREE.Mesh(edgeGeometry, selectionMaterial);
        outline.visible = false;
        outline.renderOrder = 10;
        mesh.add(outline);

        cubeGroup.add(mesh);
        entry = { mesh, outline };
        state.meshes.set(index, entry);
    }

    const normalized = normalizeCube(cube);
    entry.mesh.position.set(normalized.x, normalized.y, normalized.z);
    entry.mesh.rotation.set(normalized.rx * DEG_TO_RAD, normalized.ry * DEG_TO_RAD, normalized.rz * DEG_TO_RAD);
    entry.mesh.scale.set(normalized.w, normalized.h, normalized.d);
    entry.mesh.material.color.set(cube.del ? '#ef4444' : '#ffffff');
    entry.mesh.material.map = getMixedTexture(cube);
    entry.mesh.material.needsUpdate = true;
    entry.mesh.visible = !cube.del;
    entry.outline.visible = state.selected.has(index) && !cube.del;
}

/**
 * 生成默认纹理和颜色的 50/50 混合贴图。
 * 有 b 时混合 b；没有 b 时混合 #888888，贴近当前 open-world-zone 的默认材质观感。
 */
function getMixedTexture(cube) {
    const color = normalizeColor(cube.b || DEFAULT_MIX_COLOR);
    if (mixedTextureCache.has(color)) return mixedTextureCache.get(color);
    const texture = makeMixedTexture(color);
    mixedTextureCache.set(color, texture);
    return texture;
}

function makeMixedTexture(color) {
    const size = 512;
    const textureCanvas = document.createElement('canvas');
    textureCanvas.width = size;
    textureCanvas.height = size;
    const ctx = textureCanvas.getContext('2d');

    if (defaultTextureImage.complete && defaultTextureImage.naturalWidth > 0) {
        ctx.drawImage(defaultTextureImage, 0, 0, size, size);
    } else {
        const gradient = ctx.createLinearGradient(0, 0, size, size);
        gradient.addColorStop(0, '#6db7ac');
        gradient.addColorStop(0.45, '#2f8077');
        gradient.addColorStop(1, '#153b39');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, size, size);
    }

    ctx.globalAlpha = 0.5;
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, size, size);
    ctx.globalAlpha = 1;

    const texture = new THREE.CanvasTexture(textureCanvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 8);
    return texture;
}

function refreshAllMaterials() {
    mixedTextureCache.forEach((texture) => texture.dispose());
    mixedTextureCache.clear();
    state.cubes.forEach((_, index) => upsertMesh(index));
}

/**
 * 根据当前数据全量刷新 Mesh。
 * 导入和撤销重做走这里，避免旧索引残留。
 */
function rebuildMeshes() {
    state.meshes.forEach(({ mesh }) => {
        mesh.material.dispose?.();
        cubeGroup.remove(mesh);
    });
    state.meshes.clear();
    state.cubes.forEach((_, index) => upsertMesh(index));
    updateSelectionVisuals();
}

/**
 * 新增方块放在当前选中方块右侧；没有选择时放到相机目标点附近并吸附到网格。
 * 这个位置比固定原点更符合持续建造时的手感。
 */
function addCube({ select, record }) {
    const base = getReasonableSpawnPosition();
    const cube = { x: base.x, y: base.y, z: base.z, w: 1, h: 1, d: 1 };
    state.cubes.push(cube);
    const index = state.cubes.length - 1;
    upsertMesh(index);
    if (select) setSelection([index]);
    if (record) pushHistory();
    refreshJsonPreview();
    updateStatus();
}

function getReasonableSpawnPosition() {
    const snap = Number(els.snapPosition.value) || 0.1;
    const selected = [...state.selected].sort((a, b) => b - a)[0];
    if (selected !== undefined && state.cubes[selected]) {
        const cube = normalizeCube(state.cubes[selected]);
        return {
            x: snapValue(cube.x + cube.w + snap, snap),
            y: snapValue(cube.y, snap),
            z: snapValue(cube.z, snap),
        };
    }
    return {
        x: snapValue(orbit.target.x, snap),
        y: 1,
        z: snapValue(orbit.target.z, snap),
    };
}

/**
 * 导入纯 JSON 数组。
 * 这里不执行 data.js，因为你第二轮确认第一版只支持 JSON。
 */
function importJsonFromTextarea() {
    try {
        const parsed = JSON.parse(els.importText.value.trim());
        if (!Array.isArray(parsed)) throw new Error('顶层必须是数组');
        state.cubes = parsed.map(sanitizeImportedCube);
        state.selected.clear();
        rebuildMeshes();
        pushHistory();
        refreshJsonPreview();
        updateStatus();
    } catch (error) {
        window.alert(`导入失败：${error.message}`);
    }
}

async function loadSample(path) {
    try {
        const response = await fetch(path);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        els.importText.value = JSON.stringify(data, null, 2);
        state.cubes = data.map(sanitizeImportedCube);
        state.selected.clear();
        rebuildMeshes();
        pushHistory();
        refreshJsonPreview();
        updateStatus();
    } catch (error) {
        window.alert(`示例加载失败：${error.message}。如果你是直接双击打开 HTML，请改用本目录静态服务打开。`);
    }
}

function clearScene() {
    state.cubes = [];
    state.selected.clear();
    rebuildMeshes();
    pushHistory();
    refreshJsonPreview();
    updateStatus();
}

function duplicateSelection() {
    const indices = [...state.selected].sort((a, b) => a - b);
    if (!indices.length) return;
    const snap = Number(els.snapPosition.value) || 0.1;
    const created = indices.map((index) => {
        const source = normalizeCube(state.cubes[index]);
        const clone = {
            ...state.cubes[index],
            x: snapValue(source.x + source.w + snap, snap),
            z: snapValue(source.z + snap, snap),
        };
        state.cubes.push(clone);
        const nextIndex = state.cubes.length - 1;
        upsertMesh(nextIndex);
        return nextIndex;
    });
    setSelection(created);
    pushHistory();
    refreshJsonPreview();
}

function deleteSelection() {
    const indices = [...state.selected].sort((a, b) => b - a);
    if (!indices.length) return;
    indices.forEach((index) => {
        state.cubes.splice(index, 1);
    });
    state.selected.clear();
    rebuildMeshes();
    pushHistory();
    refreshJsonPreview();
    updateStatus();
}

function clearSelectedColor() {
    if (!state.selected.size) return;
    state.selected.forEach((index) => {
        delete state.cubes[index].b;
        upsertMesh(index);
    });
    syncFormFromSelection();
    pushHistory();
    refreshJsonPreview();
}

/**
 * 单击 Mesh 选择；Shift 单击做多选开关。
 * 点空白处清空选择，让 gizmo 也同步隐藏。
 */
function handlePointerDown(event) {
    if (state.isFirstPerson) {
        handleFirstPersonPointerDown(event);
        return;
    }
    if (transform.dragging || event.button !== 0) return;
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(pointer, camera);
    const meshes = [...state.meshes.values()].map((entry) => entry.mesh).filter((mesh) => mesh.visible);
    const hit = raycaster.intersectObjects(meshes, false)[0];
    if (!hit) {
        setSelection([]);
        return;
    }

    const index = hit.object.userData.index;
    if (event.shiftKey) {
        const next = new Set(state.selected);
        if (next.has(index)) next.delete(index);
        else next.add(index);
        setSelection([...next]);
    } else {
        setSelection([index]);
    }
}

/**
 * 第一视角里鼠标用于转向，左键改成从屏幕中心发射射线选中方块。
 * 如果还没锁鼠标，第一次点击只负责进入 Pointer Lock。
 */
function handleFirstPersonPointerDown(event) {
    if (event.button !== 0) return;
    if (!state.isPointerLocked) {
        requestPointerLockSafe();
        return;
    }
    selectFromCameraCenter(event.shiftKey);
}

function selectFromCameraCenter(isAdditive) {
    raycaster.setFromCamera({ x: 0, y: 0 }, camera);
    const meshes = [...state.meshes.values()].map((entry) => entry.mesh).filter((mesh) => mesh.visible);
    const hit = raycaster.intersectObjects(meshes, false)[0];
    if (!hit) {
        if (!isAdditive) setSelection([]);
        return;
    }
    const index = hit.object.userData.index;
    if (isAdditive) {
        const next = new Set(state.selected);
        if (next.has(index)) next.delete(index);
        else next.add(index);
        setSelection([...next]);
        return;
    }
    setSelection([index]);
}

function setSelection(indices) {
    state.selected = new Set(indices.filter((index) => state.cubes[index] && !state.cubes[index].del));
    updateSelectionVisuals();
    attachTransformToSelection();
    syncFormFromSelection();
    updateStatus();
}

function updateSelectionVisuals() {
    state.meshes.forEach((entry, index) => {
        entry.outline.visible = state.selected.has(index) && entry.mesh.visible;
    });
}

/**
 * 多选时 gizmo 绑定到临时 pivot。
 * pivot 的初始矩阵会在每次选择和每次拖动结束后重置，拖动中只计算差量。
 */
function attachTransformToSelection() {
    transform.detach();
    if (state.isFirstPerson) return;
    if (!state.selected.size) return;
    const center = getSelectionCenter();
    pivot.position.copy(center);
    pivot.rotation.set(0, 0, 0);
    pivot.scale.set(1, 1, 1);
    pivot.updateMatrixWorld(true);
    transform.attach(pivot);
}

function getSelectionCenter() {
    const center = new THREE.Vector3();
    state.selected.forEach((index) => {
        center.add(normalizeVectorPosition(state.cubes[index]));
    });
    center.divideScalar(state.selected.size || 1);
    return center;
}

function applyPivotTransform() {
    if (!state.dragSnapshot || state.isApplyingTransform) return;
    const selected = [...state.selected];
    if (!selected.length) return;

    const basePivot = state.dragSnapshot.pivot;
    const nowPosition = pivot.position.clone();
    const deltaPosition = nowPosition.sub(basePivot.position);
    const deltaRotation = new THREE.Euler(
        pivot.rotation.x - basePivot.rotation.x,
        pivot.rotation.y - basePivot.rotation.y,
        pivot.rotation.z - basePivot.rotation.z,
    );
    const deltaScale = new THREE.Vector3(
        pivot.scale.x / basePivot.scale.x,
        pivot.scale.y / basePivot.scale.y,
        pivot.scale.z / basePivot.scale.z,
    );

    selected.forEach((index) => {
        const original = state.dragSnapshot.cubes.get(index);
        if (!original) return;
        const cube = state.cubes[index];
        cube.x = round(original.x + deltaPosition.x);
        cube.y = round(original.y + deltaPosition.y);
        cube.z = round(original.z + deltaPosition.z);
        cube.rx = round(original.rx + deltaRotation.x * RAD_TO_DEG);
        cube.ry = round(original.ry + deltaRotation.y * RAD_TO_DEG);
        cube.rz = round(original.rz + deltaRotation.z * RAD_TO_DEG);
        cube.w = Math.max(0.001, round(original.w * deltaScale.x));
        cube.h = Math.max(0.001, round(original.h * deltaScale.y));
        cube.d = Math.max(0.001, round(original.d * deltaScale.z));
        upsertMesh(index);
    });
    syncFormFromSelection();
}

function snapshotSelectedCubes() {
    const cubes = new Map();
    state.selected.forEach((index) => {
        cubes.set(index, normalizeCube(state.cubes[index]));
    });
    return {
        all: cloneCubes(state.cubes),
        cubes,
        pivot: {
            position: pivot.position.clone(),
            rotation: pivot.rotation.clone(),
            scale: pivot.scale.clone(),
        },
    };
}

function syncFormFromSelection() {
    const indices = [...state.selected];
    const cube = indices.length === 1 ? state.cubes[indices[0]] : null;
    propInputs.forEach((input) => {
        const prop = input.dataset.prop;
        input.disabled = !cube;
        if (!cube) {
            input.value = '';
            return;
        }
        if (input.type === 'color') {
            input.value = normalizeColor(cube.b || DEFAULT_COLOR);
        } else {
            input.value = cube[prop] ?? '';
        }
    });
}

function updateSelectedFromInput(input) {
    const [index] = state.selected;
    if (index === undefined) return;
    const prop = input.dataset.prop;
    const cube = state.cubes[index];

    if (input.type === 'color') {
        cube[prop] = input.value;
    } else if (prop === 't') {
        if (input.value.trim()) cube[prop] = input.value.trim();
        else delete cube[prop];
    } else if (input.value === '') {
        delete cube[prop];
    } else {
        cube[prop] = Number(input.value);
    }

    upsertMesh(index);
    attachTransformToSelection();
    pushHistory();
    refreshJsonPreview();
    updateStatus();
}

function refreshJsonPreview() {
    const json = JSON.stringify(state.cubes.map(toExportCube), null, 2);
    state.lastPreview = json;
    els.jsonPreview.value = json;
}

function downloadJson() {
    refreshJsonPreview();
    const blob = new Blob([state.lastPreview], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = sanitizeFileName(els.exportName.value || 'cubes.json');
    anchor.click();
    URL.revokeObjectURL(url);
}

/**
 * 导出时省略等于默认值的字段，也省略空颜色。
 * del/dz/st/t 属于用户显式语义字段，只要存在就保留。
 */
function toExportCube(cube) {
    if (cube.del) return { del: 1 };
    const normalized = normalizeCube(cube);
    const out = {};
    ['x', 'y', 'z', 'w', 'h', 'd', 'rx', 'ry', 'rz'].forEach((key) => {
        const value = round(normalized[key]);
        if (value !== DEFAULT_CUBE[key]) out[key] = value;
    });
    ['b', 'dz', 'st', 't', 'del'].forEach((key) => {
        if (cube[key] !== undefined && cube[key] !== '' && !(key === 'b' && !cube[key])) out[key] = cube[key];
    });
    return out;
}

function sanitizeImportedCube(item) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return { del: 1 };
    const cube = {};
    Object.entries(item).forEach(([key, value]) => {
        if (['x', 'y', 'z', 'w', 'h', 'd', 'rx', 'ry', 'rz', 'dz', 'st', 'del'].includes(key)) {
            if (Number.isFinite(Number(value))) cube[key] = Number(value);
        } else if (['b', 't'].includes(key) && value !== undefined && value !== null && value !== '') {
            cube[key] = String(value);
        }
    });
    return cube;
}

function normalizeCube(cube) {
    return {
        ...DEFAULT_CUBE,
        ...cube,
        x: numberOrDefault(cube.x, DEFAULT_CUBE.x),
        y: numberOrDefault(cube.y, DEFAULT_CUBE.y),
        z: numberOrDefault(cube.z, DEFAULT_CUBE.z),
        w: Math.max(0.001, numberOrDefault(cube.w, DEFAULT_CUBE.w)),
        h: Math.max(0.001, numberOrDefault(cube.h, DEFAULT_CUBE.h)),
        d: Math.max(0.001, numberOrDefault(cube.d, DEFAULT_CUBE.d)),
        rx: numberOrDefault(cube.rx, DEFAULT_CUBE.rx),
        ry: numberOrDefault(cube.ry, DEFAULT_CUBE.ry),
        rz: numberOrDefault(cube.rz, DEFAULT_CUBE.rz),
    };
}

function numberOrDefault(value, fallback) {
    return Number.isFinite(Number(value)) ? Number(value) : fallback;
}

function normalizeVectorPosition(cube) {
    const normalized = normalizeCube(cube);
    return new THREE.Vector3(normalized.x, normalized.y, normalized.z);
}

function updateSnaps() {
    const positionSnap = Number(els.snapPosition.value) || 0.1;
    const rotationSnap = Number(els.snapRotation.value) || 15;
    transform.setTranslationSnap(positionSnap);
    transform.setScaleSnap(positionSnap);
    transform.setRotationSnap(rotationSnap * DEG_TO_RAD);
}

function setTransformMode(mode) {
    transform.setMode(mode);
    Object.entries(modeButtons).forEach(([key, button]) => {
        button.classList.toggle('is-active', key === mode);
    });
}

/**
 * 第一视角模式用于在建筑内部走动并继续点选方块。
 * gizmo 鼠标拖拽需要退出第一视角后使用，避免和鼠标转向抢输入。
 */
function toggleFirstPerson() {
    if (state.isFirstPerson) exitFirstPerson();
    else enterFirstPerson();
}

function enterFirstPerson() {
    state.isFirstPerson = true;
    orbit.enabled = false;
    transform.detach();
    firstPersonEuler.setFromQuaternion(camera.quaternion);
    els.crosshair.hidden = false;
    els.firstPerson.classList.add('is-active');
    els.hudPrimary.textContent = '鼠标转向，WASD 移动，Space 上，Shift 下';
    requestPointerLockSafe();
}

/**
 * Pointer Lock 必须由用户手势触发，浏览器拒绝时保持第一视角按钮状态，
 * 用户再点一次画布即可重新申请。
 */
function requestPointerLockSafe() {
    const lockResult = renderer.domElement.requestPointerLock();
    if (lockResult?.catch) lockResult.catch(() => {});
}

function exitFirstPerson() {
    state.isFirstPerson = false;
    state.firstPersonKeys.clear();
    if (document.pointerLockElement === renderer.domElement) document.exitPointerLock();
    orbit.enabled = true;
    els.crosshair.hidden = true;
    els.firstPerson.classList.remove('is-active');
    els.hudPrimary.textContent = '左键选择';
    attachTransformToSelection();
}

function handlePointerLockChange() {
    state.isPointerLocked = document.pointerLockElement === renderer.domElement;
}

function handleFirstPersonMouseMove(event) {
    if (!state.isFirstPerson || !state.isPointerLocked) return;
    const sensitivity = 0.0022;
    firstPersonEuler.setFromQuaternion(camera.quaternion);
    firstPersonEuler.y -= event.movementX * sensitivity;
    firstPersonEuler.x -= event.movementY * sensitivity;
    firstPersonEuler.x = THREE.MathUtils.clamp(firstPersonEuler.x, -Math.PI / 2 + 0.02, Math.PI / 2 - 0.02);
    camera.quaternion.setFromEuler(firstPersonEuler);
    syncOrbitTargetToFirstPersonLook();
}

function handleKeyDown(event) {
    const target = event.target;
    const isTyping = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement;
    const mod = event.metaKey || event.ctrlKey;

    if (mod && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        if (event.shiftKey) redo();
        else undo();
        return;
    }

    if (state.isFirstPerson && !isTyping) {
        const key = normalizeMoveKey(event);
        if (key) {
            event.preventDefault();
            state.firstPersonKeys.add(key);
            return;
        }
        if (event.key === 'Escape') {
            exitFirstPerson();
            return;
        }
    }

    if (isTyping) return;
    if (event.key.toLowerCase() === 'v') {
        toggleFirstPerson();
        return;
    }
    if (event.key.toLowerCase() === 'w') setTransformMode('translate');
    if (event.key.toLowerCase() === 'e') setTransformMode('rotate');
    if (event.key.toLowerCase() === 'r') setTransformMode('scale');
}

function handleKeyUp(event) {
    const key = normalizeMoveKey(event);
    if (key) state.firstPersonKeys.delete(key);
}

function normalizeMoveKey(event) {
    const key = event.key.toLowerCase();
    if (['w', 'a', 's', 'd'].includes(key)) return key;
    if (event.code === 'Space') return 'space';
    if (event.key === 'Shift') return 'shift';
    return '';
}

function updateFirstPerson(delta) {
    if (!state.isFirstPerson || !state.isPointerLocked) return;
    const speed = state.firstPersonSpeed;
    const forward = Number(state.firstPersonKeys.has('w')) - Number(state.firstPersonKeys.has('s'));
    const right = Number(state.firstPersonKeys.has('d')) - Number(state.firstPersonKeys.has('a'));
    const up = Number(state.firstPersonKeys.has('space')) - Number(state.firstPersonKeys.has('shift'));
    moveVector.set(right, up, -forward);
    if (moveVector.lengthSq() === 0) return;
    moveVector.normalize();
    moveVector.applyQuaternion(camera.quaternion);
    if (up !== 0) {
        moveVector.y = up;
        moveVector.normalize();
    }
    camera.position.addScaledVector(moveVector, speed * delta);
    syncOrbitTargetToFirstPersonLook();
}

/**
 * 第一视角转向后同步 OrbitControls 的 target。
 * 退出第一视角时轨道视角会接上当前朝向，不再把相机拉回旧方向。
 */
function syncOrbitTargetToFirstPersonLook() {
    lookTarget.set(0, 0, -8).applyQuaternion(camera.quaternion).add(camera.position);
    orbit.target.copy(lookTarget);
}

function pushHistory() {
    const snapshot = cloneCubes(state.cubes);
    state.history.push(snapshot);
    if (state.history.length > 80) state.history.shift();
    state.future = [];
}

function undo() {
    if (state.history.length <= 1) return;
    const current = state.history.pop();
    state.future.push(cloneCubes(current));
    state.cubes = cloneCubes(state.history[state.history.length - 1]);
    state.selected.clear();
    rebuildMeshes();
    refreshJsonPreview();
    updateStatus();
}

function redo() {
    const next = state.future.pop();
    if (!next) return;
    state.history.push(cloneCubes(next));
    state.cubes = cloneCubes(next);
    state.selected.clear();
    rebuildMeshes();
    refreshJsonPreview();
    updateStatus();
}

function cloneCubes(cubes) {
    return JSON.parse(JSON.stringify(cubes));
}

function updateStatus() {
    const total = state.cubes.length;
    const selected = [...state.selected].sort((a, b) => a - b);
    if (!selected.length) {
        els.statusLine.textContent = `总数 ${total}，未选择方块`;
        return;
    }
    els.statusLine.textContent = `总数 ${total}，选中 ${selected.length} 个：#${selected.join(', #')}`;
}

function resizeRenderer() {
    const rect = canvas.parentElement.getBoundingClientRect();
    renderer.setSize(rect.width, rect.height, false);
    camera.aspect = rect.width / Math.max(rect.height, 1);
    camera.updateProjectionMatrix();
}

function animate() {
    requestAnimationFrame(animate);
    const delta = Math.min(clock.getDelta(), 0.05);
    updateFirstPerson(delta);
    if (!state.isFirstPerson) orbit.update();
    renderer.render(scene, camera);
}

function round(value) {
    return Number(Number(value).toFixed(PRECISION));
}

function snapValue(value, snap) {
    return round(Math.round(value / snap) * snap);
}

function normalizeColor(value) {
    if (typeof value !== 'string') return DEFAULT_COLOR;
    return value.startsWith('#') ? value : `#${value}`;
}

function sanitizeFileName(name) {
    const cleaned = name.trim().replace(/[\\/:*?"<>|]/g, '_');
    return cleaned.endsWith('.json') ? cleaned : `${cleaned}.json`;
}
