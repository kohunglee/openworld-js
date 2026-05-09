/**
 * 信息板性能诊断中心
 *
 * 这个模块只做低成本统计，不参与真实渲染决策。所有队列、图片处理、Tab 面板
 * 都通过这里读写同一份指标，方便后面复盘“到底是哪一步卡住了”。
 */

const EVENT_LIMIT = 240;
const BROADCAST_INTERVAL = 250;

/**
 * 创建一份干净的指标对象，reset 时也复用这个结构。
 */
function createMetrics() {
    return {
        startedAt: Date.now(),
        frame: {
            lastDelta: 0,
            maxDelta: 0,
            hitchCount: 0,
            lastHitchAt: 0,
            lastHitchDelta: 0,
            hitchThreshold: 50,
        },
        updateQueue: {
            queued: 0,
            applied: 0,
            failed: 0,
            pending: 0,
            maxPending: 0,
            lastBoardId: '',
            lastApplyMs: 0,
            maxApplyMs: 0,
        },
        imageQueue: {
            queued: 0,
            cacheHits: 0,
            loadStarted: 0,
            loadFinished: 0,
            decodeFinished: 0,
            uploadQueued: 0,
            uploaded: 0,
            failed: 0,
            skippedInactive: 0,
            downscaled: 0,
            waitingLoads: 0,
            activeLoads: 0,
            waitingUploads: 0,
            lastImageId: '',
            lastLoadMs: 0,
            maxLoadMs: 0,
            lastDecodeMs: 0,
            maxDecodeMs: 0,
            lastDownscaleMs: 0,
            maxDownscaleMs: 0,
            lastUploadMs: 0,
            maxUploadMs: 0,
            totalUploadMs: 0,
        },
    };
}

const state = {
    metrics: createMetrics(),
    events: [],
    broadcastTimer: null,
    frameMonitorStarted: false,
};

/**
 * 保留两位小数，避免 Tab 面板反复渲染一堆长浮点数。
 */
function roundMs(value) {
    return Math.round((value || 0) * 100) / 100;
}

/**
 * 派发一个节流后的事件，Tab 面板会监听它刷新 UI。
 */
function scheduleBroadcast() {
    if (state.broadcastTimer) return;
    state.broadcastTimer = setTimeout(() => {
        state.broadcastTimer = null;
        window.dispatchEvent(new CustomEvent('signboard:perf-updated', {
            detail: signboardPerf.snapshot()
        }));
    }, BROADCAST_INTERVAL);
}

/**
 * 记录一条事件流水。流水只保留最近 EVENT_LIMIT 条，避免长期漫游时撑爆内存。
 */
function pushEvent(type, detail = {}) {
    state.events.push({
        type,
        detail,
        time: Date.now(),
        at: roundMs(performance.now()),
    });
    if (state.events.length > EVENT_LIMIT) {
        state.events.splice(0, state.events.length - EVENT_LIMIT);
    }
    scheduleBroadcast();
}

/**
 * 根据事件类型顺手更新聚合指标。这里故意保持直白，方便之后继续加字段。
 */
function aggregate(type, detail = {}) {
    const metrics = state.metrics;
    const uq = metrics.updateQueue;
    const iq = metrics.imageQueue;

    if (type === 'update:queued') {
        uq.queued += 1;
        uq.pending = detail.pending ?? uq.pending;
        uq.maxPending = Math.max(uq.maxPending, uq.pending);
        uq.lastBoardId = detail.boardId || uq.lastBoardId;
    } else if (type === 'update:applied') {
        uq.applied += 1;
        uq.pending = detail.pending ?? uq.pending;
        uq.lastBoardId = detail.boardId || uq.lastBoardId;
        uq.lastApplyMs = roundMs(detail.duration);
        uq.maxApplyMs = Math.max(uq.maxApplyMs, uq.lastApplyMs);
    } else if (type === 'update:failed') {
        uq.failed += 1;
        uq.pending = detail.pending ?? uq.pending;
        uq.lastBoardId = detail.boardId || uq.lastBoardId;
    } else if (type === 'image:queued') {
        iq.queued += 1;
        iq.lastImageId = detail.id || iq.lastImageId;
    } else if (type === 'image:cache-hit') {
        iq.cacheHits += 1;
        iq.lastImageId = detail.id || iq.lastImageId;
    } else if (type === 'image:load-start') {
        iq.loadStarted += 1;
        iq.lastImageId = detail.id || iq.lastImageId;
    } else if (type === 'image:load-end') {
        iq.loadFinished += 1;
        iq.lastLoadMs = roundMs(detail.duration);
        iq.maxLoadMs = Math.max(iq.maxLoadMs, iq.lastLoadMs);
        iq.lastImageId = detail.id || iq.lastImageId;
    } else if (type === 'image:decode-end') {
        iq.decodeFinished += 1;
        iq.lastDecodeMs = roundMs(detail.duration);
        iq.maxDecodeMs = Math.max(iq.maxDecodeMs, iq.lastDecodeMs);
        iq.lastImageId = detail.id || iq.lastImageId;
    } else if (type === 'image:upload-queued') {
        iq.uploadQueued += 1;
        iq.lastImageId = detail.id || iq.lastImageId;
    } else if (type === 'image:upload-end') {
        iq.uploaded += 1;
        iq.lastUploadMs = roundMs(detail.duration);
        iq.maxUploadMs = Math.max(iq.maxUploadMs, iq.lastUploadMs);
        iq.totalUploadMs = roundMs(iq.totalUploadMs + iq.lastUploadMs);
        iq.lastImageId = detail.id || iq.lastImageId;
    } else if (type === 'image:downscale-end') {
        iq.downscaled += 1;
        iq.lastDownscaleMs = roundMs(detail.duration);
        iq.maxDownscaleMs = Math.max(iq.maxDownscaleMs, iq.lastDownscaleMs);
        iq.lastImageId = detail.id || iq.lastImageId;
    } else if (type === 'image:skip-inactive') {
        iq.skippedInactive += 1;
        iq.lastImageId = detail.id || iq.lastImageId;
    } else if (type === 'image:failed') {
        iq.failed += 1;
        iq.lastImageId = detail.id || iq.lastImageId;
    } else if (type === 'frame:hitch') {
        metrics.frame.hitchCount += 1;
        metrics.frame.lastHitchAt = Date.now();
        metrics.frame.lastHitchDelta = roundMs(detail.delta);
    }
}

export const signboardPerf = {
    /**
     * 记录一个诊断事件，并更新聚合指标。
     */
    mark(type, detail = {}) {
        aggregate(type, detail);
        pushEvent(type, detail);
    },

    /**
     * 队列这类高频变化直接打补丁，不额外产生事件流水。
     */
    patch(section, detail = {}) {
        if (!state.metrics[section]) return;
        Object.assign(state.metrics[section], detail);
        scheduleBroadcast();
    },

    /**
     * 开启 rAF 帧间隔监控，用来捕捉“一瞬间卡一下”的体感问题。
     */
    startFrameMonitor() {
        if (state.frameMonitorStarted) return;
        state.frameMonitorStarted = true;
        let last = performance.now();
        const loop = now => {
            const delta = now - last;
            last = now;
            const frame = state.metrics.frame;
            frame.lastDelta = roundMs(delta);
            frame.maxDelta = Math.max(frame.maxDelta, frame.lastDelta);
            if (delta >= frame.hitchThreshold) {
                signboardPerf.mark('frame:hitch', { delta });
            } else {
                scheduleBroadcast();
            }
            requestAnimationFrame(loop);
        };
        requestAnimationFrame(loop);
    },

    /**
     * 获取一份可安全打印/渲染的快照。
     */
    snapshot() {
        const metrics = JSON.parse(JSON.stringify(state.metrics));
        metrics.events = state.events.slice(-40);
        metrics.imageQueue.avgUploadMs = metrics.imageQueue.uploaded
            ? roundMs(metrics.imageQueue.totalUploadMs / metrics.imageQueue.uploaded)
            : 0;
        return metrics;
    },

    /**
     * 清空统计数据，但保留已经开启的帧监控。
     */
    reset() {
        const hitchThreshold = state.metrics.frame.hitchThreshold;
        state.metrics = createMetrics();
        state.metrics.frame.hitchThreshold = hitchThreshold;
        state.events = [];
        pushEvent('perf:reset');
    },
};

window.signboardPerf = signboardPerf;
window.signboardPerfSnapshot = () => signboardPerf.snapshot();
