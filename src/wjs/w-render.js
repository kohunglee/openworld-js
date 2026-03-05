// WebGL框架 - 渲染模块
// ===============

export default function initWRender(W) {
  // 绘制场景
  W.draw = (now, dt, v, i, transparent = []) => {
        const frameRenderStart = performance.now();  // 记录开始的时间
        dt = now - W.lastFrame;
        W.lastFrame = now;
        requestAnimationFrame(W.draw);
        if (W.debugFBO) {  // 如果打开，就播放 FBO 的画面，然后直接结束这一帧
          renderFBOToCanvas();
          return;
        } else {
          if(W.next.camera.g){  W.render(W.next[W.next.camera.g], dt, 1); }
          v = W.animation('camera');  //  获取相机的矩阵
          if(W.next?.camera?.g){
            v.preMultiplySelf(W.next[W.next.camera.g].M || W.next[W.next.camera.g].m);
          }
          W.gl.uniformMatrix4fv(W.uniformLocations.eye, false, v.toFloat32Array());  // 相机矩阵发往着 eye 着色器
          v.invertSelf();
          v.preMultiplySelf(W.projection);
          W.gl.uniformMatrix4fv(W.uniformLocations.pv,  // 处理好 pv ，传给着色器
                                false,
                                v.toFloat32Array());
          W.wjsHooks.emitSync('shadow_draw', W);  // 绘制阴影插件的钩子
          W.gl.clear(16640);
          for(i in W.next) {  // 遍历渲染模型
            const object = W.next[i];
            if(object.hidden !== true) {  // hidden 物体不渲染（用于更灵活的减少 recall 数量）
                if (!object.isInstanced && !object.t && W.col(object.b)[3] == 1) {
                W.render(object, dt);
              } else {
                transparent.push(object);  // 透明的先不渲染，存起来
              }
            }
          }
          transparent.sort((a, b) => {return W.dist(b) - W.dist(a);});  // 感觉会损失性能，先注释掉
          W.gl.enable(3042);
          W.gl.depthMask(1)
          for(i of transparent) {  // 遍历渲染透明对象（这几行好抽象，后续再优化）
            if (i.isInstanced) {
              W.render(i, dt);
            }
          }
          for(i of transparent){
            if (!i.isInstanced) {
              W.render(i, dt);
            }
          }
          W.gl.depthMask(1);
          W.gl.disable(3042);
        }
        W.gl.uniform3f(  // light 信息发往着色器
          W.uniformLocations.light,
          W.lerp('light','x'), W.lerp('light','y'), W.lerp('light','z')
        );

        if (now - W.lastReportTime >= 1000) {  // 每秒执行一次，用于测量
            W.drawTime = (performance.now() - frameRenderStart).toFixed(2) + 'ms';  // 每帧的绘制时间
            W.lastReportTime = now;
        }
  };

  // 渲染对象
  W.render = (object, dt, just_compute = ['camera','light','group'].includes(object.type), buffer) => {
        if(object.t) {  // 设置纹理
          W.gl.activeTexture(W.gl.TEXTURE0);
          W.gl.bindTexture(3553 , W.textures[object.t.id]);
          W.gl.uniform1i(W.uniformLocations.sampler, 0);
          W.gl.uniform2f(  // 纹理平铺->着色器（tiling）
            W.uniformLocations.tiling,
            object.tile?.[0] || 1,
            object.tile?.[1] || 1
          );
        }
        if (!object.isInstanced) {  // 处理普通对象
          if(object.f < object.a) object.f += dt;
          if(object.f > object.a) object.f = object.a;
          W.next[object.n].m = W.animation(object.n);
          if(W.next[object.g]){  // 组 处理
            W.next[object.n].m.preMultiplySelf(W.next[object.g].M || W.next[object.g].m);
          }

          //---- 易报错代码 ----------------------------------------------------------------


          function safeUniformMatrix(gl, location, mat) {  // 安全传矩阵，确保不会报错，数据合法
            const arr = mat?.toFloat32Array?.() || [];
            if (!arr.length || arr.some(v => !Number.isFinite(v))) throw new Error();
            gl.uniformMatrix4fv(location, false, arr);
          }

          if (!just_compute) {
            let safeMat;
            const raw = W.next?.[object.n]?.M || W.next?.[object.n]?.m;
            const arr = new DOMMatrix(raw).toFloat32Array();
            safeMat = arr.some(v => !Number.isFinite(v)) ? new DOMMatrix() : new DOMMatrix(raw);
            safeUniformMatrix(W.gl, W.uniformLocations.m, safeMat);
            let inv = safeMat.is2D ? safeMat.inverse() : safeMat.invertSelf();
            safeUniformMatrix(W.gl, W.uniformLocations.im, inv);
          }


          //------------------------------------------------------------------------------------

        }
        if(!just_compute){  // 渲染可见物体

          W.gl.disableVertexAttribArray(W.attribLocations.uv);  // 安全重置所有 attribute 状态（防止空绑定）by chatgpt
          W.gl.disableVertexAttribArray(W.attribLocations.normal);
          W.gl.disableVertexAttribArray(W.attribLocations.col);
          const instLoc = W.attribLocations.instanceModelMatrix;
          for (let i = 0; i < 4; i++) W.gl.disableVertexAttribArray(instLoc + i);

          if(!W.models[object.type]?.verticesBuffer) {  // 热更新模型时会报错，一个勉强的解法。以后再优化
            return 0;
          }
          W.gl.bindBuffer(34962 , W.models[object.type].verticesBuffer);
          W.gl.vertexAttribPointer(buffer = W.attribLocations.pos, 3, 5126 , false, 0, 0);
          W.gl.enableVertexAttribArray(buffer);
          W.gl.vertexAttribDivisor(buffer, 0);
          if(W.models[object.type].uvBuffer){  // uv->着色器（uv）
            W.gl.bindBuffer(34962 , W.models[object.type].uvBuffer);
            W.gl.vertexAttribPointer(buffer = W.attribLocations.uv, 2, 5126 , false, 0, 0);
            W.gl.enableVertexAttribArray(buffer);
            W.gl.vertexAttribDivisor(buffer, 0);
          }
          if((object.s || W.models[object.type].customNormals) && W.models[object.type].normalsBuffer){  // 法线->着色器（normal）
            W.gl.bindBuffer(34962 , W.models[object.type].normalsBuffer);
            W.gl.vertexAttribPointer(buffer = W.attribLocations.normal, 3, 5126 , false, 0, 0);
            W.gl.enableVertexAttribArray(buffer);
            W.gl.vertexAttribDivisor(buffer, 0);
          }
          W.gl.uniform1i(W.uniformLocations.isInstanced, object.isInstanced ? 1 : 0);  // 实例化布尔值->着色器
          if (object.isInstanced && W.instanceMatrixBuffers[object.n]) {  // 实例化对象的各种数据
            const instanceMatrixBuffer = W.instanceMatrixBuffers[object.n];
            W.gl.bindBuffer(W.gl.ARRAY_BUFFER, instanceMatrixBuffer);
            const loc = W.attribLocations.instanceModelMatrix;
            const bytesPerMatrix = 4 * 4 * Float32Array.BYTES_PER_ELEMENT;
            for (let i = 0; i < 4; ++i) {  // 分四次->着色器（instanceModelMatrix）
              const currentLoc = loc + i;
              W.gl.enableVertexAttribArray(currentLoc);
              W.gl.vertexAttribPointer(currentLoc, 4, W.gl.FLOAT, false, bytesPerMatrix, i * 4 * Float32Array.BYTES_PER_ELEMENT);
              W.gl.vertexAttribDivisor(currentLoc, 1);
            }
          }
          W.gl.uniform4f(  // o选项->着色器（o）
            W.uniformLocations.o,
            object.s,
            ((object.mode > 3) || (W.gl[object.mode] > 3)) && !object.ns ? 1 : 0,
            W.ambientLight || 0.2,
            object.mix
          );
          W.gl.uniform4f(  // 广告牌->着色器（bb）
            W.uniformLocations.bb,
            object.w,
            object.h,
            object.type == 'billboard',
            0
          );
          const colorAttribLoc = W.attribLocations.col;

          if (object.isInstanced) {  // （实例化和普通）颜色->着色器（col）
            W.gl.enableVertexAttribArray(colorAttribLoc);
            W.gl.bindBuffer(W.gl.ARRAY_BUFFER, W.instanceColorBuffers[object.n]);
            W.gl.vertexAttribPointer(colorAttribLoc, 4, W.gl.FLOAT, false, 0, 0);
            W.gl.vertexAttribDivisor(colorAttribLoc, 1);
          } else {
            W.gl.vertexAttrib4fv(colorAttribLoc, W.col(object.b || '888'));
          }

          if(object.uncullface) {  // 面剔除的判断，不知道这样写是否会影响性能
            W.gl.disable(2884);
            W.cullface = false;
          } else {
            if(W.cullface !== true){  // 避免频繁开关
              W.gl.enable(2884);
              W.cullface = true;
            }
          }
          if(W.models[object.type].indicesBuffer){  // 存在索引的绘制
            W.gl.bindBuffer(34963, W.models[object.type].indicesBuffer);  // 重新拿起索引数据
            if (object.isInstanced) { // 索引+实例化
              W.gl.drawElementsInstanced(
                +object.mode || W.gl[object.mode],W.models[object.type].indices.length,W.gl.UNSIGNED_SHORT,0,object.numInstances
              );
            } else { // 正常
              W.gl.drawElements(+object.mode || W.gl[object.mode], W.models[object.type].indices.length, 5123 , 0);
            }
          }
          else { // 不存在索引的绘制
            if (object.isInstanced) {  //无索引+实例化
              W.gl.drawArraysInstanced(+object.mode || W.gl[object.mode],0,W.models[object.type].vertices.length / 3,object.numInstances);
            } else {  // 正常
              W.gl.drawArrays(+object.mode || W.gl[object.mode], 0, W.models[object.type].vertices.length / 3);
            }
          }
          if (object.isInstanced) {  // 清理实例化对象状态，防止误伤普通对象
            const loc = W.attribLocations.instanceModelMatrix;
            for (let i = 0; i < 4; ++i) {
              W.gl.vertexAttribDivisor(loc + i, 0);
              W.gl.disableVertexAttribArray(loc + i);
            }
            W.gl.vertexAttribDivisor(colorAttribLoc, 0);
            W.gl.disableVertexAttribArray(colorAttribLoc);
          }
        }
  };
}
