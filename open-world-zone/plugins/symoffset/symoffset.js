/**
 * 对称和阵列 插件
 * ========
 * 功能是帮助对称和阵列
 */

/**
 * 空间变换工具类
 */
class SymOffset {
    constructor(data, config = {}) {
        this.data = data;
        this.config = config;
    }

    /**
     * 执行对称操作
     * @param {Array} items - 物体索引数组
     * @param {Object} axes - 对称轴坐标 {x: 0, y: 10}
     */
    symo(items, axes = {}) {
        return this._process(items, (idx) => {
            if (this.config.notSymOff) return 0;
            const orig = this.data[idx];
            const agent = { ...orig };
            ["x", "y", "z"].forEach(axis => {
                if (axes[axis] !== undefined) {
                    agent[axis] -= (orig[axis] - axes[axis]) * 2;
                    const rot = (axis === 'z') ? 'x' : 'z';
                    if (agent['r' + rot]) agent['r' + rot] = -orig['r' + rot];
                    if(axis === 'z'  && agent['d'] === 0.001){  // ⚠️ 临时尝试修复 bug（我不明白原理，我只是在根据现象硬修，请注意！!!）
                        const zzz = (agent['z']).toFixed(3);
                        if( +zzz === -11.982 || +zzz === -4.652 ){
                            if( (agent['rx'] + agent['rz'] === 0) 
                                && ( Math.abs(agent['rx']) === 180 && Math.abs(agent['rz']) === 180 )
                            ) {
                                agent['rx'] = 0;
                                agent['rz'] = 0;
                            } else {
                                if( isNonZeroNumber(agent['rx']) || isNonZeroNumber(agent['rz']) ){
                                } else {
                                    agent['rz'] = 180;
                                    agent['rx'] = 180;
                                }
                            }
                        }
                        
                    }
                }
            });
            return this.data.push(agent) - 1; // 返回新生成的索引
        });
    }

    /**
     * 执行偏移阵列操作
     */
    offset(items, dist1, times, axis1, dist2, axis2, dist3, axis3) {
        if (this.config.notSymOff) return [];
        const configs = [
            { d: dist1, a: axis1 },
            { d: dist2, a: axis2 },
            { d: dist3, a: axis3 }
        ].filter(c => c.d && c.a);

        const results = [];
        for (let t = 1; t < times; t++) {
            results.push(...this._process(items, (idx) => {
                const agent = { ...this.data[idx] };
                configs.forEach(c => agent[c.a] -= c.d * t);
                return this.data.push(agent) - 1;
            }));
        }
        return results;
    }

    /**
     * 内部辅助：统一处理数字或范围数组 [start, end]
     * @private
     */
    _process(items, callback) {
        const added = [];
        items.forEach(it => {
            if (it === -1) return;
            if (Array.isArray(it)) {
                for (let n = it[0]; n <= it[1]; n++) added.push(callback(n));
            } else {
                added.push(callback(it));
            }
        });
        return added;
    }
}

/**
 * 插件入口
 */
export default function(ccgxkObj) {
    // console.log(' SymOffset 插件加载成功');
    ccgxkObj.SymOffset = SymOffset;
}

function isNonZeroNumber(value) {
  // 核心三个条件：是数字类型 + 不是NaN + 严格不等于0
  return typeof value === 'number' && !isNaN(value) && value !== 0;
}