const cube = {
  vertices: [
    .5, .5, .5,  -.5, .5, .5,  -.5,-.5, .5,
    .5, .5, .5,  -.5,-.5, .5,   .5,-.5, .5,
    .5, .5,-.5,   .5, .5, .5,   .5,-.5, .5,
    .5, .5,-.5,   .5,-.5, .5,   .5,-.5,-.5,
    .5, .5,-.5,  -.5, .5,-.5,  -.5, .5, .5,
    .5, .5,-.5,  -.5, .5, .5,   .5, .5, .5,
   -.5, .5, .5,  -.5, .5,-.5,  -.5,-.5,-.5,
   -.5, .5, .5,  -.5,-.5,-.5,  -.5,-.5, .5,
   -.5, .5,-.5,   .5, .5,-.5,   .5,-.5,-.5,
   -.5, .5,-.5,   .5,-.5,-.5,  -.5,-.5,-.5,
    .5,-.5, .5,  -.5,-.5, .5,  -.5,-.5,-.5,
    .5,-.5, .5,  -.5,-.5,-.5,   .5,-.5,-.5
  ],
  uv: Array(12).fill([1,1,0,1,0,0,1,1,0,0,1,0]).flat()
};


// 偏移列表：三个立方体
const positions = [
  [0, 0, 0],
  [1, 0, 0],
  [0, 0, 1]
];

function mergeCubes(cube, positions) {
  const vertices = [];
  const uvs = [];

  for (const [dx, dy, dz] of positions) {
    // 复制顶点并加上偏移
    for (let i = 0; i < cube.vertices.length; i += 3) {
      vertices.push(
        cube.vertices[i] + dx,
        cube.vertices[i + 1] + dy,
        cube.vertices[i + 2] + dz
      );
    }
    // UV 直接附加
    uvs.push(...cube.uv);
  }

  return { vertices, uv: uvs };
}

const merged = mergeCubes(cube, positions);



modDataDIY = merged;