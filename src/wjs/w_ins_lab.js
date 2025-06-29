// WebGL框架
// ===============
import hooks from '../common/hooks.js';  // 引入 JS 钩子

const W = {
  // 一些容器
  models: {},
  instanceMatrixBuffers: {}, // 实例化对象的矩阵数据
  instanceColorBuffers: {},  // 实例化颜色数据

  // WJS 的 JS 钩子，可用于添加插件、扩展功能
  wjsHooks : hooks,

  // 初始化
  reset: canvas => {
    
    // 全局变量
    W.canvas = canvas;
    W.objs = 0;
    W.current = {};
    W.next = {};
    W.textures = {};
    W.viewLimit = 5000;   // 视野
    W.gl = canvas.getContext('webgl2');
    W.gl.blendFunc(770 , 771);
    W.gl.activeTexture(33984);
    W.program = W.gl.createProgram();
    W.gl.enable(2884);  // 隐藏不可见面
    W.instanceColorBuffers = {};  // 初始化颜色实例化数据
    W.lastFrame = 0;
    W.drawTime = 0;         // 初始化 绘制 时间
    W.lastReportTime = 0;   // 时间戳临时变量（用于确定一秒）

    var t;
    W.gl.shaderSource(
          // 默认顶点着色器
          t = W.gl.createShader(35633),
          `#version 300 es
          precision lowp float;                        
          in vec4 pos, col, uv, normal;                 // 普通模型的 位置、颜色、纹理坐标、法线...
          in mat4 instanceModelMatrix;                  // 实例化模型的 模型
          uniform mat4 pv, eye, m, im;                  // 矩阵：投影 * 视图、视线、模型、模型逆矩阵
          uniform vec4 bb;                              // 广告牌：bb = [w, h, 1.0, 0.0]
          out vec4 v_pos, v_col, v_uv, v_normal;
          uniform bool isInstanced;              // 是不是实例化绘制
          void main() {
            mat4 currentModelMatrix;             // 当前的模型矩阵
            if (isInstanced) {
              currentModelMatrix = instanceModelMatrix;
            } else {
              currentModelMatrix = m;
            }
            gl_Position = pv * (                        // 设置顶点位置：p * v * v_pos
              v_pos = bb.z > 0.                         
              ? currentModelMatrix[3] + eye * (pos * bb) // 广告牌
              : currentModelMatrix * pos               
            );
            v_col = col;
            v_uv = uv;
            v_normal = transpose(isInstanced ? inverse(currentModelMatrix) : im) * normal;  // 必要时使用实例矩阵
          }`
        );

        W.gl.compileShader(t);  // 编译
        W.gl.attachShader(W.program, t);
        
        // 默认片段着色器
        W.gl.shaderSource(
          t = W.gl.createShader(35632),
          `#version 300 es
          precision lowp float;
          in vec4 v_pos, v_col, v_uv, v_normal;
          uniform vec3 light;
          uniform vec2 tiling;
          uniform vec4 o;
          uniform sampler2D sampler;
          out vec4 c;
          void main() {
            c = mix(texture(sampler, v_uv.xy * tiling), v_col, o[3]);
            if(o[1] > 0.){
              c = vec4(
                c.rgb * (max(0., dot(light, -normalize(
                  o[0] > 0.
                  ? vec3(v_normal.xyz)
                  : cross(dFdx(v_pos.xyz), dFdy(v_pos.xyz))
                )))
                + o[2]),
                c.a
              );
            }
          }`
        );
        
        W.gl.compileShader(t); 
        W.gl.attachShader(W.program, t);
        W.gl.linkProgram(W.program);
        W.gl.useProgram(W.program);
        W.clearColor = c => W.gl.clearColor(...W.col(c));
        W.wjsHooks.emitSync('reset_ok', W);  // 钩子：'重置完成'
        W.uniformLocations = {  // 抽离常用的 uniformLocations 地址（用于提高性能）
          pv: W.gl.getUniformLocation(W.program, 'pv'),
          eye: W.gl.getUniformLocation(W.program, 'eye'),
          m: W.gl.getUniformLocation(W.program, 'm'),
          im: W.gl.getUniformLocation(W.program, 'im'),
          bb: W.gl.getUniformLocation(W.program, 'bb'),
          isInstanced: W.gl.getUniformLocation(W.program, 'isInstanced'),
          o: W.gl.getUniformLocation(W.program, 'o'),
          light: W.gl.getUniformLocation(W.program, 'light'),
          tiling: W.gl.getUniformLocation(W.program, 'tiling'),
          sampler: W.gl.getUniformLocation(W.program, 'sampler'),
          u_MvpMatrixFromLight: W.gl.getUniformLocation(W.program, 'u_MvpMatrixFromLight'), // 阴影相关
          u_ShadowMap: W.gl.getUniformLocation(W.program, 'u_ShadowMap'), // 阴影相关
        };
        W.attribLocations = {  // 常用的 attribLocations
          pos: W.gl.getAttribLocation(W.program, 'pos'),
          col: W.gl.getAttribLocation(W.program, 'col'),
          uv: W.gl.getAttribLocation(W.program, 'uv'),
          normal: W.gl.getAttribLocation(W.program, 'normal'),
          instanceModelMatrix: W.gl.getAttribLocation(W.program, 'instanceModelMatrix'),
        };
        W.clearColor("fff");
        W.gl.enable(2929);
        W.light({y: -1});
        W.camera({fov: 30});
        // W.wjsHooks.emitSync('start_draw', W);  // 钩子：'开始绘制'
        setTimeout(W.draw, 16);  // 开始绘制
  },

  // 设置对象的状态
  setState: (state, type, texture, i, normal = [], A, B, C, Ai, Bi, Ci, AB, BC) => {
        state.n ||= 'o' + W.objs++;
        if(state.size) state.w = state.h = state.d = state.size;
        if(state.t && state.t.width && !W.textures[state.t.id]){  // 纹理
          texture = W.gl.createTexture();
          W.gl.pixelStorei(37441 , true);
          W.gl.bindTexture(3553 , texture);
          W.gl.pixelStorei(37440 , 1);
          W.gl.texImage2D(3553 , 0, 6408 , 6408 , 5121 , state.t);
          W.gl.generateMipmap(3553 );
          W.textures[state.t.id] = texture;
        }
        if (state.instances && Array.isArray(state.instances)) {  // 实例坐标传入缓冲区
          state.isInstanced = true;
          state.numInstances = state.instances.length;
          const instanceMatrices = [];
          const instanceColors = [];
          for (const instanceProps of state.instances) {  // 实例顶点
            const m = new DOMMatrix();
            m.translateSelf(instanceProps.x + (state.x|0) | 0,
                            instanceProps.y + (state.y|0) | 0,
                            instanceProps.z + (state.z|0) | 0)
            .rotateSelf(instanceProps.rx || 0, instanceProps.ry || 0, instanceProps.rz || 0)
            .scaleSelf(instanceProps.w || 1, instanceProps.h || 1, instanceProps.d || 1);
            instanceMatrices.push(...m.toFloat32Array());
          }
          for (const p of state.instances) {  // 实例颜色
            instanceColors.push(...W.col(p.b || '888'));
          }
          const matrixData = new Float32Array(instanceMatrices);
          const buffer = W.gl.createBuffer();
          W.gl.bindBuffer(W.gl.ARRAY_BUFFER, buffer);
          W.gl.bufferData(W.gl.ARRAY_BUFFER, matrixData, W.gl.STATIC_DRAW);
          W.instanceMatrixBuffers[state.n] = buffer;
          W.gl.bindBuffer(W.gl.ARRAY_BUFFER, W.instanceColorBuffers[state.n] = W.gl.createBuffer());
          W.gl.bufferData(W.gl.ARRAY_BUFFER, new Float32Array(instanceColors), W.gl.STATIC_DRAW);
          state.instances = null;  // 清理，因为我们不再需要 JS 端的这个大数组
        } else {
          state.isInstanced = false;
        }
        if(state.fov){  // 根据 fov 计算【投影矩阵】
          var viewLimit = W.viewLimit;
          W.projection =
            new DOMMatrix([
              (1 / Math.tan(state.fov * Math.PI / 180)) / (W.canvas.width / W.canvas.height), 0, 0, 0, 
              0, (1 / Math.tan(state.fov * Math.PI / 180)), 0, 0, 
              0, 0, -(viewLimit + 0.1) / (viewLimit - 0.1), -1,
              0, 0, -(2 * viewLimit * 0.1) / (viewLimit - 0.1), 0
            ]);
        }
        state = {  // 保存和初始化对象的类型
          type,
          ...(W.current[state.n] = W.next[state.n] || {w:1, h:1, d:1, x:0, y:0, z:0, rx:0, ry:0, rz:0, b:'888', mode:4, mix: 0}),
          ...state,
          f:0
        };
        if(W.models[state.type]?.vertices && !W.models?.[state.type].verticesBuffer){  // 构建顶点
          W.gl.bindBuffer(34962 , W.models[state.type].verticesBuffer = W.gl.createBuffer());
          W.gl.bufferData(34962 , new Float32Array(W.models[state.type].vertices), 35044 );
          if(!W.models[state.type].normals && W.smooth) W.smooth(state);
          if(W.models[state.type].normals){
            W.gl.bindBuffer(34962 , W.models[state.type].normalsBuffer = W.gl.createBuffer());
            W.gl.bufferData(34962 , new Float32Array(W.models[state.type].normals.flat()), 35044 ); 
          }
        }
        if(W.models[state.type]?.uv && !W.models[state.type].uvBuffer){  // 构建 UV
          W.gl.bindBuffer(34962 , W.models[state.type].uvBuffer = W.gl.createBuffer());
          W.gl.bufferData(34962 , new Float32Array( W.models[state.type].uv), 35044 );
        }
        if(W.models[state.type]?.indices && !W.models[state.type].indicesBuffer){  // 构建索引
          W.gl.bindBuffer(34963 , W.models[state.type].indicesBuffer = W.gl.createBuffer());
          W.gl.bufferData(34963 , new Uint16Array(W.models[state.type].indices), 35044 );
        }
        if(!state.t){  // mix 默认为 1
          state.mix = 1;
        } else if(state.t && !state.mix){ // 有纹理，mix 为 0
          state.mix = 0;
        }
        W.next[state.n] = state;  // 下一帧的状态
  },

  // 绘制场景
  draw: (now, dt, v, i, transparent = []) => {
        const frameRenderStart = performance.now();  // 记录开始的时间
        dt = now - W.lastFrame;
        W.lastFrame = now;
        requestAnimationFrame(W.draw);
        if (W.debugFBO) {  // 如果打开，就播放 FBO 的录像，然后直接结束这一帧
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
          W.gl.uniformMatrix4fv( W.uniformLocations.pv,
                                    false,
                                    v.toFloat32Array());  // 处理好 pv ，传给着色器      
          W.wjsHooks.emitSync('shadow_draw', W);  // 绘制阴影插件，测试钩子
          W.gl.clear(16640);


          /* ------------ */
          for(i in W.next){  // 遍历渲染模型
            const object = W.next[i];
            if (!object.isInstanced && !object.t && W.col(object.b)[3] == 1) {
              W.render(object, dt);
            } else {
              transparent.push(object);  // 透明的先不渲染，存起来
            }
          }
          transparent.sort((a, b) => {return W.dist(b) - W.dist(a);});  // 感觉会损失性能，先注释掉
          W.gl.enable(3042 );

          W.gl.depthMask(1)
          for(i of transparent) {  // 遍历渲染透明对象（这几行好抽象，后续再优化）
            if (i.isInstanced) {
              W.render(i, dt);
            }
          }
          // W.gl.depthMask(0);  // 貌似没用、还产生 BUG
          for(i of transparent){
            if (!i.isInstanced) {
              W.render(i, dt);
            }
          }
          W.gl.depthMask(1);
          W.gl.disable(3042);
        

        /* --------------- */
        }
        W.gl.uniform3f(  // light 信息发往着色器
          W.uniformLocations.light,
          W.lerp('light','x'), W.lerp('light','y'), W.lerp('light','z')
        );
      
        if (now - W.lastReportTime >= 1000) {  // 每秒执行一次，用于测量
            W.drawTime = (performance.now() - frameRenderStart).toFixed(2) + 'ms';  // 每帧的绘制时间
            W.lastReportTime = now;
        }
  },
  
  // 渲染对象
  render: (object, dt, just_compute = ['camera','light','group'].includes(object.type), buffer) => {
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
            if(!just_compute){  // 可见物体
              W.gl.uniformMatrix4fv(  // 下一帧矩阵->着色器（m）
                W.uniformLocations.m,
                false,
                (W.next[object.n].M || W.next[object.n].m).toFloat32Array()
              );
              W.gl.uniformMatrix4fv(  // 下一帧逆矩阵->着色器（im）
                W.uniformLocations.im,
                false,
                (new DOMMatrix(W.next[object.n].M || W.next[object.n].m)).invertSelf().toFloat32Array()
              );
            }
        }
        if(!just_compute){  // 渲染可见物体
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
          if(W.models[object.type].indicesBuffer){  // 存在索引的绘制
            W.gl.bindBuffer(34963 , W.models[object.type].indicesBuffer);
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
  },
  
  // 辅助函数
  // -------
  
  // 在两个值之间插值
  lerp: (item, property) => 
    W.next[item]?.a
    ? W.current[item][property] + (W.next[item][property] -  W.current[item][property]) * (W.next[item].f / W.next[item].a)
    : W.next[item][property],
  
  // 过渡一个项目
  animation: (item, m = new DOMMatrix) =>
    W.next[item]
    ? m
      .translateSelf(W.lerp(item, 'x'), W.lerp(item, 'y'), W.lerp(item, 'z'))
      .rotateSelf(W.lerp(item, 'rx'),W.lerp(item, 'ry'),W.lerp(item, 'rz'))
      .scaleSelf(W.lerp(item, 'w'),W.lerp(item, 'h'),W.lerp(item, 'd'))
    : m,
    
  // 计算两个对象之间的距离平方（用于排序透明项目）
  dist: (a, b = W.next.camera) => a?.m && b?.m ? (b.m.m41 - a.m.m41)**2 + (b.m.m42 - a.m.m42)**2 + (b.m.m43 - a.m.m43)**2 : 0,
  
  // 设置环境光级别（0到1）
  ambient: a => W.ambientLight = a,
  
  // 将rgb/rgba十六进制字符串转换为vec4
  col: c => [...c.replace("#","").match(c.length < 5 ? /./g : /../g).map(a => ('0x' + a) / (c.length < 5 ? 15 : 255)), 1], // rgb / rgba / rrggbb / rrggbbaa
  
  // 添加新的3D模型
  add: (name, objects) => {
    W.models[name] = objects;
    if(objects.normals){ W.models[name].customNormals = 1 }
    W[name] = settings => W.setState(settings, name);
  },

  // 根据新的 canvas 大小重置画面
  resetView : () => {
    W.gl.viewport(0, 0, W.gl.canvas.width, W.gl.canvas.height);
    W.setState({ n: 'camera', fov: W.next.camera.fov });
  },
  
  // 内置对象
  // ----------------
  group: t => W.setState(t, 'group'),
  move: (t, delay) => setTimeout(()=>{ W.setState(t) }, delay || 1),
  delete: (t, delay) => setTimeout(()=>{ delete W.next[t] }, delay || 1),
  camera: (t, delay) => setTimeout(()=>{ W.setState(t, t.n = 'camera') }, delay || 1),
  light: (t, delay) => delay ? setTimeout(()=>{ W.setState(t, t.n = 'light') }, delay) : W.setState(t, t.n = 'light'),
};

// 平滑法线计算插件（可选）
// =============================================
W.smooth = (state, dict = {}, vertices = [], iterate, iterateSwitch, i, j, A, B, C, Ai, Bi, Ci, normal) => {
  W.models[state.type].normals = [];
  for(i = 0; i < W.models[state.type].vertices.length; i+=3){vertices.push(W.models[state.type].vertices.slice(i, i+3))}
  if(iterate = W.models[state.type].indices) iterateSwitch = 1;
  else iterate = vertices, iterateSwitch = 0;
  for(i = 0; i < iterate.length * 2; i+=3){
    j = i % iterate.length;
    A = vertices[Ai = iterateSwitch ? W.models[state.type].indices[j] : j];
    B = vertices[Bi = iterateSwitch ? W.models[state.type].indices[j+1] : j+1];
    C = vertices[Ci = iterateSwitch ? W.models[state.type].indices[j+2] : j+2];
    var AB = [B[0] - A[0], B[1] - A[1], B[2] - A[2]];
    var BC = [C[0] - B[0], C[1] - B[1], C[2] - B[2]];
    normal = i > j ? [0,0,0] : [AB[1] * BC[2] - AB[2] * BC[1], AB[2] * BC[0] - AB[0] * BC[2], AB[0] * BC[1] - AB[1] * BC[0]];
    dict[A[0]+"_"+A[1]+"_"+A[2]] ||= [0,0,0];
    dict[B[0]+"_"+B[1]+"_"+B[2]] ||= [0,0,0];
    dict[C[0]+"_"+C[1]+"_"+C[2]] ||= [0,0,0];
    W.models[state.type].normals[Ai] = dict[A[0]+"_"+A[1]+"_"+A[2]] = dict[A[0]+"_"+A[1]+"_"+A[2]].map((a,i) => a + normal[i]);
    W.models[state.type].normals[Bi] = dict[B[0]+"_"+B[1]+"_"+B[2]] = dict[B[0]+"_"+B[1]+"_"+B[2]].map((a,i) => a + normal[i]);
    W.models[state.type].normals[Ci] = dict[C[0]+"_"+C[1]+"_"+C[2]] = dict[C[0]+"_"+C[1]+"_"+C[2]].map((a,i) => a + normal[i]);
  }
}


// 3D模型
// ========

// 每个模型都有：
// - 一个顶点数组 [x, y, z, x, y, z...]
// - 一个uv数组 [u, v, u, v...]（可选。允许纹理贴图...如果不存在：则只使用RGBA颜色）
// - 一个索引数组（可选，启用drawElements渲染...如果不存在：则使用drawArrays）
// - 一个法线数组 [nx, ny, nz, nx, ny, nz...]（可选...如果不存在：框架在需要时计算硬/平滑法线）
// 当需要时，顶点、uv、索引缓冲区会自动构建
// 所有模型都是可选的，你可以移除不需要的模型以节省空间
// 可以从相同模型添加自定义模型，OBJ导入器可在 https://xem.github.io/WebGLFramework/obj2js/ 获取

// 平面/广告牌
//
//  v1------v0
//  |       |
//  |   x   |
//  |       |
//  v2------v3

W.add("plane", {
  vertices: [
    .5, .5, 0,    -.5, .5, 0,   -.5,-.5, 0,
    .5, .5, 0,    -.5,-.5, 0,    .5,-.5, 0
  ],
  
  uv: [
    1, 1,     0, 1,    0, 0,
    1, 1,     0, 0,    1, 0
  ],
});
W.add("billboard", W.models.plane);

// Cube
//
//    v6----- v5
//   /|      /|
//  v1------v0|
//  | |  x  | |
//  | |v7---|-|v4
//  |/      |/
//  v2------v3

W.add("cube", {
  vertices: [
    .5, .5, .5,  -.5, .5, .5,  -.5,-.5, .5, // front
    .5, .5, .5,  -.5,-.5, .5,   .5,-.5, .5,
    .5, .5,-.5,   .5, .5, .5,   .5,-.5, .5, // right
    .5, .5,-.5,   .5,-.5, .5,   .5,-.5,-.5,
    .5, .5,-.5,  -.5, .5,-.5,  -.5, .5, .5, // up
    .5, .5,-.5,  -.5, .5, .5,   .5, .5, .5,
   -.5, .5, .5,  -.5, .5,-.5,  -.5,-.5,-.5, // left
   -.5, .5, .5,  -.5,-.5,-.5,  -.5,-.5, .5,
   -.5, .5,-.5,   .5, .5,-.5,   .5,-.5,-.5, // back
   -.5, .5,-.5,   .5,-.5,-.5,  -.5,-.5,-.5,
    .5,-.5, .5,  -.5,-.5, .5,  -.5,-.5,-.5, // down
    .5,-.5, .5,  -.5,-.5,-.5,   .5,-.5,-.5
  ],
  uv: [
    1, 1,   0, 1,   0, 0, // front
    1, 1,   0, 0,   1, 0,            
    1, 1,   0, 1,   0, 0, // right
    1, 1,   0, 0,   1, 0, 
    1, 1,   0, 1,   0, 0, // up
    1, 1,   0, 0,   1, 0,
    1, 1,   0, 1,   0, 0, // left
    1, 1,   0, 0,   1, 0,
    1, 1,   0, 1,   0, 0, // back
    1, 1,   0, 0,   1, 0,
    1, 1,   0, 1,   0, 0, // down
    1, 1,   0, 0,   1, 0
  ]
});
W.cube = settings => W.setState(settings, 'cube');

// Pyramid
//
//      ^
//     /\\
//    // \ \
//   /+-x-\-+
//  //     \/
//  +------+

W.add("pyramid", {
  vertices: [
    -.5,-.5, .5,   .5,-.5, .5,    0, .5,  0,  // Front
     .5,-.5, .5,   .5,-.5,-.5,    0, .5,  0,  // Right
     .5,-.5,-.5,  -.5,-.5,-.5,    0, .5,  0,  // Back
    -.5,-.5,-.5,  -.5,-.5, .5,    0, .5,  0,  // Left
     .5,-.5, .5,  -.5,-.5, .5,  -.5,-.5,-.5, // down
     .5,-.5, .5,  -.5,-.5,-.5,   .5,-.5,-.5
  ],
  uv: [
    0, 0,   1, 0,  .5, 1,  // Front
    0, 0,   1, 0,  .5, 1,  // Right
    0, 0,   1, 0,  .5, 1,  // Back
    0, 0,   1, 0,  .5, 1,  // Left
    1, 1,   0, 1,   0, 0,  // down
    1, 1,   0, 0,   1, 0
  ]
});

// Sphere
//
//          =   =
//       =         =
//      =           =
//     =      x      =
//      =           =
//       =         =
//          =   =

((i, ai, j, aj, p1, p2, vertices = [], indices = [], uv = [], precision = 20) => {
  for(j = 0; j <= precision; j++){
    aj = j * Math.PI / precision;
    for(i = 0; i <= precision; i++){
      ai = i * 2 * Math.PI / precision;
      vertices.push(+(Math.sin(ai) * Math.sin(aj)/2).toFixed(6), +(Math.cos(aj)/2).toFixed(6), +(Math.cos(ai) * Math.sin(aj)/2).toFixed(6));
      uv.push((Math.sin((i/precision))) * 3.5, -Math.sin(j/precision))
      if(i < precision && j < precision){
        indices.push(p1 = j * (precision + 1) + i, p2 = p1 + (precision + 1), (p1 + 1), (p1 + 1), p2, (p2 + 1));
      }
    }
  }
  W.add("sphere", {vertices, uv, indices});
})();

export default W;
