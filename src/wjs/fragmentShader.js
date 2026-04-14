// 片段着色器
export default `#version 300 es
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
}
`;
