/**
 * texture 2d array 插件（目前作废，后续再研究.....）
 * ========
 * 功能是能实现很多的图片，在实例化的单个元素里展示出来
 */

/**
 * texture 2d array 插件
 * 让每个实例拥有独立纹理（sampler2DArray 方案）
 */
export default function (ccgxkObj) {
    const W = ccgxkObj.W;

    // ── 1. reset_ok：替换着色器 ──
    W.wjsHooks.on('reset_ok', (w) => {
        const g = w.gl;

        const VS = `#version 300 es
        precision lowp float;
        in vec4 pos, col, uv, normal;
        in mat4 instanceModelMatrix;
        in float instanceTexIndex;
        uniform mat4 pv, eye, m, im;
        uniform vec4 bb;
        uniform bool isInstanced;
        out vec4 v_pos, v_col, v_uv, v_normal;
        out float v_texIndex;
        void main() {
            mat4 mm = isInstanced ? instanceModelMatrix : m;
            gl_Position = pv * (
                v_pos = bb.z > 0.
                    ? mm[3] + eye * (pos * bb)
                    : mm * pos
            );
            v_col = col; v_uv = uv;
            v_normal = transpose(isInstanced ? inverse(mm) : im) * normal;
            v_texIndex = instanceTexIndex;
        }`;

        const FS = `#version 300 es
        precision lowp float;
        in vec4 v_pos, v_col, v_uv, v_normal;
        in float v_texIndex;
        uniform vec3 light;
        uniform vec2 tiling;
        uniform vec4 o;
        uniform sampler2D sampler;
        uniform highp sampler2DArray u_texArray;
        uniform bool u_useTexArray;
        out vec4 c;
        void main() {
            vec2 fuv = v_uv.xy;
            if (!gl_FrontFacing) fuv.x = 1.0 - fuv.x;
            if (u_useTexArray) {
                c = mix(texture(u_texArray, vec3(fuv * tiling, floor(v_texIndex + 0.5))), v_col, o[3]);
            } else {
                c = mix(texture(sampler, fuv * tiling), v_col, o[3]);
            }
            if (o[1] > 0.) {
                c = vec4(c.rgb * (max(0., dot(light, -normalize(
                    o[0] > 0. ? vec3(v_normal.xyz) : cross(dFdx(v_pos.xyz), dFdy(v_pos.xyz))
                ))) + o[2]), c.a);
            }
        }`;

        function compile(type, src) {
            const s = g.createShader(type);
            g.shaderSource(s, src);
            g.compileShader(s);
            if (!g.getShaderParameter(s, g.COMPILE_STATUS))
                console.error('shader error:', g.getShaderInfoLog(s));
            return s;
        }

        const prog = g.createProgram();
        g.attachShader(prog, compile(g.VERTEX_SHADER, VS));
        g.attachShader(prog, compile(g.FRAGMENT_SHADER, FS));
        g.linkProgram(prog);

        if (!g.getProgramParameter(prog, g.LINK_STATUS)) {
            console.error('link error:', g.getProgramInfoLog(prog));
            return;
        }

        g.useProgram(prog);
        w.program = prog;

        // 同步原有 locations
        for (const k in w.uniformLocations)
            w.uniformLocations[k] = g.getUniformLocation(prog, k);
        for (const k in w.attribLocations)
            w.attribLocations[k] = g.getAttribLocation(prog, k);

        // 新增 locations
        w.uniformLocations.u_texArray    = g.getUniformLocation(prog, 'u_texArray');
        w.uniformLocations.u_useTexArray = g.getUniformLocation(prog, 'u_useTexArray');
        w.attribLocations.instanceTexIndex = g.getAttribLocation(prog, 'instanceTexIndex');

        console.log('tex2darr 着色器替换成功');
        console.log('u_texArray:', w.uniformLocations.u_texArray);
        console.log('u_useTexArray:', w.uniformLocations.u_useTexArray);
        console.log('instanceTexIndex:', w.attribLocations.instanceTexIndex);
    });

    // ── 2. after_setState：上传纹理数组 + 建 texIndex buffer ──
    W.wjsHooks.on('after_setState', (state, w) => {
        if (!state.isInstanced || !state.texArray) return;
        const g = w.gl;
        const { images, width, height } = state.texArray;

        const tex = g.createTexture();
        g.bindTexture(g.TEXTURE_2D_ARRAY, tex);
        g.texStorage3D(g.TEXTURE_2D_ARRAY, 1, g.RGBA8, width, height, images.length);
        images.forEach((img, i) => {
            g.texSubImage3D(g.TEXTURE_2D_ARRAY, 0, 0, 0, i, width, height, 1, g.RGBA, g.UNSIGNED_BYTE, img);
        });
        g.texParameteri(g.TEXTURE_2D_ARRAY, g.TEXTURE_MIN_FILTER, g.LINEAR);
        g.texParameteri(g.TEXTURE_2D_ARRAY, g.TEXTURE_MAG_FILTER, g.LINEAR);
        g.texParameteri(g.TEXTURE_2D_ARRAY, g.TEXTURE_WRAP_S, g.CLAMP_TO_EDGE);
        g.texParameteri(g.TEXTURE_2D_ARRAY, g.TEXTURE_WRAP_T, g.CLAMP_TO_EDGE);

        w.instanceTexArrays    = w.instanceTexArrays    || {};
        w.instanceTexIndexBufs = w.instanceTexIndexBufs || {};
        w.instanceTexArrays[state.n] = tex;

        const buf = g.createBuffer();
        g.bindBuffer(g.ARRAY_BUFFER, buf);
        g.bufferData(g.ARRAY_BUFFER,
            new Float32Array(state.instances.map(p => p.texIndex ?? 0)),
            g.DYNAMIC_DRAW
        );
        w.instanceTexIndexBufs[state.n] = buf;
    });

    // ── 3. before_draw：绑定纹理数组 + texIndex attribute ──
    W.wjsHooks.on('before_draw', (object, w) => {
        const g = w.gl;
        const hasTex = w.instanceTexArrays?.[object.n];

        g.uniform1i(w.uniformLocations.u_useTexArray, hasTex ? 1 : 0);
        if (!hasTex) return;

        g.activeTexture(g.TEXTURE1);
        g.bindTexture(g.TEXTURE_2D_ARRAY, w.instanceTexArrays[object.n]);
        g.uniform1i(w.uniformLocations.u_texArray, 1);
        g.activeTexture(g.TEXTURE0);

        const loc = w.attribLocations.instanceTexIndex;
        if (loc >= 0 && w.instanceTexIndexBufs[object.n]) {
            g.enableVertexAttribArray(loc);
            g.bindBuffer(g.ARRAY_BUFFER, w.instanceTexIndexBufs[object.n]);
            g.vertexAttribPointer(loc, 1, g.FLOAT, false, 0, 0);
            g.vertexAttribDivisor(loc, 1);
        }
    });
}