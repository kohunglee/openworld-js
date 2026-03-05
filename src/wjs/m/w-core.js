// WebGL框架 - 核心模块
// ===============
import hooks from '../common/hooks.js';  // 引入 JS 钩子

export default function initWCore(W) {
  // 一些容器
  W.models = {};
  W.instanceMatrixBuffers = {}; // 实例化对象的矩阵数据
  W.instanceColorBuffers = {};  // 实例化颜色数据

  // WJS 的 JS 钩子，可用于添加插件、扩展功能
  W.wjsHooks = hooks;

  // 初始化
  W.reset = canvas => {

    // 全局变量
    W.canvas = canvas;
    W.objs = 0;
    W.current = {};
    W.next = {};
    W.textures = {};
    W.viewLimit = 50000;   // 视野
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
            vec2 final_uv = v_uv.xy;  //+ 新增纹理面修正逻辑，修复纹理面翻转问题
            if (!gl_FrontFacing) {
              final_uv.x = 1.0 - final_uv.x;
            }
            c = mix(texture(sampler, final_uv * tiling), v_col, o[3]);
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
        setTimeout(W.draw, 16);  // 开始绘制
  };

  // 面剔除(默认启用)
  W.cullface = true;
}
