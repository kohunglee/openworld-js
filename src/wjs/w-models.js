// WebGL框架 - 3D模型模块
// ===============

export default function initWModels(W) {
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
  };

  // 3D模型
  // ========

  // 平面/广告牌
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

  W.cubeData = {
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
    uv: Array(12).fill([1,1,0,1,0,0,1,1,0,0,1,0]).flat(),
  };

  // 立方体
  W.add("cube", W.cubeData);
  W.cube = settings => W.setState(settings, 'cube');

  // 金字塔
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

  // 球形
  ((i, ai, j, aj, p1, p2, vertices = [], indices = [], uv = [], precision = 20) => {
    for(j = 0; j <= precision; j++){
      aj = j * Math.PI / precision;
      for(i = 0; i <= precision; i++){
        ai = i * 2 * Math.PI / precision;
        vertices.push(+(Math.sin(ai) * Math.sin(aj)/2).toFixed(6), +(Math.cos(aj)/2).toFixed(6), +(Math.cos(ai) * Math.sin(aj)/2).toFixed(6));
        uv.push(i / precision, 1 - j / precision);
        if(i < precision && j < precision){
          indices.push(p1 = j * (precision + 1) + i, p2 = p1 + (precision + 1), (p1 + 1), (p1 + 1), p2, (p2 + 1));
        }
      }
    }
    W.add("sphere", {vertices, uv, indices});
  })();
}
