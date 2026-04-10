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
`;
