/**
 * 动态操作 webgl 的实例化对象
 * ========
 */

// 插件入口
export default function(ccgxkObj) {
    const W = ccgxkObj.W;
    W.dynimicIns = true;  // 标识 动态实例化 已开启

    // 函数：更新实例化对象
    // 参数：objName：W 物体对象的名称； index：索引； props：新内容；
    W.updateInstance = function(objName, index, props) {
        const state = W.next[objName];
        if (!state?.isInstanced || !state.instances?.[index]) return;
        const instance = state.instances[index];
        Object.assign(instance, props);  // 合并修改

        const m = new DOMMatrix();  // 重新计算该条数据的矩阵
        m.translateSelf(
                (instance.x || 0) + (state.x || 0),
                (instance.y || 0) + (state.y || 0),
                (instance.z || 0) + (state.z || 0))
        .rotateSelf(instance.rx || 0, instance.ry || 0, instance.rz || 0)
        .scaleSelf(instance.w || 1, instance.h || 1, instance.d || 1);

        const matrixBuffer = W.instanceMatrixBuffers[objName];
        W.gl.bindBuffer(W.gl.ARRAY_BUFFER, matrixBuffer);
        W.gl.bufferSubData(W.gl.ARRAY_BUFFER, index * 16 * 4, m.toFloat32Array());

        if (props.b) {  // 更新颜色
            const colorBuffer = W.instanceColorBuffers[objName];
            W.gl.bindBuffer(W.gl.ARRAY_BUFFER, colorBuffer);
            W.gl.bufferSubData(W.gl.ARRAY_BUFFER, index * 4 * 4, new Float32Array(W.col(props.b)));
        }
    }

      // 函数：动态删除某实例化对象（假删除）
      // 参数：objName：W 物体对象的名称； index：索引；
    W.deleteInstance = function(objName, index) {
        W.updateInstance(objName, index, { w: 0.001, h: 0.001, d: 0.001 });
    }
}