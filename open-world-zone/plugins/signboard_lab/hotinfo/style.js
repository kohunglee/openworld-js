/**
 * 热点信息样式
 */

export const styleCode = `
#signHotInfoToggle {
    position: fixed;
    z-index: 1;
    left: 75px;
    top: 50px;
    min-width: 44px;
    border: 1px solid #d7d7d7;
    color: #969191;
    text-shadow: 0px -1px 8px #ffffff;
    cursor: pointer;
    backdrop-filter: blur(8px);
    background: #ffffffb5;
}

#signHotInfoToggle:active {
    transform: scale(0.95);
}

.sign-hot-info {
    position: fixed;
    top: 90px;
    left: 10px;
    padding: 8px 12px;
    min-width: 180px;
    max-width: 300px;
    z-index: 100;
    backdrop-filter: blur(8px);
    background: #ffffffb5;
}

.sign-hot-info-title {
    font-weight: 600;
    color: #555;
}

.sign-hot-info-row {
    margin: 4px 0;
    line-height: 1.5;
}

.sign-hot-info-label {
    color: #888;
    font-size: 11px;
}

.sign-hot-info-value {
    color: #333;
    word-break: break-all;
    font-family: monospace;
}

.sign-hot-info-remark {
    background: rgba(255, 250, 220, 0.8);
    padding: 6px 8px;
    white-space: pre-line;
}

.sign-hot-info-view-original {
    margin: 6px 0;
    padding: 4px 0;
}

.sign-hot-info-view-original a {
    cursor: pointer;
    text-decoration: underline;
    font-size: 13px;
}

.sign-hot-info-view-original a:hover {
    color: #1d4ed8;
}

/* 全屏图片遮罩层 */
#signHotInfoOverlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.85);
    z-index: 99999;
    display: none;
    justify-content: center;
    align-items: center;
}

#signHotInfoOverlay img {
    max-width: 90%;
    max-height: 90%;
    cursor: pointer;
    object-fit: contain;
}

#signHotInfoTextModal {
    position: fixed;
    inset: 0;
    z-index: 100000;
    display: none;
    align-items: center;
    justify-content: center;
}

.sign-hot-info-text-modal-backdrop {
    position: absolute;
    inset: 0;
    background: rgba(15, 23, 42, 0.42);
    backdrop-filter: blur(3px);
}

.sign-hot-info-text-modal-panel {
    position: relative;
    width: min(50vw, 900px);
    height: min(50vh, 700px);
    min-width: 320px;
    min-height: 240px;
    display: flex;
    flex-direction: column;
    background: rgba(255, 255, 255, 0.97);
    border: 1px solid rgba(148, 163, 184, 0.45);
    box-shadow: 0 24px 80px rgba(15, 23, 42, 0.2);
}

.sign-hot-info-text-modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    border-bottom: 1px solid rgba(148, 163, 184, 0.3);
    font-size: 14px;
    color: #1f2937;
}

.sign-hot-info-text-modal-actions {
    display: flex;
    align-items: center;
    gap: 8px;
}

.sign-hot-info-text-modal-header button {
    border: 1px solid rgba(148, 163, 184, 0.55);
    background: #fff;
    color: #334155;
    cursor: pointer;
    padding: 4px 10px;
}

.sign-hot-info-text-modal-body {
    flex: 1;
    overflow: auto;
    padding: 16px;
}

.sign-hot-info-text-modal-body pre {
    margin: 0;
    white-space: pre-wrap;
    word-break: break-word;
    font-size: 14px;
    line-height: 1.7;
    color: #111827;
    user-select: text;
}

.sign-hot-info-text-modal-body pre a {
    color: #2563eb;
    text-decoration: underline;
}

.sign-hot-info-text-modal-body pre a:hover {
    color: #1d4ed8;
}
`;
