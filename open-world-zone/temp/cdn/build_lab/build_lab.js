/**
 * 兼容旧命名的入口文件
 *
 * CDN 正式入口已经切到 `index.js`。
 * 这里保留 `build_lab.js`，只是为了少改动目录结构，避免旧引用直接炸掉。
 * 真实位置由外部总配置传入，不再在这个文件里写死。
 */

import renderBuildLab from './index.js';

export default renderBuildLab;
