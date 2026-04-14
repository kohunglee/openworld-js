// 顶点着色器
export default `#version 300 es
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
}
`;
