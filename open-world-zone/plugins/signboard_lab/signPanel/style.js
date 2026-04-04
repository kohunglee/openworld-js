/**
 * 液态玻璃风格 CSS
 * ========
 * Glassmorphism UI 样式定义
 */

export const styleCode = `
.sign-panel-backdrop {
    position: fixed;
    top: 0; left: 0;
    width: 100vw; height: 100vh;
    z-index: 999;
    background: rgba(0, 0, 0, 0.15);
    backdrop-filter: blur(2px);
}

.sign-panel-modal {
    position: fixed;
    z-index: 1000;
}

.sign-panel-box {
    width: 520px;
    height: 420px;
    /* 液态玻璃核心 */
    background: linear-gradient(
        135deg,
        rgba(255, 255, 255, 0.45) 0%,
        rgba(255, 255, 255, 0.25) 50%,
        rgba(255, 255, 255, 0.35) 100%
    );
    backdrop-filter: blur(20px) saturate(180%);
    -webkit-backdrop-filter: blur(20px) saturate(180%);
    border-radius: 20px;
    border: 1px solid rgba(255, 255, 255, 0.5);
    box-shadow:
        0 8px 32px rgba(0, 0, 0, 0.12),
        0 2px 8px rgba(0, 0, 0, 0.08),
        inset 0 1px 0 rgba(255, 255, 255, 0.6),
        inset 0 -1px 0 rgba(255, 255, 255, 0.2);
    overflow: hidden;
    display: flex;
    flex-direction: column;
}

/* 顶部高光 */
.sign-panel-box::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 50%;
    background: linear-gradient(
        180deg,
        rgba(255, 255, 255, 0.3) 0%,
        rgba(255, 255, 255, 0) 100%
    );
    border-radius: 20px 20px 0 0;
    pointer-events: none;
}

.sign-panel-header {
    color: rgba(30, 30, 30, 0.85);
    padding: 12px 18px;
    cursor: move;
    display: flex;
    justify-content: space-between;
    align-items: center;
    user-select: none;
    border-bottom: 1px solid rgba(255, 255, 255, 0.3);
    position: relative;
    z-index: 1;
}

.sign-panel-title {
    font-size: 14px;
    font-weight: 600;
    text-shadow: 0 1px 1px rgba(255, 255, 255, 0.5);
    letter-spacing: 0.3px;
}

.sign-panel-title-id {
    font-size: 12px;
    color: rgba(60, 60, 60, 0.6);
    margin-left: 10px;
    font-weight: 400;
}

.sign-panel-close {
    background: rgba(255, 255, 255, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.4);
    color: rgba(100, 100, 100, 0.7);
    font-size: 16px;
    cursor: pointer;
    padding: 2px 8px;
    line-height: 1;
    border-radius: 8px;
    transition: all 0.2s ease;
}

.sign-panel-close:hover {
    background: rgba(255, 100, 100, 0.4);
    color: rgba(180, 50, 50, 0.9);
    border-color: rgba(255, 100, 100, 0.5);
}

/* 模式切换栏 */
.sign-mode-bar {
    padding: 10px 18px;
    display: flex;
    gap: 8px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.25);
    position: relative;
    z-index: 1;
}

.sign-mode-btn {
    padding: 6px 18px;
    border: 1px solid rgba(255, 255, 255, 0.4);
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.15);
    color: rgba(60, 60, 60, 0.75);
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.25s ease;
    text-shadow: 0 1px 0 rgba(255, 255, 255, 0.5);
}

.sign-mode-btn:hover {
    background: rgba(255, 255, 255, 0.35);
    border-color: rgba(255, 255, 255, 0.6);
}

.sign-mode-btn.active {
    background: linear-gradient(
        135deg,
        rgba(90, 160, 255, 0.6) 0%,
        rgba(70, 130, 230, 0.6) 100%
    );
    color: rgba(255, 255, 255, 0.95);
    border-color: rgba(100, 160, 255, 0.6);
    box-shadow: 0 2px 12px rgba(70, 130, 230, 0.3);
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

/* 内容区 */
.sign-panel-content {
    padding: 14px 18px;
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    position: relative;
    z-index: 1;
}

/* text 模式 */
.sign-panel-textarea {
    flex: 1;
    width: 100%;
    resize: none;
    background: rgba(255, 255, 255, 0.25);
    border: 1px solid rgba(255, 255, 255, 0.4);
    border-radius: 12px;
    color: rgba(30, 30, 30, 0.9);
    font-size: 14px;
    font-family: 'Microsoft YaHei', sans-serif;
    padding: 12px 14px;
    line-height: 1.65;
    outline: none;
    box-sizing: border-box;
    transition: all 0.2s ease;
}

.sign-panel-textarea::placeholder {
    color: rgba(100, 100, 100, 0.5);
}

.sign-panel-textarea:focus {
    background: rgba(255, 255, 255, 0.4);
    border-color: rgba(100, 160, 255, 0.6);
    box-shadow: 0 0 0 3px rgba(100, 160, 255, 0.15);
}

/* image 模式 */
.sign-image-area {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 10px;
    overflow: hidden;
}

.sign-image-input {
    width: 100%;
    padding: 10px 14px;
    border: 1px solid rgba(255, 255, 255, 0.4);
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.25);
    color: rgba(30, 30, 30, 0.9);
    font-size: 13px;
    outline: none;
    box-sizing: border-box;
    transition: all 0.2s ease;
}

.sign-image-input::placeholder {
    color: rgba(100, 100, 100, 0.5);
}

.sign-image-input:focus {
    background: rgba(255, 255, 255, 0.4);
    border-color: rgba(100, 160, 255, 0.6);
    box-shadow: 0 0 0 3px rgba(100, 160, 255, 0.15);
}

.sign-image-preview {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px dashed rgba(255, 255, 255, 0.4);
    border-radius: 12px;
    overflow: hidden;
    min-height: 0;
    background: rgba(255, 255, 255, 0.1);
}

.sign-image-preview img {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
}

.sign-image-preview .placeholder {
    color: rgba(100, 100, 100, 0.5);
    font-size: 12px;
}

/* 底部栏 */
.sign-panel-footer {
    padding: 12px 18px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-top: 1px solid rgba(255, 255, 255, 0.25);
    position: relative;
    z-index: 1;
}

.sign-panel-status {
    font-size: 12px;
    color: rgba(80, 80, 80, 0.6);
    font-weight: 500;
}

.sign-panel-status.saving {
    color: rgba(200, 150, 50, 0.9);
}

.sign-panel-status.saved {
    color: rgba(80, 180, 100, 0.9);
}

.sign-panel-status.error {
    color: rgba(200, 80, 80, 0.9);
}

.sign-save-btn {
    padding: 8px 28px;
    background: linear-gradient(
        135deg,
        rgba(90, 160, 255, 0.7) 0%,
        rgba(70, 130, 230, 0.7) 100%
    );
    color: rgba(255, 255, 255, 0.95);
    border: 1px solid rgba(100, 160, 255, 0.5);
    border-radius: 12px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.25s ease;
    box-shadow: 0 4px 15px rgba(70, 130, 230, 0.25);
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.15);
}

.sign-save-btn:hover {
    background: linear-gradient(
        135deg,
        rgba(100, 170, 255, 0.8) 0%,
        rgba(80, 145, 240, 0.8) 100%
    );
    box-shadow: 0 6px 20px rgba(70, 130, 230, 0.35);
    transform: translateY(-1px);
}

.sign-save-btn:active {
    transform: translateY(0);
}

.sign-save-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
}

.sign-save-hint {
    font-size: 11px;
    color: rgba(100, 100, 100, 0.5);
    margin-left: 10px;
}
`;
